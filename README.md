# syllr Custom Agent Skills

个人自定义 [Agent Skills](https://github.com/vercel-labs/skills) 技能集合，适配 [skills.sh](https://skills.sh/) 生态系统，基于 `npx skills` 命令管理。

[![skills.sh](https://skills.sh/b/syllr/skills)](https://skills.sh/syllr/skills)

支持 **Claude Code**, **Cursor**, **Windsurf**, **Roo Code** 等 40+ AI 编程助手。

## 安装

使用 `npx skills` 命令行工具一键安装：

```bash
# 安装所有技能
npx skills add syllr/skills --all
```

```bash
# 只安装指定技能
npx skills add syllr/skills --skill <skill-name>
```

```bash
# 只安装到 Claude Code（全局）
npx skills add syllr/skills --all -g -a claude-code -y
```

### opencode

> ⚠️ 安装全部技能请用 `-s '*'` 而非 `--all`：`--all` 会强制安装到所有 agent（忽略 `-a opencode`），产生无关的失败提示。

```bash
# 全局安装全部技能（所有项目生效）
npx skills add syllr/skills -s '*' -a opencode -g -y

# 只安装指定技能
npx skills add syllr/skills --skill <skill-name> -a opencode -g -y

# 只安装到当前项目
npx skills add syllr/skills -s '*' -a opencode -y
```

安装后位于 `~/.config/opencode/skills/`（全局）或 `<项目>/.opencode/skills/`（项目级），重启 opencode 生效。

## 更新

当仓库里的 skill 有改动后，用 `npx skills` 更新本机已安装的版本：

```bash
# 更新所有已安装技能（自动检测全局/项目作用域）
npx skills update

# 只更新全局技能
npx skills update -g

# 只更新当前项目的技能
npx skills update -p

# 跳过确认，直接更新
npx skills update -g -y
```

> `update`（别名 `upgrade`）会从 GitHub 仓库拉取最新版本并覆盖本机已安装的 skill。若本机技能是手动复制而非 `npx skills add` 安装的，`update` 可能无法识别，需重新执行 `add` 命令覆盖安装。

## 可用技能

| 技能                                                 | 描述                                                                                                                                                                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [c4-container-diagram](skills/c4-container-diagram/) | 用 D2（d2lang.com）画 C4 Container Diagram（[c4model.com](https://c4model.com/diagrams/container) 标准第 2 层图）——展示系统级容器划分、容器间通信关系、多层大容器纵向堆叠。Markdown 内嵌 d2 代码块渲染；画图前先以 ASCII 架构图与用户确认 |
| [remote-shell](skills/remote-shell/)                 | 通过 SSH 在远程服务器上执行命令，优先使用 remote-shell CLI 并支持降级回退                                                                                                                                                                 |
| [score-prompt](skills/score-prompt/)                 | 对任意 LLM prompt / 文档跑 5 维度质量评分（Clarity/Conciseness/Actionability/Consistency/Minimal-slop）并迭代修复至目标分数                                                                                                               |
| [skill-creator](skills/skill-creator/)               | 创建新的 OpenCode Skill，含目录结构、格式规范、路径解析与脚本模板                                                                                                                                                                         |

## 创建新技能

使用 `npx skills` 初始化新技能：

```bash
npx skills init skills/<skill-name>
```

## 关于 Skills 生态

Agent Skills 是开放的 AI 编程助手技能生态系统，通过标准化的可复用指令集，为通用 AI 补充特定领域的专业能力。

- 官网：[skills.sh](https://skills.sh)
- GitHub：[vercel-labs/skills](https://github.com/vercel-labs/skills)
- 规格：[agentskills.io](https://agentskills.io)

## 许可

MIT
