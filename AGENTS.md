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

## 2. 约定与约束（改任何 skill 前必读）

> 本仓全部全局硬约定/约束集中于此。上方为目录（C1-C9），细则顺次展开；skill 专属约束见 §3。

| #   | 约定                                                                                                   | 检查方式                |
| --- | ------------------------------------------------------------------------------------------------------ | ----------------------- |
| C1  | 引用用相对 Markdown 链接；禁 `@path`/绝对路径/依赖 cwd 的 `./`；scripts/references 相对 Base directory | grep（见 C1）           |
| C2  | 模板正文链接以「生成后 rule 在目标项目中的位置」为基准（目标侧）；skill 自身文档用 skill 侧            | 目标项目内校验（见 C2） |
| C3  | frontmatter 合规（name 与目录名一致、description 含功能+触发词 <1024）                                 | `agentskills validate`  |
| C4  | 模板正文及 frontmatter 禁加粗与 emoji                                                                  | grep + python（见 C4）  |
| C5  | generation 块：字符串全双引号 / 列表项 4 空格扁平（禁嵌套）/ 无孤儿行                                  | python（见 C5）         |
| C6  | 改 skill 必跑 validate；改后 `npx skills update -g` + 重启生效                                         | 命令（见 C6）           |
| C7  | 非 skill 目录勿动；临时产物进 /tmp；skill 目录只放规定文件                                             | find 机检（见 C7）      |
| C8  | SKILL.md <500 行 + 渐进式披露 + 禁死引用                                                               | 人工（见 C8）           |
| C9  | 文档与注释全中文                                                                                       | 人工（见 C9）           |

### C1 引用路径与 Base directory

- `references/` 引用必须用 Markdown 链接相对路径：`[显示文本](references/xxx.md)`，保持一级深度（不嵌套 `references/sub/`）
- `scripts/`、`assets/` 调用用相对路径命令：`scripts/main.py --input data.json`
- 禁止：`@path` 语法（agentskills.io 规范禁止）、硬编码绝对路径（安装位置一变即失效）、依赖 cwd 的 `./xxx`、让 AI「自行查找/拼路径」
- opencode 机制（实测）：skill 激活时自动注入 **Base directory**（安装位置绝对路径），scripts/references 相对路径以其为锚——**不需要也不应该写「探测安装路径」的逻辑**

### C2 链接基准（模板正文 = 目标侧）

- 模板正文（会逐字复制进目标 rule）里的相对链接，一律以**生成后 rule 在目标项目中的位置**为基准（目标侧）；扩展名用目标真实文件名——rule 用 `.md`（不是 `.template.md`），资产用真实相对路径（如 `../test-asset/...`）
- skill 自身文档（`SKILL.md` / `references/README.md` / `assembly.md` / `globs.md` 等，不进入目标项目）里的链接仍以该文件自身位置为基准（skill 侧）
- 范例：模板 `L4/TEST-PLAN.template.md` → 产物 `.omo/rules/docs/L4/TEST-PLAN.md`；正文写 `[test-asset/api-case.md](../test-asset/api-case.md)`（解析为 `.omo/rules/docs/test-asset/api-case.md`）；跨 rule 写 `[API](../../L3/API.md)`（来自 `L2/deep-dives/DEEP-DIVE.md`）
- 检查方式：模板正文链接**不在 skill 本地校验**（目标侧产物），在目标项目内校验；skill 侧文档链接可本地校验

### C3 frontmatter 合规

| 字段                        | 要求                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `name`                      | 必填，小写连字符，与目录名一致（opencode 严格校验匹配）                         |
| `description`               | 必填，含功能 + 触发词，<1024 字符                                               |
| `license` / `compatibility` | 可选                                                                            |
| `metadata`                  | 可选，string-to-string map（值含数组需单引号包成字符串）                        |
| `allowed-tools`             | opencode **不识别**（权限走 `permission.skill` 配置）；写的话只能空格分隔字符串 |

> `license` / `compatibility` / `metadata` / `allowed-tools` 均为可选字段，声明与否不作为合规项——各 skill 间存在差异属正常（`allowed-tools` 在 opencode 不生效，仅兼容 Claude Code 等其他 Agent）。仓库整体 license 为 MIT。

### C4 内容禁令与机检

- `references/rule-templates/**` 与 `skill-templates/**` 正文及 frontmatter 禁用 `**加粗**` 与 emoji（✅/⚠️/箭头全算；glob 通配符 `**`、目录树制表符除外）
- 机检（改模板后必跑）：`grep -rnE '\*\*[^*`]+\*\*' skills/doc-arch-rules/references/rule-templates/`无输出 + emoji 扫描（见下方命令）输出`emoji干净`

