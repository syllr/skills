---
name: tools-ops
description: 项目工具集（tools）的新增 / 删除 / 更新与调用——为项目落地并演进 Node CLI 工具集（webmcp 页面调用 / inbound 接口直调 / outbound 外部接口直调 / db 业务库只读对账 / ragflow 向量库对账），供 AI 直接调用以了解项目数据与落库对账；是 AI 访问系统资源的唯一通道（test-ops 等 skill 调用它）。触发词：工具、tools、生成工具、新增工具、新增对账工具、调用工具查数据、查库、对账、落库验证、跑接口工具、了解项目数据
---

# tools-ops — 项目工具集（变更 / 调用）

定位：tools 是 AI 访问项目系统的基础设施（实例位于 `docs/tools/`），也是访问系统的唯一入口（根 AGENTS.md
§2.7 系统访问唯一入口）——AI 对系统任何资源的访问（前端页面 / 后端 API / 数据库 / 中间件 / 依赖的外部第三方接口）都必须经它执行；
`test-ops` 执行用例时也经它访问被测系统。访问前先查有哪些可用工具能触达目标；目标无可用工具 →
提醒用户走「生成流程」或「更新流程」新增工具，不得自行旁路（禁裸
curl、裸 SQL、自行开浏览器操作页面、直连中间件、直调第三方接口）。工具只取证据/执行操作，断言由 AI 判断。

- 唯一入口：项目工具集（`docs/tools/`）的生成、维护与调用只经本 skill；AI 访问本系统任何资源也只经它。
- 不做：用例本身的增删改执行与执行台账归 `test-ops` skill；跨文档对齐归 `align-docs` skill。
- 同步：工具集文档分两级——`docs/tools/AGENTS.md`（总览：唯一通道 / 工具清单「工具 → 类 → 目录」/ 通用调用约定）与每类的
  `docs/tools/tools/<类>/AGENTS.md`（该类工具一节：环境参数 / 工具参数 / 退出码 / 调用方式，同类工具共用一份）——由本 skill
  生成与更新；
  新增 / 改名 / 删除工具时同步（V2 会在 AI 读到该类 / 工具目录时按需加载对应 AGENTS.md）。
- 维护流程（新增 / 演进工具、环境参数表与 DEPLOYMENT 对齐、共享模块与统一契约）写在本 skill，按项目实情落地到 `docs/tools/`。

## 分诊

本 skill 是项目工具集的唯一入口：一进来先看「分诊」，再进入对应章节。

| 分诊                       | 触发                                                                                               | 进入 |
|----------------------------|----------------------------------------------------------------------------------------------------|------|
| 1 工具集新增 / 删除 / 更新 | 对 `docs/tools/` 本身的改动（工具实现、环境参数与工具参数、初始化落地）——由 skill 询问用户是否变更 | §1   |
| 2 工具集调用               | 按「环境参数」表选环境调用工具（AI 直接查数据/对账，ad-hoc）；仅询问用户连哪个环境                 | §2   |

## §1 工具集新增 / 删除 / 更新

### 读取

- 先定类型：工具共四类——① 页面调用型 `webmcp`（子工具在工程页面代码）；② inbound 接口型（来源 `docs/contracts/inbound/`
  ，inbound-ops）；
  ③ outbound 接口型（来源 `docs/contracts/outbound/`，outbound-ops）；④ 数据 / 中间件直连型（DB / Redis / Kafka / ES /
  对象存储 / 向量库等）。
  系统有对应通道时才落地该类。
- 按类型读该类维护文档——该类怎么读来源、怎么落地、怎么登记、怎么验证都在里面（重复也各自照写）：
  [maintain-webmcp.md](references/maintain-webmcp.md) / [maintain-inbound.md](references/maintain-inbound.md) /
  [maintain-outbound.md](references/maintain-outbound.md) / [maintain-middleware.md](references/maintain-middleware.md)。
