#!/usr/bin/env bash
# ============================================================
# release-common.sh —— 发布链共享函数库（参考实现）
#
# 被 release-backend.sh / release-frontend.sh / rollback.sh source 引入。
# 提供：配置校验 / 发布链目录 / current 软链原子切换 / 过期检查 / 审计日志。
#
# 发布链机制（挂载式部署）：
#   目标机 <DEPLOY_ROOT>/releases/<YYYYMMDD-HHMMSS>-<short-sha>/  每个发布一个目录（时间有序）
#   目标机 <DEPLOY_ROOT>/current -> releases/<...>                软链指向现役版本（原子切换）
#   回滚 = 把 current 切回上一个链节；老产物不自动删，超期仅提示（--prune 才删）。
# ============================================================

# ---------- 配置校验（占位符未替换即 fail-fast）----------
# $1 = 环境变量名；值未设或仍含 '<' 占位符即报错退出
require_config() {
    local name="$1" val="${!1:-}"
    if [ -z "$val" ] || [[ "$val" == *"<"* ]]; then
        echo "!! $name 未设置（或仍为占位符）——export $name=<值> 或写入部署环境配置" >&2
        exit 1
    fi
}

# ---------- 目标机执行后端校验与分派 ----------
# TARGET_MODE 描述目标部署机形态（由部署环境决定，非每次发布临时选择）：
#   compose = 目标机是 VM/物理机，有 Docker daemon，用 docker compose 起容器（已实现）
#   native  = 目标机本身是容器（无 Docker daemon），上传 release 包后由进程管理器直接启动（预留，未实现）
# 当前仅实现 compose；native 值 fail-fast 提示待实现，避免误套 compose 命令。
TARGET_MODE="${TARGET_MODE:-compose}"

require_target_mode() {
    case "${TARGET_MODE:-compose}" in
        compose) : ;;
        native)
            echo "!! TARGET_MODE=native（目标机是容器、无 Docker daemon）尚未实现——见 references/release-mechanics.md §4" >&2
            echo "   需补：本地编译依赖产物 + 目标机进程管理器重启命令 + 裸进程迁移命令" >&2
            exit 1 ;;
        *)
            echo "!! TARGET_MODE 取值非法：$TARGET_MODE（仅支持 compose）" >&2
            exit 1 ;;
    esac
}

# ---------- 执行后端封装（未来加 native 分支的唯一入口）----------
# 以下三个函数把「起服务 / 跑迁移 / 回滚起服务」收敛为单一入口；
# 当前只有 compose 分支；实现 native 时在此按 TARGET_MODE 分派，无需改调用点。
# 参数：$1 = host；$2 = COMPOSE_FILE（目标机路径）；$3 = SERVICE
deploy_recreate() {
    local host="$1" compose="$2" service="$3"
    case "${TARGET_MODE:-compose}" in
        compose) remote-shell "$host" "docker compose -f '$compose' up -d --force-recreate --remove-orphans $service >/dev/null 2>&1" ;;
        *) require_target_mode ;;
    esac
}

# 参数：$1 = host；$2 = COMPOSE_FILE；$3 = SERVICE；$4 = 迁移命令（容器内执行，如 python scripts/init_db.py）
run_migration() {
    local host="$1" compose="$2" service="$3" cmd="$4"
    case "${TARGET_MODE:-compose}" in
        compose) remote-shell "$host" "docker compose -f '$compose' run --rm $service $cmd 2>&1 | tail -2" ;;
        *) require_target_mode ;;
    esac
}

# ---------- 生成发布目录名：<YYYYMMDD-HHMMSS>-<short-sha> ----------
release_dirname() {
    local commit="$1" time="$2"
    echo "${time}-${commit}"
}

# ---------- 目标机上确保发布链根目录存在 ----------
# $1 = remote-shell 别名；$2 = DEPLOY_ROOT
ensure_release_root() {
    remote-shell "$1" "mkdir -p '$2/releases'"
}

# ---------- 在目标机创建新 release 目录并返回其路径 ----------
# $1 = host；$2 = DEPLOY_ROOT；$3 = dirname
create_release_dir() {
    remote-shell "$1" "mkdir -p '$2/releases/$3'"
    echo "$2/releases/$3"
}

# ---------- 原子切换 current 软链到指定 release ----------
# 用 ln -sfn + mv 实现原子替换（mv 在同文件系统内原子）
# $1 = host；$2 = DEPLOY_ROOT；$3 = release dirname
switch_current() {
    remote-shell "$1" "cd '$2' && ln -sfn 'releases/$3' 'current.tmp' && mv -T 'current.tmp' 'current'"
}

