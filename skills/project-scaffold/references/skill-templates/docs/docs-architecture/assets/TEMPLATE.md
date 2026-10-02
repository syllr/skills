# 1. 文档描述

<!-- 生成提示:begin -->
写清本文档覆盖什么（系统上下文、应用划分、按应用逐个写技术选型与版本兼容、应用内模块划分、技术分层、基础设施与外部依赖（含存储）、非功能约束）与不覆盖什么（数据形态归数据建模，部署、接口契约归对应文档）。
<!-- 生成提示:end -->

# 2. 架构图（C4）

## 系统上下文（Context）

<!-- 生成提示:begin -->
画 C4 Context 图，用 Mermaid flowchart TB。本系统居中，用户角色与外部系统分列两侧，不拿子系统或模块当节点。

- 人物节点：`(["名称<br/>Person · 一句话说明"])`，第二行固定标 Person。
- 本系统节点：`["名称<br/>Software System<br/>职责"]`，第二行固定标 Software System。
- 外部系统节点：`["名称<br/>External System<br/>用途"]`，第二行固定标 External System。
- 节点之间用带标签的实线箭头连接，标签写交互方式与协议。
- 用 classDef 定义 person / system / external 三色，再以 class 把节点归类。

<!-- 生成提示:end -->

## 应用划分（Application）

<!-- 生成提示:begin -->
D2 容器图（按 c4-container-diagram skill）。分区 = 应用 / 运行支撑 / 外部系统，另设用户层展示上下文；四类各守自己的判据：

- 用户层：使用系统的人或角色，不是系统资源。
- 应用：承载业务逻辑、可独立运行的应用（前端、后端服务等）。
- 运行支撑：系统内自行运维的运行时资源（Web 服务器、数据库、缓存、磁盘等），不承载业务逻辑。
- 外部系统：边界外、由他人提供的服务，本系统只调用不运维。
  每个节点标注职责，四类各占一层、用分层色区分。D2 图保留图名、视角、用途和边界注释。
  图的形态（脱敏示例，节点标签按项目实际替换）：

```d2
# 图名: 应用划分（C4 Container）
# 视角: 逻辑视图（用户层 / 应用 / 运行支撑 / 外部系统）
# 用途: 表达系统由哪些应用组成、应用依赖哪些运行支撑、边界外依赖什么
# 反映的问题: 应用如何划分、应用运行需要哪些资源、与外部系统如何交互
# 边界: 不画模块内部类与接口调用；技术选型见应用章，部署归部署文档

vars: {
  d2-config: {
    layout-engine: elk
  }
}

应用划分: {
  grid-rows: 1
  grid-columns: 1
  grid-gap: 24
  style.font-color: "#1e293b"
  style.border-radius: 16

  用户层: {
    label: "用户层 [User] — 角色触点，非系统资源"
    width: 1000; grid-columns: 3; grid-gap: 12; style.fill: "#dbeafe"; style.font-color: "#1e293b"; style.stroke: "#2563eb"; style.border-radius: 12
    u1: { label: "<角色一>\n（<触点>）"; width: 317; height: 60; class: module }
    u2: { label: "<角色二>\n（<触点>）"; width: 317; height: 60; class: module }
    u3: { label: "<角色三>\n（<触点>）"; width: 317; height: 60; class: module }
  }

  应用层: {
    label: "应用层 [Application] — 承载业务逻辑、可独立运行"
    width: 1000; grid-columns: 3; grid-gap: 12; style.fill: "#ede9fe"; style.font-color: "#1e293b"; style.stroke: "#7c3aed"; style.border-radius: 12
    a1: { label: "<应用一>\n（<职责>）"; width: 317; height: 60; class: module }
    a2: { label: "<应用二>\n（<职责>）"; width: 317; height: 60; class: module }
    a3: { label: "<应用三>\n（<职责>）"; width: 317; height: 60; class: module }
  }

  运行支撑层: {
    label: "运行支撑层 — 系统内自行运维的运行时资源"
    width: 1000; grid-columns: 3; grid-gap: 12; style.fill: "#cffafe"; style.font-color: "#1e293b"; style.stroke: "#06b6d4"; style.border-radius: 12
    r1: { label: "<支撑一>\n（Web 服务器 / 反向代理）"; width: 317; height: 60; class: module }
    r2: { label: "<支撑二>\n（关系型数据库）"; width: 317; height: 60; class: module }
    r3: { label: "<支撑三>\n（缓存 / 本地磁盘）"; width: 317; height: 60; class: module }
  }

  外部系统层: {
    label: "外部系统层 — 边界外，第三方提供"
    width: 1000; grid-columns: 3; grid-gap: 12; style.fill: "#e2e8f0"; style.font-color: "#1e293b"; style.stroke: "#64748b"; style.border-radius: 12
    e1: { label: "<外部系统一>\n（<用途>）"; width: 317; height: 60; class: module }
    e2: { label: "<外部系统二>\n（<用途>）"; width: 317; height: 60; class: module }
    e3: { label: "<外部系统三>\n（<用途>）"; width: 317; height: 60; class: module }
  }
}

应用划分.用户层 -> 应用划分.应用层: 使用 { style.stroke: "#2563eb" }
应用划分.应用层 -> 应用划分.运行支撑层: 依赖 { style.stroke: "#06b6d4" }
应用划分.应用层 -> 应用划分.外部系统层: 调用 { style.stroke: "#64748b" }

classes: {
  module: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#1e40af"; font-color: "#1e293b"; stroke-width: 1 } }
}
```

