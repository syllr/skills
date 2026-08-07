# SKILL.md 格式规范

## 文件结构

```
skill-name/
├── SKILL.md              # 必选：指令 + 元数据
├── scripts/              # 可选：可执行脚本
├── references/           # 可选：参考文档
└── assets/              # 可选：模板/资源
```

## SKILL.md 结构

SKILL.md 由两部分组成：**YAML frontmatter** + **Markdown 正文**。

### YAML Frontmatter

```yaml
---
name: skill-name # 必填，kebab-case
description: >- # 必填，1-1024字符
  技能描述。
allowed-tools: Read Write Edit # 可选，空格分隔
---
# Markdown 正文开始
```

### 必填字段

| 字段          | 说明       | 格式要求                                               |
| ------------- | ---------- | ------------------------------------------------------ |
| `name`        | 技能标识符 | kebab-case，1-64字符，只能是小写字母、数字、单个连字符 |
| `description` | 触发描述   | 1-1024字符，必须包含"做什么"和"何时触发"               |

### 可选字段

| 字段            | 说明                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------- |
| `allowed-tools` | 允许的工具列表，**空格分隔字符串**（实验性）                                                |
| `license`       | 许可证名称，或指向随 skill 附带的许可证文件                                                 |
| `compatibility` | 环境要求（目标产品、系统包、网络访问等），1-500 字符                                        |
| `metadata`      | 自定义元数据（author、version、category、tags 等；可含 `supportedAgents` 声明兼容的 Agent） |

### description 写法

**结构**：`[做什么] + [何时触发（触发词）]`

**示例**：

```yaml
description: >
  深度阅读和分析 arxiv 论文,提炼核心原理、观点、论据、实验和结论,
  生成浅显易懂的中文解读报告。当用户提供 arxiv.org 链接、提到"读论文"、
  "分析论文"、"解读论文"时使用此技能。
```

### allowed-tools 格式

```yaml
allowed-tools: Bash(python3:*) Read Write Grep
```

**必须为空格分隔字符串**（`allowed-tools: Read Write Edit`），不要写成 YAML 数组或逗号分隔（如 `Read, Write` 不合规）。

工具名后面括号内列出允许的子命令（如 `Bash(python3:*)` 表示只允许 `python3` 子命令）。

> ⚠️ 实验性字段：不同 Agent 对 `allowed-tools` 的支持程度不一，不写则工具默认全部可用。

---

## Markdown 正文结构

建议按以下顺序组织：

```markdown
# Skill Name

## 简介

（技能概述，1-2 句话）

## 何时使用

（详细触发场景和触发词）

## 执行流程

1. 步骤一
2. 步骤二
3. 步骤三

## 输出规范

（固定格式要求，如有）

## 错误处理

（异常情况处理）

## 示例

（输入输出示例）
```

---

## 渐进式披露机制

| 阶段     | 加载内容                         | Token 成本        |
| -------- | -------------------------------- | ----------------- |
| **发现** | 所有 Skill 的 name + description | ~100 tokens/Skill |
| **激活** | 触发的 Skill 完整 SKILL.md       | ~5k tokens        |
| **执行** | references 文档 + scripts 脚本   | 按需              |

**设计原则**：

- SKILL.md 正文应该简洁，详细的参考资料放 references/
- 不要在 SKILL.md 里塞满所有细节
- Agent 执行时按需读取 references/

---

## 触发词设计建议

1. **包含主要触发词**（2-5 个核心词）
2. **稍微"激进"一些**，避免 undertrigger
3. **包含同义词**，扩大触发范围
4. **不要过度触发**，避免每次都用这个 skill

**示例**：

```yaml
description: >
  对代码进行审查并提供改进建议。当用户提到"review"、"审查代码"、
  "代码审查"、"看看这段代码"、"review 代码"时使用此技能。
```
