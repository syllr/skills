---
name: doc-arch-rules
description: >
  文档架构规则与域 skill 生成器（meta skill）——从模板生成/更新目标项目两类产物：①.omo/rules/docs/ 下全部 omo rule（L0-L4 + common 分层，模板 → rule，含 TEST-PLAN 附属资产目录同步）；
  ②.opencode/skills/ 下三个域 skill（test-ops / deploy-ops / docs-align，薄壳模板逐字落地）。触发即全量更新——rule 按版本指纹按需更新（meta.json 对比判定，避免 AI 随机性无差别覆盖），TEST-PLAN 附属资产目录（rule-assets 同步源）无脑覆盖，skill 覆盖前 diff 项目侧手工改动；
  可单指变体（"重建 <DOC>"强制重生成单个 rule）。
  文档-代码对齐/漂移修复/globs 目录同步职责完全独立（docs-align skill 承担），本 skill 不承载不路由——需要文档对齐、处理漂移、更新globs 时直接调 docs-align。
  仅用户手动调用时触发，不自动触发；操作 .omo/rules/docs/ 与 .opencode/skills/，不生成业务代码、不直接改 docs/ 文档。
---

# doc-arch-rules — 文档架构规则与域 skill 生成器

## 定位

meta skill：把本仓库持有的模板（rule 模板 + skill 模板）同步为目标项目可被规则引擎/opencode 消费的产物。**单一功能 = 生成/更新两类产物**（触发即全量同步，见「何时使用」）：

| 产物                                           | 来源（SSOT）                                          | 落位（目标项目）                           | 更新语义                                                                                                                                           |
| ---------------------------------------------- | ----------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| omo rule（CONSTITUTION + 21 模板）             | `references/rule-templates/`                          | `.omo/rules/docs/`（目录结构与模板树同构） | **按版本指纹**：`--check-meta` 对比 → 需更新的才重生成，最新的跳过；"重建 <DOC>" 强制重生成单个                                                    |
| TEST-PLAN 附属资产目录                         | `references/rule-assets/test-asset/`               | `.omo/rules/docs/test-asset/`        | **无脑覆盖**：资产 = skill 侧模板副本（卡模板/工具规范/参考实现），是**参考模板层**——每次全量同步整目录原样复制（必做项，不判 TEST-PLAN 指纹是否最新），不做 diff 询问；它参考生成的 `docs/test/` 业务产物（test-tools/test-cases）是**产物层**，按用户业务需求生成，同步时绝不覆盖、不改写 |
| 域 skill（test-ops / deploy-ops / docs-align） | `references/skill-templates/<name>/SKILL.template.md` | `.opencode/skills/<name>/SKILL.md`         | **薄壳模板逐字落地**（不探测上下文、无占位符填充）；已有产物 diff 项目侧手工改动列给用户确认后再覆盖                                               |

