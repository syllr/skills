# Skill 目录结构规范

## 完整结构

```
skill-name/
├── SKILL.md              # 必选
├── scripts/              # 可选：可执行脚本
│   ├── main.py
│   └── utils.py
├── references/           # 可选：参考文档
│   ├── guide.md
│   └── api-ref.md
├── assets/               # 可选：运行时资源
│   ├── templates/
│   └── data/
└── tests/               # 可选：测试用例
    └── test-cases.md
```

## 各目录用途

### scripts/ — 可执行脚本

**放什么**：Python、Shell、Bash、TypeScript 等可执行脚本

**典型用途**：

- 文件处理（搜索、裁切、转换）
- API 调用封装
- 数据处理
- 确定性重复操作

**调用方式（相对路径，相对于 skill 目录）**：

```bash
# ✅ 正确：相对路径（相对于 skill 目录），skill 在任何安装位置都可用
scripts/template_tool.py search --query "用户需求"

# ❌ 错误：硬编码绝对路径，skill 移动后失效
~/.config/opencode/skills/my-skill/scripts/template_tool.py search --query "用户需求"

# ❌ 错误：依赖 cwd 的 ./ 写法，AI bash 调用的 cwd 不一定是 skill 目录
./scripts/template_tool.py search --query "用户需求"
```

**最佳实践**：

- 主脚本放在根目录，如 `scripts/main.py`
- 工具函数放在 `scripts/utils.py`
- 包含测试文件，如 `scripts/main_test.py`
- **SKILL.md 中调用脚本用相对路径 `scripts/xxx` 形式**

### references/ — 参考文档

**放什么**：Markdown 格式的详细文档

**典型内容**：

- 安装指南
- API 文档
- 工作流详细说明
- 速查表
- 故障排除指南

**调用方式（Markdown 链接，目标为相对路径）**：

```markdown
# ✅ 正确：markdown 链接，目标用相对路径

> 详细说明见 [guide.md](references/guide.md)
```

**最佳实践**：

- 文件名用 kebab-case
- 每个文件应该足够独立，可以单独阅读
- 不要在 references/ 里放代码

### assets/ — 资源文件

**放什么**：模板、数据文件、图片等资源

**典型内容**：

- 代码/文档模板（`.md`、`.xml`、`.json`）
- 预设配置文件
- 示例数据
- 图片等媒体资源

**重要**：不应直接读取，应通过 scripts 脚本访问

**调用方式（相对路径）**：

```bash
# ✅ 正确：脚本用 scripts/ 相对路径，assets 资源用 assets/ 相对路径
scripts/template_tool.py summarize --template assets/templates/report.xml

# ❌ 错误：依赖 cwd 的 ./ 写法，cwd 不一定是 skill 目录
./template_tool.py summarize --template ./assets/templates/report.xml
```

**最佳实践**：

- 模板文件放在 `assets/templates/` 下
- 大文件不要直接放在 assets/，放在子目录
- 不要在 assets/ 里放可执行脚本

### 自定义目录（templates/、examples/、data/ 等）

相对路径机制**不限制目录名**。除了 `scripts/`、`references/`、`assets/` 这三个标准目录外，你可以自由创建自定义子目录（如 `templates/`、`examples/`、`data/`），统一用 `<目录名>/<路径>` 相对路径形式引用：

```bash
# 模板
scripts/render.py --template templates/email.html

# 示例
scripts/validate.py --example examples/sample.json

# 数据
scripts/load.py --source data/users.csv
```

详见 [path-resolution.md](path-resolution.md)。

### tests/ — 测试用例

**放什么**：Markdown 格式的测试用例文档

**典型内容**：

- 触发场景测试
- 边界情况测试
- 预期输入输出
- 验证点清单

**用途**：在 skill 开发完成后，委托测试子代理运行测试用例，验证 skill 是否按预期工作。

**重要**：测试用例不包含在 skill 的触发内容中，仅在测试阶段使用。

---

## 判断是否需要子目录

| 情况                     | scripts/ | references/ | assets/ | tests/ |
| ------------------------ | -------- | ----------- | ------- | ------ |
| 简单 skill，只生成文本   | ❌       | ❌          | ❌      | ❌     |
| 需要执行脚本做确定性操作 | ✅       | ❌          | ❌      | ✅     |
| 需要详细参考文档/手册    | ❌       | ✅          | ❌      | ✅     |
| 需要模板或数据文件       | ❌       | ❌          | ✅      | ✅     |
| 复杂 skill，以上多种     | ✅       | ✅          | ✅      | ✅     |

