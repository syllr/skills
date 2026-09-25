---
name: docs-inbound
description: 生成、更新与验收 L3 Inbound 契约文档 docs/L3/INBOUND.md 及其机器可读契约目录 docs/L3/openapi/——按代码导出的 OpenAPI 维护对外接口说明书，覆盖读取上层产物、重建导出产物结构、回写语言框架导出命令与 CI 防漂移 pipeline、经 contract-export 重导出契约、校验端点计数与无悬空引用。触发词：写 INBOUND.md、生成接口文档、更新接口文档、接口契约文档、对外接口说明、Inbound 接口、接口变更、接口漂移、导出 openapi、重导出契约、契约校验、openapi 校验、端点计数、契约目录守卫。代码改动触发更新：后端路由 / 端点增删改、请求响应 Schema / DTO 字段变化、状态码 / 错误码 / 校验变化、鉴权或协议变化、x-action 等扩展元数据变化时，更新本文档并重导出 openapi。
---

# docs-inbound — L3 Inbound 契约文档

## 定位与管辖文档

本 skill 负责 L3 契约层的 Inbound 半边：`docs/L3/INBOUND.md` 与 `docs/L3/openapi/`。`INBOUND.md` 承载接口契约说明书，`openapi/` 承载由代码导出的机器可读契约。Outbound 半边（`docs/L3/OUTBOUND.md` 与外部服务契约目录）归 `docs-outbound` skill。

本 skill 只负责本层产物的读取、生成、更新与验收；跨层漂移扫描、分诊与清账由 `docs-align` skill 编排。生成或更新任何产物前，先读取 [assets/TEMPLATE.md](assets/TEMPLATE.md)，按其中 `INBOUND.md` 与 `openapi/` 的骨架写入；本文件不重复目标文档结构。

## 读取

- 先读项目宪法和已落盘文档，按 `L0 → L1 → L2 → L3` 的顺序确认上下文。
- 读取 L1 业务文档及其能力、Action 与状态，调用 `docs-business`、`docs-domain`。
- 读取 L2 应用架构、领域文档、数据架构中的接口归属、领域操作与外部数据结论，调用 `docs-application-architecture`、`docs-domain`、`docs-data-architecture`。
- 扫描后端代码、路由、请求/响应 Schema、DTO 与技术栈文件（如 `package.json`、`go.mod`、`pom.xml`、`pyproject.toml`、`requirements.txt`）。
- 读取现有 `INBOUND.md`、`docs/L3/openapi/` 及相关代码导出产物；已有文档只提取仍有效的信息。
- 需要判断跨层漂移时交由 `docs-align` skill；需要执行契约导出时由 `contract-export` skill 读取 `INBOUND.md` 中的命令与产物约定。

## 生成流程

1. 读取 `assets/TEMPLATE.md`，选择目标产物对应的骨架。
2. 探测代码与语言框架；契约以代码中的路由、请求/响应 Schema 和 DTO 为依据，不能脱离代码凭空手写。
3. 有后端代码时按选定语言框架导出 OpenAPI；无后端代码时先与用户确定接口定义，在代码中建立路由与请求/响应 Schema，再进行导出。
4. 读取上层文档、代码定义和既有有效内容，按模板生成 `INBOUND.md`，只写说明书层信息，不复制契约字段、校验和错误码。
5. 通过 `contract-export` skill 执行导出、拆分、机检与门禁落盘，维护 `docs/L3/openapi/` 的导出产物。
6. 校验接口到业务能力、领域 Action 的追溯关系；协议超出默认范围或项目无后端代码且接口定义有歧义时询问用户。

## 更新流程

1. 读取现有文档和导出产物，提取仍有效的信息，再按 `assets/TEMPLATE.md` 重建目标结构。
2. 将旧版内联的接口清单、接口详情、字段表、错误码表移出说明书；字段级内容只保留在代码导出的 `openapi/` 产物中。
3. 代码中的路由、Schema、校验、错误码或扩展元数据变化时，先修改代码，再调用 `contract-export` skill 重新导出、拆分、校验并落盘。
4. 按模板同步说明书的导出结构、导出命令、维护规范、CI pipeline、协议支持表和端点计数；不手工编辑 `openapi/` 文件。
5. 删除或迁移接口时同步清理代码、导出产物、引用和计数，并检查是否存在悬空引用或残留 Stub。
6. 更新后重新执行完成判定，并判断是否需要 `docs-align` skill 处理跨文档漂移。

## 联动

- 领域文档新增或调整 Action 时，联动接口覆盖与 `docs-domain` skill。
- 业务文档能力或状态变化时，联动接口追溯与 `docs-business` skill；标为待规划的能力不生成端点。
- 接口归属或应用边界变化时，联动 `docs-application-architecture` skill。
- 接口上线、鉴权或部署配置变化时，联动 `docs-deployment` skill。
- Outbound 契约变化时与 `docs-outbound` skill 保持方向边界；契约导出执行交由 `contract-export` skill。
- 跨文档漂移的扫描、分诊和清账交由 `docs-align` skill；引用不复制，跨层引用保持单向。

## 完成判定

以 [assets/TEMPLATE.md](assets/TEMPLATE.md) 的结构为基准，全部满足才算完成：

- 协议支持表包含默认 HTTP/REST，并保留其他协议的占位或已启用规范。
- 契约由代码导出，接口定义、字段、校验和错误码与 `docs/L3/openapi/` 产物一致。
- 每个接口可追溯到业务文档能力，接口覆盖领域 Action；待规划能力没有端点。
- 重新导出后产物与代码无差异，删除端点已从代码和产物中移除。
- `INBOUND.md` 只保留选定语言框架的导出命令，包含完整五步 CI 防漂移 pipeline。
- 说明书没有接口字段表、Action 映射表、能力映射表或接口清单表的重复内容；接口按 endpoint 标识。
- `openapi/` 无手工编辑痕迹，端点计数三方一致，无悬空 `$ref`、残留 Stub 或删除端点。

## 边界

- 代码是接口契约的事实来源，禁止先手写 YAML 再由 YAML 生成代码。
- `INBOUND.md` 不手抄字段、校验或错误码；字段级契约只查 `docs/L3/openapi/`。
- `openapi/` 由导出与拆分流程产生，禁止手工编辑；所有导出执行均通过 `contract-export` skill。
- 待规划能力不建路由、不留 tag、paths 或 Stub；接口按方法与路径标识，不使用顺序编号。
- 本 skill 不管理 Outbound 契约文档，不生成客户端代码，不代替 `docs-align` 处理漂移。
- 正文不使用加粗或 emoji，不自动 commit 或 push。
