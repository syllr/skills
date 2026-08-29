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
    - D2 容器图（§2.1 产品能力架构图，图规范见 CONSTITUTION §3.2）
  related: # 关联模板与联动修改
    USER-STORY: 需求源头，新故事需联动在能力图补能力
    DOMAIN-MODEL(Action/Event): 能力→Action 映射（1:N）在它 §3；能力图节点增删需联动 DOMAIN-MODEL §3 Action 增删
    APPLICATION-ARCHITECTURE: 能力→模块映射（N:M）在它 §3.2，能力增删需同步映射
    CONSTITUTION: 图规范在它 §3.2
    DEEP-DIVES: 高复杂度能力详情可链到 L2/deep-dives（能力→Action 映射的深入展开）
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 功能状态（已实现/规划中）判断有歧义时 → 问用户
    - 能力域划分（功能归哪个域）有争议时 → 问用户
    - 优先级判断有歧义时 → 问用户
  flow: # 生成流程
    - 扫描（自主）：读 USER-STORY + DOMAIN-MODEL + 目标文档
    - 已有 PRODUCT → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 定位 → §2.1 产品能力架构图（分层 × 状态线型 × 优先级热力）→ §2.2 能力清单表（含聚合操作索引信息）
  notes: # 生成注意点（怎么生成）
    - §2.1 产品能力架构图是「当前能力清单」唯一源（SSOT），只列存在的功能——不存在的功能不列入（决策过程归 ADR，历史归 TECHDEBT，不写"已砍掉/无 Action"）
    - 编码规则唯一源 = 本 rule 画图规范（全局惯例引用 CONSTITUTION §3.2 第 7 条，不复制）：线型 2 档（实线=已实现 / 虚线=规划中含 POC）、颜色 3 档（红核心 #dc2626 / 橙支撑 #f59e0b / 灰边缘 #d1d5db）、class 叠加（[module; planned; core] 等）、入口层白底无热力；产出文档零编码规则
    - 布局/支撑/尺寸配色见正文 §2.1 实例，规范见 c4-container-diagram skill
    - 图内不画图例容器；d2 元信息注释保留 3 行自描述（见 notes#2），不往正文加编码说明
    - 优先级定义：核心=用户主路径高频价值，支撑=主路径依赖，边缘=探索/低频；未标注则推断并标待确认
    - 能力图节点 → 聚合操作(Action) 为 1:N 映射：一个能力节点可对应多个聚合操作（如「<能力_提取类>」→ 文本提取Action + 图片提取Action）；改名必须联动。一能力一行，「对应 Action」单元格内用顿号并列全部 Action，不拆多行，保证节点数==行数
    - 能力清单表（§2.2）同时承载聚合操作索引（对应 Action 列 + Action 状态列 + 说明列），不另设 Action 索引节
    - 横向能力 vs 垂直能力（关键区分）：
      - 垂直能力（业务功能）：沿业务线展开的能力，有明确业务价值与业务语义——如「<能力_提取类>」「<能力_转化类>」。在架构图业务能力层按能力域组织，对应 `docs/L2/DOMAIN-MODEL.md` §3 中该能力的 Action 列表
      - 横向能力（原子能力）：被多个垂直能力共用的底层能力，无独立业务语义——如「<能力_账户类>」「<能力_用户类>」「<外部_支付>」「<能力_生成类>」「<能力_存储类>」。在架构图归入共享业务服务层，对应 `docs/L2/DOMAIN-MODEL.md` §3 中该原子能力的 Action 列表
      - 判断标准：被 ≥2 个垂直能力共用 → 横向能力；单一业务功能 → 垂直能力
    - 业务解耦原则：垂直能力之间不互相依赖（各自独立）；垂直能力只依赖横向能力（共享业务服务层）；横向能力之间尽量解耦（如<能力_账户类>不依赖支付细节)
    - 模板正文 = 产出目标结构，生成规范见本 rule 画图规范
  checks: # 生成后反向 check · 中文注释
    - "§2.1 架构图能力节点数 == §2.2 能力清单表行数（一一对应，一能力一行；一能力多 Action 时在'对应 Action'单元格内用顿号并列，不拆多行；只列存在的功能，垂直+横向 全覆盖）"
    - "图内不画图例容器；编码规则见 notes#2"
    - "能力图节点名与 DOMAIN-MODEL §3 中对应 Action 名一致（1:N，能力聚合多个 Action 时逐一核对）"
    - "与 USER-STORY 角色/故事、DOMAIN-MODEL Action 一一对应，无遗漏"
    - "§2.2 能力清单表含全部横向能力行，Action 状态列与 DOMAIN-MODEL §3 实际定义一致（已定义标已实现）"
    - "产出文档负面清单：grep -nE '固定元信息|固定画法|三通道' docs/L1/PRODUCT.md 无命中；d2 块内无图例节点"
    - "入口层节点未设热力色（页面/触点无优先级维度，白底实线）"
    - "横向能力识别正确：被 ≥2 个垂直能力共用 → 归共享业务服务层；单一业务 → 归能力域（垂直）"
    - "垂直能力之间无互相依赖（解耦）；垂直只依赖横向能力"
    - "内容条目无顺序编号（能力节点/能力清单表行按功能名标识，不用 F-N/Action-N）"
