# Agent Skills 开放标准分析

**官方网站**: https://agentskills.io/home  
**信息来源**: 官方文档 (获取于 2026-04-05)

---

## 概述

Agent Skills 是一个**开放格式标准**，用于为 AI Agent 提供可扩展的能力和专业知识。由 Anthropic 创建并开源，现在被越来越多的 AI 编程工具采用。

> "A simple, open format for giving agents new capabilities and expertise."

## 为什么需要 Agent Skills？

AI Agent 能力越来越强，但通常缺少完成可靠工作所需的上下文。Skills 通过提供程序化知识和特定团队/用户的上下文，让 Agent 能够按需扩展能力。

**价值：**

- **对于技能作者**：一次构建，可在多个 Agent 产品部署
- **对于兼容 Agent**：支持技能让终端用户开箱即用获得新能力
- **对于团队/企业**：在可版本控制的包中捕获组织知识

## 能力场景

* **领域专业知识**：将专业知识打包成可复用指令，从法律审查流程到数据分析流水线
* **新能力**：给 Agent 赋予新能力（例如创建演示文稿、构建 MCP 服务器、分析数据集）
* **可重复工作流**：将多步骤任务转为一致可审计的工作流
* **互操作性**：相同技能可在不同兼容 Agent 产品之间复用

## 生态采用

Agent Skills 格式被 40+ AI 开发工具支持，包括：

- Claude Code (Anthropic)
- Cursor
- Roo Code
- Gemini CLI
- OpenCode
- OpenHands
- Windsurf
- GitHub Copilot
- 等等 ...

完整列表: https://agentskills.io/home

## 格式规范

### 基本结构

每个技能是一个目录，入口是 `SKILL.md` 文件：

```markdown
---
name: my-skill
description: What this skill does and when to use it
---

# My Skill

Instructions for the agent to follow when this skill is activated.

## When to Use

Describe the scenarios where this skill should be used.

## Steps

1. First, do this
2. Then, do that
```

### 必填字段

| 字段 | 说明 |
|------|------|
| `name` | 唯一标识符（小写，允许连字符） |
| `description` | 技能功能简要说明 |

### 可选字段

| 字段 | 说明 |
|------|------|
| `metadata.internal` | 设置 `true` 可隐藏技能，默认不被发现，仅在 `INSTALL_INTERNAL_SKILLS=1` 时可见 |

### 内部技能示例

```markdown
---
name: my-internal-skill
description: An internal skill not shown by default
metadata:
  internal: true
---
```

## 技能发现机制

CLI 在仓库的以下位置搜索技能：

- 根目录（如果包含 `SKILL.md`）
- `skills/`
- `skills/.curated/`
- `skills/.experimental/`
- `skills/.system/`
- `.agents/skills/`
- `.claude/skills/` 等各 Agent 专属目录

如果 `SKILL.md` 不位于上述搜索路径，或者文件名不是 `SKILL.md`，则不会被发现为独立技能。

## 对自改进的意义

Agent Skills 标准本身**天然支持自改进**：

1. **技能是纯文本文件** - AI 可以直接读写修改
2. **版本化** - 可以通过 Git 追踪变更
3. **发现机制清晰** - 只有符合命名规范的 `SKILL.md` 才会被发现
4. **internal 标记支持** - 开发中的元数据可以标记为 internal，默认不加载

---

## 引用

- **网站**: https://agentskills.io/
- **规格**: https://agentskills.io/specification
- **GitHub**: https://github.com/agentskills/agentskills
- **获取时间**: 2026-04-05
