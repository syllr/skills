---
title: APPLICATION-ARCHITECTURE — 应用架构
doc_type: template
layer: L2
description: L2 架构层 文档 APPLICATION-ARCHITECTURE 的更新规范——修改 docs/L2/APPLICATION-ARCHITECTURE.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L2/APPLICATION-ARCHITECTURE.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - Mermaid flowchart（§2.1 C4 Context 图，图规范见 references/diagram-spec.md）
    - D2 容器图（§2.2 应用划分图，图规范见 references/diagram-spec.md）
  related: # 关联模板与联动修改
    PRODUCT: 能力清单见它 §2.1，能力增删需同步应用模块（映射见 DOMAIN-MODEL，不在此重复）；**PRODUCT 标「待规划」的能力不加应用模块（待规划能力在实现视图不建模，仅 PRODUCT 保留标注）**
    TECHNOLOGY-ARCHITECTURE: 应用划分见 §2.2，技术架构按应用描述需引用
    DOMAIN-MODEL: 领域聚合归属领域，能力→聚合映射见它 §3（应用架构不重复）
    DEPLOYMENT: 部署单元来自应用划分，应用增减需同步部署
    DEEP-DIVES: L2 根为索引，deep-dives 为详情，宪法 第2条（同一信息只在一处维护；声明见正文【与 deep-dives 分工】）
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 应用划分（几个应用/前端后端边界）有争议时 → 问用户确认
    - 是否需单列 deep-dives 有争议时 → 问用户
  flow: # 生成流程
    - 扫描（自主）：读能力图 + 领域模型 + 目标文档
    - 已有 APPLICATION-ARCHITECTURE → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 系统概述 → §2.1 Context 图 → §2.2 应用划分图（应用/容器/外部系统/用户层）→ §3 模块划分（应用内模块，能力→聚合映射见 DOMAIN-MODEL §3 不重复）
    - 检查是否命中 deep-dives 收敛标准（单列判定见 docs/L2/deep-dives/INDEX.md §1：跨模块交互≥3 / 永久参数≥5 / 精度分层≥3 / 坑位≥5，命中 2 项即单列），命中则瘦身为索引并链到 deep-dives
  notes: # 生成注意点（怎么生成）
    - §2.2 应用划分四分类（C4 语义）：「应用[应用]」= 承载业务逻辑的主体（前端/API）；「容器[容器]」= 应用依赖的资源、**你拥有并负责**（数据库/对象存储/缓存等，System Boundary 内）；「外部系统[外部]」= 第三方服务、**不拥有只消费**（大模型 API/SMTP/业务数据源/他团队提供的服务，Boundary 外）；「用户层[Person]」= 上下文展示（系统用户角色）
    - **资源归谁管判别**（容器 vs 外部系统，与 STRUCTURE §3.1 infra/integration「坏了找谁修」一致）：自己运维管理 → 容器（Boundary 内）；别人提供服务（他团队/第三方）→ 外部系统（Boundary 外）
    - **Person 位置规范**：用户层 [Person] 为「上下文物件展示（不参与系统边界）」——可画在左主体顶部（阅读布局）或 Boundary 外（严格 C4），**二选一明确即可**，不强制
    - §3 模块划分：应用内模块按知识域划分（不按能力）；模块命名以 §2.2 应用划分图为基准（防一物多名，宪法通用语言贯穿）；能力→领域/聚合映射见 DOMAIN-MODEL §3（PRODUCT §2.1），**应用架构不重复该映射**
    - 不写实现细节（类/接口/表结构在代码）
    - 图规范见 references/diagram-spec.md（Context 用 flowchart，应用划分用 D2）
    - 瘦身约束：本模板生成的文档仅保留 1 张总览图（§2.1 Context 图；§2.2 应用划分折叠为 §3.1 模块表，不重复建表，兼作索引表），详情链到 deep-dives/，引用不复制；File:Line 链代码；与项目 env 文档（如 SPEC:5 env，存在时）双向引用不复制
  checks: # 生成后反向 check
    - [ ] §2.2 应用划分图分四类（应用[应用]/容器[容器]/外部[外部]/用户层[Person]），无「依赖」笼统类
    - [ ] 容器=你拥有并负责（Boundary 内）；外部系统=别人提供服务（Boundary 外）——判别正确，无容器/外部混淆
    - [ ] 用户层 Person 角色 == §2.1 Context 图用户角色（一致性）；图例含 [Person]
    - [ ] §3.1 应用内模块按知识域划分（非能力 1:1 别名）；模块命名 == §2.2 应用划分图模块命名（防一物多名）
    - [ ] 无 §3.2 能力→聚合映射节（见 DOMAIN-MODEL §3 / PRODUCT §2.1，不重复）
    - [ ] PRODUCT 标「待规划」的能力无对应应用模块/层节点（实现视图不建模，仅 PRODUCT 保留标注）
    - [ ] Context 图标注为 C4 Context 图
    - [ ] 应用划分图标注为 C4 容器图
    - [ ] §2.2/§3 各一处 详见 deep-dives/... 链路（每处有且仅有一处；§2.1 Context 不强制）
    - [ ] 行数 ~300 而非 ~500（收敛标准见 docs/L2/deep-dives/INDEX.md §1）
    - [ ] 与 deep-dives/INDEX 可检索一致
