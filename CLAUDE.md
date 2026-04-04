# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概述

这是一个个人自定义 Claude Code Agent 技能仓库。每个技能都存储在 `skills/` 下的独立目录中，遵循 Claude Code 技能格式用于 MCP 技能调用。

## 仓库结构

```
skills/
├── README.md             # 项目说明
├── CLAUDE.md             # Claude Code 开发指南（本文件）
└── skills/               # 技能目录
    └── <skill-name>/     # 每个技能一个子目录
        └── SKILL.md      # 技能定义文件（必需）
```

## 技能格式

每个技能必须包含一个 `SKILL.md` 文件，结构如下：

```markdown
---
name: <skill-name>
description: <技能功能的一句话描述>
type: <skill-type>
---

# <技能名称>

详细描述技能的用途、触发时机和工作原理。

## 使用场景

什么时候应该调用这个技能：
- 具体的触发条件
- 使用示例场景

## 实现说明

未来的 Claude 实例需要了解的实现细节或约定。
```

## 常用开发任务

### 创建新技能

1. 创建新目录 `skills/<skill-name>/`
2. 根据上述模板创建 `skills/<skill-name>/SKILL.md`
3. 填写技能元数据和文档

### 列出已有技能

```bash
find skills -name "SKILL.md" | sort
```

### 创建后测试技能

仓库克隆或更新后，Claude Code 框架会自动发现技能。无需构建步骤。

## 关键约定

- 每个技能在独立目录中自包含
- 每个技能必须有带 YAML frontmatter 的 `SKILL.md`
- 技能目录名使用小写字母加连字符 (`my-skill-name`)
- 保持 frontmatter 中的 `name:` 字段与目录名一致
- 绝对不要在技能文件中提交敏感信息（API 密钥、凭证）
