---
title: STRUCTURE — 项目目录结构
doc_type: template
layer: common
description: common 贯穿层 文档 STRUCTURE 的更新规范——修改 docs/common/STRUCTURE.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/common/STRUCTURE.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - ASCII 目录树（§1，文本可 diff、任何渲染器显示）
  scan: # 生成前自主扫描（不依赖用户）
    - 扫描项目实际目录：前端/后端是否分离、各自内部层级现状（对照 §2 六个后端二级目录是否已存在/命名差异）
    - 扫描 APPLICATION-ARCHITECTURE：应用划分、模块归属，目录树需与之对应
    - 扫描技术栈（package.json/go.mod/pom.xml 等）：判断语言/框架，目录命名与分层按该语言/框架规范柔性适配
    - 扫描 docs/ 现有子树（L1-L4 + common）与宪法 §3.1 分层是否一致
  related: # 关联模板与联动修改
    CONSTITUTION: 文档分层规则见它 §3.1，规则变更需同步 docs/ 子树目录；代码分层概念（controller/service/infra 等）不重复其规则
    APPLICATION-ARCHITECTURE: 应用划分见 APPLICATION-ARCHITECTURE，代码目录（前端/后端、模块归属）需与之对应
    L3/API: controller 的 api 代码来源——从 openapi.yaml schema 生成，controller 目录与 API 文档联动
    PRODUCT: 功能见 PRODUCT，功能目录增删需同步；**PRODUCT 标「待规划」的功能不加实现目录/模块目录（case A：待规划在实现视图不建模，仅 PRODUCT 保留标注）**
    DEEP-DIVES: 高复杂度单列详情（2/4 阈值：T1 跨模块交互≥3 / T2 永久参数≥5 / T3 精度性能分层≥3 / T4 坑位≥5，命中任意 2 个即单列；判定见 L2/deep-dives/INDEX.md §1），目录树需含 deep-dives/ 分支，与 L2 根索引双向引用
    RESEARCH: 调研详情（候选≥2 或维度≥3（命中其一即单列）；判定见 §1 目录树 research/ 行；无独立索引，TECHNOLOGY-ARCHITECTURE.md 为逻辑入口，双向引用），目录树需含 research/ 分支
    # common 角色：本文档是「改任何文档前」的必读项（定位文档对应代码，防漂移）
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 目录与定义漂移（文件内容与 §2 定义不匹配）时，是新建目录还是调整定义/扩定义 → 问用户
    - reference 目录只读，任何修改前必须询问用户确认
    - controller 的 api 代码生成方式有歧义（如从 schema 生成 vs 手写、生成到哪个目录/语言）→ 问用户
    - 目录组织有争议时（如某些文件放哪）→ 问用户
  flow: # 生成流程
    - 按 scan 结果执行（扫描清单见上）
    - 已有 STRUCTURE → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 目录树（ASCII）→ §2 目录职责说明（逐一说明每个二级目录干什么/职责/约束）→ §3 组织原则（含漂移处理）→ §4 变更与漂移记录
    - §2 必须对每个二级目录说清「干什么、有什么作用、职责是什么」，reference 标注只读、controller 标注由 API.md schema 生成
    - §3 阐述组织原则（最多三级/DDD/前后端分离/语言框架柔性）与漂移处理（新建 vs 调整的判断）
    - 结合项目现状扫描结果 + 询问用户 → 迭代出本项目的过渡规范（transitional spec），允许与模板有差异但需显性记录差异及理由
  notes: # 生成注意点（怎么生成）
    - 代码与 docs 位置以 STRUCTURE 为准（README/AGENTS 引用此处不重复）；本文件 §1/§2 的目录职责判定是功能 3 阶段 1.5 globs 自适应的输入（代码→文档映射按此推导）
    - common 角色：STRUCTURE 是「文档 ↔ 代码」映射——改任何文档前，通过本文档定位其对应代码，再读代码核对漂移（文档与代码可能不一致，读代码防漂移）
    - 分层规则见宪法 §3.1（docs/ 子树遵守该分层但不重复规则）
    - 目录随功能与架构确定后落地（功能见 PRODUCT，架构见 APPLICATION-ARCHITECTURE）
    - 目录组织原则（最多三级/DDD/前后端分离/语言框架柔性）见 §3
    - 后端固定 6 个二级目录（controller/service/infra/integration/reference/test），职责见 §2
    - 任何二级目录都应在文档中说清「干什么、有什么作用、职责是什么」（见 §2）
    - controller 层与 L3/API.md 联动：从 openapi.yaml schema 生成对应 api 代码（见 §2）
    - 第4条 差异主动修复：校验 pitfalls.md/contracts/api-status-code-spec.md 等漂移项，不存在即修复；deep-dives 目录中性收纳技术与业务 Deep Dive
    - research 目录中性收纳技术/竞品调研，与 deep-dives 并列同为 L2 子目录
  checks: # 生成后反向 check
    - "目录树与 宪法 文档分层一致（L0-L4 + common 层），README/AGENTS 引用的路径与目录树一致"
    - "PRODUCT 标「待规划」的功能无实现目录/模块目录（待规划在实现视图不建模）"
    - "每个二级目录都有职责说明（干什么/作用/约束），`reference` 标注只读、`controller` 标注由 `API.md` schema 生成"
    - "`reference` 未被直接修改（任何改动前已询问用户）；`controller` 与 `L3/API.md` 一致性（api 代码与 `openapi.yaml` schema 对齐）"
    - "漂移处理有说明（新建 vs 调整的判断 + 用户确认）且漂移项已校验"
    - "`L2/deep-dives` 目录说明存在（含 2/4 阈值判定）"
    - "`L2/research` 目录说明存在（候选≥2/维度≥3/POC/对比表/ADR链 已校验）"
