# test-tools — AI 测试执行 CLI 工具集

AI 作为测试执行器时的连接工具（Node `.mjs`，跨平台零编译）。

两类工具框架（第一类模拟用户操作 / 第二类取证据对账）：第一类 = 模拟用户操作（WebMCP 工具，宿主 `chrome`，走 `frontend/src/webmcp/` 注册）；第二类 = 取证据/对账（本目录，宿主 `bash`）。工具只取证据，断言由 AI 判断。

## 工具清单（按业务划分，各自独立）

| 工具                | 干什么                                                                                    | 对应入口           | 依赖                                                              |
| ------------------- | ----------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| `tools/api.mjs`     | 调用被测后端接口——swagger-client 运行时直读契约，按 operationId 执行                  | 入口① 后端契约直调 | `swagger-client` + `@redocly/cli`（bundle 契约）                  |
| `tools/webmcp.mjs`  | 驱动前端页面业务工具——playwright-core 驾驶本机 Chrome，页面上下文执行 WebMCP 工具序列 | 入口② 前端 WebMCP  | `playwright-core`（channel:'chrome' 用本机 Chrome，免下载浏览器） |
| `tools/ragflow.mjs` | 对账 RAGFlow（知识库/文档/chunks 落位）                                               | 入口③ 数据验证     | 零依赖                                                            |
| `tools/db.mjs`      | MySQL 只读查询（业务库落位对账）                                                      | 入口③ 数据验证     | `mysql2`                                                          |

> MinIO/临时盘/`.eml`（文件级对账）不在此列——用通用 shell（`ls`/`cat`/MinIO CLI）。

## 环境变量

| 变量                                              | 工具    | 说明                                                                                                                             |
| ------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `API_BASE`                                        | api     | （可选）后端 base URL 覆盖，如 `http://192.168.1.225:8000/api/v1`；缺省用契约 `servers` 默认值（`http://localhost:8000/api/v1`） |
| `API_TOKEN`                                       | api     | Bearer token（先 `--operation authLogin` 获取后注入，也可 `--token` 传参）                                                       |
| `HTTP_TIMEOUT_MS`                                 | api     | （可选）请求超时，默认 30000                                                                                                     |
| `WEBMCP_URL`                                      | webmcp  | （可选）默认目标页面 `http://192.168.1.225:8080`                                                                                 |
| `WEBMCP_TIMEOUT_MS`                               | webmcp  | （可选）工具单步执行超时，默认 30000                                                                                             |
| `RAGFLOW_BASE_URL`                                | ragflow | 如 `http://192.168.1.225:9380/api/v1`                                                                                            |
| `RAGFLOW_API_KEY`                                 | ragflow | RAGFlow API key                                                                                                                  |
| `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASS`/`DB_NAME` | db      | 测试库连接参数                                                                                                                   |

> 连接参数取值见本文件 .env.example 与 DEPLOYMENT §6。
>
> **`.env` 支持**：四个工具入口均自动加载 `test-tools/.env`（模板见 `.env.example`，已 gitignore 凭据不入库）——`API_BASE`/`RAGFLOW_*`/`DB_*`/`WEBMCP_URL` 配一次全程共用，命令行注入的环境变量优先于 `.env`。`.env` 缺省时不加载，api 按契约 `servers` 默认值（localhost:8000）执行。

## 退出码约定（全工具统一）

| 码  | 含义                                                                                   |
| --- | -------------------------------------------------------------------------------------- |
| 0   | 执行成功（HTTP 2xx / 查询成功，含空结果）                                              |
| 1   | 执行成功但对账/断言失败（HTTP 非 2xx 业务失败、知识库/chunks 不存在、非只读 SQL 被拒） |
| 2   | 参数或用法错误（看 `--help`；operationId 不存在、参数非法 JSON 同此）                  |
| 3   | 网络层失败（连不上/超时/TLS；webmcp 的浏览器启动/连接失败同此）                        |
| 4   | MySQL 连接/查询失败                                                                    |
| 10  | 配置错误（缺环境变量/鉴权/契约 bundle 失败/modelContext 不可用）                       |

输出契约：stdout 只输出一行 JSON（AI 据此判断），人类诊断走 stderr。

## api 工具：契约直调（operationId 模式）

运行时直读 `docs/L3/openapi/`（OpenAPI 3.1 多文件）：首次调用自动 `redocly bundle` 并缓存到 `.cache/openapi-bundled.json`（源 yaml 变更才重新 bundle，对 AI 透明），swagger-client 解析后按 `operationId` 执行——AI 只需给 operationId + 扁平参数值，参数按契约自动归位 path/query，`requestBody` 单独传；operationId 拼错或参数非法 JSON 均 fail-fast（退出码 2），不发脏请求。

