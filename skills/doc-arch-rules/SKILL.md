---
name: doc-arch-rules
description: >
  文档架构规范（L0-L4 + common 分层），两种使用入口：①生成/更新 rule（关键字 init / 初始化 / 生成rule / 生成文档规范——从模板生成 .omo/rules/docs/ 下的 omo rule，已有 rule 时按版本指纹按需更新）；
  ②对齐（默认，/doc-arch-rules 无关键字——一条龙：先按版本指纹检查并更新过期 rule，再检测 docs/ 文档与代码的漂移并以代码为准修复文档，遵守 rule，走宪法差异分诊）。
  内部机制：版本指纹 meta.json（version + implHash + templates hash）对比判定 rule 是否需要更新，避免 AI 随机性导致的无差别覆盖。
  仅用户手动调用时触发，不自动触发；仅操作 .omo/rules/docs/ 与 docs/ 文档，不生成业务代码。
---

# doc-arch-rules — 文档架构规范与 omo rule 生成

## 简介

本 skill 承载一套**文档架构规范**（基于 TOGAF 分层：L0 决策 → L1 产品 → L2 架构 → L3 契约 → L4 交付 + common 贯穿层），提供**两种使用入口**（内含三个内部能力：生成 rule / rule 更新检查 / 文档-代码漂移检测与修复）：

- **入口① 生成/更新 rule**（关键字 `init`）：把规范落地到具体项目——生成/按需更新 `.omo/rules/docs/` 下的 omo rule
- **入口② 对齐（默认）**：一条龙——检查并更新过期 rule（功能 2）→ 检测并修复文档-代码漂移（功能 3）

**rule 工厂**（功能 1）的输入输出：

