---
name: project-scaffold
description: >
  项目文档体系引导器（引导器 skill）——把本仓库持有的两类模板资产安装到目标项目的固定路径：
  ① 项目宪法（references/agents-templates/AGENTS.md，并入项目根 AGENTS.md 的受管区块）；
  ② 全部 Skill（references/skill-templates/**，复制到项目级 .opencode/skills/：A 类纯文档 docs-* 8 个 + B 类文档资产 *-ops 5 个 + C 类项目级 align-docs / code-guide 2 个）。
  执行方式为 AI 读取项目现状与文件写入，无安装脚本、无命令行参数：AGENTS.md 由 AI 读入现有文件后把模板正文作为文件开头章节并入受管区块（无区块时插到开头，现有章节整体顺延在后），skill 目录由 AI 整目录复制覆盖（归本 skill 所有、可重入）。
  本 skill 只安装项目宪法与 Skill 资产，不生成业务文档（docs/** 正文），不负责文档-代码对齐/文档初始化/目录同步（归 `align-docs` skill）；漂移由 `docs-changes` 与 `align-docs` 发起、`docs-draft` 记录与修复。仅用户手动调用时触发，不自动触发。
---

# project-scaffold — 项目文档体系引导器

## 定位

引导器 skill：把本仓库持有的两类模板资产安装到目标项目的固定路径

本 skill 全部由 AI 执行：读取项目现状、按规则写入文件。不提供安装脚本，也没有任何命令行参数。

| 资产     | 来源（SSOT）                                | 落位（目标项目）                  | 处理方式                          |
|----------|---------------------------------------------|-----------------------------------|-----------------------------------|
| 项目宪法 | `references/agents-templates/AGENTS.md`     | 项目根 `AGENTS.md`                | AI 读入后置于文件开头（受管区块） |
| Skill 集 | `references/skill-templates/<分组>/<name>/` | 项目根 `.opencode/skills/<name>/` | AI 整目录复制覆盖                 |

不承载（完全独立）：

- 不生成 `docs/**` 业务文档正文（`BUSINESS.md` / `DEPLOYMENT.md` / `STRUCTURE.md` 等）——业务文档由目标项目的 AI 按安装后的
  `docs-*` skill 生成/维护。
- 文档-代码对齐、文档初始化、旧文档清理与融合归 `align-docs` skill（编排器）；漂移由 `docs-changes` 与 `align-docs` 发起、
  `docs-draft` 记录与修复；需要时直接调
  `align-docs`，本 skill
  不承载、不路由。

## 何时使用（仅手动触发）

本 skill 无关键字分诊，仅用户显式调用时执行。每次调用都走同一套固定流程（读取现状 → 写入 → 报告），不区分首次与增量、
可重复执行：并入根 `AGENTS.md` 受管区块 + 整目录覆盖全部 Skill。具体步骤见「执行流程」。

## 两类模板资产（SSOT）

### 资产一：项目宪法（`references/agents-templates/AGENTS.md`）

单文件，并入项目根 `AGENTS.md`，即「项目宪法」章节：文档体系与目录架构 + 跨目录通用规范 + 三类 Skill 路由 + 通用纪律。项目宪法必须位于
`AGENTS.md` 的最前面：宪法章节排第一，项目自有章节（含例外与补充）一律顺延在后；文件原本已按章节编号时（如「第一章」），整体后移保持连续
（原「第一章」→「第二章」）。以受管区块标识包裹，落位与顺延规则见「执行流程 · 步骤二」。

### 资产二：Skill 集（`references/skill-templates/<分组>/<name>/`）

落位到目标项目根的 `.opencode/skills/<name>/`（项目级路径，不写全局目录）；`SKILL.template.md` → `SKILL.md`，其余条目 （
`references/`、`assets/`）保持相对目录结构原样复制。

### A 类 · 纯文档（`docs-*`，共 8 个）

产物只有面向人读的说明书，没有资产、状态机与门禁。每个目录含两份资产：`SKILL.template.md`（统一章节骨架：定位与管辖文档 /
读取 / 生成与更新 / 联动 / 完成判定 / 边界；编排器与 ops 在此骨架上追加自身特有段，如分诊 / 执行 / 产物基线）与
`assets/` 下的目标文档骨架模板（每节的生成提示以 `<!-- 生成提示:begin -->` 与 `<!-- 生成提示:end -->`
包裹；一个 skill 出多种产物时按产物拆成多个模板文件，如 `docs-domain` 的 `DOMAIN-MAP.template.md` +
`DOMAIN.template.md`、`inbound-ops` 的 `INBOUND.template.md` + `OPENAPI.template.md`、`outbound-ops` 的
`OUTBOUND.template.md` + `CONTRACT.template.md`）；生成文档时先读模板再写，骨架内容只放模板、不写进
SKILL，写入产物时连同这对标记删除。

需要在用户显式调起前不出现在模型可用列表的 skill，frontmatter 用 `metadata.opencode/autoinvoke: false` 声明：AI
不自动调用，仍可由用户按 ID 显式载入。

| Skill                                                                                    | 管辖文档                |
|------------------------------------------------------------------------------------------|-------------------------|
| [docs-business](references/skill-templates/docs/docs-business/SKILL.template.md)         | docs/L1/BUSINESS.md     |
| [docs-architecture](references/skill-templates/docs/docs-architecture/SKILL.template.md) | docs/L2/ARCHITECTURE.md |
| [docs-data-model](references/skill-templates/docs/docs-data-model/SKILL.template.md)     | docs/L2/DATA-MODEL.md   |
| [docs-domain](references/skill-templates/docs/docs-domain/SKILL.template.md)             | docs/L2/domain/         |
| [docs-structure](references/skill-templates/docs/docs-structure/SKILL.template.md)       | docs/L3/STRUCTURE.md    |
| [docs-changes](references/skill-templates/docs/docs-changes/SKILL.template.md)           | docs/changes/           |
| [docs-draft](references/skill-templates/docs/docs-draft/SKILL.template.md)               | docs/drift/             |
| [docs-topics](references/skill-templates/docs/docs-topics/SKILL.template.md)             | docs/topics/            |

### B 类 · 文档 + 资产（`*-ops`，共 5 个）

一个能力域一个 skill，同时管辖该域的说明书、资产与执行动作，并在自己的完成判定里保证三者一致。

| Skill 模板                                                                    | 能力域               | 说明书                                       | 资产                                | 形态                                    |
|-------------------------------------------------------------------------------|----------------------|----------------------------------------------|-------------------------------------|-----------------------------------------|
| [inbound-ops](references/skill-templates/ops/inbound-ops/SKILL.template.md)   | L3 Inbound 契约      | docs/contracts/inbound/                      | —                                   | 多文件（SKILL + assets/）               |
| [outbound-ops](references/skill-templates/ops/outbound-ops/SKILL.template.md) | L3 Outbound 外部集成 | docs/contracts/outbound/                     | —                                   | 多文件（SKILL + assets/）               |
| [deploy-ops](references/skill-templates/ops/deploy-ops/SKILL.template.md)     | L3 部署              | docs/deployment/DEPLOYMENT.md                | docs/deployment/                    | 多文件（SKILL + assets/）               |
| [test-ops](references/skill-templates/ops/test-ops/SKILL.template.md)         | 测试                 | docs/test/test-cases/ + docs/test/do-drafts/ | docs/test/test-records/（执行台账） | 多文件（SKILL + references/ + assets/） |
| [tools-ops](references/skill-templates/ops/tools-ops/SKILL.template.md)       | 系统访问通道         | docs/tools/tools/<类>/AGENTS.md              | docs/tools/（Node CLI）             | 多文件（SKILL + assets/）               |

### C · 项目级（共 2 个）

面向整个项目、不按链内层次划分的 skill。

| Skill 模板                                                                    | 职责                                                                                              | 形态                      |
|-------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|---------------------------|
| [align-docs](references/skill-templates/project/align-docs/SKILL.template.md) | 文档编排器：对齐 / 解决漂移 / 文档初始化 / 旧文档清理与融合，按 L1→L2→L3 调用各 A 类与 B 类 skill | 薄壳单文件（SKILL.md）    |
| [code-guide](references/skill-templates/project/code-guide/SKILL.template.md) | 给各子项目目录写 `AGENTS.md`（概览 / 代码地图 / 约定 / 红线）                                     | 多文件（SKILL + assets/） |

落地规则：`SKILL.template.md` → 目标 `SKILL.md`（仅改名），其余条目保持相对目录结构原样复制；skill 目录归本 skill 所有，AI
整目录覆盖——已存在也直接覆盖，可重入。模板为通用形态（不含项目实例内容），项目特定值在执行时现场读项目文档；项目专属内容写
`docs/**`，不要改安装后的 skill。

## 执行流程

以 skill 激活时注入的 Base directory 为锚访问 `references/`；不探测安装路径、不依赖当前工作目录。

### 步骤一：读取现状

- 读取项目根 `AGENTS.md`（可能不存在）。
- 查看项目 `.opencode/skills/` 下已有的 skill 目录（可能不存在）。

### 步骤二：并入项目宪法（根 `AGENTS.md`）

项目宪法是 `AGENTS.md` 的开头章节：受管区块必须位于文件最前面，其前不放任何项目内容，项目自有章节一律排在宪法之后。受管区块标记为
`<!-- project-scaffold:begin -->` 与 `<!-- project-scaffold:end -->`，两者之间是模板正文，区块外是项目内容。

1. 读模板 `references/agents-templates/AGENTS.md` 全文，作为受管区块正文。
2. 目标 `AGENTS.md` 不存在：新建文件，内容为「受管区块（模板正文）」。
3. 目标存在且含受管区块：把区块内正文替换为模板正文；区块不在文件开头时（如旧版本追加在末尾），把整块移到开头，其余内容按原顺序接在其后。
4. 目标存在但无受管区块：把受管区块插到文件开头，现有内容整体移到区块之后。
5. 章节编号顺延：现有章节若带编号（如「第一章」或 `# 1`），宪法占开头章节，现有章节整体顺延以保持连续（例：原「第一章」→「第二章」）；只改编号，不改标题与正文，无编号的标题不动。
6. 区块外内容除整体位移与编号顺延外不改写；项目侧的例外或补充写在宪法章节之后。

### 步骤三：覆盖 Skill 目录

对「资产二」表中每个 `references/skill-templates/<分组>/<name>/`：

1. 目标 `<项目根>/.opencode/skills/<name>/` 已存在时，先删除整个目标 skill 目录（清除模板已删除文件的残留），再整目录复制。
2. 整目录复制模板内容（含 `references/`、`assets/` 与隐藏文件，保持相对目录结构）。
3. `SKILL.template.md` 落位为 `SKILL.md`（仅改名，不改写正文）。
4. 结果必须与模板目录一一对应：不复制 `SKILL.template.md` 原名文件，不保留模板专有文件名。可重入。

## Skill 清单

安装到目标项目根 `.opencode/skills/` 的 15 个 Skill：

1. A 类 · 纯文档（8，管辖见「资产二」表）：`docs-business` / `docs-architecture` / `docs-data-model` /
   `docs-domain` / `docs-structure` / `docs-changes` / `docs-draft` /
   `docs-topics`。
2. B 类 · 文档 + 资产（5）：`inbound-ops`（L3 Inbound 接口 → 代码映射）、`outbound-ops`（L3 Outbound 接口 → client 代码映射）、
   `deploy-ops`（L3 部署说明书 + 部署资产 + 部署执行）、`test-ops`（写卡规范 + 正式用例卡 + DoD 草稿 + 执行台账）、
   `tools-ops`（工具集 AGENTS.md + Node CLI + 调用）。
3. C · 项目级（2）：`align-docs`（对齐 / 初始化 / 旧文档处置）、`code-guide`（给各子项目目录写 `AGENTS.md`）。
