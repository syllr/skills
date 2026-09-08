# PROJECT KNOWLEDGE BASE

Generated: 2026-08-29
Role: 创建与优化 Agent Skills 的仓库（vercel-labs/skills 生态）。本项目只负责 skill 的开发/迭代/格式校验；将 skill 安装到 opencode 等 Agent 由用户自行执行，AI 不代装。

## OVERVIEW

仓库管理一组自包含的 Agent Skills（每个 skill = 一个目录，含 `SKILL.md` + 可选 `references/`/`assets/`/`scripts/`）。核心关注点：skill 内部资源的引用规范（相对路径 / Markdown 链接，禁止 `@path`）与格式合规（agentskills.io 规范）。语言：中文文档。

职责边界：本项目只做「创建 / 优化 / 校验」skill 三件事；安装到 Agent（如 `npx skills add`）由用户自行执行，不属于本项目职责，AI 不得代为安装。

## STRUCTURE

```
skills/
├── c4-container-diagram/ # 画 C4 Container Diagram skill：D2 实现 + references/（20 官方文档 + diagram-review 自研 + README 清单）
├── doc-arch-rules/   # 文档架构规范 + omo rule 生成：references/（1 宪法源 + 21 文档模板[含 integration-contracts 目录 INDEX 模板；deep-dives/research 索引由主模板「索引基准」节承载] + assembly/diagram-spec/globs 规范；rule 由模板 generation 元数据生成）
├── gitee-comments/  # Gitee 提交评审评论 skill（单 SKILL.md）
├── remote-shell/    # SSH 远程执行 skill（单 SKILL.md）
├── score-prompt/    # prompt 质量评分 skill（单 SKILL.md）
└── skill-creator/   # 创建新 skill 的 skill：SKILL.md + references/（含 guide.md）+ assets/templates/
improve/             # 研究笔记（非 skill，勿动）
demo/                # doc-arch-rules 演示样例（非 skill，与 .omo/demo 配套）
README.md            # 面向用户的安装/技能表
```

## WHERE TO LOOK

| 任务                         | 位置                                      | 说明                                                                                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 查看全部 skill               | `skills/`                                 | 每个子目录一个 skill                                                                                                                                                                                                                 |
| 新 skill 的模板与格式规范    | `skills/skill-creator/references/`        | 含 guide / path-resolution / skill-md-format / directory-structure / script-language-guide                                                                                                                                           |
| 官方文档本地化范例           | `skills/c4-container-diagram/references/` | 20 个官方文档页 + 自研 diagram-review.md + README 清单（共 22 个 .md）                                                                                                                                                               |
| 文档架构模板 + omo rule 生成 | `skills/doc-arch-rules/references/`       | 1 个宪法源（CONSTITUTION.md）+ 21 个文档模板（templates/ 按 L0-L4+common 分层，含 integration-contracts 目录 INDEX 模板，deep-dives/research 索引由 DEEP-DIVE/RESEARCH 主模板「索引基准」节承载；rule 由模板 generation 元数据生成） |
| 创建新 skill                 | `npx skills init skills/<name>`           | 或读 skill-creator 流程                                                                                                                                                                                                              |
| 安装到 Agent（用户自执行）   | 见 README.md（`npx skills add ...`）      | ⚠️ 本项目只管创建/优化 skill，安装到 opencode 等 Agent 由用户自行执行，AI 不代装                                                                                                                                                     |

## SKILL 引用规范（本仓库核心约定）

### 引用 references/ —— Markdown 链接（相对路径）

```markdown
# ✅ 合规：Markdown 链接，目标为相对路径（从 skill 根目录起）

详见 [布局引擎](references/layouts.md)
```

- `references/` 引用必须用 Markdown 链接：`[显示文本](references/xxx.md)`
- 显示文本写可读说明；目标用相对路径，保持一级深度（`references/xxx.md`，不要嵌套 `references/sub/xxx.md`）

### 引用 scripts/ 与 assets/ —— 相对路径命令

```bash
# ✅ 合规：相对路径（从 skill 根目录起）
scripts/main.py --input data.json
scripts/render.py --template assets/templates/report.xml
```

### 禁止的引用写法（ANTI-PATTERNS）

| 写法                                           | 原因                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `@scripts/foo.ts` 等 `@path` 语法              | agentskills.io 规范明确禁止，其他 Agent（Claude Code/Cursor 等）无法识别 |
| 硬编码绝对路径 `~/.config/opencode/skills/xxx` | skill 移动到任何安装位置即失效                                           |
| `./scripts/foo.py` 依赖 cwd                    | bash 调用时 cwd 不一定是 skill 目录                                      |
| 让 AI "自行查找/拼路径"                        | 依赖推断，不可靠                                                         |

