---
name: tools-ops
description: 项目工具集（tools）的变更与调用——为项目落地并演进 Node CLI 工具集（api 契约直调 / webmcp 前端工具序列 / db 业务库只读对账 / ragflow 向量库对账），供 AI 直接调用以了解项目数据与落库对账；是 AI 访问系统资源的唯一通道（test-ops 等 skill 调用它）。触发词：工具、tools、生成工具、新增工具、新增对账工具、调用工具查数据、查库、对账、落库验证、跑接口工具、了解项目数据
---

# tools-ops — 项目工具集（变更 / 调用）

定位：tools 是 AI 访问项目系统的基础设施（小型 Node CLI 项目，实例位于 `docs/tools/`），也是访问系统的唯一入口（根 AGENTS.md
§2.7 系统访问唯一入口）——AI 对系统任何资源的访问（前端页面 / 后端 API / 数据库 / 中间件 / 依赖的外部第三方接口）都必须经它执行；
`test-ops` 执行用例时也经它访问被测系统。访问前先查有哪些可用工具能触达目标；目标无可用工具 → 提醒用户走 §1 新增工具，不得自行旁路（禁裸
curl、裸 SQL、自行开浏览器操作页面、直连中间件、直调第三方接口）。工具只取证据/执行操作，断言由 AI 判断。

本 skill 自带两份资料（模板，不直接运行）：

- 架构规范 [references/tools.md](references/tools.md)——§2 工具分类 / §3 统一契约 / §4 命令形态 / §5 生成原则 / §6
  资产声明与多环境
- 参考实现 [assets/reference-impl/](assets/reference-impl/)——完整工具集样板（tools/{_util,api,webmcp,db,ragflow}.mjs +
  package.json + README + .env.example + .gitignore），含项目特定样例值，按被测系统替换

## 职责边界

- 唯一入口：项目工具集（`docs/tools/`）的生成、维护与调用只经本 skill；AI 访问本系统任何资源也只经它。
- 不做：用例本身的增删改执行与执行台账归 `test-ops` skill；跨文档对齐与漂移归 `align-docs` skill。
- 同步：工具集自身的说明（`docs/tools/TOOLS.md`）由本 skill 自持，不交给其它文档 skill。

## 读取

1. 读 [references/tools.md](references/tools.md) 确认工具分类、统一契约、生成原则与 `docs/tools/` 的预期资产集。
2. 读 `docs/contracts/INBOUND.md` 与 `docs/contracts/openapi/`，确认接口调用面与响应结构——api 工具的契约校验以此为准。
3. 读 `docs/contracts/OUTBOUND.md`，确认外部服务的集成形态与接入方式。
4. 读 `docs/deployment/DEPLOYMENT.md` §2.1 环境矩阵与 §6/§7 变量——环境与变量权威在此，`.env.<环境名>` 是其副本。
5. 读 `docs/tools/TOOLS.md` 与实例 `docs/tools/.env.<环境名>`，确认工具清单、用法、退出码与可用环境。
6. 读 `assets/reference-impl/` 作样板参照，不作运行实例、不引入其中的项目特定样例值。
7. 环境与 DEPLOYMENT 不一致时按 §1 对齐副本，不改 `DEPLOYMENT.md` 本体；源缺失先核实，不臆造连接参数。

## 多环境（连接层核心）

多环境的意义：用同一套工具经 `--env <环境名>` 连接不同环境（如同时连多个环境的 db / mcptools），一次调用绑定一个环境。

工具集按环境隔离连接参数：每个环境一份 `docs/tools/.env.<环境名>`，运行时用 `--env <环境名>` 选择（四工具统一；ragflow
放子命令之后）；无 `--env` 时由 `TEST_ENV` 指定，再无则用默认 `.env`。指定环境但文件不存在 → 工具 fail-fast（退出码
10，不回退默认）；指定环境时只读该文件（不叠加 `.env`）。webmcp 登录态按环境隔离（`.webmcp-profile-<环境名>/`）。

环境与变量的权威来源是 DEPLOYMENT，`.env.<环境名>` 只是其副本：

