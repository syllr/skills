---
title: TECHNOLOGY-ARCHITECTURE — 技术架构
doc_type: template
layer: L2
description: L2 架构层 文档 TECHNOLOGY-ARCHITECTURE 的更新规范——修改 docs/L2/TECHNOLOGY-ARCHITECTURE.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L2/TECHNOLOGY-ARCHITECTURE.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - D2 容器图（§1 技术分层图，图规范见 references/diagram-spec.md）
  related: # 关联模板与联动修改
    APPLICATION-ARCHITECTURE: 应用清单 SSOT 在它 §2.2，技术架构按应用描述（应用/容器/外部系统分类一致）
    PRODUCT: 功能清单 SSOT 在它 §2，技术架构不重列功能
    DOMAIN-MODEL: 存储设计在它 §5，技术选型需与其一致
    DEPLOYMENT: 技术栈影响部署，选型变化需同步部署方式
    TEST-PLAN: UT 清单在它 §5.1，写法在它 §5.4（SSOT，引用不复制）
    DEEP-DIVES: L2 根为索引，deep-dives 为详情，S2 SSOT——同一信息只在一处维护，其余详见 docs/L2/deep-dives/<name>.md#锚点
    RESEARCH: 调研详情 SSOT 在 docs/L2/research/<name>.md，选型结论 SSOT 在本模板 §3/§4，结论链 ADR
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 关键技术选型（框架/数据库/AI 供应商）有分歧时 → 问用户拍板
    - 是否需单列 deep-dives 有争议时 → 问用户
  flow: # 生成流程
    - 扫描（自主）：读应用架构 + 领域存储 + 目标文档
    - 已有 TECHNOLOGY-ARCHITECTURE → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 技术分层图（左主体[应用/容器] + 右侧外部系统竖条[外部·Boundary外]）→ §2 前端选型 → §3 后端选型 + 存储选型 → §4 基础设施 → §5 非功能约束
    - 每个选型在 §3.1「依据」列链 `[ADR-NNNN]`（决策详情归 docs/adr/，正文只留结论+引用）
    - 检查是否命中 deep-dives 收敛标准（2/4 阈值：定义见 notes，命中则瘦身为索引并链到 deep-dives）
  notes: # 生成注意点（怎么生成）
    - §1 技术分层图：左主体分层（展现/接入/服务/数据，[应用]/[容器] Boundary 内）+ 右侧外部系统竖条（[外部] Boundary 外，不拥有只消费——大模型 API/SMTP/业务数据源/他团队服务），与应用架构图画法对齐（跨图同约定）
    - **技术栈方括号（C4 最佳实践）**：所有容器节点 label = `[技术栈]\n职责`（如 `[Vue 3 + Element Plus]\n页面/组件 · 状态管理`、`[Python+FastAPI]\n...`、`[MySQL 8]`），C4 标准要求容器附主技术栈（technology beats web frontend）
    - **容器 vs 外部系统判别**（与 STRUCTURE §3.1 infra/integration「坏了找谁修」一致）：自己运维管理 → 容器（Boundary 内）；别人提供服务（他团队/第三方）→ 外部系统（Boundary 外）——外部依赖一律放右侧竖条，不混入主分层横排
    - **层间调用仅 3 根**（展现→接入→服务→数据）；外部系统竖条**不画连线**（对接关系见 INTEGRATION，标注"不在此图画，见 INTEGRATION"）
    - 按应用描述技术栈（应用清单见 APPLICATION-ARCHITECTURE §2.2，引用不重列）
    - 不复制功能清单/能力归属/状态（产品规格 是 SSOT）；应用内模块清单见 APPLICATION-ARCHITECTURE §3.1（SSOT）
    - 每个选型给备选 + 弃用原因（Google Design Doc 惯例）+ 在 §3.1「依据」列链 `[ADR-NNNN]`（决策详情归 docs/adr/，正文只留结论+引用）
    - §3.1 存储选型明细含容量/性能预期；表/集合级结构在 DOMAIN-MODEL §5
    - **UT 写法规范 SSOT 在 TEST-PLAN §5.4**（本文档不定义 UT 框架/覆盖率/命名，不设 §6 单元测试规范）
    - 瘦身约束：本模板生成的文档仅保留 1 张技术分层图 + 1 张参数总览表作索引，详情链到 docs/L2/deep-dives/<name>.md，引用不复制；File:Line 链代码；与项目 env 文档（如 SPEC:5 env，存在时）双向引用不复制
    - 收敛标准：2/4 阈值（选型行数>8 或 单节>80 行 为 1 项，命中≥2 节即瘦身；定义见本条，flow 中引用）
    - 调研详情见 docs/L2/research/<name>.md，选型结论在此索引
    - **不设 §7 相关文档**（信息内联在各章节，避免"聚合链接"低价值章节）
  checks: # 生成后反向 check
    - "技术分层图只画技术组件，无功能模块清单"
    - "§1 图为左主体分层（[应用]/[容器] Boundary 内）+ 右侧外部系统竖条（[外部] Boundary 外），与应用架构图对齐；外部依赖在竖条，未混入主分层"
    - "所有容器节点 label = `[技术栈]\\n职责`（技术栈方括号，C4 标准）；无缺方括号节点"
    - "层间调用仅 3 根（展现→接入→服务→数据）；外部系统竖条无连线（对接见 INTEGRATION）"
    - "§3.1 每个选型「依据」列链 `[ADR-NNNN]`；无 §6 单元测试规范（UT 写法 SSOT 在 TEST-PLAN §5.4）；无 §7 相关文档（信息内联）"
    - "应用清单引用 APPLICATION-ARCHITECTURE，未重列；应用内模块清单见 APPLICATION-ARCHITECTURE §3.1"
    - "每个选型都有备选 + 弃用原因"
    - "存储选型与 DOMAIN-MODEL §5 数据设计不冲突"
    - "各节有且仅有一处详见链路（每小节至多一链；§3 允许 2 链：§3.1 存储→deep-dives，§3 续→research）；research 链仅允许在 §3/§4"
    - "路径前缀一致：所有详见/引用路径统一以 docs/L2/ 开头（deep-dives 与 research 同级），禁止混用相对与绝对写法"
    - "行数校验：wc -l docs/L2/TECHNOLOGY-ARCHITECTURE.md < 350（正文行数：awk '/```/{f=!f;next} !f' 排除 d2 代码块后 < 300 行）"
    - "与 deep-dives/INDEX 可检索一致"
