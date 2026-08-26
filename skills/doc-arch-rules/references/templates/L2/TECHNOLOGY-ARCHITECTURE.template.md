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
    - D2 容器图（§1 技术分层图，图规范见宪法）
  related: # 关联模板与联动修改
    APPLICATION-ARCHITECTURE: 应用清单 SSOT 在它 §2.2，技术架构按应用描述
    PRODUCT: 功能清单 SSOT 在它 §2，技术架构不重列功能
    DOMAIN-MODEL: 存储设计在它 §5，技术选型需与其一致
    DEPLOYMENT: 技术栈影响部署，选型变化需同步部署方式
    TEST-PLAN: UT 清单在它 §5.1，写法在它 §6（引用不复制）
    DEEP-DIVES: L2 根为索引，deep-dives 为详情，S2 SSOT——同一信息只在一处维护，其余详见 docs/L2/deep-dives/<name>.md#锚点
    RESEARCH: 调研详情 SSOT 在 docs/L2/research/<name>.md，选型结论 SSOT 在本模板 §3/§4，推荐链 ADR
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 关键技术选型（框架/数据库/AI 供应商）有分歧时 → 问用户拍板
    - 是否需单列 deep-dives 有争议时 → 问用户
  flow: # 生成流程
    - 扫描（自主）：读应用架构 + 领域存储 + 目标文档
    - 已有 TECHNOLOGY-ARCHITECTURE → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 技术分层图 → §2 前端选型 → §3 后端选型 + 存储选型 → §4 基础设施 → §5 非功能约束
    - 检查是否命中 deep-dives 收敛标准（2/4 阈值：定义见 notes，命中则瘦身为索引并链到 deep-dives）
  notes: # 生成注意点（怎么生成）
    - 按应用描述技术栈（应用清单见 APPLICATION-ARCHITECTURE §2.2，引用不重列）
    - 不复制功能清单/能力归属/状态（产品规格 是 SSOT）
    - 每个选型给备选 + 弃用原因（Google Design Doc 惯例）
    - §3.1 存储选型明细含容量/性能预期；表/集合级结构在 DOMAIN-MODEL §5
    - 瘦身约束：本模板生成的文档仅保留 1 张技术分层图 + 1 张参数总览表作索引，详情链到 docs/L2/deep-dives/<name>.md，引用不复制；File:Line 链代码；与 SPEC:5 env 双向引用不复制
    - 收敛标准：2/4 阈值（选型行数>8 或 单节>80 行 为 1 项，命中≥2 节即瘦身；定义见本条，flow 中引用）
    - 调研详情见 docs/L2/research/<name>.md，选型结论在此索引
  checks: # 生成后反向 check
    - "技术分层图只画技术组件，无功能模块清单"
    - "应用清单引用 APPLICATION-ARCHITECTURE，未重列"
    - "每个选型都有备选 + 弃用原因"
    - "存储选型与 DOMAIN-MODEL §5 数据设计不冲突"
    - "各节有且仅有一处详见链路（每小节至多一链；§3 允许 2 链：§3.1 存储→deep-dives，§3 续→research）；research 链仅允许在 §3/§4"
    - "路径前缀一致：所有详见/引用路径统一以 docs/L2/ 开头（deep-dives 与 research 同级），禁止混用相对与绝对写法"
    - "行数校验：wc -l docs/L2/TECHNOLOGY-ARCHITECTURE.md < 350（正文不含图 < 300 行）"
    - "与 deep-dives/INDEX 可检索一致"
---

# TECHNOLOGY-ARCHITECTURE — 技术架构

