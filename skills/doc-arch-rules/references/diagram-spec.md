# 图规范（diagram-spec · 图型选型与绘制 SSOT）

> 本文件是 doc-arch-rules skill 的**图规范 SSOT**——定义项目 docs/ 下所有图的「是什么图」与「怎么画」（工具/代码块/fallback）。**按需查阅**：宪法 §3.1 文档架构表标注各文档的图类型；画某类图前读本文件对应小节。各文档正文图旁只标"本图是什么图"（如"本图为流程图"），绘制方式引本文件，不复制工具细节。修改本文件 = 影响所有用图文档的生成（rule 组装时本文件不内联，由 AI 从 skill references/ 读取）。
>
> 本文件**不随 rule 生成**——doc-arch-rules 运行时本文件在同 skill 的 `references/` 下可访问，生成/更新 docs 文档的 AI 按宪法指向读取。

## 图类型速查

| 图类型                                                    | 画什么                                                                                                              | 工具                                                                      | 代码块                         | Fallback                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------ | ------------------------------ |
| **容器图**（C4 Container）                                | 多层大容器嵌套分层（应用/技术/能力/文档架构）                                                                       | D2（工具 `c4-container-diagram`）                                         | ` ```d2 `                      | ASCII 图（保持同样分层布局）   |
| **C4 Context 图**                                         | 系统与外部（用户/平台/服务）的关系                                                                                  | Mermaid                                                                   | ` ```mermaid ` flowchart       | ASCII 图                       |
| **结构/拓扑图**（上下文映射/部署拓扑/资产总览）           | 关系/分类/分区（非控制流）                                                                                          | Mermaid（subgraph 分组）                                                  | ` ```mermaid ` flowchart       | ASCII 图                       |
| **流程图**                                                | 控制流/分支/处理步骤                                                                                                | Mermaid                                                                   | ` ```mermaid ` flowchart       | ASCII 图                       |
| **状态流转**（流式线性片段）                              | 功能触发的状态路径（A→B→C，单向推进）                                                                               | Mermaid                                                                   | ` ```mermaid ` flowchart       | ASCII 图                       |
| **状态机**（完整环式）                                    | 领域对象完整状态（状态可来回/循环）                                                                                 | Mermaid                                                                   | ` ```mermaid ` stateDiagram-v2 | ASCII 图                       |
| **时序图**                                                | 跨模块/跨系统调用时序                                                                                               | Mermaid                                                                   | ` ```mermaid ` sequenceDiagram | ASCII 图                       |
| **ER 图**                                                 | 实体关系（DOMAIN-MODEL §5.1 表结构用 ER；DOMAIN-MODEL §3 聚合/实体用类图，不用 ER——类图才能表达聚合根/方法/不变量） | Mermaid                                                                   | ` ```mermaid ` erDiagram       | ASCII 图                       |
| **数据血缘图（DFD）**                                     | 数据在存储/加工/外部间的同步/异步流转（按业务阶段分组）                                                             | Mermaid `flowchart TB`（DFD 形状约定）<br>仅需圆柱形状的表关系总览可用 D2 | ` ```mermaid ` flowchart TB    | ASCII 图                       |
| **脑图**（mindmap）                                       | 能力分解/结构发散（仅层次分类，不画流转）                                                                           | Mermaid                                                                   | ` ```mermaid ` mindmap         | ASCII 缩进树                   |
| **产品能力架构图**（Product Capability Architecture Map） | 产品能力分层 × 状态（单通道编码，见 §能力图编码规范）                                                               | D2（工具 `c4-container-diagram`）                                         | ` ```d2 `                      | ASCII 图（保持同样分层布局）   |
| **类图**（classDiagram）                                  | 类/角色关系                                                                                                         | Mermaid                                                                   | ` ```mermaid ` classDiagram    | ASCII 图                       |
| **目录树**                                                | 项目/文档目录结构                                                                                                   | ASCII（天然）                                                             | ` ```text `                    | —（ASCII 即默认）              |
| **UI 图**（界面原型）                                     | 页面/界面结构（USER-STORY §4.2 单故事交互「涉及 UI」）                                                              | Pencil（.pen 文件，工具 `pencil`）                                        | `.pen` 文件                    | —（UI 图专用工具，不走 ASCII） |

## 通用规则

1. **工具分工**：D2 只用于「容器式分层图」（多层大容器嵌套）及需圆柱形状的 DFD/表关系总览（DOMAIN-MODEL §5.1 属合理扩展，文档中已声明）；其他所有图用 Mermaid（flowchart / stateDiagram / sequenceDiagram / erDiagram / mindmap / classDiagram）。Mermaid 在主流 Markdown 平台原生渲染；D2 需通过 `c4-container-diagram` 工具渲染。
2. **Fallback**：系统找不到对应工具/渲染环境时，一律退化为 ASCII 图（文本可 diff、任何环境显示），保持同样的结构/布局规范。
3. **结构图标注真实类型**：flowchart 可画结构/拓扑图（subgraph 分组），但图旁标注必须写真实类型（如"本图为上下文映射图/部署拓扑图"），不套用"流程图"标签。
4. **状态流转 vs 状态机**：流式线性状态片段（DOMAIN-MODEL §3 Action）用 flowchart；完整环式状态机（DOMAIN-MODEL §3.6）用 stateDiagram-v2，不混用。
5. **容器图特则**：多层大容器纵向嵌套、每层子容器显式算 width（等宽居中）、全圆角、按层配色、文字深色（对比度 ≥ 4.5:1）——细节见 `c4-container-diagram` 工具。
6. **文档标注**：各文档图旁只需标"本图是什么图"（如"本图为 C4 容器图"），绘制方式引本文件，不复制工具细节。
7. **能力图编码规范（状态线型 · 单通道 · 一眼可见）**：产品能力架构图（PRODUCT §2.1）用节点线型表达实现状态——单一视觉通道（`class: [solid]` / `class: [dashed]`）。不设优先级热力（优先级是主观易变的决策，非能力自身属性，不入图）。编码规则（SSOT）：
   - **线型 = 状态**：实线框（`stroke-width: 2`，`solid`）= 已实现（含本迭代要实现）；虚线框（`stroke-dash`，`dashed`）= 待规划（本迭代不做；中间态如 POC/开发中归入待规划，细节在能力清单表标注，不细分第三档）
   - **入口层不参与编码**：页面/触点不是能力，无状态维度（保持白底实线）
   - **图例独立成 d2 图**：图例是跨文档的编码规则说明，不挤进架构图底部——放 §2 顶部独立的 ` ```d2 ` 图例块（实线/虚线两个节点示例），架构图内不画图例、不重复编码说明
   - **归属**：状态是产品层信息，唯一事实源在 PRODUCT §2（架构图 + 能力清单表），其他文档引用不复制；演进时状态变化只改 PRODUCT（检查：grep -r "优先级" 仅确认 PRODUCT 文档无优先级残留）
   - **能力 → 聚合操作（Action）映射**：Action 签名/状态/事件是领域层信息，SSOT 在 DOMAIN-MODEL §3，PRODUCT 能力表不平铺 Action（产品层不暴露实现），引用/链接而非复制