---

# TECHNOLOGY-ARCHITECTURE — 技术架构

> 本文档是「<项目名>」的 **TECHNOLOGY-ARCHITECTURE（技术架构模板）**——L2 架构层的技术架构文档。
> 【模板使用指引】复制为 `docs/L2/TECHNOLOGY-ARCHITECTURE.md`，按各章节指引填写。
> 【原则】① **技术架构视角**（TOGAF）：技术栈选型、版本兼容、基础设施——回答"用什么技术实现"；② 与 APPLICATION-ARCHITECTURE 分工：APPLICATION-ARCHITECTURE 定"系统分几个应用"（应用架构），本文档**按应用分别描述技术栈**（技术架构）；③ **不复制功能清单/能力归属/功能状态**——这些以 产品规格 为唯一事实源，本文档只引用不重列；④ 每个选型给出**备选与弃用原因**（Google Design Doc 惯例，强迫证明决策）；⑤ 图用 **D2 容器图**（技术分层图，图规范见 references/diagram-spec.md）无元信息表、无变更记录。
> 【与 deep-dives 分工】本 L2 根文档为**索引**——仅保留 1 张技术分层图 + 1 张参数总览表作索引，详情链到 `docs/L2/deep-dives/<name>.md`，同一信息只在一处维护，其余详见 `docs/L2/deep-dives/<name>.md#锚点`，引用不复制。
> 【与 research 分工】`docs/L2/research/` 为**调研详情 **（候选/对比/POC/成本/风险），本模板 §3/§4 为**选型结论 **，调研过程不承载结论，结论链 ADR（见 RESEARCH.template §6）。

---

## 1. 技术架构总览（按应用 · 分层）

> 【指引】本图为 **C4 容器图**（绘制方式见 references/diagram-spec.md，画法与应用架构图对齐）。本图只画技术组件（技术层骨架）不列功能模块——功能模块清单与能力归属见产品规格，应用内模块清单见 APPLICATION-ARCHITECTURE §3.1（应用清单见其 §2.2 应用划分图）。

