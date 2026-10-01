# L2 应用架构文档

## 1. 架构图（C4）

### 1.1 系统上下文（Context）

<!-- 生成提示:begin -->
画 C4 Context 图，用 Mermaid flowchart TB。本系统居中，用户角色与外部系统分列两侧，不拿子系统或模块当节点。

- 人物节点：`(["名称<br/>Person · 一句话说明"])`，第二行固定标 Person。
- 本系统节点：`["名称<br/>Software System<br/>职责"]`，第二行固定标 Software System。
- 外部系统节点：`["名称<br/>External System<br/>用途"]`，第二行固定标 External System。
- 节点之间用带标签的实线箭头连接，标签写交互方式与协议。
- 用 classDef 定义 person / system / external 三色，再以 class 把节点归类。

<!-- 生成提示:end -->

### 1.2 应用划分（Application）

<!-- 生成提示:begin -->
D2 容器图（按 c4-container-diagram skill）。分区 = 应用 / 容器 /
外部系统，另设用户层展示上下文；每个节点标注职责，用图例区分四类。判据：容器 = 本系统自行运维管理的资源，外部系统 =
边界外由他人提供。D2 图保留图名、视角、用途和边界注释。
图的形态（脱敏示例，节点标签按项目实际替换）：

```d2
# 图名: 应用划分（C4 Container）
# 视角: 逻辑视图（用户层 / 应用 / 容器 / 外部系统）
# 用途: 表达系统由哪些应用组成、每个应用由哪些容器构成、边界外依赖什么
# 反映的问题: 应用如何划分、应用内部有哪些可独立运维的资源、与外部系统如何交互
# 边界: 不画模块内部类与接口调用；技术选型归技术架构，部署归部署文档

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
    label: "用户层（角色触点，非容器）"
    width: 1000; grid-columns: 3; grid-gap: 12; style.fill: "#dbeafe"; style.font-color: "#1e293b"; style.stroke: "#2563eb"; style.border-radius: 12
    u1: { label: "<角色一>\n（<触点>）"; width: 317; height: 60; class: module }
    u2: { label: "<角色二>\n（<触点>）"; width: 317; height: 60; class: module }
    u3: { label: "<角色三>\n（<触点>）"; width: 317; height: 60; class: module }
  }

  应用层: {
    label: "应用层（本系统自行运维管理）"
    width: 1000; grid-columns: 2; grid-gap: 12; style.fill: "#ede9fe"; style.font-color: "#1e293b"; style.stroke: "#7c3aed"; style.border-radius: 12
    "<应用一>": { label: "<应用一>"; width: 482; grid-columns: 1; grid-gap: 10; style.fill: "#f3e8ff"; style.font-color: "#1e293b"; style.stroke: "#a855f7"; style.border-radius: 8
      c1: { label: "<容器一>\n（<职责>）"; width: 450; height: 56; class: module }
      c2: { label: "<容器二>\n（<职责>）"; width: 450; height: 56; class: module }
    }
    "<应用二>": { label: "<应用二>"; width: 482; grid-columns: 1; grid-gap: 10; style.fill: "#cffafe"; style.font-color: "#1e293b"; style.stroke: "#06b6d4"; style.border-radius: 8
      c3: { label: "<容器三>\n（<职责>）"; width: 450; height: 56; class: module }
    }
  }

  外部系统层: {
    label: "外部系统层（边界外，他人提供）"
    width: 1000; grid-columns: 2; grid-gap: 12; style.fill: "#e2e8f0"; style.font-color: "#1e293b"; style.stroke: "#64748b"; style.border-radius: 12
    e1: { label: "<外部系统一>\n（<用途>）"; width: 482; height: 56; class: module }
    e2: { label: "<外部系统二>\n（<用途>）"; width: 482; height: 56; class: module }
  }
}

应用划分.用户层 -> 应用划分.应用层: 使用 { style.stroke: "#2563eb" }
应用划分.应用层 -> 应用划分.外部系统层: 调用 { style.stroke: "#64748b" }

classes: {
  module: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#1e40af"; font-color: "#1e293b"; stroke-width: 1 } }
}
```

<!-- 生成提示:end -->

## 2. 模块划分（应用内部模块）

<!-- 生成提示:begin -->
每行一个模块，按业务域而非能力划分，模块名用业务域名，不用「创建 / 查询 / 导出」这类能力名；只做索引，不重复产品能力，不写类、接口、表结构，不列字段。

- 模块：应用内模块名。
- 归属应用：该模块属于哪个应用（取自 1.2）。
- 对应业务域：该模块承载哪个业务域（取自 docs/L2/domain/ 的业务域清单）；纯粹的通用或基础设施模块填「通用」。

<!-- 生成提示:end -->

| 模块 | 归属应用 | 对应业务域 |
|------|----------|------------|
