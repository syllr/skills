---
description: L3 契约层 文档 INTEGRATION 的更新规范——修改 docs/L3/INTEGRATION.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L3/INTEGRATION.md"
---

# INTEGRATION 文档更新规范（L3 契约层）

## 触发条件

当以下任一情况发生时，本规则必须生效：

- 编辑、新增或重建 `docs/L3/INTEGRATION.md`
- 关联文档变化需联动更新（来自 generation.related）：
  - `TECHNOLOGY-ARCHITECTURE`（外部依赖 SSOT 在它 §4，选型变化需同步集成；infra 拓扑（DB/OSS/缓存）见它 §3.1 而非本表）
  - `APPLICATION-ARCHITECTURE`（应用清单 SSOT 在它 §2.2，集成调用方归属应用需与之一致）
  - `DOMAIN-MODEL`（外部数据源与外部接口契约在它 §3（聚合操作）+ §5.1（外部数据资产）+ §7（ACL Adapter），集成需与领域模型对齐）
  - `API`（互补（Inbound vs Outbound），外部服务变化需同步本系统接口）
  - `DEPLOYMENT`（外部服务密钥/回调需同步部署配置）
- 用户要求"生成/更新 INTEGRATION"

## 执行流程

1. **工具**：Markdown 表格（供应商/鉴权/接口/错误码）
2. **扫描**（自主，不问用户）：
   - 读 TECHNOLOGY-ARCHITECTURE §4：基础设施与外部依赖（外部集成 SSOT，技术栈来源）
   - 读 APPLICATION-ARCHITECTURE §2.2：应用划分（确认集成调用方的归属应用）
   - 读 DOMAIN-MODEL §3：聚合设计（聚合操作对接的外部接口来源）
   - 读 DOMAIN-MODEL §5.1：数据全景与设计原则（外部数据源/外部数据资产分类与存储形态）
   - 读 DOMAIN-MODEL §7：层间模型翻译（integration 层的 ACL Adapter 翻译器标准）
   - 扫描目标文档：INTEGRATION 是否已存在
3. **问用户**（仅当有歧义）：
   - 外部服务选择有争议时（如选哪个 AI 供应商）→ 问用户
4. **生成流程**：
   - 扫描（自主）：读 TECHNOLOGY §4 外部依赖（技术外部集成）+ APPLICATION §2.2 应用归属（确认调用方所在应用）+ DOMAIN-MODEL §3 聚合操作（领域触发的外部接口）+ DOMAIN-MODEL §5.1 外部数据源（领域视角的外部数据资产）+ DOMAIN-MODEL §7 ACL Adapter（integration 层翻译标准）+ 目标文档
   - 已有 INTEGRATION → 参考旧文档有效信息，但结构按本模板重建
   - 按模板生成：§1 外部集成总览 → §2 每服务详情（接入/鉴权/接口/失败处理）

## 硬性要求

- 只写外部集成契约（Outbound）：本系统调用的第三方服务（微信/支付/AI 供应商等）
- 与 API（Inbound）互补：API 管"我提供什么"，INTEGRATION 管"我调用什么"
- 数据库/对象存储/缓存属于基础设施（infra 层），不是外部集成（integration 层）——不列入本表，其选型与拓扑见 TECHNOLOGY-ARCHITECTURE §3.1 与 DEPLOYMENT
- 集成来源两个维度：①技术外部依赖（TECHNOLOGY §4：基础设施与外部服务清单）+ ②领域外部数据源（DOMAIN-MODEL §5.1：外部数据资产），二者并集去重后落地为本表外部服务
- 集成调用方归属应用须在 APPLICATION-ARCHITECTURE §2.2 可定位；integration 层落地的 ACL Adapter 翻译遵循 DOMAIN-MODEL §7 标准
- 鉴权/失败处理/错误码必填
- 外部依赖 SSOT 在 TECHNOLOGY-ARCHITECTURE §4（引用不重列）
- **联动**：更新时按 related 同步关联文档（见触发条件）；跨层引用单向向下，下层不链回上层
- **不用 emoji**（S8，grep 校验）
- **图规范**：按 generation.tools 与 CONSTITUTION §3.2 用 D2 / Mermaid / ASCII

## 完成判定

以下全部通过才算完成（generation.checks 逐条）：

- 每个外部服务有接入方式 + 鉴权 + 关键接口 + 失败处理
- 外部服务清单与 TECHNOLOGY-ARCHITECTURE §4 一致（SSOT 引用，不重列）
- 外部数据源覆盖 DOMAIN-MODEL §5.1 中标注的外部数据资产（无遗漏、无臆造）
- 每个外部服务的调用方归属应用可在 APPLICATION-ARCHITECTURE §2.2 找到对应（不悬空）
- 与 API（Inbound）方向不混淆
- 数据库/对象存储/缓存未误列为外部集成（infra ≠ integration）
- 内容条目无顺序编号（外部服务按服务名标识，不用 EXT-N）
- S8：文档不含 emoji（grep 检查通过，详见 CONSTITUTION S8 依据）

---

## 模板（生成/更新文档的结构基准）

以下为 `docs/L3/INTEGRATION.md` 的模板正文（不含 YAML frontmatter，生成/更新时以此结构为准，按 `> 【指引】` 填写，实例不含 `> 【指引】` 说明）：

# INTEGRATION — 外部集成（Outbound）

> 本文档是「<项目名>」的 **INTEGRATION（外部集成模板）**——L3 契约层的被调用接口文档。
> 【模板使用指引】复制为 `docs/L3/INTEGRATION.md`，按各章节指引填写。
> 【原则】① **外部集成契约（Outbound）**：本系统被调用的第三方接口——微信/支付/AI 供应商（L3 技术契约）；② 与 API（Inbound）互补：API 管"我提供什么"，INTEGRATION 管"我调用什么"；③ 图规范见宪法；④ **不用 emoji**、无元信息表、无变更记录。


## 1. 外部集成总览

> 【指引】本系统调用的第三方服务清单（供应商 + 用途 + 鉴权方式）。

| 外部服务 | 用途   | 鉴权方式 | 归属应用        |
| -------- | ------ | -------- | --------------- |
| <服务名> | <用途> | <鉴权>   | <前端/后端 API> |


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