---

# PRODUCT — 产品规格全景

> 本文档是「<项目名>」的**产品规格全景（PRODUCT 模板）**——L1 产品层的产品级聚合文档。
> 【模板使用指引】复制为 `docs/L1/PRODUCT.md`，按各章节指引填写。
> 【原则】① 章节全保留，用不到留空；② `> 【指引】` 是给填写者的说明，填写后删除；③ **PRODUCT = L1 产品级聚合文档**：聚合 `docs/L2/DOMAIN-MODEL.md` §3 聚合操作（Action）/§4 领域事件（Event），表达能力分层、依赖关系、实现状态与优先级（SSOT）；④ 与具体技术栈/框架无关；⑤ **产品能力图（§2：产品能力架构图 2.1 + 能力清单表 2.2）是功能分层、状态与优先级的唯一事实源**（D2 文本图，直接写入 Markdown），其他文档引用不复制。
> 【占位符声明】本文示例均用 <占位> 表示，实际填具体业务名；占位覆盖提取/转化/生成/交易/账户等场景类型。

---

## 1. 产品定位与目标

> 【指引】一句话：这款产品是什么、给谁用、解决什么问题。README 的"一句话目标"引用本节，不复制。

<一句话目标>

---

## 2. 产品能力图

> 【指引】本节是产品能力的纯内容表达（给人看的），编码规则见 PRODUCT rule 画图规范（给 AI 看的唯一载体）。产品能力架构图是功能分层与优先级的唯一事实源（SSOT），其他文档引用不复制。**产品层不画技术底座**（数据存储/消息/网络/缓存归 TECHNOLOGY-ARCHITECTURE）。

### 2.1 产品能力架构图（唯一图）

> 【指引】左侧主体 + 右侧竖条布局。下方 d2 图为**完整实例**（<产品名>已填充）：① 替换左侧功能节点；② 增减能力域；③ 右侧放横向能力（被 ≥2 个垂直能力共用者）；④ 按状态设线型；⑤ 按优先级设热力色 `class: [module; planned; core]` 等叠加。

