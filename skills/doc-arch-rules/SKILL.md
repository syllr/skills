---
name: doc-arch-rules
description: >
  文档架构规范（L0-L4 + common 分层），使用入口：①生成/更新 rule（关键字 init / 初始化 / 生成rule / 生成文档规范——从模板生成 .omo/rules/docs/ 下的 omo rule，已有 rule 时按版本指纹按需更新，生成/更新后必做 globs 目录同步检查：空项目保持模板基线，有目录提双向同步提案）；
  ②生成/更新 skill（关键字 生成skill / 生成skills / 初始化skill——从 skill 模板生成/更新目标项目 .opencode/skills/ 下的三个域 skill：test-ops 测试用例全生命周期 / deploy-ops 部署运维 / docs-align 文档对齐；生成时探测项目上下文实例化，已有产物时提示差异再覆盖）；
  ③对齐（默认，/doc-arch-rules 无关键字——一条龙：先按版本指纹检查并更新过期 rule，再检测 docs/ 文档与代码的漂移并以代码为准修复文档，其中 globs 自适应为必做门槛，遵守 rule，走宪法差异分诊）；
  ④globs 对齐（关键字 更新globs / globs对齐 / 目录变动 / rule没触发——轻量：ls 实际目录对比 STRUCTURE 目录树，有变动则提出 globs 双向同步提案（新目录追加、已删目录清理），用户确认后落盘）。
  内部机制：版本指纹 meta.json（version + implHash + templates hash）对比判定 rule 是否需要更新，避免 AI 随机性导致的无差别覆盖。
  仅用户手动调用时触发，不自动触发；操作 .omo/rules/docs/、docs/ 文档与 .opencode/skills/，不生成业务代码。
---

# doc-arch-rules — 文档架构规范与 rule/skill 生成

## 简介

本 skill 承载一套文档架构规范（基于 TOGAF 分层：L0 决策 → L1 产品 → L2 架构 → L3 契约 → L4 交付 + common 贯穿层），提供四种使用入口（内含四个内部能力：生成 rule / 生成 skill / rule 更新检查 / 文档-代码漂移检测与修复）：

- 入口① 生成/更新 rule（关键字 `init`）：把规范落地到具体项目——生成/按需更新 `.omo/rules/docs/` 下的 omo rule
- 入口② 生成/更新 skill（关键字 `生成skill`）：从 skill 模板生成/更新目标项目 `.opencode/skills/` 下的三个域 skill（test-ops / deploy-ops / docs-align），生成时探测项目上下文实例化
- 入口③ 对齐（默认）：一条龙——检查并更新过期 rule（功能 2）→ 检测并修复文档-代码漂移（功能 3，已迁出为 docs-align skill，本 skill 路由调用）
- 入口④ globs 对齐（轻量）（关键字 `更新globs` / `globs对齐` / `目录变动` / `rule没触发`）：只做目录盘点 + globs 自适应（功能 3 阶段 1 盘点 + 阶段 2），有变动提双向同步提案（新目录追加 + 已删目录清理）、无变动给显式结论，不动文档内容

rule 工厂（功能 1）的输入输出：

