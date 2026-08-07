# Skill 内部资源路径引用规范

## 核心规则

**SKILL.md 中引用 skill 内部任何资源（scripts/、references/、assets/、templates/、examples/、data/……）时，用相对路径（相对于 skill 目录）或 Markdown 链接。**

依据 agentskills.io 规范，文件引用一律使用相对路径（如 `scripts/extract.py`、`[指南](references/guide.md)`）——以 skill 目录为基准，skill 安装/移动到任何位置都能正确引用自己的内部资源。**禁止 `@path` 语法**（如 `@scripts/foo.ts`）：它不是 agentskills.io 开放规范的一部分，在其他 Agent（Claude Code、Cursor、Windsurf 等）中无法识别。

## 为什么不能硬编码绝对路径 / 依赖 cwd

常见的反模式：

```bash
# 反例 1: 硬编码绝对路径
~/.config/opencode/skills/my-skill/scripts/foo.ts "arg"
~/.config/opencode/skills/my-skill/assets/templates/report.xml

# 反例 2: 假设 cwd 是 skill 目录
./scripts/foo.ts "arg"
./assets/templates/report.xml

# 反例 3: 让 AI 自行拼路径
"请运行 skill 目录下的 scripts/foo.ts"
"读取 skill 内的模板文件"
```

这三种都有问题：

- **反例 1**：skill 移到项目级 `.opencode/skills/` 或插件目录后失效
- **反例 2**：AI 调用 bash 时 cwd 不一定是 skill 目录
- **反例 3**：依赖 AI 推断，不可靠

**反例 4（额外禁令）：`@path` 语法**（如 `@scripts/foo.ts`）——OMO/OpenCode 的私有扩展，不符合 agentskills.io 规范，必须用相对路径或 Markdown 链接替代。

## 合规写法

### 引用 scripts/（命令写法）

```bash
# 调用同目录 scripts/ 下的脚本（相对路径，相对于 skill 目录）
scripts/inspect-apply.ts "<change-name>"

# 调用 scripts/ 子目录的脚本
scripts/utils/parse-input.py --format json
```

### 引用 references/（Markdown 链接）

```markdown
# markdown 链接（推荐）：显示文本可读，链接目标为相对路径

详见 [故障排查指南](references/troubleshooting.md)
```

> 注：markdown 链接里的相对路径按 SKILL.md 所在目录解析，`[guide](references/guide.md)` 在任何安装位置都能工作。

### 引用 assets/

```bash
# 模板
scripts/render.py --template assets/templates/report.xml

# 数据
scripts/analyze.py --data assets/data/sample.csv

# 配置
scripts/start.sh --config assets/config/default.yaml
```

### 引用自定义目录

相对路径对**任何**子目录都生效，不仅限于 `scripts/`、`references/`、`assets/`：

```bash
# 模板
scripts/render.py --template templates/email.html

# 示例
scripts/validate.py --example examples/sample.json

# 数据
scripts/load.py --source data/users.csv
```

## 完整示例

### SKILL.md 中

```markdown
# 3. 执行

**调用**：

\`\`\`bash
scripts/inspect-apply.ts "<change-name>"
\`\`\`

**参数模板**：使用默认 `assets/templates/default-args.json`，如需自定义请参考 [自定义参数说明](references/custom-args.md)。
```

## 速查清单

创建或修改 skill 时检查：

- [ ] SKILL.md 中所有 bash 命令引用 skill 内部资源都用相对路径形式（如 `scripts/foo.ts`、`assets/tmpl.xml`）
- [ ] references 文档一律用 Markdown 链接（`[说明](references/guide.md)`）
- [ ] 没有任何硬编码的绝对路径（`/Users/...` 或 `~/.config/...`）
- [ ] 没有任何 `@scripts/`、`@assets/` 等 `@path` 写法
- [ ] 没有任何 `./xxx` 相对路径（依赖 cwd，不可靠）
- [ ] 文件引用保持一层深度（避免 `references/sub/dir/file.md` 深层嵌套）
- [ ] shebang 行正确（TypeScript/JS 用 `#!/usr/bin/env bun`，Python 用 `#!/usr/bin/env python3`）
- [ ] 脚本文件本身不假设 cwd（用 `__dirname` / `import.meta.url` / `SCRIPT_DIR` 或参数传入）

## 调试技巧

如果引用失效：

1. 检查引用是否写成了硬编码绝对路径（skill 移动后必然失效）
2. 检查引用是否写成了 `@path` 形式（agentskills.io 规范不允许，其他 Agent 无法识别）
3. 检查相对路径是否以 skill 目录为基准（`references/guide.md` 而不是 `./references/guide.md`）
4. 确认被引用的文件确实存在（大小写、扩展名是否一致）
