#!/usr/bin/env python3
# export_openapi.py —— FastAPI 契约导出脚本模板（引导时复制到 backend/scripts/）
#
# 用途：dump FastAPI 应用的 OpenAPI 文档到文件（代码即契约的唯一 SSOT）。
# 用法：
#   python backend/scripts/export_openapi.py --out /tmp/openapi-export.json
#   python backend/scripts/export_openapi.py --out docs/L3/openapi/openapi.yaml --format yaml
# 约定：
#   - 默认落临时文件（门禁落盘：机检 + diff 通过后才写 docs/）
#   - 应用须能离线构建（无 DB/Redis 连接副作用）；import 期连接的项目需改为惰性连接
#   - 产物路径须与 docs/L3/API.md §2 命令及 §4 step5 diff 目标一致
#
# 说明：这是模板，非成品——APP_IMPORT 与产线项目实际入口对齐后使用。

from __future__ import annotations

import argparse
import importlib
import json
import sys
from pathlib import Path

# 应用入口：形如 "app.main:app"（模块:属性）。按项目实际改写。
APP_IMPORT = "app.main:app"


def load_app(target: str):
    """按 "module:attr" 导入 FastAPI 应用实例。"""
    if ":" not in target:
        raise SystemExit(f"APP_IMPORT 需形如 'app.main:app'，当前：{target}")
    module_name, attr = target.split(":", 1)
    module = importlib.import_module(module_name)
    app = getattr(module, attr, None)
    if app is None:
        raise SystemExit(f"模块 {module_name} 无属性 {attr}")
    return app


def dump(app, out: Path, fmt: str) -> None:
    spec = app.openapi()
    if fmt == "json":
        out.write_text(json.dumps(spec, ensure_ascii=False, indent=2), encoding="utf-8")
        return
    try:
        import yaml  # PyYAML（FastAPI 生态通常已随依赖安装）
    except ModuleNotFoundError:
        raise SystemExit(
            "需要 PyYAML 输出 yaml，请先 pip install pyyaml，或改用 --format json"
        )
    out.write_text(
        yaml.safe_dump(spec, allow_unicode=True, sort_keys=False), encoding="utf-8"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="导出 FastAPI OpenAPI 契约")
    parser.add_argument("--out", required=True, help="输出文件路径（建议先落临时目录）")
    parser.add_argument(
        "--format",
        choices=["json", "yaml"],
        default=None,
        help="输出格式（默认按 --out 后缀推断）",
    )
    parser.add_argument(
        "--app", default=APP_IMPORT, help=f"应用入口 module:attr（默认 {APP_IMPORT}）"
    )
    args = parser.parse_args()

    out = Path(args.out)
    fmt = args.format or ("yaml" if out.suffix.lower() in (".yaml", ".yml") else "json")
    out.parent.mkdir(parents=True, exist_ok=True)

    app = load_app(args.app)
    dump(app, out, fmt)
    # stdout 只输出一行结果摘要（与项目其它工具约定一致：AI 据此判断）
    print(json.dumps({"ok": True, "out": str(out), "format": fmt}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