---

# STRUCTURE — 项目目录结构

> 本文档是「<项目名>」的 **STRUCTURE（目录结构模板）**——common 层的目录结构文档（文档 ↔ 代码映射）。
> 【模板使用指引】复制为 `docs/common/STRUCTURE.md`，按各章节指引填写。
> 【原则】① **代码与 docs 位置 = STRUCTURE**（README/AGENTS 引用此处不重复）——**分层规则 = 宪法 §3.1**（docs/ 怎么分层在宪法，STRUCTURE 只落地 docs/ 子树）；② **文档 ↔ 代码映射**：改文档前读本文档定位对应代码，读代码核对漂移（第4条 差异主动修复）；③ **目录随功能与架构确定后落地**（功能见 PRODUCT，架构见 APPLICATION-ARCHITECTURE）；④ **reference 只读**——见 §2（backend/reference/ 与根级 reference/ 行）；⑤ **controller 关联 L3/API.md**——controller 层从 openapi.yaml schema 生成对应 api 代码；⑥ 图用 **ASCII 目录树**（文本可 diff、任何渲染器显示）。其余生成注意点见 frontmatter `generation.notes`（本文档不重复）

---

## 1. 目录树（总览）

> 【指引】项目完整目录树（ASCII），标注每个目录/文件的职责。**代码与 docs 位置 = STRUCTURE**——README/AGENTS 引用此处；**分层规则 = 宪法 §3.1**（docs/ 子树的目录名遵守该分层，不重复规则）。**目录最多三级**（Java 包结构可折算为三层，本质仍是三层）；**前端/后端分离**；**后端固定 6 个二级目录**（controller/service/infra/integration/reference/test，职责见 §2）。
>
> **注意**：以下目录树**仅为示例/样板**，实际项目请按 §3 组织原则与「填写指引」（树后）迭代出过渡规范，勿照搬。

