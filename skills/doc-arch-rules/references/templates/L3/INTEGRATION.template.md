---
title: INTEGRATION — 外部集成说明书（Outbound）
doc_type: template
layer: L3
description: L3 契约层 文档 INTEGRATION 的更新规范——修改 docs/L3/INTEGRATION.md 或 docs/L3/integration-contracts/ 下契约文件时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L3/INTEGRATION.md"
  - "docs/L3/integration-contracts/**"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - Markdown 表格（总览表/契约文件清单/契约状态）
  related: # 关联模板与联动修改
    TECHNOLOGY-ARCHITECTURE: 外部依赖见它 §4，选型变化需同步集成；infra 拓扑（DB/OSS/缓存）见它 §3.1 而非本表
    APPLICATION-ARCHITECTURE: 应用清单见它 §2.2，集成调用方归属应用需与之一致
    DOMAIN-MODEL: 外部接口契约触发在它 §3（聚合操作）+ §7（ACL Adapter），集成需与领域模型对齐
    DATA-ARCHITECTURE: 外部数据资产见它 §2/§5.6，集成需与之一致
    API: 互补（Inbound vs Outbound），外部服务变化需同步本系统接口；结构对称：API = 说明书 + openapi/，INTEGRATION = 说明书 + integration-contracts/
    DEPLOYMENT: 外部服务密钥/回调需同步部署配置
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 外部服务选择有争议时（如选哪个 AI 供应商）→ 问用户
  flow: # 生成流程
    - 扫描（自主）：读 TECHNOLOGY §4 外部依赖（技术外部集成）+ APPLICATION §2.2 应用归属（确认调用方所在应用）+ DOMAIN-MODEL §3 聚合操作（领域触发的外部接口）+ DATA-ARCHITECTURE §2/§5.6 外部数据资产 + DOMAIN-MODEL §7 ACL Adapter（integration 层翻译标准）+ 目标文档；扫描源缺失→以已有源+目标文档为准，不臆造
    - 已有 INTEGRATION → 参考旧文档有效信息，但结构按本模板重建为「说明书 + 契约目录」；删除原单文档内联的接口/字段详情，迁移为契约文件
    - 定位文档模式：**契约以 integration-contracts/ 为准**（每外部服务一份契约文件）；INTEGRATION.md 是说明书（不重复接口清单/字段），承载总览 + 概览 + 契约目录引用
    - **globs 双触发说明**：本 rule 与 CONTRACT rule 的 globs 都含 `docs/L3/integration-contracts/**`——修改契约文件时两者同时触发，属有意分层：本 rule 管说明书（总览/§2 各服务小节同步），CONTRACT rule 管契约文件本身（字段/接口）；各自按职责范围更新，不重复生成
    - 契约文件不存在 → 先按扫描源推导接入/鉴权/接口/字段契约，落 integration-contracts/<service>.md，再生成 INTEGRATION.md 说明书
    - 按模板生成：§1 外部集成总览 → §2 每服务概览（引用契约文件，不复制字段；终版较厚形态可含关键接口表＋错误码表）→ §3 契约文件目录（可选节，可省略）
  notes: # 生成注意点（怎么生成）
    - 只写外部集成契约（Outbound）：本系统调用的第三方服务（微信/支付/AI 供应商等）
    - 与 API（Inbound）互补：API 管"我提供什么"，INTEGRATION 管"我调用什么"
    - 数据库/对象存储/缓存属于基础设施（infra 层），不是外部集成（integration 层）——不列入本表，其选型与拓扑见 TECHNOLOGY-ARCHITECTURE §3.1 与 DEPLOYMENT
    - 集成来源两个维度：①技术外部依赖（TECHNOLOGY §4：基础设施与外部服务清单）+ ②领域外部数据源（DATA-ARCHITECTURE §2/§5.6：外部数据资产），二者并集去重后落地为契约文件；不一致时以 TECHNOLOGY §4 为准
    - 集成调用方归属应用须在 APPLICATION-ARCHITECTURE §2.2 可定位；integration 层落地的 ACL Adapter 翻译遵循 DOMAIN-MODEL §7 标准
    - **契约目录结构（case 1）**：双结构对齐 API「说明书 + openapi/」——`INTEGRATION.md`（说明书瘦身）+ `docs/L3/integration-contracts/`（每外部服务一份契约文件）
    - **一服务一契约文件（case 2）**：`<service>-<name>.md` kebab-case（如 llm-api.md/vector-service.md），接口字段级契约/语义/错误码在契约文件，说明书只引用不复制（第2条）
    - **字段术语见契约文件（case 3）**：外部服务契约的字段术语以契约文件为准，本文引用不复制；跨文件术语冲突以契约文件为准（防 project_id/file_id ↔ kb_id/doc_id 类冲突）
    - **接口清单以契约为准（case 4）**：说明书不列接口清单，接口以契约文件为准（与 API 说明书一致：字段/接口查契约，不手抄）
    - **契约状态标注（case 5）**：契约文件含「契约状态（重要）」小节（mock 中 / 已交付 / 已上线），与 §2 各服务小节的契约状态引用一致；mock 实现（如 InMemoryXxxAdapter）切换真实时替换 adapter 业务零改动
    - **内联 vs 引用判定规则（case 7）**：① 他方定义契约（第三方服务/外部团队维护）→ 只引用不内联，字段/接口一律查契约文件；② 我方定义契约且字段复杂 → 可内联关键接口表＋引用契约文件双轨（§2 内联关键接口表/错误码表便于概览，字段级请求/响应仍归契约文件）
    - **文件迁移/删除全仓同步（case 6）**：契约文件迁移/删除必须 grep 全仓同步引用（STRUCTURE.md 目录树 / docs README 索引 / 上游文档引用 / 本 rule 的 globs），残留 = 0；目录结构变更同步 STRUCTURE + README + CONSTITUTION 文档架构表（第6条 删除章节规范同类）
  checks: # 生成后反向 check
    - "INTEGRATION.md 为说明书模式：不复制契约文件的字段级请求/响应表（case 3/4 完成判定）；§2 允许关键接口表＋错误码表（终版较厚形态），但字段级请求/响应表仍归契约文件"
    - "每外部服务对应一份 integration-contracts/ 契约文件（kebab-case），§2 各服务小节可逐个定位"
    - "契约文件含接入方式 + 鉴权 + 关键接口 + 失败处理 + 错误码（契约状态必填）"
    - "外部服务清单与 TECHNOLOGY-ARCHITECTURE §4 一致（引用不重列）"
    - "外部数据源覆盖 DATA-ARCHITECTURE §2/§5.6 中标注的外部数据资产（无遗漏、无臆造）"
    - "每个外部服务的调用方归属应用可在 APPLICATION-ARCHITECTURE §2.2 找到对应（不悬空）"
    - "契约文件字段术语与跨文件引用一致（无 project_id/file_id 类旧术语残留）"
    - "与 API（Inbound）方向不混淆"
    - "数据库/对象存储/缓存未误列为外部集成（infra ≠ integration）"
    - "内容条目无顺序编号（外部服务按服务名标识，不用 EXT-N；2.1 为章节序号，非条目编号）"
    - "无集成时 §1 填「无」、§2 保留标题写「暂无」"
    - "契约文件迁移/删除后全仓 grep 旧名残留 = 0（STRUCTURE/README/上游文档/globs 已同步）"
