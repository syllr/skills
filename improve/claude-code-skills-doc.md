# Claude Code Skills 官方文档分析

**官方文档**: https://code.claude.com/docs/zh-CN/skills  
**信息来源**: 官方文档 (获取于 2026-04-05)

---

## 概述

Claude Code 完全遵循 [Agent Skills](https://agentskills.io) 开放标准，并在此基础上扩展了额外功能，如调用控制、subagent 执行、动态上下文注入。

> "Skills 扩展了 Claude 能做的事情。创建一个 `SKILL.md` 文件，其中包含说明，Claude 会将其添加到其工具包中。Claude 在相关时使用 skills，或者你可以使用 `/skill-name` 直接调用一个。"

## 核心概念

### 技能存储位置

存储位置决定使用范围：

| 位置 | 路径 | 适用范围 | 优先级 |
|------|------|----------|--------|
| 企业 | 托管设置 | 组织所有用户 | 最高 |
| 个人 | `~/.claude/skills/` | 所有项目 | 中 |
| 项目 | `.claude/skills/` | 当前项目 | 低 |
| 插件 | `/skills/` | 插件启用位置 | 命名空间隔离 |

优先级：企业 > 个人 > 项目。如果名称冲突，高优先级获胜。

### 目录结构

```
my-skill/
├── SKILL.md           # 主要说明（必需）
├── template.md        # Claude 要填写的模板
├── examples/
│   └── sample.md      # 显示预期格式的示例输出
└── scripts/
    └── validate.sh    # Claude 可以执行的脚本
```

- `SKILL.md` 必需，其他文件可选
- 建议 `SKILL.md` 保持在 500 行以下，详细内容放到独立文件
- Claude 在需要时才加载支持文件，节省 token

## Frontmatter 配置参考

| 字段 | 必需 | 描述 |
|------|:----:|------|
| `name` | 否 | Skill 名称，省略则使用目录名 |
| `description` | 推荐 | Skill 功能和何时使用，Claude 用它决定何时自动加载 |
| `argument-hint` | 否 | 自动完成提示，例如 `[issue-number]` |
| `disable-model-invocation` | 否 | `true` 防止 Claude 自动加载，用于手动触发 |
| `user-invocable` | 否 | `false` 从 `/` 菜单隐藏，用于仅 Claude 调用的背景知识 |
| `allowed-tools` | 否 | 此 skill 激活时，Claude 可以无需权限使用的工具 |
| `model` | 否 | 使用此 skill 时要使用的模型 |
| `effort` | 否 | 工作量级别覆盖：`low/medium/high/max` |
| `context` | 否 | 设置为 `fork` 在分叉 subagent 上下文运行 |
| `agent` | 否 | `context: fork` 时使用的 subagent 类型 |
| `paths` | 否 | Glob 模式，仅在匹配路径时激活 |
| `shell` | 否 | `!command` 块使用的 shell，默认 `bash` |

### 调用控制

| 配置 | 你可调用 | Claude 可调用 | 加载方式 |
|------|---------|-------------|----------|
| 默认 | 是 | 是 | 描述始终在上下文，调用时加载完整 skill |
| `disable-model-invocation: true` | 是 | 否 | 描述不在上下文，你调用时加载 |
| `user-invocable: false` | 否 | 是 | 描述始终在上下文，调用时加载 |

## 动态上下文注入

使用 `` !`command` `` 语法在发送给 Claude 之前运行 shell 命令，命令输出替换占位符。

示例：

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

**工作流程：**
1. 所有 `` !` `` 立即执行（Claude 看到前）
2. 输出替换占位符
3. Claude 获得完全渲染后的提示

## Subagent 中运行技能

添加 `context: fork` 让 skill 在隔离 subagent 中运行：

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:

1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

**agent 选项：** `Explore`, `Plan`, `general-purpose`，或自定义 agent。

## 参数传递

使用 `$ARGUMENTS` 获取传递的参数：

| 占位符 | 描述 |
|--------|------|
| `$ARGUMENTS` | 所有参数 |
| `$ARGUMENTS[N]` | 按索引访问（0 基） |
| `$N` | `$ARGUMENTS[N]` 简写 |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID |
| `${CLAUDE_SKILL_DIR}` | skill 目录路径 |

示例：

```yaml
---
name: migrate-component
description: Migrate a component from one framework to another
---

Migrate the $0 component from $1 to $2.
Preserve all existing behavior and tests.
```

## 对自改进的支持

Claude Code Skills 天生支持自改进：

1. **Skill 是纯文本 Markdown** - Claude 可以直接读取、理解、修改
2. **Git 集成** - 可以通过 Git 版本控制每一次改进
3. **hooks 支持** - 可以配置钩子在会话结束自动触发反思
4. **dynamic context** - 可以注入会话历史、git diff 等动态内容用于反思
5. **subagent fork** - 反思和改进可以放到隔离 subagent 执行，不污染主会话

---

## 引用

- **文档**: https://code.claude.com/docs/zh-CN/skills
- **获取时间**: 2026-04-05
