#!/usr/bin/env bash
# ============================================================
# release-backend.sh —— 后端一键发布（参考实现 · 按项目替换配置区）
#
# 发布链机制（挂载式部署）：
#   目标机 <DEPLOY_ROOT>/releases/<YYYYMMDD-HHMMSS>-<short-sha>/  本节发布目录
#   目标机 <DEPLOY_ROOT>/current -> releases/<...>                现役软链（原子切换）
#   回滚 = rollback.sh 切回旧链节；健康失败自动切回上一版；老产物超期仅提示（--prune 才删）。
#
# 流水线：打包 → 上传到新 release 目录 → 迁移 → 原子切 current → recreate → 健康检查(失败自动回滚)
#
# 用法：./release-backend.sh [--prune]
#   --prune  清理超期（>RELEASE_RETENTION_DAYS）的历史产物（默认只提示不删）
# 环境变量：
#   DEPLOY_HOST  remote-shell 别名（必填）；SKIP_GIT_CHECK=1 跳过未提交拦截
#   RELEASE_RETENTION_DAYS  过期阈值天数（默认 30）
# ============================================================
set -euo pipefail

# ---------- 配置区（按项目替换）----------
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/data/<app>}"          # 目标机部署根（含 releases/ 与 current）
BACKEND_DIR="backend"
# 目标机上 compose 文件与部署配置目录（绝对路径；不由 DEPLOY_ROOT 拼接推导）
REMOTE_DEPLOY_DIR="${REMOTE_DEPLOY_DIR:-/opt/<app>/docs/L4/deployment/<env>}"
REMOTE_COMPOSE="${REMOTE_COMPOSE:-$REMOTE_DEPLOY_DIR/docker-compose.<env>.yml}"
SERVICE="backend"
HEALTH_URL="${HEALTH_URL:-http://localhost:8000/healthz}"
IMAGE="${IMAGE:-python:3.11-slim}"
PIP_MIRROR="${PIP_MIRROR:-https://pypi.tuna.tsinghua.edu.cn/simple}"
PLATFORM="${PLATFORM:-linux/amd64}"
RETAIN_DAYS="${RELEASE_RETENTION_DAYS:-30}"
# ----------------------------------------

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LIB="$REPO/docs/L4/deployment/lib/release-common.sh"
[ -f "$LIB" ] && . "$LIB" || { echo "!! 缺少 $LIB" >&2; exit 1; }

DO_PRUNE=0
[ "${1:-}" = "--prune" ] && DO_PRUNE=1

require_config DEPLOY_HOST
require_config DEPLOY_ROOT
require_target_mode
command -v remote-shell >/dev/null 2>&1 || { echo "!! 缺少 remote-shell CLI" >&2; exit 1; }
if [ "${SKIP_GIT_CHECK:-0}" != "1" ] && [ -n "$(git -C "$REPO" status --porcelain 2>/dev/null)" ]; then
    echo "!! 检测到未提交改动——BUILD_COMMIT 将不含这些改动，请先 commit（或 SKIP_GIT_CHECK=1）" >&2
    exit 1
fi

COMMIT="$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo unknown)"
TIME="$(date +%Y%m%d-%H%M%S)"
DIRNAME="$(release_dirname "$COMMIT" "$TIME")"
PACK="/tmp/backend-app.tar.gz"
LOCK="/tmp/backend-reqs.lock"
DIST_BUILD="${DEPLOY_ROOT}-dist-build"
DIST="${DEPLOY_ROOT}-dist"

echo "==> 0/6 过期检查（历史产物，豁免现役 current）"
check_stale_releases "$DEPLOY_HOST" "$DEPLOY_ROOT" "$RETAIN_DAYS"
[ "$DO_PRUNE" = "1" ] && prune_releases "$DEPLOY_HOST" "$DEPLOY_ROOT" "$RETAIN_DAYS"

echo "==> 1/6 打包后端代码（不可变制品）"
tar --exclude='._*' --exclude='.venv' --exclude='__pycache__' \
    --exclude='.ruff_cache' --exclude='.pytest_cache' --exclude='*.egg-info' \
    --exclude='.DS_Store' -czf "$PACK" -C "$REPO/$BACKEND_DIR" .
SHA256="$(shasum -a 256 "$PACK" | awk '{print $1}')"
echo "    代码包：$(ls -lh "$PACK" | awk '{print $5}')  sha256=${SHA256:0:12}…"