> 本文档是「<项目名>」的 **TECHNOLOGY-ARCHITECTURE（技术架构模板）**——L2 架构层的技术架构文档。
> 【模板使用指引】复制为 `docs/L2/TECHNOLOGY-ARCHITECTURE.md`，按各章节指引填写。
> 【原则】① **技术架构视角**（TOGAF）：技术栈选型、版本兼容、基础设施——回答"用什么技术实现"；② 与 APPLICATION-ARCHITECTURE 分工：APPLICATION-ARCHITECTURE 定"系统分几个应用"（应用架构），本文档**按应用分别描述技术栈**（技术架构）；③ **不复制功能清单/能力归属/功能状态**——这些以 产品规格 为唯一事实源，本文档只引用不重列；④ 每个选型给出**备选与弃用原因**（Google Design Doc 惯例，强迫证明决策）；⑤ 图用 **Mermaid / D2 容器图**无元信息表、无变更记录。
> 【与 deep-dives 分工】本 L2 根文档为**索引**——仅保留 1 张技术分层图 + 1 张参数总览表作索引，详情链到 `docs/L2/deep-dives/<name>.md`（S2 SSOT），同一信息只在一处维护，其余详见 `docs/L2/deep-dives/<name>.md#锚点`，引用不复制。
> 【与 research 分工】`docs/L2/research/` 为**调研详情 SSOT**（候选/对比/POC/成本/风险），本模板 §3/§4 为**选型结论 SSOT**，调研过程不承载结论，结论链 ADR（见 RESEARCH.template §6）。

---

## 1. 技术架构总览（按应用 · 分层）

> 【指引】技术架构基于应用架构（APPLICATION-ARCHITECTURE）：**应用清单见 APPLICATION-ARCHITECTURE §2.2 应用划分图（SSOT，此处引用不重列）**。本图为 **C4 容器图**（绘制方式见宪法图规范）——**横向分层**（自上而下），每层标注归属应用。**本图只画技术组件（技术层骨架），不列功能模块**——功能模块清单与能力归属见产品规格（唯一事实源，此处引用不重列）。

```d2
# 图标准元信息
# 图名: 技术架构分层图（按应用 · 分层）
# 视角: 技术架构（技术栈分层）
# 说明: 本图只画技术组件（技术层骨架），不列功能模块——功能模块清单与能力归属见产品规格
# 示例，按实际替换：图中 <占位> 为通用示例，生成时替换为实际技术栈

vars: {
  d2-config: {
    layout-engine: elk
  }
}

技术架构: {
  grid-rows: 1
  grid-columns: 1
  grid-gap: 24
  style.fill: "#ffffff"
  style.font-color: "#1e293b"
  style.stroke: "#94a3b8"
  style.stroke-width: 1
  style.border-radius: 16

  展现层: {
    label: "展现层（前端应用）"
    width: 1000
    style.fill: "#dbeafe"
    style.font-color: "#1e293b"
    style.stroke: "#2563eb"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 1
    t1: { label: "<前端应用: 框架/状态管理>\n<页面/组件/状态管理 · API 请求封装>"; width: 880; height: 70; class: mod }
  }

  接入层: {
    label: "接入层（后端 API 应用）"
    width: 1000
    style.fill: "#ede9fe"
    style.font-color: "#1e293b"
    style.stroke: "#7c3aed"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 1
    t2: { label: "<API网关>\n<鉴权 · 限流>"; width: 880; height: 70; class: mod }
  }

  服务层: {
    label: "服务层（后端 API 应用）"
    width: 1000
    style.fill: "#cffafe"
    style.font-color: "#1e293b"
    style.stroke: "#0e7490"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 1
    t3: { label: "<后端服务运行时>\n<各功能模块实现，清单见产品规格>"; width: 880; height: 70; class: mod }
  }

  数据层: {
    label: "数据层（后端 API 应用）"
    width: 1000
    style.fill: "#ffedd5"
    style.font-color: "#1e293b"
    style.stroke: "#c2410c"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 1
    t4: { label: "<数据库/对象存储/缓存>"; width: 880; height: 70; class: mod }
  }

  基础支撑层: {
    label: "基础支撑层 + 外部依赖"
    width: 1000
    style.fill: "#e2e8f0"
    style.font-color: "#1e293b"
    style.stroke: "#475569"
    style.stroke-width: 2
    style.border-radius: 12
    grid-columns: 1
    t5: { label: "<基础支撑：用户体系 · 算力体系 · AI能力 · 数据存储 · 支付 · 消息>\n<外部依赖：第三方 AI 服务 · 微信支付平台 · 云开发>"; width: 880; height: 80; class: mod }
  }
}

# 层间调用（自上而下）
技术架构.展现层 -> 技术架构.接入层: HTTPS 请求 { style.stroke: "#2563eb" }
技术架构.接入层 -> 技术架构.服务层: 调用 { style.stroke: "#7c3aed" }
技术架构.服务层 -> 技术架构.数据层: 读写 { style.stroke: "#0e7490" }
技术架构.数据层 -> 技术架构.基础支撑层: 支撑/调用 { style.stroke: "#c2410c" }

classes: {
  mod: {
    style: { border-radius: 6; fill: "#ffffff"; stroke: "#64748b"; stroke-width: 1; font-size: 12; font-color: "#1e293b" }
  }
}
```

