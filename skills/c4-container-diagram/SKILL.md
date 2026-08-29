---
name: c4-container-diagram
description: 用 D2（d2lang.com）画**容器式分层图**——多层大容器纵向嵌套、每层内含若干子容器、子容器等宽均匀分布、左右居中对称、全圆角矩形的图。典型形态包括：C4 model Container Diagram（c4model.com 标准第 2 层图）、技术架构图、产品架构图、业务能力分层图、微服务架构图等——**凡是"大容器套小容器、分层堆叠"的图都适用**，不限于技术架构。展示系统/产品/业务的容器划分（应用、服务、数据存储、业务模块等）与容器间通信关系。Markdown 内嵌 ```d2 代码块渲染。当用户要画容器图 / 分层架构图 / 容器架构图 / 多层嵌套图 / C4 Container Diagram 时使用。**不在此范围**：流程图、时序图、ER 图、UML 类图、C4 的 Component/Code 层（组件级调用）——请用其他 skill。⚠️ 铁律：每一层嵌套（A→B→C→D）都必须为子容器显式算 width（公式见 references/layout-and-grid.md；**唯一例外：单列竖条不设 width**，让 ELK 自动包裹居中）。⚠️ 多板图（layers/scenarios/steps）禁用。
---

# 容器式分层图技能（C4 Container 实现 · D2）

> 本 skill 画**容器式分层图**（"大容器套小容器、多层纵向嵌套"的图）。**D2 是实现方式**（[d2lang.com](https://d2lang.com)）。
> 本 SKILL.md 是 **router**——主流程、铁律、分诊必读；详参下沉到 `references/` 按需激活（见 [§4 路由表](#4-references-路由表你要做的事--读哪个文件)）。

---

## 1. 画什么：C4 Container Diagram（先对齐目标）

### 1.1 定义：什么是容器式分层图（含 C4 Container）

**本 skill 画的是"容器式分层图"**——大容器套小容器、多层纵向嵌套、每层子容器等宽分布的图。最典型的形态是 **C4 model Container Diagram**（c4model.com 标准第 2 层图），但适用范围更广：

- **C4 model Container Diagram**：展示**一个软件系统由哪些容器组成**（C4 官方定义："A container represents an application or data store... The container diagram shows the high-level technology choices and how the containers communicate with one another."）。
- **技术架构图 / 产品架构图 / 业务能力分层图 / 微服务架构图**等：只要符合"多层大容器纵向嵌套 + 子容器分布"的形态，都适用本 skill。

**不在此范围**（见 frontmatter description 完整清单）：流程图、时序图、ER 图、UML 类图、C4 Component/Code 层。

关键概念：

- **容器（Container）** = 图中的一个可独立划分的单元（应用、服务、数据存储、业务模块等），**不是 Docker 容器**。
- **容器式分层图** = 把系统/产品/业务放大，展示"由哪些容器组成 + 容器间如何通信"。

> 9 大特点要求清单、特点→语法映射、Padding 动态计算、分层规范（颜色/间距/形状/圆角/配色）详见 [references/c4-container-spec.md](references/c4-container-spec.md)。

### 1.2 对齐铁律（最高优先级）

> 以下铁律是**最终效果标准**——任何语法、任何模板都必须服从。生成后自检对照；不满足 = 不合格，必须调整。

**铁律 1（边界）**：任何子容器的**前后左右四条边**都不得超出父容器边界。渲染后逐个检查：子容器最左/最右/最上/最下 ≤ 父容器对应边界。

**铁律 2（对称）**：子容器到父容器**左右边框的距离必须相等**（水平居中）——这是硬性要求，任何容器必须满足。**垂直方向**：仅在**单列容器**（竖条/标签列，grid-columns:1）场景下要求上下均匀（靠子容器 height 公式，见 [references/layout-and-grid.md](references/layout-and-grid.md)）；**多行/多列容器**（普通层容器）**不做垂直居中要求**（D2/ELK grid 强制列等高、子容器靠顶部，物理上无法垂直居中）。允许"贴顶"，不允许"贴左不贴右"。

**铁律 3（均匀）**：同层/同容器内子容器**等宽等高、间距一致**，视觉上均匀分布。

**铁律 4（文本完整）**：所有 label 完整显示，不截断、不溢出子容器边界。

**铁律 5（对齐）**：各层容器左边界对齐、宽度一致；竖条/标签列与主体视觉协调。

### 1.3 核心方法论（DSL 从源头保证）

> **D2 是声明式 DSL——每个要求都能用语法从源头保证，不需要"画出来再检查发现错误"**。生成代码时就要让语法天然满足要求，渲染只是验证。

**写代码前先按规则计算，让 DSL 语法承载约束**：对称/均匀靠 [references/layout-and-grid.md 尺寸公式](references/layout-and-grid.md) 先算 width/height；边界靠公式精确（算错 = 必然超界）；圆角靠 [references/c4-container-spec.md §4.8](references/c4-container-spec.md) 挂 class；文本靠参考公式 + trade-off，见 [references/d2-syntax-cheatsheet.md](references/d2-syntax-cheatsheet.md)；垂直均匀仅单列竖条（§1.2 铁律 2）。

**自检的定位**：自检（[references/troubleshooting.md](references/troubleshooting.md)）是**验证**（确认语法写对了），不是**修复手段**（发现错了再改）。如果自检发现问题，说明上面的规则没遵守——回头改写法，而不是临时打补丁。

**生成流程（每次画图都走这个顺序）**：

1. 对齐结构（§2 工作流步骤 1-3）
2. **按 [references/layout-and-grid.md](references/layout-and-grid.md) 公式算出所有子容器 width/height**（每个容器、每个分区、每个子模块）
3. 按 c4-container-spec.md §4.8 给每个节点挂圆角 class
4. 写代码 → 渲染 → 自检验证（应该一次通过）

---

## 2. 工作流（分诊 → 新建 5 步 / 修改走 §2.2）

### 2.1 分诊（进入 skill 的第一件事：新建 vs 修改 vs 只读）

**自动判断是默认，问用户只是 fallback**（实在分不清才问）。核心信号：**图由 Markdown 中的 d2 代码块承载——用户引用/指到了某个 d2 代码块 = 改图**。

**自动判定（不打断用户）**：

1. 用户输入**指到了已有 d2 块**——给了位置+图名（"`docs/L1/PRODUCT-SPEC.md` 那个能力分层图"）、贴了代码块、或说"改/调整/更新那张图" → **修改模式**（§2.3 工作台 extract → 改 → render → sync）
2. 用户说**新建词**（画/新建/新增/加一张）且未引用已有块 → **新建模式**（§2.2 步骤 1-5 全流程；目标位置已有别的图 → 插入新块，**不动旧图**）
3. 用户说**重画/覆盖/重新生成**某图 → **修改模式**（替换该代码块）
4. 用户说"看一下/检查" → **只读模式**（troubleshooting.md 验收，不改代码）

**Fallback（仅信息不足时才问用户）**：

- 无法定位：用户没给文档路径/找不到任何 d2 块，也说不清意图 → 问"目标文档/图在哪？"
- 多块匹配不上：文档有多个 d2 块，用户说的图名与所有块首行注释都匹配不上 → 列出各块图名让用户选（"文档里有：① 系统架构图 System Architecture ② 部署架构图 Deployment... 改哪个？"）
- 完全无位置：只说"画一张图"没给任何文档线索 → 问"画在哪？"

**信息收集（定位靠图名，不靠序号）**：Read 目标文档，提取所有 ```d2 块的**第一行注释（图名）**，与用户提到的图名做**语义匹配**（中英文任一对上即命中）。**⚠️ 目标图无图名（首行无注释）时：先问用户"要不要给它加个名字？"**——可建议按图中内容起名（如"应用架构图"），用户确认后**先补上名字再改**，逐步收敛到文档里所有图都有名可查。**未完成分诊（三选一明确）前，禁止写 d2 代码**。

