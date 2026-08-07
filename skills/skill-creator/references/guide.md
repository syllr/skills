# Skill 使用指南（示例）

> 本文件是 `references/guide.md` 的标准示例——教你在 skill 里放一个"详细使用指南"参考文档，供 SKILL.md 用 Markdown 链接按需引用（渐进式披露）。

## 定位

- 放在 skill 的 `references/` 目录（一级深度）
- SKILL.md 中引用方式：`[使用指南](references/guide.md)`
- 内容：本 skill 的详细使用说明、参数表、边界场景、FAQ

## 与 SKILL.md 的分工

| 内容                              | 放哪                                     |
| --------------------------------- | ---------------------------------------- |
| 核心工作流、触发方式、速查        | `SKILL.md`（保持精简，<500 行）          |
| 详细参考、参数全表、示例合集、FAQ | `references/guide.md` 等 references 文件 |

## 编写要点

- 用中文（技术术语/命令保留原文）
- 结构清晰：按主题分节，从常用到进阶
- 代码示例用代码块，可直接复制
- 链接其他 references 文件用相对路径 Markdown 链接

## 反例

```markdown
❌ @references/guide.md # @path 语法，agentskills.io 禁止
❌ ~/.config/skills/guide.md # 绝对路径，安装位置一变就失效
❌ ./references/guide.md # 依赖 cwd，不可靠
✅ [使用指南](references/guide.md) # 相对路径 Markdown 链接
```
