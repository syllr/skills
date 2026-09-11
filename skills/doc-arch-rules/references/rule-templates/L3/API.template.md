---
title: API — 接口契约说明书（Inbound）
doc_type: template
layer: L3
description: L3 契约层 文档 API 的更新规范——修改 docs/L3/API.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L3/API.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - "Markdown 表格（导出产物结构/CI pipeline/协议支持表）"
    - "代码块（各语言框架导出命令）"
    - "不使用接口清单表/Action 映射表/能力映射表/字段表"
  related: # 关联模板与联动修改
    DOMAIN-MODEL: "业务语义在 domain/ 各域文档（领域操作 Action 为接口来源；领域事件为下游消费依据），新 Action 需联动出接口；接口契约以代码导出产物为准，与域文档字段语义对齐"
    APPLICATION-ARCHITECTURE: "应用/模块划分在它 §2.2/§3.1，接口归属应用需与之一致（能力→Action 对应见 PRODUCT §2.2「对应 Action」列，省略时按语义推断；Action→聚合归属见域文档 §1/§3；不在应用架构重复）"
    PRODUCT: "能力清单见它 §2.2，接口覆盖能力需与之一致；PRODUCT 标「待规划」的能力不建端点（case A：代码不建路由，导出产物不留 tag/paths/stub）"
    INTEGRATION: "互补（Inbound vs Outbound），接口变化需同步外部集成"
    DEPLOYMENT: "接口上线需同步部署"
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - "协议选型超出默认列表（HTTP/REST 之外的启用协议，或目标语言框架超出 Go/Java-Spring/Python-FastAPI/TypeScript/Node-Express 默认 5 种）→ 问用户"
    - "项目无后端代码 → 与用户确定接口定义并按语言框架落地，在代码中建立接口（路由 + 请求/响应 schema/DTO，业务逻辑可后补），再导出契约；接口定义与实现解耦，先定义接口不影响后续补业务逻辑"
    - "项目技术栈已探测到 → 不问，导出命令只写该语言框架（不写其他语言）"
  flow: # 生成流程
    - "前置第一步：探测/确认「代码 + 语言框架」——扫描项目后端代码与技术栈（package.json/go.mod/pom.xml/pyproject.toml/requirements.txt 等）确定语言框架；契约不能脱离代码凭空手写，必须先定位代码"
    - "有后端代码 → 代码是 SSOT：按语言框架导出 OpenAPI——FastAPI `app.openapi()` / `fastapi-openapi-cli`；Spring springdoc 插件；Go huma / `swag init`；NestJS `@nestjs/swagger`；TS tsoa / zod-to-openapi；Django `manage.py spectacular`；Flask `flask openapi write`"
    - "无后端代码 → 与用户确定接口定义，在代码中建立接口（路由 + 请求/响应 schema/DTO，业务逻辑可后补），再按语言框架导出契约（接口定义与实现解耦，先定义接口不影响后续补业务逻辑）"
    - "扫描（自主）：读导出的 openapi 产物 + 代码路由/schema + domain/ 各域文档（全部 Actions）+ APPLICATION-ARCHITECTURE §2.2/§3.1 + PRODUCT §2.2 + 目标文档"
    - "定位文档模式：契约以代码导出的 openapi 产物为准；API.md 是说明书（不重复接口清单/字段），承载「契约导出与维护规范 + CI 防漂移」"
    - "已有 API → 参考旧文档有效信息，但结构按本模板重建为说明书模式；删除原接口清单/接口详情章节；迁移为导出产物结构 + 语言框架导出命令 + CI pipeline + 协议支持表"
    - "二部图校验：a) 每个接口向上追溯到 PRODUCT §2.2 至少一个能力；b) 该能力承载的聚合至少含一个 Action 与接口语义对应（双向对齐；能力→Action 对应见 PRODUCT §2.2「对应 Action」列，省略时按语义推断；Action→聚合归属见域文档 §1/§3）"
    - "按模板生成：§1 导出产物文件结构 → §2 从代码导出契约（仅写探测/选定语言框架的导出命令，不写其他语言）→ §3 维护规范 → §4 CI 防漂移 pipeline → §5 协议支持表"
  notes: # 生成注意点（怎么生成）
    - "代码是 SSOT，契约（openapi 产物）是从代码导出的产物——禁止「先手写 yaml、再由 yaml 生成代码」的反向流程（方向反了即悬空 $ref 与漂移的根因）"
    - "契约一律从代码导出（权威、唯一基准）：接口定义（路由 + 请求/响应 schema/DTO）与业务逻辑实现解耦——即使业务逻辑未写，也先在代码中定义接口再导出契约，业务逻辑后补；不存在脱离代码的手写契约"
    - "L4 测试用例（API 卡/FLOW 卡）断言三源（状态码取 responses、字段取响应 schema、错误码实测）一律以代码导出的契约为准"
    - "x-action/x-capability 等扩展标注在代码里声明（如 FastAPI `openapi_extra` / Pydantic `json_schema_extra`），随导出进入契约，不手工改 yaml"
    - "接口字段/校验/错误码一律查导出产物，本文档不复制、不手抄"
    - "说明书四要素：导出产物文件结构 + 语言框架导出命令 + 维护规范 + CI 防漂移 pipeline"
    - "目标语言框架确定：同 flow 前置探测；最终文档只写选定语言框架的导出命令，不写其他语言（避免文档膨胀 + 与项目无关）"
    - "其他协议（gRPC/WebSocket/私有协议）用协议支持表中的占位行表达；启用时各自维护 .proto / 自定义 IDL 文件"
    - "鉴权方案/字段级契约/错误响应以 JSON Pointer 引用导出产物节点，文档内不展开"
    - "接口来自领域操作（Action），与 domain/ 各域文档一一对应（用于校验覆盖完整性，不写入正文表）"
    - "接口按 endpoint（方法+路径）标识，不用顺序编号"
    - "只写说明书四要素，技术契约细节在导出产物"
    - "PRODUCT 待规划能力不建端点（case A）：PRODUCT 标「待规划」的能力，代码不建路由、导出产物不留 tag/paths/stub——仅 PRODUCT 保留待规划标注"
    - "导出产物与代码同步（本模板约定，与 case A 同族）：代码路由/schema 变化后重新导出，产物随之更新；删除端点在代码移除并在 yaml 注释留痕指向 ADR 记录原因（如「auth 路由已随 <能力> 待规划移除，见 ADR-NNNN」），保证代码与导出产物一致可机检"
    - "CI 防漂移 pipeline 硬约束：第 5 步契约导出漂移检测的导出命令与 diff 目标必须为同一语言框架产物，禁止跨语言混用；第 3 步 bundle 允许失败（仅打包）"
  checks: # 生成后反向 check
    - "协议支持表含默认 HTTP/REST（指向导出产物）+ 其他协议占位（gRPC/WebSocket/私有协议）"
    - "契约由代码导出（唯一基准，无脱离代码的手写契约）"
    - "接口尚未定义时，已先在代码中定义接口（路由 + 请求/响应 schema/DTO，业务逻辑后补）再导出契约"
    - "接口契约与代码导出的 openapi 产物一致（无字段漂移：API.md 引用与导出产物节点逐项对得上）"
    - "接口覆盖 domain/ 各域文档全部 Action（1 Action 可对应 1+ 接口，无遗漏）"
    - "每个接口可追溯到 PRODUCT §2.2 至少一个能力，能力承载的聚合含对应 Action（能力→Action 对应见 PRODUCT §2.2「对应 Action」列，省略时按语义推断；Action→聚合归属见域文档 §1/§3）"
    - "接口来源能力在 PRODUCT §2.2 能力清单存在且能力状态已确认"
    - "PRODUCT 标「待规划」的能力无端点（代码无路由、导出产物无 stub/tag/paths）"
    - "导出产物与代码一致（重新导出后 git diff 无差异；删除端点已在代码移除并指向 ADR）"
    - "导出产物结构符合 §1（导出默认单文件；多文件拆分由导出+拆分脚本生成，无手工维护的悬空 $ref）"
    - "字段级契约不与 domain/ 各域文档 业务语义冲突"
    - "与 INTEGRATION（Outbound）方向不混淆"
    - "内容条目无顺序编号（接口按 endpoint 标识，不用 API-N）"
    - "§2 只含目标语言框架导出命令（探测/选定语言，不含其他语言的导出命令）"
    - "说明书含 CI 防漂移 pipeline（lint/spectral/bundle/breaking/契约导出漂移 5 步齐备）"
    - "无接口字段表重复（字段一律引用导出产物，无 Action 映射表/能力映射表/字段表/接口清单表）"
