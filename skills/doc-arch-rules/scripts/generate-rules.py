#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
doc-arch-rules rule 生成脚本

从 references/templates/ 目录遍历所有 .md 文件，按文件后缀分两类生成 rule 到 references/rules/：

1. 无 `.template` 后缀（如 L0/CONSTITUTION.md）：
   - 该文件本身就是全局 Rule（不生成文档、不依赖模板）
   - rule = frontmatter（description + alwaysApply: true）+ 文件全文
   - 落盘: rules/<层>/<文件名>.md

2. 有 `.template` 后缀（如 L1/README.template.md）：
   - 该文件是模板，用它生成某个文档（按 frontmatter generation 元数据执行）
   - rule = frontmatter（description + globs）+ 生成指引（scan/ask_user/flow/checks/related）+ 模板 Markdown 正文完整拷贝
   - 落盘: rules/<层>/<文档名>.md（去掉 .template）

用法:
    python3 scripts/generate-rules.py            # 重新生成全部 rule
    python3 scripts/generate-rules.py --check    # 只检查不写入（校验模板与 rule 一致性）
"""

from __future__ import annotations

import argparse
import glob
import os
import re
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = SKILL_ROOT / "references" / "templates"
RULES_DIR = SKILL_ROOT / "references" / "rules"

# 层 -> 中文名（用于 rule 标题与 description）
LAYER_ZH = {
    "L0": "L0 决策层",
    "L1": "L1 产品层",
    "L2": "L2 架构层",
    "L3": "L3 契约层",
    "L4": "L4 交付层",
    "common": "common 贯穿层",
}

# 全局层：无 .template 后缀文件的 rule 用 alwaysApply（不靠 globs）
# 有 .template 后缀但属于全局层的，也用 alwaysApply（如 common 的模板生成的文档是全局约束）
ALWAYS_APPLY_LAYERS = {"L0", "common"}

# 特殊落盘路径：文档名 -> 落盘位置（用于 globs 与生成指引）
SPECIAL_TARGETS = {
    "README": "README.md",  # README 在项目根，不在 docs/
}

# 已合并/废弃的模板：不生成 rule
SKIP_FILES = {"DATA-ARCHITECTURE.template.md"}


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """解析 YAML frontmatter，返回 (frontmatter_dict, 正文)。frontmatter 缺失时返回 ({}, 全文)。"""
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    fm_text, body = parts[1], parts[2]
    # 简单 YAML 解析：只取顶层标量键与 generation 块
    fm: dict = {}
    for line in fm_text.splitlines():
        m = re.match(r"^([a-z_]+):\s*(.*)$", line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            if val.startswith(("#", "-", "|", ">")) or val == "":
                fm[key] = None
            elif val.lower() in ("true", "false"):
                fm[key] = val.lower() == "true"
            else:
                fm[key] = val
    return fm, body


def extract_target(doc_name: str, layer: str, body: str) -> str:
    """从模板正文的『复制为 X』指引提取目标文档路径；无指引时按层推导。"""
    if doc_name in SPECIAL_TARGETS:
        return SPECIAL_TARGETS[doc_name]
    m = re.search(r"复制为\s*[`]?([^`\n，。；]+)", body)
    if m:
        target = m.group(1).strip()
        if target and target != "<项目名>":
            return target
    # 默认推导: docs/<层>/<文档名>.md（README 特殊在项目根）
    return f"docs/{layer}/{doc_name}.md"


def gen_global_rule(doc_name: str, layer: str, full_text: str) -> str:
    """无 .template 后缀：rule = description + alwaysApply + 文件全文。"""
    layer_zh = LAYER_ZH.get(layer, layer)
    # 去掉源文件自身的 frontmatter（保留正文）
    _, body = parse_frontmatter(full_text)
    desc_map = {
        "CONSTITUTION": "项目宪法（L0 决策层 · 全局加载）——宪法是跨任务/跨 Agent 的全局约束，任何编码会话开始前必须加载。本 rule 内容即项目宪法全文（唯一真源 SSOT），任何文档/代码改动都必须遵守宪法条款。",
    }
    desc = desc_map.get(
        doc_name,
        f"{layer_zh} {doc_name}（全局加载）——内容即文档全文，任何会话/改动都生效。",
    )
    return f"""---
description: {desc}
alwaysApply: true
---

{body.strip()}
"""


def gen_template_rule(doc_name: str, layer: str, template_text: str) -> str:
    """有 .template 后缀：rule = description + globs + 生成指引 + 模板全文完整拷贝（frontmatter + 正文）。"""
    layer_zh = LAYER_ZH.get(layer, layer)
    target = extract_target(doc_name, layer, template_text)

    # globs：全局层用 alwaysApply；业务层用路径匹配（README 特殊在项目根）
    if layer in ALWAYS_APPLY_LAYERS:
        fm_head = "alwaysApply: true"
    elif doc_name in SPECIAL_TARGETS:
        fm_head = f'globs:\n  - "{SPECIAL_TARGETS[doc_name]}"'
    else:
        fm_head = 'globs:\n  - "docs/**/' + doc_name + '.md"'

    # 模板全文：保留 frontmatter（含 generation 元数据）+ 正文——rule 自包含
    template_full = template_text.strip()

    return f"""---