```text
<项目名>/
├── README.md # L1 项目入口（是什么 + 文档索引，根目录）
├── AGENTS.md # 项目知识库（规范/结构/参考索引，根目录）
├── docs/
│   ├── L1/ # 产品层（What · 业务架构）
│   │   ├── README.md # 入口/索引（项目是什么 + 文档索引，根目录）
│   │   ├── PRODUCT.md # 产品规格全景（能力分层 + 状态）
│   │   └── USER-STORY.md # 用户故事（需求源头 + 旅程 + 交互）
│   ├── L2/ # 架构层（How-Structure）
│   │   ├── APPLICATION-ARCHITECTURE.md # 应用架构（应用划分 + 模块）
│   │   ├── DOMAIN-MODEL.md # 领域模型（业务语义 + 数据设计索引）
│   │   ├── DATA-ARCHITECTURE.md # 数据架构（资产/拓扑/血缘/物理格式）
│   │   ├── TECHNOLOGY-ARCHITECTURE.md # 技术架构（含存储选型）
│   │   ├── deep-dives/ # Deep Dive 详情（高复杂度单列，命中 2/4 阈值）
│   │   │   ├── INDEX.md # 索引：收敛标准 + 列表 + 与 L2 根的引用关系
│   │   │   └── <name>.md # 单篇 Deep Dive（如 inference-pipeline.md，kebab-case）
│   │   └── research/ # 调研（第三方技术/竞品，候选≥2 或维度≥3（命中其一即单列），独立成篇无索引）
│   │       └── <name>.md # 单篇调研（如 tech-xxx.md，kebab-case）
│   ├── L3/ # 契约层（How-Contract）
│   │   ├── API.md # 接口契约说明书（Inbound）
│   │   ├── openapi/ # 机器可读契约（OpenAPI 3.1，一域一 yaml）
│   │   │   ├── openapi.yaml # 主契约（paths 引用拆分文件）
│   │   │   ├── paths/ # 端点定义（按聚合域拆分）
│   │   │   └── components/ # 类型/响应/鉴权定义
│   │   ├── INTEGRATION.md # 外部集成说明书（Outbound）
│   │   └── integration-contracts/ # 外部服务契约（一服务一份，kebab-case）
│   │       └── <service>.md # 单服务契约（如 llm-api.md / vector-service.md，字段见契约文件）
│   ├── L4/ # 交付层（Deliver）
│   │   ├── TEST-PLAN.md # 测试计划（E2E/流程/UT）+ RTM + 报告
│   │   ├── DEPLOYMENT.md # 部署与发布
│   │   └── deployment/ # 部署资产登记（compose/Dockerfile/scripts/.env 清单）
│   │       └── README.md # 部署资产清单（路径 + 用途；文件本体保留运行位置）
│   ├── adr/ # 架构决策记录（common 贯穿层，一 feature 一 ADR）
│   │   └── NNNN-<kebab-case>.md # 单篇 ADR（四位递增，与 ADR-NNNN 编号对应）
│   └── common/ # common 层（贯穿所有层 · 全局知识）
│       ├── STRUCTURE.md # 本文件（目录结构，文档 ↔ 代码映射）
│       ├── GLOSSARY.md # 术语表
│       ├── DATA-DICTIONARY.md # 数据字典（字段/枚举/事件级定义）
│       ├── SECURITY.md # 安全设计（贯穿所有层，密钥分层见 §6）
│       └── CODE-GUIDE.md # 代码规范（命名/签名/注释/坏味道）
├── backend/ # 后端代码（按 DDD 整理，固定 6 个二级目录）
│   ├── controller/ # api 接入层（承接 API 契约，由 L3/API.md 的 openapi.yaml schema 生成）
│   │   └── user/ # 按领域/模块分组（三级）
│   │       └── <X>Controller.java
│   ├── service/ # 领域层（Domain，业务核心）
│   │   └── user/ # 按领域/模块分组（三级）
│   │       └── <X>Service.java
│   ├── infra/ # 基础支撑层（基础设施、通用支撑）
│   │   └── db/ # 按支撑类型分组（三级）
│   │       └── <Z>Config.java
│   ├── integration/ # 接入层（对接外部系统/三方）
│   │   └── payment/ # 按外部系统分组（三级）
│   │       └── <Y>Client.java
│   ├── reference/ # 引用参考（只读，修改前必须询问用户）
│   │   └── legacy/ # 按参考来源分组（三级）
│   │       └── LegacyNote.md
│   └── test/ # 测试（各类测试）
│       └── service/ # 按被测对象分组（三级）
│           └── <X>ServiceTest.java
├── frontend/ # 前端代码（结构见 APPLICATION-ARCHITECTURE）
│   └── pages/ # 按页面/路由分组（三级）
│       └── user/
│           └── <X>Page.tsx
└── reference/ # 根级引用参考（只读，修改前必须询问用户）
    └── <参考项目文档/代码>
```

> 【填写指引】替换为项目实际目录；每个条目写清职责；目录树随项目演进更新。前端/后端目录名可按语言/框架命名（如 `client/`/`server/`、`web/`/`api/`），但概念对应上述分层；后端 6 个二级目录名可随语言/框架微调（如 Java 用 `controller/service/repository` 折算），但职责对应不变。

---

## 2. 目录职责说明（二级目录必说清）

> 【指引】对关键目录/文件逐一说明：**干什么 + 为什么这么放 + 约束**。**任何二级目录都必须在文档中说清「干什么、有什么作用、职责是什么」**。非关键/自明的可省略。