### 长文档拆分原则（渐进式披露）

- `SKILL.md` 保持精简（<500 行），放核心工作流与速查；详参按主题下沉 `references/`（SKILL.md 作 router 按需指向）。`c4-container-diagram` 已按此拆为 229 行（详见其 `references/README.md`）
- 详细参考放 `references/`，SKILL.md 内用 Markdown 链接按需指向
- references 文件可本地化官方资料（爬取后内联代码块、去除 Docusaurus 组件残留），使 skill 离线可用

## FRONTMATTER 合规清单

| 字段            | 要求                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `name`          | 必填，小写连字符，与目录名一致                                                                                      |
| `description`   | 必填，含功能 + 触发词，<1024 字符                                                                                   |
| `license`       | 可选                                                                                                                |
| `metadata`      | 可选，可含 `supportedAgents: '["opencode"]'`（值需用单引号包成字符串；官方校验器不认 JSON 流式数组 `["opencode"]`） |
| `allowed-tools` | 可选，空格分隔字符串（`Read Write Edit Bash`），支持 `Bash(git:*)` 子命令形式；禁止 YAML 数组或逗号分隔             |

## CONVENTIONS

- 文档与注释全部使用中文（技术术语/命令/路径保留原文）
- 不修改 `improve/`、`demo/`、`.omo/`、`.codegraph/` 等非 skill 目录
- skill 目录只放 SKILL.md + references/ + assets/ + scripts/，不混入无关文件
- 模板与生成文档禁用 `**` 加粗与 emoji：`references/templates/**` 正文及 frontmatter 不得出现 `**加粗**`（glob 通配符 `**`、目录树制表符除外）；emoji 零容忍（✅/⚠️/箭头表情等全算）；机检：`grep -rnE '\*\*[^*`]+\*\*' skills/*/references/templates/` 无输出 + 下方 NOTES 的 emoji 扫描命令无输出

## ANTI-PATTERNS（THIS PROJECT）

- ❌ `@path` 引用语法（如 `@references/guide.md`）
- ❌ `allowed-tools:` 写成 YAML 块数组或逗号分隔
- ❌ `name` 与目录名不一致 / 大写 / 含下划线
- ❌ 在 skill 中写入真实密码、token、敏感主机信息
- ❌ SKILL.md 中引用不存在的章节号（死引用）或指向不存在的 reference 文件
- ❌ 改动 skill 后不同步更新 `references/README.md`（文件清单/更新命令）
- ❌ 模板/frontmatter/生成文档中出现 `**加粗**` 或 emoji（glob `**`、目录树制表符除外）

## COMMANDS

```bash
# 列出所有 skill
find skills -name "SKILL.md" | sort

# 创建新 skill
npx skills init skills/<skill-name>

# 检查更新（只检查，不更新）
npx skills check

# 更新本机已安装的 skill（从 GitHub 拉最新覆盖本地）
npx skills update -g -y

# 校验 skill 合规性（agentskills.io 官方 skills-ref，uvx 一次性运行，不落地安装）
# 注意：可执行名是 agentskills（不是 skills-ref）；npx skills check 只是 update 只读模式，≠合规校验
uvx --from skills-ref agentskills validate ./skills/<skill-name>

# 校验全部 skill
for d in skills/*/; do uvx --from skills-ref agentskills validate "$d" || echo "!! FAIL: $d"; done
```

> ⚠️ 安装到 Agent 由用户自行执行，AI 不代装。安装命令见 README.md（如 `npx skills add . -s '*' -a opencode`），不写进本项目工作流。

## NOTES

- 项目约定统一由 AGENTS.md 承担；skill 格式基础规范见 [skill-md-format.md](skills/skill-creator/references/skill-md-format.md)，改 skill 前先读
- `references/` 的官方资料可通过 `references/README.md` 的更新命令重新拉取（上游分支为 `master`）
- 仓库未设置 CI；合规校验用 `uvx --from skills-ref agentskills validate`（agentskills.io 官方 skills-ref，见 COMMANDS），`npx skills check` 只查更新；改 skill 后必跑校验，若改动的是已有 skill，改前也建议跑一次作为基线（区分「既有问题」vs「本次改动引入」）
- 无加粗/emoji 扫描（改模板后必跑）：`grep -rnE '\*\*[^*`]+\*\*' skills/_/references/templates/`无输出；emoji 扫描`python3 -c "import glob;hit=[f'{p}:{i}' for p in glob.glob('skills/_/references/templates/**/*.md',recursive=True) for i,l in enumerate(open(p,encoding='utf-8'),1) for ch in l if '\U0001F300'<=ch<='\U0001FAFF' or 0x2705<=ord(ch)<=0x27BF];print(hit if hit else 'emoji干净')"`输出`emoji干净`