- 输入：`references/templates/` 下模板（1 个全局 Rule 源 + 16 个模板，清单见 [§文件清单](#文件清单模板-ssot)）
- 输出：`.omo/rules/docs/` 下的 rule（一个模板对应一个 rule，目录结构与 `references/templates` 同构，含 `L2/deep-dives/` + `L2/research/`）
- **除 DEEP-DIVE/RESEARCH 目录级通配外，其余 1:1 同构**；目录级模板按 globs 通配覆盖，详见表
- **只生成 rule，不生成文档**：宿主项目 `docs/**` 由 rule 触发后的 AI 按 rule 内容生成/更新

**两种文件模式**：

| 文件类型                                               | 是什么       | rule 内容                                                                                                                                        | 触发方式               |
| ------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **无 `.template` 后缀**（`templates/CONSTITUTION.md`） | 全局 Rule 源 | frontmatter（抄 omo：`description + alwaysApply: true`）+ **文件全文**                                                                           | `alwaysApply` 全局注入 |
| **有 `.template` 后缀**（16 个）                       | 模板         | frontmatter（抄 omo：`description + globs`）+ **四节正文**（内联翻译 generation）+ **「模板」章节**（模板 Markdown 正文，剥离 YAML frontmatter） | `globs`                |

## 何时使用（仅手动触发）

**只有三种分诊结果**——功能 2/3 不是独立入口，而是只读/对齐流水线的组成阶段：

| 分诊结果             | 触发关键词                                                                    |
| -------------------- | ----------------------------------------------------------------------------- |
| **① 生成/更新 rule** | `init` / `初始化` / `生成rule` / `生成文档规范`（"重建 <DOC>"强制重生成单个） |
| **② 只读检查**       | "…需要更新吗" / "检查一下" / "看看有没有漂移"                                 |
| **③ 对齐（默认）**   | `/doc-arch-rules` 无关键字                                                    |

> 详细路由见下方「分诊决策树」（权威流程）与「信号判定细则」（边界情况）。

## 功能分诊（进入 skill 的第一件事）

**自动判断是默认，问用户只是 fallback**（实在分不清才问）。路由两层：skill 激活靠 frontmatter `description` 匹配；激活后按关键字路由到两个方向（init / 非 init），非 init 再分疑问（只读）与默认（对齐）两种结果。

### 分诊决策树（三种结果）

```
用户输入
├─ 含 init 关键字（init / 初始化 / 生成rule / 生成文档规范）
│    → 分诊结果①：生成/更新 rule（功能 1）
│    ├─ 项目无 .omo/rules/docs/ → 全量生成
│    ├─ 已有 rule + 显式说"全部/重建" → rebuild（全量重建）
│    ├─ 已有 rule + 指定单个（"重建 <DOC>"，如"重建 DOMAIN-MODEL"）→ 强制重生成该 rule
│    └─ 已有 rule（默认）→ check 指纹 → 按需 update（只重生成需更新的；全最新则告知无需更新）
│
├─ 疑问/检查意图（"rule 需要更新吗" / "检查一下" / "看看有没有漂移"）
│    → 分诊结果②：只读检查（不写任何文件）
│    ├─ rule 指纹 check（--check-meta，功能 2 阶段）→ 输出三态表
│    ├─ 文档-代码漂移机检（功能 3 阶段 2 的机检部分）→ 输出漂移清单
│    └─ 汇总报告，等待用户决定是否进入动手模式
│
└─ 无 init 关键字且非疑问句（默认：/doc-arch-rules 啥都不带）
     → 分诊结果③：对齐流水线（一条龙，动手）
     ├─ 阶段 0 · 只读摸底（先跑出清单：`--check-meta` 三态表 + 漂移机检——均只读，不写文件）
     ├─ ⏸ 范围确认（把清单给用户看：哪些 rule 需更新、哪些文档需修、跳过哪些；确认后进入阶段 1/2，拒绝则退回只读）
     ├─ 阶段 1 · 确认后按需 update（重生成「需更新」的 rule + 刷新项目 meta）
     ├─ 阶段 2 · 确认后以代码为准修文档（遵守 rule；疑似 Bug 停下问用户）
     └─ 输出总报告：rule 更新了哪些 + 文档修了哪些 + 待用户裁决项
```

### 信号判定细则

| 维度            | 判定                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **init 关键字** | `init` / `初始化` / `生成rule` / `生成文档规范` → 分诊结果①；"重建 <DOC>"（指定单个文档）→ 结果①强制重生成该 rule           |
| **疑问/检查句** | "…需要更新吗" / "检查一下" / "看看有没有漂移" / "看看要不要更新" → 分诊结果②（只读，不写文件）                              |
| **默认**        | 无 init 关键字且非疑问句（`/doc-arch-rules` 空参）→ 分诊结果③（对齐流水线，动手）                                           |
| **安全默认**    | 结果①已有 rule 时走 check → update（不做无差别全量覆盖）；rebuild 必须显式说"全部/重建"；结果③动手前必须经过范围确认        |
| **范围确认**    | 结果① update / 结果③ 修文档前把清单给用户看（更新哪些、跳过哪些、疑似 Bug 哪些），确认后动手；用户可在此拒绝，退回只读结果② |
| **fallback**    | 带 init 关键字但又像在做别的 / 意图混合（如"更新 rule 然后检查漂移"）→ 问用户确认                                           |

> **两个检查维度正交**：功能 2 检测 **rule 版本级漂移**（rule vs skill/模板指纹——AI 随机性与模板变更）；功能 3 检测 **文档内容级漂移**（文档 vs 代码，走宪法 S5 差异分诊）。默认流水线把两者串起来，用户一次调用即完成全部对齐。

## 文件清单（模板 SSOT）

源文件位于 `references/templates/`：**1 个全局 Rule 源（CONSTITUTION，无后缀）+ 16 个模板（.template 后缀，含 L2/deep-dives + L2/research 子目录）**。

| 层            | 文件                                                                                     | 类型         | rule 输出                                                                                                                                                                    | 触发方式              |
| ------------- | ---------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| CONSTITUTION  | [CONSTITUTION](references/templates/CONSTITUTION.md)（无后缀）                           | 全局 Rule 源 | .omo/rules/docs/CONSTITUTION.md                                                                                                                                              | alwaysApply           |
| L1            | [README](references/templates/L1/README.template.md)                                     | 模板         | .omo/rules/docs/L1/README.md                                                                                                                                                 | globs（根 README.md） |
| L1            | [PRODUCT](references/templates/L1/PRODUCT.template.md)                                   | 模板         | .omo/rules/docs/L1/PRODUCT.md                                                                                                                                                | globs                 |
| L1            | [USER-STORY](references/templates/L1/USER-STORY.template.md)                             | 模板         | .omo/rules/docs/L1/USER-STORY.md                                                                                                                                             | globs                 |
| L2            | [APPLICATION-ARCHITECTURE](references/templates/L2/APPLICATION-ARCHITECTURE.template.md) | 模板         | .omo/rules/docs/L2/APPLICATION-ARCHITECTURE.md                                                                                                                               | globs                 |
| L2            | [DOMAIN-MODEL](references/templates/L2/DOMAIN-MODEL.template.md)                         | 模板         | .omo/rules/docs/L2/DOMAIN-MODEL.md                                                                                                                                           | globs                 |
| L2            | [TECHNOLOGY-ARCHITECTURE](references/templates/L2/TECHNOLOGY-ARCHITECTURE.template.md)   | 模板         | .omo/rules/docs/L2/TECHNOLOGY-ARCHITECTURE.md                                                                                                                                | globs                 |
| L2/deep-dives | [INDEX](references/templates/L2/deep-dives/INDEX.template.md)                            | 模板         | .omo/rules/docs/L2/deep-dives/INDEX.md                                                                                                                                       | globs                 |
| L2/deep-dives | [DEEP-DIVE](references/templates/L2/deep-dives/DEEP-DIVE.template.md)                    | 模板         | .omo/rules/docs/L2/deep-dives/DEEP-DIVE.md（目录级通配，globs: docs/L2/deep-dives/*.md 覆盖目录下多文档，物理单 rule）                                                       | globs                 |
| L2/research   | [RESEARCH](references/templates/L2/research/RESEARCH.template.md)                        | 模板         | .omo/rules/docs/L2/research/RESEARCH.md（目录级通配，globs: docs/L2/research/*.md 覆盖目录下多文档，物理单 rule，独立成篇无索引；无 INDEX，区别于 deep-dives 的 INDEX 管理） | globs                 |
| L3            | [API](references/templates/L3/API.template.md)                                           | 模板         | .omo/rules/docs/L3/API.md                                                                                                                                                    | globs                 |
| L3            | [INTEGRATION](references/templates/L3/INTEGRATION.template.md)                           | 模板         | .omo/rules/docs/L3/INTEGRATION.md                                                                                                                                            | globs                 |
| L4            | [DEPLOYMENT](references/templates/L4/DEPLOYMENT.template.md)                             | 模板         | .omo/rules/docs/L4/DEPLOYMENT.md                                                                                                                                             | globs                 |
| L4            | [TEST-PLAN](references/templates/L4/TEST-PLAN.template.md)                               | 模板         | .omo/rules/docs/L4/TEST-PLAN.md                                                                                                                                              | globs                 |
| common        | [CODE-GUIDE](references/templates/common/CODE-GUIDE.template.md)                         | 模板         | .omo/rules/docs/common/CODE-GUIDE.md                                                                                                                                         | globs                 |
| common        | [GLOSSARY](references/templates/common/GLOSSARY.template.md)                             | 模板         | .omo/rules/docs/common/GLOSSARY.md                                                                                                                                           | globs                 |
| common        | [STRUCTURE](references/templates/common/STRUCTURE.template.md)                           | 模板         | .omo/rules/docs/common/STRUCTURE.md                                                                                                                                          | globs                 |

> **DATA-ARCHITECTURE 已合并**进 DOMAIN-MODEL（§5 数据设计），不生成 rule。
> **模板 frontmatter 的 `generation` 块**（tools/related/ask_user/flow/notes/checks）是 rule 对应目标文档（`docs/**` 下由 `globs` 指定的路径）的生成提示词，仅模板持有——生成 rule 时**内联翻译**进正文四节，不保留 YAML 形态。[^scan]

## 执行流程：生成 rule（AI 主流程）

### 步骤 1：解析模板

读取每个模板，解析三部分：

- **omo 字段**（rule frontmatter 用）：`description` + `alwaysApply`/`globs`
- **generation 块**（正文四节用）：`tools`/`related`/`ask_user`/`flow`/`notes`/`checks`
- **模板正文**（「模板」章节用）：剥离 YAML frontmatter 后的 Markdown 正文

> 可用脚本辅助解析（见「脚本用法」）：`node <skill>/scripts/parse-template.mjs <模板路径>` 输出 JSON（`omo` + `generation` + `content`），避免手读 YAML 出错。

### 步骤 2：组装 rule

> **组装细则（占位符映射 / 模式 A+B 模板 / 内容纯净·三层处置 / 完成判定机器校验）见 [references/assembly.md](references/assembly.md)**——本步骤按 assembly.md 执行：读模板 generation → 按占位符映射替换 → 按模式 A/B 组装四节正文 + 「模板」章节 → 遵守组装硬约束。assembly.md 是组装逻辑 SSOT，修改它 = implHash 刷新（全部 rule 需重新生成）。

### 步骤 3：落盘校验

- 批量写入 `.omo/rules/docs/<路径>`（CONSTITUTION.md 在根；其余在 `<层>/<DOC>.md`，含 `L2/deep-dives/<name>.md` + `L2/research/<name>.md`）
- **rule 落盘校验**（本步骤对象）：frontmatter 与模板 omo 一致；rule 内不含 `generation:` YAML 块；「模板」章节正文与模板正文一致——用 `--check <rule> <模板>` 逐 rule 复核（批量用 `--all` 解析全部模板拿清单后循环调用）
- **宿主文档单链校验（顺带，属功能 3 机检对象，非 rule 校验）**：生成 rule 后顺带检查宿主项目 `docs/` 文档的单链一致性——L2 三总览与 `deep-dives/INDEX` 单链（各节有且仅有一处 `详见 deep-dives/`）、`research` 结论链 ADR。示例：`grep -rn "详见 deep-dives/" docs/L2/*.md | wc -l` 应为 3；`grep -rn "详见 research/" docs/L2/*.md | wc -l` 应为 2

---

## 功能 2：rule 更新检查（版本指纹）

> **解决的问题**：AI 组装 rule 有随机性——即使 skill 与模板都没变，两次生成的 rule 措辞也不同。所以「rule 是否需要更新」**不能靠全文 diff**（会把措辞差异误报为漂移），要靠**版本指纹对比**：随机性只影响措辞不影响信息，只要指纹一致就无需更新。
> **入口语义**：本功能承载分诊结果③的 rule 检查与更新（决策树阶段 0 的 `--check-meta` 摸底 + 阶段 1 的按需 update）；分诊结果①（init）已有 rule 时也先走本功能的 check 再按需 update。

### 机制：两份 meta.json + 逐条目对比

- **skill 侧 `<skill>/meta.json`**（自述版本，SSOT）：`{ version, implHash, templates, generatedAt }`
  - `version`：发布标记，**仅用户显式触发 `--gen-meta` 时递增**（push/commit 与版本更新无耦合——没 bump = 没发布，项目侧感知不到是正确行为）
  - `implHash`：assembly.md + SKILL.md + scripts/ 的内容指纹（组装逻辑全部输入）——区分 version 变更原因（implHash 变 = 组装逻辑变，影响全部 rule；implHash 不变 = 仅模板变，按模板粒度跳过）
  - `templates`：每个模板的内容指纹
- **项目侧 `<项目>/.omo/rules/docs/meta.json`**（生成时快照）：`{ rules: { "<DOC>": { version, implHash, templateHash } } }`——**按 rule 记条目**（不同 rule 可能不同版本生成），生成/更新某个 rule 时只更新该条目
- **对比（`--check-meta`，纯字段比对，无 AI 参与、无随机性）**：逐 rule 条目——缺失 → 需更新；implHash 变 → 需更新（影响全部）；templateHash 变 → 需更新；均同 → **最新（即使 version 标记不同，内容未变即跳过重生成）**
- **⚠️ 检测边界（指纹机制只回答"skill/模板是否变了"，不回答"组装质量"与"手工修改"）**：
  - **用户手工修改 rule**（改触发条件措辞/删节）→ 指纹不变，check 判定仍为最新、不会自动覆盖——**这是设计意图（防误覆盖）**；如需强制重生成请显式说"重建 <DOC>"
  - **组装质量**（AI 组装漏 generation 条目/曲解字段）→ 指纹不变；落盘 `--check` 只校验 frontmatter/无 generation YAML/模板章节，**四节正文信息完整性无机器闭环**——依赖落盘时 AI 自检（见功能 1 步骤 2 硬约束）

### 三种内部模式（对用户只暴露入口；check 是默认第一步）

| 模式                                  | 触发                    | 动作                                                                                                                                       |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **check**（默认第一步，只报告不动手） | 用户问"rule 需要更新吗" | 跑 `--check-meta`，输出三态表（最新/需更新/异常+原因），**不写任何文件**                                                                   |
| **update**（按需更新）                | 用户确认更新            | 只重新生成 check 判定「需更新」的 rule（按功能 1 流程），**「最新」的绝不覆盖**；每更新一个，用 `--update-project-meta` 刷新项目 meta 条目 |
| **rebuild**（全量重建）               | 用户显式要求全量重建    | 批量重新生成全部 rule 并重建项目 meta（首版落地或用户明确要求时才用）                                                                      |
| **重建单个**（强制重生成某 rule）     | 用户显式说"重建 <DOC>"  | 忽略指纹直接按模板重生成该 rule（用于用户手工改坏/想重置时），重写项目 meta 对应条目                                                       |

### 脚本命令

> 完整命令清单见 [§脚本用法](#脚本用法解析工具可选)；本功能涉及三条：`--gen-meta`（用户显式触发，bump version + 刷新指纹，禁止自动钩子调用）、`--check-meta <项目meta>`（对比报告，退出码 0=全部最新 / 1=有需更新 / 2=配置错误）、`--update-project-meta`（rule 落盘后写项目 meta 条目，见下）。

> 生成/更新 rule 落盘时，用 `--update-project-meta <项目meta> <DOC> <version> <implHash> <templateHash>` 写入项目 meta 对应条目——`version`/`implHash`/`templateHash` 从 skill 侧 `<skill>/meta.json` 读取（本 skill 当前自述版本；implHash 见其 implHash 字段；templateHash 见其 templates[<DOC>] 字段）。确定性脚本替代手工写 JSON 防写错——这是 check 的数据来源。

---

## 功能 3：文档-代码漂移检测与修复（drift）

> **定位**：宪法 §2.2 差异分诊（S5）的 skill 化执行器——规则基础全部已存在（S1 代码是唯一事实 / S5 四步分诊 / S4 主动修复 / S7 文档与代码同交付），本功能把它们变成**可重复调用的系统化流程**。**以代码为准修复文档，修复时遵守对应 rule**（等价于按 rule 重新生成受影响部分）。

**触发**：用户手动要求——"检查文档和代码有没有漂移"（疑问 → 分诊② 只读机检）/ "以代码为准修文档" / "docs 和代码对齐"（命令 → 分诊③ 对齐流水线阶段 2）。

### 四阶段流程

**阶段 1 · 盘点**：读 `.omo/rules/docs/` 全部 rule 的 globs → 文档清单；每份文档标注机检点（见下表）。

**阶段 2 · 机检**（AI 用 grep/ls/diff 按清单执行；一期无独立脚本）：

| 机检点                                                 | 方法                         |
| ------------------------------------------------------ | ---------------------------- |
| 文档内 File:Line 引用有效性                            | 文件存在 + grep 符号存在     |
| STRUCTURE 目录树 vs 实际目录                           | diff 目录树与 `ls -R`        |
| openapi.yaml 端点数 vs API.md 头注释计数 vs 代码路由数 | 三方计数对比                 |
| 交叉引用死链（文档 A 引 文档 B §X，B 无该节）          | grep 目标文档章节标题        |
| PRODUCT 能力行 ↔ DOMAIN Action 清单双向对齐            | 交叉 grep 能力名/Action 名   |
| DOMAIN 签名草图 vs 代码函数签名                        | grep `def`/`func` 匹配签名表 |

**阶段 3 · AI 语义核对**（机检检不出的）：逐文档读代码对照文档陈述（行为/规则/流程/约束），列差异清单。

**阶段 4 · 分诊修复**（严格走宪法 S5 四步，执行序 ①→④判定→②→③）：

- ① 自动化优先 → ② 默认**以代码为准**修文档（按对应 rule 重新生成受影响节，修后跑该 rule 的 checks 验证）
- ④ **唯一例外 = Bug**（代码偏离文档真实意图）→ **停下问用户裁决**：用户认可才修代码；不认可则按文档为准改文档
- **⚠️ 手工修改文档保护**：修复前用 `git status`/`git diff` 检查目标文档是否含**用户手工修改**（非 AI 生成/上次 rule 产物）；手工修改的文档在范围确认清单中**单独列出并单独确认**，避免以代码为准覆盖丢失用户内容

**输出报告**：漂移清单（文件:位置 / 差异 / 判定：漂移或疑似 Bug / 处置：已修或待用户裁决）。

> **边界**：本功能只检测与修复 `docs/**` 文档（rule 覆盖范围）；不修代码（疑似 Bug 交用户裁决）；不自动 commit/push。

---

## 脚本用法（解析工具，可选）

脚本只做**解析/校验/指纹**，不组装 rule；组装由 AI 按本 SKILL 流程完成。

```bash
node <skill>/scripts/parse-template.mjs <模板路径>            # 解析单个模板，输出 JSON：{omo, target, generation, content}
node <skill>/scripts/parse-template.mjs --all                 # 解析全部模板，输出 JSON 数组
node <skill>/scripts/parse-template.mjs --check <rule路径> <模板路径>  # 校验 rule（frontmatter 一致 + 无 generation YAML + 模板章节正文一致 + notes/checks 条目数对齐）
node <skill>/scripts/parse-template.mjs --gen-meta [--set-version X.Y.Z]  # 生成/刷新 skill 侧 meta.json（用户显式触发，见功能 2）
node <skill>/scripts/parse-template.mjs --check-meta <项目meta路径>       # rule 更新检查三态表（见功能 2）
node <skill>/scripts/parse-template.mjs --update-project-meta <项目meta> <DOC> <version> <implHash> <templateHash>  # 写项目 meta 单条目（rule 落盘后用）
```

> `<skill>` 为 skill 实际安装路径（全局 `~/.config/opencode/skills/doc-arch-rules` 或项目级 `.opencode/skills/doc-arch-rules`），可先探测：

```bash
skill=$(ls -d ~/.config/opencode/skills/doc-arch-rules .opencode/skills/doc-arch-rules 2>/dev/null | head -1)  # 探测 skill 实际安装路径，供 <skill> 占位使用
test -n "$skill" || echo "未找到 skill（未安装或路径不符，请手动指定 <skill>）"
```

## 硬性要求

- **SSOT**：模板是 rule 的唯一来源；`references/templates/` 目录结构 = `.omo/rules/docs/` 目录结构
- **rule 内禁止 YAML generation 原始块**：见 [组装规则（硬约束）](references/assembly.md)；generation 信息一律内联翻译为正文四节，不保留 YAML 形态
- **引用规范**：本 skill 内部引用一律用相对路径 + Markdown 链接（`references/templates/...`），禁止 `@path`、禁止硬编码绝对路径、禁止 `./xxx` 依赖 cwd
- **联动**：rule 触发后 AI 更新文档时按 `related` 同步关联文档；本 skill 保证 rule 正确携带 `related`；跨层引用单向向下，下层不链回上层
- **章节重排必须重编号连续 + 批量同步引用**（rule 触发后重构文档时生效）：重排/删除章节后**禁止保留旧章节号跳号**（如 3.3 跳 3.6）——必须重编号连续，并用 grep 批量找出所有 `§X` 引用（含下游文档/rule/deep-dives/TEST-PLAN）同步更新；`.omo/plans` 与 `.omo/evidence` 属历史记录不追溯
- **内容收拢后原横切节必须删表改引用（S2）**：把内容收进各域/各节后，原横切节（如全局事件清单）**禁止名义保留整表副本**——必须删表改为「各域见 §X.X」引用，否则与域内表重复违反 SSOT
- **图规范**（rule 内容规范，rule 触发后生效）：文档中的图按模板要求用 D2 / Mermaid / ASCII，绘制规范见 CONSTITUTION §3.2

## 错误处理

- **模板缺失**：若用户要的 rule 不在清单（如 DATA-ARCHITECTURE），说明该模板已合并或不存在，不臆造；CONSTITUTION 无模板属正常（全局 rule 即宪法全文）
- **rule 未触发**：检查 `.omo/rules/docs/<DOC>.md` 的 globs 是否匹配实际文档路径；确认 `.omo/` 目录存在
- **rule 与模板不一致**：按模板重新生成，覆盖旧 rule
- **skill meta 不存在**：先执行 `--gen-meta` 生成（功能 2 的前提）
- **项目 meta 缺失/条目缺失**：check 按全部 rule「未知版本 → 需更新」处理（兜底旧版手工生成的 rule）
- **rule 文件缺失**（meta 有条目但 `.omo/rules/docs/<DOC>.md` 不存在）：check 判「需更新（文件缺失）」——按模板重新生成该 rule
- **check 退出码 2**：skill meta 缺失或参数错误，先修配置再重跑
- **漂移疑似 Bug**（功能 3 阶段 4）：代码偏离文档真实意图 → 停下问用户裁决，AI 不自主修代码

## 维护

- **版本维护（用户显式触发，禁止自动化）**：修改 SKILL.md / templates / scripts 后，**由用户显式要求**时执行 `--gen-meta`（递增 version + 刷新 implHash/templates 指纹）——push/commit 与版本更新无耦合（没 bump = 没发布）；**禁止**以 git hook / 文件监听等形式自动 bump，未被授权时 AI 不得触碰 meta.json。版本变更与内容改动作为同一批改动提交（是否 commit/push 由用户显式指令）
- **模板更新**：修改 `references/templates/` 下文件后，用户显式要求时 bump 版本（`--gen-meta`）；项目侧按功能 2 check → update 按需重生成受影响 rule
- **新增文档类型**：在 `references/templates/<层>/` 加文件（无后缀=全局 rule；.template 后缀=模板，支持子目录如 `L2/deep-dives/`、`L2/research/`），重新生成对应 rule，更新本文件清单表与 meta
- **L2 deep-dives 约束**：目录名 `deep-dives`、文件 kebab-case 已定勿改；收敛标准 2/4 阈值命中即单列（AWS Lens/arc42/C4/Google 4 源）；L2 根为索引（1 图+1 表）、deep-dives 为详情，S2 引用不复制；File:Line 链代码
- **L2 research 约束**：目录名 `research`、文件 kebab-case 已定勿改；准入 候选≥2 或维度≥3 即建议单列；对比表（功能/性能/成本/许可证/生态）+ POC 验证 + 风险/合规 6 章骨架，结论链 ADR
- **脚本维护**：脚本只做解析/校验/指纹（omo 五键 + generation 六字段 + 剥离 frontmatter + meta 生成/对比），模板缺 `description` 或 `alwaysApply`/`globs` 时报错退出（不兜底）；配置（`LAYER_ZH`/`SPECIAL_TARGETS`/`SKIP_FILES`）在脚本顶部。脚本为 **Node 零依赖**（手写 YAML 解析，复刻 omo parser-yaml.ts，不引入 npm 包）

[^scan]: 原 `scan` 字段已删除——读关联文档并入 `related`、检查目标现状与探测项目并入 `flow`。
