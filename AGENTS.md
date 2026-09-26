# Agent Skills 仓库指令

本仓库维护一组可复用的 Agent Skill。当前可执行入口是各 Skill 目录、验证命令，以及 `project-scaffold` 的 Node
安装器；仓库根目录没有统一的构建、测试或包管理入口。

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

- A 类 · 纯文档（10，前缀 `docs-`）：产物只有面向人读的说明书，无资产、无状态机、无门禁。`docs-business` /
  `docs-application-architecture` / `docs-data-architecture` / `docs-technology-architecture` / `docs-domain` /
  `docs-deep-dives` / `docs-research` / `docs-structure` / `docs-code-guide` / `docs-changes`；
- B 类 · 文档 + 资产（5，后缀 `-ops`）：一个能力域一个 skill，同时管辖说明书、资产与该域的执行动作。`inbound-ops` /
  `outbound-ops` / `deploy-ops` / `test-ops` / `tools-ops`；
- C · 编排（1）：`align-docs`，只调度 A / B 类，不生产任何层次产物。

旧的 `skills/doc-arch-rules/`、`.omo/rules/docs/` 生成器和 `meta.json` 已退休，不要恢复或重新引用它们。`project-scaffold` 的
`--migrate` 只用于检测目标项目中的旧布局。

## 当前初始化入口

`project-scaffold` 目前仍是 Skill，不是 npm 插件。执行安装器时必须从仓库根传入目标项目根：

```bash
# 只读检查，不写文件
node skills/project-scaffold/scripts/install.mjs --check --project-root <path>

# 安装缺失项、更新 AGENTS 管理区块
node skills/project-scaffold/scripts/install.mjs --apply --project-root <path>

# 显式覆盖冲突项
node skills/project-scaffold/scripts/install.mjs --apply --force --project-root <path>

# 检测旧布局；只有 --apply 才删除目标项目的旧 .omo/rules/docs
node skills/project-scaffold/scripts/install.mjs --migrate --project-root <path>
node skills/project-scaffold/scripts/install.mjs --migrate --apply --project-root <path>
```

安装器行为：

- `references/agents-templates/AGENTS.md` 安装到目标项目根 `AGENTS.md`（「项目宪法」章节），当前 1 个文件；
- `references/skill-templates/<分组>/<name>/` 整目录复制到目标项目 `.opencode/skills/<name>/`；
- `SKILL.template.md` 在目标项目安装时改名为 `SKILL.md`；
- AGENTS 管理区块标记为 `<!-- project-scaffold:begin -->` 与 `<!-- project-scaffold:end -->`；
- 已有管理区块时只替换区块，区块外内容保留；
- 无管理区块或 Skill 内容冲突时默认不覆盖，只有 `--force` 才覆盖；
- 安装器只写固定资产路径，不写业务文档正文、业务代码或 Git 状态。

## `project-init` 产品目标

目标是把这套能力演进为类似 OpenCode 原生 `/init` 的项目初始化入口：

```text
/project-init（或最终确定的等价命令）
→ 分析项目
→ 生成项目宪法（根 AGENTS.md）
→ 安装 Skill 集（A 类纯文档 + B 类文档资产 + C 类编排）
→ 处理冲突、旧布局和迁移
```

设计约束：

- 目标是“项目宪法 + A 类纯文档 Skill + B 类文档资产 Skill + C 类编排器”的完整项目基础架构，不只是文档模板；
- 如果改成 OpenCode 插件，参考 `oh-my-openagent` 的 `init-deep`：插件通过 `config` hook 注册内置 Skill/Command，Agent
  展开指令后分析项目并生成项目宪法；
- 当前尚未实现 `/project-init` 或插件入口；不要把设计目标写成当前可用命令；
- 插件化时保留 `install-core.mjs` 作为确定性文件操作核心，增加打包/Command/工具外壳，不要重写模板和冲突语义；
- 目标是让 Agent 根据项目事实生成/更新项目宪法与各文档 skill 管辖的文档；不要把固定模板误当成最终项目事实；
- 命令名、是否覆盖 `/init`、是否兼容 OMO 的 `/init-deep`，在实现前必须明确并做冲突检测。

## 修改 Skill 的硬约束

### 目录与引用

- 引用使用相对 Markdown 链接；禁止 `@path`、硬编码绝对路径和依赖当前工作目录的 `./`；
- Skill 激活后以 OpenCode 注入的 Base directory 为锚点，调用 `scripts/` 和 `references/` 不自行探测安装路径；
- 模板正文中的相对链接按复制到目标项目后的文件位置校验；Skill 自身文档按 Skill 目录位置校验；
- Skill 目录只保留 `SKILL.md` 以及必要的 `references/`、`assets/`、`scripts/`；不把临时产物、截图、构建输出或真实凭据写入仓库。

### Frontmatter

- `name` 必填，使用小写 kebab-case，且必须与目录名一致；
- `description` 必填，包含功能和触发词，长度小于 1024 字符；
- `license`、`compatibility`、`metadata`、`allowed-tools` 是可选字段；`allowed-tools` 在 OpenCode 不负责权限控制。

格式细节见 [skill-creator 的格式规范](skills/skill-creator/references/skill-md-format.md)。

### 模板内容

- `project-scaffold/references/agents-templates/` 与 `references/skill-templates/` 中的 Markdown 不使用加粗正文或 emoji；
- 保持模板为通用资产，不写真实项目名、密码、Token、主机或环境专属值；
- `SKILL.md` 控制在 500 行以内，核心工作流放在正文，细节下沉到 `references/`；
- 所有文档、注释和面向用户的说明使用中文，技术术语、命令和路径保留原文。

## 验证命令

修改 Skill 后至少运行对应验证：

```bash
# 单个 Skill 合规校验
uvx --from skills-ref agentskills validate ./skills/<skill-name>

# project-scaffold 安装器测试（零依赖，测试只使用系统临时目录）
node --test skills/project-scaffold/scripts/install.test.mjs

# Node 语法检查
node --check skills/project-scaffold/scripts/install-core.mjs
node --check skills/project-scaffold/scripts/install-cli.mjs
node --check skills/project-scaffold/scripts/install.mjs

# 逐个校验所有 Skill
for d in skills/*/; do uvx --from skills-ref agentskills validate "$d" || exit 1; done
```

安装器测试覆盖首次安装、幂等、AGENTS 管理区块、Skill 冲突、敏感信息拒绝和旧布局迁移。临时项目必须使用 `/tmp` 或
`mktemp -d`，测试后清理。

## 校验与生效

- 改动已有 Skill 前先记录一次 `agentskills validate` 基线，以区分既有问题和本次引入的问题；
- 本仓库是 Skill 源文件 SSOT；安装到 Agent、更新本机副本和提交 Git 由用户显式执行，AI 不代装、不自动 commit/push；
- 用户同步已安装副本后需要重启 OpenCode 会话，Skill 列表和激活内容才会刷新。

## 维护原则

- 不修改 `improve/`、`demo/`、`.omo/`、`.codegraph/` 等非 Skill 目录；
- 改动模板时同步更新对应 `SKILL.md` 的文件清单、链接和使用说明；
- 发现文档与脚本冲突时，以可执行脚本、配置和测试为准，再更新文档；
- 新增/删除 Skill 模板时同时更新 `references/skill-templates/<分组>/`、`install-core.mjs` 的 `SKILL_GROUPS`、安装器测试与
  `SKILL.md` 资产表；新增/删除 A 类 skill 还要同步根 `AGENTS.md` 的 Skill 路由表；
- 任何会改变项目文件的行为都必须先有明确的 check/apply/force/migrate 边界，不能静默覆盖。
