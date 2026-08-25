---
description: L3 契约层 文档 API 的更新规范——修改 docs/L3/API.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L3/API.md"
---

# API 文档更新规范（L3 契约层）

## 触发条件

当以下任一情况发生时，本规则必须生效：

- 编辑、新增或重建 `docs/L3/API.md`
- 关联文档变化需联动更新：
  - DOMAIN-MODEL（业务语义在它 §3.1-§3.5（聚合操作，接口来源）与 §4（领域事件，下游消费依据），新 Action 需联动出接口）
  - APPLICATION-ARCHITECTURE（能力→聚合 bipartite 在它 §3.2，接口增减需同步能力映射）
  - PRODUCT（能力清单 SSOT 在它 §2.1，接口覆盖能力需与之一致）
  - INTEGRATION（互补（Inbound vs Outbound），接口变化需同步外部集成）
  - DEPLOYMENT（接口上线需同步部署）
  - DATA-DICTIONARY（字段级定义 SSOT，接口字段需引用）
- 用户要求"生成/更新 API"

## 执行流程

1. **工具**：
   - Markdown 表格（契约文件结构/CI pipeline/协议支持表）
   - 代码块（各语言安装/生成命令 + cfg.yaml 示例）
   - 不使用接口清单表/Action 映射表/能力映射表/字段表
2. **问用户**（仅当有歧义）：
   - 协议选型超出默认列表（HTTP/REST 之外的启用协议，或目标语言超出 Go/Java/Python/TS/Node 默认 5 种）→ 问用户
   - 项目技术栈未探测到（项目尚无代码/配置文件）→ 列出语言选项（Go / Java-Spring / Python-FastAPI / Node-Express / TypeScript）让用户选，生成说明书只写选定语言的 CLI
   - 项目技术栈已探测到 → 不问，说明书只写该语言的 CLI（不写其他语言）