# ---------- 读取 current 当前指向的 release 目录名（无则空）----------
# $1 = host；$2 = DEPLOY_ROOT
current_release() {
    remote-shell "$1" "readlink '$2/current' 2>/dev/null | sed 's#^releases/##'" 2>/dev/null || true
}

# ---------- 列出发布链中所有 release 目录名（时间升序）----------
# $1 = host；$2 = DEPLOY_ROOT
list_releases() {
    remote-shell "$1" "ls -1 '$2/releases' 2>/dev/null | sort" 2>/dev/null || true
}

# ---------- 由 release 目录名换算年龄（天）；无法解析返回空 ----------
# 目录名格式 <YYYYMMDD-HHMMSS>-<short-sha>；取前两段（8位日期-6位时间）。
# $1 = release 目录名
release_age_days() {
    local line="$1" ts epoch_now epoch_rel
    ts="$(echo "$line" | sed -E 's/^([0-9]{8}-[0-9]{6})-.*/\1/')"
    [ "$ts" = "$line" ] && return 0            # 格式不符，返回空
    epoch_now="$(date +%s)"
    epoch_rel="$(date -j -f '%Y%m%d-%H%M%S' "$ts" +%s 2>/dev/null || date -d "$(echo "$ts" | sed -E 's/(....)(..)(..)-(..)(..)(..)/\1-\2-\3 \4:\5:\6/')" +%s 2>/dev/null || echo 0)"
    [ "${epoch_rel:-0}" = "0" ] && return 0
    echo $(( (epoch_now - epoch_rel) / 86400 ))
}

# ---------- 过期检查：历史产物（非 current）中最老的若超阈值 → 提示 ----------
# 豁免 current：current 指向的现役版本永不判过期（它不是历史产物）。
# $1 = host；$2 = DEPLOY_ROOT；$3 = 阈值天数（默认 30）
check_stale_releases() {
    local host="$1" root="$2" days="${3:-30}"
    local cur line age oldest oldest_age=0
    cur="$(current_release "$host" "$root")"
    while IFS= read -r line; do
        [ -z "$line" ] && continue
        [ "$line" = "$cur" ] && continue          # 豁免现役版本
        age="$(release_age_days "$line")"
        [ -z "$age" ] && continue
        if [ "$age" -gt "$oldest_age" ]; then oldest_age="$age"; oldest="$line"; fi
    done <<< "$(list_releases "$host" "$root")"
    if [ -n "${oldest:-}" ] && [ "$oldest_age" -gt "$days" ]; then
        echo "提示：历史产物 '$oldest' 已存在 ${oldest_age} 天（> ${days} 天阈值），占用目标机磁盘。"
        echo "      如确认无需回滚到该版本，可用 --prune 清理，或手动删除 '$root/releases/$oldest'。"
    fi
}

# ---------- 清理过期历史产物（仅 --prune 时调用）----------
# 豁免 current；只删超出阈值的 release 目录。
# $1 = host；$2 = DEPLOY_ROOT；$3 = 阈值天数
prune_releases() {
    local host="$1" root="$2" days="${3:-30}"
    local cur line age
    cur="$(current_release "$host" "$root")"
    while IFS= read -r line; do
        [ -z "$line" ] && continue
        [ "$line" = "$cur" ] && continue
        age="$(release_age_days "$line")"
        [ -z "$age" ] && continue
        if [ "$age" -gt "$days" ]; then
            remote-shell "$host" "rm -rf '$root/releases/$line'"
            echo "    已清理过期产物：$line（${age} 天）"
        fi
    done <<< "$(list_releases "$host" "$root")"
}

# ---------- 审计日志：记录一次发布 ----------
# $1 = host；$2 = DEPLOY_ROOT；$3 = 动作(release/rollback)；$4 = service；$5 = release dirname；$6 = 结果
audit_log() {
    remote-shell "$1" "printf '%s | %s | %s | %s | %s\n' \"\$(date +%Y-%m-%dT%H:%M:%S)\" '$3' '$4' '$5' '$6' >> '$2/releases.log'"
}

# ---------- 健康检查（带重试）----------
# $1 = host；$2 = 健康 URL；$3 = 重试次数(默认 12)；$4 = 间隔秒(默认 5)
wait_healthy() {
    local host="$1" url="$2" retries="${3:-12}" interval="${4:-5}" i code
    for i in $(seq 1 "$retries"); do
        code="$(remote-shell "$host" "curl -s -o /dev/null -w '%{http_code}' '$url'" 2>/dev/null || echo 000)"
        if [ "$code" = "200" ]; then return 0; fi
        sleep "$interval"
    done
    return 1
}
