---
description: L1 产品层 文档 PRODUCT 的更新规范——修改 docs/L1/PRODUCT.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L1/PRODUCT.md"
---

# PRODUCT 文档更新规范（L1 产品层）

## 触发条件

当以下任一情况发生时，本规则必须生效：

- 编辑、新增或重建 `docs/L1/PRODUCT.md`
- 关联文档变化需联动更新（来自 generation.related）：
  - `USER-STORY`（需求源头，新故事需联动在能力图补能力）
  - `DOMAIN-MODEL(Action/Event)`（能力→Action 映射（1:N）在它 §3；能力图节点增删需联动 DOMAIN-MODEL §3 Action 增删）
  - `APPLICATION-ARCHITECTURE`（能力→模块映射（N:M）在它 §3.2，能力增删需同步映射）
  - `CONSTITUTION`（图规范在它 §3.2）
- 用户要求"生成/更新 PRODUCT"

## 执行流程

1. **工具**：D2 容器图（§2.1 产品能力架构图，图规范见 CONSTITUTION §3.2）
2. **扫描**（自主，不问用户）：
   - 读 USER-STORY（需求源头）：角色 + 用户故事
   - 读 DOMAIN-MODEL §3 聚合操作（若已有）：Action 列表
   - 扫描目标文档：PRODUCT 是否已存在
3. **问用户**（仅当有歧义）：
   - 功能状态（已实现/开发中/规划）判断有歧义时 → 问用户
   - 能力域划分（功能归哪个域）有争议时 → 问用户
4. **生成流程**：
   - 扫描（自主）：读 USER-STORY + DOMAIN-MODEL + 目标文档
   - 已有 PRODUCT → 参考旧文档有效信息，但结构按本模板重建
   - 按模板生成：§1 定位 → §2.1 产品能力架构图（分层 × 状态线型 × 优先级热力）→ §2.2 能力清单表（含聚合操作索引信息）

## 硬性要求

- §2.1 产品能力架构图是「当前能力清单」唯一源（SSOT），只列存在的功能——不存在的功能不列入（决策过程归 ADR，历史归 TECHDEBT，不写"已砍掉/无 Action"）
- §2.1 产品能力架构图三通道：布局=分层、线型=状态（实线=已实现/虚线=规划中，中间态如 POC 也用虚线）、颜色=优先级热力（红=核心/橙=支撑/灰=边缘）；§2.2 能力清单表与之同源（SSOT 规则见 CONSTITUTION §3.2）
- 能力图节点 → 聚合操作(Action) 为 1:N 映射：一个能力节点可对应多个聚合操作（如「提取文字」→ 文本提取Action + 图片提取Action）；改名必须联动。一能力一行，「对应 Action」单元格内用顿号并列全部 Action，不拆多行，保证节点数==行数
- 能力清单表（§2.2）同时承载聚合操作索引（对应 Action 列 + Action 状态列 + 说明列），不另设 Action 索引节
- 横向能力 vs 垂直能力（关键区分）：
  - 垂直能力（业务功能）：沿业务线展开的能力，有明确业务价值与业务语义——如「视频号提取」「文字配音」。在架构图业务能力层按能力域组织，对应 `docs/L2/DOMAIN-MODEL.md` §3 中该能力的 Action 列表
  - 横向能力（原子能力）：被多个垂直能力共用的底层能力，无独立业务语义——如「算力体系」「用户体系」「微信支付」「AI能力」「文件上传」。在架构图归入共享业务服务层，对应 `docs/L2/DOMAIN-MODEL.md` §3 中该原子能力的 Action 列表
  - 判断标准：被 ≥2 个垂直能力共用 → 横向能力；单一业务功能 → 垂直能力
