---
title: TEST-PLAN — 测试计划与测试资产规范
doc_type: template
layer: L4
description: 测试资产（docs/test/ 目录）维护规范——测试用例卡的生成/更新与执行通道纪律（全部经测试工具集）。编辑 docs/test/test-tools/ 或 docs/test/test-cases/ 下文件时触发；规范两类用例卡（API 接口卡按领域实体分组、FLOW 流程卡按 USER-STORY 场景分组）的生成。测试工具集本身的架构/生成/维护/执行归 test-tools skill。可选用例承载形态：docs 文档（TEST-PLAN 总文档 + testcases/）或 docs/test/ 资产目录——本项目以 docs/test/ 资产形态落地（不生成 docs/L4/TEST-PLAN.md 文档）。
globs:
  - "docs/test/**"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - "Markdown 用例卡（Case 结构：前置/执行/期望/数据对账/清理；FLOW 卡含 Gherkin 场景声明 + mermaid 执行蓝图）"
    - "测试工具 CLI 命令（契约直调 / 前端工具序列 / 数据对账）"
  related: # 关联文档与联动修改（= 改本文档前必读）
    USER-STORY: "docs/L1/USER-STORY.md——FLOW 卡按用户故事场景分组，场景 AC 是期望结果来源"
    DOMAIN-MODEL: "docs/L2/domain/DOMAIN-MODEL.md——API 卡按领域实体分组；实体/约束/状态机变化需联动用例"
    API/openapi: "docs/L3/openapi/——接口契约导出产物（代码导出），用例「接口/期望结果」的信息源；断言基准以代码导出的契约为准；端点/x-action 变化需同步受影响 API 卡"
    BUSINESS: "docs/L1/BUSINESS.md——能力状态；待规划能力不建端点不落用例卡"
    DEPLOYMENT: "docs/L4/DEPLOYMENT.md——环境矩阵/密钥/种子账号来源"
    测试工具: "docs/test/test-tools/——工具命令/退出码/.env（用例卡执行通道，工具语法解释归工具 README 不落卡）"
  ask_user:
    - "新领域实体/用户故事场景对应目录划分不清晰 → 问用户"
  flow:
    - "扫描（自主）：读 USER-STORY（场景）+ domain 文档（实体/聚合）+ openapi（端点/operationId/schema，以代码导出的契约为准）+ 测试工具（test-tools README）+ 现有 docs/test/test-cases/"
    - "已有用例 → 参考旧用例有效信息；AI 判断本次是新增还是更新（可合并则合并更新，需拆则新增 Case/卡）——判断有歧义时问用户拍板"
    - "按模板生成：用例卡头（API=接口+业务对象 / FLOW=USER-STORY 场景+主入口 URL）→ Case N 五段（前置条件/执行流程/期望结果/数据对账/数据清理）"
    - "落盘 docs/test/test-cases/api/<实体>/ 或 flow/<场景>/"
  notes:
    - "可重复性：Case 前置自包含（造数据 → 被测操作），禁止复用既有数据；有数据场景先建后查、无数据场景唯一标识；每个 Case 自清理"
    - "命令完整性：每条命令完整可执行（全字段字面量参数）；禁止「公共部分+差异」拼图、禁止占位参数描述"
    - "零教学文字：卡内不写工具语法解释/章节职责说明/行为解释注释——只留命令 + 步骤间信息流"
    - "断言三源（基准为代码导出的契约）：状态码只从 openapi responses 取；断言字段从响应 schema 取；具体错误码值实测校准（BAD_REQUEST 字段级 / RULE_VIOLATION_R<N> 规则级）"
    - "执行通道：全部走测试工具（api/db/webmcp/ragflow）——不写 curl、不裸 SQL（SQL 包进 db 命令）、不写裸命令"
    - "目录分组：API 卡目录 = domain 实体名（kebab，与 domain 文档实体一致）；FLOW 卡目录 = USER-STORY 场景名（kebab）"
    - "清理三态：造数据的 Case 清理节写清各层兜底（正常接口删除 → 数据层级联删 → 外部依赖/中间件残留清理），兜底层以项目实际数据落位为准"
    - "环境 host 不写死：前端主入口用 {WEBMCP_URL}/<path>（host 走工具 .env）；工具连接参数引用工具 .env 与 DEPLOYMENT"
  checks:
    - "结构机检：每卡为「头 + Case N（五段）」结构，五段齐全"
    - "内容机检：无占位参数描述；无指向已删 TEST-PLAN 文档的 § 引用"
    - "目录机检：卡文件在对应实体/场景目录，目录名与 domain 实体/USER-STORY 场景一致"
    - "清理机检：造数据的 Case 含三态清理"
