# PROJECT KNOWLEDGE BASE

Generated: 2026-09-09
Role: 创建与优化 Agent Skills 的仓库（vercel-labs/skills 生态）。本项目只负责 skill 的开发/迭代/格式校验；将 skill 安装到 opencode 等 Agent 由用户自行执行，AI 不代装。

---

## 1. 项目定位与职责边界

维护一组自包含的 Agent Skills（每个 skill = 一个目录，含 `SKILL.md` + 可选 `references/`/`assets/`/`scripts/`），语言：中文文档。核心能力分两类：

- **独立能力 skill**：c4-container-diagram（画图）、gitee-comments（评审评论）、remote-shell（远程执行）、score-prompt（prompt 评分）、skill-creator（造 skill）
- **meta skill**：doc-arch-rules——负责「生成/管理/更新 rule」与「生成/管理/更新 skill」：持有 21 个文档模板（→ 目标项目 `.omo/rules/docs/` 的 rule）与 3 个域 skill 模板（→ 目标项目 `.opencode/skills/` 的 test-ops / deploy-ops / docs-align）

**关键边界**：三个域 skill（test-ops / deploy-ops / docs-align）是 **meta skill 在目标项目生成的产物，不在本仓库**——本仓库只有它们的模板（`doc-arch-rules/references/skill-templates/`）。

**职责边界**：本项目只做「创建 / 优化 / 校验」；安装到 Agent（`npx skills add`）由用户自行执行，AI 不代装。

---

## 2. 全仓注意事项（改任何 skill 前必读）

### 引用规范（核心约定）

- `references/` 引用必须用 Markdown 链接相对路径：`[显示文本](references/xxx.md)`，保持一级深度（不嵌套 `references/sub/`）
- `scripts/`、`assets/` 调用用相对路径命令：`scripts/main.py --input data.json`
- 禁止：`@path` 语法（agentskills.io 规范禁止）、硬编码绝对路径（安装位置一变即失效）、依赖 cwd 的 `./xxx`、让 AI「自行查找/拼路径」
- opencode 机制（实测）：skill 激活时自动注入 **Base directory**（安装位置绝对路径），scripts/references 相对路径以其为锚——**不需要也不应该写「探测安装路径」的逻辑**

### frontmatter 合规

| 字段                        | 要求                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `name`                      | 必填，小写连字符，与目录名一致（opencode 严格校验匹配）                         |
| `description`               | 必填，含功能 + 触发词，<1024 字符                                               |
| `license` / `compatibility` | 可选                                                                            |
| `metadata`                  | 可选，string-to-string map（值含数组需单引号包成字符串）                        |
| `allowed-tools`             | opencode **不识别**（权限走 `permission.skill` 配置）；写的话只能空格分隔字符串 |

> `license` / `compatibility` / `metadata` / `allowed-tools` 均为可选字段，声明与否不作为合规项——各 skill 间存在差异属正常（`allowed-tools` 在 opencode 不生效，仅兼容 Claude Code 等其他 Agent）。仓库整体 license 为 MIT。

### 内容禁令与机检

- `references/rule-templates/**` 与 `skill-templates/**` 正文及 frontmatter 禁用 `**加粗**` 与 emoji（✅/⚠️/箭头全算；glob 通配符 `**`、目录树制表符除外）
- 机检（改模板后必跑）：`grep -rnE '\*\*[^*`]+\*\*' skills/doc-arch-rules/references/rule-templates/`无输出 + emoji 扫描（见下方命令）输出`emoji干净`

### 校验与生效

- 改 skill 后必跑：`uvx --from skills-ref agentskills validate ./skills/<name>`（可执行名是 **agentskills** 不是 skills-ref；`npx skills check` 只是查更新 ≠ 合规校验）；改动已有 skill 前先跑一次作基线（区分既有问题 vs 本次引入）
- **同步与生效**：本仓库（SSOT）改完 → `npx skills update -g` 同步安装副本（`~/.agents/skills/`）→ **重启 opencode 会话生效**——skill 列表是会话启动快照，skill 内容是激活时读取，不同步+重启就还是旧的

### 目录与文档纪律

