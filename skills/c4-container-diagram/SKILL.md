---
name: c4-container-diagram
description: 用 D2（d2lang.com）画 C4 Container Diagram（c4model.com 标准第 2 层 Container 图）——展示系统级容器划分（应用/服务/数据存储）、容器间通信关系、多层大容器嵌套。Markdown 内嵌 d2 代码块渲染。当用户要画 C4 Container Diagram / 软件系统容器架构图 / 产品技术架构图（多层容器嵌套）时使用。⚠️ 铁律：每一层嵌套（A→B→C→D）都必须为子容器显式算 `width`（公式见 §6.13），仅在最外层算 width 不够——上层中间层又会出现"贴左偏左"。⚠️ 多板图（layers/scenarios/steps）禁用。
---

# C4 Container Diagram 技能（系统级 · 专用 · D2 实现）

> 本 skill 专门画 **C4 model Container Diagram**（[c4model.com](https://c4model.com/diagrams/container) 标准第 2 层图——展示系统级容器划分与通信关系）。**D2 是实现方式**（[d2lang.com](https://d2lang.com)），本 skill 帮你用 D2 声明式语法画"千层蛋糕"式的多层大容器纵向堆叠 + 子模块等宽均匀分布的架构图。
> 完整 D2 官方文档已本地化到 [references/](references/) 目录（见 [§9 References 关键章节摘要](#9-references-关键章节摘要精简版)），画架构图常用语法在 [§5.1 顶部居中标签模板](#51-顶部居中标签--标准-3-层架构图完整可用已实测) 和 [references/grid-diagrams.md](references/grid-diagrams.md) 等章节。

---

## 1. 画什么：C4 Container Diagram（先对齐目标）

### 1.1 定义：什么是 C4 Container Diagram

**C4 model**（c4model.com）第 2 层图，展示**一个软件系统由哪些容器组成**。C4 官方定义（调研自 c4model.com）：

> "A **container** represents an application or data store... The container diagram shows the high-level technology choices and how the containers communicate with one another."

即：

- **容器（Container）** = 一个可独立部署/运行的单元（Web 应用、移动 App、微服务、数据库、消息队列、文件存储等），**不是 Docker 容器**。
- **容器图** = 把系统放大，展示"由哪些容器组成 + 容器间如何通信"。
- 受众：开发/运维/架构等技术人员。

### 1.2 C4 容器图的 8 大特点（= 我们的要求清单）

> 这是本 skill 的**要求总纲**——最终画出的图必须满足以下所有特点。每个特点的 D2 实现语法见 [§1.4 特点→语法映射表](#14-特点→语法映射表)。**生成前对照本节定目标，生成后自检对照本节**。

| #   | 特点（要求） | 说明                                                                   |
| --- | ------------ | ---------------------------------------------------------------------- |
| 1   | **容器化**   | 图中每个大块代表一个"容器"（应用/服务/数据存储），不是任意分组         |
| 2   | **分层**     | 容器按职责域纵向堆叠成层（如 入口→业务→基础 三层），层=大容器          |
| 3   | **嵌套**     | 层（副容器）内含子容器；可多层嵌套（层→分区→模块）                     |
| 4   | **对称**     | 子容器到副容器**左右/上下边框距离相等**（水平+垂直居中）——**铁律**     |
| 5   | **均匀**     | 同层子容器等宽等高、间距一致，不挤任意一侧                             |
| 6   | **边界**     | 任何子容器的四条边都**不得超出**父容器——**铁律**                       |
| 7   | **通信**     | 容器间通信关系用箭头 + 标签表达（HTTP/RPC/MQ/读写等）                  |
| 8   | **可读**     | 文本完整不截断；配色有意义（按层/按功能域）；形状有语义（圆柱=数据库） |

### 1.3 对齐铁律（特点 4/6 的细化，最高优先级）

> 以下铁律是**最终效果标准**——任何语法、任何模板都必须服从。生成后自检对照；不满足 = 不合格，必须调整。

**铁律 1（边界）**：任何子容器的**前后左右四条边**都不得超出父容器边界。渲染后逐个检查：子容器最左/最右/最上/最下 ≤ 父容器对应边界。

**铁律 2（对称）**：子容器到父容器**左右边框的距离必须相等**（水平居中）；到上下边框的距离也必须相等（垂直居中）。不允许"贴左不贴右"、"贴顶不贴底"、挤在任意一侧或中间。

**铁律 3（均匀）**：同层/同容器内子容器**等宽等高、间距一致**，视觉上均匀分布。

**铁律 4（文本完整）**：所有 label 完整显示，不截断、不溢出子容器边界。

**铁律 5（对齐）**：各层容器左边界对齐、宽度一致；竖条/标签列与主体视觉协调。

### 1.4 特点→语法映射表（怎么实现这些要求）

> 每个特点靠 D2 语法实现。**先定目标（1.2）→ 查此表选语法 → 按 §6 公式算尺寸 → 写代码**。

| 特点              | D2 语法                                                                                      | 关键规则                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 分层（纵向堆叠）  | 外层容器 `grid-rows:1; grid-columns:1; grid-gap:24` + 每层 `width` 统一                      | 见 [§6.1](#61-外层容器必须-gridrows1-gridcolumns1-强制纵向堆叠)                  |
| 嵌套（层内分区）  | 层内 `grid-columns: N` 分分区，分区内再嵌套 grid                                             | 见 [§5.5](#55-层内分区grid-嵌套2×2-子模块)                                       |
| 对称（水平）      | **每个子容器显式 `width`**：`(层宽 − 24 − (N−1)×gap) / N`；竖条子容器 `width = 竖条宽 − 120` | 见 [§6.13](#613-尺寸计算规则副容器--子容器核心约束)                              |
| 对称（垂直）      | 竖条/标签列：一维 `grid-columns:1` + 不写 `grid-gap` + 子容器按公式设 `height`               | 见 [§6.13](#613-尺寸计算规则副容器--子容器核心约束)                              |
| 均匀（等宽等高）  | 同分区子容器 width/height 一致 + grid-gap 统一                                               | 见 [§6.11](#611-同一列等宽约束)                                                  |
| 边界（不超界）    | width/height 精确按公式算；竖条宽 ≥ 最宽 label + 120；子容器 height 算小勿算大               | 见 [§6.13](#613-尺寸计算规则副容器--子容器核心约束)                              |
| 通信（箭头+标签） | `层A.子 -> 层B.子: "HTTP"`（完整路径）；双向 `a <-> b`                                       | 见 [§6.3](#63-跨容器边必须用完整路径否则静默产生重复节点) [§6.12](#612-双向箭头) |
| 可读（配色）      | §4.2/4.6 色系：按层（蓝/紫/灰）或按功能域（马卡龙）或单色系                                  | 见 [§4.2](#42-颜色编码惯例5-大层系) [§4.6](#46-配色模式三种)                     |
| 可读（形状）      | **一律圆角矩形**（`style.border-radius: 8`）；数据库用 `shape: cylinder`                     | 见 [§4.7](#47-形状速查架构图常用)                                                |
| 可读（文本）      | label 放不下时 trade-off：扩父容器 or 缩文本，**给用户选**                                   | 见 [§6.14](#614-文本溢出-trade-off必须给用户选择)                                |

### 1.5 最佳实践核心理念（DSL 从源头保证，而非事后补救）

> **D2 是声明式 DSL——每个要求都能用语法从源头保证，不需要"画出来再检查发现错误"**。生成代码时就要让语法天然满足要求，渲染只是验证。

**核心方法论：写代码前先按规则计算，让 DSL 语法本身承载约束：**

| 要求           | 从源头保证的写法（不是事后检查）                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 对称/均匀      | 写代码前**先算好每个子容器 width/height**（§6.9/6.13 公式），写进去就对称，无需渲染后调                                                                |
| 边界（不超界） | width/height **精确按公式算**（§6.13），D2 不会自动压缩超宽子容器（实测 width:300×3 > 层 800 → 第 3 个直接超界）——所以算错 = 必然超界，算对 = 必然不超 |
| 圆角矩形       | **每个节点挂含 `border-radius` 的 class**（§4.8），从源头保证全图圆角，无需逐个检查                                                                    |
| 文本完整       | 竖条/层 width 按"最宽 label + 内边距"预留（§6.13/6.14），放不下提前 trade-off                                                                          |
| 垂直均匀       | 竖条一维 grid + 子容器按公式设 height（§6.13），写进去就均匀                                                                                           |

**自检的定位**：自检（§7）是**验证**（确认语法写对了），不是**修复手段**（发现错了再改）。如果自检发现问题，说明上面的规则没遵守——回头改写法，而不是临时打补丁。

**生成流程（每次画图都走这个顺序）**：

1. 对齐结构（§2 工作流步骤 1-3）
2. **按 §6.13 公式算出所有子容器 width/height**（每个容器、每个分区、每个子模块）
3. 按 §4.8 给每个节点挂圆角 class
4. 写代码 → 渲染 → 自检验证（应该一次通过）

### 1.6 Padding 动态计算原则（不能重合 + 四边等宽）

> **每个子容器在父容器内都必须有合理 Padding**：左右留白相等（左右居中），上下留白相等（垂直居中），且 Padding **大小由父容器整体尺寸动态计算**——不能写死，不能让子容器"贴左/贴右/贴顶/贴底"或"撑满父容器"。

**三条铁律**：

1. **左右 Padding 等宽**（= 6.13 公式的 `width` 居中）：子容器 `width = (父宽 − 内边距 − (N−1)×gap) / N`。
2. **上下 Padding 等宽**（动态计算）：父容器有 label 时顶部留 ~36，底部留 ~14；无 label 时上下等大（如各 14）。子容器 `height = (父高 − 顶部label − 底部pad − (N−1)×gap) / N`，**显式 height，不撑满**。
3. **不能重合、不超界**：子容器任何角都不能超出父容器（铁律 1）。

**通用 Padding 公式**（每个有 label 的层容器）：

```
顶部 padding = label 高度 + 留白 ≈ 36
底部 padding = 14
左/右 padding = 12
子容器 width  = 父宽 − 24 − (N−1)×gap
子容器 height = (父高 − 36 − 14 − (N−1)×gap) / N
```

**D2/ELK 限制**：grid 强制列等高（内容少列下方留白不可避免，但**不应让子容器撑满**填空）；grid 一列默认靠顶部，要 height 显式算。

**⚠️ Trade-off 流程（发现超界时的强制规则）**：

写代码时发现 width/height 算下来**放不下文本**，或**子容器物理超出父容器**，**禁止以"接受当前超界"作为 trade-off 选项**——这是底线违反铁律。必须从以下选一个：

1. **缩 label 文字**（如"工作办理"→"工作", "综合查询"→"查询"）——**首选**，改动小
2. **改布局**（如 3 列改 2×2, N 列改 N-1 列）——子项数重排
3. **扩父容器 width**（子容器 width 同步按公式重算）——父容器总宽可能撑爆外层，需上溯到最外层调
4. **消减子项数**（合并/删除冗余）——破坏原图

**选项优先级：1 > 2 > 3 > 4**。选完后按 §1.3 流程"自检（§7）" → 渲染 → 重新走 checklist 验证。**任何"接受超界"的选项都是被禁止的**。

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

### 4.6 配色模式（三种）

> 参考图按"色相代表什么"分三种模式，画图前先定用哪种，再套 §4.2 色系或自定义：

1. **按层配色**（默认，最常见）：色相 = 层级（§4.2 蓝/紫/灰），同层内子模块同色。适用：分层清晰的系统图。
2. **按功能域配色**（图2 支付全景、图5 矩阵图）：色相 = 功能域，**同一层内可多色**。参考马卡龙色表：入口/前端=淡蓝 `#eff6ff`、核心业务=淡黄 `#fefce8`、通道/产品=淡绿 `#f0fdf4`、资金/财务=淡橙 `#fff7ed`、基础系统=浅灰 `#f8fafc`、监控/运维=淡紫 `#faf5ff`。
3. **单色系**（图4/图6 全绿）：整图一色相，靠**深浅/描边**区分层级——容器浅绿填充、层标签深绿实心。适用：希望视觉统一的系统图。

**实心填充 + 白字**（图1 商务蓝紫风格）：子模块深色实心 + 白字，突出功能单元：

```d2
h1: { label: "红包雨交互"; style.fill: "#3b5bdb"; style.font-color: "#ffffff"; style.bold: true }
```

### 4.7 形状速查（架构图常用）

> **默认铁律：所有容器一律用圆角矩形**（D2 默认矩形 + `style.border-radius: 6~12`），**不用圆形/椭圆**。圆形节点视觉上与容器风格不统一、且宽度由 label 决定难以对称控制——**没有场景必须用圆形，一律用圆角矩形**。数据库等特殊语义用圆柱体。

| 形状             | D2 语法                           | 用途                      |
| ---------------- | --------------------------------- | ------------------------- |
| 圆角矩形（默认） | 节点名 + `style.border-radius: 8` | **所有容器/模块**         |
| 圆柱体           | `shape: cylinder`                 | 数据库（图2/图6）         |
| 圆形/椭圆        | `shape: circle` / `shape: oval`   | ❌ **不用**（改圆角矩形） |
| 队列             | `shape: queue`                    | 消息队列/缓冲             |

写法：`节点名: { shape: cylinder }` 或 `节点名.shape: cylinder`。以上已实测 validate 通过（注意：`shape: database` 不存在，数据库用 `shape: cylinder`）。圆角矩形的圆角值：大容器 8~~16，子模块 4~~8（见 §4.5）。

### 4.8 圆角矩形全局落实（每一个图形都必须圆角）

> **要求**：图中**每一个图形**（外层容器、层、分区、最内层子模块、竖条节点）都必须是圆角矩形——不只是外层。**杜绝直角矩形**。

**D2 无全局 border-radius 配置**，必须逐容器设置。**最佳实践：用 `classes` 批量定义样式**——所有子模块挂同一个 class，class 内含 `border-radius`，从源头保证全图圆角（已实测：class 定义 `border-radius: 8` 后，所有 `class: mod` 的节点渲染出 `rx` 圆角）：

```d2
classes: {
  mod: {   # 通用模块样式：所有子模块都用它
    style: { border-radius: 8; fill: "#ffffff"; stroke: "#64748b"; stroke-width: 1 }
  }
}
```

**规则**：

1. **每个子模块节点**必须挂一个含 `border-radius` 的 class（如 `class: mod`、`class: white`、`class: blue`），或显式写 `style.border-radius: 6~8`。
2. **每个容器/分区/层**显式写 `style.border-radius: 8~12`（容器比子模块圆角略大）。
3. **检查**：渲染后数 SVG 里 `rx` 属性的 rect 数量——应等于全部图形数量，无直角矩形（`rx` 缺失 = 漏设）。

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
    style.border-radius: 12
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

> ⚠️ 本模板展示**组件级**精确调用关系（容器内子模块级），属于 C4 Component Diagram 范畴，超出 C4 Container Diagram 主流程。**C4 Container Diagram 通常不需要此粒度**——容器级通信即可表达系统架构。仅当需要 API 设计/数据流分析时才用本模板。

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

### 5.4 左右分栏 + 贯穿竖条（架构图高频版式）

> 适用：需要**右侧贯穿栏**（图2 支付全景的补偿/对账/运营中心、图4 的日志/消息/权限竖条、图6 的平台总称竖条）或**左侧贯穿标签列**（图4/图6 的层名标签）的架构图。核心：外层 `grid-columns: 2`（或 3）分栏，一侧是"纵向堆叠主体"，另一侧是"贯穿竖条"——**竖条是独立顶层子容器，用 grid 列定位，不要用连接线连各层**。已实测 ELK 渲染通过。

```d2
vars: { d2-config: { layout-engine: elk } }
整体: {
  grid-columns: 2          # ← 分两栏：左主体 + 右贯穿栏（3 栏则为左右双竖条）
  grid-rows: 1
  grid-gap: 16

  左主体: {                 # 主体：内部各层纵向堆叠（复用 §5.1 结构）
    grid-rows: 1; grid-columns: 1; grid-gap: 24
    入口层: { width: 800; grid-columns: 3; grid-gap: 12; style.fill: "#eff6ff"; style.stroke: "#6c8ebf"; style.border-radius: 12
      h1: { width: 250; height: 60; class: module }
      h2: { width: 250; height: 60; class: module }
      h3: { width: 250; height: 60; class: module }
    }
    业务层: { width: 800; grid-columns: 3; grid-gap: 12; style.fill: "#f5f3ff"; style.stroke: "#8b5cf6"; style.border-radius: 12
      b1: { width: 250; height: 60; class: module }
      b2: { width: 250; height: 60; class: module }
      b3: { width: 250; height: 60; class: module }
    }
  }

  右侧贯穿竖条: {            # ← 贯穿栏：独立顶层容器，高度由外层 grid 与主体现高（勿设 height，会被覆盖）
    width: 300               # ← ≥ 最宽 label + 120（"日志记录"4 字≈160 → 300 安全，见 6.13）
    grid-columns: 1           # ← 关键：只定义列（一维）+ 不写 grid-gap → 子容器垂直均匀分布（见 6.13）
    style.fill: "#f0fdf4"; style.stroke: "#22c55e"; style.border-radius: 12
    # 子容器 width = 竖条 width − 120（水平居中对称，铁律 2）；height 按 6.13 公式：主体高 600 → (600−120−2×40)/3 ≈ 133
    r1: { label: "日志记录"; width: 180; height: 133; class: module }
    r2: { label: "消息系统"; width: 180; height: 133; class: module }
    r3: { label: "权限控制"; width: 180; height: 133; class: module }
  }
}
```

要点：

- **左贯穿标签列**（图4/图6 层名标签）：外层 `grid-columns: 2`，**左列**为窄竖条（`width: 80`，放层名 `label` 即可），右列为主体。镜像 5.4 结构即可。
- **左右双竖条**（图5）：外层 `grid-columns: 3`——左竖条 + 主体 + 右竖条。
- 竖条内子盒高度不设等高，靠 grid 自动对齐。

### 5.5 层内分区（grid 嵌套，2×2 子模块）

> 适用：层内不铺平子模块，而是**再分几个分区容器**（图1 的系统业务层"基础业务/账户系统"各含 4 方框、图3 服务层左右分区、图6 服务层 3 分区）。核心：层容器内 `grid-columns: N` 分分区，每个分区内部再嵌套 `grid` 放自己的子模块。语法依据 references/grid-diagrams.md 的嵌套网格范例。

```d2
服务层: {
  width: 800; grid-columns: 3; grid-gap: 12   # ← 先分 3 个分区
  style.fill: "#f8fafc"; style.stroke: "#64748b"; style.border-radius: 12

  通信组件: { grid-columns: 1; grid-gap: 8   # 分区 1：内部嵌套
    c1: { width: 200; height: 50; class: module }
    c2: { width: 200; height: 50; class: module }
  }
  核心服务总线: { grid-columns: 1; grid-gap: 8  # 分区 2
    s1: { width: 200; height: 50; class: module }
    s2: { width: 200; height: 50; class: module }
  }
  配置监控: { grid-columns: 1; grid-gap: 8      # 分区 3
    m1: { width: 200; height: 50; class: module }
    m2: { width: 200; height: 50; class: module }
  }
}
```

2×2 嵌套（图1）：父容器 `grid-columns: 2` 分 2 个分区，每个分区再 `grid-columns: 2` 放 4 个子盒。**各分区子盒 width 一致**（6.11），父容器 width 按 6.9 公式算。

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

**多板语法无法在 Markdown 渲染引擎中输出**（报 `multiboard output cannot be written to stdout`）。拆成多张独立 ` ```d2 ` 代码块放在同一文档不同章节。

### 6.6 ❌ TALA 引擎禁用

TALA 是**闭源付费引擎**（商用需许可，免费版出图有水印），本 skill 不使用。所有示例默认 `elk`；文档中出现 `layout-engine: tala` 一律改为 `elk`。

### 6.7 容器 `width` 与 `label` 长度的关系

带 label 的容器，`width` 设的是**内容区宽度**，label 会**额外撑大容器实际宽度**。所以如果设 `width: 1000` 但 label 是"② 业务能力层（中台 · 能力复用）"这种长文本，渲染后容器实际宽度可能 1500+。

**规避**：label 保持简短（"② 业务层"），或对宽 label 容器不固定 width。

### 6.9 子盒 `width` 撑满公式（稳定基线核心）

> 完整版见 [6.13 尺寸计算规则](#613-尺寸计算规则副容器--子容器核心约束)（含垂直均匀分布 + 边界约束 + 溢出 trade-off）。本条为基础公式。

ELK 的 grid **不会自动均分容器宽度**——列宽 = 该列子盒 width（不设 width 则取内容宽）。要让子盒**恰好撑满父容器**，必须手算 width：

```
子盒 width = (父容器 width − 内边距 − (每行列数 N − 1) × grid-gap) / N
```

其中 **N = 该层的 `grid-columns` 值**。速查表（父容器 width:1000，gap:12，内边距≈24）：

| 每行列数 N | 子盒 width | 每行总宽 | 说明          |
| ---------- | ---------- | -------- | ------------- |
| 2          | 482        | 976      | 每行 2 个子盒 |
| 3          | 317        | 975      | 每行 3 个子盒 |
| 4          | 235        | 976      | 每行 4 个子盒 |
| 5          | 190        | 974      | 每行 5 个子盒 |
| 6          | 157        | 976      | 每行 6 个子盒 |

**关键认知**：撑满与否取决于**每行的列数 N**（即 grid-columns 值），不是子盒总数。子盒总数 > N 时会换行（见 6.10），每行宽度由 N 决定。宽度没算对时 ELK 会把内容**居中聚拢**、两侧留白——这是"看起来没撑满"的根源。

### 6.10 子盒总数 > `grid-columns` 会换行（主导方向）

`grid-columns: 3` 但放了 6 个子盒 = **3 列 × 2 行**，自动换行。填充顺序由**先写哪个**决定：

- 先写 `grid-rows` → 先填满行再换列（行主导）
- 先写 `grid-columns` → 先填满列再换行（列主导，默认视觉多为横向）

**陷阱**：若每行子盒数恰好整除总数且希望等宽撑满，N 必须取**每行的列数**并按 6.9 公式算 width。例如 6 个子盒想要 2 行 3 列，写 `grid-columns: 3` 且 width = 317。

### 6.11 同一列等宽约束

grid **同一列的单元格等宽、同一行的等高**（取该列/行最大者）。所以同一分区内的子盒 `width` 必须一致，否则窄盒会被宽盒所在的列撑宽，产生留白参差。多个分区并列时，各分区的 `grid-columns` 和子盒 width 应保持一致。

### 6.12 双向箭头

上下层之间需要表达"请求/响应"双向时用 `a <-> b`（无向边），带标签：`a <-> b: "HTTP"`。单向用 `a -> b`。

### 6.13 尺寸计算规则（副容器 ↔ 子容器，核心约束）

**两条硬约束**（任何子容器的任何边/角都不能违反）：

1. **水平：子容器总宽 ≤ 副容器内容宽**。子容器宽度必须按公式计算（不能拍脑袋）：

   ```
   子容器 width = (副容器 width − 内边距 − (N − 1) × grid-gap) / N
   ```

   其中 N = 该行子容器个数（= grid-columns 值）。速查表（副容器 width:1000，内边距≈24，gap:12）：

   | N   | 子容器 width | 每行总宽 | 状态   |
   | --- | ------------ | -------- | ------ |
   | 2   | 482          | 976      | ✓ 撑满 |
   | 3   | 317          | 975      | ✓ 撑满 |
   | 4   | 235          | 976      | ✓ 撑满 |
   | 5   | 190          | 974      | ✓ 撑满 |
   | 6   | 157          | 976      | ✓ 撑满 |

   如果算出的 width 放不下文本（子容器文本溢出），**禁止超宽硬塞**——见 6.14 的 trade-off。

2. **垂直：子容器在副容器内均匀分布，不能挤在任意一侧**（ELK 实测结论）：

   **背景**：竖条/标签列等副容器的高度往往由外层 grid 决定（与主体现高），远大于子容器内容自然高。ELK 不会自动把子容器拉伸填满超高容器，需要手算。实测三种写法效果：

   | 写法                                         | 效果                                                                                                    |
   | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
   | 竖条设 `height` + 子容器按公式设 `height`    | ✅ **最佳**：上下留白对称、均匀填满、不超界                                                             |
   | 竖条不设 height + 无 `grid-gap`（一维 grid） | ✅ 内容自然高、均匀居中（容器不超高时）                                                                 |
   | 竖条设 `height` + 子容器不设 height          | ⚠️ 居中但留白（ELK 扩展有上限）                                                                         |
   | 竖条写 `grid-gap`（任何情况）                | ❌ 子容器紧凑排布**挤在顶部**（用户踩坑点：竖条内写 `grid-gap: 8` → 6 个子容器全挤上方、下方 2/3 空白） |
   | 子容器 height 算大了                         | ❌ **超出副容器底部**（违反边界约束）                                                                   |

   **竖条/标签列正确写法（推荐）**：

   ```
   子容器 height = (竖条实际高度 − 上下内边距 − (M − 1) × 间距) / M
   ```

   其中 M = 子容器个数，上下内边距 ≈ 120（含容器标题区），间距 ≈ 40（ELK 默认行间距）。

   ⚠️ **竖条实际高度**：竖条/标签列与主体同在外层 grid 时，**高度由外层 grid 强制与主体现高**（写 `height` 会被覆盖，实测 863 vs 设定的 600）。所以**竖条不要设 height**，子容器 height 按**外层 grid 决定的实际高度**算。例：竖条实际高 863、6 个子容器 → (863−120−5×40)/6 ≈ 90（已实测：6×90 高子容器上下各留白 60，完美对称）；实际高 600、4 个子容器 → (600−120−3×40)/4 = 90。
   若不确定实际高度，先用**无 height 版**渲染量一下容器高度，再按公式回填子容器 height；或子容器不设 height 接受"内容自然高"（容器不超高时同样均匀居中）。

   ⚠️ **竖条/标签列：子容器靠左（铁律 2 适用）**：单列容器（grid-columns:1）内子容器固定靠左，x = 父x+60（确定性行为）。**安全条件：子width ≤ 父宽 − 72**（60 左内边距 + 12 右内边距）：

   ```
   子容器 width = 竖条 width − 120（左右内边距各 60）
   ```

   且**竖条 width ≥ 最宽子容器 label + 120**（否则 label 溢出）。例：竖条 width:200 → 子容器 width:80 → 左右各留白 60，对称（实测）；竖条 width:300、label"校准机制"4 字 → 子容器 width:180 → 左右各留白 60，对称且文本完整（实测）。

   判断方法：渲染后检查子容器左/右边距 = 子容器 x − 父 x 与 父右 − 子右 是否相等。左对齐（右边距 > 左边距）= 子容器 width 没按公式设；超出右边界 = 竖条 width 不够容纳 label。

   - grid 只定义一维（竖条写 `grid-columns: 1`，**不要写 `grid-rows: 1; grid-columns: 1` 两维**，两维都定义时子容器挤在顶部）。
   - **竖条内不要写 `grid-gap`**（触发"紧凑排布不扩展"）。
   - **横排场景（普通层容器，铁律 2 同样适用）**：层容器（width:W）内 `grid-columns: N` 铺子容器时，**必须按确定性公式算子容器 width**（实测精确规律，见下）。

   **确定性公式（实测校准，取代"凭感觉设 width"）**：

   ```
   A. 多列容器 (grid-columns: N, N ≥ 2):
      ELK 行为: 整组子容器自动居中 (左距 = 右距)
      安全条件: Σ子width + (N−1)×grid-gap ≤ 父宽 − 4
      等宽子容器: 子width = (父宽 − 4 − (N−1)×gap) / N
      例: 父340, N=3, gap=4 → (340−4−8)/3 = 109.3 → 109
      验证: 3×109+8=335 ≤ 336 ✓ 居中安全; 3×110+8=338 > 336 ❌ 挤出

   B. 单列容器 (grid-columns: 1):
      ELK 行为: 每个子容器靠左, x = 父x + 60 (左内边距), 独立一行
      安全条件: 子width ≤ 父宽 − 60(左) − 12(右) = 父宽 − 72
      例: 父340 → 子width ≤ 268; 260 安全(左60右20), 300 超界20px

   C. 每个子容器都要显式写 width (含嵌套分区), 不能只写 grid-columns
   ```

   验证方法：写代码前先按公式算好（多列居中 / 单列靠左），渲染后对照"子容器最右 ≤ 父容器最右"。**如果超界，先回头检查公式（子总宽是否 > 父宽−4 或单列子宽 > 父宽−72），再修，不要逐个容器猜。**

**验证方法**：渲染后检查子容器最左/最右/最上/最下与副容器边界的距离——应大致对称相等（上下/左右留白一致）。不对称 = grid 维度写错、width/height 算错、或竖条误写 grid-gap。

⚠️ **grid 列等高陷阱（垂直溢出）**：外层 `grid-columns: N` 分栏时，ELK 强制**所有列等高**（取最高列）。若某列内部堆叠的子容器总高 > 其他列，该列内容不会自动压缩，可能**底部超出层容器**。实测案例（支付全景图）：核心层 2 列——左侧"支付核心+商户平台"（2 个分区）vs 右侧"支撑栏"（3 个中心竖排），曾出现支撑栏底部溢出。**规避**：分栏时保证各列内容高度大致均衡（子分区数量/内容量相近），或给矮列补充内容；渲染后必须检查**每列底部 ≤ 层容器底部**。

### 6.14 文本溢出 trade-off（必须给用户选择）

子容器 width 按公式算出后放不下文本（文本溢出/被截断）时，**不要自己偷偷改布局**，给用户两个选项：

1. **扩副容器**：增大副容器 width（子容器 width 按新值重算），图整体变大但文本完整。
2. **缩文本**：缩短子容器 label（如"账户商业化（数据）"→"账户商业化"），图尺寸不变。

**判断优先级**：先尝试缩短文本（改动小、不破坏整体比例）；文本不可再短时，再扩副容器。两个方向都在生成前用 ASCII 或渲染结果向用户确认，不要自作主张。

---

## 7. 自检与 PNG 渲染（macOS）

> 自检流程：提取代码块 → 临时 .d2 → `d2 validate` + `d2 render` → `sips` 转 PNG → 识图工具审查结构/对齐/颜色/标签完整。

> ⚠️ **CJK 字体 2 列宽**：中文字符在 ELK/dagre 下按 2 列宽处理，ASCII 输出时字符间会被插入对齐空格（如"应用"渲染为"应 用"），影响 grep 与对齐。**自检用 cat 全文阅读，不要 grep 中文字面**。

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

**识图审查清单（结构化 checklist，不要让它自由描述）**：

调用识图工具时，**必须用以下固定 prompt**（不要让识图自由发挥——它会漏项）：

```
请按下列 checklist 逐项检查这张 C4 Container Diagram 架构图，**不要总体描述**，对每项只回答 PASS/FAIL + 位置（layer / 子分区 / 子项）和具体数值：

1.【边界】任何子容器的 4 条边是否都 ≤ 父容器对应边界？列出超界位置。
2.【左右居中】每个子容器到父容器的左距是否 = 右距？列出左右距不相等的子容器。
3.【上下居中】每个子容器到父容器的上距是否 = 下距？上下 PADDING 是否相等？列端是否有"贴顶贴底"现象？
4.【等宽】同层内所有子容器 width 是否相等？列出宽度不同的子容器。
5.【高度】包含 label 的层容器内子容器是否靠顶部、有无垂直居中能力（D2 grid 限制下）？
6.【竖条】贯穿竖条（grid-columns: 1）内的子容器是否垂直分布？只有 1 个子容器时是否撑满竖条？
7.【不超界】所有子容器是否完全在父容器内？特别是 3 列等高层（核心层）中各列子容器是否均在所在列内？
8.【圆角】所有图形节点是否圆角矩形？是否有直角矩形残留？
9.【文字完整】所有 label 是否完整显示？特别检查比 width 长的中文 label。
10.【柱体文字】shape: cylinder 内文字是否在椭圆内、不贴底？

输出格式（每项一行）：
[N] PASS | FAIL: layer/子分区/子项 + 具体数值
```

**回环规则**：自检 FAIL → 逐项对照 §1.6 铁律重算 width/height → 修改 d2 代码 → 重跑自检，最多 3 轮；3 轮未通过 → 回到 [第 3 节](#3-ascii-架构确认画图前必做) 重新确认 ASCII 架构本身。

---

## 8. CLI 速查（自检用，仅 SVG）

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

## 9. References 关键章节摘要（精简版）

> 下表对应文件均在 `references/` 目录（本 SKILL.md 同目录下）。本 skill 精简后只保留画 C4 Container Diagram 必需的 5 个 D2 参考文件（其余通用文档已删），C4 Container 画图最常用：`grid-diagrams.md`、`containers.md`、`connections.md`。

| Tour 章节   | 关键内容                                                              | 本地文件                                                   |
| ----------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Connections | 边类型（无向/有向/标签/引用连接）                                     | [references/connections.md](references/connections.md)     |
| Containers  | 容器语法（嵌套/命名空间/父引用）——**架构图核心**                      | [references/containers.md](references/containers.md)       |
| ELK         | 布局引擎（**架构图推荐**）——支持容器 width/grid                       | [references/elk.md](references/elk.md)                     |
| Grid        | **网格布局（架构图核心）**：`grid-columns` / `grid-rows` / `grid-gap` | [references/grid-diagrams.md](references/grid-diagrams.md) |

> `diagram-review.md` 为**本项目自研**的 PNG 识图自检审查清单（非官方文档），用于渲染后条理性审查（macOS：sips 转 PNG + 识图工具），详见 [§7 自检与 PNG 渲染](#7-自检与-png-渲染macos)。
>
> 其他 D2 功能（多板图/序列图/ER 图/ASCII 输出/动画/CLI 完整手册等）已删除——本 skill **只画 C4 Container Diagram**，C4 Container 画图不需要这些。
