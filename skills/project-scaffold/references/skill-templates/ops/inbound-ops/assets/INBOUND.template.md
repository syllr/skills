# INBOUND — 接口契约说明书（Inbound）

<!-- 生成提示:begin -->
下一行用引用块写一句话方向说明（L3 Inbound 接口契约说明书）。
<!-- 生成提示:end -->

## 1. 导出产物与端点计数

<!-- 生成提示:begin -->
本节只写导出产物的一句话概述与端点计数字段，不列目录结构与文件清单——`openapi/` 的预期资产集由本 skill
的 [contract-assets.md](../references/contract-assets.md) §1 声明，本文档不作为资产齐全性的判定依据。
字段表固定三行：端点总数（`paths/` 下全部端点计数）、各域端点数（按业务域逐域计数，与 `paths/{域}.yaml` 文件头汇总一致）、契约文件数（
`paths/` 与 `components/` 的文件数）。
<!-- 生成提示:end -->

| 字段 | 含义 |
|------|------|

## 2. 从代码导出契约

### 2.1 {语言框架}

<!-- 生成提示:begin -->
写当前项目选定语言框架的导出信息，四行：依赖（依赖或插件）、导出（导出命令）、产物（`docs/contracts/openapi/`
下的导出产物路径）、官网（官方文档链接）。
<!-- 生成提示:end -->

## 3. 契约维护规范

<!-- 生成提示:begin -->
六条约定，逐条写清：

- 契约来源：代码中的路由、请求/响应 Schema 与 DTO。
- 变更入口：接口、字段、校验与错误码的变化。
- 测试断言：状态码、响应字段与错误码的依据。
- 说明书关系：`INBOUND.md` 与 `docs/contracts/openapi/` 的职责边界。
- Operation 元数据：`x-action`、`x-capability`。
- 路径参数：参数语义、约束与描述的记录位置。

<!-- 生成提示:end -->

## 4. CI 防漂移 pipeline

<!-- 生成提示:begin -->
写契约检查、拆分、兼容性检查与导出漂移检测组成的五步流水线，逐步列出 步骤 / 工具或命令 / 作用 / 失败动作。默认五步：

1. lint：`npx @redocly/cli lint`，语法规范检查，失败 `exit 1`。
2. spectral：`npx @stoplight/spectral-cli lint`，团队规则检查，失败 `exit 1`。
3. bundle：`npx @redocly/cli bundle`，合并多文件契约，失败 warn-only。
4. breaking：`oasdiff breaking --fail-on ERR`，检查破坏性变更，失败 `exit 1`。
5. 契约导出漂移检测：`{选定语言框架导出命令}` 后再 `git diff --exit-code -- {导出产物路径}`，检查代码与导出产物的差异，失败
   `exit 1`。

<!-- 生成提示:end -->

| 步骤 | 工具或命令 | 作用 | 失败动作 |
|------|------------|------|----------|

## 5. 协议支持表

<!-- 生成提示:begin -->
默认 HTTP/REST 必填，其余协议按项目实际追加或标「占位」。

- 协议：协议名。
- 规范文件：该协议的规范文件路径。
- Schema 形态：OpenAPI 3.1 / protobuf / 消息契约 / 自定义。
- 工具链：校验或生成工具。
- 状态：默认已启用 / 占位。
  默认行：HTTP/REST（`docs/contracts/openapi/openapi.yaml`，OpenAPI 3.1，代码导出、Redoc、Spectral，默认已启用）；gRPC（protobuf，
  `protoc / buf`）、WebSocket（消息契约）、私有协议（自定义）默认标「占位」。

<!-- 生成提示:end -->

| 协议 | 规范文件 | Schema 形态 | 工具链 | 状态 |
|------|----------|-------------|--------|------|