- 环境清单（有哪些环境、用途）← `docs/deployment/DEPLOYMENT.md` §2.1 环境矩阵
- 各环境连接参数/取值 ← DEPLOYMENT §6（密钥与配置）/ §7（部署资产说明）
- `.env.<环境名>` 是这些值在 tools 侧的副本；与 DEPLOYMENT 不一致时以 DEPLOYMENT 为准（对齐动作走 §1，由用户确认）

## 分诊（进入第一件事）

| 分诊         | 触发                                                                                                     | 动作 |
|--------------|----------------------------------------------------------------------------------------------------------|------|
| 1 工具集变更 | 对 `docs/tools/` 本身的改动（工具实现、环境副本 `.env.<环境名>`、初始化落地）——由 skill 询问用户是否变更 | §1   |
| 2 工具调用   | 用 `--env` 选环境调用工具（AI 直接查数据/对账，ad-hoc）；仅询问用户连哪个环境                            | §2   |

## §1 工具集变更（初始化 / 新增·修改工具 / 环境副本对齐）

1. 询问用户是否要变更：进入本分诊先问「本次要变更什么」（初始化落地 / 新增或修改工具 / 对齐环境副本）——确认后再做，不自动变更
2. 判当前状态并分流：
    - 实例 `docs/tools/` 不存在 → 初始化落地：读架构规范与参考实现，复制整套到 `docs/tools/`
      （保持结构：tools/、package.json、.env.example、.gitignore、TOOLS.md）；按被测系统裁剪 package.json 依赖并改写 README 工具清单
    - 实例已存在 → 增量演进：读架构规范「何时新增工具、何时修改既有工具」——新职责域新增 `tools/<name>.mjs`；同职责域演进改既有工具
3. 新增/修改工具时参照同类工具写实现：操作类参照 api/webmcp，校验对账类参照 db/ragflow（只读 + 受控清理）
4. 遵守统一契约：stdout 单行 JSON、退出码、连接参数走 `.env.<环境名>`、fail-fast 契约校验、只读红线、`--help`；入口调用
   `_util.mjs` 的 `loadDotEnv`（含 `--env` 选择，不自行实现）
5. 环境副本对齐（用户反馈环境有问题、或环境有更新时）：先读 DEPLOYMENT §2.1 环境矩阵与 §6/§7 变量，与 tools 侧现状比对，判断差异类型——
    - 环境矩阵变化（新增/删除/改名环境）→ 增删对应 `.env.<环境名>` 副本
    - 某环境内某变量变化 → 更新该 `.env.<环境名>` 对应键
   - 只更新 tools 侧的 `.env.<环境名>` 副本；不修改 DEPLOYMENT.md 本体（那是 docs，按 `deploy-ops` skill 更新）
6. 配套登记：README 工具清单 + package.json scripts 别名 + `.env.example` 新连接参数（各环境 `.env.<环境名>` 同补）
7. 依赖安装（仅初始化）：`cd docs/tools && npm install`
8. 验证：契约源 `docs/contracts/openapi/` 存在时 `npm run api -- --list --env <环境名>` 能列出 operationId；否则至少
   `npm run <工具> -- --help` 正常；新增/修改的工具对被测系统实跑一次
9. 报告：变更清单（初始化/新增/修改/环境副本）+ 各环境 `.env` 待补充项（连接参数取值见 DEPLOYMENT §6）

## §2 工具调用（AI 直接调工具查数据/对账）

0. 环境确认：读 DEPLOYMENT §2.1 环境矩阵，列出可用环境，问用户本次连哪个环境（未确认不执行）；确认后所有命令统一带
   `--env <环境名>`——禁止漏带（漏带会落到默认 `.env`，可能跑错环境）。用户可指定多个环境分别调用（一次调用绑定一个环境）
1. 读实例 `docs/tools/TOOLS.md`（工具清单/用法/退出码/环境变量）与 `docs/tools/.env.<环境名>`
   （连接参数副本），确认有哪些工具能触达本次目标——目标无可用工具时提示用户走 §1 新增，禁止绕过工具集自行访问（禁裸 curl/裸
   SQL/自行开浏览器/直连中间件/直调第三方）
