---
name: align-docs
description: 文档编排器——按上游拓扑序调用各 docs-* / *-ops skill 完成四件事：①编排（docs/ 缺失时按 L1→L2→L3→common 逐层生成）②对齐（全量逐份核对：调各文档 skill 的完成判定 + 逐份读代码核实语义，差异落 docs/drift/）③处置（消费漂移清单，逐条问用户决断后调对应 skill 修并清账）④旧文档清理与融合（按当前预期文档清单识别旧版本文档，融合或删除）。自身不实现单份文档的生成规则。触发词：检查文档漂移、文档和代码对齐、解决漂移、处理漂移清单、生成文档、初始化文档、按文档 skill 建文档、以代码为准修文档、文档没同步、修复文档、迁移旧文档、旧版本文档、文档迁移、旧文档清理、旧文档融合、文档重命名、文档合并、规范升级迁移
---

# align-docs — 文档编排器

定位：文档体系的总编排器（根 `AGENTS.md` §2.1 差异主动修复）。把「编排 / 对齐 / 处置 / 旧文档处置」拆给各文档 skill 执行——每个
skill 各自管一份文档的读取 / 生成 / 更新 / 校验（管辖关系见根 `AGENTS.md` §3「Skill 路由（三类）」）。本 skill
不实现单份文档的生成规则，只决定调哪些 skill、按什么顺序，并做跨文档一致性核对与漂移台账。

前置：项目已安装 `docs-*` 与 `*-ops` skill；未安装时先由 project-scaffold 安装。

## 文档与资产清单（当前预期）

本表是预期存在的产物基线，四个用途：迁移检测与旧产物识别的比对基准、生成时的产出清单、变更时的逐层判定表、对齐时的逐份路由表。

是否在链上只有一条判据：产物里有没有资产。链上只有一条 L1 → L2 → L3。「上游」列写该文档读谁；L3 是事实起点，不读任何文档。

### 文档

| 层            | 文档                                                    | 定位（回答什么）                                                                                  | 上游（读谁）                                                                                                  | 管辖 skill                    |
|---------------|---------------------------------------------------------|---------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|-------------------------------|
| L1            | `docs/L1/BUSINESS.md`                                   | 业务定位、业务全景（角色 / 主线 / 模式 / 对象流转 / 系统边界 / 关系图）、产品能力、用户故事与旅程 | 代码 + 用户访谈（无文档上游）                                                                                 | docs-business                 |
| L2            | `docs/L2/domain/`（`DOMAIN-MODEL.md` + 每域 `{域}.md`） | 业务域、聚合实体、领域操作、状态机、领域事件                                                      | `BUSINESS.md`                                                                                                 | docs-domain                   |
| L2            | `docs/L2/APPLICATION-ARCHITECTURE.md`                   | 应用划分与应用内模块划分                                                                          | `BUSINESS.md`、`domain/`、`TECHNOLOGY-ARCHITECTURE.md`、`DATA-ARCHITECTURE.md`                                | docs-application-architecture |
| L2            | `docs/L2/DATA-ARCHITECTURE.md`                          | 数据资产分类、存储拓扑、数据血缘、物理存储形态                                                    | `domain/`、`TECHNOLOGY-ARCHITECTURE.md` §3.1                                                                  | docs-data-architecture        |
| L2            | `docs/L2/TECHNOLOGY-ARCHITECTURE.md`                    | 技术选型与理由、技术分层、基础设施、非功能约束                                                    | `domain/`、代码与技术栈事实                                                                                   | docs-technology-architecture  |
| L3            | `docs/L3/STRUCTURE.md`                                  | 目录结构与文档 ↔ 代码映射                                                                         | `APPLICATION-ARCHITECTURE.md`、`INBOUND.md`、`BUSINESS.md`                                                    | docs-structure                |
| 链外·契约     | `docs/contracts/INBOUND.md`                             | 导出产物结构、导出命令、维护规范、CI 防漂移 pipeline、协议支持表、端点计数                        | `BUSINESS.md`、`APPLICATION-ARCHITECTURE.md`、`domain/`、`DATA-ARCHITECTURE.md`                               | inbound-ops                   |
| 链外·契约     | `docs/contracts/OUTBOUND.md`                            | 外部服务总览、逐服务概览与契约状态、契约文件目录                                                  | `BUSINESS.md`、`domain/`、`APPLICATION-ARCHITECTURE.md`、`DATA-ARCHITECTURE.md`、`TECHNOLOGY-ARCHITECTURE.md` | outbound-ops                  |
| 链外·部署     | `docs/deployment/DEPLOYMENT.md`                         | 概述、环境矩阵、拓扑、部署单元、参数、发布流程、密钥、资产登记                                    | `APPLICATION-ARCHITECTURE.md`、`TECHNOLOGY-ARCHITECTURE.md`、`INBOUND.md`、`OUTBOUND.md`                      | deploy-ops                    |
| 链外·测试     | `docs/test/test-cases/`（用例卡）                       | 测试用例卡（写卡规范由 `test-ops` 自持）                                                          | `DEPLOYMENT.md`、`tools/TOOLS.md`                                                                             | test-ops                      |
| 链外·DoD 草稿 | `docs/test/do-drafts/`（每条一份）                      | 临时验证用例草稿；使命完成后由用户决定删除或保留                                                  | `DEPLOYMENT.md`、`tools/TOOLS.md`                                                                             | test-ops                      |
| 链外·工具     | `docs/tools/TOOLS.md`                                   | 工具集说明书（命令、退出码、环境变量）                                                            | `DEPLOYMENT.md`                                                                                               | tools-ops                     |
| 链外·变更     | `docs/changes/`（每变更一单篇）                         | 变更规划（完成后沉淀进对应层文档并删除）                                                          | 横切，不参与依赖传播                                                                                          | docs-changes                  |
| 链外·漂移     | `docs/drift/`（每文档一份 `<doc>.md`）                  | 漂移清单：对齐产出、处置消费；全部清账后删除该文件与空目录                                        | 全部（对齐结果）                                                                                              | align-docs                    |
| common        | `docs/common/deep-dives/`（每问题一单篇）               | 系统级问题深潜（跨 L1-L3 的端到端问题）                                                           | `APPLICATION-ARCHITECTURE.md`、`domain/`、`INBOUND.md`、`OUTBOUND.md`                                         | docs-deep-dives               |
| common        | `docs/common/research/`（每主题一单篇）                 | 选型 / 对比 / 技术验证调研                                                                        | `TECHNOLOGY-ARCHITECTURE.md`                                                                                  | docs-research                 |
| common        | `docs/common/CODE-GUIDE.md`                             | 代码规范（以实际 lint / 静态检查为准）                                                            | 代码与检查配置（无文档上游）                                                                                  | docs-code-guide               |