8. **图即文本**：文档图必须用文本化方式（D2 / Mermaid / ASCII 代码块，直接写入 .md），禁止位图截图/在线工具导出图——文本化才能进 Git、可 diff、可在任何渲染器显示。检查：`grep -E '```(d2|mermaid)'` 确认图以文本形式存在于 .md 内。
9. **数据血缘图（DOMAIN-MODEL §5.1 数据流转）形状与线型约定（DFD）**：圆柱 `[(...)]` = 数据存储、矩形 `[...]` = 加工、胶囊 `([...])` = 外部实体；实线 = 同步流转、虚线 `-.->` = 异步/最终一致；`subgraph` 按业务阶段分组（外部来源/同步镜像/审前/生成/文书/归档整改），边标签用数据名（名词）；不可见边（`~~~`）按主链顺序串 subgraph 强制排布；跨组连线时 `subgraph direction` 会被静默忽略（Mermaid 官方限制），对策见案例——声明顺序=主链顺序/组内边内聚/回边用虚线外缘/多源多目标用 `&` 合并。
10. **禁用清单（图型选型实测淘汰）**：❌ mindmap 画血缘（丢叶子间流转，无方向/标签/回边）；❌ D2 画多阶段血缘（elk 多容器+大量跨容器连线+回边布局失控）；❌ Graphviz dot 预渲染 SVG（违反规则 8，需 .dot 源+预渲染两个文件）。✅ 数据血缘最优解 = Mermaid flowchart TB（零额外工具，布局靠不可见边弥补，选型理由记 ADR）。
11. **数据库 ER 两层模式（DOMAIN-MODEL §5.1）**：16+ 表不可塞一张 ER（宽 4000px+ 不可读）→ ① 表关系总览（平铺 DAG，无字段，FK 连线）；② 单表字段 ER（每表一个 `erDiagram`，字段+PK/FK/UK）。单张 ER 图实体数 ≤8，超过拆分，跨图用影子实体（只含 PK 的简化框+虚线）。
12. **图旁必标真实类型**：已在规则 3 要求，但数据/领域图需显式区分——类图旁标"本图为领域类图" vs ER 图旁标"本图为数据库 ER 图"，血缘图旁标"本图为数据血缘图（DFD）"，避免 ER/类图混淆。

## 数据存储节点形状（stored_data 首选）

- 数据库/对象存储/缓存节点用 `shape: stored_data`（数据库筒仓图标，label 垂直居中，两行不贴边）——**弃用 `shape: cylinder`**（label 底部锚定、两行贴边溢出、`label.near` 无 center 值，无法修复）
- 两行 label 时 `height` 提至 72（单行 60 即可）
- 详见 `c4-container-diagram` 工具 d2-syntax-cheatsheet §6.18 / layout-and-grid §6.7a
