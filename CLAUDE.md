# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概述

这是一个个人自定义 Agent Skills 仓库，遵循 [vercel-labs/skills](https://github.com/vercel-labs/skills) 开放技能生态标准。每个技能存储在 `skills/` 目录下，可以通过 `npx skills` 命令行工具安装到 Claude Code、Cursor、Windsurf 等 AI 编程助手。

## 仓库结构

```
skills/
├── README.md             # 项目说明（面向用户）
├── CLAUDE.md             # Claude Code 开发指南（本文件）
└── skills/               # 技能目录
    └── <skill-name>/     # 每个技能一个子目录
        └── SKILL.md      # 技能定义文件（必需）
```

## 技能格式规范

每个技能必须包含 `SKILL.md` 文件，使用以下 YAML frontmatter 格式：

```markdown
---
name: <skill-name>
description: <技能功能的一句话描述>
metadata:
  supportedAgents: ["claude-code", ...] # 可选，指定支持的 Agent
  internal: false # 可选，true 表示隐藏技能，不对外公开
---

# <技能名称>

详细描述技能的用途、触发时机和工作原理。

## When to Use / 使用场景

什么时候应该调用这个技能：
- 具体的触发条件
- 使用示例场景

## Instructions / 执行步骤

技能被激活后需要遵循的具体步骤：

1. 第一步做什么
2. 第二步做什么
3. ...

## Implementation Notes / 实现说明

未来 Claude 实例需要了解的实现细节或特殊约定。
```

### 必填字段

- `name`: 技能唯一标识（小写，使用连字符分隔）
- `description`: 技能功能简要说明

### 可选字段

- `metadata.internal`: 设置为 `true` 可隐藏该技能，仅在 `INSTALL_INTERNAL_SKILLS=1` 时可见

## 常用开发命令

### 创建新技能

```bash
# 使用官方 CLI 初始化
npx skills init skills/<skill-name>
```

### 列出所有技能

```bash
find skills -name "SKILL.md" | sort
```

### 本地测试安装

```bash
# 测试安装到当前项目 Claude Code
npx skills add . --all -a claude-code

# 测试安装到全局 Claude Code
npx skills add . --all -g -a claude-code -y
```

### 检查更新

```bash
npx skills check
```

## 技能发现

Vercel Skills CLI 会自动在以下位置搜索技能：

- `skills/` 目录（本仓库使用这个位置）
- 根目录（如果根目录有 `SKILL.md`）
- `.claude/skills/` 等各 Agent 专属目录

## 关键约定

- 每个技能在独立目录中自包含
- 每个技能必须有带 YAML frontmatter 的 `SKILL.md`
- 目录名必须与 frontmatter 中的 `name` 字段一致
- 目录名使用小写字母加连字符 (`my-skill-name`)
- 绝对不要在技能文件中提交敏感信息（API 密钥、凭证）
- 遵循官方 [Agent Skills 规格](https://agentskills.io)