- 不修改 `improve/`、`demo/`、`.omo/`、`.codegraph/` 等非 skill 目录
- 文档与注释全部使用中文（技术术语/命令/路径保留原文）
- **临时产物不进仓库**：截图（Playwright / 视觉 QA / 调试截图等 `*-fullpage.png`）、临时输出、中间文件一律写系统临时目录（`/tmp`、`mktemp -d` 或 `$TMPDIR`），用完即删；禁止落在仓库任何位置（含仓库根、skill 目录）。机检：`find . -maxdepth 2 \( -name '*.png' -o -name '*.jpg' -o -name '*.webp' \) -not -path './node_modules/*'` 应无输出
- skill 目录只放 SKILL.md + references/ + assets/ + scripts/，不混入无关文件（例外：doc-arch-rules 根目录的 `meta.json` 是版本指纹 SSOT，属有意保留）；不在 skill 中写真实密码/token/敏感主机信息
- SKILL.md 精简（<500 行）+ 渐进式披露：核心工作流在 SKILL.md，详参下沉 `references/`（Markdown 链接指向）；references 可本地化官方资料（c4-container-diagram 为范例，更新命令见其 README，上游 master）
- SKILL.md 内禁止死引用（不存在的章节号/reference 文件）；改 skill 后同步其 `references/README.md`（如有文件清单）

---

## 3. 各 skill 概览与注意事项

### doc-arch-rules（meta skill）

**定位**：rule 与 skill 生成器（单一功能，无关键字分诊）——从模板全量更新目标项目两类产物：①`.omo/rules/docs/` 全部 omo rule ②`.opencode/skills/` 三个域 skill（test-ops / deploy-ops / docs-align）。触发即全量同步；文档-代码对齐/漂移修复/文档初始化/globs 目录同步**完全独立**（docs-align skill 承担，本 skill 不承载不路由——用户要文档对齐、处理漂移、初始化文档、更新globs 时直接调 docs-align）。

**结构**：`references/rule-templates/`（1 宪法源 + 21 文档模板，产物 `.omo/rules/docs/`）+ `references/rule-assets/test-asset/`（附属资产目录，独立于模板树——卡模板/工具规范/参考实现，随 TEST-PLAN rule **无脑覆盖**同步到目标项目 `.omo/rules/docs/test-asset/`，非模板不参与解析/指纹）+ `references/skill-templates/`（test-ops / deploy-ops / docs-align 三份 SKILL.template.md 薄壳模板，产物目标项目 `.opencode/skills/`，逐字落地）+ `references/assembly.md`（rule 组装 SSOT，改它 = implHash 刷新全量 rule 重生成）+ `references/globs.md`、`diagram-spec.md` + `scripts/parse-template.mjs`（解析/校验/指纹，零依赖）。

**注意**：

- 更新语义三分：rule 按版本指纹（`--check-meta` → 需更新才重生成，最新跳过）；**rule-assets/ 无脑覆盖**（资产 = skill 侧模板副本，无项目侧手工改动语义，整目录直接覆盖不询问）；skill 薄壳逐字落地（已有产物先 diff 项目侧手工改动确认再覆盖）
- 版本指纹 `meta.json`（version/implHash/templates）——**只在用户显式要求时 `--gen-meta`**，AI 不得触碰；用户手工改过的 rule 指纹不会覆盖（设计意图）
- docs-align 相关职责（对齐流水线/globs 双向同步/漂移分诊）已完全移出本 skill——SKILL.md 不含这些流程
- case 生成纪律（API 卡断言三源）：状态码只从 openapi `responses` 取、字段从 ErrorResponse schema 取、具体错误码实测校准（模式 `BAD_REQUEST`/`RULE_VIOLATION_R<N>`）

### c4-container-diagram

**定位**：用 D2 画 C4 Container Diagram（c4model.com 标准第 2 层图），Markdown 内嵌 d2 代码块渲染。

**注意**：`references/` 含 4 个 D2 官方文档本地化（containers/connections/grid-diagrams/elk）+ 7 个自研参考（c4-container-spec/layout-and-grid/connection-routing/d2-syntax-cheatsheet/troubleshooting/templates/diagram-review）+ README 清单，共 12 个 .md（官方本地化更新命令见其 README，上游 master）；SKILL.md 已按渐进式披露拆为 232 行（本仓范例）；画图前先以 ASCII 架构图与用户确认。

### gitee-comments

**定位**：管理 Gitee 仓库提交（commit）的评审评论——程序化记录评审意见、列未解决待办、回复线程、解决/删除。

**注意**：单 SKILL.md；依赖 Gitee 仓库留痕机制（AI 与团队共用）。

### remote-shell

**定位**：SSH 在远程服务器执行命令，优先 `remote-shell` CLI，支持降级回退。