---

# API — 接口契约说明书（Inbound）

> 本文档是「<项目名>」的 API（接口契约说明书）——L3 契约层的 `openapi` 导出产物使用说明书。
> 【模板使用指引】复制为 `docs/L3/API.md`，按各章节指引填写。
> 【原则】① 说明书定位：本文档不重复接口字段/校验/错误码——生成/维护规则见模板 generation 元数据（生成 rule 时注入），字段一律查 `docs/L3/openapi/openapi.yaml`（代码导出产物）；② 代码是 SSOT、契约一律从代码导出：接口定义与业务逻辑实现解耦——未写业务逻辑时先在代码中定义接口（路由 + 请求/响应 schema/DTO）再导出，业务逻辑后补；不存在脱离代码的手写契约；③ 默认协议与契约落点：默认 HTTP/REST，机器可读契约由代码导出到 `docs/L3/openapi/`（OpenAPI 3.1），本文档只承载导出命令 + 维护规范 + CI 防线 + 协议支持表。

## 1. 导出产物文件结构

> 【指引】导出默认单文件；如需多文件拆分，必须由导出命令 + 拆分脚本生成（非手工维护），`openapi.yaml` 顶层只承载元信息与 `$ref` 引用。

| 文件                                | 作用                                                                                                                                               | 端点计数 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `docs/L3/openapi/openapi.yaml`      | 主契约（导出产物；默认单文件，多文件时 paths 用 `$ref` 聚合拆分文件）                                                                              | —        |
| `paths/<domain>.yaml`               | 端点定义拆分文件（由拆分脚本按业务域拆分，每文件行标注端点数）                                                                                     | <N>      |
| `components/schemas/*.yaml`         | 类型定义拆分文件（口径二选一：全部 schema 收敛本目录，或 paths 文件可含本地 components——由拆分脚本决定，选定后全篇一致，API.md §1 表按实际口径写） | —        |
| `components/responses/*.yaml`       | 错误响应拆分文件                                                                                                                                   | —        |
| `components/securitySchemes/*.yaml` | 鉴权方案拆分文件                                                                                                                                   | —        |