- 输入：`references/rule-templates/` 下模板（1 个全局 Rule 源 + 20 个模板，清单见 [§文件清单](#文件清单模板-ssot)）
- 输出：`.omo/rules/docs/` 下的 rule（一个模板对应一个 rule，目录结构与 `references/rule-templates` 同构）
- 除 DEEP-DIVE/RESEARCH/CONTRACT/ADR/DOMAIN（globs: `docs/L2/domain/*.md` 目录级通配）目录级通配，及 TEST-PLAN（globs 含 `docs/L4/testcases/*.md`）/INTEGRATION（globs 含 `docs/L3/integration-contracts/**`）主文档（TEST-PLAN 总文档 / INTEGRATION 说明书）+目录通配混合外，其余 1:1 同构；目录级模板按 globs 通配覆盖，详见表
- 只生成 rule，不生成文档：宿主项目 `docs/**` 由 rule 触发后的 AI 按 rule 内容生成/更新

两种文件模式：

| 文件类型                                           | 是什么       | rule 内容                                                                                                                                | 触发方式               |
| -------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 无 `.template` 后缀（`templates/CONSTITUTION.md`） | 全局 Rule 源 | frontmatter（抄 omo：`description + alwaysApply: true`）+ 文件全文                                                                       | `alwaysApply` 全局注入 |
| 有 `.template` 后缀（21 个）                       | 模板         | frontmatter（抄 omo：`description + globs`）+ 四节正文（内联翻译 generation）+ 「模板」章节（模板 Markdown 正文，剥离 YAML frontmatter） | `globs`                |

## 何时使用（仅手动触发）

分诊按关键字分流（init → 生成 rule；生成skill → 功能 4；globs 关键字 → globs 轻量；无关键字 → 对齐流水线）：

| 分诊结果                 | 触发关键词                                                                                     | 说明                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| ① init → 生成 rule       | `init` 类关键词（详见信号判定细则；"重建 <DOC>"强制重生成单个）                                | 初始化 rule（功能 1，直接全量 rebuild，无需 check 增量）                                                   |
| ② 文档与代码对齐（默认） | `/doc-arch-rules` 无 init 关键字（默认动作，含"检查一下/需要更新吗/看看有没有漂移"等只读询问） | 对齐流水线。缺失判定以文档架构（宪法 §3.1）`必选性`列为 SSOT；不清晰时做二次分诊（判定细则同决策树步骤 2） |

> globs 轻量子模式（入口④）：输入含 `更新globs` / `globs对齐` / `目录变动` / `rule没触发`（且无 init）→ 路由 docs-align 执行功能 3 阶段 1 盘点 + 阶段 2 双向同步，跳过步骤 0 摸底与阶段 3-5。
> 详细路由见下方「分诊决策树」与「信号判定细则」。

## 功能分诊（进入 skill 的第一件事）

自动判断是默认，问用户只是 fallback（实在分不清才问）。路由：按关键字分流（init → 生成 rule；生成skill → 功能 4；globs 关键字 → globs 轻量子模式，见上表注）。

### 分诊决策树

```
用户输入
├─ 含 init 关键字（init / 初始化 / 生成rule / 生成文档规范）
│    → 分诊结果①：生成/更新 rule（功能 1，元数据直接全量 rebuild）
│    ├─ 项目无 .omo/rules/docs/ → 全量生成
│    └─ 已有 rule → 直接全量 rebuild（"重建 <DOC>"可指定单个，默认全量；无需 check 增量）
│
├─ 含 生成skill 关键字（生成skill / 生成skills / 初始化skill）
│    → 分诊结果：生成/更新 skill（功能 4）
│    ├─ 项目无 .opencode/skills/<name> → 从模板实例化生成
│    └─ 已有产物 → diff 提示项目侧手工改动，确认后覆盖重生成
│
├─ 无 init 且无 生成skill，但含 globs 关键字（更新globs / globs对齐 / 目录变动 / rule没触发）
│    → globs 轻量子模式（入口④）：路由 docs-align 执行功能 3 阶段 1 盘点 + 阶段 2 双向同步（跳过步骤 0 摸底与阶段 3-5），无变动给显式结论
│
└─ 无 init 与 生成skill 关键字（默认：/doc-arch-rules 啥都不带，含只读询问）
     → 分诊结果：文档与代码对齐
     ├─ 步骤 0 · 只读摸底（先跑出清单：`--check-meta` 三态表 + 漂移机检——均只读，不写文件）
     ├─ 范围确认（把清单给用户看：哪些 rule 需更新、哪些文档需修/需新建、跳过哪些；确认后进入步骤 1/2，拒绝则仅输出只读报告）
     ├─ 步骤 1 · 确认后按需 update（重生成「需更新」的 rule + 刷新项目 meta）
     ├─ 步骤 2 · 文档与代码对齐 → **加载 docs-align skill 执行**（功能 3 已迁出：五阶段盘点/机检/语义核对/分诊修复；缺失判定按宪法 §3.1 必选性：必选缺失→初始化，按需缺失属正常）
     └─ 输出总报告：rule 更新了哪些 + 文档修/新建了哪些 + 待用户裁决项
```

### 信号判定细则

| 维度             | 判定                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| init 关键字      | `init` / `初始化` / `生成rule` / `生成文档规范` → 分诊结果①；"重建 <DOC>"（指定单个文档）→ 结果①强制重生成该 rule                                      |
| 生成skill 关键字 | `生成skill` / `生成skills` / `初始化skill` → 功能 4：从 skill 模板生成/更新目标项目 `.opencode/skills/` 三域 skill（可指定单个：`生成skill test-ops`） |
| globs 关键字     | `更新globs` / `globs对齐` / `目录变动` / `rule没触发`（无 init）→ globs 轻量子模式 = 入口④：加载 docs-align 执行阶段 1+2（盘点+globs 自适应），跳过阶段 3-5 |
| 对齐（默认）     | 无 init 与生成skill 关键字即默认对齐流水线（含只读询问"需要更新吗/检查一下/看看有没有漂移"——走步骤 0 只读摸底，不写文件；确认后才进入动手）                 |
| 二次分诊         | 同决策树「步骤 2 · 文档与代码对齐」的二次分诊（必选缺失→初始化；按需缺失属正常；已有的 → 漂移修复）。以此区分"首次生成"与"对齐修复"                    |
| 安全默认         | 生成 rule（元数据）直接全量 rebuild（无需 check 增量）；文档对齐走 check → update（不做无差别全量覆盖，动手前必须经过范围确认）                        |
| 范围确认         | rule update / 对齐步骤 1/2 动手前把清单给用户看（更新哪些、跳过哪些、疑似 Bug 哪些），确认后动手；用户可在此拒绝，退回只读                            |
| fallback         | 带 init 关键字但又像在做别的 / 意图混合（如"更新 rule 然后检查漂移"）→ 问用户确认                                                                      |

> 两个检查维度正交：功能 2 检测 rule 版本级漂移（rule vs skill/模板指纹——AI 随机性与模板变更）；功能 3 检测 文档内容级漂移（文档 vs 代码，走宪法 第5条 差异分诊）。默认流水线把两者串起来，用户一次调用即完成全部对齐。

### Gap 处置询问（分诊后 → 动手前必问）

> 触发条件：分诊结果为 ①（生成/更新 rule 已有内容）或 ②（对齐流水线），且 `docs/` 非空（非首次生成），且步骤 0 检出 code-doc 差异（`--check-meta` 需更新或漂移机检有 gap）时，进入动手前必须先问用户 Gap 处置方式。文档为空（首次生成）时跳过此问，直接生成。

必问三选项（单选）：

| 选项          | 含义                      | 后果                                                         |
| ------------- | ------------------------- | ------------------------------------------------------------ |
| 1. 以文档为准 | 文档是 SSOT，代码错了     | 按文档改代码（AI 改代码需用户二次确认是否改实现）            |
| 2. 以代码为准 | 代码是 SSOT（宪法 第1条） | 按代码改文档（遵守 rule，走 第5条 分诊，默认推荐）           |
| 3. 逐条判断   | 每条差异单独定            | 列清单让用户逐条选 1/2，生成漂移清单跟踪文档，边修边更新状态 |

选项 3 的跟踪文档机制（.omo/drift/）：机制与格式以宪法 §2.2 第8条为准（按文件一清单/默认记录不问处置/四列表头/状态枚举/即修即更/完成即 rm/禁止入库），skill 侧增量仅 3 点：

- 标题行含「来源：rule 指纹 + 代码漂移」：`## Drift: <doc>（YYYY-MM-DD HH:mm 生成，来源：rule 指纹 + 代码漂移）`
- `--check-meta` / 漂移机检每完成一批，追加/更新对应行
- 完成判定叠加：`grep -rn "§x" docs/ .omo/rules/` 对已删章节零残留（第6条）

## 文件清单（模板 SSOT）

源文件位于 `references/rule-templates/`：1 个全局 Rule 源（CONSTITUTION，无后缀）+ 20 个模板（.template 后缀，含 L2/domain + L2/deep-dives + L2/research + L3/integration-contracts 子目录；ADR.template.md 为 common 根下文件，无子目录）。

| 层                       | 文件                                                                                     | 类型           | rule 输出                                                                                                                                                                                               | 触发方式              |
| ------------------------ | ---------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
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
| L4                       | [TEST-PLAN](references/rule-templates/L4/TEST-PLAN.template.md)                               | 模板           | .omo/rules/docs/L4/TEST-PLAN.md（总文档模式，globs: docs/L4/TEST-PLAN.md + docs/L4/testcases/*.md）                                                                                                     | globs                 |
| common                   | [CODE-GUIDE](references/rule-templates/common/CODE-GUIDE.template.md)                         | 模板           | .omo/rules/docs/common/CODE-GUIDE.md                                                                                                                                                                    | globs                 |
| common                   | [SECURITY](references/rule-templates/common/SECURITY.template.md)                             | 模板           | .omo/rules/docs/common/SECURITY.md（贯穿所有层，密钥分层 SSOT 在 §6）                                                                                                                                   | globs                 |
| common                   | [STRUCTURE](references/rule-templates/common/STRUCTURE.template.md)                           | 模板           | .omo/rules/docs/common/STRUCTURE.md                                                                                                                                                                     | globs                 |
| common                   | [ADR](references/rule-templates/common/ADR.template.md)                                       | 模板           | .omo/rules/docs/common/ADR.md（目录级通配，globs: docs/adr/*.md 覆盖目录下多文档，物理单 rule）                                                                                                         | globs                 |

> 模板 frontmatter 的 `generation` 块（tools/related/ask_user/flow/notes/checks）是 rule 对应目标文档（`docs/**` 下由 `globs` 指定的路径）的生成提示词，仅模板持有——生成 rule 时内联翻译进正文四节，不保留 YAML 形态。

## skill 模板（功能 4 的 SSOT）

源文件位于 `references/skill-templates/<name>/SKILL.template.md`（独立树，不与文档模板混置——两者产物与结构不同：文档模板 → `.omo/rules/docs/` rule，skill 模板 → `.opencode/skills/<name>/SKILL.md`）：

| skill 模板                                                        | 产物（目标项目）                       | 职责                                                                              |
| ----------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| [test-ops](references/skill-templates/test-ops/SKILL.template.md) | `.opencode/skills/test-ops/SKILL.md`   | 测试用例全生命周期（写/跑/更新，test-tools 四工具编排，六关切骨架，断言三源纪律） |
| deploy-ops（待建）                                                | `.opencode/skills/deploy-ops/SKILL.md` | 部署运维（release 脚本/compose/standalone 启动/健康检查，remote-shell 集成）      |
| [docs-align](references/skill-templates/docs-align/SKILL.template.md) | `.opencode/skills/docs-align/SKILL.md` | 文档对齐与漂移（功能 3 迁出后的独立执行器：五阶段/机检/漂移清单） |

模板结构：完整 SKILL.md（frontmatter + 正文）+ `> 【实例化】`标记行（生成时剔除或替换）。**生成时探测项目上下文实例化**：工具清单（`<测试工具目录>/package.json` scripts + README）、环境变量（`.env.example`）、rule 存在性（`.omo/rules/docs/L4/TEST-PLAN.md`）。frontmatter 的 `metadata.generated-by: doc-arch-rules` 标注溯源。name 固定（职责级，跨项目同名）；description 通用。

## 功能 4：生成/管理/更新 skill

### 触发与范围

`生成skill`（全量三份）或 `生成skill <name>`（单份，如 `生成skill test-ops`）。产物落目标项目 `.opencode/skills/<name>/SKILL.md`。

### 生成流程

1. **前置校验**：目标项目应已生成 rule（`.omo/rules/docs/` 存在）——skill 正文引用 rule 作为规则源；未生成时提示先跑功能 1
2. **项目探测**（实例化输入）：测试工具目录（`test-tools/package.json` scripts、README）、环境变量（`.env.example`）、部署资产（`docs/L4/deployment/` release 脚本）、文档结构（`docs/L4/testcases/` 现状）
3. **实例化**：读模板 → 剔除 `> 【实例化】`标记行 → 占位符按探测结果填充（工具清单表/env 清单/路径）→ 范式纪律章节（断言三源/执行纪律/六关切表）逐字保留
4. **落盘**：`.opencode/skills/<name>/SKILL.md`（frontmatter `metadata.generated-by: doc-arch-rules` 溯源）
5. **验证**：`opencode debug skill` 确认发现（location 指向项目路径）；frontmatter name 与目录名一致
6. **报告**：生成清单 + 实例化来源（哪些字段来自探测）+ 项目侧需重启 opencode 生效提醒

### 更新与覆盖规则

- 已有产物重生成前：diff 现产物与新版模板实例化结果，**项目侧手工改动列出来让用户确认**（保留合并或覆盖），禁止静默覆盖
- 模板更新：改 `references/skill-templates/` 后用户显式 `--gen-meta` bump（与文档模板同纪律）；项目侧重生成走本功能
- 边界：本功能只写 `.opencode/skills/`；不修改目标项目业务代码；不自动 commit

---

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
- rule 落盘校验（本步骤对象）：frontmatter 中 `description`/`alwaysApply` 与模板 omo 一致，`globs` 含模板基线全部条目（允许含 globs 目录同步追加的扩展条目，`--check` 只判基线子集、不禁扩展）；rule 内不含 `generation:` YAML 块；「模板」章节正文与模板正文一致——用 `--check <rule> <模板>` 逐 rule 复核（批量用 `--all` 解析全部模板拿清单后循环调用）
- globs 基线（组装期不可改）：生成 rule 时 `globs` 逐字抄模板基线，AI 不得删除/改写基线条目；扩展条目一律不在组装时手工拼——统一走步骤 4 globs 目录同步（生成/更新完成后必做，功能 2 与功能 3 同流程）
- 宿主文档引用方向校验（顺带，属功能 3 机检对象，非 rule 校验）：生成 rule 后顺带检查宿主项目 `docs/` 的引用方向——deep-dives 单向：L1-L4 任何文档不得 `详见 deep-dives/`（发现入口唯一为 deep-dives/INDEX.md，宪法 §3.2），`grep -rnE "详见 (docs/L2/)?deep-dives/" docs/ --include="*.md" | grep -v "^docs/L2/deep-dives/" | wc -l` 应为 0；research：L2 总览（APP/DATA/TECH）引用 research 每文件至多一处（3 份总览各至多一处），逐文件计数 `grep -cE "(docs/L2/)?research/" docs/L2/*.md`（输出 `文件:计数`）每文件 ≤1

### 步骤 4：后置必做 · globs 目录同步

生成收尾必做一次（空项目也不例外，显式给结论）：

- `ls` 实际目录（排除 `.git/node_modules/dist/build/.venv/__pycache__`）——项目已有 STRUCTURE 文档时以其 §1 为对比基线，没有就直接以 `ls` 现状为准
- 空项目（无任何内容目录）：显式输出"项目为空，globs 保持模板基线"，结束
- 有目录：读 [references/globs.md](references/globs.md)，按功能 3 阶段 2 双向同步流程产出提案（追加项 + 清理项）交用户确认，确认后写 frontmatter 并 `--check` 复核

> 功能 2 update/rebuild 后置的 globs 目录同步（功能 3 阶段 2）、入口④ 与本步骤同流程：由 docs-align 执行（路由调用），目录现状为准（不限代码目录），提案必含追加 + 清理两类，基线永不参与清理。

---

## 功能 2：rule 更新检查（版本指纹）

> 解决的问题：AI 组装 rule 有随机性——即使 skill 与模板都没变，两次生成的 rule 措辞也不同。所以「rule 是否需要更新」不能靠全文 diff（会把措辞差异误报为漂移），要靠版本指纹对比：随机性只影响措辞不影响信息，只要指纹一致就无需更新。
> 入口语义：本功能承载对齐流水线中的 rule 检查与更新（决策树步骤 0 的 `--check-meta` 摸底 + 步骤 1 的按需 update）；init（生成 rule）直接全量 rebuild，不经本功能 check。

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
- globs 扩展豁免与合并：`--check-meta` 只比对 `version`/`implHash`/`templateHash`，不比对 `globs` 内容——功能 3 追加的扩展条目不触发"需更新"；`update`/`rebuild` 重生成某 rule 时必须做合并（基线以模板为准重写 + 仍存在于磁盘的扩展条目做并集保留），禁止用纯模板基线覆盖丢扩展；"重建 <DOC>"为显式重置，丢扩展并重写项目 meta 对应条目

### 三种内部模式 + 重建单个变体（对用户只暴露入口；check 是默认第一步）

| 模式                              | 触发                    | 动作                                                                                                                                   |
| --------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| check（默认第一步，只报告不动手） | 用户问"rule 需要更新吗" | 跑 `--check-meta`，输出三态表（最新/需更新/异常+原因），不写任何文件                                                                   |
| update（按需更新）                | 用户确认更新            | 只重新生成 check 判定「需更新」的 rule（按功能 1 流程），「最新」的绝不覆盖；每更新一个，用 `--update-project-meta` 刷新项目 meta 条目 |
| rebuild（全量重建）               | 用户显式要求全量重建    | 批量重新生成全部 rule 并重建项目 meta（首版落地或用户明确要求时才用）                                                                  |
| 重建单个（强制重生成某 rule）     | 用户显式说"重建 <DOC>"  | 忽略指纹直接按模板重生成该 rule（用于用户手工改坏/想重置时），重写项目 meta 对应条目                                                   |

后置必做 · globs 目录同步（本功能任何模式跑完都要做）：`ls` 实际目录（排除 `.git/node_modules/dist/build/.venv/__pycache__`）vs `docs/common/STRUCTURE.md` §1 目录树（项目无 STRUCTURE 文档时以 `ls` 现状为准）——有变动即执行功能 3 阶段 2 双向同步流程（细则见阶段 2：读 [references/globs.md](references/globs.md) → 目录→文档映射 → 提案交用户确认 → 写 frontmatter → `--check` 复核）；无变动也必须显式输出"目录无变动，globs 无需变更"。禁止只更新 rule 内容而静默跳过本检查——rule 指纹最新但 globs 不含任何代码路径，等于只做了一半。

### 脚本命令

> 完整命令清单见 [§脚本用法](#脚本用法解析工具可选)；本功能涉及三条：`--gen-meta`（用户显式触发，bump version + 刷新指纹，禁止自动钩子调用）、`--check-meta <项目meta>`（对比报告，退出码 0=全部最新 / 1=有需更新 / 2=配置错误）、`--update-project-meta`（rule 落盘后写项目 meta 条目，见下）。

> 生成/更新 rule 落盘时，用 `--update-project-meta <项目meta> <DOC> <version> <implHash> <templateHash>` 写入项目 meta 对应条目——`version`/`implHash`/`templateHash` 从 skill 侧 `meta.json`（安装目录内）读取（本 skill 当前自述版本；implHash 见其 implHash 字段；templateHash 见其 templates[<DOC>] 字段）。确定性脚本替代手工写 JSON 防写错——这是 check 的数据来源。

---

## 功能 3：文档-代码漂移检测与修复（已迁出 → docs-align skill）

> 本功能已迁出为独立 skill **docs-align**（模板：[references/skill-templates/docs-align/SKILL.template.md](references/skill-templates/docs-align/SKILL.template.md)，产物：目标项目 `.opencode/skills/docs-align/SKILL.md`）。五阶段流程（盘点 → globs 自适应 → 机检 → 逐文档语义核对 → 分诊修复）、机检点清单、漂移清单机制（.omo/drift/）全部由该 skill 承载。

本 skill 内的路由：

- **入口③ 对齐流水线步骤 2**（文档与代码对齐）→ 加载 docs-align 执行五阶段（模式按分诊：只读机检 or 对齐修复）
- **入口④ globs 轻量**（更新globs 等关键字）→ 加载 docs-align 执行阶段 1 盘点 + 阶段 2 globs 自适应
- **功能 1/2 的 globs 目录同步**（步骤 4 后置必做）→ 同为功能 3 阶段 2，路由 docs-align 执行

迁出边界：本 skill 保留功能 1（生成 rule）/功能 2（rule 更新检查）/功能 4（生成 skill）——rule 与 skill 的「生成与版本管理」；docs/** 文档的实际检测修复执行归 docs-align。

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
- skill 模板 SSOT：`references/skill-templates/<name>/SKILL.template.md` 是 `.opencode/skills/<name>/SKILL.md` 的唯一来源；范式纪律章节（断言三源/执行纪律/六关切表）逐字保留，实例化只发生在【实例化】标记行与占位符；产物 frontmatter 必含 `metadata.generated-by: doc-arch-rules` 溯源
- globs 两阶段生命周期：初始化（功能 1）基线逐字抄、AI 不得改；演进（功能 3 阶段 2，含功能 1 步骤 4 / 功能 2 update/rebuild 后置必做目录同步）AI 按 STRUCTURE 目录职责双向同步扩展——不变量：基线只增不减永不清理、扩展随磁盘现状追加与清理、无论有无变动必须显式给结论；追加/清理/改名成对/合并保留/`--check` 基线子集校验细则与语法匹配语义见 [globs 语法与用法](references/globs.md) §3/§5-§6
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
- 漂移疑似 Bug（功能 3 阶段 4）：代码偏离文档真实意图 → 停下问用户裁决，AI 不自主修代码
- skill 产物已存在且含项目侧手工改动（功能 4）：diff 列出改动让用户确认保留合并或覆盖，禁止静默覆盖
- skill 模板缺失（功能 4 要求清单外名称）：说明该 skill 模板未建，不臆造；可按 [skill 模板]（references/skill-templates/）既有模板的形态新建模板后再生成

## 维护

- 版本维护（用户显式触发，禁止自动化）：修改 SKILL.md / templates / scripts 后，由用户显式要求时执行 `--gen-meta`（递增 version + 刷新 implHash/templates 指纹）——push/commit 与版本更新无耦合（没 bump = 没发布，详见功能 2 版本指纹说明）；禁止以 git hook / 文件监听等形式自动 bump，未被授权时 AI 不得触碰 meta.json。版本变更与内容改动作为同一批改动提交（是否 commit/push 由用户显式指令）
- 模板更新：修改 `references/rule-templates/` 下文件后，用户显式要求时 bump 版本（`--gen-meta`）；项目侧按功能 2 check → update 按需重生成受影响 rule
- 新增文档类型：在 `references/rule-templates/<层>/` 加文件（无后缀=全局 rule；.template 后缀=模板，支持子目录如 `L2/deep-dives/`、`L2/research/`），重新生成对应 rule，更新本文件清单表与 meta
- skill 模板维护：新增/修改 `references/skill-templates/<name>/SKILL.template.md` 后，用户显式要求时 bump 版本（`--gen-meta`）；目标项目侧重跑「生成skill <name>」更新产物（覆盖前按错误处理规则 diff 确认）
- 脚本维护：脚本只做解析/校验/指纹（omo 五键 + generation 六字段 + 剥离 frontmatter + meta 生成/对比），模板缺 `description` 或 `alwaysApply`/`globs` 时报错退出（不兜底）；配置（`LAYER_ZH`/`SPECIAL_TARGETS`/`SKIP_FILES`）在脚本顶部。脚本为 Node 零依赖（手写 YAML 解析，复刻 omo parser-yaml.ts，不引入 npm 包）
