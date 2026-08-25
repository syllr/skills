---
description: L3 契约层 文档 INTEGRATION 的更新规范——修改 docs/L3/INTEGRATION.md 时触发，按模板 frontmatter 的 generation 元数据（scan/ask_user/flow/checks/related）生成或更新该文档；模板全文（含 generation 元数据与 Markdown 正文）见本 rule 下方。
globs:
  - "docs/**/INTEGRATION.md"
---

# INTEGRATION 文档更新规范（L3 契约层）

**本文档在修改 `docs/L3/INTEGRATION.md` 时生效。** 目标：按下方模板生成/更新 `docs/L3/INTEGRATION.md`，使其结构符合模板契约，保持 SSOT、不漂移、不遗漏联动。

## 触发条件

当以下任一情况发生时，本规则必须生效：

- 编辑、新增或重建 `docs/L3/INTEGRATION.md`
- 该文档关联的其他文档（见模板 `related`）发生变化，需要联动更新本文档
- 用户要求"生成/更新 INTEGRATION"

## 执行流程

1. **读模板 generation 元数据**：下方「模板全文」的 frontmatter `generation` 块是本文档的"生成/更新提示词"，逐字段执行：
   - `scan`：自主扫描列出的源（不问用户），作为更新依据
   - `ask_user`：仅当列出的决策点存在歧义时，才用询问工具问用户
   - `flow`：按列出的流程分支执行（全量重建 or 增量修改）
   - `reentrant`：支持可重入——全量重生成或增量修改都要能处理
   - `notes`：注意点（怎么生成，避免常见错误）
   - `checks`：生成后逐条反向核对（含 S8：文档不含 emoji）
   - `related`：关联模板与联动修改——更新本文档时，检查并同步 `related` 列出的关联文档
2. **按模板正文生成**：以下方「模板全文」的 Markdown 正文为结构基准，把模板复制为 `docs/L3/INTEGRATION.md`，按 `> 【指引】` 填写，**删除 generation 元数据块与全部 `> 【指引】` 说明**（实例不含这两者）。
3. **反向 check**：逐条执行模板 `generation.checks`，全部通过才算完成。

## 硬性要求

- **SSOT**：模板是本文档的唯一结构源；已合并/已删除的模板（如 DATA-ARCHITECTURE 已并入 DOMAIN-MODEL）不生成独立文档。
- **不用 emoji**（S8，grep 校验：`grep -P "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" <文档>`）。
- **联动**：`related` 列的关联文档必须同步检查；跨层引用单向向下，下层不链回上层。
- **图规范**：文档中的图按模板要求用 D2 / Mermaid / ASCII，绘制规范见 CONSTITUTION §3.2。

## 完成判定

模板 `generation.checks` 全部通过 + 文档与关联文档无漂移。

---

## 模板全文（本 rule 的生成依据）

以下是 `INTEGRATION` 的完整模板（frontmatter generation 元数据 + Markdown 正文，SSOT，来自 references/templates/L3/INTEGRATION.template.md）：

