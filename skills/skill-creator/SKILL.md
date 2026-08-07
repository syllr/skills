---
name: skill-creator
description: >
  创建新的 OpenCode Skill。当用户提到"创建一个 skill"、"新建 skill"、"帮我写一个 skill"、
  "制作 skill"、"skill 创建"、"我要做个技能"时使用此技能。
allowed-tools: Read Write Edit Bash Glob Grep skill task searchweb webfetch
---

# Skill Creator

创建新的 OpenCode Skill。

## 何时使用

用户想要创建一个新的 OpenCode skill 时使用。

## 重要参考

**在创建 skill 之前，必须阅读以下文档：**

- [SKILL.md 格式规范](references/skill-md-format.md) — YAML frontmatter 和 Markdown 正文的格式要求
- [目录结构规范](references/directory-structure.md) — scripts/references/assets 的用途和选择
- [脚本语言选择指南](references/script-language-guide.md) — 何时需要脚本 + 语言选择原则
- [路径引用规范](references/path-resolution.md) — **必读**：skill 内部资源的合规引用方式（相对路径 / Markdown 链接，禁止硬编码绝对路径）

---

## 生态字段（可选 frontmatter）

agentskills.io 规范除必填的 `name`、`description` 外，还支持以下可选字段（创建时按需选用，不要为填而填）：

| 字段            | 用途                                                                                        | 示例                                                                    |
| --------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `license`       | 许可证名称，或指向随 skill 附带的许可证文件                                                 | `license: MIT` / `license: Proprietary. LICENSE.txt has complete terms` |
| `compatibility` | 环境要求（目标产品、系统包、网络访问等），1-500 字符，大多数 skill 不需要                   | `compatibility: Requires Python 3.14+ and uv`                           |
| `metadata`      | 自定义键值对元数据（author、version、category 等），可含 `supportedAgents` 声明兼容的 Agent | 见下例                                                                  |
| `allowed-tools` | 空格分隔的预授权工具列表（实验性字段，各 Agent 支持程度不一）                               | `allowed-tools: Read Write Edit Bash`                                   |

```yaml
metadata:
  author: your-name
  version: "1.0.0"
  supportedAgents: ["claude-code", "opencode"]
```

**要点**：

- `license`：可选，写法参考本仓库其他 skill（如 `license: MIT`）。
- `metadata.supportedAgents`：声明该 skill 面向的 Agent 列表；省略表示全兼容。
- `allowed-tools`：可选，写法参考本仓库其他 skill（如 `allowed-tools: Bash`）。**格式必须为空格分隔字符串**（`allowed-tools: Read Write Edit`），支持子命令限制形式（如 `Bash(git:*)`）；不要写成 YAML 数组或逗号分隔。不写则工具默认全部可用。

---

## 创建流程

### Phase 1: 澄清需求

**一轮问完所有需要的信息。** 包括:

- **使用场景**:这个 skill 在哪些情况下会被调用?举 2-3 个典型场景。
- **输入/输出**:输入什么 → 产出什么?
- **边界情况**:有没有需要特别处理的边界?
- **skill 名字**(kebab-case)
- **触发词**:什么时候应该触发?列出用户可能说的关键词
- **输出格式**:产出有什么格式要求?
- **安装位置**:这个 skill 的最终目标路径是哪里?(**这是唯一位置,不存在 deploy 步骤**)

> 询问用户直接在主对话中进行即可（提问/确认都是普通对话，不需要专门的 question 工具）。`allowed-tools` 为可选字段，不写则工具默认全部可用。

**关于"安装位置"必问的 3 个子问题:**

1. **使用范围**:这个 skill 给当前用户所有项目用(全局),还是只给当前项目用(项目级)?
2. **项目自定义目录**:当前项目根目录是否已经有 skill 目录约定(非 `.opencode/skills/`,例如 `skills/`、`.agents/skills/`)?如果有,优先用项目自己的约定。
3. **`.opencode` 是否在 `.gitignore`**:如果是项目级 skill 且要随 Git 共享,需要确认 `.opencode/` 没被忽略,否则换 `skills/` 或 `opencode.json` 的 `skills.paths`。

**位置速查**(详见 [目录结构规范 - 安装位置](references/directory-structure.md#安装位置目标路径)):

- **全局通用**:`~/.config/opencode/skills/<name>/` ← 个人用,推荐默认
- **项目级(随 Git 共享)**:`<project>/.opencode/skills/<name>/` ← 项目专属
- **项目自定义**:用户项目根目录的 `skills/` 等 ← 遵循项目既有约定

**用以下格式总结你的理解,让用户确认:**

```
## 我的理解
- **解决的问题**:{一句话}
- **典型场景**:{2-3 个场景}
- **输入/输出**:{输入} → {输出}
- **边界**:{需要注意的边界}
- **skill 名字**:`{name}`
- **触发词**:{触发词列表}
- **安装位置**:`{绝对路径}` ← 这是最终目标,创建后即可使用,无需复制

以上理解正确吗?
```

**以上理解正确吗?请确认,或补充遗漏的信息。**

### Phase 2: 创建文件

**直接在主对话里写 SKILL.md。** 根据实际复杂度判断是否需要 scripts/、references/、assets/ 子目录。

1. 创建目录结构
2. 写入 SKILL.md
3. 如需 scripts/,创建并写入脚本文件
4. 如需 references/,创建并写入参考文档
5. 如需 assets/,创建并写入资源文件

**关键**:SKILL.md 中引用 skill 内部资源（scripts/、references/、assets/ 等子目录下的文件）时，用**相对路径**（相对于 skill 目录，如 `scripts/main.py`）或 **Markdown 链接**（如 `[指南](references/guide.md)`），详见 [路径引用规范](references/path-resolution.md)。**禁止**硬编码绝对路径（如 `~/.config/opencode/skills/xxx`），**禁止** `@path` 语法（如 `@scripts/xxx`——agentskills.io 规范不允许，其他 Agent 无法识别）。

```bash
# 示例:全局 skill —— 这一步就是最终位置
mkdir -p ~/.config/opencode/skills/{skill-name}/

# 示例:项目级 skill —— 这一步也是最终位置
mkdir -p .opencode/skills/{skill-name}/
```

> ⚠️ **关键澄清**:`mkdir -p` 创建的目录就是 skill 的**最终存放位置**。OpenCode 通过纯文件发现机制加载 skill(扫描 6+ 个已知路径,后发现的同名 skill 覆盖先发现的),**不存在 "deploy 到全局" 这一步骤**。如果用户要"全局"skill,直接写到 `~/.config/opencode/skills/<name>/` 即可,不要先写到 `.opencode/skills/` 再复制。

**写完后告知用户文件路径,让用户直接 review 最终文件。** 用户可以:

- 直接使用(无需回复)
- 提出修改意见(进入修改循环)
- 删除文件重来

---

## ⚠️ 重要提醒

**Phase 1 必须完成**:理解用户问题要透彻,不清楚就问。

---

## 目录结构完整说明

```
skill-name/
├── SKILL.md              # 必选：指令 + 元数据
├── scripts/              # 可选：可执行脚本
├── references/          # 可选：参考文档
└── assets/              # 可选：模板/资源
```