### C5 模板 generation 块格式

- `references/rule-templates/**` frontmatter 的 `generation` 块内，**所有字符串一律用双引号包裹**：`tools` / `ask_user` / `flow` / `notes` / `checks` 的每个列表项 + `related` 的每个值，不论是否含特殊字符（统一格式，不靠 YAML 直觉判断）
- 值内含 ASCII `"` 或 `\` 必须转义（`\"` / `\\`）——解析器 `scripts/parse-template.mjs` 对双引号值走 `JSON.parse`，未转义会破坏内容
- 列表项一律 4 空格扁平，禁止嵌套子项——嵌套在 YAML 中非法（block sequence 不能直接跟子序列，编辑器报 `Invalid child element in a block sequence`），且解析器 `parseGeneration` 本就把子项拍平成同级；要分组就把组标题也作为一条列出
- generation 块内不得有无 key 的孤儿行（解析器 `parseGeneration` 会静默丢弃，标准 YAML 也报错）
- 机检（改模板后必跑，作用域限定 frontmatter 的 generation 块）：

```bash
python3 - <<'PY'
import glob, re
bad = []
for p in glob.glob('skills/doc-arch-rules/references/rule-templates/**/*.md', recursive=True):
    L = open(p, encoding='utf-8').read().split('\n')
    if not L or L[0] != '---':
        continue
    try:
        e = L.index('---', 1)
    except ValueError:
        continue
    ing = False
    for i in range(1, e):
        ln = L[i]
        if re.match(r'^generation:\s*$', ln):
            ing = True
            continue
        if ing and re.match(r'^[a-zA-Z_]+:', ln) and not ln.startswith(' '):
            break
        if not ing:
            continue
        if ln.strip() == '' or re.match(r'^\s*#', ln):
            continue
        if re.match(r'^  [a-z_]+:', ln):
            continue
        m = re.match(r'^( *)- (.*)$', ln)
        if m:
            if len(m.group(1)) != 4:
                bad.append(f'{p}:{i + 1} 列表项非 4 空格（禁止嵌套）: {ln.strip()[:30]}')
            elif not m.group(2).startswith('"'):
                bad.append(f'{p}:{i + 1} 列表项未引号')
            continue
        m2 = re.match(r'^(    [^:#]+: )(\s*)(.*)$', ln)
        if m2:
            if not m2.group(3).startswith('"'):
                bad.append(f'{p}:{i + 1} related 值未引号')
            continue
        bad.append(f'{p}:{i + 1} 孤儿行: {ln.strip()[:40]}')
print(bad if bad else 'generation 引号干净')
PY
```

### C6 校验与生效

- 改 skill 后必跑：`uvx --from skills-ref agentskills validate ./skills/<name>`（可执行名是 **agentskills** 不是 skills-ref；`npx skills check` 只是查更新 ≠ 合规校验）；改动已有 skill 前先跑一次作基线（区分既有问题 vs 本次引入）
- **同步与生效**：本仓库（SSOT）改完 → `npx skills update -g` 同步安装副本（`~/.agents/skills/`）→ **重启 opencode 会话生效**——skill 列表是会话启动快照，skill 内容是激活时读取，不同步+重启就还是旧的

### C7 目录与文件纪律

- 不修改 `improve/`、`demo/`、`.omo/`、`.codegraph/` 等非 skill 目录
- **临时产物不进仓库**：截图（Playwright / 视觉 QA / 调试截图等 `*-fullpage.png`）、临时输出、中间文件一律写系统临时目录（`/tmp`、`mktemp -d` 或 `$TMPDIR`），用完即删；禁止落在仓库任何位置（含仓库根、skill 目录）。机检：`find . -maxdepth 2 \( -name '*.png' -o -name '*.jpg' -o -name '*.webp' \) -not -path './node_modules/*'` 应无输出
- skill 目录只放 SKILL.md + references/ + assets/ + scripts/，不混入无关文件（例外：doc-arch-rules 根目录的 `meta.json` 是版本指纹 SSOT，属有意保留）；不在 skill 中写真实密码/token/敏感主机信息

### C8 SKILL.md 精简与渐进式披露

- SKILL.md 精简（<500 行）+ 渐进式披露：核心工作流在 SKILL.md，详参下沉 `references/`（Markdown 链接指向）；references 可本地化官方资料（c4-container-diagram 为范例，更新命令见其 README，上游 master）
- SKILL.md 内禁止死引用（不存在的章节号/reference 文件）；改 skill 后同步其 `references/README.md`（如有文件清单）

### C9 中文文档与注释

- 文档与注释全部使用中文（技术术语/命令/路径保留原文）

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
