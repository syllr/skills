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
    - "Markdown 表格（总览表/契约文件清单/契约状态）"
  related: # 关联模板与联动修改
    TECHNOLOGY-ARCHITECTURE: "外部依赖见它 §4，选型变化需同步集成；infra 选型见它 §3.1、拓扑见 DEPLOYMENT，非本表"
    APPLICATION-ARCHITECTURE: "应用清单见它 §2.2，集成调用方归属应用需与之一致"
    DOMAIN-MODEL: "外部接口契约触发在 domain/ 各域文档（领域操作）+ 总文档 §5（Mapper/ACL Adapter），集成需与领域模型对齐"
    DATA-ARCHITECTURE: "外部数据资产见它 §2/§5.6，集成需与之一致"
    API: "互补（Inbound vs Outbound），外部服务变化需同步本系统接口；结构对称：API = 说明书 + openapi/，INTEGRATION = 说明书 + integration-contracts/"
    DEPLOYMENT: "外部服务密钥/回调需同步部署配置"
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - "外部服务选择有争议时（如选哪个 AI 供应商）→ 问用户"
  flow: # 生成流程
    - "前置第一步：探测/确认「集成客户端/Adapter 的接口定义（代码）+ 第三方官方 spec」——扫描 integration 层代码（Adapter/Client 接口或骨架）+ 第三方官方 API/SDK 文档；二者是 Outbound 契约的来源（code-first），不能脱离代码与官方 spec 凭空手写"
    - "扫描（自主）：读集成客户端/Adapter 的接口定义（代码）+ 第三方官方 spec + TECHNOLOGY §4 外部依赖（技术外部集成）+ APPLICATION §2.2 应用归属（确认调用方所在应用）+ DOMAIN-MODEL 各域文档领域操作（领域触发的外部接口）+ DATA-ARCHITECTURE §2/§5.6 外部数据资产 + DOMAIN-MODEL 总文档 §5 Mapper（integration 层翻译标准）+ 目标文档；扫描源缺失→以已有源+目标文档为准，不臆造"
    - "已有 INTEGRATION → 参考旧文档有效信息，但结构按本模板重建为「说明书 + 契约目录」；删除原单文档内联的接口/字段详情，迁移为契约文件"
    - "定位文档模式：契约以 integration-contracts/ 为准（每外部服务一份契约文件）；INTEGRATION.md 是说明书（不重复接口清单/字段），承载总览 + 概览 + 契约目录引用"
    - "globs 双触发说明：本 rule 与 CONTRACT rule 的 globs 都含 `docs/L3/integration-contracts/**`——修改契约文件时两者同时触发，属有意分层：本 rule 管说明书（总览/§2 各服务小节同步），CONTRACT rule 管契约文件本身（字段/接口）；各自按职责范围更新，不重复生成"
    - "INDEX.md 判别：globs 命中 `integration-contracts/INDEX.md` 时，由 CONTRACT 侧 INDEX 模板处理（目录唯一入口），本 rule 跳过不生成"
    - "契约来源 = 集成客户端/Adapter 的接口定义（代码）+ 第三方官方 spec；无实现时先在代码中定义客户端接口骨架（接口定义与实现解耦）再导出契约，再生成 INTEGRATION.md 说明书"
    - "按模板生成：§1 外部集成总览 → §2 每服务概览（定位/契约文件/契约状态，不复制接口/字段/错误码）→ §3 契约文件目录（可选节，可省略）"
  notes: # 生成注意点（怎么生成）
    - "只写外部集成契约（Outbound）：本系统调用的第三方服务（微信/支付/AI 供应商等）"
    - "契约来源（code-first）：外部服务契约来自集成客户端/Adapter 的接口定义（代码）+ 第三方官方 spec；无实现时先在代码中定义客户端接口骨架再导出契约（接口定义与实现解耦），不存在脱离代码的手写契约"
    - "契约状态（mock 中/已交付/已上线）保留：表示交付进度，与接口是否已有实现解耦（接口先在代码中定义即可导出，业务逻辑可后补）"
    - "与 API（Inbound）互补：API 管\"我提供什么\"，INTEGRATION 管\"我调用什么\""
    - "数据库/对象存储/缓存属于基础设施（infra 层），不是外部集成（integration 层）——不列入本表，其选型与拓扑见 TECHNOLOGY-ARCHITECTURE §3.1 与 DEPLOYMENT"
    - "集成来源两个维度：①技术外部依赖（TECHNOLOGY §4：基础设施与外部服务清单）+ ②领域外部数据源（DATA-ARCHITECTURE §2/§5.6：外部数据资产），二者并集去重后落地为契约文件；不一致时以 TECHNOLOGY §4 为准"
    - "集成调用方归属应用须在 APPLICATION-ARCHITECTURE §2.2 可定位；integration 层落地的 ACL Adapter 翻译遵循 DOMAIN-MODEL 总文档 §5 Mapper 标准"
    - "契约目录结构（case 1）：双结构对齐 API「说明书 + openapi/」——`INTEGRATION.md`（说明书瘦身）+ `docs/L3/integration-contracts/`（每外部服务一份契约文件）"
    - "一服务一契约文件（case 2）：`<service>.md` kebab-case 服务名（如 llm-api.md/vector-service.md），接口字段级契约/语义/错误码在契约文件，说明书只引用不复制（第2条）"
    - "字段术语见契约文件（case 3）：外部服务契约的字段术语以契约文件为准，本文引用不复制；跨文件术语冲突以契约文件为准（防 project_id/file_id ↔ kb_id/doc_id 类冲突）"
    - "接口清单以契约为准（case 4）：说明书不列接口/字段/错误码——无关键接口表、无错误码表内联，接口/字段/错误码一律查契约文件（契约文件 §3 为调用面接口列表 + §4 三件套）"
    - "契约状态标注（case 5）：契约文件含「契约状态」字段（mock 中 / 已交付 / 已上线），与 §2 各服务小节的契约状态引用一致；mock 实现（如 InMemoryXxxAdapter）切换真实时替换 adapter 业务零改动"
    - "文件迁移/删除全仓同步（case 6）：契约文件迁移/删除必须 grep 全仓同步引用（STRUCTURE.md 目录树 / docs README 索引 / 上游文档引用 / integration-contracts/INDEX.md 清单表 / 本 rule 的 globs），残留 = 0；目录结构变更同步 STRUCTURE + README + CONSTITUTION 文档架构表（第6条 删除章节规范同类）"
  checks: # 生成后反向 check
    - "契约来源为集成客户端/Adapter 的接口定义（代码）+ 第三方官方 spec；无实现时已先在代码中定义客户端接口骨架再导出"
    - "INTEGRATION.md 为说明书模式：不复制契约文件的接口/字段/错误码（§2 无关键接口表/错误码表内联，一律查契约文件）"
    - "每外部服务对应一份 integration-contracts/ 契约文件（kebab-case），§2 各服务小节可逐个定位"
    - "契约文件含集成形态（同构时序图）+ 接入方式（契约状态·接入细节）+ 接口列表（调用面）+ 接口定义（每接口三件套）+ 错误码（全量集中）+ 调用方 + 复杂服务可选节（§7，按需）"
    - "外部服务清单与 TECHNOLOGY-ARCHITECTURE §4 一致（引用不重列）"
    - "外部数据源覆盖 DATA-ARCHITECTURE §2/§5.6 中标注的外部数据资产（无遗漏、无臆造）"
    - "每个外部服务的调用方归属应用可在 APPLICATION-ARCHITECTURE §2.2 找到对应（不悬空）"
    - "契约文件字段术语与跨文件引用一致（无 project_id/file_id 类旧术语残留）"
    - "与 API（Inbound）方向不混淆"
    - "数据库/对象存储/缓存未误列为外部集成（infra ≠ integration）"
    - "内容条目无顺序编号（外部服务按服务名标识，不用 EXT-N；2.1 为章节序号，非条目编号）"
    - "无集成时 §1 填「无」、§2 保留标题写「暂无」"
    - "契约文件迁移/删除后全仓 grep 旧名残留 = 0（STRUCTURE/README/上游文档/INDEX.md/globs 已同步）"
