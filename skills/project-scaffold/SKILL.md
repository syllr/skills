---
name: project-scaffold
description: >
  项目文档体系引导器（引导器 skill）——把本仓库持有的两类模板资产安装到目标项目的固定路径：
  ① 项目宪法（references/agents-templates/AGENTS.md，安装到项目根 AGENTS.md）；
  ② 全部 Skill（references/skill-templates/**，安装到项目级 .opencode/skills/：A 类纯文档 docs-* 10 个 + B 类文档资产 *-ops 5 个 + C 类编排 align-docs 1 个）。
  提供检查/安装/更新：--check 只报告四态、--apply 安装缺失并刷新受管区块与受管 frontmatter 键（区块外用户内容保留）、--force 覆盖无标记区冲突项；区块外与无标记区绝不覆盖，根 AGENTS.md 冲突必须显式处理。
  本 skill 只安装项目宪法与 Skill 资产，不生成业务文档（docs/** 正文），不负责文档-代码对齐/漂移处理/文档初始化/目录同步（归 align-docs skill）。
  仅用户手动调用时触发，不自动触发。
  触发词：初始化项目文档体系、安装项目宪法、安装文档 skill、安装 project-doc、bootstrap 文档、生成域 skill、安装域 skill、project-scaffold、项目文档引导、文档体系落地、更新文档指引。
---

# project-scaffold — 项目文档体系引导器

## 定位

引导器 skill：把本仓库持有的两类模板资产，一次性安装到目标项目的固定路径，让目标项目获得「根 AGENTS.md 项目宪法 + A 类纯文档
Skill + B 类文档资产 Skill + C 类编排器」。产物落在目标项目内（项目级，不写全局），不生成业务文档。

| 资产     | 来源（SSOT）                                | 落位（目标项目）           | 性质                   |
|----------|---------------------------------------------|----------------------------|------------------------|
| 项目宪法 | `references/agents-templates/AGENTS.md`     | 项目根 `AGENTS.md`         | 受保护文档（L0）       |
| Skill 集 | `references/skill-templates/<分组>/<name>/` | `.opencode/skills/<name>/` | 可执行 Skill（项目级） |

不承载（完全独立）：

- 不生成 `docs/**` 业务文档正文（`BUSINESS.md` / `INBOUND.md` / `DEPLOYMENT.md` 等）——业务文档由目标项目的 AI 按安装后的
  `docs-*` skill 生成/维护。
- 文档-代码对齐、漂移处理、文档初始化、旧文档清理与融合全部归 `align-docs` skill（编排器）；需要时直接调 `align-docs`，本 skill
  不承载、不路由。

## 何时使用（仅手动触发）

本 skill 无关键字分诊，仅用户显式调用时执行；默认一次调用完成「检查 → 安装 → 报告」：

1. 首次 bootstrap：目标项目尚无项目宪法与 Skill 集 → `--check` 摸底 → `--apply` 安装。
2. 增量检查/更新：目标项目已有部分资产 → `--check` 报四态 → 按需 `--apply`（冲突项显式处理）。

变体：

- 只想知道缺什么、有无冲突：`--check`（默认，只报告不写盘）。
- 要覆盖项目侧已改动的文件：`--apply --force`（执行前必须让用户确认，见「冲突保护」）。

## 两类模板资产（SSOT）

### 资产一：项目宪法（`references/agents-templates/AGENTS.md`）

单文件，落位项目根 `AGENTS.md`，即「项目宪法」章节：文档体系与目录架构 + 跨目录通用规范 + 三类 Skill 路由。由模板生成、受保护（AI
不得编辑受管区块内内容）；项目侧的例外或补充写在区块外。

### 资产二：Skill 集（`references/skill-templates/<分组>/<name>/`）

落地到 `.opencode/skills/<name>/`；`SKILL.template.md` → `SKILL.md`，其余条目（`references/`、`assets/`）保持相对目录结构原样复制。

### A 类 · 纯文档（`docs-*`，共 10 个）

产物只有面向人读的说明书，没有资产、状态机与门禁。每个目录含两份资产：`SKILL.template.md`（执行流程：读取 / 生成 / 更新 /
联动 / 校验）与 `assets/TEMPLATE.md`（目标文档骨架模板）；生成文档时先读模板再写，骨架内容只放模板、不写进 SKILL。

| Skill                                                                                                            | 管辖文档                            |
|------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| [docs-business](references/skill-templates/docs/docs-business/SKILL.template.md)                                 | docs/L1/BUSINESS.md                 |
| [docs-application-architecture](references/skill-templates/docs/docs-application-architecture/SKILL.template.md) | docs/L2/APPLICATION-ARCHITECTURE.md |
| [docs-data-architecture](references/skill-templates/docs/docs-data-architecture/SKILL.template.md)               | docs/L2/DATA-ARCHITECTURE.md        |
| [docs-technology-architecture](references/skill-templates/docs/docs-technology-architecture/SKILL.template.md)   | docs/L2/TECHNOLOGY-ARCHITECTURE.md  |
| [docs-domain](references/skill-templates/docs/docs-domain/SKILL.template.md)                                     | docs/L2/domain/                     |
| [docs-deep-dives](references/skill-templates/docs/docs-deep-dives/SKILL.template.md)                             | docs/L2/deep-dives/                 |
| [docs-research](references/skill-templates/docs/docs-research/SKILL.template.md)                                 | docs/L2/research/                   |
| [docs-structure](references/skill-templates/docs/docs-structure/SKILL.template.md)                               | docs/common/STRUCTURE.md            |
| [docs-code-guide](references/skill-templates/docs/docs-code-guide/SKILL.template.md)                             | docs/common/CODE-GUIDE.md           |
| [docs-changes](references/skill-templates/docs/docs-changes/SKILL.template.md)                                   | docs/changes/                       |

### B 类 · 文档 + 资产（`*-ops`，共 5 个）

一个能力域一个 skill，同时管辖该域的说明书、资产与执行动作，并在自己的完成判定里保证三者一致。

| Skill 模板                                                                    | 能力域               | 说明书                       | 资产                                            | 形态                                    |
|-------------------------------------------------------------------------------|----------------------|------------------------------|-------------------------------------------------|-----------------------------------------|
| [inbound-ops](references/skill-templates/ops/inbound-ops/SKILL.template.md)   | L3 Inbound 契约      | docs/L3/INBOUND.md           | docs/L3/openapi/                                | 多文件（SKILL + references/ + assets/） |
| [outbound-ops](references/skill-templates/ops/outbound-ops/SKILL.template.md) | L3 Outbound 外部集成 | docs/L3/OUTBOUND.md          | docs/L3/outbound-contracts/                     | 多文件（SKILL + references/ + assets/） |
| [deploy-ops](references/skill-templates/ops/deploy-ops/SKILL.template.md)     | L4 部署              | docs/L4/DEPLOYMENT.md        | docs/L4/deployment/                             | 多文件（SKILL + references/ + assets/） |
| [test-ops](references/skill-templates/ops/test-ops/SKILL.template.md)         | 测试                 | 用例卡写卡规范（skill 自持） | docs/test/test-cases/ + docs/test/test-records/ | 多文件（SKILL + references/ + assets/） |
| [tools-ops](references/skill-templates/ops/tools-ops/SKILL.template.md)       | 系统访问通道         | docs/tools/README.md         | docs/tools/（Node CLI）                         | 多文件（SKILL + references/ + assets/） |

### C · 编排（`align-docs`，共 1 个）

只调度 A / B 类，不生产任何层次产物。

| Skill 模板                                                            | 职责                                                                                                    | 形态                   |
|-----------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|------------------------|
| [align-docs](references/skill-templates/align-docs/SKILL.template.md) | 文档编排器：对齐 / 解决漂移 / 文档初始化 / 旧文档清理与融合，按 L0→L1→…→common 调用各 A 类与 B 类 skill | 薄壳单文件（SKILL.md） |

落地规则：`SKILL.template.md` → 目标 `SKILL.md`：frontmatter 按「键」管理，安装器只覆盖模板定义的 `name` /
`description`，用户新增键保留；正文包进受管区块（区块外为用户内容）。其余条目
（`references/`、`assets/`）保持相对目录结构原样复制，按字节比对，冲突不覆盖。模板为通用形态（不含项目实例内容），项目特定值在执行时现场读项目文档。

## 安装器接口（`scripts/install.mjs`）

确定性安装器（Node 零依赖），相对路径以 skill 激活时注入的 Base directory 为锚。命令：

```bash
node scripts/install.mjs --check --project-root <项目根>              # 只报告，不写盘（默认模式）
node scripts/install.mjs --apply --project-root <项目根>              # 安装缺失项 + 更新无冲突项
node scripts/install.mjs --apply --force --project-root <项目根>     # 覆盖冲突项（含根 AGENTS.md）
```

| 模式              | 动作                                                                                                                             | 是否写盘         |
|-------------------|----------------------------------------------------------------------------------------------------------------------------------|------------------|
| `--check`（默认） | 逐资产报告四态：缺失 / 已存在 / 最新 / 冲突                                                                                      | 否               |
| `--apply`         | 创建缺失项；替换 AGENTS.md / SKILL.md 受管区块（区块外保留）；合并受管 frontmatter 键；其余 Skill 文件一致跳过、冲突跳过并列差异 | 是（仅无冲突项） |
| `--force`         | 需与 `--apply` 联用：覆盖无标记区冲突项（无管理区块的 AGENTS.md / SKILL.md、其余 Skill 文件内容不一致，执行前必须用户确认）      | 是               |

退出码：`0` 全部就绪且无冲突 / `1` 存在待处理项（缺失 / 冲突）/ `2` 参数或路径错误。

`scripts/install.mjs` 的 `--check` 计划是安装前默认动作；只有用户明确要求应用时才使用 `--apply`，冲突覆盖还必须额外显式使用
`--force`。

## 固定目标路径

- 项目宪法：`references/agents-templates/AGENTS.md` → `<项目根>/AGENTS.md`（1 个）。
- Skill 集：`references/skill-templates/<分组>/<name>/` → `<项目根>/.opencode/skills/<name>/`（见「资产二」表，共 16 个：10 个
  A 类 + 5 个 B 类 + 1 个 C 类）。
- 一律项目级：写入目标项目树与项目级 `.opencode/skills/`，不写全局目录。
- 安装器只写上述固定路径，不触碰其他文件。

## 受管区块（AGENTS.md 与 SKILL.md）

根 AGENTS.md 与全部 SKILL.md 共用同一套受管区块机制：`<!-- project-scaffold:begin -->` 与 `<!-- project-scaffold:end -->`
之间是模板正文（安装器管理，升级时整体替换），区块外一律是用户内容（安装器永不触碰）。语义如下：

- 相对路径同构：安装器只管理「资产一」的项目宪法文件，不创建其他 AGENTS.md，不触碰非本资产文件。
- 标记区语义：区内存放模板正文，升级时直接整体替换；区块外内容永远保留。项目专属内容写在区块外。
- 根 `AGENTS.md` 的受管区块即「项目宪法」章节：由模板生成、受保护，AI 不得编辑区块内内容；项目侧的例外或补充写在区块外（AGENTS.md
  的其他章节），用户新增的章节归项目自行维护。
- 目标已存在且含管理区块：按上述语义替换区块，区块外用户内容原样保留。
- 目标已存在但没有管理区块：报告冲突，默认不写；只有显式 `--force` 才整体覆盖。
- AGENTS.md 模板不含项目值槽位：根 `AGENTS.md` 生成「项目宪法」章节，项目专属值写在区块外或 `docs/**`。SKILL 模板面向 AI
  引导，其正文与 `references/`、`assets/` 内的元变量占位（如 `--env <环境名>`、`tools/<name>.mjs`）属正常表达，不在本约束范围内。
- 根 `AGENTS.md` 冲突必须在执行前展示差异并取得用户确认；`--force` 会丢失区块外内容。

### SKILL.md frontmatter

- SKILL.md 的 YAML frontmatter 包不进标记区，按「键」管理：安装器只覆盖模板里定义的键（当前为 `name` / `description`
  ），用户自行新增的键原样保留。
- 模板不携带 `license`、自定义 `metadata` 等 OpenCode 不解释的键；这类键如需保留由用户在项目侧自行添加，安装器不干预。

## 冲突保护

- 绝不静默覆盖用户内容：受管区块外、以及无标记区的文件，安装器默认只报告、不写盘。
- 受管区块内按「我方地盘」处理：AGENTS.md / SKILL.md 的区块内正文与受管 frontmatter 键直接更新为新模板，这是既定语义，不算冲突。
- 其余 Skill 文件按字节比对：缺失 → 安装；内容一致 → 最新，跳过；内容不同 → 冲突（项目侧手工改动），`--apply` 跳过并列差异，
  `--force` 覆盖。
- 无管理区块的 AGENTS.md / SKILL.md：报告冲突，默认不写，必须显式 `--force` 才整体覆盖。
- 冲突处置三选一由用户定：保留项目侧 / 用模板覆盖（`--force`）/ 手工合并；AI 不得替用户选。
- 本 skill 只写固定目标路径；不修改目标项目业务代码与 `docs/**` 业务文档正文；不自动提交 Git。

## Skill 清单

安装到 `.opencode/skills/` 的 16 个 Skill：

1. A 类 · 纯文档（10，管辖见「资产二」表）：`docs-business` / `docs-application-architecture` / `docs-data-architecture` /
   `docs-technology-architecture` / `docs-domain` / `docs-deep-dives` / `docs-research` / `docs-structure` /
   `docs-code-guide` / `docs-changes`。
2. B 类 · 文档 + 资产（5）：`inbound-ops`（L3 Inbound 说明书 + openapi 契约 + 导出执行）、`outbound-ops`（L3 Outbound 说明书 +
   外部服务契约）、`deploy-ops`（L4 部署说明书 + 部署资产 + 部署执行）、`test-ops`（用例卡规范 + 用例 + 台账 + 执行）、
   `tools-ops`（工具 README + Node CLI + 调用）。
3. C · 编排（1）：`align-docs`（对齐 / 漂移 / 初始化 / 旧文档处置）。

`align-docs` 为薄壳单文件（仅 `SKILL.md`）；其余为多文件（`SKILL.md` + `references/` + `assets/`）。

## align-docs 边界

- 文档-代码对齐、漂移处理、文档初始化、旧文档清理与融合，全部归 `align-docs` skill（编排器，按 L0→L1→…→common 调用各 `docs-*`
  skill）。
- 用户需要「对齐文档与代码 / 处理漂移 / 初始化 docs / 同步目录」时直接调 `align-docs`——本 skill 不承载、不路由、不做这些事。
- 边界一句话：本 skill 只「安装资产」，`align-docs` 才「按资产指引维护文档」。

## 验证命令

```bash
# 只报告：逐资产四态（缺失 / 已存在 / 最新 / 冲突）+ 旧布局检测
node scripts/install.mjs --check --project-root <项目根>

# 本 skill 自身合规校验
uvx --from skills-ref agentskills validate ./skills/project-scaffold

# 安装后核对固定路径（应为 1 个 AGENTS.md 与 16 个 skill 目录）
find <项目根> -name AGENTS.md | sort
find <项目根>/.opencode/skills -maxdepth 1 -mindepth 1 -type d | sort

# 生效：重启 opencode 会话（skill 列表是启动快照，安装后必须重启）
```

## 维护

- 资产 SSOT：两类模板都在本 skill 的 `references/` 下——改项目宪法改 `references/agents-templates/AGENTS.md`，改 Skill 改
  `references/skill-templates/<分组>/<name>/`。
- 新增/删除 A 类 skill：在 `references/skill-templates/docs/` 下增删 `docs-<name>/`，同步更新本文件「资产二」表、
  `scripts/install-core.mjs` 的 `SKILL_GROUPS` 与根 AGENTS.md 的 Skill 路由表；目标项目重跑 `--apply`。
- 新增/删除 B 类 skill：在 `references/skill-templates/ops/` 下增删 `<域>-ops/`，同步同上。
- 新增/删除 C 类 skill：在 `references/skill-templates/` 根增删目录，同步同上。
- 修改模板后：`--apply` 会刷新 AGENTS.md / SKILL.md 的受管区块与受管 frontmatter 键（区块外用户内容保留）；其余 Skill
  文件内容变化按冲突保护处理，需 `--force` 覆盖。
- 引用规范：本 skill 内部引用一律用相对 Markdown 链接（`references/agents-templates/...`、`references/skill-templates/...`
  ），禁 `@path`、禁绝对路径、禁 `./xxx` 依赖 cwd。
- AGENTS.md 模板只放原则性规范，不引入项目值槽位；命名/路径模式用 `{变量}` 记号。SKILL 模板面向 AI 引导，正文与
  `references/`、`assets/` 内的元变量占位（`--env <环境名>`、`tools/<name>.mjs` 等）保持不变。
- 改完本 skill 后：跑 `agentskills validate`；同步已安装副本（`npx skills update -g`）后重启 opencode 生效。

## 错误处理

- `scripts/install.mjs` 不存在：按本文件表格手工安装（见「安装器接口」末段），不臆造脚本参数。
- 目标路径冲突（AGENTS.md 已存在 / Skill 文件不同）：默认不覆盖，列出差异让用户定（保留 / `--force` 覆盖 / 手工合并），禁止静默覆盖。
- 根 AGENTS.md 已存在但无管理区块：必须显式处理——先展示模板与现状差异，等用户决定；含管理区块时 `--apply` 只刷新区块，区块外不动。
- 目标项目无 `.opencode/` 目录：`--apply` 创建 `.opencode/skills/` 后安装全部 Skill。
- 模板缺 `name` 或目录名与 `name` 不符：校验失败，先修模板再安装。

## 硬性要求

- 单一功能：安装两类资产（项目宪法 + Skill 集），不生成业务文档。
- 固定路径：项目宪法落项目根 `AGENTS.md`；Skill 落 `.opencode/skills/<name>/`（项目级，不写全局）。
- 冲突保护：区块外与无标记区绝不静默覆盖；受管区块内按我方地盘更新。
- 项目级生效：安装到目标项目根 AGENTS.md 与 `.opencode/skills/`；OpenCode 需重启会话生效。
- 手动触发：仅用户显式调用时执行，不自动触发。
- 不自动提交 Git；不修改目标项目业务代码与 `docs/**` 业务文档正文。
