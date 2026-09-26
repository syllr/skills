# Inbound 契约产物模板

## 产物一：INBOUND.md

### 文件头

本节写接口契约说明书的标题与方向说明。

```markdown
# INBOUND — 接口契约说明书（Inbound）

> L3 Inbound 接口契约说明书。
```

### 1. 导出产物与端点计数

本节只写导出产物的一句话概述与端点计数字段，不列目录结构与文件清单——`openapi/` 的预期资产集由本 skill 的
[contract-assets.md](../references/contract-assets.md) §1 声明，本文档不作为资产齐全性的判定依据。

| 字段       | 含义                                                  |
|------------|-------------------------------------------------------|
| 端点总数   | `paths/` 下全部端点计数                               |
| 各域端点数 | 按业务域逐域计数，与 `paths/{域}.yaml` 文件头汇总一致 |
| 契约文件数 | `paths/` 与 `components/` 的文件数                    |

### 2. 从代码导出契约

本节写选定语言框架的依赖、导出命令、产物路径与官网链接。

#### 2.1 {语言框架}

本节写当前项目选定语言框架的导出信息。

- 依赖：`{依赖或插件}`
- 导出：`{导出命令}`
- 产物：`docs/contracts/openapi/{导出产物路径}`
- 官网：`{官方文档链接}`

### 3. 契约维护规范

本节写契约来源、变更入口、测试断言依据、扩展元数据与路径参数约定。

- 契约来源：代码中的路由、请求/响应 Schema 与 DTO。
- 变更入口：接口、字段、校验与错误码的变化。
- 测试断言：状态码、响应字段与错误码的依据。
- 说明书关系：`INBOUND.md` 与 `docs/contracts/openapi/` 的职责边界。
- Operation 元数据：`x-action`、`x-capability`。
- 路径参数：参数语义、约束与描述的记录位置。

### 4. CI 防漂移 pipeline

本节写契约检查、拆分、兼容性检查与导出漂移检测组成的五步流水线。

| 步骤               | 工具或命令                                                         | 作用                     | 失败动作  |
|--------------------|--------------------------------------------------------------------|--------------------------|-----------|
| 1 lint             | `npx @redocly/cli lint`                                            | 语法规范检查。           | exit 1    |
| 2 spectral         | `npx @stoplight/spectral-cli lint`                                 | 团队规则检查。           | exit 1    |
| 3 bundle           | `npx @redocly/cli bundle`                                          | 合并多文件契约。         | warn-only |
| 4 breaking         | `oasdiff breaking --fail-on ERR`                                   | 检查破坏性变更。         | exit 1    |
| 5 契约导出漂移检测 | `{选定语言框架导出命令} && git diff --exit-code -- {导出产物路径}` | 检查代码与导出产物差异。 | exit 1    |

### 5. 协议支持表

本节写默认协议及其规范文件、Schema 形态、工具链与状态。

| 协议      | 规范文件                       | Schema 形态 | 工具链                    | 状态         |
|-----------|--------------------------------|-------------|---------------------------|--------------|
| HTTP/REST | `docs/contracts/openapi/openapi.yaml` | OpenAPI 3.1 | 代码导出、Redoc、Spectral | 默认，已启用 |
| gRPC      | `{规范文件或 IDL}`             | protobuf    | `protoc / buf`            | 占位         |
| WebSocket | `{规范文件或 IDL}`             | 消息契约    | `{工具链}`                | 占位         |
| 私有协议  | `{规范文件或 IDL}`             | 自定义      | `{工具链}`                | 占位         |

## 产物二：openapi/ 目录骨架

### 1. 目录结构

本节不写目录树。`openapi/` 的目录层级、每个文件的作用与落盘规则由本 skill 的
[contract-assets.md](../references/contract-assets.md) §1 声明；本 skill 按该声明生成与验收，不以本文档为准。

### 2. `openapi.yaml`

本节写主契约的元信息、引用聚合、删除留痕与端点计数注释块；定义拆分到引用文件。

```yaml
# openapi.yaml 只承载元信息与 $ref；paths 与 components 定义位于拆分文件。
openapi: 3.1.0
info:
  title: {title}
  version: {version}
servers:
  - url: {server-url}
    description: {environment}
tags:
  - name: {domain}
    description: {domain-description}
security:
  - {security-scheme}: []
paths:
  /{path}:
    $ref: './paths/{domain}.yaml#/paths/~1{path}'
components:
  schemas:
    $ref: './components/schemas/{schema}.yaml#/components/schemas'
  responses:
    $ref: './components/responses/{response}.yaml#/components/responses'
  securitySchemes:
    $ref: './components/securitySchemes/{scheme}.yaml#/components/securitySchemes'

# 删除留痕：{path} — {删除原因}
# 端点计数：{domain}={count}；合计={total}
```

### 3. `paths/{domain}.yaml` 文件头注释块

本节写 paths 拆分文件的来源、覆盖边界与 Action 汇总。

```yaml
# 依据来源：docs/L2/domain/{domain}.md §{章节} 的 {Action 清单}
# 边界：{本文件覆盖的端点范围}
# x-action 汇总：{Action 清单}

paths:
  /{path}:
    {method}:
      operationId: {operation-id}
      x-action: {action}
      x-capability: {capability}
      responses:
        '{status}':
          $ref: '../components/responses/{response}.yaml#/components/responses/{Response}'
```

### 4. `components/` 拆分文件

本节写 Schema、响应与鉴权方案拆分文件的顶层结构。

```yaml
components:
  schemas:
    {SchemaName}: {schema-definition}
  responses:
    {ResponseName}: {response-definition}
  securitySchemes:
    {SchemeName}: {security-scheme-definition}
```
