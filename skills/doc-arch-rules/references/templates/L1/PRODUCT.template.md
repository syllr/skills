---
title: PRODUCT — 产品规格全景
doc_type: template
layer: L1
description: L1 产品层 文档 PRODUCT 的更新规范——修改 docs/L1/PRODUCT.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L1/PRODUCT.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - D2 容器图（§2.1 产品能力架构图 + §2 顶部图例图，图规范见 references/diagram-spec.md）
  related: # 关联模板与联动修改
    USER-STORY: 需求源头，新故事需联动在能力图补能力
    DOMAIN-MODEL(Action/Event): 能力→Action 映射（1:N）在它 §3；能力增删需联动 DOMAIN-MODEL §3 Action 增删，**能力状态（已实现/待规划）是全部实现视图的建模边界——PRODUCT 标「待规划」的能力，DOMAIN/API/APPLICATION/STRUCTURE/openapi 全部不建模不留 stub，仅 PRODUCT 保留待规划标注（产品全景含规划；双向强制）**
    APPLICATION-ARCHITECTURE: 能力→模块映射（N:M）在它 §3.2，能力增删需同步映射
    图规范见 references/diagram-spec.md
    DEEP-DIVES: 高复杂度能力详情可链到 L2/deep-dives（能力→Action 映射的深入展开）
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 能力状态（已实现（含本迭代）/待规划）判断有歧义时 → 问用户
    - 能力域划分（功能归哪个层）有争议时 → 问用户
  flow: # 生成流程
    - 扫描（自主）：读 USER-STORY + DOMAIN-MODEL + 目标文档
    - 已有 PRODUCT → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 定位 → §2 图例图（独立 d2）→ §2.1 产品能力架构图（分层 × 状态线型）→ §2.2 能力清单表（能力/能力域/类型/能力状态/说明）
  notes: # 生成注意点（怎么生成）
    - §2.1 产品能力架构图是「当前能力清单」的唯一源，只列存在的功能——不存在的功能不列入（决策过程归 ADR，历史归 ADR，不写"已砍掉/无 Action"）
    - 编码规则唯一源 = 本 rule 画图规范（全局惯例引用 references/diagram-spec.md 能力图编码规范，不复制）：线型 2 档或 3 档（2 档 `solid`=已实现含本迭代 / `dashed`=待规划；3 档 `solid`=已实现 / `dashed`=规划中 / `dotted`=中间态）、**优先级热力可选（核心/支撑/边缘，与架构图热力色对应；不用则省略）**、入口层白底不参与编码；产出文档零编码规则
    - 布局/支撑/尺寸配色见正文 §2.1 实例，规范见 c4-container-diagram skill
    - 图例**独立成 §2 顶部 d2 图**（实线/虚线两节点），架构图内不画图例、不重复编码说明；d2 元信息注释保留自描述（图名/视角/用途）
    - 能力图节点 → 聚合操作(Action) 为 1:N 映射、**映射与 Action 详情见 DOMAIN-MODEL §3**（产品层不平铺 Action 签名——产品层不暴露实现）；PRODUCT 能力表「对应 Action」「Action 状态」列可选（产品层可平铺），DOMAIN-MODEL §3 仍为 SSOT
    - 能力清单表（§2.2）每能力一行，字段：能力 / 能力域 / 类型 / 能力状态 / 说明（不另设 Action 索引节，不承载 Action 平铺）
    - 横向能力 vs 垂直能力（关键区分）：
      - 垂直能力（业务功能）：沿业务线展开的能力，有明确业务价值与业务语义——如「<能力_提取类>」「<能力_转化类>」。在架构图业务能力层按能力域组织
      - 横向能力（原子能力）：被多个垂直能力共用的底层能力，无独立业务语义——如「<能力_账户类>」「<能力_用户类>」「<外部_支付>」。在架构图归入共享业务服务层；「系统内置 / 种子数据底座能力」（默认智能体/提示词/数据源/预置规则文档/预置工具等开箱自带、无管理界面、业务直接使用）也归入共享业务服务层，**可独立成子表（内置默认项/说明），也可合并进主表 + 「类型=系统内置」列标记，二选一**
      - 判断标准：被 ≥2 个垂直能力共用 → 横向能力；单一业务功能 → 垂直能力；开箱自带无管理界面 → 系统内置（类型列标记）
      - **能力域 = 业务域（贴近读者）**：能力域列取值为业务域（如「审计项目管理」「用户权限」），架构分层（业务能力层 / 共享业务服务层）由 §2.1 图承载，不在表内重复分层语义；垂直能力二级分组（如「<能力_提取类>」所在的能力域）仅用于架构图分列
    - 业务解耦原则：垂直能力之间不互相依赖（各自独立）；垂直能力只依赖共享业务服务层；横向/系统内置能力之间尽量解耦
    - **能力状态是 DOMAIN-MODEL 建模边界**（双向强制，case 5/7）：PRODUCT §2 能力状态（已实现/待规划）以 PRODUCT 为准——标「待规划」的能力，DOMAIN-MODEL 不深建 Action/状态机/ER（仅 PRODUCT 层保留待规划标注）；PRODUCT 增/删能力 → DOMAIN-MODEL 增/删 Action；DOMAIN-MODEL 增/删 Action → PRODUCT 同步能力状态。**禁止「PRODUCT 无、DOMAIN 有」漂移**
    - 模板正文 = 产出目标结构，生成规范见本 rule 画图规范
  checks: # 生成后反向 check · 中文注释
    - "§2.1 业务能力层节点数 == §2.2 表「类型=业务能力」行数（一一对应，一能力一行）；共享业务服务层节点数 == §2.2 表「类型=系统内置/横向」行数——校验按「类型」分维度，非笼统节点数==总行数"
    - "图例为「§2 顶部独立 d2 图」，架构图内无图例节点；编码规则见 notes#2"
    - "§2.2 能力表「对应 Action」「Action 状态」列可选（产品层可平铺）；Action 映射见 DOMAIN-MODEL §3（引用不复制，SSOT 在 DOMAIN-MODEL §3）"
    - "与 USER-STORY 角色/故事、DOMAIN-MODEL Action 一一对应，无遗漏"
    - "系统内置/横向能力：独立成子表（内置默认项/说明）或合并进主表 +「类型」列标记，二选一"
    - "能力域列取值为业务域（贴近读者），架构图层由 §2.1 图承载，不在表内重复分层语义"
    - "产出文档负面清单：grep -nE '固定元信息|固定画法' docs/L1/PRODUCT.md 无命中；能力表优先级列可选（核心/支撑/边缘，与架构图热力色对应；不用则省略）"
    - "入口层节点未参与能力编码（页面/触点无状态维度，白底实线）"
    - "横向能力识别正确：被 ≥2 个垂直能力共用 → 归共享业务服务层；单一业务 → 归能力域（垂直）；开箱自带 → 系统内置"
    - "垂直能力之间无互相依赖（解耦）；垂直只依赖共享业务服务层"
    - "内容条目无顺序编号（能力节点/能力清单表行按功能名标识，不用 F-N/Action-N）"