- 业务解耦原则：垂直能力之间不互相依赖（各自独立）；垂直能力只依赖横向能力（共享业务服务层）；横向能力之间尽量解耦（如算力体系不依赖支付细节）
- **联动**：更新时按 related 同步关联文档（见触发条件）；跨层引用单向向下，下层不链回上层
- **不用 emoji**（S8，grep 校验）
- **图规范**：按 generation.tools 与 CONSTITUTION §3.2 用 D2 / Mermaid / ASCII

## 完成判定

以下全部通过才算完成（generation.checks 逐条）：

- §2.1 架构图能力节点数 == §2.2 能力清单表行数（一一对应，一能力一行；一能力多 Action 时在'对应 Action'单元格内用顿号并列，不拆多行；只列存在的功能，垂直+横向 全覆盖）
- §2.1 架构图节点线型表达状态（实线=已实现/虚线=规划中，中间态如 POC 也用虚线）、颜色表达优先级（红/橙/灰），图例在 D2 图底部独立图例容器中说明；与 §2.2 能力清单表一致
- 能力图节点名与 DOMAIN-MODEL §3 中对应 Action 名一致（1:N，能力聚合多个 Action 时逐一核对）
- 与 USER-STORY 角色/故事、DOMAIN-MODEL Action 一一对应，无遗漏
- §2.2 能力清单表含全部横向能力行，Action 状态列与 DOMAIN-MODEL §3 实际定义一致（已定义标已实现）
- §2 顶部三通道表唯一表达编码规则（线型 2 档 + 颜色 3 档），文档内无重复的图例表、无『虚线+角标』残留
- 入口层节点未设热力色（页面/触点无优先级维度，白底实线）
- 横向能力识别正确：被 ≥2 个垂直能力共用 → 归共享业务服务层；单一业务 → 归能力域（垂直）
- 垂直能力之间无互相依赖（解耦）；垂直只依赖横向能力
- S8：文档不含 emoji（grep 检查通过，详见 CONSTITUTION S8 依据）
- 内容条目无顺序编号（能力节点/能力清单表行按功能名标识，不用 F-N/Action-N）

---

## 模板（生成/更新文档的结构基准）

以下为 `docs/L1/PRODUCT.md` 的模板正文（不含 YAML frontmatter，生成/更新时以此结构为准，按 `> 【指引】` 填写，实例不含 `> 【指引】` 说明）：

# PRODUCT — 产品规格全景

> 本文档是「<项目名>」的**产品规格全景（PRODUCT 模板）**——L1 产品层的产品级聚合文档。
> 【模板使用指引】复制为 `docs/L1/PRODUCT.md`，按各章节指引填写。
> 【原则】① 章节全保留，用不到留空；② `> 【指引】` 是给填写者的说明，填写后删除；③ **PRODUCT = L1 产品级聚合文档**：聚合 `docs/L2/DOMAIN-MODEL.md` §3 聚合操作（Action）/§4 领域事件（Event），表达能力分层、依赖关系、实现状态与优先级（SSOT）；④ 与具体技术栈/框架无关；⑤ **产品能力图（§2：产品能力架构图 2.1 + 能力清单表 2.2）是功能分层、状态与优先级的唯一事实源**（D2 文本图，直接写入 Markdown），其他文档引用不复制。


## 1. 产品定位与目标

> 【指引】一句话：这款产品是什么、给谁用、解决什么问题。README 的"一句话目标"引用本节，不复制。

<一句话目标>


## 2. 产品能力图

> 【固定规范】本节是**产品能力图的标准定义**——用**一张产品能力架构图 + 一份能力清单表**表达产品能力。**产品能力架构图是功能分层、状态与优先级的唯一事实源（SSOT）**，其他文档引用不复制。
>
> **一张图承载三个维度（视觉通道分工）**：
>
> | 视觉通道 | 表达       | 规则                                                                                 |
> | -------- | ---------- | ------------------------------------------------------------------------------------ |
> | **布局** | 能力分层   | 入口层 / 业务能力层 / 共享业务服务层——能力在哪层、谁支撑谁                           |
> | **线型** | 实现状态   | 实线 = 已实现；虚线 = 规划中/待实现（中间态如 POC 验证中也用虚线，细节见能力清单表） |
> | **颜色** | 优先级热力 | 红 = 核心（优先投资）；橙 = 支撑（按需投入）；灰 = 边缘（探索/低优先）               |
>
> **产品不同只体现在**：功能节点内容、能力域数量、状态与优先级标注。
>
> **入口层节点不参与编码**：页面/触点不是能力，无状态与优先级维度（白底实线，仅示意触点存在）。