```d2
# 图标准元信息 · 中文注释
# 图名: 产品能力架构图（Product Capability Architecture Map）
# 视角: 逻辑视图（能力分层 × 状态 × 优先级）
# 用途: 产品功能全貌 + 分层支撑 + 实现状态 + 投资优先级
# 反映的问题: 产品有哪些能力、能力在哪层、做到哪一步、先做哪个
# 边界: 产品层不画技术底座（数据存储/消息/网络/缓存归 TECHNOLOGY-ARCHITECTURE）
# 说明: 节点 id（h1/c1/s1 等）仅技术标识，与功能名无关；c7 缺失为历史遗留编号
# 校验: 能力节点数（业务能力层+共享业务服务层，不含入口层）== §2.2 表行数，一能力一行；一能力多 Action 在对应 Action 单元格内顿号并列
# 编码: 见本 rule 画图规范（线型=状态/颜色=优先级）

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
      # 业务能力层 · 垂直能力按能力域分列，线型=状态/颜色=优先级
      label: "② 业务能力层（垂直能力 · 按能力域分列）"
      width: 1000; grid-columns: 4; grid-gap: 12; style.fill: "#ede9fe"; style.font-color: "#1e293b"; style.stroke: "#7c3aed"; style.border-radius: 12
      内容获取: { label: "<能力域_提取>"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#f3e8ff"; style.font-color: "#1e293b"; style.stroke: "#a855f7"; style.border-radius: 8
        c1: { label: "<能力_提取类>"; width: 103; height: 50; class: [module; core; planned] }
        c2: { label: "<能力_提取类>"; width: 103; height: 50; class: [module; core; planned] }
        c3: { label: "<能力_提取类>"; width: 103; height: 50; class: [module; core; planned] }
        c4: { label: "<能力_提取类>"; width: 103; height: 50; class: [module; support; planned] }
      }
      内容创作: { label: "<能力域_创作>"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#cffafe"; style.font-color: "#1e293b"; style.stroke: "#06b6d4"; style.border-radius: 8
        c5: { label: "<能力_转化类>"; width: 103; height: 50; class: [module; core; planned] }
        c6: { label: "<能力_生成类>"; width: 103; height: 50; class: [module; edge; planned] }
      }
      商业化: { label: "<能力域_商业化>"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#ffedd5"; style.font-color: "#1e293b"; style.stroke: "#f97316"; style.border-radius: 8
        c8: { label: "<能力_交易类>"; width: 103; height: 50; class: [module; support] }
        c9: { label: "<能力_交易类>"; width: 103; height: 50; class: [module; edge] }
        c10: { label: "<能力_交易类>"; width: 103; height: 50; class: [module; edge] }
      }
      作品沉淀: { label: "<能力域_沉淀>"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#dcfce7"; style.font-color: "#1e293b"; style.stroke: "#22c55e"; style.border-radius: 8
        c11: { label: "<能力_查询类>"; width: 103; height: 50; class: [module; support] }
        c12: { label: "<能力_查询类>"; width: 103; height: 50; class: [module; edge; planned] }
      }
    }
  }

  共享业务服务层: {
    # 共享业务服务层 · 横向原子能力，被多垂直能力共用，右侧竖条支撑左侧主体
    label: "③ 共享业务服务层\n（横向能力）\n被多个垂直能力共用"
    grid-columns: 1
    style.fill: "#fef3c7"; style.font-color: "#1e293b"; style.stroke: "#f59e0b"; style.border-radius: 12
    s1: { label: "<能力_用户类>"; width: 160; height: 90; class: [module; core] }
    s2: { label: "<能力_账户类>"; width: 160; height: 90; class: [module; core; planned] }
    s3: { label: "<能力_生成类> (POC)"; width: 160; height: 90; class: [module; core; planned] }
    s4: { label: "<外部_支付>"; width: 160; height: 90; class: [module; support; planned] }
    s5: { label: "<能力_存储类>"; width: 160; height: 90; class: [module; support; planned] }
  }
}

# 层间支撑关系（上层依赖下层；右侧竖条支撑左侧主体）
产品能力.共享业务服务层 -> 产品能力.左主体.业务能力层: 支撑 { style.stroke: "#f59e0b" }
产品能力.左主体.业务能力层 -> 产品能力.左主体.入口层: 支撑 { style.stroke: "#7c3aed" }

classes: {
  # 样式类 · 中文注释：状态与热力叠加
  module: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#1e40af"; font-color: "#1e293b"; stroke-width: 1 } }
  planned: { style: { stroke-dash: 4; stroke: "#94a3b8" } }
  core: { style: { fill: "#dc2626"; font-color: "#ffffff" } }
  support: { style: { fill: "#f59e0b"; font-color: "#ffffff" } }
  edge: { style: { fill: "#d1d5db"; font-color: "#1f2937"; stroke: "#6b7280" } }
}
```

> 图内 label 为占位，实际填具体业务名

### 2.2 能力清单表

> 【指引】能力清单的**文本化记录**（与 §2.1 架构图同源，SSOT）——**同时承载聚合操作（Action）索引信息**（每个能力对应 DOMAIN-MODEL §3 的 Action 列表 + 实现状态 + 一句话说明），是能力 → Action 的唯一桥接。每能力一行，字段：能力 / 能力域 / 优先级 / 功能状态 / 对应 Action / Action 状态 / 说明。**只列当前存在的功能**——不存在的功能不列入（决策过程归 ADR）。**高复杂度能力可链到 `docs/L2/deep-dives/` 详情**（如 inference-pipeline.md），在说明列标注链接即可。

| 能力     | 能力域   | 优先级（核心/支撑/边缘） | 功能状态（已实现/规划中） | 对应 Action                                                             | Action 状态（已实现/规划中） | 说明     |
| -------- | -------- | ------------------------ | ------------------------- | ----------------------------------------------------------------------- | ---------------------------- | -------- |
| <能力名> | <能力域> | <核心/支撑/边缘>         | <已实现/规划中>           | `<Action 名 1>、<Action 名 2>`（DOMAIN-MODEL §3，1:N 可多个，顿号分隔） | <已实现/规划中>              | <一句话> |
| （补充） |          |                          |                           |                                                                         |                              |          |
