---
name: c4-container-diagram
description: 用 D2（d2lang.com）画 C4 Container Diagram（c4model.com 标准第 2 层 Container 图）——展示系统级容器划分（应用/服务/数据存储）、容器间通信关系、多层大容器纵向堆叠。Markdown 内嵌 d2 代码块渲染（不渲染到独立 SVG）。当用户要画 C4 Container Diagram / 软件系统容器架构图 / 产品技术架构图（多层容器嵌套）时使用。⚠️ 关键规则：外层容器 `grid-rows:1; grid-columns:1` 强制纵向堆叠；每层显式 `width` 统一宽度；子模块 `width` 必须固定（否则列宽由内容决定导致模块数量少的层右侧大片留白）。⚠️ 多板图（layers/scenarios/steps）禁用——拆成多张独立图。
---

# C4 Container Diagram 技能（系统级 · 专用 · D2 实现）

> 本 skill 专门画 **C4 model Container Diagram**（[c4model.com](https://c4model.com/diagrams/container) 标准第 2 层图——展示系统级容器划分与通信关系）。**D2 是实现方式**（[d2lang.com](https://d2lang.com)），本 skill 帮你用 D2 声明式语法画"千层蛋糕"式的多层大容器纵向堆叠 + 子模块等宽均匀分布的架构图。
> 完整 D2 官方文档已本地化到 [references/](references/) 目录（见 [§9 References Tour 关键章节摘要](#9-references-tour-关键章节摘要)），画架构图常用语法在 [§5 实测模板](#51-顶部居中标签-标准-3-层架构图完整可用已实测) 和 [references/grid-diagrams.md](references/grid-diagrams.md) 等章节。

---

## 1. 何时用本 skill 画 C4 Container Diagram

| 想画什么                                          | 本 skill 是否适合                      |
| ----------------------------------------- | ----------------------------------------- |
| 技术架构图（多层大容器纵向堆叠）          | ✓ **强项**                                |
| 产品架构图（应用/业务/基础服务/数据四层） | ✓ **强项**                                |
| 业务能力分层图                            | ✓ **强项**                                |
| 系统架构图（基础设施/数据服务/业务/表现） | ✓ **强项**                                |
| 模块依赖关系（API 调用/数据流向）         | ✓ 用 `a -> b` 边表达                      |
| 微服务架构图                              | ✓ 容器嵌套 + 端口连接                     |
| 流程图 / 时序图 / ER 图                   | △ 改用其他 skill（本 skill 不含这些语法） |

**核心优势**：文本 → git diff 友好 → 版本化；**声明式**，AI 易生成与重构；**自动布局**（默认 elk）；**Markdown 内嵌渲染**，与文档同源。

---

## 2. 工作流（架构图专属，5 步）

> **CRITICAL — BLOCKING（阻塞性要求 #1，对应步骤 1）**: 画架构图前，必须先与用户对齐**几层 / 每层哪些模块 / 标签样式**（顶部居中 vs 左侧竖排）。未对齐前，禁止写 d2 代码。

> **CRITICAL — BLOCKING（阻塞性要求 #2，对应步骤 2）**: 写 d2 代码块前，MUST 先在对话中以 ASCII 架构图向用户展示图的大体结构（层数 + 每层模块 + 层间连线）。用户未确认前，禁止写 d2 代码。（ASCII 图要素见 [3 节](#3-ascii-架构确认画图前必做)）

> **渲染方式**：d2 代码块由项目 Markdown 渲染引擎自动渲染（内嵌 ```d2 即渲染）。AI **不手动渲染 SVG/PNG 到文件**——所有图产物在 Markdown 代码块中。**仅在自检时临时渲染做验证**（见 [7 节](#7-自检与-png-渲染macos)）。

1. **定位目标 Markdown 文档（起点，阻塞性）**：用户调用本 skill 时通常会说"在 `docs/architecture.md` 里画一张产品架构图"。用 Read 读取目标文档，确认：① 文件存在可编辑；② 文档中是否已有 ` ```d2 ` 代码块（有 → 定位到该代码块；无 → 确定插入位置）；③ 文档结构（章节组织、蓝图风格）。**未确认目标文档前，禁止写 d2 代码**
2. **对齐架构图参数（强制，阻塞性 #1）**：与用户确认：① **几层**（通常 3~6 层）；② **每层模块名**（用户会列出每个产品/服务/能力名）；③ **标签样式**（顶部居中 = 主流 / 左侧竖排 = 类架构师风格）；④ **颜色偏好**（蓝/紫/绿/橙/灰五大层系默认即可，或用户指定）；⑤ **是否需要层间箭头**（默认靠堆叠隐含依赖，需显式调用关系才加箭头）
3. **ASCII 架构确认（强制，阻塞性 #2）**：在对话中以 `text` 代码块直接输出 ASCII 架构图（层数 + 每层模块 + 层间连线 + 标签位置），等用户明确确认。用户提出修改则更新 ASCII 图再次确认。（见 [3 节](#3-ascii-架构确认画图前必做)）
4. **在目标文档写/改 ` ```d2 ` 代码块**：在步骤 1 确定的插入位置，写入或修改 ` ```d2 ` 代码块。代码块首行可写 `# 图标准元信息` 注释（图名/视角/用途/状态编码），代码块内 `vars: { d2-config: { layout-engine: elk } }`（默认 elk）。**写完后渲染由 Markdown 引擎自动完成，AI 不做任何输出/渲染动作**
5. **自检（macOS 推荐）**：提取代码块 → 临时 .d2 → `d2 validate` + `d2 render` → `sips` 转 PNG → 识图工具审查结构/对齐/颜色/标签完整。详见 [7 节](#7-自检与-png-渲染macos)。

完成标准：目标 Markdown 文档中 ` ```d2 ` 代码块已写入/更新；自检（PNG 识图或源码核对）通过；渲染结果与第 3 步确认的 ASCII 架构一致。

---

## 3. ASCII 架构确认（画图前必做）

**目的**：写 d2 代码块前先与用户对齐图的大体结构（层数 + 每层模块 + 层间连线 + 标签位置），避免写完发现不符返工。

**做法**：理解用户需求后，在对话中直接输出一个 `text` 代码块的 ASCII 架构图（层数 + 每层模块名 + 标签位置 + 层间连线），并简述关键决策（图类型 / 引擎 / 颜色 / 标签样式），问"架构如上，确认后我开始写 d2 代码？或调整？"

**ASCII 架构图要素**（针对"千层蛋糕"分层）：

- 大方框 `[模块名]` 或 `┌──────┐` 表示每层；层间上下堆叠用空行分隔
- 层内子模块用 `│ 模块名 │` 或 `┌─┐` 小方框，**等宽对齐**（用空格填充对齐）
- 标签位置：顶部居中（`[ ① 入口层 ]`）或左侧竖排（`┌──┐` 左侧）
- 层间关系：默认**靠堆叠隐含依赖**；需要显式调用关系时用 `↓` `→` 箭头

**示例**（3 层 + 顶部居中标签）：

```text
┌────────────────────────────────────────────┐
│        [ ① 入口层（前台 · 用户触点） ]       │
│  ┌──────────┐  ┌──────────┐  ┌──────────�    │
│  │ AI工具首页 │  │ 我的作品 │  │ 用户中心 │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────�    │
│  │ 工具使用页 │  │ 统一结果页 │  │ 教程详情 │    │
│  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────────────────────────┘
┌────────────────────────────────────────────┐
│      [ ② 业务能力层（中台 · 能力复用） ]       │
│  �──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 内容创作 │  │ 内容加工 │  │ 账户商业化 │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐                                  │
│  │ 作品沉淀 │                                  │
│  └──────────┘                                  │
└────────────────────────────────────────────┘
┌────────────────────────────────────────────�
│        [ ③ 基础支撑层（后台 · 底座） ]          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 用户体系 │  │ 算力体系 │  │ AI 能力 │      │
│  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────�  ┌──────────┐    │
│  │ 数据存储 │  │ 微信支付 │  │ 消息/设置 │    │
│  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────────────────────────┘
```

**确认协议**：

1. 展示 ASCII 后用一句话说明关键决策（层数 + 颜色 + 标签样式 + 依赖关系），问"架构如上，确认后我开始写 d2 代码？或调整？"
2. 用户明确确认（"可以 / OK / 确认 / 就这样"）→ 进入第 4 步写 d2 代码块
3. 用户提出修改 → 更新 ASCII 图再次确认，直到确认通过
4. **用户未明确确认前，禁止写 d2 代码或调用渲染命令**（阻塞性）

---

## 4. 架构图分层规范（画之前先定）

### 4.1 典型分层惯例

| 场景       | 推荐分层（自上而下）                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| 产品架构图 | ① 应用层（用户触点） → ② 业务层 → ③ 基础服务层 → ④ 数据层 → ⑤ 服务器层             |
| 技术架构图 | ① 展现层 → ② 应用层 → ③ 服务层 → ④ 数据存储层 → ⑤ 基础设施层                       |
| 业务能力图 | ① 入口层（用户触点）→ ② 业务能力层（中台 · 能力复用）→ ③ 基础支撑层（后台 · 底座） |
| 微服务架构 | ① 展现层 → ② 应用层 → ③ 领域层 → ④ 基础架构层                                      |
| 云平台     | ① SaaS 应用 → ② PaaS 平台 → ③ IaaS 资源                                            |
| 大数据     | ① 数据源 → ② 数据存储 → ③ 数据处理 → ④ 数据应用                                    |

**规则**：下层为基础、为上层服务；层数通常 3~6；同层模块级别统一、粒度统一。

### 4.2 颜色编码惯例（5 大层系）

| 层类型           | 推荐色系   | 浅色填充 fill         | 描边色 stroke         |
| ---------------- | ---------- | --------------------- | --------------------- |
| 用户/入口/展现层 | **蓝色系** | `#eff6ff`             | `#3b82f6` / `#6c8ebf` |
| 业务/应用层      | **紫色系** | `#fdf4ff` / `#f5f3ff` | `#a855f7` / `#8b5cf6` |
| 服务/中台层      | **青色系** | `#ecfeff` / `#f0fdf4` | `#22d3ee` / `#4ade80` |
| 数据层           | **橙色系** | `#fff7ed`             | `#fb923c`             |
| 基础设施/支撑层  | **灰色系** | `#f1f5f9` / `#f8fafc` | `#64748b`             |

**规则**：每层一种主色；同层同色、不同层不同色；整图不超过 5 种主色；浅色填充 + 深色描边 + 深色文字保证对比度。

### 4.3 子模块排列（等宽均匀分布）

- **层内等宽**：同层子模块宽度严格相等，**必须显式固定 `width`**（D2 ELK/dagre 布局默认列宽由内容决定，模块少的层会右侧大片留白——实测发现的关键陷阱，见 [§6.2](#62-子模块-width-必须固定否则右侧大片留白)）
- **均匀分布**：用 `grid-columns: N` + `grid-gap`（N = 该层模块数）
- **横向对齐**：所有层宽度一致（外层容器统一 `width`，如 `width: 1000`）

### 4.4 标签样式（两种主流）

| 样式                         | D2 实现                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| **顶部居中**（最常见）       | 容器直接 `label: "..."`，d2 自动居中放在顶部                 |
| **左侧竖排**（类架构师风格） | 外层用 `grid-columns: 2`：左列 `label: "..."` + 右列内容容器 |

### 4.5 间距规范

| 间距类型                 | 推荐值  |
| ------------------------ | ------- |
| 层间距（外层 grid-gap）  | 16~24px |
| 层内模块间距（grid-gap） | 8~12px  |
| 圆角（大容器）           | 8~16px  |
| 圆角（子模块）           | 4~8px   |
| 描边宽度（stroke-width） | 1~2px   |

---

## 5. 实测模板（直接复制）

### 5.1 顶部居中标签 — 标准 3 层架构图（完整可用，已实测）

> 适用：常规产品/技术架构图。下方代码块已实测渲染验证（3 层堆叠、子模块等宽均匀分布、颜色按层编码、层间无箭头靠堆叠隐含依赖）。

```d2
# === ① 顶部全局配置：elk 布局（架构图必备） ===
vars: {
  d2-config: {
    layout-engine: elk   # elk 对 grid 嵌套 + width 支持最好（dagre 不支持容器 width）
  }
}

# === ② 外层容器：grid-rows:1 grid-columns:1 强制纵向堆叠 ===
整体架构: {
  style.fill: "#ffffff"     # 外层白底，可省
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
    style.fill: "#eff6ff"  # 蓝（用户/入口层惯例色）
    style.stroke: "#6c8ebf"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 3        # ← 关键：子模块数 = grid-columns 才能填满宽度
    grid-gap: 12
    h1: { width: 160; height: 60; class: module }
    h2: { width: 160; height: 60; class: module }
    h3: { width: 160; height: 60; class: module }
    h4: { width: 160; height: 60; class: module }
    h5: { width: 160; height: 60; class: module }
    h6: { width: 160; height: 60; class: module }
  }

  业务能力层: {
    label: "② 业务能力层（中台 · 能力复用）"
    width: 1000
    style.fill: "#f5f3ff"  # 紫（业务层惯例色）
    style.stroke: "#8b5cf6"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 4        # 4 个能力子域
    grid-gap: 12
    内容创作: { width: 235; height: 220; class: purpleCard }
    内容加工: { width: 235; height: 220; class: cyanCard }
    账户商业化: { width: 235; height: 220; class: orangeCard }
    作品沉淀: { width: 235; height: 220; class: greenCard }
  }

  基础支撑层: {
    label: "③ 基础支撑层（后台 · 底座）"
    width: 1000
    style.fill: "#f8fafc"  # 灰（支撑层惯例色，可改 stroke-dash: 3 虚线化）
    style.stroke: "#64748b"
    style.stroke-width: 2
    style.stroke-radius: 12
    grid-columns: 3
    grid-gap: 12
    f1: { width: 160; height: 60; class: module }
    f2: { width: 160; height: 60; class: module }
    f3: { width: 160; height: 60; class: module }
    f4: { width: 160; height: 60; class: module }
    f5: { width: 160; height: 60; class: module }
    f6: { width: 160; height: 60; class: module }
  }
}

# === ④ 子模块通用样式（classes 定义） ===
classes: {
  module: {              # 基础模块样式
    style: { border-radius: 6; stroke: "#1e293b"; stroke-width: 1 }
  }
  purpleCard: {           # 紫色卡（内容创作）
    width: 235
    style.fill: "#fdf4ff"
    style.stroke: "#c084fc"
    style.border-radius: 8
  }
  cyanCard: {             # 青色卡（内容加工）
    width: 235
    style.fill: "#ecfeff"
    style.stroke: "#22d3ee"
    style.border-radius: 8
  }
  orangeCard: {           # 橙色卡（账户商业化）
    width: 235
    style.fill: "#fff7ed"
    style.stroke: "#fb923c"
    style.border-radius: 8
  }
  greenCard: {            # 绿色卡（作品沉淀）
    width: 235
    style.fill: "#f0fdf4"
    style.stroke: "#4ade80"
    style.border-radius: 8
  }
}

# === ⑤ 可选：层间箭头（不需要显式调用关系时省略，靠堆叠隐含） ===
# 整体架构.入口层 -> 整体架构.业务能力层: HTTP 调用 { style.stroke: "#6c8ebf" }
# 整体架构.业务能力层 -> 整体架构.基础支撑层: RPC 调用 { style.stroke: "#8b5cf6" }
```

**实测验证**：上述模板在本机 D2 v0.7.1 + ELK 渲染，三层纵向堆叠、宽度一致、子模块等宽均匀分布。

### 5.2 左侧竖排标签 — 类架构师风格

> 适用：需要明确的"左侧层名 + 右侧内容区"对照风格。

```d2
vars: { d2-config: { layout-engine: elk } }

整体架构: {
  grid-rows: 1
  grid-columns: 1
  grid-gap: 24

  入口层: {
    width: 1200
    grid-columns: 2          # 左标签 + 右内容
    grid-gap: 12

    入口层_标签: {
      width: 140
      style.fill: "#1e293b"
      style.font-color: "#ffffff"
      style.bold: true
      style.border-radius: 8
      label: "① 入口层\n前台"
    }

    入口层_内容: {
      width: 1040
      grid-rows: 1
      grid-columns: 3
      grid-gap: 12
      style.fill: "#eff6ff"
      style.stroke: "#6c8ebf"
      style.stroke-width: 2
      style.border-radius: 12
      h1: { width: 200; height: 60; class: module }
      h2: { width: 200; height: 60; class: module }
      h3: { width: 200; height: 60; class: module }
    }
  }

  业务能力层: {
    width: 1200
    grid-columns: 2
    grid-gap: 12

    业务能力层_标签: {
      width: 140
      style.fill: "#1e293b"
      style.font-color: "#ffffff"
      style.bold: true
      style.border-radius: 8
      label: "② 业务层\n中台"
    }

    业务能力层_内容: {
      width: 1040
      grid-rows: 1
      grid-columns: 4
      grid-gap: 12
      style.fill: "#f5f3ff"
      style.stroke: "#8b5cf6"
      style.stroke-width: 2
      style.border-radius: 12
      内容创作: { width: 235; height: 220; class: purpleCard }
      内容加工: { width: 235; height: 220; class: cyanCard }
      账户商业化: { width: 235; height: 220; class: orangeCard }
      作品沉淀: { width: 235; height: 220; class: greenCard }
    }
  }
}

classes: {
  module: { style: { border-radius: 6; stroke: "#1e293b"; stroke-width: 1 } }
  purpleCard: { width: 235; style.fill: "#fdf4ff"; style.stroke: "#c084fc"; style.border-radius: 8 }
  cyanCard: { width: 235; style.fill: "#ecfeff"; style.stroke: "#22d3ee"; style.border-radius: 8 }
  orangeCard: { width: 235; style.fill: "#fff7ed"; style.stroke: "#fb923c"; style.border-radius: 8 }
  greenCard: { width: 235; style.fill: "#f0fdf4"; style.stroke: "#4ade80"; style.border-radius: 8 }
}
```

### 5.3 层间调用关系（精确模块级）

> 适用：API 设计/数据流分析，需要表达具体模块的调用关系（不仅是层间粒度）。

```d2
vars: { d2-config: { layout-engine: elk } }
整体架构: {
  grid-rows: 1; grid-columns: 1; grid-gap: 24

  入口层: {
    label: "① 入口层"; width: 1000; grid-columns: 3; grid-gap: 12
    style.fill: "#eff6ff"; style.stroke: "#6c8ebf"; style.border-radius: 12
    web: { width: 160; height: 60; class: module }
    mobile: { width: 160; height: 60; class: module }
    pc: { width: 160; height: 60; class: module }
  }

  业务能力层: {
    label: "② 业务能力层"; width: 1000; grid-columns: 3; grid-gap: 12
    style.fill: "#f5f3ff"; style.stroke: "#8b5cf6"; style.border-radius: 12
    api: { width: 220; height: 80; class: module }
    worker: { width: 220; height: 80; class: module }
    auth: { width: 220; height: 80; class: module }
  }

  基础支撑层: {
    label: "③ 基础支撑层"; width: 1000; grid-columns: 3; grid-gap: 12
    style.fill: "#f8fafc"; style.stroke: "#64748b"; style.border-radius: 12
    db: { width: 220; height: 80; class: module }
    cache: { width: 220; height: 80; class: module }
    queue: { width: 220; height: 80; class: module }
  }
}

# === 模块级调用关系（精确）===
整体架构.入口层.web -> 整体架构.业务能力层.api: "HTTPS"
整体架构.入口层.mobile -> 整体架构.业务能力层.api: "HTTPS"
整体架构.业务能力层.api -> 整体架构.业务能力层.worker: "RPC"
整体架构.业务能力层.api -> 整体架构.基础支撑层.db: "读写"
整体架构.业务能力层.worker -> 整体架构.基础支撑层.queue: "MQ"

classes: {
  module: { style: { border-radius: 6; stroke: "#1e293b"; stroke-width: 1 } }
}
```

---

## 6. 常见陷阱（架构图专属）

### 6.1 外层容器必须 `grid-rows:1 grid-columns:1` 强制纵向堆叠

ELK/dagre **不会自动纵向堆叠无连接的独立子容器**——实测会横向并排。

**必须**用外层 wrapper 容器：

```d2
整体架构: {
  grid-rows: 1        # ← 关键
  grid-columns: 1    # ← 关键
  grid-gap: 24

  层1: { ... }
  层2: { ... }
  层3: { ... }
}
```

### 6.2 子模块 `width` 必须固定（否则右侧大片留白）

**实测陷阱**（本机 D2 v0.7.1 + ELK 验证）：grid 列宽**默认由该列内容宽度决定，不会自动均分容器宽度**。

- ❌ 不设 width：3 个模块层 = 4 个模块层宽度不同 → 视觉参差；2 个模块层右侧留白 60%
- ✅ 设 width: 160：所有模块完全等宽 160×60，等距 8px gap 均匀分布

```d2
入口层: {
  width: 1000
  grid-columns: 3
  h1: { width: 160; height: 60; class: module }    # ← 固定 width 必须
  h2: { width: 160; height: 60; class: module }
  h3: { width: 160; height: 60; class: module }
}
```

### 6.3 跨容器边必须用完整路径（否则静默产生重复节点）

引用容器内节点必须写全路径，否则 d2 会**静默创建顶层同名节点**（validate 不报错，渲染才暴露）：

```d2
# ❌ 错：会创建顶层 `app` 重复节点
system.层1 -> app: "调用"

# ✅ 对：用完整路径
system.层1.app -> system.层2.backend: "调用"
```

### 6.4 dagre 不支持容器 `width`/`height`

`dagre` 布局下给容器写 `width: 800` 会报错 `does not support dimensions set on containers`。**架构图必备 `elk` 布局引擎**（本 skill 默认 elk 配方）。

### 6.5 ❌ 多板图（layers/scenarios/steps）禁用

d2 的 `layers` / `scenarios` / `steps` 多板语法**在 Markdown 渲染引擎中无法渲染**（报 `multiboard output cannot be written to stdout`）。**架构图不要用多板**——拆成多张独立 ` ```d2 ` 代码块放在同一文档不同章节。

### 6.6 ❌ TALA 引擎禁用

TALA 是 Terrastruct 的**闭源付费引擎**（商用需许可，免费版出图带水印），本 skill **不使用、不推荐**。所有示例默认 elk（dagre 仅做"dagre 也可"标注）。文档中出现 `layout-engine: tala` 一律改为 `elk`。

### 6.7 容器 `width` 与 `label` 长度的关系

带 label 的容器，`width` 设的是**内容区宽度**，label 会**额外撑大容器实际宽度**。所以如果设 `width: 1000` 但 label 是"② 业务能力层（中台 · 能力复用）"这种长文本，渲染后容器实际宽度可能 1500+。

**规避**：label 保持简短（"② 业务层"），或对宽 label 容器不固定 width。

### 6.8 跨平台字体的渲染差异

中文字符在 ELK/dagre 下按 2 列宽处理，ASCII 输出时字符间会被插入对齐空格（如"应用"渲染为"应 用"），影响 grep 与对齐。**自检用 cat 全文阅读，不要 grep 中文字面**。

---

## 7. 自检与 PNG 渲染（macOS）

> 自检流程：提取代码块 → 临时 .d2 → `d2 validate` + `d2 render` → `sips` 转 PNG → 识图工具审查结构/对齐/颜色/标签完整。

```bash
# 提取代码块到临时文件（白名单见 §2 全局命令安全）
TMPDIR_D2="$TMPDIR/d2md/d2-$(date +%Y%m%d%H%M%S).d2"
mkdir -p "$(dirname "$TMPDIR_D2")"
echo '<提取的 d2 代码>' > "$TMPDIR_D2"

# 校验语法（失败则修代码块）
d2 validate "$TMPDIR_D2"

# 渲染为 SVG
SVG="${TMPDIR_D2%.d2}.svg"
d2 "$TMPDIR_D2" "$SVG"

# 转为 PNG（用 sips 即可，无需 Playwright）
mkdir -p "$TMPDIR/d2png"
sips -s format png "$SVG" --out "$TMPDIR/d2png/$(basename "$SVG" .svg)-$(date +%Y%m%d%H%M%S).png"
```

**识图审查清单**：

1. 三层是否纵向堆叠、左右对齐？
2. 每层子模块是否等宽均匀分布？（若不等宽 = width 未固定）
3. 颜色是否按层编码？（蓝/紫/青/橙/灰）
4. 标签是否完整无截断？
5. 整体是否对称、宽度一致？

**回环规则**：自检发现问题 → 修改 d2 代码块内容 → 重新提取重跑自检，最多 3 轮；问题源于 ASCII 架构本身需调整（用户补充需求/早期方案遗漏）→ 回到 [第 3 节](#3-ascii-架构确认画图前必做) 重新确认；问题源于 d2 代码写错或 width 未固定 → 直接在第 4 步内修复。

---

## 8. CLI 速查（仅架构图相关）

```bash
# === 渲染（自检用） ===
d2 in.d2 out.svg                                # 渲染为 SVG（默认）
d2 in.d2 out.svg --layout=elk                    # 指定布局（默认 elk 已写在 vars 内）

# === 校验 ===
d2 validate in.d2                              # 语法校验（不输出文件）
d2 fmt --check in.d2                            # 格式检查

# === 输出格式 ===
# 架构图主要输出 SVG（PNG/PDF 通过 sips/Preview 二次转换，d2 自带的 PNG/PDF 需 Playwright，不推荐）

# === 主题（白底浅色背景推荐 ID 0 Neutral Default 或 ID 200 Dark Mauve 深色） ===
d2 --theme=0 in.d2 out.svg
d2 --theme=200 in.d2 out.svg
```

---

## 9. References Tour 关键章节摘要

> 下表对应文件均在 `references/` 目录（本 SKILL.md 同目录下），内容已本地化。画架构图最常用：`grid-diagrams.md`、`layouts.md`、`containers.md`、`themes.md`。

| Tour 章节       | 关键内容                                                              | 本地文件                                                   |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Introduction    | Hello World、Hello d2、运行 `d2 input.d2 output.svg` 出图             | [references/intro.md](references/intro.md)                 |
| Shapes          | 节点形状语法（架构图主要用 rectangle/cylinder/stored_data）           | [references/shapes.md](references/shapes.md)               |
| Connections     | 边类型（无向/有向/标签/样式/箭头）、引用连接                          | [references/connections.md](references/connections.md)     |
| Containers      | 容器语法（嵌套/命名空间/父引用）——**架构图核心**                      | [references/containers.md](references/containers.md)       |
| Layouts         | 布局引擎总览 + 方向                                                   | [references/layouts.md](references/layouts.md)             |
| Dagre           | 默认布局引擎（不支持容器 width）                                      | [references/dagre.md](references/dagre.md)                 |
| ELK             | 布局引擎（**架构图推荐**）——支持容器 width/grid                       | [references/elk.md](references/elk.md)                     |
| ~~TALA~~        | ~~架构图专用引擎~~（❌ 付费禁用）                                     | [references/tala.md](references/tala.md)                   |
| Positions       | 位置控制：`near` 锚点 / `top` / `left`                                | [references/positions.md](references/positions.md)         |
| Grid            | **网格布局（架构图核心）**：`grid-columns` / `grid-rows` / `grid-gap` | [references/grid-diagrams.md](references/grid-diagrams.md) |
| Customization   | 主题、字体、3D、阴影（架构图主要用主题 + 描边）                       | [references/themes.md](references/themes.md)               |
| ~~Composition~~ | ~~layers/scenarios/steps 多板~~（❌ 禁用，架构图不用）                | [references/composition.md](references/composition.md)     |
| CLI manual      | d2 全部子命令与参数                                                   | [references/man.md](references/man.md)                     |
| Troubleshooting | 故障排查                                                              | [references/troubleshoot.md](references/troubleshoot.md)   |