### 资产

| 资产                                 | 门禁（怎么验）                                                                                                      | 事实来源                   | 管辖 skill   |
|--------------------------------------|---------------------------------------------------------------------------------------------------------------------|----------------------------|--------------|
| `docs/contracts/openapi/`            | 导出命令跑通；端点计数三方一致（尾注释 = INBOUND.md §1 = paths 文件）；无悬空 `$ref`；无手工编辑                    | 代码（禁手写）             | inbound-ops  |
| `docs/contracts/outbound-contracts/` | 契约文件与 `OUTBOUND.md` §3 一一对应；状态值属于 mock 中 / 已交付 / 已上线三态；错误码引用无死链                    | 集成代码 + 第三方官方 spec | outbound-ops |
| `docs/deployment/`                   | 脚本 `bash -n` 通过；compose `config` 可解析；`.env` 键集 = `configs/*.example`；与 `DEPLOYMENT.md` §7 登记一一对应 | 本 skill 生成              | deploy-ops   |
| `docs/test/test-cases/`              | 用例卡五段完整；断言有契约支撑；DoD 草稿已晋升                                                                      | 代码 + 契约                | test-ops     |
| `docs/test/test-records/`            | 台账与实际执行结果一致；失败项有定位与结论                                                                          | 执行事实                   | test-ops     |
| `docs/tools/`                        | 命令可执行；退出码语义符合规格                                                                                      | 本 skill 生成              | tools-ops    |

预期集随模板版本演进。不在本表内的 `docs/` 产物即旧版本产物，按 §5 处置。

### 链有两个遍历方向

```text
生成  L1 → L2 → L3   上层先定边界，下层承接
变更  L3 → L2 → L1   事实先变，结论随之
```

L3 是事实起点（目录与文件的现状投影），L1 是抽象结论。任何改动都先落
L3，再沿链向上逐层判定该层事实是否随之变化。链上不另设依赖图——层级编号已经编码了顺序，跨层一致性就是「走到某一层时判定要不要改」，方向单一，不需要传播图。

`docs/contracts/`、`docs/deployment/`、`docs/test/`、`docs/tools/` 是链外产物域（各有资产），由各自的 `*-ops` skill
独立管理，不被层间传播触发；`docs/changes/`、`docs/drift/` 是过程态台账。

## 1. 编排（生成：docs/ 缺失或残缺）

适用：`docs/` 缺失或残缺，用户要求「生成文档」「初始化文档」。