### 2.1 产品能力架构图（唯一图）

> 【指引】本图同时表达三个维度：**布局**（能力在哪层、谁支撑谁）+ **线型**（实现状态）+ **颜色**（优先级热力）。**产品层不画技术底座**（数据存储/消息/网络/缓存归 TECHNOLOGY-ARCHITECTURE）。
>
> **固定元信息（5 项）**：
>
> - 标准名称：产品能力架构图（Product Capability Architecture Map）
> - 视角：逻辑视图（能力分层 × 状态 × 优先级）
> - 用途：产品功能全貌 + 分层支撑 + 实现状态 + 投资优先级
> - 反映的问题：产品有哪些能力、能力在哪层、做到哪一步、先做哪个
> - 边界：不是 IA（不按页面分）、不是时间轴 roadmap（无日期承诺）、不是部署图
>
> **能力分层（三层 + 右侧竖条）**：
>
> | 层  | 名称           | 业界对应       | 职责               | 能力类型                                              | 图上位置     |
> | --- | -------------- | -------------- | ------------------ | ----------------------------------------------------- | ------------ |
> | ①   | 入口层         | 前台（Front）  | 用户触点、导航分发 | 页面/触点                                             | 左侧顶部     |
> | ②   | 业务能力层     | 中台（Middle） | 通用能力复用       | **垂直能力**（业务功能，对应 DOMAIN-MODEL §3 Action） | 左侧主体     |
> | ③   | 共享业务服务层 | 中台下沉服务   | 横向能力复用       | **横向能力**（原子能力，对应 DOMAIN-MODEL §3 Action） | **右侧竖条** |
>
> **固定画法**：
>
> - 形式：**C4 容器图**（绘制方式见 CONSTITUTION §3.2 图规范）
> - **布局**：左侧 = 主体（入口层 + 业务能力层，纵向堆叠）；右侧 = **共享业务服务层竖条**（横向能力，横跨主体，表达"支撑所有垂直能力"）
> - **层间关系 = 支撑，不是依赖**：上层由下层**支撑**（共享业务服务层支撑业务能力层，业务能力层支撑入口层）——产品能力分层表达"归类/支撑"，不表达"调用/依赖"（依赖是架构视角的概念）
> - **状态用线型表达**（SSOT 规则见 CONSTITUTION §3.2）：**实线框 = 已实现；虚线框 = 规划中/待实现（中间态如 POC 验证中也用虚线，细节在能力清单表标注）**
> - **优先级用颜色表达（热力）**：**红 = 核心（优先投资）；橙 = 支撑（按需投入）；灰 = 边缘（探索/低优先）**——节点 `fill` 设热力色，与线型（状态）叠加
> - **入口层不设热力色**：页面/触点不是能力，无优先级维度（保持白色底）
>
> **使用方式**：下方 d2 图为**完整实例**（AI 智能工具箱已填充，含分层、状态线型与优先级热力）。其他产品复制本模板时：① 把左侧功能节点替换为产品功能；② 业务能力层的能力域按产品增减；③ 右侧共享业务服务层放横向能力（被 ≥2 个垂直能力共用者，如用户体系/算力体系/AI能力/微信支付）；④ **按状态设节点线型**（已实现实线 / 规划中虚线，中间态如 POC 也用虚线）；⑤ **按优先级设节点热力色**（核心红 / 支撑橙 / 边缘灰），`class: [module; planned; core]` 等叠加；⑥ 图底部画图例（线型 + 颜色）。**本图表达分层、支撑、状态与优先级；变更只改本节**（文本可 diff）。

