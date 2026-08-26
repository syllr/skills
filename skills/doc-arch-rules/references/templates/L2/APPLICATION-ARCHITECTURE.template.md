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
    - Mermaid flowchart（§2.1 C4 Context 图，图规范见宪法）
    - D2 容器图（§2.2 应用划分图，图规范见宪法）
  related: # 关联模板与联动修改
    PRODUCT: 能力清单 SSOT 在它 §2，能力增删需同步 §3.2 映射
    TECHNOLOGY-ARCHITECTURE: 应用清单 SSOT 在 §2.2，技术架构按应用描述需引用
    DOMAIN-MODEL: 领域聚合归属领域，能力增删需同步领域建模
    DEPLOYMENT: 部署单元来自应用划分，应用增减需同步部署
    DEEP-DIVES: L2 根为索引，deep-dives 为详情，S2 SSOT（声明见正文【与 deep-dives 分工】）
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 应用划分（几个应用/前端后端边界）有争议时 → 问用户确认
    - 是否需单列 deep-dives 有争议时 → 问用户
  flow: # 生成流程
    - 扫描（自主）：读能力图 + 领域模型 + 目标文档
    - 已有 APPLICATION-ARCHITECTURE → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 系统概述 → §2.1 Context 图 → §2.2 应用划分图 → §3 模块划分（3.1 应用内模块 + 3.2 能力→领域/聚合映射）
    - 检查是否命中 deep-dives 收敛标准（满足 4 项中 ≥2 项即瘦身，定义见宪法 §3.1：①单节>80行 ②含>1张图 ③含>1张映射表 ④需 File:Line>3），命中则瘦身为索引并链到 deep-dives
  notes: # 生成注意点（怎么生成）
    - §2.2 应用划分：应用是主体（前端/API），存储/外部服务是依赖（不是应用，不并列）
    - §3 模块划分：应用内模块按知识域划分（不按能力）；能力→领域/聚合映射 N:M（能力 SSOT 在 PRODUCT §2.1，领域/聚合 SSOT 在 DOMAIN-MODEL §3，SSOT 引用不复制）
    - 不写实现细节（类/接口/表结构在代码）
    - 图规范见宪法（Context 用 flowchart，应用划分用 D2）
    - 瘦身约束：本模板生成的文档仅保留 1 张总览图 + 1 张参数/映射总览表作索引，详情链到 deep-dives/，引用不复制；File:Line 链代码；与 SPEC:5 env 双向引用不复制
  checks: # 生成后反向 check
    - [ ] 应用划分图只含应用 + 依赖，无存储/外部服务并列成应用
    - [ ] §3.1 应用内模块按知识域划分（非能力 1:1 别名）
    - [ ] §3.2 能力→领域/聚合映射引用产品规格+领域模型（不重复能力/聚合清单）
    - [ ] Context 图标注为 C4 Context 图
    - [ ] 应用划分图标注为 C4 容器图
    - [ ] 各节有且仅有一处 详见 deep-dives/... 链路
    - [ ] 行数 ~300 而非 ~500
    - [ ] 与 deep-dives/INDEX 可检索一致
---

# APPLICATION-ARCHITECTURE — 应用架构

> 本文档是「<项目名>」的 **APPLICATION-ARCHITECTURE（应用架构模板）**——L2 架构层的应用架构文档。
> 【模板使用指引】复制为 `docs/L2/APPLICATION-ARCHITECTURE.md`，按各章节指引填写。
> 【原则】① **应用架构视角**（TOGAF）：系统分几个应用、应用依赖什么——回答"系统怎么组织"；② 不写实现细节（类/接口/表结构在代码）；③ 与具体技术栈/框架无关；④ 图用 **Mermaid**（Context）+ **D2 容器图**（应用划分）无元信息表、无变更记录。
> 【与 deep-dives 分工】本 L2 根文档为**索引**，详情在 `deep-dives/<name>.md`（S2 SSOT）——同一信息只在一处维护，其余详见 `deep-dives/<name>.md#锚点`，引用不复制。

---

## 1. 系统概述

> 【指引】系统一句话概述：这是什么系统、由哪些部分组成、解决什么问题。

<一句话系统概述>

---

## 2. 架构图（C4）

### 2.1 系统上下文（Context）

> 【指引】本图为 **C4 Context 图**（Mermaid flowchart 表达系统与外部关系，图规范见宪法）。展示系统与用户/平台/第三方服务的关系。

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

> 【指引】系统内部按「应用」划分——**应用是承载业务逻辑的主体**（前端、API）；数据库/对象存储/第三方服务是「应用依赖的资源」，**不是应用**，不与应用并列。本图为 **C4 容器图**（绘制方式见宪法图规范）。图例区分「应用」与「依赖」。