---

# PRODUCT — 产品规格全景

> 本文档是「<项目名>」的**产品规格全景（PRODUCT 模板）**——L1 产品层的产品级聚合文档。
> 【模板使用指引】复制为 `docs/L1/PRODUCT.md`，按各章节指引填写。
> 【原则】① 章节全保留，用不到留空；② `> 【指引】` 是给填写者的说明，填写后删除；③ **PRODUCT = L1 产品级聚合文档**：聚合 `docs/L2/DOMAIN-MODEL.md` §3 聚合操作（Action）/§4 领域事件（Event），表达能力分层与实现状态；④ 与具体技术栈/框架无关；⑤ **产品能力图（§2：图例图 + 能力架构图 2.1 + 能力清单表 2.2）是功能分层与状态的维护处**（D2 文本图，直接写入 Markdown），其他文档引用不复制；⑥ **产品能力图优先级热力可选**（核心/支撑/边缘，与架构图热力色对应；不用则省略——投资优先级是主观决策，非能力属性，默认不图上；图例 = 状态线型）。
> 【占位符声明】本文示例均用 <占位> 表示，实际填具体业务名；占位覆盖提取/转化/生成/交易/账户等场景类型。

---

## 1. 产品定位与目标

> 【指引】一句话：这款产品是什么、给谁用、解决什么问题。README 的"一句话目标"引用本节，不复制。

<一句话目标>

---

## 2. 产品能力图

> 【指引】本节为产品能力全景三件套：§2.0 图例图 + §2.1 产品能力架构图（本图为**产品能力架构图**：能力分层 × 状态）+ §2.2 能力清单表。产品能力架构图是功能分层与状态的**维护处**，其他文档引用不复制；产品层不画技术底座（数据存储/消息/网络/缓存归 TECHNOLOGY-ARCHITECTURE）。图规范见 references/diagram-spec.md。

### 2.0 图例（状态线型编码规则）

