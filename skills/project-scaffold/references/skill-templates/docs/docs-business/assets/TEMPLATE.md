# 1. 文档描述

<!-- 生成提示:begin -->
写清本文档覆盖什么（业务全景、产品能力、用户故事与用户旅程）与不覆盖什么（领域模型、接口契约、技术选型、部署归对应文档）。
本文档不设承载文档索引章或相关文档聚合链接章；内容条目不使用顺序编号（US-N / 场景 N / AC-N 等），Mermaid autonumber 不受此限制。
<!-- 生成提示:end -->

# 2. 业务全景

## 2.1 参与方与角色

<!-- 生成提示:begin -->
每行一个参与方角色，只写「会使用本业务系统的人或角色」。

- 参与方：组织或外部主体，如 外部客户、平台运营团队、某监管单位。
- 角色：该主体在本业务中的角色名，如 终端用户、管理员。
- 系统内外：系统内 = 登录或操作本系统的一方（即便是外部客户）；系统外 = 不登录本系统、在线下参与业务的角色。它判的是「是否在本系统里完成业务」，与所属组织无关。
- 定位与职责：一句话写清该角色在本业务中的定位和主要职责。

角色须覆盖产品全部用户角色，不是只列典型角色。
排除：中间件与基础设施供应商（对象存储、GPU、模型仓库、数据库、CDN 等）不是参与方，归架构文档。
<!-- 生成提示:end -->

| 参与方 | 角色 | 系统内外 | 定位与职责 |
|--------|------|----------|------------|

## 2.2 业务主线（价值链）

<!-- 生成提示:begin -->
用 Mermaid sequenceDiagram 画跨角色端到端主线。

- participant 为参与方角色（取自 1.1，用 actor，按在主线中首次出现的顺序排列），消息自上而下按业务顺序排列。
- 每个阶段画成其主责角色泳道上的一条自环消息，消息名写阶段名；只画自环，不画跨泳道消息。
- 本图是纯业务视角、不带平台痕迹：不出现系统名、平台名，也不写「调用某某」这类实现说明；阶段由系统完成、没有角色主责时，画在与之交互的角色泳道上，消息名只写阶段名。
- 只画阶段，不展开 UI 状态与后端调用（那是 4.2 的职责）。
- 图的形态：

~~~mermaid
sequenceDiagram
    actor A as <角色 A>
    actor B as <角色 B>
    A ->> A: <阶段>
    B ->> B: <阶段>
    A ->> A: <阶段>
~~~

<!-- 生成提示:end -->

## 2.3 业务模式

<!-- 生成提示:begin -->
每行一个业务模式，按采购方式、定价机制、交易形态、结算方式等实际维度分类。

- 业务模式：模式名。
- 适用场景：什么情况下适用该模式。
- 关键机制：该模式的关键规则或机制。
- 说明：补充说明。

<!-- 生成提示:end -->

| 业务模式 | 适用场景 | 关键机制 | 说明 |
|----------|----------|----------|------|

## 2.4 业务规则

<!-- 生成提示:begin -->
汇总全文档的业务规则与约束，按能力或场景归类；写「业务上必须成立」的约束本身，含业务阈值，不写实现方案与选型理由。本节是 L1
层的大面业务规则；各聚合上的细分与细化归 `docs/L2/domain/` 域文档的「业务规则」节，这里不展开。

- 规则编号：R1、R2…，文档内唯一，不复用。
- 适用范围：该规则约束哪块能力或哪个场景。
- 规则：必须成立的约束，含业务阈值（时长、数量、格式、上限等）。
<!-- 生成提示:end -->

| 规则编号 | 适用范围 | 规则 |
|----------|----------|------|

# 3. 产品能力

## 3.0 图例

<!-- 生成提示:begin -->
图例只用一行写清编码：线型 = 状态（实线已实现 / 虚线待规划）、颜色 = 优先级热力（红核心 / 橙支撑 / 灰边缘）、入口层白底无热力；未启用的通道不写。
口径：能力状态默认用实线表示已实现（含本迭代）、虚线表示待规划，必要时可用点线表示中间态；优先级可选核心、支撑、边缘，并与架构图热力色对应，未使用则省略。
<!-- 生成提示:end -->

## 3.1 产品能力架构图