**注意**：SKILL.md + `references/cli-reference.md`（CLI 主机管理/配置格式）；远程执行规则见 `.config/opencode/rules/remote-shell-execution.md`（exit code 精确降级，禁止凭经验跳 sshpass）。

### score-prompt

**定位**：对任意 LLM prompt/文档跑 5 维度质量评分（Clarity/Conciseness/Actionability/Consistency/Minimal-slop）并迭代修复至目标分。

**注意**：单 SKILL.md；默认目标 90 分，可 `target_score` 覆盖。

### skill-creator

**定位**：创建新 OpenCode Skill——`npx skills init skills/<name>` 或按其流程手写。

**注意**：`references/` 含 8 篇（skill-md-format / directory-structure / path-resolution / script-language-guide + guide / api-ref / custom-args / troubleshooting 四篇写法示例，全清单见 SKILL.md 索引）——**改任何 skill 前先读 skill-md-format.md**；`assets/templates/` 含 5 个骨架 + 3 个脚本模板（清单见 SKILL.md）。

---

## 4. opencode skill 机制要点

以下条目均经实测与源码确认：

- `.opencode/skills/` 是**第一顺位项目级目录**（官方文档 + 源码确认），从 cwd 向上找到 git worktree 自动加载；每个 skill 自动注册为 `/<skill-name>` 斜杠命令 + agent 按 description 自动触发
- `opencode debug skill` 的输出**不完整不可信**（漏列大量实际可用的 skill，含 doc-arch-rules 自身）——验证一律用重启会话看斜杠列表
- frontmatter 只认 name/description/license/compatibility/metadata；权限走 `permission.skill` 配置

---

## 5. 命令速查

```bash
# 列出所有 skill
find skills -name "SKILL.md" | sort

# 创建新 skill
npx skills init skills/<skill-name>

# 合规校验（agentskills.io 官方 skills-ref，uvx 一次性运行）
uvx --from skills-ref agentskills validate ./skills/<skill-name>
for d in skills/*/; do uvx --from skills-ref agentskills validate "$d" || echo "!! FAIL: $d"; done

# doc-arch-rules 脚本（相对路径以 skill 激活时注入的 Base directory 为锚）
node scripts/parse-template.mjs --all
node scripts/parse-template.mjs --check <rule路径> <模板路径>
node scripts/parse-template.mjs --gen-meta [--set-version X.Y.Z]      # 仅用户显式触发
node scripts/parse-template.mjs --check-meta <项目meta路径>
node scripts/parse-template.mjs --update-project-meta <项目meta> <DOC> <v> <h> <th>

# 同步到已安装副本（用户自行执行；同步后重启 opencode 生效）
npx skills update -g

# 加粗/emoji 机检（改模板后必跑；grep 应无输出，python 应输出 emoji干净）
grep -rnE '\*\*[^*`]+\*\*' skills/doc-arch-rules/references/rule-templates/ skills/doc-arch-rules/references/skill-templates/
python3 -c "import glob;hit=[f'{p}:{i}' for p in glob.glob('skills/doc-arch-rules/references/*-templates/**/*.md',recursive=True) for i,l in enumerate(open(p,encoding='utf-8'),1) for ch in l if '\U0001F300'<=ch<='\U0001FAFF' or 0x2705<=ord(ch)<=0x27BF];print(hit if hit else 'emoji干净')"
```

---

## 附：目录结构

```
skills/
├── c4-container-diagram/  # D2 画 C4 图 + references/（4 官方文档本地化 + 7 自研参考 + README 清单）
├── doc-arch-rules/        # meta skill：rule/skill 生成（结构见其「skill 模板」与「文件清单」节）
├── gitee-comments/        # Gitee 评审评论（单 SKILL.md）
├── remote-shell/          # SSH 远程执行（SKILL.md + references/cli-reference.md）
├── score-prompt/          # prompt 评分（单 SKILL.md）
└── skill-creator/         # 创建新 skill + references/（guide 等五篇）+ assets/templates/
improve/                   # 研究笔记（非 skill，勿动）
demo/                      # doc-arch-rules 演示样例（非 skill）
README.md                  # 面向用户的安装/技能表
```

> 生成产物去向（不在本仓库）：三个域 skill（test-ops / deploy-ops / docs-align）→ 目标项目 `.opencode/skills/`；rule → 目标项目 `.omo/rules/docs/`。