> 【指引】端点计数：`paths/<domain>.yaml` 每文件行标注该文件定义的端点数（`<N>`，由拆分脚本生成）；端点计数须与 `openapi.yaml` 文件尾注释块一致，增删端点后重新导出即同步。

### openapi 目录组织约定

> 【指引】`openapi/` 目录按「导出产物基座 + 拆分文件」组织（由导出命令 + 拆分脚本产出，非手工维护）：`openapi.yaml` 只承载元信息与 `$ref` 引用，不内联任何 path/schema 定义。以下结构由拆分脚本生成。

- `openapi.yaml` 头部结构：`info`（标题/版本）+ `servers`（环境地址）+ `tags`（业务域标签）+ `security`（全局鉴权声明）；作为只承载 `$ref` 的契约基座，`paths` 与 `components` 一律用 `$ref` 指向拆分文件，不直接写定义。
- 文件尾端点计数注释块：`openapi.yaml` 文件末尾以注释块汇总各 `paths/<domain>.yaml` 的端点数（如 `# paths: auth=3, order=5, payment=2 → 合计 10`），与 §1 表「端点计数」列一致，供机检。
- `paths/<domain>.yaml` 文件头注释块：每个 paths 文件顶部注释块标注：① 依据来源（对应 domain/ 各域文档 哪个域/哪些 Action）；② 边界（本文件覆盖的端点范围）；③ `x-action` 汇总（本文件所有 operation 的 Action 来源清单）。
- 主文件 `paths` 用 path item 级 `$ref` 聚合：`openapi.yaml` 的 `paths` 下每个 path 用 path item 级 `$ref` 指向拆分文件（如 `/orders/{id}`: `$ref: './paths/order.yaml#/paths/~1orders~1{id}'`）；`~1` 为 `/` 的转义写法（`~0` 为 `~`），`$ref` 中路径分隔符必须用 `~1` 转义。
- 拆分由脚本完成：多文件结构一律由导出 + 拆分脚本产出（脚本基于导出产物切分），禁止手工编辑拆分文件造成悬空 `$ref`；单文件导出时本节约定的拆分文件不存在，§1 表按实际（单文件）缩减。