description: {layer_zh} 文档 {doc_name} 的更新规范——修改 {target} 时触发，按模板 frontmatter 的 generation 元数据（scan/ask_user/flow/checks/related）生成或更新该文档；模板全文（含 generation 元数据与 Markdown 正文）见本 rule 下方。
{fm_head}
---

# {doc_name} 文档更新规范（{layer_zh}）

**本文档在修改 `{target}` 时生效。** 目标：按下方模板生成/更新 `{target}`，使其结构符合模板契约，保持 SSOT、不漂移、不遗漏联动。

## 触发条件

当以下任一情况发生时，本规则必须生效：

- 编辑、新增或重建 `{target}`
- 该文档关联的其他文档（见模板 `related`）发生变化，需要联动更新本文档
- 用户要求"生成/更新 {doc_name}"

## 执行流程

1. **读模板 generation 元数据**：下方「模板全文」的 frontmatter `generation` 块是本文档的"生成/更新提示词"，逐字段执行：
   - `scan`：自主扫描列出的源（不问用户），作为更新依据
   - `ask_user`：仅当列出的决策点存在歧义时，才用询问工具问用户
   - `flow`：按列出的流程分支执行（全量重建 or 增量修改）
   - `reentrant`：支持可重入——全量重生成或增量修改都要能处理
   - `notes`：注意点（怎么生成，避免常见错误）
   - `checks`：生成后逐条反向核对（含 S8：文档不含 emoji）
   - `related`：关联模板与联动修改——更新本文档时，检查并同步 `related` 列出的关联文档
2. **按模板正文生成**：以下方「模板全文」的 Markdown 正文为结构基准，把模板复制为 `{target}`，按 `> 【指引】` 填写，**删除 generation 元数据块与全部 `> 【指引】` 说明**（实例不含这两者）。
3. **反向 check**：逐条执行模板 `generation.checks`，全部通过才算完成。

## 硬性要求

- **SSOT**：模板是本文档的唯一结构源；已合并/已删除的模板（如 DATA-ARCHITECTURE 已并入 DOMAIN-MODEL）不生成独立文档。
- **不用 emoji**（S8，grep 校验：`grep -P "[\\x{{1F300}}-\\x{{1FAFF}}\\x{{2600}}-\\x{{27BF}}]" <文档>`）。
- **联动**：`related` 列的关联文档必须同步检查；跨层引用单向向下，下层不链回上层。
- **图规范**：文档中的图按模板要求用 D2 / Mermaid / ASCII，绘制规范见 CONSTITUTION §3.2。

## 完成判定

模板 `generation.checks` 全部通过 + 文档与关联文档无漂移。

---

## 模板全文（本 rule 的生成依据）

以下是 `{doc_name}` 的完整模板（frontmatter generation 元数据 + Markdown 正文，SSOT，来自 references/templates/{layer}/{doc_name}.template.md）：

```markdown
{template_full}
```
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="doc-arch-rules rule 生成脚本")
    parser.add_argument("--check", action="store_true", help="只校验不写入")
    args = parser.parse_args()

    if not TEMPLATES_DIR.exists():
        print(f"错误: 模板目录不存在 {TEMPLATES_DIR}", file=sys.stderr)
        sys.exit(1)

    generated: list[Path] = []
    for tmpl in sorted(glob.glob(str(TEMPLATES_DIR / "**" / "*.md"), recursive=True)):
        tmpl_path = Path(tmpl)
        layer = tmpl_path.parent.name
        filename = tmpl_path.name

        if filename in SKIP_FILES:
            print(f"跳过（已合并）: {layer}/{filename}")
            continue

        full_text = tmpl_path.read_text(encoding="utf-8")
        is_template = filename.endswith(".template.md")
        doc_name = (
            filename[: -len(".template.md")] if is_template else filename[: -len(".md")]
        )

        if is_template:
            rule = gen_template_rule(doc_name, layer, full_text)
            out_name = f"{doc_name}.md"
        else:
            rule = gen_global_rule(doc_name, layer, full_text)
            out_name = filename

        out_dir = RULES_DIR / layer
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / out_name

        if args.check:
            if out_path.exists():
                old = out_path.read_text(encoding="utf-8")
                status = "OK" if old == rule else "DIFF"
                print(f"{status}  {layer}/{out_name}")
            else:
                print(f"MISSING  {layer}/{out_name}")
        else:
            out_path.write_text(rule, encoding="utf-8")
            generated.append(out_path)
            kind = "全局 rule" if not is_template else "模板 rule"
            print(f"生成 {kind}: {layer}/{out_name}")

    if not args.check:
        print(f"\n共生成 {len(generated)} 个 rule")


if __name__ == "__main__":
    main()
