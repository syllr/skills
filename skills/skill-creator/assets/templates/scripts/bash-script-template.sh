#!/usr/bin/env bash
# =============================================================================
# Bash 脚本模板
# =============================================================================
# 用途: 简要说明脚本用途
# 用法: ./script.sh <参数1> <参数2>
# 依赖: bash, grep, sed, awk (系统自带)
# =============================================================================

set -euo pipefail  # 严格模式

# -----------------------------------------------------------------------------
# 配置
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# -----------------------------------------------------------------------------
# 函数
# -----------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: $SCRIPT_NAME <参数1> <参数2>

描述: 脚本的具体功能说明

参数:
    <参数1>    参数1说明
    <参数2>    参数2说明

示例:
    $SCRIPT_NAME input.txt output.txt
EOF
}

log_info() {
    echo "[INFO] $*"
}

log_error() {
    echo "[ERROR] $*" >&2
}

check_dependencies() {
    local deps=("grep" "sed" "awk")
    for cmd in "${deps[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
}

process_file() {
    local input="$1"
    local output="$2"

    if [[ ! -f "$input" ]]; then
        log_error "Input file not found: $input"
        exit 1
    fi

    log_info "Processing $input -> $output"

    # TODO: 实现具体逻辑
    grep -E "." "$input" | sed 's/^/processed: /' > "$output"

    log_info "Done!"
}

# -----------------------------------------------------------------------------
# 主逻辑
# -----------------------------------------------------------------------------

main() {
    if [[ $# -lt 2 ]]; then
        usage
        exit 1
    fi

    check_dependencies

    local arg1="$1"
    local arg2="$2"

    process_file "$arg1" "$arg2"
}

main "$@"