```d2
# 图标准元信息
# 图名: 技术架构分层图（按应用 · 分层）
# 视角: 技术架构（技术栈分层）
# 说明: 本图只画技术组件（技术层骨架），不列功能模块——功能模块清单与能力归属见产品规格
# 示例，按实际替换：图中 <占位> 为通用示例，生成时替换为实际技术栈
# 尺寸规则（c4-container-diagram）：子容器 width = (父容器 width − 内边距 24 − gap×(n−1)) / n，按实际替换

vars: {
 d2-config: {
 layout-engine: elk
 }
}

技术架构: {
 grid-rows: 1
 grid-columns: 2
 grid-gap: 16
 style.fill: "#ffffff"
 style.font-color: "#1e293b"
 style.stroke: "#94a3b8"
 style.stroke-width: 1
 style.border-radius: 16

 左主体: {
 grid-rows: 1
 grid-columns: 1
 grid-gap: 16
 style.font-color: "#1e293b"
 style.border-radius: 12

 展现层: {
 label: "① 展现层（前端应用）"
 width: 1000
 style.fill: "#dbeafe"
 style.font-color: "#1e293b"
 style.stroke: "#2563eb"
 style.stroke-width: 2
 style.border-radius: 12
 grid-columns: 1
 t1: { label: "[<前端框架>]\n页面/组件 · 状态管理 · API 请求封装"; width: 880; height: 70; class: mod }
 }

 接入层: {
 label: "② 接入层（后端应用）"
 width: 1000
 style.fill: "#ede9fe"
 style.font-color: "#1e293b"
 style.stroke: "#7c3aed"
 style.stroke-width: 2
 style.border-radius: 12
 grid-columns: 1
 t2: { label: "[<API网关/框架>]\nAPI 网关 / 鉴权 / 限流"; width: 880; height: 70; class: mod }
 }

 服务层: {
 label: "③ 服务层（后端应用）"
 width: 1000
 style.fill: "#cffafe"
 style.font-color: "#1e293b"
 style.stroke: "#0e7490"
 style.stroke-width: 2
 style.border-radius: 12
 grid-columns: 5
 grid-gap: 12
 t3a: { label: "[<运行时>]\n常规业务"; width: 185; height: 60; class: mod }
 t3b: { label: "[<Agent框架>]\nAgent 编排"; width: 185; height: 60; class: mod }
 t3c: { label: "[<运行时>]\n解析"; width: 185; height: 60; class: mod }
 t3d: { label: "[<运行时>]\n检索"; width: 185; height: 60; class: mod }
 t3e: { label: "[<运行时>]\n生成"; width: 185; height: 60; class: mod }
 }

 数据层: {
 label: "④ 数据层（存储依赖，非应用）"
 width: 1000
 style.fill: "#ffedd5"
 style.font-color: "#1e293b"
 style.stroke: "#c2410c"
 style.stroke-width: 2
 style.border-radius: 12
 grid-columns: 3
 grid-gap: 12
 t4a: { label: "[<数据库>]\n业务主库"; shape: stored_data; width: 285; height: 72; class: mod }
 t4b: { label: "[<对象存储>]\n文件/对象"; shape: stored_data; width: 285; height: 72; class: mod }
 t4c: { label: "[<缓存/MQ>]\n缓存/消息/进度"; shape: stored_data; width: 285; height: 72; class: mod }
 }
 }

 外部系统: {
 label: "⑤ 外部系统\n[外部·Boundary外]"
 grid-columns: 1
 style.fill: "#e2e8f0"
 style.font-color: "#1e293b"
 style.stroke: "#64748b"
 style.border-radius: 12
 e1: { label: "<外部_大模型API>"; width: 200; height: 50; class: mod }
 e2: { label: "<外部_邮件>"; width: 200; height: 50; class: mod }
 e3: { label: "<外部_数据源>"; width: 200; height: 50; class: mod }
 e4: { label: "<外部_他团队服务>\n（他团队）"; width: 200; height: 50; class: mod }
 }
}

# 层间调用（自上而下，仅 3 根；外部系统竖条不画连线——对接关系见 INTEGRATION）
技术架构.左主体.展现层 -> 技术架构.左主体.接入层: HTTPS 请求 { style.stroke: "#2563eb" }
技术架构.左主体.接入层 -> 技术架构.左主体.服务层: 调用 { style.stroke: "#7c3aed" }
技术架构.左主体.服务层 -> 技术架构.左主体.数据层: SQL/读写 { style.stroke: "#0e7490" }

classes: {
 mod: {
 style: { border-radius: 6; fill: "#ffffff"; stroke: "#64748b"; stroke-width: 1; font-size: 12; font-color: "#1e293b" }
 }
}
```