## 2. 从代码导出契约

> 【指引】目标语言框架确定：前置探测项目后端代码与技术栈（package.json/go.mod/pom.xml/pyproject.toml/requirements.txt 等）→ 探测到用该语言框架；无代码时与用户讨论接口定义与实现方案并确认框架。生成时只保留选定语言框架小节，删除其他小节（实例文档只写最终语言的导出命令）。导出命令以仓库根为 cwd；命令调整（路径/输出文件名/包名）后须同步更新本节与 §4 step5。

> 【指引】以下为各语言框架导出命令参考（模板持有，生成时选用一种后删除其他）。每框架仅列：依赖 / 导出 / 产物 三行 + 官网链接；产物路径须与 §4 step5 diff 目标一致。

### 2.1 Go（huma / swaggo `swag init`）

- 依赖：huma `go get github.com/danielgtaylor/huma/v2`；swaggo `go install github.com/swaggo/swag/cmd/swag@latest`
- 导出：huma 由 `huma.OpenAPI()` 在运行时暴露 `/openapi.json`，用 `curl` 拉取落地；swaggo `swag init -g cmd/server/main.go -o docs/L3/openapi`
- 产物：OpenAPI 文档（产物路径须与 §4 step5 diff 目标一致）
- 官网：https://github.com/danielgtaylor/huma / https://github.com/swaggo/swag

### 2.2 Java-Spring（springdoc 插件）

- 依赖：springdoc-openapi（`springdoc-openapi-starter-webmvc-ui`）+ `springdoc-openapi-maven-plugin`
- 导出：`mvn springdoc-openapi:generate`（插件读取运行时端点，输出 OpenAPI 文档）
- 产物：`docs/L3/openapi/openapi.yaml`（或插件配置的 outputDir/outputFileName，产物路径须与 §4 step5 diff 目标一致）
- 官网：https://springdoc.org

### 2.3 Python-FastAPI（`app.openapi()` / `fastapi-openapi-cli`）

- 依赖：FastAPI 自带；或 `pip install fastapi-openapi-cli`
- 导出：`python -m scripts.export_openapi > docs/L3/openapi/openapi.yaml`（脚本内 dump `app.openapi()`）；或 `fastapi-openapi-cli docs/L3/openapi/openapi.yaml`
- 产物：`docs/L3/openapi/openapi.yaml`（产物路径须与 §4 step5 diff 目标一致）
- 官网：https://fastapi.tiangolo.com

### 2.4 Python-Django（`manage.py spectacular`）

- 依赖：drf-spectacular（加入 `INSTALLED_APPS`）
- 导出：`python manage.py spectacular --file docs/L3/openapi/openapi.yaml`
- 产物：`docs/L3/openapi/openapi.yaml`（产物路径须与 §4 step5 diff 目标一致）
- 官网：https://drf-spectacular.readthedocs.io

### 2.5 Python-Flask（`flask openapi write`）

- 依赖：flask-smorest / apispec（`flask openapi` 命令由 flask-smorest 提供）
- 导出：`flask openapi write docs/L3/openapi/openapi.yaml`
- 产物：`docs/L3/openapi/openapi.yaml`（产物路径须与 §4 step5 diff 目标一致）
- 官网：https://flask-smorest.readthedocs.io

### 2.6 TypeScript（tsoa / zod-to-openapi）

- 依赖：`npm i -D tsoa`（或 `@asteasolutions/zod-to-openapi`）
- 导出：tsoa `npx tsoa spec`（按 tsoa.json 配置输出）；zod-to-openapi 用脚本调 `registry.generateDocument()` 后写文件
- 产物：`docs/L3/openapi/openapi.yaml`（tsoa 默认 `build/swagger.json`，产物路径须与 §4 step5 diff 目标一致）
- 官网：https://tsoa-community.github.io/docs/ / https://github.com/asteasolutions/zod-to-openapi

### 2.7 Node-NestJS（`@nestjs/swagger`）

- 依赖：`npm i @nestjs/swagger`
- 导出：脚本内 `const doc = SwaggerModule.createDocument(app, config)` 后写入 `docs/L3/openapi/openapi.yaml`（应用启动后导出）
- 产物：`docs/L3/openapi/openapi.yaml`（产物路径须与 §4 step5 diff 目标一致）
- 官网：https://docs.nestjs.com/openapi/introduction