---

# INTEGRATION — 外部集成说明书（Outbound）

> 本文档是「<项目名>」的 INTEGRATION（外部集成说明书）——L3 契约层的本系统调用第三方服务文档。
> 【模板使用指引】复制为 `docs/L3/INTEGRATION.md`，按各章节指引填写；外部服务契约落在 `docs/L3/integration-contracts/`（一服务一文件），本文档只引用不复制。
> 【原则】① 外部集成契约（Outbound）：本系统调用的第三方服务——微信/支付/AI 供应商（L3 技术契约）；② 与 API（Inbound）互补：API 管"我提供什么"，INTEGRATION 管"我调用什么"，结构对称（说明书 + 契约目录）；③ 无元信息表、无变更记录。

---

## 1. 外部集成总览

> 【指引】本系统调用的第三方服务清单（供应商 + 用途 + 鉴权方式 + 归属应用）；契约引用与契约状态下沉 §2 各服务小节，本表不重复。「鉴权方式」列为概览摘要，与契约文件 §2 接入方式同源，改契约后同步。

| 外部服务 | 用途   | 鉴权方式 | 归属应用     |
| -------- | ------ | -------- | ------------ |
| <服务名> | <用途> | <鉴权>   | <归属应用名> |

> 【定位】"归属应用"列的值须能在 APPLICATION-ARCHITECTURE §2.2 应用清单中定位到对应应用，不允许悬空应用名。

---

## 2. 集成详情（概览）

> 【指引】每服务一小节，只承载说明书层信息：一句话定位 + 契约文件引用 + 契约状态。接口/字段/错误码/接入方式/失败策略一律查契约文件（不列接口表、不列错误码表、不复制鉴权与失败处理）。

### 2.1 <外部服务名>

定位：<一句话：这个服务在本系统里干什么>

契约文件：`integration-contracts/<service>.md`（集成形态/接口列表/接口定义/错误码见契约文件）

契约状态：<mock 中 / 已交付 / 已上线>（与契约文件「契约状态」小节同源，改契约文件后同步）

（每个外部服务一小节，补充）

---

## 3. 契约文件目录（可选节）

> 【指引】可选节：本节约束 `integration-contracts/` 按外部服务拆分契约文件（一服务一份，kebab-case），字段级契约/语义/错误码以契约为准。可省略——契约引用散落 §2 各服务小节时不视为违规；省略时契约文件定位由 §2 各小节「契约文件」行承担。

| 文件                                 | 外部服务 | 契约状态                    |
| ------------------------------------ | -------- | --------------------------- |
| `integration-contracts/<service>.md` | <服务名> | <mock 中 / 已交付 / 已上线> |

> 【维护】① 新增外部服务 → 先建契约文件再更新 §2 各服务小节（若保留本目录节则同步更新本表）；② 契约字段术语变更 → 只改契约文件，说明书不手抄字段；③ 契约文件迁移/删除 → grep 全仓同步引用（STRUCTURE 目录树 / README 索引 / 上游文档），残留 = 0。
