# 模板与 ASCII 架构确认（templates）

> 本文件是 c4-container-diagram skill 的「ASCII 要素清单 + 直接可复制的实测模板」，由 SKILL.md 的 §3 + §5 拆出。**画图/确认结构时按此复制**。主流程与铁律速查见 [SKILL.md](../SKILL.md)。

## Contents

- [3. ASCII 架构确认（画图前必做）](#3-ascii-架构确认画图前必做)
- [5.1 顶部居中标签 — 标准 3 层架构图](#51-顶部居中标签--标准-3-层架构图)
- [5.2 左侧竖排标签 — 类架构师风格](#52-左侧竖排标签--类架构师风格)
- [5.3 层间调用关系（超范围，不提供模板）](#53-层间调用关系超范围不提供模板)
- [5.4 左右分栏 + 贯穿竖条](#54-左右分栏--贯穿竖条)
- [5.5 层内分区（grid 嵌套，2×2 子模块）](#55-层内分区grid-嵌套22-子模块)
- [最简模板（3 层骨架）](#最简模板3-层骨架)

---

## 3. ASCII 架构确认（画图前必做）

**目的**：写 d2 代码块前先与用户对齐图的大体结构（层数 + 每层模块 + 层间连线 + 标签位置），避免写完发现不符返工。

**做法**：理解用户需求后，在对话中直接输出一个 `text` 代码块的 ASCII 架构图（层数 + 每层模块名 + 标签位置 + 层间连线），并简述关键决策（图类型 / 引擎 / 颜色 / 标签样式），问"架构如上，确认后我开始写 d2 代码？或调整？"

**ASCII 架构图要素**（针对多层堆叠分层）：

- 大方框 `[模块名]` 或 `┌──────┐` 表示每层；层间上下堆叠用空行分隔
- 层内子模块用 `│ 模块名 │` 或 `┌─┐` 小方框，**等宽对齐**（用空格填充对齐）
- 标签位置：顶部居中（`[ ① 入口层 ]`）或左侧竖排（`┌──┐` 左侧）
- 层间关系：默认**靠堆叠隐含依赖**；需要显式调用关系时用 `↓` `→` 箭头，**只连层容器之间（父级到父级），不连层内子容器**（见 connection-routing.md）

**示例**（3 层 + 顶部居中标签）：

```text
┌────────────────────────────────────────────┐
│        [ ① 入口层（前台 · 用户触点） ]       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ AI工具首页 │  │ 我的作品 │  │ 用户中心 │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 工具使用页 │  │ 统一结果页 │  │ 教程详情 │    │
│  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────────────────────────┘
┌────────────────────────────────────────────┐
│      [ ② 业务能力层（中台 · 能力复用） ]       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 内容创作 │  │ 内容加工 │  │ 账户商业化 │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐                                  │
│  │ 作品沉淀 │                                  │
│  └──────────┘                                  │
└────────────────────────────────────────────┘
┌────────────────────────────────────────────┐
│        [ ③ 基础支撑层（后台 · 底座） ]          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 用户体系 │  │ 算力体系 │  │ AI 能力 │      │
│  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 数据存储 │  │ 微信支付 │  │ 消息/设置 │    │
│  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────────────────────────┘
```

**确认协议**：

1. 展示 ASCII 后用一句话说明关键决策（层数 + 颜色 + 标签样式 + 依赖关系），问"架构如上，确认后我开始写 d2 代码？或调整？"
2. 用户明确确认（"可以 / OK / 确认 / 就这样"）→ 进入写 d2 代码块
3. 用户提出修改 → 更新 ASCII 图再次确认，直到确认通过
4. **用户未明确确认前，禁止写 d2 代码或调用渲染命令**（阻塞性）

---

## 5.1 顶部居中标签 — 标准 3 层架构图（完整可用，已实测）

> 适用：常规产品/技术架构图。下方代码块已实测渲染验证（3 层堆叠、子模块等宽均匀分布、颜色按层编码、层间无箭头靠堆叠隐含依赖）。

```d2
# 图名（首行必写，SKILL.md 工作流步骤 4：如 `# 产品架构图`，定位靠它）
# === ① 顶部全局配置：elk 布局（架构图必备） ===
vars: {
  d2-config: {
    layout-engine: elk   # elk 对 grid 嵌套 + width 支持最好（dagre 不支持容器 width）
  }
}

# === ② 外层容器：grid-rows:1 grid-columns:1 强制纵向堆叠 ===
整体架构: {
  style.fill: "#ffffff"     # 外层白底，可省
  style.font-color: "#1e293b"
  style.stroke: "#666666"
  style.stroke-width: 2
  style.border-radius: 16
  grid-rows: 1              # ← 关键：强制所有子层纵向堆叠
  grid-columns: 1
  grid-gap: 24             # 层间距

  # === ③ 每层容器：固定 width + grid-columns 控制子模块数 ===
  入口层: {
    label: "① 入口层（前台 · 用户触点）"
    width: 1000            # ← 关键：固定宽度保证各层等宽
    style.fill: "#dbeafe"  # 蓝（用户/入口层惯例色）
    style.font-color: "#1e293b"
    style.stroke: "#2563eb"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 3        # ← 关键：子模块数 = grid-columns 才能填满宽度
    grid-gap: 12
    # width 按 layout-and-grid §6.13 公式: (1000−24−2×12)/3 = 317（6 个子容器 → 2 行 3 列）
    h1: { width: 317; height: 60; class: module }
    h2: { width: 317; height: 60; class: module }
    h3: { width: 317; height: 60; class: module }
    h4: { width: 317; height: 60; class: module }
    h5: { width: 317; height: 60; class: module }
    h6: { width: 317; height: 60; class: module }
  }

  业务能力层: {
    label: "② 业务能力层（中台 · 能力复用）"
    width: 1000
    style.fill: "#ede9fe"  # 紫（业务层惯例色）
    style.font-color: "#1e293b"
    style.stroke: "#7c3aed"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 4        # 4 个能力子域
    grid-gap: 12
    内容创作: { width: 235; height: 220; class: module; style.fill: "#ede9fe"; style.stroke: "#7c3aed"; style.font-color: "#312e81" }
    内容加工: { width: 235; height: 220; class: module; style.fill: "#cffafe"; style.stroke: "#0e7490"; style.font-color: "#164e63" }
    账户商业化: { width: 235; height: 220; class: module; style.fill: "#ffedd5"; style.stroke: "#c2410c"; style.font-color: "#7c2d12" }
    作品沉淀: { width: 235; height: 220; class: module; style.fill: "#dcfce7"; style.stroke: "#15803d"; style.font-color: "#14532d" }
  }

  基础支撑层: {
    label: "③ 基础支撑层（后台 · 底座）"
    width: 1000
    style.fill: "#e2e8f0"  # 灰（支撑层惯例色，可改 stroke-dash: 3 虚线化）
    style.font-color: "#1e293b"
    style.stroke: "#475569"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 3
    grid-gap: 12
    # width 按 layout-and-grid §6.13 公式: (1000−24−2×12)/3 = 317（6 个子容器 → 2 行 3 列）
    f1: { width: 317; height: 60; class: module }
    f2: { width: 317; height: 60; class: module }
    f3: { width: 317; height: 60; class: module }
    f4: { width: 317; height: 60; class: module }
    f5: { width: 317; height: 60; class: module }
    f6: { width: 317; height: 60; class: module }
  }
}

# === ④ 子模块通用样式（单 class 规避溢出，见 c4-container-spec §4.8/d2-syntax-cheatsheet §6.16） ===
classes: {
  module: {
    style: { border-radius: 8; font-color: "#1e293b"; stroke-width: 1 }
  }
}

# === ⑤ 可选：层间箭头（父级到父级，不需要显式调用关系时省略） ===
# 整体架构.入口层 -> 整体架构.业务能力层: "HTTP 调用" { style.stroke: "#2563eb" }
# 整体架构.业务能力层 -> 整体架构.基础支撑层: "RPC 调用" { style.stroke: "#7c3aed" }
```

**实测验证**：上述模板在本机 D2 v0.8.1 + ELK 渲染，三层纵向堆叠、宽度一致、子模块等宽均匀分布。

---

## 5.2 左侧竖排标签 — 类架构师风格

> 适用：需要明确的"左侧层名 + 右侧内容区"对照风格。**相对 §5.1 的差异补丁**（其余结构/样式同 §5.1）：

```diff
- 层容器: { width: 1000; grid-columns: N }        # §5.1：直接铺子模块
+ 层容器: { width: 1200; grid-columns: 2 }         # 左标签 + 右内容
+ 层名_标签: { width: 140; style.fill: "#1e293b"; style.font-color: "#ffffff"; style.bold: true; label: "① 入口层\n前台" }
+ 层名_内容: { width: 1024; grid-columns: N; grid-gap: 12; style.fill: "#dbeafe"; style.stroke: "#2563eb" }
+   # 子容器 width 按 layout-and-grid §6.13 公式: (1024−24−(N−1)×12)/N（3 列 325 / 4 列 241；235 为父1000 场景）
```

> 标签列不设 height（由外层 grid 决定）；内容区子容器挂 `class: module`（c4-container-spec §4.8 单 class 铁律）。

---

## 5.3 层间调用关系（超范围，不提供模板）

> ❌ **本 skill 不画组件级（Component 级）调用关系**（超范围，见 frontmatter）。容器间通信用 connection-routing.md 的完整路径父级箭头（`整体架构.层A -> 整体架构.层B: "标签"`）表达即可。

---

## 5.4 左右分栏 + 贯穿竖条（架构图高频版式）

> 适用：需要**右侧贯穿栏**（图2 支付全景的补偿/对账/运营中心、图4 的日志/消息/权限竖条、图6 的平台总称竖条）或**左侧贯穿标签列**（图4/图6 的层名标签）的架构图。核心：外层 `grid-columns: 2`（或 3）分栏，一侧是"纵向堆叠主体"，另一侧是"贯穿竖条"——**竖条是独立顶层子容器，用 grid 列定位，不要用连接线连各层**。已实测 ELK 渲染通过。**相对 §5.1 的差异补丁**（其余同 §5.1）：

```diff
- 整体架构: { grid-rows: 1; grid-columns: 1 }     # §5.1：单列纵向堆叠
+ 整体: { grid-columns: 2; grid-rows: 1; grid-gap: 16 }   # 左主体 + 右贯穿竖条（3 栏 = 左右双竖条）
+ 左主体: { grid-rows: 1; grid-columns: 1; grid-gap: 24 } # 内部复用 §5.1 各层结构
+ 右侧贯穿竖条: { grid-columns: 1 }                # 不设 width，ELK 自动包裹居中（layout-and-grid §6.13 B）
+   r1: { label: "日志记录"; height: 133 }         # 子容器设 height 不设 width（(600−120−2×40)/3）
```

要点：

- **竖条 width 例外**：**左贯穿标签列**（图4/图6 层名标签，仅放层名文字）可用 `width: 80`；**其余竖条一律不设 width**（让 ELK 按子容器+等边距自动包裹居中，见 layout-and-grid §6.13 B）。
- **左右双竖条**（图5）：外层 `grid-columns: 3`——左竖条 + 主体 + 右竖条。
- 竖条内子容器高度不设等高，靠 grid 自动对齐；竖条内**不要写 `grid-gap`**（layout-and-grid §6.13 B）。

> **⚠️ 竖条标准写法（v0.8.1 实测）**：竖条**不设 width**，让 ELK 按子容器+等边距自动包裹 → 子容器天然居中（见 layout-and-grid §6.13 B）。`width: 80` 的旧写法仅适用于"左贯穿标签列"这种极窄列场景。
>
> **实测结果**（产品能力分层图，v0.8.1）：viewBox `0 0 1578 893`（正常）、竖条宽 281（label 换行后不撑宽）、子容器左距 60 = 右距 60（居中）。**规避要点**：单 class（module）、左主体 1×1 grid、竖条不设 width（见 d2-syntax-cheatsheet §6.16 / layout-and-grid §6.13 B）。

---

## 5.5 层内分区（grid 嵌套，2×2 子模块）

> 适用：层内不铺平子模块，而是**再分几个分区容器**（图1 的系统业务层"基础业务/账户系统"各含 4 方框、图3 服务层左右分区、图6 服务层 3 分区）。核心：层容器内 `grid-columns: N` 分分区，每个分区内部再嵌套 `grid` 放自己的子模块。语法依据 grid-diagrams.md 的嵌套网格范例。

```d2
服务层: {
  width: 800; grid-columns: 3; grid-gap: 12   # ← 先分 3 个分区
  style.fill: "#e2e8f0"; style.font-color: "#1e293b"; style.stroke: "#475569"; style.border-radius: 12

  通信组件: { grid-columns: 1; grid-gap: 8; style.font-color: "#1e293b"; style.border-radius: 8   # 分区 1：内部嵌套
    # 注意: 分区不设 width 时, ELK 按内容定列宽(layout-and-grid §6.2), 分区内子容器 width 是"内容宽"非撑满公式值
    c1: { width: 200; height: 50; class: module }
    c2: { width: 200; height: 50; class: module }
  }
  核心服务总线: { grid-columns: 1; grid-gap: 8; style.font-color: "#1e293b"; style.border-radius: 8  # 分区 2
    s1: { width: 200; height: 50; class: module }
    s2: { width: 200; height: 50; class: module }
  }
  配置监控: { grid-columns: 1; grid-gap: 8; style.font-color: "#1e293b"; style.border-radius: 8      # 分区 3
    m1: { width: 200; height: 50; class: module }
    m2: { width: 200; height: 50; class: module }
  }
}
```

2×2 嵌套（图1）：父容器 `grid-columns: 2` 分 2 个分区，每个分区再 `grid-columns: 2` 放 4 个子容器。**各分区子容器 width 一致**（layout-and-grid §6.11），父容器 width 按 layout-and-grid §6.13 公式算。

---

## 最简模板（3 层骨架）

> 快速起手时用——最简 3 层结构（顶部居中标签、无颜色/无箭头），子容器 width 均按公式。**要美观按 §5.1 套完整规范**。

```d2
# 最简架构图
vars: { d2-config: { layout-engine: elk } }

整体架构: {
  grid-rows: 1
  grid-columns: 1
  grid-gap: 24
  入口层: {
    width: 1000; grid-columns: 3; grid-gap: 12; class: module
    h1: { width: 317; height: 60; class: module }
    h2: { width: 317; height: 60; class: module }
    h3: { width: 317; height: 60; class: module }
  }
  业务层: {
    width: 1000; grid-columns: 2; grid-gap: 12; class: module
    b1: { width: 482; height: 60; class: module }
    b2: { width: 482; height: 60; class: module }
  }
  支撑层: {
    width: 1000; grid-columns: 2; grid-gap: 12; class: module
    s1: { width: 482; height: 60; class: module }
    s2: { width: 482; height: 60; class: module }
  }
}
```