> 【指引】本图为**产品能力图例**：两节点 label 即状态线型编码含义（实线=已实现含本迭代 / 虚线=待规划），随文档保留；图规范见 references/diagram-spec.md。

```d2
# 图名: 产品能力图例（Product Capability Legend）
# 视角: 编码规则说明（线型 = 状态）
# 用途: 产品能力架构图的视觉通道图例——线型（已实现含本轮 / 待规划）
# 说明: 独立图例图（规范见 references/diagram-spec.md），与产品能力架构图（§2.1）分开；状态线型两档或三档（两档=已实现/待规划；三档=已实现/规划中/中间态）

vars: { d2-config: { layout-engine: elk } }

产品能力图例: {
 grid-columns: 2; grid-gap: 12; style.font-color: "#1e293b"; style.border-radius: 12
 l1: { label: "已实现（实线）\n含本迭代要实现"; width: 482; height: 60; class: [solid] }
 l2: { label: "待规划（虚线）\n本迭代不做"; width: 482; height: 60; class: [dashed] }
}

classes: {
 solid: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#1e40af"; font-color: "#1e293b"; stroke-width: 3 } }
 dashed: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#64748b"; font-color: "#1e293b"; stroke-width: 3; stroke-dash: 10 } }
}
```

### 2.1 产品能力架构图（唯一图）

> 【指引】下方 d2 图为**完整实例**（<产品名>已填充）：替换为实际能力节点与能力域，右侧放横向/系统内置能力（被 ≥2 个垂直能力共用者 + 开箱自带者）；布局、配色与状态线型沿用实例样式（图规范见 references/diagram-spec.md）。

```d2
# 图标准元信息 · 中文注释
# 图名: 产品能力架构图（Product Capability Architecture Map）
# 视角: 逻辑视图（能力分层 × 状态）
# 用途: 产品功能全貌 + 分层支撑 + 实现状态
# 反映的问题: 产品有哪些能力、能力在哪层、做到哪一步
# 边界: 产品层不画技术底座（数据存储/消息/网络/缓存归 TECHNOLOGY-ARCHITECTURE）
# 说明: 节点 id（h1/c1/s1 等）仅技术标识，与功能名无关；能力状态两档或三档（两档=已实现（含本迭代）/待规划；三档=已实现/规划中/中间态，线型映射实线/虚线/点线）
# 校验: 业务能力层节点数 == §2.2 表「类型=业务能力」行数，一能力一行；共享业务服务层节点数 == §2.2 表「类型=系统内置/横向」行数；能力 → Action 映射详见 DOMAIN-MODEL §3

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
 grid-rows: 1; grid-columns: 1; grid-gap: 24
 style.font-color: "#1e293b"
 style.border-radius: 12

 入口层: {
 # 入口层 · 仅示意触点，非能力，无状态与热力维度，白底实线
 label: "① 入口层（前台 · 用户触点）"
 width: 1000; grid-columns: 3; grid-gap: 12; style.fill: "#dbeafe"; style.font-color: "#1e293b"; style.stroke: "#2563eb"; style.border-radius: 12
 h1: { label: "<页面_首页>"; width: 317; height: 60; class: module }
 h2: { label: "<页面_作品>"; width: 317; height: 60; class: module }
 h3: { label: "<页面_用户中心>"; width: 317; height: 60; class: module }
 h4: { label: "<页面_工具使用>"; width: 317; height: 60; class: module }
 h5: { label: "<页面_充值>"; width: 317; height: 60; class: module }
 h6: { label: "<页面_推广>"; width: 317; height: 60; class: module }
 }

 业务能力层: {
 # 业务能力层 · 垂直能力按能力域分列，线型=状态（实线=已实现含本迭代、虚线=待规划）
 label: "② 业务能力层（垂直能力 · 按能力域分列）"
 width: 1000; grid-columns: 4; grid-gap: 12; style.fill: "#ede9fe"; style.font-color: "#1e293b"; style.stroke: "#7c3aed"; style.border-radius: 12
 内容获取: { label: "<能力域_提取>"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#f3e8ff"; style.font-color: "#1e293b"; style.stroke: "#a855f7"; style.border-radius: 8
 c1: { label: "<能力_提取类>"; width: 103; height: 50; class: [solid] }
 c2: { label: "<能力_提取类>"; width: 103; height: 50; class: [solid] }
 c3: { label: "<能力_提取类>"; width: 103; height: 50; class: [dashed] }
 c4: { label: "<能力_提取类>"; width: 103; height: 50; class: [dashed] }
 }
 内容创作: { label: "<能力域_创作>"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#cffafe"; style.font-color: "#1e293b"; style.stroke: "#06b6d4"; style.border-radius: 8
 c5: { label: "<能力_转化类>"; width: 103; height: 50; class: [solid] }
 c6: { label: "<能力_生成类>"; width: 103; height: 50; class: [dashed] }
 c7: { label: "<能力_编辑类>"; width: 103; height: 50; class: [solid] }
 }
 商业化: { label: "<能力域_商业化>"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#ffedd5"; style.font-color: "#1e293b"; style.stroke: "#f97316"; style.border-radius: 8
 c8: { label: "<能力_交易类>"; width: 103; height: 50; class: [solid] }
 c9: { label: "<能力_交易类>"; width: 103; height: 50; class: [dashed] }
 c10: { label: "<能力_交易类>"; width: 103; height: 50; class: [dashed] }
 }
 作品沉淀: { label: "<能力域_沉淀>"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#dcfce7"; style.font-color: "#1e293b"; style.stroke: "#22c55e"; style.border-radius: 8
 c11: { label: "<能力_查询类>"; width: 103; height: 50; class: [solid] }
 c12: { label: "<能力_查询类>"; width: 103; height: 50; class: [dashed] }
 }
 }
 }

 共享业务服务层: {
 # 共享业务服务层 · 横向能力与系统内置底座（被多垂直能力共用 / 开箱自带无管理界面），右侧竖条支撑左侧主体
 label: "③ 共享业务服务层\n（横向/系统内置）"
 grid-columns: 1
 style.fill: "#fef3c7"; style.font-color: "#1e293b"; style.stroke: "#f59e0b"; style.border-radius: 12
 s1: { label: "<能力_用户类>"; width: 160; height: 90; class: [solid] }
 s2: { label: "<能力_账户类>"; width: 160; height: 90; class: [solid] }
 s3: { label: "<能力_生成类>"; width: 160; height: 90; class: [dashed] }
 s4: { label: "<外部_支付>"; width: 160; height: 90; class: [dashed] }
 s5: { label: "<能力_存储类>"; width: 160; height: 90; class: [solid] }
 }
}

# 层间支撑关系（上层依赖下层；右侧竖条支撑左侧主体）
产品能力.共享业务服务层 -> 产品能力.左主体.业务能力层: 支撑 { style.stroke: "#f59e0b" }
产品能力.左主体.业务能力层 -> 产品能力.左主体.入口层: 支撑 { style.stroke: "#7c3aed" }

classes: {
 # 样式类 · 中文注释：线型表达状态（实线=已实现含本迭代、虚线=待规划）
 module: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#1e40af"; font-color: "#1e293b"; stroke-width: 1 } }
 solid: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#1e40af"; font-color: "#1e293b"; stroke-width: 2 } }
 dashed: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#64748b"; font-color: "#1e293b"; stroke-width: 2; stroke-dash: 8 } }
}
```

