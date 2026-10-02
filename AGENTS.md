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

`skills/project-scaffold/references/skill-templates/` 是安装目标模板，全部不是本仓库的活动 Skill，按产物形态分三类，目录布局与分类一一对应（
`docs-*`
在 `docs/`、`-ops` 在 `ops/`、`align-docs` 与 `code-guide` 在 `project/`）：

- A 类 · 纯文档（8，前缀 `docs-`）：产物只有面向人读的说明书，无资产、无状态机、无门禁。其中 5 个是链内层次文档（分属 L1 / L2 /
  L3），3 个链外：2 个过程态（`docs/changes/` 变更单篇、`docs/drift/` 漂移清单），1 个无资产独立域（`docs/topics/` 专项）：
  `docs-business` / `docs-architecture` / `docs-data-model` /
  `docs-domain` / `docs-structure` / `docs-changes` /
  `docs-draft` / `docs-topics`；
- B 类 · 文档 + 资产（5，后缀 `-ops`）：一个能力域一个 skill，同时管辖说明书、资产与该域的执行动作；全部链外。`inbound-ops` /
  `outbound-ops` / `deploy-ops` / `test-ops` / `tools-ops`；
- C · 项目级（2）：面向整个项目、不按链内层次划分。`align-docs`（跨文档编排：只调度 A / B 类，不生产任何文档正文或资产，连过程态清单也交
  `docs-draft` 落盘）与 `code-guide`（给各子项目目录写 `AGENTS.md`）。

旧的 `skills/doc-arch-rules/` 与其 `meta.json` 已退休，不要恢复或重新引用它们。过程态产物一律落在 `docs/` 内：变更在
`docs/changes/`、漂移清单在 `docs/drift/`、DoD 草稿在 `docs/test/do-drafts/`；project-scaffold 不再做旧布局迁移检测。

## 当前初始化入口

`project-scaffold` 是纯指令 Skill，不是 npm 插件，也没有安装脚本或命令行参数。用户手动调用该 Skill，由 AI 读取项目现状并写文件：

- `references/agents-templates/AGENTS.md` 并入目标项目根 `AGENTS.md`，即「项目宪法」章节（当前 1 个文件），且必须位于该文件最前面；
- `references/skill-templates/<分组>/<name>/` 整目录复制到目标项目 `.opencode/skills/<name>/`；
- `SKILL.template.md` 在目标项目落位时改名为 `SKILL.md`；
- AGENTS 受管区块标记为 `<!-- project-scaffold:begin -->` 与 `<!-- project-scaffold:end -->`；
- 受管区块始终置于文件开头；已有区块时替换区块内正文并把区块移到开头，无区块时插到开头，现有章节整体顺延在后并保持编号连续（如原「第一章」→「第二章」）；
- Skill 目录归该 Skill 所有、整目录覆盖（可重入）；
- 只写固定资产路径，不写业务文档正文、业务代码或 Git 状态。

## `project-init` 产品目标

目标是把这套能力演进为类似 OpenCode 原生 `/init` 的项目初始化入口：

```text
/project-init（或最终确定的等价命令）
→ 分析项目
→ 生成项目宪法（根 AGENTS.md）
→ 安装 Skill 集（A 类纯文档 + B 类文档资产 + C 类项目级）
→ 并入项目宪法受管区块、覆盖 Skill 目录
```

设计约束：

- 目标是“项目宪法 + A 类纯文档 Skill + B 类文档资产 Skill + C 类项目级 Skill”的完整项目基础架构，不只是文档模板；
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
- 模板每节的生成提示用 `<!-- 生成提示:begin -->` 与 `<!-- 生成提示:end -->` 包裹，生成产物时连同标记一起删除；
- 模板只放骨架与生成提示：表格只写表头、值用 `{}` / `<>` 占位；退出码表、接口行、环境参数行、工具清单这类具体内容由生成时按项目实情填，不预填；
- `SKILL.md` 控制在 500 行以内，核心工作流放在正文；方法类细节可下沉到 `references/`。
- 不预制项目相关的东西（导出命令、产物结构、CI、语言框架、资产集、可执行脚本样例等）——这些由生成产物（如接口文档
  ）按项目实情承载；skill 只留方法、骨架与判据，不预置 `references/` 或 `assets/` 样例。
- 所有文档、注释和面向用户的说明使用中文，技术术语、命令和路径保留原文。

### 入口分诊式 Skill 的章节组织

入口先分诊的 Skill（一进来就按触发分流到不同分支，如 `inbound-ops` / `outbound-ops` 的形态分诊、`deploy-ops` 的
执行分诊）统一按下面组织章节：

- 标题下一句话说明它是该域唯一入口、一进来先看分诊，紧接着就是「分诊」表（列 `分诊 / 触发 / 进入章节`
  ）；分诊必须在文档前部，不能藏在中后段（如「执行」节里）。
- 分诊按大功能分（如 `部署` / `资产` / `调用`），同一大功能下的细分情况（如引导 / 导出 / 机检）不单列分诊行，写进该分支内（
  `####` 子节或流程说明）。每个分诊分支对应一个自含章节（`## §N 名称`），章节内写清该分支要做什么 +
  完成判据；同一分支的行为不散落到「生成与更新」「完成判定」「边界」等多节。
- 每个分支自含章节内按序写：`### 读取`（该分支要读什么）、`### 步骤`（做什么 + 完成判据）、`### 联动`、`### 边界`
  。各分支各写各的，跨分支重复照写；某分支没有该小节就只留标题、内容为空。
- 顶层只保留 `## 分诊`；不另设顶层「读取」「联动」「边界」章节。文件清单与模板映射这类「产物与骨架」不单独成节——指针写进对应分支的
  `### 读取`；skill 的范围 / 自持写进开头一小段。确有跨分支共用的说明性参考才保留单独小节。
- 同一产物按分支有两种内容时，各形态各备一份模板（不把两套章节塞进同一份骨架），并在产物开头留一节声明当前形态。
- 分支可切换时（如 CLI 导出 ↔ AI 读代码），切换就是分诊里的正常一条：删除旧形态产物、按新形态走对应分支重新生成即可，不写双向映射细则。
- 反例：在同一节里逐条用「A 形态：…；B 形态：…」交织；把完成判定做成一张按形态分组的大表；把联动 /
  边界合成一个全局大节；文档前部先铺定位与生成流程、把分诊放到后段的「执行」节。

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
  只在受管区块内写入；区块置于文件开头，区块外内容仅做整体位移与必要的章节编号顺延。
