---
name: outbound-ops
description: 生成、更新与验收 L3 Outbound 外部集成文档 docs/contracts/OUTBOUND.md 及外部服务契约目录 docs/contracts/outbound-contracts/——维护外部集成说明书（总览/集成详情概览/契约文件目录）与一服务一契约文件（集成形态时序图/接入方式与三态契约状态/调用面接口定义/错误码集中表），覆盖读取上层产物、重建说明书与契约骨架、同步说明书清单、全仓引用同步。触发词：写 OUTBOUND.md、生成集成文档、更新集成文档、外部集成说明、Outbound 集成、第三方接口契约、外部服务契约、集成契约、契约状态、mock 中、已上线、新增外部服务。代码改动触发更新：集成 Adapter 或客户端接口定义变化、第三方官方 spec 变化、外部服务或调用面接口增删、错误码变化、契约状态流转时，更新本文档与对应契约文件。
---

# outbound-ops — L3 Outbound 外部集成文档

## 定位与管辖文档

本 skill 负责 L3 契约层的 Outbound 半边：`docs/contracts/OUTBOUND.md` 与 `docs/contracts/outbound-contracts/`。
`OUTBOUND.md`
承载外部集成说明书；契约目录的预期资产集由 [references/contract-assets.md](references/contract-assets.md) §1 声明（说明书
§3 只是人类可读索引，不作判定依据）；契约目录按外部服务各放一份 kebab-case 命名的
`{service}.md`，不设索引文件。Inbound 半边（`INBOUND.md` 与 `openapi/`）归 `inbound-ops` skill。

本 skill 只负责本层产物的读取、生成、更新与验收；跨层漂移扫描、分诊与清账由 `align-docs` skill 编排。

- 目标文档结构以 [assets/TEMPLATE.md](assets/TEMPLATE.md) 为准，本 skill 不另行维护章节骨架；生成或更新任何产物前先读取该模板，按其中
  `OUTBOUND.md` 与 `outbound-contracts/{service}.md` 的骨架写入。

## 读取

- 先读项目宪法和已落盘文档，按 `L1 → L2 → L3` 的顺序确认上下文。
- 读取 L1 业务文档及其能力、Action 与状态，调用 `docs-business`、`docs-domain`。
- 读取 L2 技术架构中的外部依赖、应用归属、领域操作、数据架构外部数据资产与总文档 Mapper，调用
  `docs-technology-architecture`、`docs-application-architecture`、`docs-domain`、`docs-data-architecture`。
- 读取集成客户端或 Adapter 的接口定义、第三方官方 spec、集成配置与领域调用方信息。
- 读取现有 `OUTBOUND.md` 与各服务契约文件；已有文档只提取仍有效的信息。
- 需要判断跨层漂移时交由 `align-docs` skill；需要读取本系统对外接口边界时参考 `inbound-ops` skill。

## 生成与更新

生成与更新走同一条流程：先读模板，再扫目标位置判断有无既有文档或同定位的旧产物，有则更新、无则新建。

1. 读取 `assets/TEMPLATE.md`，选择目标产物对应的骨架。
2. 扫描目标位置（`docs/contracts/OUTBOUND.md` 与 `docs/contracts/outbound-contracts/`），判断有无既有说明书、契约文件或同定位的旧产物。
3. 无既有产物：探测集成客户端或 Adapter 的接口定义与第三方官方 spec（二者共同构成外部服务契约来源，不能脱离代码与官方 spec
   凭空手写），扫描技术架构外部依赖、应用归属、领域操作、数据架构外部数据资产、总文档 Mapper 与调用方信息，按模板新建。
4. 有既有产物：读现有说明书与契约文件，提取仍有效的信息，按 `assets/TEMPLATE.md` 重建目标结构。
5. 按模板写 `OUTBOUND.md`，只写总览、服务概览和契约目录等说明书层信息；每个外部服务生成或更新一份
   `outbound-contracts/{service}.md`，接口、字段、错误码和接入细节写入对应契约文件。
6. 集成客户端、Adapter 或第三方官方 spec 变化时，更新对应服务契约文件；接口列表、接口定义、错误码和调用方按同一变更同步。
7. 新增、删除或迁移服务契约文件时，同步 `OUTBOUND.md` 的服务概览、§3
   索引及全仓引用；并按 [contract-assets.md](references/contract-assets.md) §3 核对磁盘，代码中已无集成的服务不留契约文件。
8. 外部依赖、调用方应用、外部数据资产或领域 Mapper 变化时，联动对应上游文档并重新检查契约术语与归属；复杂场景在契约文件内单列小节展开；跨文档漂移交由
   `align-docs` skill。
9. 无客户端实现时先与用户确定接口边界，在代码中定义客户端接口骨架，再生成契约文件；外部服务选择有争议时询问用户。
10. 更新后重新执行完成判定，确认索引与实际文件一一对应，且旧文件路径没有残留引用。

## 联动

- 技术架构外部依赖变化时，联动 `docs-technology-architecture` skill；数据库、对象存储、缓存等基础设施不进入外部集成清单。
- 应用归属或调用方变化时，联动 `docs-application-architecture` skill；领域 Action 或 Mapper 变化时，联动 `docs-domain`
  skill。
- 外部数据资产与字段术语变化时，联动 `docs-data-architecture` skill；部署密钥、回调或连接配置变化时，联动 `deploy-ops`
  skill。
- Inbound 接口变化时与 `inbound-ops` skill 保持方向边界；复杂业务场景在契约文件内单列小节展开。
- 文件迁移或删除后同步结构文档、上游文档与 `OUTBOUND.md`；跨文档漂移由 `align-docs` skill 编排。

## 完成判定

- `OUTBOUND.md` 保持说明书模式，接口、字段、错误码和接入细节不内联复制。
- 每个外部服务对应一份 kebab-case 契约文件，说明书中的服务概览可以逐个定位该文件。
- 外部服务清单与技术架构外部依赖一致，外部数据源覆盖数据架构外部数据资产，调用方应用可在应用架构定位。
- 契约来源为集成客户端或 Adapter 接口定义与第三方官方 spec；无实现时已先在代码中定义客户端接口骨架。
- 契约文件包含集成形态、接入方式、调用面接口列表、逐接口定义、集中错误码与调用方；状态值属于 mock 中、已交付、已上线三态。
- 每个接口的调用面、方法签名、输入、返回、幂等语义和特殊失败处理相互对应，错误码引用无死链。
- 时序图使用四参与者结构，接口场景映射保持紧凑；复杂场景已按需单列小节展开。
- `outbound-contracts/` 磁盘内容与 [contract-assets.md](references/contract-assets.md) §1
  预期资产集逐项对应：无缺失项，代码中已无集成的服务无残留契约文件。
- `OUTBOUND.md` §3 索引与目录内契约文件一一对应，且不复制接口、字段或错误码正文。
- 迁移或删除服务后全仓旧名残留为零，Inbound 与 Outbound 方向不混淆，基础设施未被误列为外部集成。

## 边界

- `OUTBOUND.md` 只做说明书，接口、字段、错误码与接入细节只在对应契约文件维护、不内联复制。
- `§3` 只列本系统实际调用的接口，不替外部服务维护完整 API；无集成时保留说明书的总览与暂无占位。
- 不生成客户端代码。