> **图例说明**：左主体 = [应用]/[容器]（System Boundary 内，自己拥有并负责）；右侧竖条 = [外部]（System Boundary 外，不拥有只消费——他团队/客户环境提供）。图例与 APPLICATION-ARCHITECTURE §2.2 应用划分图一致（跨图同约定）；节点 label 一律 `[技术栈]\n职责`（C4 技术栈方括号）。
>
> 【填写指引】本图只画**技术组件**（框架/网关/运行时/数据库/缓存/云平台等）；功能模块、能力归属、功能状态一律不在此重列，引用产品规格。层数按项目调整。
>
> 【详见】技术分层图详情见 `docs/L2/deep-dives/<name>.md`。

---

## 2. 前端应用

### 2.1 技术选型

> 【指引】前端应用的技术栈，每个选型给出备选与弃用原因，「依据」列链 `[ADR-NNNN]`。

| 领域     | 选型                     | 备选（弃用原因）                                             | 依据（含 ADR 链）   |
| -------- | ------------------------ | ------------------------------------------------------------ | ------------------- |
| 框架     | <选型>                   | <备选 1>（弃用原因）；<备选 2>（弃用原因）                   | <依据> `[ADR-NNNN]` |
| （示例） | 如 <技术_运行时A>（LTS） | 如 <技术_运行时B>（生态小）；如 <技术_运行时B>（兼容性风险） | 如 LTS 支持         |
| UI 组件  |                          |                                                              |                     |
| 状态管理 |                          |                                                              |                     |
| 请求封装 |                          |                                                              |                     |

### 2.2 版本与兼容

- 最低基础库版本：<版本>
- 兼容平台：<平台_接入方A> / <平台_接入方B> / 其他

---

## 3. 后端 API 应用

### 3.1 技术选型（按层）

> 【指引】后端 API 应用的技术栈，按层（接入/服务/数据/外部集成）组织，每个选型给出备选与弃用原因，**「依据」列链 `[ADR-NNNN]`**（决策详情归 `docs/adr/`，正文只留结论+引用，不展开完整论证）。

| 层                  | 选型   | 备选（弃用原因）   | 依据（含 ADR 链）   |
| ------------------- | ------ | ------------------ | ------------------- |
| 接入层（网关/鉴权） | <选型> | <备选>（弃用原因） | <依据> `[ADR-NNNN]` |
| 服务层（运行时）    |        |                    |                     |
| 数据层（数据库）    |        |                    |                     |
| 数据层（对象存储）  |        |                    |                     |
| 外部集成（AI 接入） |        |                    |                     |

#### 存储选型明细（数据层选型 + 容量/性能预期）

> 【指引】各类数据的存储选型与容量/性能预期（并入本节，属技术选型）。选型理由见上表；**表/集合级结构与 ER 见 DOMAIN-MODEL §5 数据设计**。

| 数据       | 存储选型   | 容量/性能预期                  | 理由   |
| ---------- | ---------- | ------------------------------ | ------ |
| <业务数据> | <数据库>   | <预期，如 100GB / P95 < 100ms> | <理由> |
| <文件数据> | <对象存储> |                                |        |
| <热数据>   | <缓存>     |                                |        |
| <日志>     | <日志存储> |                                |        |

> 【详见】存储选型与容量/性能详情详见 `docs/L2/deep-dives/<name>.md`，本节仅留参数总览表作索引。

### 3.2 版本与兼容

- 服务端运行时：<语言/版本>
- 数据库版本：<版本>

> 【详见】技术选型调研详情见 `docs/L2/research/<name>.md`。

---

## 4. 基础设施与外部依赖

> 【指引】系统运行依赖的基础设施（云平台/对象存储/AI 供应商等）与外部服务，标注**归属应用**（前端/后端 API）与类型（自建/托管/第三方）。拓扑细节见 DEPLOYMENT。

| 依赖     | 归属应用          | 类型（自建/托管/第三方） | 用途 | 备选 |
| -------- | ----------------- | ------------------------ | ---- | ---- |
| <依赖 1> | <前端 / 后端 API> |                          |      |      |

> 【详见】基础设施/外部依赖详情详见 `docs/L2/deep-dives/<name>.md`。

---

## 5. 非功能约束

> 【指引】对技术栈有硬性约束的非功能要求（性能/安全/成本/合规）。

| 类别 | 要求                            | 对技术选型的影响 |
| ---- | ------------------------------- | ---------------- |
| 性能 | <如：核心链路 P95 < 2s>         | <影响选型>       |
| 安全 | <如：密钥不落前端>              |                  |
| 成本 | <如：<平台_接入方A> 免费额度内> |                  |
| 合规 | <如：AIGC 标识要求>             |                  |

> 注：UT（单元测试）写法规范 ** 在 TEST-PLAN §5.4**（本文档不定义 UT 框架/覆盖率/命名）。