```markdown
---
title: INTEGRATION — 外部集成（Outbound）
doc_type: template
layer: L3
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  # 自主扫描（AI 读源，不问用户）
  scan:
    - 读 TECHNOLOGY-ARCHITECTURE §4：基础设施与外部依赖（外部集成 SSOT，技术栈来源）
    - 读 APPLICATION-ARCHITECTURE §2.2：应用划分（确认集成调用方的归属应用）
    - 读 DOMAIN-MODEL §3：聚合设计（聚合操作对接的外部接口来源）
    - 读 DOMAIN-MODEL §5.1：数据全景与设计原则（外部数据源/外部数据资产分类与存储形态）
    - 读 DOMAIN-MODEL §7：层间模型翻译（integration 层的 ACL Adapter 翻译器标准）
    - 扫描目标文档：INTEGRATION 是否已存在
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 外部服务选择有争议时（如选哪个 AI 供应商）→ 问用户
  flow: # 生成流程
    - 扫描（自主）：读 TECHNOLOGY §4 外部依赖（技术外部集成）+ APPLICATION §2.2 应用归属（确认调用方所在应用）+ DOMAIN-MODEL §3 聚合操作（领域触发的外部接口）+ DOMAIN-MODEL §5.1 外部数据源（领域视角的外部数据资产）+ DOMAIN-MODEL §7 ACL Adapter（integration 层翻译标准）+ 目标文档
    - 已有 INTEGRATION → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 外部集成总览 → §2 每服务详情（接入/鉴权/接口/失败处理）
  reentrant: # 可重入（全量/增量）
    - 全量重生成：收到"生成 INTEGRATION" → 从模板 + 扫描依赖完整重建
    - 增量修改：已有且符合模板 → 只更新变化外部服务，保留未变
  tools:
    - Markdown 表格（供应商/鉴权/接口/错误码）
  notes: # 生成注意点（怎么生成）
    - 只写外部集成契约（Outbound）：本系统调用的第三方服务（微信/支付/AI 供应商等）
    - 与 API（Inbound）互补：API 管"我提供什么"，INTEGRATION 管"我调用什么"
    - 数据库/对象存储/缓存属于基础设施（infra 层），不是外部集成（integration 层）——不列入本表，其选型与拓扑见 TECHNOLOGY-ARCHITECTURE §3.1 与 DEPLOYMENT
    - 集成来源两个维度：①技术外部依赖（TECHNOLOGY §4：基础设施与外部服务清单）+ ②领域外部数据源（DOMAIN-MODEL §5.1：外部数据资产），二者并集去重后落地为本表外部服务
    - 集成调用方归属应用须在 APPLICATION-ARCHITECTURE §2.2 可定位；integration 层落地的 ACL Adapter 翻译遵循 DOMAIN-MODEL §7 标准
    - 鉴权/失败处理/错误码必填
    - 外部依赖 SSOT 在 TECHNOLOGY-ARCHITECTURE §4（引用不重列）
  checks: # 生成后反向 check
    - "每个外部服务有接入方式 + 鉴权 + 关键接口 + 失败处理"
    - "外部服务清单与 TECHNOLOGY-ARCHITECTURE §4 一致（SSOT 引用，不重列）"
    - "外部数据源覆盖 DOMAIN-MODEL §5.1 中标注的外部数据资产（无遗漏、无臆造）"
    - "每个外部服务的调用方归属应用可在 APPLICATION-ARCHITECTURE §2.2 找到对应（不悬空）"
    - "与 API（Inbound）方向不混淆"
    - "数据库/对象存储/缓存未误列为外部集成（infra ≠ integration）"
    - "内容条目无顺序编号（外部服务按服务名标识，不用 EXT-N）"
    - "S8：文档不含 emoji（grep 检查通过，详见 CONSTITUTION S8 依据）"
  related: # 关联模板与联动修改
    TECHNOLOGY-ARCHITECTURE: 外部依赖 SSOT 在它 §4，选型变化需同步集成；infra 拓扑（DB/OSS/缓存）见它 §3.1 而非本表
    APPLICATION-ARCHITECTURE: 应用清单 SSOT 在它 §2.2，集成调用方归属应用需与之一致
    DOMAIN-MODEL: 外部数据源与外部接口契约在它 §3（聚合操作）+ §5.1（外部数据资产）+ §7（ACL Adapter），集成需与领域模型对齐
    API: 互补（Inbound vs Outbound），外部服务变化需同步本系统接口
    DEPLOYMENT: 外部服务密钥/回调需同步部署配置
---

# INTEGRATION — 外部集成（Outbound）

> 本文档是「<项目名>」的 **INTEGRATION（外部集成模板）**——L3 契约层的被调用接口文档。
> 【模板使用指引】复制为 `docs/L3/INTEGRATION.md`，按各章节指引填写。
> 【原则】① **外部集成契约（Outbound）**：本系统被调用的第三方接口——微信/支付/AI 供应商（L3 技术契约）；② 与 API（Inbound）互补：API 管"我提供什么"，INTEGRATION 管"我调用什么"；③ 图规范见宪法；④ **不用 emoji**、无元信息表、无变更记录。

---

## 1. 外部集成总览

> 【指引】本系统调用的第三方服务清单（供应商 + 用途 + 鉴权方式）。

| 外部服务 | 用途   | 鉴权方式 | 归属应用        |
| -------- | ------ | -------- | --------------- |
| <服务名> | <用途> | <鉴权>   | <前端/后端 API> |

---

## 2. 集成详情

### 2.1 <外部服务名>

**接入方式**：<API / SDK / Webhook>

**鉴权**：<AppSecret / Token / 签名>

**关键接口**：

| 方法     | 路径   | 说明   |
| -------- | ------ | ------ |
| <method> | <path> | <说明> |

**调用方**：<哪个模块调用>

**失败处理**：<超时/重试/降级>

**错误码**：

| 错误码 | 说明   |
| ------ | ------ |
| <code> | <含义> |

（每个外部服务一小节，补充）
```