| 路径                   | 干什么                           | 职责                                                               | 典型内容                                   | 约束                                                                                        |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `backend/controller/`  | api 接入层，承接 API 契约        | 接收请求、参数校验、调用 service、组装响应；不承载业务逻辑         | Controller/Handler/路由                    | 由 L3/API.md 的 openapi.yaml schema 生成对应 api 代码，与契约对齐                           |
| `backend/service/`     | 领域层（Domain），业务核心       | 承载业务规则、领域逻辑、事务边界；被 controller 调用               | Service/领域服务/用例                      | 业务核心，不依赖具体框架细节                                                                |
| `backend/infra/`       | 基础支撑层（基础设施、通用支撑） | 数据库/缓存/消息等基础设施、通用工具、配置                         | <Z>Config/Redis/通用工具类                 | 支撑性代码，不承载业务                                                                      |
| `backend/integration/` | 接入层（对接外部系统/三方）      | 对接外部系统/三方服务的客户端与适配                                | <Y>Client/第三方 SDK 封装                  | 与 infra 区分：infra 是内部基础设施，integration 是对外集成                                 |
| `backend/reference/`   | 引用参考（只读）                 | 参考别的项目文档/代码，供查阅                                      | 参考文档/示例代码                          | **只读**，修改任何内容前必须询问用户，不能直接改                                            |
| `backend/test/`        | 测试                             | 各类测试（单元/集成/E2E）                                          | Test/测试夹具                              | 与被测对象对应                                                                              |
| `frontend/`            | 前端代码                         | 前端页面/组件/状态                                                 | pages/components/store                     | 与后端分离，结构见 APPLICATION-ARCHITECTURE                                                 |
| `reference/`（根级）   | 项目级引用参考（只读）           | 跨前后端共享的参考文档/代码，供查阅                                | 参考文档/示例代码                          | **只读**，修改任何内容前必须询问用户，不能直接改；与 `backend/reference/`（后端内引用）区分 |
| `docs/L2/deep-dives/`  | 高复杂度 Deep Dive 详情          | deep-dives/INDEX.md 为索引，L2 根双向引用                          | 单篇 Deep Dive（如 inference-pipeline.md） | kebab-case 命名；File:Line 链代码；单列判定见 L2/deep-dives/INDEX.md §1（2/4 阈值）         |
| `docs/L2/research/`    | 第三方技术/竞品调研详情          | 无独立索引，TECHNOLOGY-ARCHITECTURE.md 为逻辑入口，research 为详情 | 单篇调研（如 tech-xxx.md）                 | kebab-case 命名；候选≥2 或维度≥3（命中其一即单列）；对比表；POC；ADR 链                     |
| （补充）               |                                  |                                                                    |                                            |                                                                                             |

---

## 3. 目录组织原则

> 【指引】说明目录组织的规则（为什么这么分层/分组），帮助理解结构、指导新增文件放哪。

- **① 最多三级原则**：目录层级最多三级（`backend/controller/user/` 即三级目录，文件不计入层级，如 `<X>Controller.java` 在三级目录下）；Java 包结构可折算为三层，本质仍是三层——超过三级时通过包名/命名折算，不无限加深。
- **② DDD 与前后端分离**：按 DDD 整理目录（领域/模块分组）；前端/后端分开（`frontend/` 与 `backend/`），各自内部结构见 APPLICATION-ARCHITECTURE。
- **③ 语言/框架柔性适配**：项目结构不一定完全遵守上述分层，不同语言/框架有各自规范（如 Java 的 `controller/service/repository`、Go 的 `handler/service/store`），但大体应体现这些分层概念——目录命名可随语言/框架调整，职责对应不变。
- **④ 文件归属判断与漂移处理**：放文件前先对照 §2 定义判断是否匹配——匹配则放入对应目录；不匹配（漂移）按三问清单判定：**1. 是否仅命名差异 → 扩定义（更新 §2）**；**2. 是否新增职责边界 → 新建目录（与用户确认后新建）**；**3. 不确定 → 问用户**。判定后更新本文档记录。
- **⑤ 过渡规范（transitional spec）**：AI 按当前项目现状扫描 + 询问用户 → 总结出本项目的过渡目录规范；允许与模板有差异，但需在本文档中显性记录差异及理由（按项目现状迭代，不强行套模板）。
- **⑥ 代码分层细则**：前端/后端固定分层、infra vs integration 判别、层间纪律——见下方「§3.1 代码分层细则」；分层是**手段不是目的**（目标是依赖单向、关注点分离），固定分层避免为"规范/模板"反复加层。

### 3.1 代码分层细则（前端/后端分开，固定分层）