## 3. 契约维护规范

> 【指引】契约（导出产物）的变更入口是代码；本文档只承载规则，不写字段。

- 改接口 → 先改代码（路由/schema/校验/错误码），再重新导出契约（见 §2 导出命令）
- 契约一律从代码导出（唯一基准）：接口定义（路由 + 请求/响应 schema/DTO）与业务逻辑实现解耦——业务逻辑未写时先在代码中定义接口再导出，业务逻辑后补；不存在脱离代码的手写契约
- L4 测试用例（API 卡/FLOW 卡）断言三源（状态码取 `responses`、字段取响应 schema、错误码实测）一律以代码导出的契约为准
- API.md 不手抄字段；查契约看导出产物
- 协议：默认 HTTP/REST（OpenAPI 3.1），gRPC/WebSocket/私有协议占位待启用
- operation 机检元数据：每个 operation 必带 `x-action` 标注来源 Action（对应 domain/ 各域文档 §3 领域操作）、`x-capability` 标注归属能力（对应 PRODUCT §2.2）——这些扩展在代码里声明（如 FastAPI `openapi_extra` / Pydantic `json_schema_extra`），随导出进入契约，不手工改 yaml
- 豁免映射：无领域 Action 的端点（如认证/系统支撑类）取单值 capability 标注 `x-capability`（如 `x-capability: auth` / `x-capability: system`），`x-action` 可省略或标注 `x-action: system`，保证每个 operation 至少可追溯到能力
- 路径参数约定：路径参数原型格式不硬编码 `pattern`（避免与具体实现耦合），仅以 `description` 标注参数语义/约束，校验规则下沉代码 schema（随接口导出）

## 4. CI 防漂移 pipeline

> 【指引】5 步流水线在 PR 阶段阻断契约漂移；第 4/5 步失败必须修改 PR，不得 `--no-verify` 跳过。

| 步骤               | 工具                                                                                                                                                                                                                                                                                                                          | 作用           | 失败动作  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------- |
| 1 lint             | `npx @redocly/cli lint`                                                                                                                                                                                                                                                                                                       | 语法规范       | exit 1    |
| 2 spectral         | `npx @stoplight/spectral-cli lint`                                                                                                                                                                                                                                                                                            | 团队规则       | exit 1    |
| 3 bundle           | `npx @redocly/cli bundle`                                                                                                                                                                                                                                                                                                     | 合并多文件     | warn-only |
| 4 breaking         | `oasdiff breaking --fail-on ERR`                                                                                                                                                                                                                                                                                              | 防破坏变更     | exit 1    |
| 5 契约导出漂移检测 | `<§2 选定语言框架导出命令> && git diff --exit-code -- <§2 导出产物路径>`（如 FastAPI：`python -m scripts.export_openapi > docs/L3/openapi/openapi.yaml && git diff --exit-code -- docs/L3/openapi/openapi.yaml`；Go swaggo：`swag init -g cmd/server/main.go -o docs/L3/openapi && git diff --exit-code -- docs/L3/openapi`） | 契约与代码同步 | exit 1    |

> 【指引】占位 `<§2 选定语言框架导出命令>`/`<§2 导出产物路径>` 按 §2 该语言框架小节替换，二者指向同一语言框架产物（单文件导出指向该文件，多文件拆分指向 `docs/L3/openapi/` 目录；同语言硬约束见模板 generation notes）。

## 5. 协议支持表

> 【指引】本系统对外接口按协议维度拆分契约文件。默认启用 HTTP/REST（OpenAPI 3.1），其他协议占位待启用时各自维护 IDL/规范文件。

| 协议      | 规范文件                                   | Schema 形态     | 工具链                          | 状态         |
| --------- | ------------------------------------------ | --------------- | ------------------------------- | ------------ |
| HTTP/REST | `docs/L3/openapi/openapi.yaml`（导出产物） | OpenAPI 3.1     | 代码导出命令 / Redoc / Spectral | 默认，已启用 |
| 其他协议  | 各自 `.proto`/IDL，启用时增行              | protobuf/自定义 | protoc / buf / 自定义           | 占位         |

> 【维护】状态变更：协议启用/下线时同步更新本表；启用协议需独立维护对应规范文件作为该协议契约，API.md 只索引不复制。
