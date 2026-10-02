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

- 骨架：总览 [assets/AGENTS.template.md](assets/AGENTS.template.md)（实例 `docs/tools/AGENTS.md`）；每类
  [section-webmcp.md](assets/section-webmcp.md) / [section-api.md](assets/section-api.md) / [section-outbound.md](assets/section-outbound.md) /
  [section-middleware.md](assets/section-middleware.md)（实例 `docs/tools/tools/<类>/AGENTS.md`，同类工具共用一份）。
- 读 `docs/tools/AGENTS.md`（工具清单 + 各工具的环境参数表与工具参数表 + 退出码 + 调用方式）；单工具用法见其 `--help`。
- 工具类型共四类（系统有对应通道时默认都要有）：① 页面调用型 `webmcp`——子工具定义在工程页面代码（如 `frontend/**/webmcp/`
  ），webmcp
  只做动态调度（`--list` 枚举子工具含 inputSchema、`--seq '<JSON 数组>'` 按 `{name,args}` 顺序调用、跨步保态）；② inbound
  接口型——直调本应用对外接口，
  接口 → 代码映射在 `docs/contracts/inbound/`（inbound-ops）；③ outbound 接口型——调外部系统，接口 → client 代码映射在
  `docs/contracts/outbound/`（outbound-ops）；④ 数据 / 中间件直连型——直连 DB / Redis / Kafka / ES / 对象存储 / 向量库等（如
  `db`）。
  前三类特殊，各有专门来源（新增 / 更新时按来源）；第四类是常规专用工具。
- 读 `docs/deployment/`（各环境 DEPLOYMENT.md：环境清单与连接参数取值），作为环境与变量的权威——环境参数表的行须与之一一对应。

### 步骤

生成与更新走同一条流程：先扫 `docs/tools/` 判断有无既有工具集，有则更新、无则新建；进入前先询问用户本次要变更什么，确认后再做，不自动变更。

1. 扫 `docs/tools/` 判断有无既有工具集或同定位旧产物。
2. 无既有工具集 → 初始化落地：按被测系统在 `docs/tools/` 建工具集——工具实现落在 `tools/<类>/<工具>/`（`<工具>.mjs`），每类一份
   `tools/<类>/AGENTS.md`（该类工具的节）；系统有对应通道时优先落地四类工具（页面调用 / inbound 接口 / outbound 接口 /
   数据·中间件直连），
   共享模块 `tools/_util.mjs`，另有总览 `AGENTS.md`（按 [assets/AGENTS.template.md](assets/AGENTS.template.md)
   生成：工具清单 + 通用调用约定）、
   `package.json`（`scripts` 指向 `tools/<类>/<工具>/<工具>.mjs`）、`.gitignore`；`cd docs/tools && npm install`。
3. 有既有工具集 → 增量演进：新职责域新增工具文件，同职责域演进改既有工具；操作类与只读对账类分别遵循（只读 + 受控清理）。
4. 遵守统一契约（每个工具都要满足）：stdout 只输出一行 JSON、人类诊断走 stderr；退出码 0 成功 / 1
   断言对账失败 /
   2 参数 / 3 网络 / 4 数据层 / 10 配置；连接信息走命令行参数（每个工具用 flag 接收 host / port / user / pass / …
   等）、不读任何配置文件；
   发请求前做 fail-fast 契约校验（输入键不在被测契约声明内即报错并列出可用键）；
   参数一律不给默认值——任一必填参数缺失即 fail-fast（退出码 2），不得用默认值静默兜底；对账 / 校验类只读、拒绝非只读操作；
   调度型工具（本工具自己还会调用一组子工具，如 webmcp 调用页面注册的 WebMCP 子工具）不得把子工具 / 流程的入参摊成本工具的工具参数——
   用通用参数（JSON）携带子工具与入参，子工具各自的名字 / 入参写进 AGENTS.md 的「子工具」一节，预置流程（如 `--flow audio`
   ）的名字与参数写进
   「流程」一节；`--help` 可用。统一契约的具体实现由项目自行落地。
5. 环境参数表与 DEPLOYMENT 对齐（环境有问题或更新时）：读 `docs/deployment/` 各环境 DEPLOYMENT.md，与 AGENTS.md 各工具环境参数表比对——
   环境清单变化（新增 / 删除 / 改名）增删各工具环境参数表的行（Standalone 恒在最前）；连接参数变化更新对应格；只改 AGENTS.md
   的环境参数表，
   不改 `DEPLOYMENT.md` 本体（那按 `deploy-ops`）。
6. 配套登记：新工具建 `tools/<类>/<工具>/` 目录（`<工具>.mjs`）+ 在 `docs/tools/package.json` 的 `scripts` 加
   `npm run <工具>`
   别名（指向 `tools/<类>/<工具>/<工具>.mjs`）+ 在总览 `docs/tools/AGENTS.md` 的清单加一行（工具 / 类 / 说明 / 目录），并在该类
   `tools/<类>/AGENTS.md` 登记「<工具>」一节（用途 / 环境参数表 / 工具参数表 / 退出码 / 调用方式）。
   共享模块：以 `_` 开头的文件（如 `tools/_util.mjs`）不是工具，不入清单。
7. 验证：`npm run <工具> -- --help` 正常；有对外接口时 `npm run api -- --list` 能列出可用接口；新增或修改的工具对被测系统实跑一次。
8. 报告：变更清单（初始化 / 新增 / 修改 / 环境参数表对齐）；连接参数取值以 `docs/deployment/` 各环境 DEPLOYMENT.md 为准（写进
   AGENTS.md 环境参数表）。

完成判据：`docs/tools/` 有完整工具集（每个工具一个 `tools/<类>/<工具>/` 目录 + `package.json` + 总览 `AGENTS.md` + 各类
`AGENTS.md`），无缺失项、无预期外残留；每个工具
`--help` 打得通且符合统一契约（退出码 0 / 1 / 2 / 3 / 4 / 10，无自造退出码；stdout 单行 JSON；连接信息走命令行参数、无配置文件；
fail-fast 契约校验与只读红线生效）；各工具在 `AGENTS.md` 的环境参数表与 `docs/deployment/` 各环境 DEPLOYMENT.md
一一对应、取值一致（Standalone
在最前）；总览 `docs/tools/AGENTS.md` 的工具清单与 `package.json` 的 `scripts`、`tools/<类>/<工具>/` 目录三者一致（每个工具一个
script、一节清单）。

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
