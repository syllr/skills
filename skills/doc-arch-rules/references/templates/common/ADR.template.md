---
title: ADR — 架构决策记录
doc_type: template
layer: common
description: common 贯穿层 文档 ADR 的更新规范——修改 docs/adr/*.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/adr/*.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - Markdown（ADR 四段式 + Frontmatter）
  related: # 关联模板与联动修改
    TECHNOLOGY-ARCHITECTURE: 选型结论在它 §3.1/§4，ADR 承载选型决策的 Context/Alternatives/Consequences
    CONSTITUTION: 决策原则见宪法 §1，ADR 只记录结论与权衡
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 决策背景（Context）不清晰时 → 问用户补充
    - 备选方案（Alternatives）有遗漏时 → 问用户
  flow: # 生成流程
    - 扫描（自主）：读 TECHNOLOGY-ARCHITECTURE §3.1/§4 选型结论 + 目标文档 + 现有 docs/adr/ 全量（同 feature 检测：按标题/主题语义归属，同一 feature 的迭代归同一 ADR）
    - 已有 ADR → 复用旧决策有效信息，但结构按本模板重建
    - 新增 ADR 前检索同 feature 已有 ADR：存在 → 直接覆盖该 feature 的唯一 ADR（更新四段为当前决策，不新增编号，不记历史）；不存在 → 新建 NNNN 递增
    - 按模板生成：Frontmatter 四键 → 标题 → 四段正文（Context/Decision/Alternatives/Consequences）→ Chain 回 → Status
    - 首次生成时落 docs/adr/TEMPLATE.md（含本模板 frontmatter + 四段 + Chain 回占位 + 状态枚举说明）供新增 ADR 复制；**TEMPLATE.md 为模板副本，不参与 ADR 计数、覆盖检索与总量收敛**（globs 匹配时跳过）
  notes: # 生成注意点（怎么生成）
    - Frontmatter 固定四键：title/doc_type/layer/status，title 与 `# ADR-NNNN — 中文名` 完全一致
    - status 枚举：Accepted / Superseded by ADR-NNNN / Proposed（同 feature 合并时直接覆盖，不新增 Superseded 链），与 README 列表状态一致
    - 四段正文 Context/Decision/Alternatives/Consequences（Nygard 标准）——只写当前决策的 Why（为什么选 X），**不记历史**；Alternatives 必须列弃用原因
    - Chain 回：文末 `> Chain 回：<文档> §<章节>` 与 TECHNOLOGY-ARCHITECTURE §3.1/§4 双向可追溯
    - 命名：NNNN-<kebab-case>.md 四位递增，与 ADR-NNNN 编号一一对应，无断号
    - 状态声明：正文末 `## Status` 与 frontmatter status 双写一致
    - ADR 只对当前结果负责（快照，不记历史）：**一 feature 一 ADR，迭代直接覆盖该 ADR**（覆盖/新建规则见 flow）
    - 总量收敛：ADR 总数应保持在一定范围（如核心决策 <20），避免 per-iteration 膨胀；同 feature 合并覆盖是常态；**达到上限时优先合并同 feature 既有 ADR（覆盖），不新增；仍超限则问用户是否拆分归档旧 ADR**
  checks: # 生成后反向 check
    - "Frontmatter 四键齐全且 status 枚举正确"
    - "标题与 frontmatter title 一致"
    - "四段正文 Context/Decision/Alternatives/Consequences 齐全（只写当前 Why，不记历史），Alternatives 含弃用原因"
    - "文末含 Chain 回占位"
    - "命名 NNNN-<kebab-case>.md 与 ADR-NNNN 一致，无断号"
    - "正文 Status 与 frontmatter status 一致"
    - "一 feature 仅一 ADR，同 feature 迭代直接覆盖（不新增编号，不记历史）"
    - "ADR 总数收敛（核心决策 <20）"
---

# ADR — 架构决策记录

> 本文档是「<项目名>」的 **ADR（架构决策记录模板）**——common 贯穿层，记录架构决策的上下文、决策、备选与后果。
> 【模板使用指引】复制为 `docs/adr/NNNN-<kebab-case>.md`，按各章节指引填写。首次生成时本模板已落为 `docs/adr/TEMPLATE.md` 供复制。

---

title: "ADR-NNNN — 中文决策名"
doc_type: decision
layer: common
status: "Accepted"

---

# ADR-NNNN — 中文决策名

> 【指引】标题与 frontmatter title 完全一致。

## Context（背景）

> 【指引】1-3 行定性 + 定量理由：什么问题，为什么需要决策。

<背景>

## Decision（决策）

> 【指引】写"为什么选 X 而非 Y"的选型行为。

<决策>

## Alternatives（备选）

> 【指引】必须列弃用原因。

| 备选     | 弃用原因 |
| -------- | -------- |
| <备选 A> | <原因>   |
| <备选 B> | <原因>   |

## Consequences（后果）

> 【指引】写代价与演进口。

<后果>

> Chain 回：<文档> §<章节>

## Status（状态）

Accepted

> 【指引】与 frontmatter status 一致。**决策反转分两类**：① 同 feature 的决策更新 → 直接覆盖该 ADR 四段（status 保持 Accepted，不新增编号）；② 新决策替代旧决策且属不同 feature / 需保留旧决策痕迹 → 新建 ADR-NNNN，旧 ADR 的 status 字段改为 `Superseded by ADR-NNNN`（改旧文件 status，不删旧文件）。

---

> **状态枚举说明**：`Accepted`（已采纳）/ `Superseded by ADR-NNNN`（被替代）/ `Proposed`（提议中），与 `docs/adr/README.md` 列表状态一致。

---

## ADR 索引 README（`docs/adr/README.md`）结构基准

> 【指引】`docs/adr/README.md` 为 **ADR 索引登记文档**（仿 DEPLOYMENT 模板的登记文档骨架模式）——集中登记全部 ADR，供检索与总量收敛。首次生成 ADR 时同步落此 README；新增/覆盖/替代 ADR 时同步更新本表。本 README 为 ADR 列表的唯一入口，各 ADR 正文不复制列表。

### 使用约定

- **登记处**：`docs/adr/README.md` 为 ADR 索引的唯一入口——新增/覆盖/替代 ADR 只改本表，各 ADR 正文不复制列表
- **编号唯一**：`ADR-NNNN` 四位递增、无断号，与文件名 `NNNN-<kebab-case>.md` 一一对应
- **状态同步**：本表「状态」列与各 ADR 正文 `## Status` 及 frontmatter `status` 三处一致（`Accepted` / `Superseded by ADR-NNNN` / `Proposed`）
- **总量收敛**：ADR 总数保持在一定范围（如核心决策 <20）；同 feature 合并覆盖是常态，达到上限优先合并既有 ADR，不新增

### ADR 列表

| 编号     | 决策（标题） | 状态     | 对应正文               |
| -------- | ------------ | -------- | ---------------------- |
| ADR-0001 | <决策名>     | Accepted | `0001-<kebab-case>.md` |
| （补充） |              |          |                        |

### 与文档的 SSOT 分工

> 【指引】ADR 与各文档的**单源（SSOT）分工**——同一决策信息只在一处维护，其余引用不复制。

| 信息                     | SSOT 位置                       | 说明                                                           |
| ------------------------ | ------------------------------- | -------------------------------------------------------------- |
| 选型结论（最终选什么）   | TECHNOLOGY-ARCHITECTURE §3.1/§4 | ADR 只记 Context/Alternatives/Consequences，结论以技术架构为准 |
| 决策背景与权衡（为什么） | ADR（本 README 登记）           | 选型决策的 Why 与备选弃用原因，技术架构引用不复制              |
| 决策原则                 | CONSTITUTION §1                 | ADR 只记录结论与权衡，不重复宪法原则                           |
| 目录结构                 | STRUCTURE                       | ADR 文件位置与命名以 STRUCTURE 为准                            |