---

## 安装位置（目标路径）

> ⚠️ **核心原则**:OpenCode 通过**纯文件发现**加载 skill——把 `SKILL.md` 放到合法路径下就**立即生效**,**没有 deploy / install / 注册步骤**。"用户级 vs 项目级"不是互斥的二选一,而是**单一的目标路径选择**:选好路径 → `mkdir -p` + 写文件 → 完成。

### 三类推荐路径

| 类型           | 路径                                 | 适用场景                         | 优先级             |
| -------------- | ------------------------------------ | -------------------------------- | ------------------ |
| **全局通用**   | `~/.config/opencode/skills/<name>/`  | 个人用、所有项目可用、跨项目通用 | 低(易被项目级覆盖) |
| **项目级**     | `<project>/.opencode/skills/<name>/` | 项目专属、需随 Git 共享          | **高**(覆盖全局)   |
| **项目自定义** | `<project>/skills/<name>/` 等        | 项目已有自己的 skill 目录约定    | 取决于项目自身配置 |

### 完整合法路径(供参考,非全部推荐)

OpenCode 实际扫描 6+ 个位置,**后发现的同名 skill 覆盖先发现的**。新建 skill **推荐只用前两个**(.opencode 原生路径),其他是 Claude Code 兼容遗留格式,新 skill 不应放那里:

```
~/.config/opencode/skills/<name>/        ← 全局(推荐)
<project>/.opencode/skills/<name>/        ← 项目级(推荐)
<project>/skills/<name>/                  ← 项目自定义约定(若项目已有)
~/.agents/skills/<name>/                  ← Agents 兼容(遗留,不推荐新建用)
~/.claude/skills/<name>/                  ← Claude 兼容(遗留,不推荐新建用)
<project>/.agents/skills/<name>/          ← 兼容(遗留)
<project>/.claude/skills/<name>/          ← 兼容(遗留)
```

### 选择路径的决策流程

```
开始
  │
  ├─ 这个 skill 是只给当前项目用?
  │    │
  │    ├─ 是 → 项目根目录有 `skills/` 之类的自定义 skill 目录?
  │    │         │
  │    │         ├─ 有 → 用项目自定义路径(询问用户具体路径)
  │    │         │
  │    │         └─ 没有 → 用 `<project>/.opencode/skills/<name>/`
  │    │                  同时检查 `.opencode/` 不在 `.gitignore` 中
  │    │
  │    └─ 否 → 当前用户所有项目都用?
  │              │
  │              └─ 是 → 用 `~/.config/opencode/skills/<name>/`(默认推荐)
  │
  └─ 完成
```

### ⚠️ 常见误区澄清

- ❌ "项目级 → 用户级"需要 deploy:**错**。两者是**平行的两个路径**,选哪个就直接写到哪个,不需要二次复制。
- ❌ "全局 skill 必须先写项目级再升级":**错**。直接写 `~/.config/opencode/skills/<name>/` 就是最终位置。
- ❌ "改名/移动 skill 需要重新安装":**错**。纯文件模型,移动后自动生效。
- ❌ "同名 skill 会冲突报错":**错**。OMO 静默覆盖,后发现的优先。**这是隐藏陷阱**:创建前应检查目标路径是否已有同名 skill(用 `ls ~/.config/opencode/skills/<name> 2>/dev/null` 或 `ls <project>/.opencode/skills/<name> 2>/dev/null`)。

### 同名覆盖规则(高层级覆盖低层级)

```
项目级 .opencode  >  全局 .opencode  >  项目级 .agents/.claude  >  全局 .agents/.claude
```

具体见 OpenCode 源码 `packages/opencode/src/skill/index.ts:173-233` 的 `discoverSkills()` 函数——**`add()` 用 `state.skills[name] = info` 直接覆盖**,后扫描的赢。

---

## 手动复制到目标路径(可选,非 deploy)

如果你已经在某个目录开发好了一个 skill,想把它"搬"到 OpenCode 的合法路径,这就是纯文件复制——**不是 install / deploy**:

```bash
# 把开发目录的内容复制到全局 skill 目录
mkdir -p ~/.config/opencode/skills/<skill-name>
cp -r <source-dir>/* ~/.config/opencode/skills/<skill-name>/

# 或复制到项目级
mkdir -p <project>/.opencode/skills/<skill-name>
cp -r <source-dir>/* <project>/.opencode/skills/<skill-name>/
```

这个 `cp -r` 之后,skill **立即生效**,不需要重启 OpenCode 或运行任何注册命令。
