#!/usr/bin/env bash
# ============================================================
# release-frontend.sh —— 前端一键发布（参考实现 · 按项目替换配置区）
#
# 发布链机制同后端：<DEPLOY_ROOT>/releases/<YYYYMMDD-HHMMSS>-<short-sha>/ + current 软链。
# 流水线：构建 dist → 上传到新 release → 原子切 current → recreate → 冒烟（失败自动回滚）
#
# 用法：./release-frontend.sh [--prune]
# 环境变量：DEPLOY_HOST（必填）；RELEASE_RETENTION_DAYS（默认 30）
# ============================================================
set -euo pipefail

# ---------- 配置区（按项目替换）----------
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/data/<app>}"
FRONTEND_DIR="frontend"
BUILD_CMD="${BUILD_CMD:-npm run build}"
# 目标机上 compose 文件与部署配置目录（绝对路径；不由 DEPLOY_ROOT 拼接推导）
REMOTE_DEPLOY_DIR="${REMOTE_DEPLOY_DIR:-/opt/<app>/docs/L4/deployment/<env>}"
REMOTE_COMPOSE="${REMOTE_COMPOSE:-$REMOTE_DEPLOY_DIR/docker-compose.<env>.yml}"
SERVICE="frontend"
SMOKE_URL="${SMOKE_URL:-http://localhost:8080/}"
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
    echo "!! 检测到未提交改动——请先 commit（或 SKIP_GIT_CHECK=1）" >&2
    exit 1
fi

COMMIT="$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo unknown)"
TIME="$(date +%Y%m%d-%H%M%S)"
DIRNAME="$(release_dirname "$COMMIT" "$TIME")"
PACK="/tmp/frontend-dist.tar.gz"

echo "==> 0/4 过期检查（历史产物，豁免现役 current）"
check_stale_releases "$DEPLOY_HOST" "$DEPLOY_ROOT" "$RETAIN_DAYS"
[ "$DO_PRUNE" = "1" ] && prune_releases "$DEPLOY_HOST" "$DEPLOY_ROOT" "$RETAIN_DAYS"

echo "==> 1/4 前端构建"
(cd "$REPO/$FRONTEND_DIR" && $BUILD_CMD >/dev/null 2>&1)
tar --exclude='._*' -czf "$PACK" -C "$REPO/$FRONTEND_DIR" dist
SHA256="$(shasum -a 256 "$PACK" | awk '{print $1}')"
echo "    产物：$(ls -lh "$PACK" | awk '{print $5}')  sha256=${SHA256:0:12}…"

echo "==> 2/4 上传到新 release 目录（$DIRNAME）"
ensure_release_root "$DEPLOY_HOST" "$DEPLOY_ROOT"
create_release_dir "$DEPLOY_HOST" "$DEPLOY_ROOT" "$DIRNAME" >/dev/null
remote-shell upload "$DEPLOY_HOST" "$PACK" "${DEPLOY_ROOT}-frontend-dist.tar.gz" >/dev/null 2>&1
remote-shell "$DEPLOY_HOST" "tar xzf ${DEPLOY_ROOT}-frontend-dist.tar.gz -C '$DEPLOY_ROOT/releases/$DIRNAME' && rm -f ${DEPLOY_ROOT}-frontend-dist.tar.gz"
remote-shell "$DEPLOY_HOST" "printf 'commit=%s\ntime=%s\nsha256=%s\nservice=%s\n' '$COMMIT' '$TIME' '$SHA256' '$SERVICE' > '$DEPLOY_ROOT/releases/$DIRNAME/manifest'"

echo "==> 3/4 原子切换 current → $DIRNAME，recreate"
PREV="$(current_release "$DEPLOY_HOST" "$DEPLOY_ROOT")"
remote-shell "$DEPLOY_HOST" "printf 'BUILD_COMMIT=%s\nBUILD_TIME=%s\n' '$COMMIT' '$TIME' > '$REMOTE_DEPLOY_DIR/.env'"
switch_current "$DEPLOY_HOST" "$DEPLOY_ROOT" "$DIRNAME"
deploy_recreate "$DEPLOY_HOST" "$REMOTE_COMPOSE" "$SERVICE"

echo "==> 4/4 冒烟检查（失败自动回滚）"
if wait_healthy "$DEPLOY_HOST" "$SMOKE_URL" 8 3; then
    echo "    冒烟通过；版本 $DIRNAME"
    audit_log "$DEPLOY_HOST" "$DEPLOY_ROOT" "release" "$SERVICE" "$DIRNAME" "success"
else
    echo "!! 冒烟失败，自动回滚" >&2
    if [ -n "$PREV" ]; then
        switch_current "$DEPLOY_HOST" "$DEPLOY_ROOT" "$PREV"
        deploy_recreate "$DEPLOY_HOST" "$REMOTE_COMPOSE" "$SERVICE"
        audit_log "$DEPLOY_HOST" "$DEPLOY_ROOT" "release" "$SERVICE" "$DIRNAME" "failed→rollback:$PREV"
    else
        audit_log "$DEPLOY_HOST" "$DEPLOY_ROOT" "release" "$SERVICE" "$DIRNAME" "failed(no-prev)"
    fi
    exit 1
fi
