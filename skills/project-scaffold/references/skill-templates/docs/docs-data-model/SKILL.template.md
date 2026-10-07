---
name: docs-data-model
description: 维护 L2 数据建模文档 docs/L2/data-model/（总览 DATA-MODEL-MAP.md + 每域 {域}.md，一个聚合一个数据模型）的 skill——读取现有文档与上层领域模型、按骨架生成、联动更新、交付前校验。覆盖数据模型清单、数据模型与数据资产（模型 1:N 资产）、存储选型与拓扑、数据全景图、逐域逐模型的数据资产、存储实体、模型内锚定与数据流转。联动领域模型、架构、集成契约。生成下层前先读上层产物，跨文档编排归 align-docs。触发词：生成数据建模、更新数据建模、重建数据建模、数据模型、数据资产、存储选型、存储拓扑、锚定关系、数据全景、数据流转、实体关系、ER 图、DATA-MODEL。代码改动触发更新：表 / 集合 schema 或迁移变化、数据同步 / 采集 / 归档逻辑变化、新增或下线数据源时，更新本文档。
---

# docs-data-model — L2 数据建模文档

## 定位与管辖文档

- 管辖 docs/L2/data-model/ 的读取、生成、更新与校验：总览 DATA-MODEL-MAP.md 回答有哪些数据模型、存储如何组织、模型间如何锚定与引用；每域
  {域}.md 回答本域各模型的数据资产、存储实体与数据流转。
- 本文档属于 L2 架构层；整仓文档按 L1 → L2 → L3 生成，生成下层前先读上层已落盘产物。
- 用户要求生成、更新、重建、编辑或校验 DATA-MODEL，或领域、存储、集成产物变化需要联动时，使用本 skill。
- 一个聚合一个数据模型（1:1），与 `docs/L2/domain/` 的域文档逐章对应：本域有几个聚合成几个数据模型，能力域按只读实体计。
- 产出两份文档、两份模板：总览
  `docs/L2/data-model/DATA-MODEL-MAP.md`（[assets/DATA-MODEL-MAP.template.md](assets/DATA-MODEL-MAP.template.md)）与每域
  `docs/L2/data-model/{域}.md`（[assets/DATA-MODEL.template.md](assets/DATA-MODEL.template.md)）；章节骨架与逐节规则不在本
  skill 维护，生成或更新前必须先读取对应模板，并严格沿用其中的章节编号、标题层级、结构与生成提示。
- 本 skill 只提供执行方法与跨文档约定，不承载项目具体取值；实例文档只写项目数据事实。
- 数据模型、数据资产、存储形态与数据流转只在本 skill 维护；领域业务语义归 `docs/L2/domain/`，应用划分与存储选型理由归
  `docs-architecture`，日志 / 备份 / 运行产物归 `deploy-ops`，接口契约归 `inbound-ops` 与 `outbound-ops`。
- 图一律用 D2 / Mermaid / ASCII 代码块写入 Markdown，不贴位图，图旁只标图名、不复制绘制方法。容器式分层图（数据全景图）的形态与编码一律以
  `c4-container-diagram` skill 为准，本文档不重复其规则；D2 图保留图名、视角、用途和边界等自描述信息。

## 读取

1. 读取现有 docs/L2/data-model/（总览 `DATA-MODEL-MAP.md` 与各域 `{域}.md`），提取仍然有效且有来源支撑的信息。
2. 读取 docs/L2/domain/ 各域文档的聚合、实体、状态机和事件（一个聚合对应一个数据模型），以及
   docs/L2/ARCHITECTURE.md「基础设施与外部依赖」章的存储结论。
3. 读取代码中的实体、schema、迁移和同步事实；更新时同时读取发生变化的集成与部署产物。
4. 扫描源缺失时以已有来源和目标文档为依据，不臆造；跨文档生成顺序归 `align-docs` skill 编排。

## 生成与更新

