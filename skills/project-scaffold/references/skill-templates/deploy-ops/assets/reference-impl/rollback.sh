#!/usr/bin/env bash
# ============================================================
# rollback.sh —— 回滚到发布链中的指定版本（参考实现 · 按项目替换配置区）
#
# 发布链（时间有序）：<DEPLOY_ROOT>/releases/<YYYYMMDD-HHMMSS>-<short-sha>/
# 回滚 = 把 current 软链切回旧链节 + recreate；不删除任何产物。
#
# 用法：
#   ./rollback.sh                 # 列出发布链，交互提示选择
#   ./rollback.sh <dir>           # 回滚到指定 release 目录（如 20260912-140000-abc1234）
#   ./rollback.sh --prev          # 回滚到上一个版本（current 的前一个链节）
# 环境变量：DEPLOY_HOST（必填）
# ============================================================
set -euo pipefail

# ---------- 配置区（按项目替换）----------
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/data/<app>}"
# 目标机上 compose 文件与部署配置目录（绝对路径；不由 DEPLOY_ROOT 拼接推导）
REMOTE_DEPLOY_DIR="${REMOTE_DEPLOY_DIR:-/opt/<app>/docs/L4/deployment/<env>}"
REMOTE_COMPOSE="${REMOTE_COMPOSE:-$REMOTE_DEPLOY_DIR/docker-compose.<env>.yml}"
SERVICE="${SERVICE:-backend}"
HEALTH_URL="${HEALTH_URL:-http://localhost:8000/healthz}"
# ----------------------------------------

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LIB="$REPO/docs/L4/deployment/lib/release-common.sh"
[ -f "$LIB" ] && . "$LIB" || { echo "!! 缺少 $LIB" >&2; exit 1; }

require_config DEPLOY_HOST
require_config DEPLOY_ROOT
require_target_mode
command -v remote-shell >/dev/null 2>&1 || { echo "!! 缺少 remote-shell CLI" >&2; exit 1; }

CUR="$(current_release "$DEPLOY_HOST" "$DEPLOY_ROOT")"
ALL="$(list_releases "$DEPLOY_HOST" "$DEPLOY_ROOT")"

echo "==> 当前版本：${CUR:-<无>}"
echo "==> 发布链（新→旧）："
echo "$ALL" | tac | sed 's/^/    /'

TARGET="${1:-}"
if [ "$TARGET" = "--prev" ]; then
    TARGET="$(echo "$ALL" | awk -v cur="$CUR" 'BEGIN{hit=0} {if(hit){print;exit} if($0==cur)hit=1}')"
    [ -z "$TARGET" ] && { echo "!! 找不到 current 的前一个版本" >&2; exit 1; }
fi
if [ -z "$TARGET" ]; then
    echo "用法：./rollback.sh <目录名|--prev>（目录名见上方发布链）" >&2
    exit 1
fi
if [ "$TARGET" = "$CUR" ]; then
    echo "!! 目标版本即当前版本，无需回滚" >&2
    exit 1
fi
if ! echo "$ALL" | grep -qx "$TARGET"; then
    echo "!! 发布链中不存在版本：$TARGET" >&2
    exit 1
fi

echo "==> 回滚 $CUR → $TARGET"
switch_current "$DEPLOY_HOST" "$DEPLOY_ROOT" "$TARGET"
deploy_recreate "$DEPLOY_HOST" "$REMOTE_COMPOSE" "$SERVICE"
remote-shell "$DEPLOY_HOST" "docker compose -f '$REMOTE_COMPOSE' exec $SERVICE python -m alembic check >/dev/null 2>&1 || true"

if wait_healthy "$DEPLOY_HOST" "$HEALTH_URL"; then
    echo "    回滚完成，现役版本 $TARGET"
    audit_log "$DEPLOY_HOST" "$DEPLOY_ROOT" "rollback" "$SERVICE" "$TARGET" "success(from:$CUR)"
else
    echo "!! 回滚后健康检查失败，请人工介入" >&2
    audit_log "$DEPLOY_HOST" "$DEPLOY_ROOT" "rollback" "$SERVICE" "$TARGET" "failed(from:$CUR)"
    exit 1
fi
