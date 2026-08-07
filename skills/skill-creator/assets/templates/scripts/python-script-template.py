#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =============================================================================
# Python 脚本模板
# =============================================================================
# 用途: 简要说明脚本用途
# 用法: python3 script.py <参数1> <参数2>
# 依赖: Python 3.10+
# =============================================================================

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

# -----------------------------------------------------------------------------
# 配置
# -----------------------------------------------------------------------------
__version__ = "1.0.0"
__author__ = "Your Name"

# -----------------------------------------------------------------------------
# 函数
# -----------------------------------------------------------------------------

def setup_parser() -> argparse.ArgumentParser:
    """设置命令行参数解析器"""
    parser = argparse.ArgumentParser(
        description="脚本的具体功能说明",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    python3 script.py input.txt output.json
    python3 script.py --verbose --input data.csv
        """
    )
    parser.add_argument("input", help="输入文件路径")
    parser.add_argument("output", nargs="?", help="输出文件路径 (可选)")
    parser.add_argument("-v", "--verbose", action="store_true", help="详细输出")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    return parser


def log_info(msg: str) -> None:
    """输出信息日志"""
    print(f"[INFO] {msg}")


def log_error(msg: str) -> None:
    """输出错误日志"""
    print(f"[ERROR] {msg}", file=sys.stderr)


def read_input(path: str) -> str:
    """读取输入文件"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        log_error(f"Input file not found: {path}")
        sys.exit(1)
    except Exception as e:
        log_error(f"Error reading file: {e}")
        sys.exit(1)


def write_output(path: str, data: str) -> None:
    """写入输出文件"""
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(data)
        log_info(f"Output written to: {path}")
    except Exception as e:
        log_error(f"Error writing file: {e}")
        sys.exit(1)


def process_data(input_str: str, verbose: bool = False) -> dict:
    """
    处理输入数据

    Args:
        input_str: 输入字符串
        verbose: 是否详细输出

    Returns:
        处理结果字典
    """
    lines = input_str.strip().split("\n")

    result = {
        "total_lines": len(lines),
        "processed": [],
    }

    for i, line in enumerate(lines, 1):
        if verbose:
            log_info(f"Processing line {i}: {line[:50]}...")
        result["processed"].append({
            "line_number": i,
            "content": line,
            "length": len(line),
        })

    return result


def main() -> None:
    """主函数"""
    parser = setup_parser()
    args = parser.parse_args()

    if args.verbose:
        log_info(f"Script version: {__version__}")
        log_info(f"Input: {args.input}")

    # 读取输入
    input_data = read_input(args.input)

    # 处理数据
    result = process_data(input_data, verbose=args.verbose)

    # 输出结果
    if args.output:
        output_data = json.dumps(result, indent=2, ensure_ascii=False)
        write_output(args.output, output_data)
    else:
        # 无输出文件时打印到 stdout
        print(json.dumps(result, indent=2, ensure_ascii=False))

    log_info("Done!")


if __name__ == "__main__":
    main()