<!-- 生成提示:begin -->
D2 容器图；图的形态与编码（分层、按能力域分列、竖条、图例、入口层不参与状态编码等）按 c4-container-diagram
skill，本文档不重复其规则；本图图例独立放在 3.0，图内不再重复。D2 图保留图名、视角、用途和边界等自描述信息。
节点按项目实际替换：入口层填实际用户触点 / 终端入口（Web 门户、移动端、对话助手、开放 API
等），它不是能力；业务能力层按实际能力域与能力填；共享业务服务层放跨域共用的横向 / 系统内置能力。
能力归属：能力域取业务域；被两个及以上垂直能力共用的能力归共享业务服务层，单一业务能力归垂直层，开箱自带且无管理界面的能力标为系统内置。垂直能力之间不互相依赖，只依赖共享业务服务层；横向能力与系统内置能力尽量解耦。
能力清单：只列当前存在的能力，不列不存在的功能，不记录已砍掉的能力或「无 Action」的能力，历史决策归 Git。
图的形态（脱敏示例）：

```d2
# 图名: 产品能力架构图
# 视角: 逻辑视图（能力分层 × 状态 × 优先级）
# 用途: 产品能力全貌 + 分层支撑 + 实现状态 + 投资优先级
# 反映的问题: 产品有哪些能力、能力在哪层、做到哪一步、先做哪个
# 边界: 不画技术底座（模型、存储与网络归架构文档）；不是信息架构、不是时间轴
# 编码: 线型=状态（实线已实现/虚线待规划）、颜色=优先级热力（红核心/橙支撑/灰边缘）、入口层白底无热力

vars: {
  d2-config: {
    layout-engine: elk
  }
}

产品能力: {
  grid-rows: 1
  grid-columns: 2
  grid-gap: 16
  style.font-color: "#1e293b"
  style.border-radius: 16

  左主体: {
    label: ""    # 纯布局壳（入口层 + 业务能力层纵向堆叠），label 置空以免 key 被当标题画出来
    grid-rows: 1; grid-columns: 1; grid-gap: 24
    style.font-color: "#1e293b"
    style.border-radius: 12

    入口层: {
      label: "入口层（用户触点，非能力）"
      width: 1000; grid-columns: 4; grid-gap: 12; style.fill: "#dbeafe"; style.font-color: "#1e293b"; style.stroke: "#2563eb"; style.border-radius: 12
      h1: { label: "<Web 门户>\n（<说明>）"; width: 235; height: 60; class: module; style.fill: "#ffffff" }
      h2: { label: "<移动端 / 小程序>\n（<说明>）"; width: 235; height: 60; class: module; style.fill: "#ffffff" }
      h3: { label: "<对话助手>\n（<说明>）"; width: 235; height: 60; class: module; style.fill: "#ffffff" }
      h4: { label: "<开放 API>\n（<说明>）"; width: 235; height: 60; class: module; style.fill: "#ffffff" }
    }

    业务能力层: {
      label: "业务能力层（垂直能力，按能力域分列）"
      width: 1000; grid-columns: 3; grid-gap: 12; style.fill: "#ede9fe"; style.font-color: "#1e293b"; style.stroke: "#7c3aed"; style.border-radius: 12
      能力域一: { label: "<能力域一>"; width: 318; grid-columns: 1; grid-gap: 12; style.fill: "#f3e8ff"; style.font-color: "#1e293b"; style.stroke: "#a855f7"; style.border-radius: 8
        c1: { label: "<能力一>\n（<说明>）"; width: 286; height: 50; class: [core; module] }
        c2: { label: "<能力二>\n（<说明>）"; width: 286; height: 50; class: [core; module] }
        c3: { label: "<能力三>\n（<说明>）"; width: 286; height: 50; class: [support; module] }
        c4: { label: "<能力四>\n（<说明>）"; width: 286; height: 50; class: [support; module] }
      }
      能力域二: { label: "<能力域二>"; width: 318; grid-columns: 1; grid-gap: 12; style.fill: "#cffafe"; style.font-color: "#1e293b"; style.stroke: "#06b6d4"; style.border-radius: 8
        c5: { label: "<能力五>\n（<说明>）"; width: 286; height: 50; class: [core; module] }
        c6: { label: "<能力六>\n（<说明>）"; width: 286; height: 50; class: [support; module] }
        c7: { label: "<能力七>\n（<说明>）"; width: 286; height: 50; class: [edge; module] }
      }
      能力域三: { label: "<能力域三>"; width: 318; grid-columns: 1; grid-gap: 12; style.fill: "#ffedd5"; style.font-color: "#1e293b"; style.stroke: "#f97316"; style.border-radius: 8
        c8: { label: "<能力八>\n（<说明>）"; width: 286; height: 50; class: [core; module] }
        c9: { label: "<能力九>\n（<说明>）"; width: 286; height: 50; class: [core; module] }
        c10: { label: "<能力十>\n（<说明>）"; width: 286; height: 50; class: [support; module] }
        c11: { label: "<能力十一>\n（<说明>）"; width: 286; height: 50; class: [support; module] }
        c12: { label: "<能力十二>\n（<说明>）"; width: 286; height: 50; class: [edge; module] }
      }
    }
  }

  共享业务服务层: {
    label: "共享业务服务层（横向能力，被多个垂直能力共用）"
    grid-columns: 1
    style.fill: "#fef3c7"; style.font-color: "#1e293b"; style.stroke: "#f59e0b"; style.border-radius: 12
    s1: { label: "<共享能力一>\n（<说明>）"; width: 160; height: 90; class: [core; module] }
    s2: { label: "<共享能力二>\n（<说明>）"; width: 160; height: 90; class: [core; module] }
    s3: { label: "<共享能力三>\n（<说明>）"; width: 160; height: 90; class: [core; module] }
    s4: { label: "<共享能力四>\n（<说明>）"; width: 160; height: 90; class: [support; module] }
    s5: { label: "<共享能力五>\n（<说明>）"; width: 160; height: 90; class: [support; module] }
    s6: { label: "<共享能力六>\n（<说明>）"; width: 160; height: 90; class: [support; module] }
  }
}

产品能力.共享业务服务层 -> 产品能力.左主体.业务能力层: 支撑 { style.stroke: "#f59e0b" }
产品能力.左主体.业务能力层 -> 产品能力.左主体.入口层: 支撑 { style.stroke: "#7c3aed" }

classes: {
  # module 只带形状（圆角 / 描边宽），不带 fill / stroke / font-color——颜色由热力类或节点 style.fill 提供
  module: { style: { border-radius: 6; stroke-width: 1 } }
  planned: { style: { stroke-dash: 4; stroke: "#94a3b8"; border-radius: 6 } }
  core: { style: { fill: "#dc2626"; font-color: "#ffffff"; border-radius: 6 } }
  support: { style: { fill: "#f59e0b"; font-color: "#ffffff"; border-radius: 6 } }
  edge: { style: { fill: "#d1d5db"; font-color: "#1f2937"; stroke: "#6b7280"; border-radius: 6 } }
}
```