1. 缺口盘点：按「文档与资产清单」列目标文档，判定 存在 / 缺失 / 空壳；已存在的不重建，只补缺口；缺口清单交用户确认范围。
2. 信息源定级：逐份标注来源——代码派生（L2 架构 / L3 目录）或用户访谈（L1 业务定位、产品能力、用户故事）。代码推不出的一律按访谈处理。
3. 顺序铁律：严格沿链 L1 → L2 → L3 串行；L2 内部序为 domain → 技术架构 → 数据架构 → 应用架构，`common/`
   的跨层专题在链走完后回看。禁止跳层、乱序、并行。列「文档 / skill / 上游 / 信息源 / 顺序」清单交用户确认后动手。
4. 逐份生成：生成某份前先读其上游已落盘产物作为输入，再调该文档的管辖 skill 写 `docs/<路径>`，按该 skill
   的完成判定验证；谈定一份写一份，不积压。
5. 收尾：调 `docs-structure` 同步目录树与根 `AGENTS.md` §3 路由表（新增文档补行、已删文档清行），再跑 §2 的全量对齐。

## 2. 传播（变更：自 L3 沿链向上逐层判定）

任何改动都从这里进入。判定按链自下而上走，每层只问一句「本层事实是否随之变化」；要改就调该层 skill 改完再走上一层。

| 层 | 判据（什么变了）                                                       | 动作                                                                                                        |
|----|------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| L3 | 目录增删或改名、文件增删或改名、目录职责变化、文档 ↔ 代码映射变化      | `docs-structure` 改 `STRUCTURE.md`                                                                          
| L2 | 能力与聚合对应关系变化、应用与模块增减、选型与版本变化、表与集合增删改 | `docs-domain` / `docs-application-architecture` / `docs-technology-architecture` / `docs-data-architecture` |
| L1 | 能力增删或状态变化、参与方与角色变化、用户故事与旅程增删改             | `docs-business`                                                                                             |

执行要求：

1. 起点必是 L3：先读 `docs/L3/STRUCTURE.md` 定位改动落在哪个目录 / 文件，该文档与实际不一致即先改它。目录没变也要写明结论。
2. 逐层判定，不跳层：每层给出「要改 / 不要改」与依据；判定「要改」就调该层 skill 改完，按该 skill 完成判定验证，再走上一层。
3. L2 内部按 domain → 技术架构 → 数据架构 → 应用架构 顺序判定；`common/` 的深潜与调研在链走完后回看（跨层专题，任何一层变了都要看）。
   链外的契约文档（`docs/contracts/`）不进本流程：它由 `inbound-ops` / `outbound-ops` 按各自的上游变化自行更新，链上某层变了要改契约时由该层
   skill 在联动里指明。
4. 链外产物不参与层间传播：`docs/tools/TOOLS.md` 随部署域的环境与变量更新；`docs/test/` 由 `test-ops` 自行管理，其断言依据可回查
   L3 契约，但不因层间变化被本流程触发。
5. 兜底：本次改动跨 2 层及以上，或任一层判定存疑时，回到第 1 步重走整链，不靠单点判定下结论。
6. 全量对齐是独立入口：用户要求「检查漂移」或链上判定不可信时，走 §4 全量逐份核对。传播不豁免全量，只是不替代它。
7. 落台账：判定出的差异逐条写入 `docs/drift/<doc>.md`（格式见 §3），只记录不询问不修复。

输出：本次链式判定结论（逐层要改 / 不要改 + 依据）+ 改动清单 + 待处置旧产物清单（§5）。

## 3. 处置（消费 docs/drift/，唯一询问用户处）

1. 读清单 `ls docs/drift/`；无清单时告知当前无待处理漂移（建议先走 §4 产出），结束。
2. 逐条分析：重读代码与文档对应位置，校准性质（实现 bug / 文档错 / 契约漂移）与严重度（严重：影响接口契约或用户故事验收；轻微）。
3. 问用户决断（唯一询问处）：逐条交用户裁决——以文档为准（改代码，需二次确认）/ 以代码为准（改文档）/ 逐条判断；裁决写入清单「用户决断」列。
4. 执行：文档侧调其管辖 skill 重新生成受影响节，修后按该 skill 完成判定验证；实现 bug 只报告不动代码。
5. 清账：每修一条立即更新状态；单文件全部「已修复」后 `rm` 该清单文件（空目录一并删除）。

清单格式：一份清单只承载一个文档的漂移项，文件内只有一张表（清单即待办列表）——表头固定六列 `#` / 位置 / 差异（文档 vs 代码）/
漂移原因 / 用户决断 / 状态；状态枚举仅 `待修复`（默认）与 `已修复` 两态；漂移原因由 AI 判断记录（代码重构未同步 / 需求变更 /
实现简化 / 契约理想与实现差距等）；用户决断在扫描阶段留空、处置阶段回写；扫描只记录不询问。