```bash
# 列出契约全部 operationId（50 端点，含 method/path/summary）
npm run api -- --list

# 登录拿 token（后端起着时真实调用）
npm run api -- --operation authLogin --body '{"username":"admin","password":"<见 DEPLOYMENT §6>"}'
#   → {"ok":true,"status":200,"operation":"authLogin","data":{"accessToken":"..."}}（注入后续调用）

# 列项目（扁平 query 参数）
API_TOKEN=<token> npm run api -- --operation listProjects --query '{"keyword":"TEST-","pageSize":10}'

# 创建项目（请求体字段以 openapi 契约 CreateProjectRequest 为准）
API_TOKEN=<token> npm run api -- --operation createProject --body '{"auditUnit":"某审计单位","auditedUnit":"某被审单位","auditType":"epc_engineering"}'
```

> 跨环境执行：`API_BASE=http://192.168.1.225:8000/api/v1 npm run api -- --operation ...`（standalone 本地可不设，默认 localhost:8000）。

## webmcp 工具：前端页面业务能力（WebMCP 通道）

playwright-core 驾驶本机 Chrome（`channel:'chrome'`，免下载浏览器），加载目标页面后在页面上下文执行 WebMCP 工具序列——等价浏览器内 agent 调用链路（`executeTool` → 工具 run → store/api 层 → 后端）。启动参数自动注入 WebMCP 测试面（`--enable-features=WebMCPTesting,DevToolsWebMCPSupport`）与非 localhost 的 SecureContext 放宽，对 AI 透明。

```bash
# 枚举页面注册的全部工具（含 description）
npm run webmcp -- --list

# 工具序列：同页面顺序执行（会话保持——login 后续工具自动带会话）
npm run webmcp -- --seq '[
  {"name":"login","args":{"username":"admin","password":"<见 DEPLOYMENT §6>"}},
  {"name":"create_project","args":{"auditUnit":"审计部-TEST","auditedUnit":"TEST-被审单位","owner":"张审计员","auditMembers":[{"name":"张审计员","role":"leader"}],"auditPeriodRange":["2026-09-10","2026-09-30"],"startEndRange":["2026-09-10","2026-10-15"],"auditType":"epc_engineering"}}
]'
# → {"ok":true,"results":[{"name":"login","ms":436,"result":{...}},{"name":"create_project","ms":130,"result":{"projectCode":"XM-..."}}]}

npm run webmcp -- --seq '[...]' --headed      # 有头模式（人工旁观）
npm run webmcp -- --seq '[...]' --url http://localhost:5173   # 指定目标页面
```

> - 工具序列必须同一页面顺序执行：WebMCP 会话（localStorage token）随页面实例存在，序列内 login 后续工具自动携带
> - 同名工具可能两级执行：页面注入版（如立项页的 `create_project` 走表单校验）/ api 兜底版——case 需断言哪条路径时显式声明
> - 返回即 MCP content 格式（`{content:[{type:'text',text:'<JSON>'}]}`），AI 判断时自行 parse 内层 text
> - 前置：Chrome 149+；目标页面非 localhost 时本工具已自动放宽 SecureContext；浏览器 profile 固定于 `.webmcp-profile/`（已 gitignore）

## ragflow / db 工具

```bash
npm run ragflow -- datasets                                                  # 知识库清单
npm run ragflow -- chunks --name '某审计单位-TEST-001' --doc-id <doc_id>     # chunks 落位
npm run db -- "SELECT project_code, current_stage, kb_id FROM audit_project WHERE project_code LIKE 'TEST-%'"
```

> 只读红线：`db.mjs` 强制只读（非 SELECT/SHOW/DESCRIBE/EXPLAIN/WITH 直接拒绝，exit 1）；对账查询一律不许写库。

## 调用方式

三种等价（推荐 ①，命令短且集中管理）：

```bash
# ① npm scripts 别名（package.json 定义；参数用 -- 透传）
npm run api -- --operation authLogin --body '{...}'

# ② 直接 node 执行
node tools/api.mjs --operation authLogin --body '{...}'

# ③ 直接执行（需 chmod +x）
./tools/api.mjs --operation authLogin --body '{...}'
```

> 跨平台注意：如需在 scripts 里设环境变量，Windows 与 Unix 语法不同——统一改用外部注入（shell export / 测试环境 .env / CI 变量），scripts 内不写 `VAR=x`。

## 维护约定

- 新增工具：`tools/<name>.mjs`，遵守「stdout 单行 JSON + 统一退出码 + `--help`」三约；用到新外部库时 `npm i <pkg>` 并登记到本表；如需 `npm run <name>` 别名，同步在 `package.json` `scripts` 加一行。
- 契约变更零操作：`docs/L3/openapi/` 源 yaml 变更后，下次调用 `api` 自动重 bundle（`.cache/` 已 gitignore，勿提交）。
- 跨平台：Node ≥ 20 即可跑（win/mac/linux × x64/arm64），无编译产物；分发 = 拷贝本目录 + 目标机 `npm ci` 一次（依赖：`swagger-client`/`@redocly/cli`/`mysql2`）。