<!-- 生成提示:end -->

# 4. 用户故事

## 4.1 用户故事清单

<!-- 生成提示:begin -->
每行一个故事，只做索引。
- 角色：故事主角（取自 1.1）。
- 故事标题：一句话故事名。
<!-- 生成提示:end -->

| 角色 | 故事标题 |
|------|----------|

## 4.2 用户故事详情

<!-- 生成提示:begin -->
用户故事是需求最小单元，单个故事自包含（允许为读者理解而适度重复），不写元信息小节。每个故事一节，按角色分组（角色用四级标题，故事用五级标题）。每节三样东西：Connextra
三段式（作为…我想要…以便…）、Given-When-Then
验收标准，以及一张 Mermaid sequenceDiagram。
验收标准用 Given / When / Then 英文术语引导，每条覆盖一个成功或失败分支。
时序图表达角色操作、UI 状态、UI 到后端调用、后端黑盒处理、后端返回、UI 反馈、成功与失败分支及循环；只用 角色名 / UI / 系统后端
三个参与者——第一个参与者写该故事所属角色的名字，不写泛化的「用户」；不写具体页面名称与入口路径，不出现云函数 / AI 服务 /
数据库 / 具体第三方等 L2、L3 术语。
<!-- 生成提示:end -->

# 5. 用户旅程

## 5.1 各角色总旅程

<!-- 生成提示:begin -->
每个系统内角色一节（三级标题 `### <角色>总旅程`）；系统外角色不登录本系统、不走系统链路，不生成。每节一张 Mermaid
sequenceDiagram，画该角色从进入系统到业务结束的完整链路。

- 参与者与泳道约定同 §4.2 的故事时序图（角色名 / UI / 系统后端）：角色泳道放该角色操作与系统反馈，UI
  泳道放界面状态与跳转，系统后端泳道放黑盒处理与返回；UI 泳道不画后端处理，系统后端泳道不画 UI 状态。
- 链路按业务顺序完整展开，不省略阶段，含必要的成功与失败分支及循环；不写具体页面名称与入口路径。
- 不出现云函数 / AI 服务 / 数据库 / 具体第三方等 L2、L3 术语；图的写法与 §4.2 的故事时序图一致。
- 图的形态（`<角色名>` 换成该角色的名字；落盘时可直接写裸角色名，如 `actor 审计人员`，消息里也用该角色名）：

~~~mermaid
sequenceDiagram
  actor R as <角色名>
    participant UI
    participant 系统后端
  R ->> UI: <操作>
    UI ->> 系统后端: <调用>
    系统后端 -->> UI: <返回>
  UI -->> R: <反馈>
~~~

<!-- 生成提示:end -->