**不承载（完全独立）**：文档-代码对齐/漂移修复/globs 目录同步由 **docs-align skill** 承担——用户需要对齐文档、处理漂移、更新globs 时直接调 docs-align，不经本 skill、本 skill 不路由。docs/** 文档本体也不由本 skill 生成——rule 落位后，宿主项目 docs/** 由 rule 触发后的 AI 按 rule 内容生成/更新。

rule 工厂的输入输出：

- 输入：`references/rule-templates/` 下模板（1 个全局 Rule 源 + 20 个模板，清单见 [§文件清单](#文件清单模板-ssot)）；TEST-PLAN 附属资产源在 `references/rule-assets/test-asset/`（独立于模板树的资产目录，见功能 1 步骤 3）
- 输出：`.omo/rules/docs/` 下的 rule（一个模板对应一个 rule，目录结构与 `references/rule-templates` 同构）
- 除 DEEP-DIVE/RESEARCH/CONTRACT/ADR/DOMAIN（globs: `docs/L2/domain/*.md` 目录级通配）目录级通配，及 TEST-PLAN（globs: docs/test/**）主文档 + **附属资产目录**（test-asset/，见产物表）混合、INTEGRATION（globs 含 `docs/L3/integration-contracts/**`）主文档（说明书）+目录通配混合外，其余 1:1 同构；目录级模板按 globs 通配覆盖，详见表
- 只生成 rule，不生成文档：宿主项目 `docs/**` 由 rule 触发后的 AI 按 rule 内容生成/更新

两种文件模式：

| 文件类型                                           | 是什么       | rule 内容                                                                                                                                | 触发方式               |
| -------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 无 `.template` 后缀（`templates/CONSTITUTION.md`） | 全局 Rule 源 | frontmatter（抄 omo：`description + alwaysApply: true`）+ 文件全文                                                                       | `alwaysApply` 全局注入 |
| 有 `.template` 后缀（21 个）                       | 模板         | frontmatter（抄 omo：`description + globs`）+ 四节正文（内联翻译 generation）+ 「模板」章节（模板 Markdown 正文，剥离 YAML frontmatter） | `globs`                |

## 何时使用（仅手动触发，触发即全量）

本 skill 无关键字分诊——用户手动调用即**全量同步两类产物**（rule + 三 skill）。默认一次调用完成：

1. **rule 更新**（功能 2 → 功能 1）：`--check-meta` 摸底 → 重生成「需更新」的 rule + TEST-PLAN 附属资产目录**无脑覆盖**（必做独立步骤，不判 TEST-PLAN 指纹——rule 判最新跳过资产照常覆盖）→ `--update-project-meta` 刷新项目 meta 条目
2. **skill 更新**（功能 3）：三份薄壳模板逐字落地（已有产物先 diff 项目侧改动确认再覆盖）
3. **报告**：更新了哪些 rule / 哪些 skill、跳过哪些（指纹最新）、项目侧待确认项

变体（显式需求时）：

- "重建 <DOC>"：忽略指纹强制重生成单个 rule（用户手工改坏/想重置时用）
- 目标项目无 `.omo/rules/docs/`（首次落地）→ 全量生成 rule（无指纹可对比）+ 生成三 skill（前置校验 rule 已生成）
- 目标项目无 `.opencode/skills/<name>` → 直接生成该 skill（无 diff 询问）

> 需要对齐 docs/ 文档与代码、处理漂移、更新globs？——**直接调 docs-align skill**，本 skill 不做这些。
> 本 skill 只写 `.omo/rules/docs/` 与 `.opencode/skills/`，不修改 docs/**、不生成业务代码、不自动 commit。

## 文件清单（模板 SSOT）

源文件位于 `references/rule-templates/`：1 个全局 Rule 源（CONSTITUTION，无后缀）+ 20 个模板（.template 后缀，含 L2/domain + L2/deep-dives + L2/research + L3/integration-contracts 子目录；ADR.template.md 为 common 根下文件，无子目录）。

| 层                       | 文件                                                                                          | 类型           | rule 输出                                                                                                                                                                                               | 触发方式              |
| ------------------------ | --------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| CONSTITUTION             | [CONSTITUTION](references/rule-templates/CONSTITUTION.md)（无后缀）                           | 全局 Rule 源   | .omo/rules/docs/CONSTITUTION.md                                                                                                                                                                         | alwaysApply           |
| L1                       | [README](references/rule-templates/L1/README.template.md)                                     | 模板           | .omo/rules/docs/L1/README.md                                                                                                                                                                            | globs（根 README.md） |
| L1                       | [PRODUCT](references/rule-templates/L1/PRODUCT.template.md)                                   | 模板           | .omo/rules/docs/L1/PRODUCT.md                                                                                                                                                                           | globs                 |
| L1                       | [USER-STORY](references/rule-templates/L1/USER-STORY.template.md)                             | 模板           | .omo/rules/docs/L1/USER-STORY.md                                                                                                                                                                        | globs                 |
| L2                       | [APPLICATION-ARCHITECTURE](references/rule-templates/L2/APPLICATION-ARCHITECTURE.template.md) | 模板           | .omo/rules/docs/L2/APPLICATION-ARCHITECTURE.md                                                                                                                                                          | globs                 |
| L2/domain                | [DOMAIN-MODEL](references/rule-templates/L2/domain/DOMAIN-MODEL.template.md)                  | 模板（总文档） | .omo/rules/docs/L2/domain/DOMAIN-MODEL.md（globs: docs/L2/domain/DOMAIN-MODEL.md，总文档兼域文档索引，domain/ 不设 INDEX.md——宪法 §3.2 总文档例外）                                                     | globs                 |
| L2/domain                | [DOMAIN](references/rule-templates/L2/domain/DOMAIN.template.md)                              | 模板（域文档） | .omo/rules/docs/L2/domain/DOMAIN.md（目录级通配，globs: docs/L2/domain/*.md 覆盖每业务域一文档；命中 DOMAIN-MODEL.md 由总文档模板处理，本 rule 跳过）                                                   | globs                 |
| L2                       | [DATA-ARCHITECTURE](references/rule-templates/L2/DATA-ARCHITECTURE.template.md)               | 模板           | .omo/rules/docs/L2/DATA-ARCHITECTURE.md                                                                                                                                                                 | globs                 |
| L2                       | [TECHNOLOGY-ARCHITECTURE](references/rule-templates/L2/TECHNOLOGY-ARCHITECTURE.template.md)   | 模板           | .omo/rules/docs/L2/TECHNOLOGY-ARCHITECTURE.md                                                                                                                                                           | globs                 |
| L2/deep-dives            | [DEEP-DIVE](references/rule-templates/L2/deep-dives/DEEP-DIVE.template.md)                    | 模板           | .omo/rules/docs/L2/deep-dives/DEEP-DIVE.md（目录级通配，globs: docs/L2/deep-dives/*.md 覆盖目录下多文档，物理单 rule；命中 INDEX.md 按本模板「索引基准」节维护）                                        | globs                 |
| L2/research              | [RESEARCH](references/rule-templates/L2/research/RESEARCH.template.md)                        | 模板           | .omo/rules/docs/L2/research/RESEARCH.md（目录级通配，globs: docs/L2/research/*.md 覆盖目录下多文档，物理单 rule；命中 INDEX.md 按本模板「索引基准」节维护）                                             | globs                 |
| L3                       | [API](references/rule-templates/L3/API.template.md)                                           | 模板           | .omo/rules/docs/L3/API.md                                                                                                                                                                               | globs                 |
| L3                       | [INTEGRATION](references/rule-templates/L3/INTEGRATION.template.md)                           | 模板           | .omo/rules/docs/L3/INTEGRATION.md（说明书模式，globs: docs/L3/INTEGRATION.md + docs/L3/integration-contracts/**）                                                                                       | globs                 |
| L3/integration-contracts | [CONTRACT](references/rule-templates/L3/integration-contracts/CONTRACT.template.md)           | 模板           | .omo/rules/docs/L3/integration-contracts/CONTRACT.md（目录级通配，globs: docs/L3/integration-contracts/** 覆盖目录下多契约文件，物理单 rule，一服务一契约，字段 SSOT；命中 INDEX.md 由 INDEX 模板处理） | globs                 |
| L3/integration-contracts | [INDEX](references/rule-templates/L3/integration-contracts/INDEX.template.md)                 | 模板           | .omo/rules/docs/L3/integration-contracts/INDEX.md（目录唯一入口：文件清单，宪法 §3.2 目录索引约定）                                                                                                     | globs                 |
| L4                       | [DEPLOYMENT](references/rule-templates/L4/DEPLOYMENT.template.md)                             | 模板           | .omo/rules/docs/L4/DEPLOYMENT.md（globs: docs/L4/DEPLOYMENT.md；部署资产登记于 §7，文件本体不移动）                                                                                                     | globs                 |
| L4                       | [TEST-PLAN](references/rule-templates/L4/TEST-PLAN.template.md)                               | 模板           | .omo/rules/docs/L4/TEST-PLAN.md（rule，测试资产规范，globs: docs/test/**）+ 同目录 test-asset/（附属资产目录：卡模板/工具规范/参考实现——随 rule 同步复制，不生成 docs 测试计划文档）                      | globs                 |
| common                   | [CODE-GUIDE](references/rule-templates/common/CODE-GUIDE.template.md)                         | 模板           | .omo/rules/docs/common/CODE-GUIDE.md                                                                                                                                                                    | globs                 |
| common                   | [SECURITY](references/rule-templates/common/SECURITY.template.md)                             | 模板           | .omo/rules/docs/common/SECURITY.md（贯穿所有层，密钥分层 SSOT 在 §6）                                                                                                                                   | globs                 |
| common                   | [STRUCTURE](references/rule-templates/common/STRUCTURE.template.md)                           | 模板           | .omo/rules/docs/common/STRUCTURE.md                                                                                                                                                                     | globs                 |
| common                   | [ADR](references/rule-templates/common/ADR.template.md)                                       | 模板           | .omo/rules/docs/common/ADR.md（目录级通配，globs: docs/adr/*.md 覆盖目录下多文档，物理单 rule）                                                                                                         | globs                 |

> 模板 frontmatter 的 `generation` 块（tools/related/ask_user/flow/notes/checks）是 rule 对应目标文档（`docs/**` 下由 `globs` 指定的路径）的生成提示词，仅模板持有——生成 rule 时内联翻译进正文四节，不保留 YAML 形态。

## skill 模板（功能 3 的 SSOT）

源文件位于 `references/skill-templates/<name>/SKILL.template.md`（独立树，不与文档模板混置——两者产物与结构不同：文档模板 → `.omo/rules/docs/` rule，skill 模板 → `.opencode/skills/<name>/SKILL.md`）：

| skill 模板                                                            | 产物（目标项目）                       | 职责                                                                                                                           |
| --------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [test-ops](references/skill-templates/test-ops/SKILL.template.md)     | `.opencode/skills/test-ops/SKILL.md`   | 测试用例执行器 runner（环境确认、范围确认、依赖排序、策略确认、按需部署经 deploy-ops、按序执行；写/更新用例归 TEST-PLAN rule） |
| [deploy-ops](references/skill-templates/deploy-ops/SKILL.template.md) | `.opencode/skills/deploy-ops/SKILL.md` | 部署运维薄壳（读 DEPLOYMENT.md：环境确认、commit 询问、按文档执行与报告，不复制命令与环境信息）                                |
| [docs-align](references/skill-templates/docs-align/SKILL.template.md) | `.opencode/skills/docs-align/SKILL.md` | 文档对齐与漂移处理执行器（分诊：对齐代码和文档〔含 globs 轻量子模式〕/ 解决漂移消费 .omo/drift/ 清单）                         |

模板结构：完整 SKILL.md（frontmatter + 正文）。模板为薄壳（编排流程纪律），不持有项目实例内容——命令/工具/环境信息一律指向项目文档 SSOT（DEPLOYMENT.md / TEST-PLAN rule / test-tools README），执行时现场读；生成时前置校验 rule 存在性（`.omo/rules/docs/`）。frontmatter 的 `metadata.generated-by: doc-arch-rules` 标注溯源。name 固定（职责级，跨项目同名）；description 通用。


## 功能 1：生成 rule（执行流程：AI 主流程）

### 步骤 1：解析模板

读取每个模板，解析三部分：

- omo 字段（rule frontmatter 用）：`description` + `alwaysApply`/`globs`
- generation 块（正文四节用）：`tools`/`related`/`ask_user`/`flow`/`notes`/`checks`
- 模板正文（「模板」章节用）：剥离 YAML frontmatter 后的 Markdown 正文

> 可用脚本辅助解析（见「脚本用法」）：`node scripts/parse-template.mjs <模板路径>` 输出 JSON（`omo` + `generation` + `content`），避免手读 YAML 出错——skill 激活时 Base directory 自动注入，相对路径以其为锚。

### 步骤 2：组装 rule

> 组装细则（占位符映射 / 模式 A+B 模板 / 内容纯净·三层处置 / 完成判定机器校验）见 [references/assembly.md](references/assembly.md)——本步骤按 assembly.md 执行：读模板 generation → 按占位符映射替换 → 按模式 A/B 组装四节正文 + 「模板」章节 → 遵守组装硬约束。assembly.md 是组装逻辑 SSOT，修改它 = implHash 刷新（全部 rule 需重新生成）。

### 步骤 3：落盘校验

- 批量写入 `.omo/rules/docs/<路径>`（CONSTITUTION.md 在根；其余在 `<层>/<DOC>.md`，含 `L2/deep-dives/DEEP-DIVE.md` + `L2/research/RESEARCH.md`）
- **附属资产目录同步（TEST-PLAN 专属，无脑覆盖）**：TEST-PLAN 模板带附属资产目录 `references/rule-assets/test-asset/`（卡模板 api-case/flow-case + 工具规范 test-tools.md + 参考实现 test-tools/）——**每次全量同步整目录无脑覆盖**复制到项目 `.omo/rules/docs/test-asset/`（必做项，不判 TEST-PLAN 指纹是否最新——rule 判定跳过资产照常覆盖；原样拷贝，不做占位符组装/翻译、不做 diff 询问；资产 = skill 侧模板副本，无项目侧手工改动语义，直接覆盖）；rule 正文「模板」章节以相对链接 `test-asset/xxx` 引用资产文件，目录缺失即死链
- rule 落盘校验（本步骤对象）：frontmatter 中 `description`/`alwaysApply` 与模板 omo 一致，`globs` 含模板基线全部条目（允许含 globs 目录同步追加的扩展条目，`--check` 只判基线子集、不禁扩展）；rule 内不含 `generation:` YAML 块；「模板」章节正文与模板正文一致——用 `--check <rule> <模板>` 逐 rule 复核（批量用 `--all` 解析全部模板拿清单后循环调用）
- globs 基线（组装期不可改）：生成 rule 时 `globs` 逐字抄模板基线，AI 不得删除/改写基线条目；扩展条目不在此组装——由 docs-align skill 的 globs 双向同步统一增删（本 skill 不做目录同步）；update/rebuild 重生成时做合并（基线以模板为准重写 + 仍存在于磁盘的扩展条目做并集保留），详见功能 2

---

## 功能 2：rule 更新检查（版本指纹）

> 解决的问题：AI 组装 rule 有随机性——即使 skill 与模板都没变，两次生成的 rule 措辞也不同。所以「rule 是否需要更新」不能靠全文 diff（会把措辞差异误报为漂移），要靠版本指纹对比：随机性只影响措辞不影响信息，只要指纹一致就无需更新。
> 入口语义：本功能是全量更新主流程的 rule 侧执行（`--check-meta` 摸底 → 按需 update）；目标项目首次落地（无 `.omo/rules/docs/`）或用户显式"重建 <DOC>"时直接 rebuild，不经本功能 check。

### 机制：两份 meta.json + 逐条目对比

- skill 侧 `meta.json`（skill 安装目录内，自述版本，SSOT）：`{ version, implHash, templates, generatedAt }`
  - `version`：发布标记，仅用户显式触发 `--gen-meta` 时递增（push/commit 与版本更新无耦合——没 bump = 没发布，项目侧感知不到是正确行为）
  - `implHash`：assembly.md + SKILL.md + scripts/ 的内容指纹（组装逻辑全部输入）——区分 version 变更原因（implHash 变 = 组装逻辑变，影响全部 rule；implHash 不变 = 仅模板变，按模板粒度跳过）
  - `templates`：每个模板的内容指纹
- 项目侧 `<项目>/.omo/rules/docs/meta.json`（生成时快照）：`{ rules: { "<DOC>": { version, implHash, templateHash } } }`——按 rule 记条目（不同 rule 可能不同版本生成），生成/更新某个 rule 时只更新该条目
- 对比（`--check-meta`，纯字段比对，无 AI 参与、无随机性）：逐 rule 条目——缺失 → 需更新；implHash 变 → 需更新（影响全部）；templateHash 变 → 需更新；均同 → 最新（即使 version 标记不同，内容未变即跳过重生成）
- 检测边界（指纹机制只回答"skill/模板是否变了"，不回答"组装质量"与"手工修改"）：
  - 用户手工修改 rule（改触发条件措辞/删节）→ 指纹不变，check 判定仍为最新、不会自动覆盖——这是设计意图（防误覆盖）；如需强制重生成请显式说"重建 <DOC>"
  - 组装质量（AI 组装漏 generation 条目/曲解字段）→ 指纹不变；落盘 `--check` 只校验 frontmatter/无 generation YAML/模板章节，tools/related/ask_user/flow 节信息完整性无机器闭环（notes/checks 已有条目数下限校验）——依赖落盘时 AI 自检（见功能 1 步骤 2 硬约束）
- globs 扩展豁免与合并：`--check-meta` 只比对 `version`/`implHash`/`templateHash`，不比对 `globs` 内容——docs-align 追加的扩展条目不触发"需更新"；`update`/`rebuild` 重生成某 rule 时必须做合并（基线以模板为准重写 + 仍存在于磁盘的扩展条目做并集保留），禁止用纯模板基线覆盖丢扩展；"重建 <DOC>"为显式重置，丢扩展并重写项目 meta 对应条目

### 三种内部模式 + 重建单个变体（对用户只暴露入口；check 是默认第一步）

| 模式                              | 触发                    | 动作                                                                                                                                   |
| --------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| check（默认第一步，只报告不动手） | 用户问"rule 需要更新吗" | 跑 `--check-meta`，输出三态表（最新/需更新/异常+原因），不写任何文件                                                                   |
| update（按需更新）                | 用户确认更新            | 只重新生成 check 判定「需更新」的 rule（按功能 1 流程），「最新」的绝不覆盖；每更新一个，用 `--update-project-meta` 刷新项目 meta 条目 |
| rebuild（全量重建）               | 用户显式要求全量重建    | 批量重新生成全部 rule 并重建项目 meta（首版落地或用户明确要求时才用）                                                                  |
| 重建单个（强制重生成某 rule）     | 用户显式说"重建 <DOC>"  | 忽略指纹直接按模板重生成该 rule（用于用户手工改坏/想重置时），重写项目 meta 对应条目                                                   |

> globs 目录同步（扩展条目增删）由 docs-align skill 承担——本功能不主动做目录盘点；需要时用户单独调 docs-align。

### 脚本命令

> 完整命令清单见 [§脚本用法](#脚本用法解析工具可选)；本功能涉及三条：`--gen-meta`（用户显式触发，bump version + 刷新指纹，禁止自动钩子调用）、`--check-meta <项目meta>`（对比报告，退出码 0=全部最新 / 1=有需更新 / 2=配置错误）、`--update-project-meta`（rule 落盘后写项目 meta 条目，见下）。

> 生成/更新 rule 落盘时，用 `--update-project-meta <项目meta> <DOC> <version> <implHash> <templateHash>` 写入项目 meta 对应条目——`version`/`implHash`/`templateHash` 从 skill 侧 `meta.json`（安装目录内）读取（本 skill 当前自述版本；implHash 见其 implHash 字段；templateHash 见其 templates[<DOC>] 字段）。确定性脚本替代手工写 JSON 防写错——这是 check 的数据来源。

---
## 功能 3：生成/更新 skill

### 触发与范围

全量更新时三份一并落地（随「何时使用」主流程）；产物落目标项目 `.opencode/skills/<name>/SKILL.md`。skill 无指纹机制（模板薄壳逐字落地，是否覆盖靠产物 diff 判定）。

### 生成流程

1. **前置校验**：目标项目应已生成 rule（`.omo/rules/docs/` 存在）——skill 正文引用 rule 作为规则源；未生成时提示先跑 rule 更新
2. **逐字落地**：读模板逐字复制（薄壳无占位符、无【实例化】标记行、不探测项目上下文）
3. **落盘**：`.opencode/skills/<name>/SKILL.md`（frontmatter `metadata.generated-by: doc-arch-rules` 溯源）
4. **验证**：frontmatter name 与目录名一致；`--check`/内容抽查模板正文与产物一致
5. **报告**：生成/更新清单 + 项目侧需重启 opencode 生效提醒

### 更新与覆盖规则

- 已有产物重生成前：diff 现产物与新版模板逐字结果，**项目侧手工改动列出来让用户确认**（保留合并或覆盖），禁止静默覆盖
- 模板更新：改 `references/skill-templates/` 后用户显式 `--gen-meta` bump（与文档模板同纪律）；项目侧重生成走本功能
- 边界：本功能只写 `.opencode/skills/`；不修改目标项目业务代码；不自动 commit

---

## 脚本用法（解析工具，可选）

脚本只做解析/校验/指纹，不组装 rule；组装由 AI 按本 SKILL 流程完成。

脚本相对路径以 skill 激活时注入的 **Base directory** 为锚（opencode 的 skill 工具在返回内容中自动附带你安装位置的绝对路径与 scripts/ 文件清单，无需在 SKILL.md 内探测安装路径）：

```bash
node scripts/parse-template.mjs <模板路径>            # 解析单个模板，输出 JSON：{omo, target, generation, content}
node scripts/parse-template.mjs --all                 # 解析全部模板，输出 JSON 数组
node scripts/parse-template.mjs --check <rule路径> <模板路径>  # 校验 rule（frontmatter 一致 + 无 generation YAML + 模板章节正文一致 + notes/checks 条目数对齐）
node scripts/parse-template.mjs --gen-meta [--set-version X.Y.Z]  # 生成/刷新 skill 侧 meta.json（用户显式触发，见功能 2）
node scripts/parse-template.mjs --check-meta <项目meta路径>       # rule 更新检查三态表（见功能 2）
node scripts/parse-template.mjs --update-project-meta <项目meta> <DOC> <version> <implHash> <templateHash>  # 写项目 meta 单条目（rule 落盘后用）
```

## 硬性要求

- SSOT：模板是 rule 的唯一来源；`references/rule-templates/` 目录结构 = `.omo/rules/docs/` 目录结构
- skill 模板 SSOT：`references/skill-templates/<name>/SKILL.template.md` 是 `.opencode/skills/<name>/SKILL.md` 的唯一来源，逐字落地；模板为薄壳（编排流程纪律），不持有项目实例内容（命令/工具/环境信息指向项目文档 SSOT）；产物 frontmatter 必含 `metadata.generated-by: doc-arch-rules` 溯源
- globs 两阶段生命周期：初始化（功能 1 组装）基线逐字抄、AI 不得改；演进（目录同步/扩展增删）由 docs-align skill 承担（按 STRUCTURE 目录职责双向同步——不变量：基线只增不减永不清理、扩展随磁盘现状追加与清理；语法匹配语义见 [globs 语法与用法](references/globs.md)）——本 skill 重生成 rule 时只做合并（基线以模板为准 + 磁盘仍存在的扩展条目并集保留），不做目录盘点
- rule 内禁止 YAML generation 原始块：见 [组装规则（硬约束）](references/assembly.md)；generation 信息一律内联翻译为正文四节，不保留 YAML 形态
- 引用规范：本 skill 内部引用一律用相对路径 + Markdown 链接（`references/rule-templates/...`），禁止 `@path`、禁止硬编码绝对路径、禁止 `./xxx` 依赖 cwd
- 联动：rule 触发后 AI 更新文档时按 `related` 同步关联文档；本 skill 保证 rule 正确携带 `related`；跨层引用单向向下，下层不链回上层
- 章节重排必须重编号连续 + 批量同步引用（rule 触发后重构文档时生效，宪法 第6条 执行细则）：重排/删除章节后禁止保留旧章节号跳号（如 3.3 跳 3.6）——必须重编号连续，并用 grep 批量找出所有 `§X` 引用（含下游文档/rule/deep-dives/TEST-PLAN）同步更新；禁止留「已迁移/已删除至 X」正文占位（违反 第6条 当前态——需保留导航时用不渲染的 HTML 注释 `<!-- ... -->`）；`.omo/plans` 与 `.omo/evidence` 属历史记录不追溯；完成判定加「全仓无指向已删章节的 §x 引用」
- 内容收拢后原横切节必须删表改引用（第2条）：把内容收进各域/各节后，原横切节（如全局事件清单）禁止名义保留整表副本——必须删表改为「各域见 §X.X」引用，否则与域内表重复违反 SSOT
- 图规范（rule 内容规范，rule 触发后生效）：文档中的图按模板要求用 D2 / Mermaid / ASCII，绘制规范见 [references/diagram-spec.md](references/diagram-spec.md)（rule 图规范条款指向该文件）

## 错误处理

- 模板缺失：若用户要的 rule 不在清单（如 `FOO-BAR` 这类清单外名称），说明该模板已合并或不存在，不臆造；CONSTITUTION 无模板属正常（全局 rule 即宪法全文）
- rule 未触发：检查 `.omo/rules/docs/<DOC>.md` 的 globs 是否匹配实际文档路径；确认 `.omo/` 目录存在
- rule 与模板不一致：按模板重新生成，覆盖旧 rule
- skill meta 不存在：先执行 `--gen-meta` 生成（功能 2 的前提）
- 项目 meta 缺失/条目缺失：check 按全部 rule「未知版本 → 需更新」处理（兜底旧版手工生成的 rule）
- rule 文件缺失（meta 有条目但 `.omo/rules/docs/<DOC>.md` 不存在）：check 判「需更新（文件缺失）」——按模板重新生成该 rule
- check 退出码 2：skill meta 缺失或参数错误，先修配置再重跑
- skill 产物已存在且含项目侧手工改动（功能 3）：diff 列出改动让用户确认保留合并或覆盖，禁止静默覆盖
- skill 模板缺失（功能 3 要求清单外名称）：说明该 skill 模板未建，不臆造；可按 [skill 模板]（references/skill-templates/）既有模板的形态新建模板后再生成

## 维护

- 版本维护（用户显式触发，禁止自动化）：修改 SKILL.md / templates / scripts 后，由用户显式要求时执行 `--gen-meta`（递增 version + 刷新 implHash/templates 指纹）——push/commit 与版本更新无耦合（没 bump = 没发布，详见功能 2 版本指纹说明）；禁止以 git hook / 文件监听等形式自动 bump，未被授权时 AI 不得触碰 meta.json。版本变更与内容改动作为同一批改动提交（是否 commit/push 由用户显式指令）
- 模板更新：修改 `references/rule-templates/` 下文件后，用户显式要求时 bump 版本（`--gen-meta`）；项目侧按功能 2 check → update 按需重生成受影响 rule
- 新增文档类型：在 `references/rule-templates/<层>/` 加文件（无后缀=全局 rule；.template 后缀=模板，支持子目录如 `L2/deep-dives/`、`L2/research/`），重新生成对应 rule，更新本文件清单表与 meta
- skill 模板维护：新增/修改 `references/skill-templates/<name>/SKILL.template.md` 后，用户显式要求时 bump 版本（`--gen-meta`）；目标项目侧跑本 skill 全量更新即重生成三份产物（覆盖前按错误处理规则 diff 确认）
- 脚本维护：脚本只做解析/校验/指纹（omo 五键 + generation 六字段 + 剥离 frontmatter + meta 生成/对比），模板缺 `description` 或 `alwaysApply`/`globs` 时报错退出（不兜底）；配置（`LAYER_ZH`/`SPECIAL_TARGETS`/`SKIP_FILES`）在脚本顶部。脚本为 Node 零依赖（手写 YAML 解析，复刻 omo parser-yaml.ts，不引入 npm 包）