```d2
# 图标准元信息 · 中文注释
# 图名: 产品能力架构图（Product Capability Architecture Map）
# 视角: 逻辑视图（能力分层 × 状态 × 优先级）
# 用途: 产品功能全貌 + 分层支撑 + 实现状态 + 投资优先级
# 反映的问题: 产品有哪些能力、能力在哪层、做到哪一步、先做哪个
# 边界: 产品层不画技术底座（数据存储/消息/网络/缓存归 TECHNOLOGY-ARCHITECTURE）
# 说明: 节点 id（h1/c1/s1 等）仅技术标识，与功能名无关；c7 缺失为历史遗留编号
# 校验: 能力节点数（业务能力层+共享业务服务层，不含入口层与图例）== §2.2 表行数，一能力一行；一能力多 Action 在对应 Action 单元格内顿号并列
# 编码: 线型=状态（实线已实现/虚线规划中）、颜色=优先级热力（红核心/橙支撑/灰边缘）、入口层白底无热力

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
      h1: { label: "AI工具首页"; width: 317; height: 60; class: module }
      h2: { label: "我的作品"; width: 317; height: 60; class: module }
      h3: { label: "用户中心"; width: 317; height: 60; class: module }
      h4: { label: "工具使用页"; width: 317; height: 60; class: module }
      h5: { label: "充值中心"; width: 317; height: 60; class: module }
      h6: { label: "邀请/推广页"; width: 317; height: 60; class: module }
    }

    业务能力层: {
      # 业务能力层 · 垂直能力按能力域分列，线型=状态/颜色=优先级
      label: "② 业务能力层（垂直能力 · 按能力域分列）"
      width: 1000; grid-columns: 4; grid-gap: 12; style.fill: "#ede9fe"; style.font-color: "#1e293b"; style.stroke: "#7c3aed"; style.border-radius: 12
      内容获取: { label: "内容获取"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#f3e8ff"; style.font-color: "#1e293b"; style.stroke: "#a855f7"; style.border-radius: 8
        c1: { label: "视频号提取"; width: 103; height: 50; class: [core; planned] }
        c2: { label: "图片去水印"; width: 103; height: 50; class: [core; planned] }
        c3: { label: "提取文字"; width: 103; height: 50; class: [core; planned] }
        c4: { label: "视频转字幕"; width: 103; height: 50; class: [support; planned] }
      }
      内容创作: { label: "内容创作"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#cffafe"; style.font-color: "#1e293b"; style.stroke: "#06b6d4"; style.border-radius: 8
        c5: { label: "文字配音"; width: 103; height: 50; class: [core; planned] }
        c6: { label: "AI绘画"; width: 103; height: 50; class: [edge; planned] }
      }
      商业化: { label: "商业化"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#ffedd5"; style.font-color: "#1e293b"; style.stroke: "#f97316"; style.border-radius: 8
        c8: { label: "充值中心"; width: 103; height: 50; class: [support; module] }
        c9: { label: "推广收益"; width: 103; height: 50; class: [edge; module] }
        c10: { label: "邀请分享"; width: 103; height: 50; class: [edge; module] }
      }
      作品沉淀: { label: "作品沉淀"; width: 235; grid-columns: 2; grid-gap: 12; style.fill: "#dcfce7"; style.font-color: "#1e293b"; style.stroke: "#22c55e"; style.border-radius: 8
        c11: { label: "我的作品"; width: 103; height: 50; class: [support; module] }
        c12: { label: "分享功能"; width: 103; height: 50; class: [edge; planned] }
      }
    }
  }

  共享业务服务层: {
    # 共享业务服务层 · 横向原子能力，被多垂直能力共用，右侧竖条支撑左侧主体
    label: "③ 共享业务服务层\n（横向能力）\n被多个垂直能力共用"
    grid-columns: 1
    style.fill: "#fef3c7"; style.font-color: "#1e293b"; style.stroke: "#f59e0b"; style.border-radius: 12
    s1: { label: "用户体系"; width: 160; height: 90; class: [core; module] }
    s2: { label: "算力体系"; width: 160; height: 90; class: [core; planned] }
    s3: { label: "AI能力 (POC)"; width: 160; height: 90; class: [core; planned] }
    s4: { label: "微信支付"; width: 160; height: 90; class: [support; planned] }
    s5: { label: "文件上传"; width: 160; height: 90; class: [support; planned] }
  }
}

# 层间支撑关系（上层依赖下层；右侧竖条支撑左侧主体）
产品能力.共享业务服务层 -> 产品能力.左主体.业务能力层: 支撑 { style.stroke: "#f59e0b" }
产品能力.左主体.业务能力层 -> 产品能力.左主体.入口层: 支撑 { style.stroke: "#7c3aed" }

# 图例 · 中文注释：线型=状态、颜色=优先级，入口层白底无热力
图例: {
  grid-columns: 3; grid-gap: 12; style.fill: "#f8fafc"; style.stroke: "#94a3b8"; style.border-radius: 8
  线型图例: { label: "线型=状态\n实线=已实现\n虚线=规划中/POC"; width: 340; style.fill: "#ffffff"; style.stroke: "#1e40af"; style.border-radius: 6; style.font-color: "#1e293b" }
  颜色图例: { label: "颜色=优先级\n红=核心 橙=支撑 灰=边缘"; width: 340; style.fill: "#ffffff"; style.stroke: "#94a3b8"; style.border-radius: 6; style.font-color: "#1e293b" }
  入口说明: { label: "入口层=白底实线\n页面/触点非能力\n无优先级维度"; width: 340; style.fill: "#ffffff"; style.stroke: "#1e40af"; style.border-radius: 6; style.font-color: "#1e293b" }
}

classes: {
  # 样式类 · 中文注释：状态与热力叠加
  module: { style: { border-radius: 6; fill: "#ffffff"; stroke: "#1e40af"; font-color: "#1e293b"; stroke-width: 1 } }
  planned: { style: { stroke-dash: 4; stroke: "#94a3b8" } }
  core: { style: { fill: "#dc2626"; font-color: "#ffffff" } }
  support: { style: { fill: "#f59e0b"; font-color: "#ffffff" } }
  edge: { style: { fill: "#d1d5db"; font-color: "#1f2937"; stroke: "#6b7280" } }
}
```

### 2.2 能力清单表

> 【指引】能力清单的**文本化记录**（与 §2.1 架构图同源，SSOT）——**同时承载聚合操作（Action）索引信息**（每个能力对应 DOMAIN-MODEL §3 的 Action 列表 + 实现状态 + 一句话说明），是能力 → Action 的唯一桥接。每能力一行，字段：能力 / 能力域 / 优先级 / 功能状态 / 对应 Action / Action 状态 / 说明。**只列当前存在的功能**——不存在的功能不列入（决策过程归 ADR）。

| 能力     | 能力域   | 优先级（核心/支撑/边缘） | 功能状态（已实现/规划中/中间态） | 对应 Action                                                             | Action 状态（已实现/规划中） | 说明     |
| -------- | -------- | ------------------------ | -------------------------------- | ----------------------------------------------------------------------- | ---------------------------- | -------- |
| <能力名> | <能力域> | <核心/支撑/边缘>         | <已实现/规划中/中间态>           | `<Action 名 1>、<Action 名 2>`（DOMAIN-MODEL §3，1:N 可多个，顿号分隔） | <已实现/规划中>              | <一句话> |
| （补充） |          |                          |                                  |                                                                         |                              |          |