---

## 测试资产结构（模板基准）

```
docs/test/
├── test-tools/                  # 测试工具（bash 宿主 CLI）
│   ├── tools/{api,webmcp,db,ragflow,_util}.mjs
│   ├── .env（不入库，host/DB/RAGFlow 连接）· .env.example
│   └── README.md（工具用法/退出码/环境变量）
├── test-cases/                  # 测试用例（AI 执行器的直接输入）
│   ├── api/<领域实体>/           # API 卡按 domain 实体分组
│   └── flow/<USER-STORY 场景>/   # FLOW 卡按用户故事场景分组
└── test-records/                # 测试记录（执行发现的问题台账：用例卡/被测代码/工具/环境）
```

> 可选形态：测试计划与用例可承载为 docs 总文档 + testcases/（原文档形态）或 docs/test/ 资产目录（本模板基准形态）——项目以 docs/test/ 资产落地时生成上述结构，不生成 docs 测试计划文档。本 rule 的附属资产目录 `test-asset/`（用例卡模板 api-case/flow-case）随 rule 生成同步复制到 `.omo/rules/docs/test-asset/`（rule 同级上层的资产目录）——生成用例卡时以项目本地该目录为模板来源（相对链接以 `../test-asset/` 指向它），目录缺失时按同目录 rule 重新生成。测试工具集不在 test-asset 内——其架构规范/参考实现/生成维护执行归 test-tools skill。

## 测试工具集（执行通道）

用例卡的所有操作必须经测试工具集（`docs/test/test-tools/`）执行——不允许绕过（不写 curl、不裸 SQL、不用其它通道直连被测系统）。工具只取证据/执行操作，断言由 AI 判断。

测试工具集的架构规范、参考实现、生成/维护/执行方法在 test-tools skill（本 rule 与 test-asset 不重复）——需要生成/维护测试工具、或直接调用工具查数据/对账时，先加载 test-tools skill，读其 `references/test-tools.md`（架构/契约/生成原则）与 `assets/reference-impl/`（参考实现）。工具语法/退出码/环境变量见实例 `docs/test/test-tools/README.md`；连接参数取实例 `.env`（host 不写死，取值见 DEPLOYMENT）。

## 用例卡模板与执行通道（生成时以项目本地 test-asset/ 为源，复制骨架仅替换业务值）

- API 卡模板：[test-asset/api-case.md](../test-asset/api-case.md)——复制为 `docs/test/test-cases/api/<领域实体>/API-<模块>-<序号>.md`
- FLOW 卡模板：[test-asset/flow-case.md](../test-asset/flow-case.md)——复制为 `docs/test/test-cases/flow/<场景>/FLOW-<模块>-<序号>.md`
- 执行通道：全部走测试工具集（`docs/test/test-tools/`）——工具集的架构/生成/维护/执行见 test-tools skill，本 rule 不重复

生成/更新卡时复制对应模板文件骨架（头 + Case N 五段），将占位符替换为目标业务值；格式细节（占位语义/纪律）以卡模板内注释与下方硬性要求为准。

## 硬性要求（生成/更新时）

- 可重复性：Case 前置自包含，禁止复用既有数据；有数据先建后查、无数据唯一标识；每 Case 自清理
- 命令完整性：全字段字面量，禁占位参数描述、禁「公共部分+差异」拼图
- 零教学文字：工具语法解释/章节职责说明/行为解释注释不入卡
- 断言三源（基准为代码导出的契约）：状态码只从 responses 取、字段从响应 schema 取、错误码值实测校准
- 执行通道全走测试工具；host 经工具 .env 不写死
- 目录分组与领域概念一致（API=domain 实体、FLOW=USER-STORY 场景），不造概念
- 清理三态：造数据 Case 必须三层齐全
- 关联：openapi（代码导出产物）变化 → 更新受影响 API 卡；USER-STORY 场景变化 → 受影响 FLOW 卡
