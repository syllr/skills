# syllr Custom Agent Skills

个人自定义 [Agent Skills](https://vercel-labs.github.io/skills/) 技能集合，适配 [skills.sh](https://skills.sh/) 生态系统。

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

## 可用技能

| 技能 | 描述 |
|------|------|
| 待添加 | 待添加 |

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