---

# INTEGRATION — 外部集成说明书（Outbound）

> 本文档是「<项目名>」的 **INTEGRATION（外部集成说明书）**——L3 契约层的本系统调用第三方服务文档。
> 【模板使用指引】复制为 `docs/L3/INTEGRATION.md`，按各章节指引填写；外部服务契约落在 `docs/L3/integration-contracts/`（一服务一文件），本文档只引用不复制。
> 【原则】① **外部集成契约（Outbound）**：本系统调用的第三方服务——微信/支付/AI 供应商（L3 技术契约）；② 与 API（Inbound）互补：API 管"我提供什么"，INTEGRATION 管"我调用什么"，结构对称（说明书 + 契约目录）；③ 表规范见宪法无元信息表、无变更记录。

---

## 1. 外部集成总览

> 【指引】本系统调用的第三方服务清单（供应商 + 用途 + 鉴权方式 + 归属应用）；契约引用与契约状态下沉 §2 各服务小节，本表不重复。

| 外部服务 | 用途   | 鉴权方式 | 归属应用     |
| -------- | ------ | -------- | ------------ |
| <服务名> | <用途> | <鉴权>   | <归属应用名> |

> 【定位】"归属应用"列的值须能在 APPLICATION-ARCHITECTURE §2.2 应用清单中定位到对应应用，不允许悬空应用名。

---

## 2. 集成详情（概览）

### 2.1 <外部服务名>

**接入方式**：<API / SDK / Webhook>

**鉴权**：<AppSecret / Token / 签名>

**契约文件**：`integration-contracts/<service>.md`（接口/字段/错误码查契约，本文档不复制）

**调用方**：<归属应用，见 §1 总览「归属应用」列>

**失败处理**：<超时/重试/降级>（必填，格式：超时<毫秒数>ms/重试<次数>次/降级<策略>，示例：超时5000ms/重试3次/降级返回缓存）

**契约状态**：<mock 中 / 已交付 / 已上线>（与契约文件「契约状态」小节同源，改契约文件后同步）

**关键接口表**（可选，终版较厚形态）：每服务小节允许含「关键接口表＋错误码表」——关键接口表列方法/路径/说明（不列字段级请求/响应），错误码表列错误码/含义；**字段级请求/响应表仍禁止**（归契约文件，本文档不复制）

| 方法     | 路径   | 说明   |
| -------- | ------ | ------ |
| <method> | <path> | <说明> |

**错误码表**（可选）：

| 错误码 | 说明   |
| ------ | ------ |
| <code> | <含义> |

（每个外部服务一小节，补充）

---

## 3. 契约文件目录（可选节）

> 【指引】**可选节**：本节约束 `integration-contracts/` 按外部服务拆分契约文件（一服务一份，kebab-case），字段级契约/语义/错误码以契约为准。**可省略**——契约引用散落 §2 各服务小节时不视为违规；省略时契约文件定位由 §2 各小节「契约文件」行承担。

| 文件                                 | 外部服务 | 契约状态                    |
| ------------------------------------ | -------- | --------------------------- |
| `integration-contracts/<service>.md` | <服务名> | <mock 中 / 已交付 / 已上线> |

> 【维护】① 新增外部服务 → 先建契约文件再更新 §2 各服务小节（若保留本目录节则同步更新本表）；② 契约字段术语变更 → 只改契约文件，说明书不手抄字段；③ 契约文件迁移/删除 → grep 全仓同步引用（STRUCTURE 目录树 / README 索引 / 上游文档），残留 = 0。