---

# APPLICATION-ARCHITECTURE — 应用架构

> 本文档是「<项目名>」的 **APPLICATION-ARCHITECTURE（应用架构模板）**——L2 架构层的应用架构文档。（实例化后删除模板自述行，保留【原则】与【与 deep-dives 分工】声明）
> 【模板使用指引】复制为 `docs/L2/APPLICATION-ARCHITECTURE.md`，按各章节指引填写。
> 【原则】① **应用架构视角**（TOGAF）：系统分几个应用、应用依赖什么——回答"系统怎么组织"；② 不写实现细节（类/接口/表结构在代码）；③ 与具体技术栈/框架无关；④ 图用 **Mermaid**（Context）+ **D2 容器图**（应用划分）无元信息表、无变更记录。
> 【与 deep-dives 分工】本 L2 根文档为**索引**，详情在 `deep-dives/<name>.md`——同一信息只在一处维护，其余详见 `deep-dives/<name>.md#锚点`，引用不复制。

---

## 1. 系统概述

> 【指引】系统一句话概述：这是什么系统、由哪些部分组成、解决什么问题。

<一句话系统概述>

---

## 2. 架构图（C4）

### 2.1 系统上下文（Context）

> 【指引】本图为 **C4 Context 图**（Mermaid flowchart 表达系统与外部关系，图规范见 references/diagram-spec.md）。展示系统与用户/平台/第三方服务的关系。

```mermaid
flowchart TB
 U(["用户<br/>Person · <用户角色>"])
 W["<外部系统><br/>External System<br/><外部系统职责：宿主 / 登录鉴权 / 支付>"]
 S["<系统名><br/>Software System<br/><系统核心职责>"]
 A["<外部系统 2><br/>External System<br/><外部服务职责：生成 / 提取 / 配音>"]

 U -->|"<使用方式>"| W
 W -->|"<加载 / 接入方式>"| S
 S -->|"<交互 1：登录鉴权 / 支付回调>"| W
 S -->|"<调用外部服务>"| A

 classDef person fill:#08427b,stroke:#052e56,color:#fff
 classDef system fill:#1168bd,stroke:#0b4884,color:#fff
 classDef external fill:#999999,stroke:#6b6b6b,color:#fff

 class U person
 class S system
 class W,A external
```

### 2.2 应用划分（Application）

> 【指引】本图为 **C4 容器图**（绘制方式见 references/diagram-spec.md）：系统按「应用 → 容器 → 外部系统」分层划分，另设用户层 [Person] 作上下文展示；图例区分「应用[应用] / 容器[容器] / 外部[外部] / 人物[Person]」。