```d2
# 图标准元信息
# 图名: 应用划分图（Application）
# 视角: 应用架构（应用划分）
# 图例: [应用] = 承载业务逻辑的应用（前端、API）；[依赖] = 应用依赖的资源（存储/外部服务）

vars: {
  d2-config: {
    layout-engine: elk
  }
}

应用划分: {
  grid-rows: 1
  grid-columns: 1
  grid-gap: 24
  style.fill: "#ffffff"
  style.font-color: "#1e293b"
  style.stroke: "#94a3b8"
  style.stroke-width: 1
  style.border-radius: 16

  前端层: {
    label: "<前端应用> [应用]"
    width: 1000
    style.fill: "#dbeafe"
    style.font-color: "#1e293b"
    style.stroke: "#2563eb"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 1
    f1: { label: "<页面模块>"; width: 880; height: 60; class: mod }
  }

  后端层: {
    label: "<后端API> [应用]"
    width: 1000
    style.fill: "#ede9fe"
    style.font-color: "#1e293b"
    style.stroke: "#7c3aed"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 2
    grid-gap: 12
    b1: { label: "<接入层>\n<对外接口/鉴权/网关>"; width: 482; height: 80; class: mod }
    b2: { label: "<业务层>\n<各上下文应用服务与领域模型>"; width: 482; height: 80; class: mod }
  }

  依赖层: {
    label: "依赖（非应用）— 应用依赖的资源"
    width: 1000
    style.fill: "#e2e8f0"
    style.font-color: "#1e293b"
    style.stroke: "#475569"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 2
    grid-gap: 12

    外部依赖: {
      label: "外部依赖"
      width: 482
      style.fill: "#f1f5f9"
      style.font-color: "#1e293b"
      style.stroke: "#64748b"
      style.border-radius: 8
      grid-columns: 3
      grid-gap: 12
      e1: { label: "<对象存储>"; width: 144; height: 50; class: mod }
      e2: { label: "<第三方服务>"; width: 144; height: 50; class: mod }
      e3: { label: "<外部平台>"; width: 144; height: 50; class: mod }
    }
    存储依赖: {
      label: "存储依赖"
      width: 482
      style.fill: "#f1f5f9"
      style.font-color: "#1e293b"
      style.stroke: "#64748b"
      style.border-radius: 8
      grid-columns: 1
      db: { label: "<数据库>"; shape: cylinder; width: 362; height: 60; class: mod }
    }
  }
}

# 应用间通信（完整路径，避免静默重复节点）
应用划分.前端层 -> 应用划分.后端层: HTTPS 请求 { style.stroke: "#7c3aed" }
应用划分.后端层.b1 -> 应用划分.依赖层.外部依赖: 对接 { style.stroke: "#475569" }
应用划分.后端层.b2 -> 应用划分.依赖层.存储依赖: 读写 { style.stroke: "#475569" }

classes: {
  mod: {
    style: { border-radius: 6; fill: "#ffffff"; stroke: "#64748b"; stroke-width: 1; font-size: 12; font-color: "#1e293b" }
  }
}
```

> 【填写指引】替换为系统实际应用；**应用是主体（容器 + [应用]），存储/外部服务是依赖（容器 + [依赖]）**。应用内部再展开一层（api 接入层 / service+domain 业务层 / infra+integration 支撑层，分层规范见宪法 §3.3）。
>
> 【详见】应用内部展开详情详见 `deep-dives/<name>.md`。

---

## 3. 模块划分（应用内部模块 + 能力映射）

> 【指引】**先分清两个概念**（避免把"能力"当"模块"）：
>
> - **能力（Capability）**：L1 产品层业务能力（产品规格能力图节点）——回答"产品做什么"，如 AI撰写、配音变音。**不在此处定义**（SSOT）。
> - **模块（Module）**：L2 应用内部代码组织单元——回答"代码怎么组织"。**按知识域/职责划分**（宪法 D 系列：高内聚低耦合），**不是**能力的别名。
>
> **能力 → 领域/聚合 是 N:M（多对多），不是 1:1**：
>
> - 多个能力共用一聚合（视频号提取/图片去水印/配音等 7 能力 都在「工具任务聚合」+「算力账户聚合」）
> - 一能力可能跨多聚合/多领域（充值中心 跨「充值订单聚合」+「算力账户聚合」）
>
> ### 3.1 应用内模块划分（模块 → 应用）
>
> 回答"每个应用内部有哪些代码模块"。**模块按知识域划分**（承载哪些业务逻辑），不按能力划分。

| 模块     | 归属应用          | 知识域（承载什么）                   |
| -------- | ----------------- | ------------------------------------ |
| <模块名> | <前端 / 后端 API> | <承载哪些业务逻辑，如 AI任务 / 算力> |
| （补充） |                   |                                      |

> 后端示例（按宪法 §3.3 固定分层）：`api`（接口/网关/鉴权）、`service`（各上下文应用服务：AI任务 / 算力 / 作品）、`domain`（各上下文聚合/实体）、`infra`（数据访问/缓存）、`integration`（外部对接：微信/支付/AI）。
> 前端示例：工具页模块、作品页模块、用户中心模块。
>
> 【详见】模块（如 converter）仅名字级，模块内部细节详见 `deep-dives/<name>.md`。

### 3.2 能力 → 领域/聚合 映射（能力由哪些领域/聚合承载）

> 回答"每个业务能力由哪些领域/聚合承载"——**能力清单 SSOT（`PRODUCT.md §2.1`，引用不复制）；领域/聚合 SSOT（`DOMAIN-MODEL.md §3`）**，本节只做「能力 → 领域/聚合」映射（N:M）。**表格为 SSOT。**

| 能力     | 承载领域 / 聚合   | 说明             |
| -------- | ----------------- | ---------------- |
| <能力>   | <业务域> / <聚合> | <驱动/支撑/产出> |
| （补充） |                   |                  |
