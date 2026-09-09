---
title: L3/integration-contracts — 索引
doc_type: template
layer: L3
description: L3 契约层 外部服务契约目录索引的更新规范——修改 docs/L3/integration-contracts/INDEX.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L3/integration-contracts/INDEX.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - Markdown 文件清单表（一文件一行：文件 | 说明）
  related: # 关联模板与联动修改
    CONTRACT: 单份契约按 [CONTRACT](CONTRACT.template.md) 生成；新增/删除契约文件必须同步本索引清单
    INTEGRATION: 说明书见它 §1 总览/§2 各服务小节——契约状态/接入细节以契约文件为准，INTEGRATION §2 为同步引用，本索引不复制
    STRUCTURE: 目录结构见它 §1，需同步 integration-contracts/ 说明
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 契约文件清单与 INTEGRATION §1 总览不一致时问用户
  flow: # 生成流程
    - 扫描（自主）：现有 integration-contracts/*.md（排除本文件）
    - 按模板生成：文件清单表
    - 校验单链（清单 ↔ 目录内契约文件一一对应，无幽灵行/无漏登）
  notes: # 生成注意点（怎么生成）
    - 目录索引约定（宪法 §3.2）：本文件是 integration-contracts/ 目录唯一入口，阅读先读本文，目录内新增/删除/合并文档必同步本文
    - 极简形态：只有一张「文件 | 说明」表——每文件一行、一句话描述（这个文件是干啥的）；不写收敛标准/判定/原则块/图
    - 纯导航：不复制契约状态/接口/字段/错误码——契约状态/接入细节以契约文件为准，INTEGRATION §2 为同步引用（宪法 §2.2 第2条）
  checks: # 生成后反向 check
    - "仅一张文件清单表（文件 | 说明），无收敛标准/判定/原则块/图"
    - "清单与目录内契约文件一一对应（无幽灵行/无漏登）"
    - "不复制契约状态/接口/字段/错误码（纯导航）"
---

# L3/integration-contracts — 索引

| 文件                         | 说明                       |
| ---------------------------- | -------------------------- |
| [<service>.md](<service>.md) | <一句话：这个契约是干啥的> |