## 4. 全量对齐（兜底：逐份核对，不抽样）

链式判定不可信、或用户明确要求「检查漂移」时走这里。逐份全读全比，不抽样。

1. 逐份自检：按「文档与资产清单」逐行调该文档的管辖 skill，对其目标文档跑完成判定。格式与结构纪律见根 `AGENTS.md`
   §2.8，核对时顺带确认。
2. 逐份核实语义：逐份读该文档管辖范围内的代码 / 配置，与文档陈述逐条对照（行为 / 规则 / 流程 / 约束），差异记「文件:位置 /
   文档陈述 vs 代码事实（含 File:Line）」。格式问题在第 1 步顺带确认，语义差异必须读代码得出。
3. 链序对账：沿链逐对核「上游」列声明的依赖是否成立——上游产物里没有下游文档引用的信息即漂移。
4. 资产核对：按资产表逐项验门禁。
5. 落台账：差异逐条写入 `docs/drift/<doc>.md`（格式见 §3），只记录不询问不修复。

输出：漂移清单 + 每文档「已读 N 个文件」清单 + 路由对账结论 + 待处置旧产物清单。

## 5. 路由对账

每次对齐都要给显式结论（无论是否变动）：①目录变动结论（`ls -R` 实际与 `STRUCTURE.md` §1 对比，无变动也要写明）；②文档 ↔ skill
对账表（缺口 = 待补 skill 与 §3 路由行，死项 = 待清理）；③「上游」列本身的准确性——本表与各 skill 读取段不一致即记为待修，双向同步提案交用户确认后落盘。

## 6. 旧版本文档清理与融合

模板版本演进（skill 重命名 / 合并 / 删除 / 承载形态迁移）会让 `docs/` 出现不在上表内的旧版本产物。检出即提示，上轮已提示未处理的本轮继续提示。

处置按「有无新定位承接」二分：先对照上表，看旧产物的知识能否落进某份新文档的定位范围——

- 有承接 → 融合：调承接文档的管辖 skill，把仍有效的知识按其骨架重组写入（吸收进新文档，不复制粘贴、不另起占位）；融合后旧内容不得在承接文档之外残留。
- 无承接 → 删除：确认知识已无保留价值后删除。

纪律：不得自动迁移或删除，融合与删除都须用户逐次认可；融合走承接文档的 skill（本 skill 不手写正文）；删除只针对旧产物文件 /
目录本身；待处置清单随报告交付。

已知迁移映射（随模板版本累积）：

| 旧产物                                                                                        | 处置 | 承接                                                                |
|-----------------------------------------------------------------------------------------------|------|---------------------------------------------------------------------|
| `docs/L1/USER-STORY.md`                                                                       | 融合 | `docs/L1/BUSINESS.md`                                               |
| `docs/L3/API.md`                                                                              | 融合 | `docs/contracts/INBOUND.md`                                         |
| `docs/L3/INTEGRATION.md` + `docs/L3/integration-contracts/`                                   | 融合 | `docs/contracts/OUTBOUND.md` + `docs/contracts/outbound-contracts/` |
| `deep-dives/INDEX.md`、`research/INDEX.md`、`changes/INDEX.md`、`outbound-contracts/INDEX.md` | 删除 | 无（清单改由引用方文档承载）                                        |
| `docs/common/STRUCTURE.md`（旧版目录结构文档，L0-L4 + common 分层时代产物）                   | 迁移 | `docs/L3/STRUCTURE.md`（L4 事实层）                                 |
| `docs/L2/deep-dives/`、`docs/L2/research/`（旧版归档在 L2 的跨层专题）                        | 迁移 | `docs/common/deep-dives/`、`docs/common/research/`（贯穿层）        |
| `docs/L3/DEPLOYMENT.md` + `docs/L3/deployment/`（旧 L3 部署层）                               | 迁移 | `docs/deployment/DEPLOYMENT.md` + 同目录资产                        |
| `docs/L4/STRUCTURE.md`（旧 L4 事实层）                                                        | 迁移 | `docs/L3/STRUCTURE.md`                                              |
| `docs/tools/README.md`（旧版工具集说明文件名）                                                | 融合 | `docs/tools/TOOLS.md`（工具集说明书）                               |

## 7. 输出与边界

输出报告：链式判定结论（逐层要改 / 不要改 + 依据）或全量对齐的漂移清单（文件:位置 / 差异 / 判定 / 处置状态）+
每文档已读文件清单 + 路由对账结论 + 待处置旧产物清单。

边界：只检测、修复、初始化与处置 `docs/**` 文档与资产；不修代码（疑似 bug 交用户裁决）；旧版本产物的融合与删除必须用户逐次认可，不自动执行；检查器只读不写；不自动
commit/push。