> 分层是**手段不是目的**：目标是依赖单向、关注点分离。**前端与后端是两套独立的分层体系**，采用**固定分层**（不再演进加层）——DDD 分层能覆盖大多数场景，避免为"规范/模板"反复加层。
>
> **依赖总则（前后端通用）**：
>
> - **单向依赖**：层间依赖只允许上层指向下层（依赖方向与调用方向一致）；下层禁止依赖上层
> - **松散分层**：允许上层依赖任意下方层（可跳层），不强制"只能依赖直接下层"（业界主流，避免简单项目痛苦）
> - **依赖倒置（DIP）**：出现"下层需要调用上层逻辑"的反向需求时，**不得打破单向依赖**——由上层定义接口、下层实现该接口，使依赖方向指向抽象而非具体层（Clean Architecture 规则）
> - **代码审查自检**：发现任何反向依赖（下层 import/引用上层）即为违规，用 DIP 重构
> - **目录命名统一小写**：分层目录一律小写（`controller/`、`service/`、`infra/`、`integration/`、`service/*/domain/`、`pages/`、`components/`、`store/`、`utils/`）

**前端固定 3 层**：

```
表现层（pages 页面 / components 组件）
   ↓ 只允许向下依赖
业务层（store 状态管理 / services 服务）
   ↓ 只允许向下依赖
基础设施层（utils 工具 / api 请求封装 / assets 静态资源）
```

**后端固定分层（DDD，顶层 4 个一级目录，全小写）**：

```
controller  接入层（接参/参数校验/响应封装/翻译 DTO→Domain）
   ↓ 只允许向下依赖
service     业务层（含 domain 横向层）
  ├─ service/   应用服务（编排用例/事务/权限/协调领域对象）
  └─ domain/    领域层（聚合根/实体/值对象/领域服务/仓储接口——横向层）
   ↑          ↑
infra     integration
支撑层-内部      支撑层-外部
```

> **domain 层是横向层**：在 `service/` 目录内，被 `service/service`（上方）与 `infra`/`integration`（下方）**同时依赖**，但 `domain` 自身不依赖任何层——它是依赖的汇聚点，只定义接口（依赖倒置的落点）。聚合/实体/值对象/领域服务都归 `service/*/domain/`。
>
> **infra 与 integration：顶层平级的一级目录（支撑层拆两个目录）**：两者**同属支撑层、平级、不是上下级**，都依赖 `service/domain`、互不包含。区别只在**管什么**：判断标准 = **资源归谁管**：
>
> | 目录                         | 管什么           | 谁维护           | 例子                                                           |
> | ---------------------------- | ---------------- | ---------------- | -------------------------------------------------------------- |
> | **infra/**（基础设施）       | **内部资源**     | **自己**运维管理 | 数据库（DB）、缓存（Redis）、消息队列、文件存储                |
> | **integration/**（外部集成） | **外部系统对接** | **别人**提供服务 | <外部_支付A>、<外部_支付B>、第三方 AI（<外部_AI>/<组件_识别>） |
>
> **判断口诀**："这个东西坏了找谁修？"——找自己修（DB 挂了自行处理）→ `infra`；找别人修（<外部_支付A> 挂了只能等）→ `integration`。两者都通过接口/适配器接入，都翻译成 Domain 模型（ACL 防腐层在 `integration/` 里）。

**层间纪律（前后端通用）**：

- 层间依赖单向向下，下层禁止依赖上层（反向需求用依赖倒置解决）
- **前端特有约束——单向数据流**：组件间数据流单向——父组件通过 props 下行传数据，子组件不得直接修改 props，只能通过事件（$emit/回调）上行请求父组件变更；**页面依赖组件，组件禁止依赖页面**（<框架_前端A> 框架级约束）。检查：grep -r "props" 含直接赋值即违规
- **后端特有约束**：业务规则内聚于 `domain/` 的领域对象（聚合根承载行为），`service` 只做编排不堆业务；跨聚合/跨上下文用领域事件解耦

---

## 4. 变更与漂移记录

> 【指引】目录结构发生变化时，在此说明**当前结构**（不写历史——历史归 ADR）。本文档始终反映当前目录现状；**漂移时在此记录「原定义 → 新情况 → 处理决策（新建/调整/保持）及用户确认」**。

- <当前目录结构的说明>
- 漂移记录模板（复制表头与一行即可）：

| 日期 | 原定义 | 新情况 | 决策 | 用户确认 |
| ---- | ------ | ------ | ---- | -------- |
|      |        |        |      |          |

- 引入 deep-dives 示例：原 L2 仅索引文档 → 高复杂度主题（如 inference-pipeline）单列详情 → 新建 `docs/L2/deep-dives/`（单列判定见 deep-dives/INDEX.md §1）→ 用户确认
- 引入 research 示例：原 L2 无调研 → 新增技术选型调研（准入判定见 §1 目录树 research/ 行）→ 新建 `docs/L2/research/` → 用户确认
