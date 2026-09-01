---
title: DATA-DICTIONARY — 数据字典
doc_type: template
layer: common
description: common 贯穿层 文档 DATA-DICTIONARY 的更新规范——修改 docs/common/DATA-DICTIONARY.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/common/DATA-DICTIONARY.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - Markdown 表格（字段/枚举/事件定义表）
  related: # 关联模板与联动修改
    DOMAIN-MODEL: 表/集合级结构在它 §5（数据设计），字段级细节 SSOT 在本文件；集合设计的关键字段示例在 DOMAIN-MODEL §5.1，全量字段在此展开
    API: 接口字段级定义 SSOT 在 openapi.yaml，本字典与之一致（引用不复制）
    INTEGRATION: 外部服务契约字段 SSOT 在 integration-contracts/，本字典与之一致（引用不复制）
    GLOSSARY: 概念级术语在它，本字典只管字段/枚举/事件级
    SECURITY: 敏感字段（密钥/凭据）定义与脱敏规则在它 §5，本字典引用不复制
    DATA-ARCHITECTURE: 已合并进 DOMAIN-MODEL（§5 数据设计），不生成 rule
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 字段/枚举口径有跨系统冲突且无法从代码定论时（如两处定义不一致）→ 问用户以哪个为准
  flow: # 生成流程
    - 扫描（自主）：读 DOMAIN-MODEL §5（数据设计，集合/表级）+ 代码实体/DTO/枚举定义 + 数据库 schema + 目标文档；扫描源缺失→以已有源+目标文档为准，不臆造
    - 已有 DATA-DICTIONARY → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 字段定义 → §2 枚举定义 → §3 事件定义（或按数据域分组）
  notes: # 生成注意点（怎么生成）
    - 字段/枚举/事件级定义唯一事实源（SSOT）：全量字段、枚举值、事件载荷在此维护；DOMAIN-MODEL 只写集合级 + 关键字段示例，不重复全量字典
    - 按数据域/表/集合分组组织，每条含字段名/类型/必填/默认值/约束/说明；枚举含取值列表与含义
    - 与代码实体/DTO 一致：字段增删改同步本字典（S9 通用语言贯穿）
    - 敏感字段（密钥/token/脱敏）只登记元数据（存在性/脱敏规则/引用 SECURITY），不写真实值
    - 与 GLOSSARY 分工：概念级术语在 GLOSSARY，本文件只管字段/枚举/事件级
    - 与 API/integration-contracts 契约一致：接口字段以 openapi.yaml / 契约文件为准，本字典不重复定义契约字段（引用不复制）
  checks: # 生成后反向 check
    - "字段定义含字段名/类型/必填/约束/说明"
    - "枚举定义含全部取值与含义（无遗漏）"
    - "与 DOMAIN-MODEL §5 集合级一致（无字段级重复、无冲突）"
    - "与代码实体/DTO 定义一致（grep 对照）"
    - "敏感字段未写真实值（仅元数据 + 引用 SECURITY）"
    - "术语与 GLOSSARY 一致（宪法 S9）"
    - "与 API/integration-contracts 契约一致（契约已定义字段不重复，引用不复制）"
---

# DATA-DICTIONARY — 数据字典

> 本文档是「<项目名>」的 **DATA-DICTIONARY（数据字典）**——common 贯穿层的字段/枚举/事件级数据定义。
> 【模板使用指引】复制为 `docs/common/DATA-DICTIONARY.md`，按各章节指引填写。
> 【原则】① **字段/枚举/事件级定义 SSOT**：全量字段/枚举/事件在此维护；② 表/集合级结构在 DOMAIN-MODEL §5（先业务后存储），此处只管字段级细节；③ 概念级术语在 GLOSSARY；④ 敏感字段只登记元数据不写真实值。

---

## 1. 字段定义

> 【指引】按数据域/表/集合分组（与 DOMAIN-MODEL §5.1 结构对应），每条：字段名/类型/必填/默认值/约束/说明。接口契约字段（openapi.yaml / integration-contracts/ 已定义）不重复，引用不复制。

### 1.1 <表/集合名>

| 字段    | 类型   | 必填  | 默认值    | 约束   | 说明   |
| ------- | ------ | ----- | --------- | ------ | ------ |
| <field> | <type> | <Y/N> | <default> | <约束> | <说明> |

## 2. 枚举定义

> 【指引】枚举取值列表与含义；取值变化时同步代码与 DOMAIN-MODEL §3.x 各域小节内状态机（宪法 S9 通用语言贯穿）。

| 枚举   | 取值              | 含义   |
| ------ | ----------------- | ------ |
| <enum> | <value1>/<value2> | <含义> |

## 3. 事件定义

> 【指引】领域事件/事件载荷（与 DOMAIN-MODEL §4 事件对应）；字段级载荷在此定义，事件语义在领域模型。

| 事件    | 触发条件   | 载荷字段   | 说明   |
| ------- | ---------- | ---------- | ------ |
| <event> | <触发条件> | <字段列表> | <说明> |
