# Agent Skills 仓库指令

本仓库维护一组可复用的 Agent Skill。当前可执行入口是各 Skill 目录与验证命令；仓库根目录没有统一的构建、测试或包管理入口。

## 当前结构

```text
skills/
├── c4-container-diagram/       # D2/C4 容器图
├── gitee-comments/             # Gitee 评审评论
├── project-scaffold/           # 项目脚手架（项目宪法 + 三类 Skill 模板）
├── remote-shell/               # 远程命令执行
├── score-prompt/               # Prompt/文档评分
└── skill-creator/              # 创建和维护 Skill
```

`skills/project-scaffold/references/skill-templates/` 是安装目标模板，全部不是本仓库的活动 Skill，按产物形态分三类，目录布局与分类一一对应（A
类在 `docs/`、B 类在 `ops/`、C 类在根）：

- A 类 · 纯文档（9，前缀 `docs-`）：产物只有面向人读的说明书，无资产、无状态机、无门禁。其中 7 个是链内层次文档（分属 L1 / L2 /
  L3），2 个是链外过程态（`docs/changes/` 变更单篇、`docs/drift/` 漂移清单）。`docs-business` /
  `docs-application-architecture` / `docs-data-architecture` / `docs-technology-architecture` / `docs-domain` /
  `docs-structure` / `docs-code-guide` / `docs-changes` / `docs-draft`；
- B 类 · 文档 + 资产（5，后缀 `-ops`）：一个能力域一个 skill，同时管辖说明书、资产与该域的执行动作；全部链外。`inbound-ops` /
  `outbound-ops` / `deploy-ops` / `test-ops` / `tools-ops`；
- C · 编排（1）：`align-docs`，只调度 A / B 类，不生产任何文档正文或资产，连过程态清单也交 `docs-draft` 落盘。

旧的 `skills/doc-arch-rules/` 与其 `meta.json` 已退休，不要恢复或重新引用它们。过程态产物一律落在 `docs/` 内：变更在
`docs/changes/`、漂移清单在 `docs/drift/`、DoD 草稿在 `docs/test/do-drafts/`；project-scaffold 不再做旧布局迁移检测。

## 当前初始化入口

`project-scaffold` 是纯指令 Skill，不是 npm 插件，也没有安装脚本或命令行参数。用户手动调用该 Skill，由 AI 读取项目现状并写文件：

- `references/agents-templates/AGENTS.md` 并入目标项目根 `AGENTS.md`，即「项目宪法」章节（当前 1 个文件）；
- `references/skill-templates/<分组>/<name>/` 整目录复制到目标项目 `.opencode/skills/<name>/`；
- `SKILL.template.md` 在目标项目落位时改名为 `SKILL.md`；
- AGENTS 受管区块标记为 `<!-- project-scaffold:begin -->` 与 `<!-- project-scaffold:end -->`；
- 已有受管区块时只替换区块内正文，区块外内容保留；无区块时在末尾追加区块，不覆盖既有内容；
- Skill 目录归该 Skill 所有、整目录覆盖（可重入）；
- 只写固定资产路径，不写业务文档正文、业务代码或 Git 状态。

## `project-init` 产品目标

目标是把这套能力演进为类似 OpenCode 原生 `/init` 的项目初始化入口：

```text
/project-init（或最终确定的等价命令）
→ 分析项目
→ 生成项目宪法（根 AGENTS.md）
→ 安装 Skill 集（A 类纯文档 + B 类文档资产 + C 类编排）
→ 并入项目宪法受管区块、覆盖 Skill 目录
```

设计约束：

- 目标是“项目宪法 + A 类纯文档 Skill + B 类文档资产 Skill + C 类编排器”的完整项目基础架构，不只是文档模板；
- 如果改成 OpenCode 插件，用 `config` hook 注册内置 Skill/Command，Agent 展开指令后分析项目并生成项目宪法；
- 当前尚未实现 `/project-init` 或插件入口；不要把设计目标写成当前可用命令；
- 目标是让 Agent 根据项目事实生成/更新项目宪法与各文档 skill 管辖的文档；不要把固定模板误当成最终项目事实；
- 命令名、是否覆盖 `/init`、是否与其他初始化命令冲突，在实现前必须明确并做冲突检测。

## 修改 Skill 的硬约束

### 目录与引用

- 引用使用相对 Markdown 链接；禁止 `@path`、硬编码绝对路径和依赖当前工作目录的 `./`；
- Skill 激活后以 OpenCode 注入的 Base directory 为锚点，调用 `scripts/` 和 `references/` 不自行探测安装路径；
- 模板正文中的相对链接按复制到目标项目后的文件位置校验；Skill 自身文档按 Skill 目录位置校验；
- Skill 目录只保留 `SKILL.md` 以及必要的 `references/`、`assets/`、`scripts/`；不把临时产物、截图或构建输出写入仓库。

### Frontmatter

- `name` 必填，使用小写 kebab-case，且必须与目录名一致；
- `description` 必填，包含功能和触发词，长度小于 1024 字符；
- `license`、`compatibility`、`metadata`、`allowed-tools` 是可选字段；`allowed-tools` 在 OpenCode 不负责权限控制。

格式细节见 [skill-creator 的格式规范](skills/skill-creator/references/skill-md-format.md)。

### 模板内容

- `project-scaffold/references/agents-templates/` 与 `references/skill-templates/` 中的 Markdown 不使用加粗正文或 emoji；
- 保持模板为通用资产，不写真实项目名、主机或环境专属值；
- `SKILL.md` 控制在 500 行以内，核心工作流放在正文，细节下沉到 `references/`；
- 所有文档、注释和面向用户的说明使用中文，技术术语、命令和路径保留原文。

## 验证命令

修改 Skill 后至少运行对应验证：

```bash
# 单个 Skill 合规校验
uvx --from skills-ref agentskills validate ./skills/<skill-name>

# 逐个校验所有 Skill
for d in skills/*/; do uvx --from skills-ref agentskills validate "$d" || exit 1; done
```

## 校验与生效

- 改动已有 Skill 前先记录一次 `agentskills validate` 基线，以区分既有问题和本次引入的问题；
- 本仓库是 Skill 源文件 SSOT；安装到 Agent、更新本机副本和提交 Git 由用户显式执行，AI 不代装、不自动 commit/push；
- 用户同步已安装副本后需要重启 OpenCode 会话，Skill 列表和激活内容才会刷新。

## 维护原则

- 不修改 `improve/`、`demo/`、`.codegraph/` 等非 Skill 目录；
- 改动模板时同步更新对应 `SKILL.md` 的文件清单、链接和使用说明；
- 发现文档与脚本冲突时，以可执行脚本、配置和测试为准，再更新文档；
- 新增/删除 Skill 模板时同时更新 `references/skill-templates/<分组>/` 与 `SKILL.md` 资产表；新增/删除 A 类 skill 还要同步根
  `AGENTS.md` 的 Skill 路由表；
- 任何会改变项目文件的行为都必须边界清晰：`.opencode/skills/**` 归 project-scaffold 所有（整目录覆盖、可重入），根 AGENTS.md
  只在受管区块内写入、区块外绝不触碰、无区块时追加。