> **渲染方式**：d2 代码块由项目 Markdown 渲染引擎自动渲染（内嵌 ```d2 即渲染）。AI **不手动渲染 SVG 到文件**——所有图产物在 Markdown 代码块中。**仅在自检时临时渲染 SVG 用脚本验证**（见 [references/troubleshooting.md](references/troubleshooting.md)）。

### 2.2 新建模式（5 步）

> **CRITICAL — BLOCKING（阻塞性要求 #1，步骤 2）**: 画架构图前，必须先与用户对齐**几层 / 每层哪些模块 / 标签样式**（顶部居中 vs 左侧竖排）。未对齐前，禁止写 d2 代码。
>
> **CRITICAL — BLOCKING（阻塞性要求 #2，步骤 3）**: 写 d2 代码块前，MUST 先在对话中以 ASCII 架构图向用户展示图的大体结构（层数 + 每层模块 + 层间连线）。用户未确认前，禁止写 d2 代码。（ASCII 图要素见 [references/templates.md](references/templates.md)）

1. **定位目标 Markdown 文档**：确认插入位置（新建）或目标代码块（修改）。**未确认目标文档前，禁止写 d2 代码**
2. **对齐架构图参数（强制，阻塞性 #1）**：与用户确认：① **几层**（通常 3~6 层）；② **每层模块名**（用户会列出每个产品/服务/能力名——**必须用真实业务 label，禁止用占位符**如 e1/e2/c1/c2，占位符只出现在 skill 模板示例中）；③ **标签样式**（顶部居中 = 主流 / 左侧竖排 = 类架构师风格）；④ **颜色偏好**（蓝/紫/绿/橙/灰五大层系默认即可，或用户指定）；⑤ **是否需要层间箭头**（默认靠堆叠隐含依赖；要箭头时**只连层容器之间**，父级到父级，见 [references/connection-routing.md](references/connection-routing.md)）
3. **ASCII 架构确认（强制，阻塞性 #2）**：在对话中以 `text` 代码块直接输出 ASCII 架构图（层数 + 每层模块 + 层间连线 + 标签位置），等用户明确确认。用户提出修改则更新 ASCII 图再次确认。（见 [references/templates.md](references/templates.md)）
4. **在目标文档写/改 ` ```d2 ` 代码块**：**首行写图名注释（`# 图名`）——这是图的标识，后续定位/修改靠它语义匹配（§2.1），禁止省略**。格式不限：中文优先（如 `# 系统架构图`），用户喜好为准，中英皆可（`# System Architecture` 也行）——关键是有一个可识别的名字。第二行起 `vars: { d2-config: { layout-engine: elk } }`（默认 elk），可继续写视角/用途等元信息注释。**写完后渲染由 Markdown 引擎自动完成，AI 不做任何输出/渲染动作**
5. **自检**：一律用 [§2.3 工作台](#23-修改模式对已有图做调整不等于重画) 一条命令（自动校验 viewBox/超界/等宽/圆角）——新建图：`extract docs.md --name 图名` 提取刚写的块验证（不需 sync）；已有图修改：`extract → render → sync`。工作台不可用时才用 troubleshooting.md 手动流程。

完成标准：目标 Markdown 文档中 ` ```d2 ` 代码块已写入/更新；`verify-svg.py` 脚本校验通过；渲染结果与第 3 步确认的 ASCII 架构一致。

### 2.3 修改模式（对已有图做调整，≠ 重画）

> **目标**：第二次起改图要快（每次 3~5 分钟），不是全图重写。核心原则：**权威源 = Markdown 代码块**，改代码永远改文档原文（保持 `\n` 字面量）；临时 .d2 只读用于验证，**禁止**"改临时文件再复制回来"造成双份维护。**目标块无图名（首行无注释）时：先问用户加个名字（可建议），补上再改**——让所有图都有名可查（§2.1）。

**推荐工作流（工作台脚本，一条命令闭环）**：

```bash
# 1. 提取：按图名语义匹配（首行注释）或图序号 → 工作区 .d2/.svg/.png + 校验
#    （不带参数会列出文档所有 d2 块图名）
python3 scripts/d2-workbench.py extract docs.md --name "系统架构图"
python3 scripts/d2-workbench.py extract docs.md 1 --out .     # 或按序号

# 2. 改图迭代：编辑工作区 .d2（改 label/加容器/调宽度）→ 渲染+校验
python3 scripts/d2-workbench.py render docs-fig1.d2

# 3. 回写：工作区 .d2 同步回 md（替换原代码块；fallback 语义见 troubleshooting.md §7.4）
python3 scripts/d2-workbench.py sync docs.md docs-fig1.d2 --name "系统架构图"
python3 scripts/d2-workbench.py sync docs.md docs-fig1.d2 1   # 或按序号
# 需 fallback 时显式：sync docs.md docs-fig1.d2 --fallback=img ；清理：clean-fallback docs.md
```

**局部修改规则（只动改的部分）**：

- **⚠️ 修改模式豁免 §2.2 的阻塞性 #1/#2**：对齐参数（阻塞性 #1）和 ASCII 确认（阻塞性 #2）**仅在结构变更（加层/改列数/模块移动）时重走**；纯 label/宽度/颜色/箭头调整直接改，改完工作台命令验证闭环
- **⚠️ 修改 = 原地替换目标代码块，禁止新增第二个 d2 块**（高频失误：改图时把新内容插到旁边，文档变成两张图）。改完必须确认目标位置 d2 块数**不变**——用工作台 sync 天然保证（只替换第 N 个块 + 块数一致性断言，增删块即报错中止）；手编 Markdown 时改完数一遍 ` ```d2 ` 数量
- **改哪层只重算哪层的 width**（[references/layout-and-grid.md](references/layout-and-grid.md) 公式）：未动层/容器保持原值，不因"一致性"重算全图——改 label 就只改 label，改颜色就只改颜色
- 加容器/层时先查是否有同语义边（避免重复边），新容器记得 `border-radius`（c4-container-spec.md §4.8）
- **`\n` 字面量铁律**：label 内换行写 `\n`（反斜杠 + n 两个字符），**禁止**真实换行；用脚本写 .d2 时禁止 `echo`/未加引号 heredoc/Python 字符串拼接（见 [references/d2-syntax-cheatsheet.md](references/d2-syntax-cheatsheet.md)）——工作台脚本天然规避（文件 IO 直写）

---

## 3. ASCII 架构确认（画图前必做）

**目的**：写 d2 代码块前先与用户对齐图的大体结构（层数 + 每层模块 + 层间连线 + 标签位置），避免写完发现不符返工。

**做法**：理解用户需求后，在对话中直接输出一个 `text` 代码块的 ASCII 架构图（层数 + 每层模块名 + 标签位置 + 层间连线），并简述关键决策（图类型 / 引擎 / 颜色 / 标签样式），问"架构如上，确认后我开始写 d2 代码？或调整？"

> ASCII 架构图要素清单 + 完整示例、确认协议详见 [references/templates.md](references/templates.md)。**用户未明确确认前，禁止写 d2 代码或调用渲染命令**（阻塞性）。

---

## 4. References 路由表（你要做的事 → 读哪个文件）

| 你要做的事                                                                  | 读这个                                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9 大特点 / 特点→语法映射 / Padding / 分层规范（颜色·间距·形状·圆角·配色）   | [references/c4-container-spec.md](references/c4-container-spec.md)                                                                                                                       |
| 尺寸公式 / width·height 计算 / 网格·布局·等宽 / 竖条不设 width              | [references/layout-and-grid.md](references/layout-and-grid.md)                                                                                                                           |
| 层间箭头 / 双向箭头（父级到父级·完整路径）                                  | [references/connection-routing.md](references/connection-routing.md)                                                                                                                     |
| D2 语法坑 / 引擎选型 / 多板·TALA 禁用 / viewBox 溢出 / `\n` 换行 / 长 label | [references/d2-syntax-cheatsheet.md](references/d2-syntax-cheatsheet.md)                                                                                                                 |
| 生成前/后自检流程、SVG 坐标验证、验收执行、fallback、CLI 速查               | [references/troubleshooting.md](references/troubleshooting.md)                                                                                                                           |
| ASCII 要素 / 实测模板（3 层标准·竖排·竖条·层内分区·最简骨架）               | [references/templates.md](references/templates.md)                                                                                                                                       |
| 连接语法基础（边类型/标签/链式/箭头样式）                                   | [references/connections.md](references/connections.md)                                                                                                                                   |
| 网格布局范例 / 容器形态 / ELK 引擎 / 渲染后评审清单                         | [references/grid-diagrams.md](references/grid-diagrams.md) · [containers.md](references/containers.md) · [elk.md](references/elk.md) · [diagram-review.md](references/diagram-review.md) |

> `diagram-review.md` 为**本项目自研**渲染后条理性审查清单；其余 `connections/containers/elk/grid-diagrams` 为 D2 官方文档本地化。

---

## 5. 铁律速查（不可妥协红线，画图/改图必守）

> 以下每条都是**红线**，违反了必须调整到符合为止。详细规则见对应 references。

1. **每层显式算 width**：每一层嵌套（A→B→C→D）都要为子容器显式算 width（[references/layout-and-grid.md](references/layout-and-grid.md)）；**唯一例外：单列竖条不设 width**，让 ELK 自动包裹居中。只算最外层会"贴左偏左"。
2. **父级到父级箭头**：层间箭头只连层容器父级之间（`整体架构.层A -> 整体架构.层B`），**不连层内子容器**；必须写**完整路径**，否则 d2 静默创建顶层重复节点（[references/connection-routing.md](references/connection-routing.md)）。
3. **多板图禁用**：`layers/scenarios/steps` 多板语法无法在 Markdown 渲染引擎输出，拆成多张独立 ` ```d2 ` 代码块（[references/d2-syntax-cheatsheet.md](references/d2-syntax-cheatsheet.md)）。
4. **TALA 引擎禁用**：TALA 闭源付费（免费版有水印），一律用 `elk`（d2-syntax-cheatsheet.md）。
5. **viewBox 整数溢出**：多 class + 深嵌套 + 竖条组合会触发 ELK int64 溢出（viewBox=-9e18 空白图）。**必须单 class + 外层 1×1 grid + 竖条不设 width**（d2-syntax-cheatsheet.md §6.16）。
6. **`\n` 换行铁律**：label 内换行写 `\n` 字面量（反斜杠+n 两个字符），禁止真实换行；长 label（>8 字）必须 `\n` 拆成每行 ≤8 字（d2-syntax-cheatsheet.md §6.17）。
7. **圆角矩形全局**：每一个图形（外层/层/分区/最内层子模块/竖条）都必须圆角（c4-container-spec.md §4.8）。

---

## 6. 自检（一条命令闭环）

> 工作台脚本一条命令（自动校验 viewBox/超界/等宽/圆角），详细流程见 [references/troubleshooting.md](references/troubleshooting.md)。

```bash
# 从 md 提取 d2 块 → 工作区 .d2/.svg/.png + 自动校验（改图首选）
python3 scripts/d2-workbench.py extract docs.md --name "系统架构图"
# 改图迭代
python3 scripts/d2-workbench.py render docs-fig1.d2
# 回写 md（替换原代码块，自动 round-trip 校验并防多张图）
python3 scripts/d2-workbench.py sync docs.md docs-fig1.d2 --name "系统架构图"
```

工作台不可用时，用 troubleshooting.md §7.2 手动流程（`d2 validate` → 渲染 → `verify-svg.py`）。**验收权威脚本**：`python3 scripts/verify-svg.py out.svg`（超界/等宽/圆角判断，PASS/FAIL + 数值）。

---

## 7. CLI 速查（自检用，仅 SVG）

```bash
d2 in.d2 out.svg                                # 渲染为 SVG（默认）
d2 in.d2 out.svg --layout=elk                    # 指定布局（默认 elk 已写在 vars 内）
d2 validate in.d2                              # 语法校验（不输出文件）
d2 fmt --check in.d2                            # 格式检查
d2 --theme=0 in.d2 out.svg                       # 主题：0 Neutral Default / 200 Dark Mauve
```

---

## 8. 简短示例（最简 3 层骨架）

> 完整模板（3 层标准/竖排/竖条/层内分区）见 [references/templates.md](references/templates.md)。

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