<!-- 生成提示:end -->

## 技术分层

<!-- 生成提示:begin -->
D2 容器图（按 c4-container-diagram skill）。左主体 = 展现 / 接入 / 服务 / 数据四层技术组件，右侧 = 外部系统，图例说明左右两区；容器节点
label 用「技术栈 + 职责」两段式；层间只画展现 → 接入 → 服务 → 数据三根调用线，外部系统不画连线。D2 图保留图名、视角、用途和边界注释。
图的形态（脱敏示例，节点标签按项目实际替换）：

```d2
# 图名: 技术分层
# 视角: 逻辑视图（展现 / 接入 / 服务 / 数据 + 外部系统）
# 用途: 表达技术组件分成哪几层、层间如何调用、边界外依赖什么
# 反映的问题: 技术栈如何分层、每层承担什么、与外部系统如何交互
# 边界: 不画功能模块与业务能力；应用划分见「应用划分」，部署归部署文档

vars: {
  d2-config: {
    layout-engine: elk
  }
}

技术分层: {
  grid-rows: 1
  grid-columns: 2
  grid-gap: 24
  style.font-color: "#1e293b"
  style.border-radius: 16

  技术主体: {
    label: "技术主体"
    width: 1000; grid-rows: 4; grid-gap: 12; style.fill: "#f1f5f9"; style.stroke: "#475569"; style.border-radius: 12
    展现层: { label: "展现层 — <技术栈>"; width: 960; height: 52; class: module }
    接入层: { label: "接入层 — <技术栈>"; width: 960; height: 52; class: module }
    服务层: { label: "服务层 — <技术栈>"; width: 960; height: 52; class: module }
    数据层: { label: "数据层 — <技术栈>"; width: 960; height: 52; class: module }
  }

  外部系统: {
    label: "外部系统"
    width: 220; grid-rows: 3; grid-gap: 12; style.fill: "#e2e8f0"; style.stroke: "#64748b"; style.border-radius: 12
    e1: { label: "<外部系统一>"; width: 180; height: 52; class: module }
    e2: { label: "<外部系统二>"; width: 180; height: 52; class: module }
  }
}

技术分层.技术主体.展现层 -> 技术分层.技术主体.接入层: 调用 { style.stroke: "#7c3aed" }
技术分层.技术主体.接入层 -> 技术分层.技术主体.服务层: 调用 { style.stroke: "#7c3aed" }
技术分层.技术主体.服务层 -> 技术分层.技术主体.数据层: 调用 { style.stroke: "#7c3aed" }

classes: {
  module: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#1e40af"; font-color: "#1e293b"; stroke-width: 1 } }
}
```

<!-- 生成提示:end -->

# 3. {应用}

<!-- 生成提示:begin -->
按应用划分的应用逐个成章：应用划分里有几个应用，这里就写几章，标题写应用名（与应用划分一致），按实际数量顺延编号（n
为应用个数），后续固定章节接着往下编。
<!-- 生成提示:end -->

## 技术选型

<!-- 生成提示:begin -->

- 维度：该应用要选型的技术维度（前端可填框架 / 路由 / 状态管理 / 构建工具，后端可填展现 / 接入 / 服务 / 数据等分层，按应用实际替换）。
- 选型：选定的技术。
- 备选：考虑过的其他方案。
- 弃用原因：为什么不用备选。
- 依据：可追溯的来源（代码或变更记录）。

<!-- 生成提示:end -->

| 维度 | 选型 | 备选 | 弃用原因 | 依据 |
|------|------|------|----------|------|

## 版本与兼容

<!-- 生成提示:begin -->
写该应用的运行时与基础库版本、兼容平台（浏览器 / 运行时 / 构建工具的版本区间）与升级注意点。
<!-- 生成提示:end -->

# {n+3}. 模块划分（应用内部模块）

<!-- 生成提示:begin -->
每行一个模块，按业务域而非能力划分，模块名用业务域名，不用「创建 / 查询 / 导出」这类能力名；只做索引，不重复产品能力，不写类、接口、表结构，不列字段。

- 模块：应用内模块名。
- 归属应用：该模块属于哪个应用（取自应用划分）。
- 对应业务域：该模块承载哪个业务域（取自 docs/L2/domain/ 的业务域清单）；纯粹的通用或基础设施模块填「通用」。

<!-- 生成提示:end -->

| 模块 | 归属应用 | 对应业务域 |
|------|----------|------------|

# {n+4}. 基础设施与外部依赖

<!-- 生成提示:begin -->

- 依赖：外部依赖名（数据库 / 缓存 / 消息队列 / Web 服务器 / 对象存储 / 第三方服务等）。
- 类型：自建 / 托管 / 第三方。
- 用途：在本系统中做什么；存储类写清存哪类数据。
- 容量性能预期：量级与性能目标，非存储类留空。
- 备选：其他候选。
- 理由：为什么选它。
  部署拓扑引用 docs/deployment/DEPLOYMENT.md，不重复其内容。

<!-- 生成提示:end -->

| 依赖 | 类型 | 用途 | 容量性能预期 | 备选 | 理由 |
|------|------|------|--------------|------|------|

# {n+5}. 非功能约束

<!-- 生成提示:begin -->

- 类别：性能 / 安全 / 成本 / 合规。
- 要求：该类的具体约束。
- 对技术选型的影响：它导致了什么选型决策。
  无要求的类别不列。

<!-- 生成提示:end -->

| 类别 | 要求 | 对技术选型的影响 |
|------|------|------------------|