```d2
# 图标准元信息
# 图名: 应用划分图（Application）
# 视角: 应用架构（应用划分）
# 图例: [应用]/[容器]/[外部]/[Person]

vars: {
 d2-config: {
 layout-engine: elk
 }
}

应用划分: {
 grid-rows: 1; grid-columns: 2; grid-gap: 16
 style.fill: "#ffffff"
 style.font-color: "#1e293b"
 style.stroke: "#94a3b8"
 style.border-radius: 16

 左主体: {
 grid-rows: 1; grid-columns: 1; grid-gap: 16
 style.font-color: "#1e293b"
 style.border-radius: 12

 用户层: {
 label: "① 用户层 [Person]"
 width: 1000; grid-columns: 3; grid-gap: 12; style.fill: "#f8fafc"; style.font-color: "#1e293b"; style.stroke: "#94a3b8"; style.border-radius: 12
 u1: { label: "<用户角色_主>"; width: 317; height: 50; class: mod }
 u2: { label: "<用户角色_管>"; width: 317; height: 50; class: mod }
 u3: { label: "<用户角色_客>"; width: 317; height: 50; class: mod }
 }

 前端层: {
 label: "② <前端应用> [应用]"
 width: 1000; grid-columns: 2; grid-gap: 12; style.fill: "#dbeafe"; style.font-color: "#1e293b"; style.stroke: "#2563eb"; style.border-radius: 12
 f1: { label: "<页面模块_首页>"; width: 482; height: 60; class: mod }
 f2: { label: "<页面模块_工作台>"; width: 482; height: 60; class: mod }
 }

 后端层: {
 label: "③ <后端应用> [应用]"
 width: 1000; grid-columns: 5; grid-gap: 12; style.fill: "#ede9fe"; style.font-color: "#1e293b"; style.stroke: "#7c3aed"; style.border-radius: 12
 b1: { label: "<模块_业务1>"; width: 186; height: 60; class: mod }
 b2: { label: "<模块_业务2>"; width: 186; height: 60; class: mod }
 b3: { label: "<模块_业务3>"; width: 186; height: 60; class: mod }
 b4: { label: "<模块_文件>"; width: 186; height: 60; class: mod }
 b5: { label: "<模块_权限>"; width: 186; height: 60; class: mod }
 a1: { label: "<模块_Agent编排>"; width: 186; height: 60; class: mod }
 a2: { label: "<模块_解析>"; width: 186; height: 60; class: mod }
 a3: { label: "<模块_检索>"; width: 186; height: 60; class: mod }
 a4: { label: "<模块_生成>"; width: 186; height: 60; class: mod }
 a5: { label: "<模块_规则库>"; width: 186; height: 60; class: mod }
 }

 数据层: {
 label: "④ 数据与基础能力层 [容器]"
 width: 1000; grid-columns: 1; grid-gap: 12; style.fill: "#cffafe"; style.font-color: "#1e293b"; style.stroke: "#0e7490"; style.border-radius: 12
 存储: { label: "存储组件"; width: 880; grid-columns: 3; grid-gap: 12; style.fill: "#e0f2fe"; style.font-color: "#1e293b"; style.stroke: "#0284c7"; style.border-radius: 8
 db: { label: "<数据库>"; shape: stored_data; width: 277; height: 72; class: mod }
 mo: { label: "<对象存储>"; shape: stored_data; width: 277; height: 72; class: mod }
 rd: { label: "<缓存>"; shape: stored_data; width: 277; height: 72; class: mod }
 }
 }
 }

 外部系统: {
 label: "⑤ 外部系统\n[外部·Boundary外]"
 grid-columns: 1; style.fill: "#e2e8f0"; style.font-color: "#1e293b"; style.stroke: "#64748b"; style.border-radius: 12
 e1: { label: "<外部_大模型API>"; width: 200; height: 50; class: mod }
 e2: { label: "<外部_邮件>"; width: 200; height: 50; class: mod }
 e3: { label: "<外部_数据源>"; width: 200; height: 50; class: mod }
 e4: { label: "<外部_他团队服务>\n（他团队）"; width: 200; height: 50; class: mod }
 }
}

# 应用间通信（完整路径，避免静默重复节点）
应用划分.左主体.用户层 -> 应用划分.左主体.前端层: 使用 { style.stroke: "#94a3b8" }
应用划分.左主体.前端层 -> 应用划分.左主体.后端层: HTTPS { style.stroke: "#7c3aed" }
应用划分.左主体.后端层 -> 应用划分.左主体.数据层: 读写 { style.stroke: "#0e7490" }
应用划分.左主体.后端层 -> 应用划分.外部系统: 对接 { style.stroke: "#64748b" }

classes: {
 mod: {
 style: { border-radius: 6; fill: "#ffffff"; stroke: "#64748b"; stroke-width: 1; font-size: 12; font-color: "#1e293b" }
 }
}
```

> 【填写指引】替换为系统实际应用；**四分类定义见 §2.2 上方指引**（应用[应用]是主体、容器[容器]你拥有、外部系统[外部]别人提供、用户层[Person]上下文展示）。应用内部再展开一层（api 接入层 / service+domain 业务层 / infra+integration 支撑层，分层规范见 STRUCTURE §3.1）。
>
> 【详见】应用内部展开详情详见 `deep-dives/<name>.md`。

---

## 3. 模块划分（应用内部模块）

> 【指引】**先分清两个概念**（避免把"能力"当"模块"）：
>
> - **能力（Capability）**：L1 产品层业务能力（产品规格能力图节点）——回答"产品做什么"，如 <能力_撰写>、<能力_变音>。**不在此处定义**。
> - **模块（Module）**：L2 应用内部代码组织单元——回答"代码怎么组织"。**按知识域/职责划分**（宪法 D 系列：高内聚低耦合），**不是**能力的别名。
>
> **模块命名以 §2.2 应用划分图为基准**（防一物多名，宪法通用语言贯穿）；**能力 → 领域/聚合 映射是 N:M（多对多）**，但该映射 **见 DOMAIN-MODEL §3 / PRODUCT §2.1**，**本节不重复**（应用架构只回答"应用内部有哪些模块"，不重复"能力由哪些聚合承载"）。

### 3.1 应用内模块划分（模块 → 应用）

> 回答"每个应用内部有哪些代码模块"。**模块按知识域划分**（承载哪些业务逻辑），不按能力划分，命名与 §2.2 应用划分图一致。

| 模块     | 归属应用          | 知识域（承载什么）                               |
| -------- | ----------------- | ------------------------------------------------ |
| <模块名> | <前端 / 后端 API> | <承载哪些业务逻辑，如 <能力_任务> / <聚合_算力>> |
| （补充） |                   |                                                  |

> 后端示例（按 STRUCTURE §3.1 固定分层）：`api`（接口/网关/鉴权）、`service`（各上下文应用服务：<能力_任务> / <聚合_算力> / <聚合_作品>）、`domain`（各上下文聚合/实体）、`infra`（数据访问/缓存）、`integration`（外部对接：<外部_支付A>/<外部_支付B>/<外部_AI>）。
> 前端示例：<模块_工具页>、<模块_作品页>、<模块_用户中心>。
>
> 【详见】模块（如 <模块_转换>）仅名字级，模块内部细节详见 `deep-dives/<name>.md`。
