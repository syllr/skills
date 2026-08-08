# PROJECT KNOWLEDGE BASE

**Generated:** 2026-08-07
**Role:** 个人自定义 Agent Skills 仓库（vercel-labs/skills 生态，`npx skills` 分发）

## OVERVIEW

仓库管理一组自包含的 Agent Skills（每个 skill = 一个目录，含 `SKILL.md` + 可选 `references/`/`assets/`/`scripts/`）。核心关注点：**skill 内部资源的引用规范**（相对路径 / Markdown 链接，禁止 `@path`）与格式合规（agentskills.io 规范）。语言：中文文档。

## STRUCTURE

```
skills/
├── d2/              # 画图 skill：SKILL.md + references/（20 官方文档 + diagram-review 自研 + README 清单）
├── remote-shell/    # SSH 远程执行 skill（单 SKILL.md）
├── score-prompt/    # prompt 质量评分 skill（单 SKILL.md）
└── skill-creator/   # 创建新 skill 的 skill：SKILL.md + references/（含 guide.md）+ assets/templates/
improve/             # 研究笔记（非 skill，勿动）
test/                # 测试文件（非 skill，勿动）
README.md            # 面向用户的安装/技能表
```

## WHERE TO LOOK

| 任务                      | 位置                                  | 说明                                                                                       |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| 查看全部 skill            | `skills/`                             | 每个子目录一个 skill                                                                       |
| 新 skill 的模板与格式规范 | `skills/skill-creator/references/`    | 含 guide / path-resolution / skill-md-format / directory-structure / script-language-guide |
| 官方文档本地化范例        | `skills/d2/references/`               | 20 个官方文档页 + 自研 diagram-review.md + README 清单（共 22 个 .md）                     |
| 创建新 skill              | `npx skills init skills/<name>`       | 或读 skill-creator 流程                                                                    |
| 本地测试安装              | `npx skills add . -s '*' -a opencode` | 见 README.md（⚠️ 用 `-s '*'` 而非 `--all`：`--all` 会忽略 `-a` 装到所有 agent）            |

## SKILL 引用规范（本仓库核心约定）

### 引用 references/ —— Markdown 链接（相对路径）

```markdown
# ✅ 合规：Markdown 链接，目标为相对路径（从 skill 根目录起）

详见 [布局引擎](references/layouts.md)
```

- `references/` 引用必须用 Markdown 链接：`[显示文本](references/xxx.md)`
- 显示文本写可读说明；目标用相对路径，**保持一级深度**（`references/xxx.md`，不要嵌套 `references/sub/xxx.md`）

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

- `SKILL.md` 保持精简（<500 行，**例外：`d2/SKILL.md` 为系统级综合技能，575 行属已知例外**），放核心工作流与速查
- 详细参考放 `references/`，SKILL.md 内用 Markdown 链接按需指向
- references 文件可本地化官方资料（爬取后内联代码块、去除 Docusaurus 组件残留），使 skill 离线可用

## FRONTMATTER 合规清单

| 字段            | 要求                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| `name`          | 必填，小写连字符，与目录名一致                                                                                  |
| `description`   | 必填，含功能 + 触发词，<1024 字符                                                                               |
| `license`       | 可选                                                                                                            |
| `metadata`      | 可选，可含 `supportedAgents: ["opencode"]`                                                                      |
| `allowed-tools` | 可选，**空格分隔字符串**（`Read Write Edit Bash`），支持 `Bash(git:*)` 子命令形式；**禁止 YAML 数组或逗号分隔** |

## CONVENTIONS

- 文档与注释全部使用中文（技术术语/命令/路径保留原文）
- 不修改 `improve/`、`test/`、`.omo/`、`.codegraph/` 等非 skill 目录
- skill 目录只放 SKILL.md + references/ + assets/ + scripts/，不混入无关文件

## ANTI-PATTERNS（THIS PROJECT）

- ❌ `@path` 引用语法（如 `@references/guide.md`）
- ❌ `allowed-tools:` 写成 YAML 块数组或逗号分隔
- ❌ `name` 与目录名不一致 / 大写 / 含下划线
- ❌ 在 skill 中写入真实密码、token、敏感主机信息
- ❌ SKILL.md 中引用不存在的章节号（死引用）或指向不存在的 reference 文件
- ❌ 改动 skill 后不同步更新 `references/README.md`（文件清单/更新命令）

## COMMANDS

```bash
# 列出所有 skill
find skills -name "SKILL.md" | sort

# 创建新 skill
npx skills init skills/<skill-name>

# 本地测试安装（项目级，⚠️ 用 -s '*' 而非 --all，--all 会忽略 -a 装到所有 agent）
npx skills add . -s '*' -a opencode

# 检查更新（只检查，不更新）
npx skills check

# 更新本机已安装的 skill（从 GitHub 拉最新覆盖本地）
npx skills update -g -y
```

## NOTES

- 项目约定统一由 AGENTS.md 承担；skill 格式基础规范见 [skill-md-format.md](skills/skill-creator/references/skill-md-format.md)，改 skill 前先读
- `references/` 的官方资料可通过 `references/README.md` 的更新命令重新拉取（上游分支为 `master`）
- 仓库未设置 CI；格式校验靠 `npx skills` 与人工 review