> 图内 label 为占位，实际填具体业务名

### 2.2 能力清单表

> 【指引】能力清单的**文本化记录**——产品层能力清单，每能力一行，字段：能力 / 能力域 / 类型 / 能力状态 / 说明（可选列：优先级 / 对应 Action / Action 状态）。**类型**区分「业务能力」与「系统内置/横向」（横向 = 被 ≥2 个垂直能力共用；系统内置 = 开箱自带、无管理界面、业务直接使用——可独立成子表（内置默认项/说明），也可合并进主表用类型列标记，二选一）。**只列当前存在的功能**——不存在的功能不列入（决策过程归 ADR）。**能力状态两档或三档（两档=已实现（含本迭代要实现）/待规划；三档=已实现/规划中/中间态）**，由 §2.1 架构图线型表达（两档实线/虚线；三档实线/虚线/点线）。**能力 → 聚合操作（Action）的映射与 Action 签名/状态/事件详见 `DOMAIN-MODEL` §3（SSOT）**。

| 能力     | 能力域           | 类型（业务能力/系统内置·横向） | 能力状态（已实现/待规划） | 优先级（可选）   | 对应 Action（可选） | Action 状态（可选） | 说明     |
| -------- | ---------------- | ------------------------------ | ------------------------- | ---------------- | ------------------- | ------------------- | -------- |
| <能力名> | <能力域(业务域)> | <业务能力/系统内置·横向>       | <已实现/待规划>           | <核心/支撑/边缘> | <Action 名>         | <已实现/规划中>     | <一句话> |
| （补充） |                  |                                |                           |                  |                     |                     |          |