2. 按需调工具（统一带 `--env <环境名>`；ragflow 的 `--env` 放子命令之后）：
    - `npm run api -- --operation <operationId> [--path/--query/--header/--body/--form ...] --env <环境名>`（后端契约直调）
    - `npm run db -- "<只读 SQL>" --env <环境名>`（业务库落位对账；非只读被拒）
    - `npm run ragflow -- datasets --env <环境名>` / `... chunks --name X --doc-id Y --env <环境名>`（向量库对账）
    - `npm run webmcp -- --list --env <环境名>` / `--seq '[...]' [--headed] --env <环境名>`（前端页面业务能力；登录态按环境隔离）
3. 判断：读 stdout 单行 JSON（含 `env` 字段核对环境是否正确；工具只取证据，断言由 AI 判断）；按退出码区分失败类型（0 成功 / 1
   断言对账失败 / 2 参数 / 3 网络 / 4 数据层 / 10 配置）
4. 环境异常：调用失败若疑为环境副本问题（连不上/变量过时）→ 不自动修，提示用户走 §1 对齐（读 DEPLOYMENT 更新副本）
5. 报告：查询结论 + 所用环境 + 原始证据（JSON）

## 完成判定

格式与结构纪律见根 `AGENTS.md` §2.8，各文档不重复列出；以下为本文档专有判定，全部通过才算完成。

- `docs/tools/` 磁盘内容与 [references/tools.md](references/tools.md) §6 预期资产集逐项对应：`tools/*.mjs`（含
  `_util.mjs`）·
  `package.json` · `TOOLS.md` · `.env.<环境名>`（每环境一份）· `.env.example`，无缺失项，无预期外残留。
- 每个工具可执行且 `--help` 打得通；退出码语义符合 [tools.md](references/tools.md) §统一契约（0 / 1 / 2 / 3 / 4 /
  10），无自造退出码。
- stdout 只输出一行 JSON，人类诊断信息走 stderr；JSON 带本次环境字段。
- 环境选择可用：每条命令带 `--env <环境名>` 能读到对应 `.env.<环境名>`；严格模式不叠加 `.env`；未知环境
  fail-fast（10）并列出可用环境。
- fail-fast 契约校验生效：输入键不在被测契约声明内时发送前报错，并提示可用键清单。
- 只读红线生效：校验/对账类工具拒绝非只读操作；全项目无裸 curl、无裸 SQL。
- `docs/tools/.env.<环境名>` 与 `docs/deployment/DEPLOYMENT.md` §6/§7 的变量一致；不一致已按 §1 对齐，本 skill 不改
  DEPLOYMENT.md 本体。
- `assets/reference-impl/` 只作模板，未被当作运行实例调用。

## 边界

- 唯一入口（根 AGENTS.md §2.7 系统访问唯一入口）：对系统的任何访问都经本工具集；禁旁路（裸 curl / 裸 SQL /
  自行开浏览器操作页面 / 直连中间件 / 直调外部第三方接口）；缺工具走 §1 新增，不自行造通道
- 断言由 AI 判断，工具不内置断言逻辑
- 只读红线：对账/校验类工具非只读操作拒绝；不写裸 curl、不裸 SQL（SQL 包进 db 命令）
- 调用只跑实例 `docs/tools/`；不得运行本 skill `assets/reference-impl/` 副本（那是含项目特定样例值的模板，非运行实例）
- 环境权威在 DEPLOYMENT：环境清单读 §2.1、变量读 §6/§7；`.env.<环境名>` 是其副本，不一致以 DEPLOYMENT 为准
- 只读 DEPLOYMENT：本 skill 不修改 `docs/deployment/DEPLOYMENT.md` 本体（改文档按 `deploy-ops` skill 更新）
- 环境纪律：一次调用绑定一个环境，每条命令必带 `--env`；未知环境会 fail-fast（不回退默认）
- 用例卡的编排执行与写卡规范归 test-ops skill（测试用例唯一入口；资产结构见其 references/test-assets.md，写卡规范见其
  references/case-writing.md）
- 不生成业务代码、不自动 commit/push