- 骨架：总览 [assets/AGENTS.template.md](assets/AGENTS.template.md)（实例 `docs/tools/AGENTS.md`
  ）；每类 [section-webmcp.md](assets/section-webmcp.md) /
  [section-api.md](assets/section-api.md) / [section-outbound.md](assets/section-outbound.md) / [section-middleware.md](assets/section-middleware.md)
  （实例 `docs/tools/tools/<类>/AGENTS.md`，同类工具共用一份）。
- 统一契约见 [references/contract.md](references/contract.md)（每个工具都要满足）。

### 步骤

先问用户本次要变更什么，确认后再做，不自动变更；然后按该工具类型，照对应的 `references/maintain-*.md` 走完（读来源 → 落地 /
更新工具 →
登记 AGENTS → 验证）；完成后报告变更清单（初始化 / 新增 / 修改 / 环境参数表对齐）。

完成判据：按该类维护文档的判据——工具集完整、符合统一契约（[references/contract.md](references/contract.md)）、环境参数表与
`docs/deployment/` 一一对应、总览清单与 `package.json` 的 `scripts`、`tools/<类>/<工具>/` 目录三者一致。

### 联动

- 环境与变量的权威在 `docs/deployment/`，环境清单或连接参数变化时由 `deploy-ops` skill 更新文档，本 skill 对齐 `AGENTS.md`
  的
  各工具环境参数表。
- 契约来源由 `inbound-ops` / `outbound-ops` 维护；跨文档对齐归 `align-docs` skill。

### 边界

- 工具集只落在实例 `docs/tools/`，被测系统的访问一律经它；不预置工具脚本，按项目实情自行落地。
- 只读红线：对账 / 校验类工具拒绝非只读操作。

## §2 工具集调用

### 读取

- 工具集文档分两级：`docs/tools/AGENTS.md`（总览：唯一通道 / 工具清单「工具 → 类 → 目录」/ 通用调用约定）与该工具的
  `docs/tools/tools/<类>/AGENTS.md`（环境参数 / 工具参数 / 退出码 / 调用方式）——调用所需的一切都在这两级里（连接信息与
  DEPLOYMENT 解耦）。
- 单工具的用法 / 子工具 / 序列参数：见其 `--help` 与 AGENTS.md 的对应一节。

### 步骤

1. 确认环境：问用户连哪个环境（或按上下文确定）。
2. 选工具与参数：从 AGENTS.md 的工具清单里选能触达目标的工具，按其「环境参数」表选中该环境那一行；要一次跑多个子工具 /
   步骤时用它自己的
   序列参数编排（如 webmcp 的 `--seq '<JSON 数组>'`）。目标无可用工具 → 提示用户走「生成流程」或「更新流程」新增，禁止旁路（裸
   curl / 裸 SQL / 自行开浏览器 / 直连中间件 / 直调第三方）。
3. 调用：把该行连接参数 + 工具参数拼进命令（具体见 AGENTS.md 与 `--help`）。
4. 判断：读 stdout 单行 JSON，按退出码区分失败类型（0 成功 / 1 断言失败 / 2 参数 / 3 网络 / 4 数据层 / 10 配置）；断言由 AI
   判断，工具只取证据。
5. 报告：结论 + 所用环境 + 原始证据（JSON）。

完成判据：连接参数取自 `docs/tools/AGENTS.md` 的对应环境参数表行；读 stdout 单行 JSON
并核对退出码；断言由 AI 判断、工具只取证据。

### 联动

### 边界

- 系统访问唯一入口（根 `AGENTS.md` §2.7）：对系统的任何访问都经本工具集，禁旁路（裸 curl / 裸 SQL / 自行开浏览器 /
  直连中间件 / 直调第三方）；缺工具走 §1 新增。
- 断言由 AI 判断，工具只取证据；只读红线：对账 / 校验类工具拒绝非只读操作。