> 【填写指引】本图只画**技术组件**（框架/网关/运行时/数据库/缓存/云平台等）；功能模块、能力归属、功能状态一律不在此重列，引用产品规格。层数按项目调整。
>
> 【详见】技术分层图详情见 `docs/L2/deep-dives/<name>.md`。

---

## 2. 小程序前端应用

### 2.1 技术选型

> 【指引】前端应用的技术栈，每个选型给出备选与弃用原因。

| 领域     | 选型                | 备选（弃用原因）                           | 依据        |
| -------- | ------------------- | ------------------------------------------ | ----------- |
| 框架     | <选型>              | <备选 1>（弃用原因）；<备选 2>（弃用原因） | <依据>      |
| （示例） | 如 Node.js 18 (LTS) | 如 Deno（生态小）；如 Bun（兼容性风险）    | 如 LTS 支持 |
| UI 组件  |                     |                                            |             |
| 状态管理 |                     |                                            |             |
| 请求封装 |                     |                                            |             |

### 2.2 版本与兼容

- 最低基础库版本：<版本>
- 兼容平台：<微信 / 支付宝 / 其他>

---

## 3. 后端 API 应用

### 3.1 技术选型（按层）

> 【指引】后端 API 应用的技术栈，按层（接入/服务/数据/外部集成）组织，每个选型给出备选与弃用原因。

| 层                  | 选型   | 备选（弃用原因）   | 依据   |
| ------------------- | ------ | ------------------ | ------ |
| 接入层（网关/鉴权） | <选型> | <备选>（弃用原因） | <依据> |
| 服务层（运行时）    |        |                    |        |
| 数据层（数据库）    |        |                    |        |
| 数据层（对象存储）  |        |                    |        |
| 外部集成（AI 接入） |        |                    |        |

#### 存储选型明细（数据层选型 + 容量/性能预期）

> 【指引】各类数据的存储选型与容量/性能预期（原数据架构 §4 存储方案并入此处，属技术选型）。选型理由见上表；**表/集合级结构与 ER 见 DOMAIN-MODEL §5 数据设计**。

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

| 类别 | 要求                    | 对技术选型的影响 |
| ---- | ----------------------- | ---------------- |
| 性能 | <如：核心链路 P95 < 2s> | <影响选型>       |
| 安全 | <如：密钥不落前端>      |                  |
| 成本 | <如：云开发免费额度内>  |                  |
| 合规 | <如：AIGC 标识要求>     |                  |

---

## 6. 单元测试规范（UT）

> 【指引】UT 写法规范见 TEST-PLAN §6，此处不重复，本节仅声明技术栈对测试框架的约束。

| 测试框架   | 版本   | 选型约束                     | 依据   |
| ---------- | ------ | ---------------------------- | ------ |
| <测试框架> | <版本> | <如：须与语言运行时版本兼容> | <依据> |

---

## 7. 相关文档

- TEST-PLAN（测试计划）：UT 清单见它 §5.1，写法见它 §6
- DOMAIN-MODEL（领域模型）：UT 覆盖的领域对象状态机见它 §6