3. **生成流程**：
   - 扫描（自主）：读 openapi.yaml + paths/* + components/* + DOMAIN-MODEL §3.1-§3.5（13 Actions）+ §4 + APPLICATION-ARCHITECTURE §3.2 能力→聚合 bipartite + PRODUCT §2.1 + 目标文档
   - 确定目标语言：探测项目技术栈（package.json/go.mod/pom.xml 等）→ 探测到则用该语言；探测不到则按 ask_user 让用户选（Go/Java-Spring/Python-FastAPI/Node-Express/TypeScript）
   - 定位文档模式：openapi.yaml 是契约 SSOT；API.md 是说明书（不重复接口清单/字段），承载「如何使用 yaml 生成目标语言代码 + 维护规范 + CI 防漂移」
   - openapi.yaml 已存在 → 说明书按本模板生成；API.md 不出现接口清单表/Action 映射表/能力映射表/字段表，字段一律以引用指向 openapi.yaml
   - openapi.yaml 不存在 → 先按 DOMAIN-MODEL + APPLICATION-ARCHITECTURE 推导接口清单与字段契约，落 openapi.yaml（机器可读 SSOT），再生成 API.md 说明书
   - 已有 API → 参考旧文档有效信息，但结构按本模板重建为说明书模式；删除原接口清单/接口详情章节；迁移为契约文件结构 + 目标语言生成命令 + CI pipeline + 协议支持表
   - 二部图校验：每个接口向上追溯到 APPLICATION-ARCHITECTURE §3.2 中至少一个能力；该能力承载的聚合至少含一个 §3 Action 与接口语义对应（双向对齐）
   - 按模板生成：§1 契约文件结构 → §2 目标语言生成命令（仅写探测/选定语言的 CLI，不写其他语言）→ §3 维护规范 → §4 CI 防漂移 pipeline → §5 协议支持表
4. **联动同步**：修改目标文档后，先读关联文档判断影响，受影响的一并同步修改，完成后校验关联一致性

## 硬性要求

- OpenAPI 3.1 为契约 SSOT，API.md 是「openapi.yaml 使用说明书」不是「接口清单文档」
- 接口字段/校验/错误码一律查 openapi.yaml，本文档不复制、不手抄
- 说明书四要素：契约文件结构 + 目标语言代码生成命令 + 维护规范 + CI 防漂移 pipeline
- 目标语言确定：先探测项目技术栈（package.json/go.mod/pom.xml 等）；探测到 → 只写该语言 CLI；探测不到 → ask_user 提供选项让用户选（Go/Java-Spring/Python-FastAPI/Node-Express/TypeScript）。最终文档只写选定语言的 CLI，不写其他语言（避免文档膨胀 + 与项目无关）
- 其他协议（gRPC/WebSocket/私有协议）用协议支持表中的占位行表达；启用时各自维护 .proto / 自定义 IDL 文件
- 鉴权方案/字段级契约/错误响应以 JSON Pointer 引用 openapi.yaml 节点，文档内不展开
- 接口来自聚合操作（Action），与 DOMAIN-MODEL §3.1-§3.5 一一对应（用于校验覆盖完整性，不写入正文表）
- 接口按 endpoint（方法+路径）标识，不用顺序编号
- 只写说明书四要素，技术契约细节在 openapi.yaml
- **联动**：更新时按 related 同步关联文档（见触发条件）；跨层引用单向向下，下层不链回上层
- **图规范**：按 CONSTITUTION §3.2 用 D2 / Mermaid / ASCII

## 完成判定

以下全部通过才算完成：

- 协议支持表含默认 HTTP/REST（指向 openapi.yaml）+ 其他协议占位（gRPC/WebSocket/私有协议）
- 接口契约与 openapi.yaml 一致（无字段漂移：API.md 引用与 openapi.yaml 节点逐项对得上）
- 接口覆盖 DOMAIN-MODEL §3.1-§3.5 全部 13 项 Action（1 Action 可对应 1+ 接口，无遗漏）
- 接口与 APPLICATION-ARCHITECTURE §3.2 能力→聚合 bipartite 对齐（每个接口可追溯到至少一个能力，能力承载的聚合含对应 Action）
- 接口来源能力在 PRODUCT §2.1 能力清单存在且功能状态已确认
- 字段级契约不与 DOMAIN-MODEL §3/§4 业务语义冲突
- 与 INTEGRATION（Outbound）方向不混淆
- 内容条目无顺序编号（接口按 endpoint 标识，不用 API-N）
- §2 只含目标语言生成命令（探测/选定语言，不含其他语言的安装/生成命令）
- 说明书含 CI 防漂移 pipeline（lint/spectral/bundle/breaking/codegen drift 5 步齐备）
- 无接口字段表重复（字段一律引用 yaml，无 Action 映射表/能力映射表/字段表/接口清单表）

---

## 模板（生成/更新文档的结构基准）

以下为 `docs/L3/API.md` 的模板正文（不含 YAML frontmatter，生成/更新时以此结构为准，按 `> 【指引】` 填写，实例不含 `> 【指引】` 说明）：

# API — 接口契约说明书（Inbound）

> 本文档是「<项目名>」的 **API（接口契约说明书）**——L3 契约层的 `openapi.yaml` 使用说明书。
> 【模板使用指引】复制为 `docs/L3/API.md`，按各章节指引填写。
> 【原则】① **说明书定位**：本文档不重复接口字段/校验/错误码——这些一律查 `docs/L3/openapi/openapi.yaml`（OpenAPI 3.1 SSOT）；② **本文档用途**：说明如何从 yaml 生成各语言 API 代码、如何维护契约、如何 CI 防漂移；③ 图规范见宪法无元信息表、无变更记录。
> 【契约 SSOT】默认协议 HTTP/REST，机器可读契约 SSOT 落在 `docs/L3/openapi/openapi.yaml`（OpenAPI 3.1）；接口字段/校验/错误码一律查 yaml，本文档只承载生成命令 + 维护规范 + CI 防线 + 协议支持表。

## 1. 契约文件结构

> 【指引】`openapi.yaml` 按端点与组件拆分多文件，`openapi.yaml` 顶层只承载元信息与 `$ref` 引用。

| 文件                                | 作用                                           |
| ----------------------------------- | ---------------------------------------------- |
| `docs/L3/openapi/openapi.yaml`      | 主契约（paths 引用拆分文件）                   |
| `paths/*.yaml`                      | 端点定义（按域 user/quota/recharge/tool/work） |
| `components/schemas/*.yaml`         | 类型定义                                       |
| `components/responses/*.yaml`       | 错误响应                                       |
| `components/securitySchemes/*.yaml` | 鉴权方案                                       |

## 2. 从 yaml 生成代码

> 【指引】**目标语言确定**：探测项目技术栈（package.json/go.mod/pom.xml 等）→ 探测到用该语言；探测不到则问用户选（Go/Java-Spring/Python-FastAPI/Node-Express/TypeScript）。**生成时只保留选定语言小节，删除其他语言小节**（实例文档只写最终语言的 CLI）。命令以仓库根为 cwd；命令调整（路径/输出文件名/包名）后须同步更新本节。

### 2.x <目标语言>（按探测/选定结果，保留对应小节，删除其余）

> 【指引】以下为各语言 CLI 参考（模板持有，生成时选用一种后删除其他）：

### Go（推荐 oapi-codegen）

**安装**：

```bash
go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest
```

**生成**：

```bash
oapi-codegen --config cfg.yaml docs/L3/openapi/openapi.yaml
```

`cfg.yaml` 示例（package / output / generate: models, chi-server, strict-server, client, embedded-spec）：

```yaml
package: api
output: gen/api.gen.go
generate:
  models: true
  chi-server: true
  strict-server: true
  client: true
  embedded-spec: true
```

**产物**：ServerInterface + StrictHandler + Go structs + 客户端。

### Java/Spring（openapi-generator）

**安装**：

```bash
npm install -g @openapitools/openapi-generator-cli
```

**生成**：

```bash
openapi-generator-cli generate \
  -i docs/L3/openapi/openapi.yaml \
  -g spring \
  --additional-properties=interfaceOnly=true,library=spring-boot,useSpringBoot3=true,useTags=true,skipDefaultInterface=true
```

**产物**：`@RestController` 接口 + DTO；业务层 `implements` 接口，编译期对齐契约。

### 2.3 Python（datamodel-code-generator 模型 / fastapi-code-generator 骨架）

**安装**：

```bash
pip install datamodel-code-generator
```

**模型生成**：

```bash
datamodel-codegen \
  --input docs/L3/openapi/openapi.yaml \
  --input-file-type openapi \
  --output-model-type pydantic_v2.BaseModel \
  -o models.py
```

### 2.4 TypeScript（推荐 openapi-typescript 类型 + openapi-fetch）

**安装**：

```bash
npm i -D openapi-typescript
```

**类型生成**：

```bash
npx openapi-typescript docs/L3/openapi/openapi.yaml -o src/api/openapi.d.ts
```

**用法**：

```typescript
import type { paths, components } from "./api/openapi";
```

### 2.5 Node 服务端 stub（openapi-generator）

```bash
openapi-generator-cli generate \
  -i docs/L3/openapi/openapi.yaml \
  -g nodejs-express-server \
  -o ./out
```

## 3. 契约维护规范

> 【指引】契约变更的唯一入口是 `openapi.yaml`；本文档只承载规则，不写字段。

- 改接口 → 先改 `openapi.yaml`（字段/校验/错误码 SSOT），再重新生成代码
- API.md 不手抄字段；查契约看 yaml
- 协议：默认 HTTP/REST（OpenAPI 3.1），gRPC/WebSocket/私有协议占位待启用

## 4. CI 防漂移 pipeline

> 【指引】5 步流水线在 PR 阶段阻断契约漂移；第 4/5 步失败必须修改 PR，不得 `--no-verify` 跳过。

| 步骤            | 工具                                          | 作用       | 失败动作 |
| --------------- | --------------------------------------------- | ---------- | -------- |
| 1 lint          | `npx @redocly/cli lint`                       | 语法规范   | exit 1   |
| 2 spectral      | `npx @stoplight/spectral-cli lint`            | 团队规则   | exit 1   |
| 3 bundle        | `npx @redocly/cli bundle`                     | 合并多文件 | -        |
| 4 breaking      | `oasdiff breaking --fail-on ERR`              | 防破坏变更 | exit 1   |
| 5 codegen drift | `openapi-typescript` + `git diff --exit-code` | 类型同步   | exit 1   |

## 5. 协议支持表

> 【指引】本系统对外接口按协议维度拆分契约文件。默认启用 HTTP/REST（OpenAPI 3.1），其他协议占位待启用时各自维护 IDL/规范文件。

| 协议      | 规范文件                       | Schema 形态  | 工具链                               | 状态         |
| --------- | ------------------------------ | ------------ | ------------------------------------ | ------------ |
| HTTP/REST | `docs/L3/openapi/openapi.yaml` | OpenAPI 3.1  | openapi-generator / Redoc / Spectral | 默认，已启用 |
| gRPC      | 待建 `.proto`                  | protobuf IDL | protoc / buf                         | 占位         |
| WebSocket | 待建                           | 自定义       | -                                    | 占位         |
| 私有协议  | 待建                           | 自定义       | -                                    | 占位         |

> 状态变更：协议启用/下线时同步更新本表；启用协议需独立维护对应规范文件作为该协议契约 SSOT，API.md 只索引不复制。