echo "==> 2/6 依赖锁版本 + 目标机 Docker($PLATFORM) 编译依赖产物"
uv pip compile "$REPO/$BACKEND_DIR/pyproject.toml" -o "$LOCK" >/dev/null 2>&1 || true
[ -s "$LOCK" ] || { echo "!! 依赖锁版本失败（$LOCK 无效）" >&2; exit 1; }
remote-shell upload "$DEPLOY_HOST" "$LOCK" "${DEPLOY_ROOT}-reqs.lock" >/dev/null 2>&1
remote-shell "$DEPLOY_HOST" "rm -rf $DIST_BUILD && mkdir -p $DIST_BUILD && docker run --rm -v ${DEPLOY_ROOT}-reqs.lock:/reqs.txt:ro -v $DIST_BUILD:/out $IMAGE pip install --target /out -r /reqs.txt -i '$PIP_MIRROR' >/dev/null 2>&1 || { echo '依赖产物编译失败'; exit 1; }"
remote-shell "$DEPLOY_HOST" "mkdir -p $DIST && rm -rf $DIST/* 2>/dev/null; tar -czf ${DEPLOY_ROOT}-dist.tar.gz -C $DIST_BUILD . && tar xzf ${DEPLOY_ROOT}-dist.tar.gz -C $DIST && rm -f ${DEPLOY_ROOT}-dist.tar.gz ${DEPLOY_ROOT}-reqs.lock && rm -rf $DIST_BUILD"
echo "    依赖产物已编译并解压至 $DIST"

echo "==> 3/6 上传到新 release 目录（$DIRNAME）"
ensure_release_root "$DEPLOY_HOST" "$DEPLOY_ROOT"
create_release_dir "$DEPLOY_HOST" "$DEPLOY_ROOT" "$DIRNAME" >/dev/null
remote-shell upload "$DEPLOY_HOST" "$PACK" "${DEPLOY_ROOT}-app.tar.gz" >/dev/null 2>&1
remote-shell "$DEPLOY_HOST" "mkdir -p '$DEPLOY_ROOT/releases/$DIRNAME/backend' && tar xzf ${DEPLOY_ROOT}-app.tar.gz -C '$DEPLOY_ROOT/releases/$DIRNAME/backend' && rm -f ${DEPLOY_ROOT}-app.tar.gz && find '$DEPLOY_ROOT/releases/$DIRNAME' -name '._*' -delete"
# 写 build manifest（制品不可变标识）
remote-shell "$DEPLOY_HOST" "printf 'commit=%s\ntime=%s\nsha256=%s\nservice=%s\n' '$COMMIT' '$TIME' '$SHA256' '$SERVICE' > '$DEPLOY_ROOT/releases/$DIRNAME/manifest'"

echo "==> 4/6 数据变更（迁移与发布解耦，可独立执行；幂等）"
run_migration "$DEPLOY_HOST" "$REMOTE_COMPOSE" "$SERVICE" "python scripts/init_db.py"

echo "==> 5/6 原子切换 current → $DIRNAME，recreate"
PREV="$(current_release "$DEPLOY_HOST" "$DEPLOY_ROOT")"
remote-shell "$DEPLOY_HOST" "printf 'BUILD_COMMIT=%s\nBUILD_TIME=%s\n' '$COMMIT' '$TIME' > '$REMOTE_DEPLOY_DIR/.env'"
switch_current "$DEPLOY_HOST" "$DEPLOY_ROOT" "$DIRNAME"
deploy_recreate "$DEPLOY_HOST" "$REMOTE_COMPOSE" "$SERVICE"

echo "==> 6/6 健康检查（失败自动回滚到上一版）"
if wait_healthy "$DEPLOY_HOST" "$HEALTH_URL"; then
    echo "    健康检查通过；版本 $DIRNAME"
    audit_log "$DEPLOY_HOST" "$DEPLOY_ROOT" "release" "$SERVICE" "$DIRNAME" "success"
else
    echo "!! 健康检查失败，自动回滚" >&2
    if [ -n "$PREV" ]; then
        switch_current "$DEPLOY_HOST" "$DEPLOY_ROOT" "$PREV"
        deploy_recreate "$DEPLOY_HOST" "$REMOTE_COMPOSE" "$SERVICE"
        wait_healthy "$DEPLOY_HOST" "$HEALTH_URL" && echo "    已回滚至 $PREV"
        audit_log "$DEPLOY_HOST" "$DEPLOY_ROOT" "release" "$SERVICE" "$DIRNAME" "failed→rollback:$PREV"
    else
        audit_log "$DEPLOY_HOST" "$DEPLOY_ROOT" "release" "$SERVICE" "$DIRNAME" "failed(no-prev)"
    fi
    exit 1
fi
