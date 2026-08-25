---
description: common 贯穿层 文档 STRUCTURE 的全局规范——目录结构 SSOT，全局加载
alwaysApply: true
---

# STRUCTURE 文档更新规范（common 贯穿层）

## 触发条件

当以下任一情况发生时，本规则必须生效：

- 编辑、新增或重建 `docs/common/STRUCTURE.md`
- 关联文档变化需联动更新（来自 generation.related）：
  - `CONSTITUTION`（文档分层规则 SSOT 在它 §3.1，规则变更需同步 docs/ 子树目录）
  - `PRODUCT`（功能 SSOT，功能目录增删需同步）
  - `APPLICATION-ARCHITECTURE`（应用架构，代码目录划分需对应）
  - common 角色：本文档是「改任何文档前」的必读项（定位文档对应代码，防漂移）
- 用户要求"生成/更新 STRUCTURE"

## 执行流程

1. **工具**：ASCII 目录树（§1，文本可 diff、任何渲染器显示）
2. **扫描**（自主，不问用户）：
   - 读 宪法：文档架构（L0-L4 + common 层）
   - 扫描项目实际目录：现有文档/代码结构
   - 扫描目标文档：STRUCTURE 是否已存在
3. **问用户**（仅当有歧义）：
   - 目录组织有争议时（如某些文件放哪）→ 问用户
4. **生成流程**：
   - 扫描（自主）：读宪法文档架构 + 项目实际目录 + 目标文档
   - 已有 STRUCTURE → 参考旧文档有效信息，但结构按本模板重建
   - 按模板生成：§1 目录树（ASCII）→ §2 目录职责说明 → §3 组织原则 → §4 变更说明

## 硬性要求

- 项目目录树是文件位置的事实源（SSOT），README/AGENTS 引用此处不重复
- common 角色：STRUCTURE 是「文档 ↔ 代码」映射——改任何文档前，通过本文档定位其对应代码，再读代码核对漂移（文档与代码可能不一致，读代码防漂移）
- 文档分层规则（见宪法）（SSOT），docs/ 子树遵守该分层但不重复规则
- 目录随功能与架构确定后落地（功能见 PRODUCT，架构见 APPLICATION-ARCHITECTURE）
- 按文档架构 L0-L4 分层组织 docs/，代码按前端/后端分开
- 不用 emoji
- **联动**：更新时按 related 同步关联文档（见触发条件）；跨层引用单向向下，下层不链回上层
- **不用 emoji**（S8，grep 校验）
- **图规范**：按 generation.tools 与 CONSTITUTION §3.2 用 D2 / Mermaid / ASCII

## 完成判定

以下全部通过才算完成（generation.checks 逐条）：

- 目录树与 宪法 文档分层一致（L0-L4 + common 层）
- 每个目录/文件都有职责说明
- README/AGENTS 引用的路径与目录树一致
- S8：文档不含 emoji（grep 检查通过，详见 CONSTITUTION S8 依据）

---

## 模板（生成/更新文档的结构基准）

以下为 `docs/common/STRUCTURE.md` 的模板正文（不含 YAML frontmatter，生成/更新时以此结构为准，按 `> 【指引】` 填写，实例不含 `> 【指引】` 说明）：

# STRUCTURE — 项目目录结构

> 本文档是「<项目名>」的 **STRUCTURE（目录结构模板）**——common 层的目录结构文档（文档 ↔ 代码映射）。
> 【模板使用指引】复制为 `docs/common/STRUCTURE.md`，按各章节指引填写。
> 【原则】① **项目目录树是唯一事实源（SSOT）**——整个项目的文件组织（代码目录 + docs/ + refs/ + 功能目录等），README/AGENTS 引用此处不重复；①b **common 用途：文档 ↔ 代码映射**——改文档前读本文档定位对应代码，读代码核对漂移（S4 差异主动修复）；② **文档目录规范（docs/ 怎么分层）在 宪法**——STRUCTURE 只落地 docs/ 子树（文件放哪），不重复分层规则；③ 每个目录/文件说明"干什么、为什么这么放"；④ **目录结构随功能与架构确定后落地**（功能见 PRODUCT，架构见 APPLICATION-ARCHITECTURE）；⑤ 与具体技术栈/框架无关（示例用本项目结构演示）；⑥ 图用 **ASCII 目录树**（文本可 diff、任何渲染器显示）；⑦ **不用 emoji**。


## 1. 目录树（总览）

> 【指引】项目完整目录树（ASCII），标注每个目录/文件的职责。**本项目目录树是文件位置的事实源（SSOT）**——README/AGENTS 引用此处；**文档分层规则（见宪法）**（docs/ 子树的目录名遵守该分层，不重复规则）。

```text
<项目名>/
├── README.md                    # L1 项目入口（是什么 + 文档索引，根目录）
├── AGENTS.md                    # 项目知识库（规范/结构/参考索引，根目录）
├── docs/
│   ├── L1/                      # 产品层（What · 业务架构）
│   │   ├── README.md            # 入口/索引（项目是什么 + 文档索引，根目录）
│   │   ├── PRODUCT.md           # 产品规格全景（能力分层 + 状态）
│   │   └── USER-STORY.md        # 用户故事（需求源头 + 旅程 + 交互）
│   ├── L2/                      # 架构层（How-Structure）
│   │   ├── APPLICATION-ARCHITECTURE.md # 应用架构（应用划分 + 模块）
│   │   ├── DOMAIN-MODEL.md      # 领域模型 + 数据设计
│   │   ├── TECHNOLOGY-ARCHITECTURE.md # 技术架构（含存储选型）
│   │   └── ADR/                 # 架构决策记录
│   ├── L3/                      # 契约层（How-Contract）
│   │   ├── API.md               # 接口契约（Inbound）
│   │   └── INTEGRATION.md       # 外部集成（Outbound）
│   ├── L4/                      # 交付层（Deliver）
│   │   ├── TEST-PLAN.md         # 测试计划（E2E/流程/UT）+ RTM + 报告
│   │   └── DEPLOYMENT.md        # 部署与发布
│   └── common/                     # common 层（贯穿所有层 · 全局知识）
│       ├── STRUCTURE.md         # 本文件（目录结构，文档 ↔ 代码映射）
│       ├── GLOSSARY.md          # 术语表
│       ├── DATA-DICTIONARY.md   # 数据字典
│       ├── SECURITY.md          # 安全设计
│       └── TECHDEBT.md          # 技术债登记
├── <前端代码目录>/              # 前端代码（结构见 APPLICATION-ARCHITECTURE）
└── <后端代码目录>/              # 后端代码（结构见 APPLICATION-ARCHITECTURE）
```

> 【填写指引】替换为项目实际目录；每个条目写清职责；目录树随项目演进更新。


## 2. 目录职责说明

> 【指引】对关键目录/文件逐一说明：**干什么 + 为什么这么放**。非关键/自明的可省略。

| 路径            | 职责     | 为什么这么放 |
| --------------- | -------- | ------------ |
| <目录/文件路径> | <干什么> | <为什么在这> |
| （补充）        |          |              |


## 3. 目录组织原则

> 【指引】说明目录组织的规则（为什么这么分层/分组），帮助理解结构、指导新增文件放哪。

- <组织原则 1：如"按文档架构 L0-L4 分层组织 docs/">
- <组织原则 2：如"代码按前端/后端分开，各自内部结构见 APPLICATION-ARCHITECTURE">
- （补充）


## 4. 变更说明

> 【指引】目录结构发生变化时，在此说明**当前结构**（不写历史——历史归 ADR/TECHDEBT）。本文档始终反映当前目录现状。

- <当前目录结构的说明>