生成与更新走同一条流程：先读模板，再扫目标位置判断有无既有文档或同定位的旧产物，有则更新、无则新建。

1.
判定本次目标是总览还是单个业务域文档，读取对应模板作为写作基准：总览见 [assets/DATA-MODEL-MAP.template.md](assets/DATA-MODEL-MAP.template.md)
，业务域文档见 [assets/DATA-MODEL.template.md](assets/DATA-MODEL.template.md)。
2. 扫描目标位置（`docs/L2/data-model/` 及其所在目录），判断有无既有总览、业务域文档或同定位的旧产物。
3. 无既有产物：以领域模型、存储结论和代码事实填充模板，新建目标文档。
4. 有既有产物：读取旧文档及发生变化的领域、技术、集成、部署和代码事实，保留有来源支撑的有效信息，按模板重建结构，不沿用与模板冲突的旧章节。
5. 重新核对聚合与数据模型的一一对应（模型数 = 聚合数）、数据模型到数据资产（1:
   N）、各资产所属存储介质与类型、存储拓扑、模型内锚定与数据流转、每个存储实体的键模式与数据构建方式；删除字段级定义和无法追溯来源的表或集合。
6. 数据模型、数据资产、存储选型或锚定关系确有歧义时，询问用户确认。
7. 删除或迁移内容后删净旧节并连续重编号；读取关联文档判断影响，完成联动后逐项执行完成判定。

## 联动

- docs/L2/domain/ 各域文档承载聚合、实体、状态机和事件等业务语义，由 docs-domain skill 维护；本文档只写存储形态与数据流转，并保持领域到存储的映射可追溯。
- 应用划分与存储选型理由归 docs/L2/ARCHITECTURE.md，由 docs-architecture skill 维护；本文档只写存什么和怎么存。
- docs/contracts/outbound/ 集成文档中的外部数据资产、字段术语和数据来源须与本文档一致，集成文档由 outbound-ops
  skill 维护。
- 部署单元与环境参数归 docs/deployment/DEPLOYMENT.md，由 deploy-ops skill 维护；接口契约归
  docs/contracts/inbound/（每应用一份接口 → 代码映射），由
  inbound-ops skill 维护。
- 跨文档编排归 `align-docs` skill。

## 完成判定

- 实例文档与对应模板（总览 [assets/DATA-MODEL-MAP.template.md](assets/DATA-MODEL-MAP.template.md)
  、业务域 [assets/DATA-MODEL.template.md](assets/DATA-MODEL.template.md)）
  的章节编号、标题层级和固定结构一致，逐节按各节生成提示核对（总览：文档描述、数据模型清单、存储选型与拓扑、数据全景图；业务域：文档描述、各数据模型的数据资产 /
  存储实体 / 数据关系（ER） / 数据流转），且没有模板未定义的内容；总览的数据模型清单与各业务域文档的模型章一一对应。
- 数据全景图等容器式分层图符合 `c4-container-diagram` skill 的形态与编码要求。
- 每个数据模型到其数据资产的映射齐全（1:N），各资产标注存储介质与类型，每个模型都画出模型内关系图（以本模型全部资产为节点、按存储介质分子图）。
- 跨节与跨文档一致：总览的存储选型与 `docs/L2/ARCHITECTURE.md`
  的「基础设施与外部依赖」章一致，锚定关系不越位（模型内锚定归业务域文档的模型章，模型（聚合）间的引用不在本文档重复），
  数据流转的边取自 `docs/L2/domain/` 的领域操作，业务域文档与 `docs/L2/domain/` 的域文档逐章对应（一个聚合一个模型），外部数据资产与
  `docs/contracts/outbound/` 一致，表和集合可追溯到领域聚合或实体、无孤儿表。

## 边界

- 存储选型理由与容量性能预期归 `docs-architecture`，领域业务语义归 `docs/L2/domain/`，日志 / 备份 / 运行产物归
  `deploy-ops`，本 skill 不复制。
