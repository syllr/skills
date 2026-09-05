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

- 输入：`references/templates/` 下模板（1 个全局 Rule 源 + 21 个模板，清单见 [§文件清单](#文件清单模板-ssot)）
- 输出：`.omo/rules/docs/` 下的 rule（一个模板对应一个 rule，目录结构与 `references/templates` 同构）
- **除 DEEP-DIVE/RESEARCH/CONTRACT/ADR 目录级通配外，其余 1:1 同构**；目录级模板按 globs 通配覆盖，详见表
- **只生成 rule，不生成文档**：宿主项目 `docs/**` 由 rule 触发后的 AI 按 rule 内容生成/更新

**两种文件模式**：

| 文件类型                                               | 是什么       | rule 内容                                                                                                                                        | 触发方式               |
| ------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **无 `.template` 后缀**（`templates/CONSTITUTION.md`） | 全局 Rule 源 | frontmatter（抄 omo：`description + alwaysApply: true`）+ **文件全文**                                                                           | `alwaysApply` 全局注入 |
| **有 `.template` 后缀**（21 个）                       | 模板         | frontmatter（抄 omo：`description + globs`）+ **四节正文**（内联翻译 generation）+ **「模板」章节**（模板 Markdown 正文，剥离 YAML frontmatter） | `globs`                |

## 何时使用（仅手动触发）

**只有两种分诊结果**：

| 分诊结果                     | 触发关键词                                                                                     | 说明                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **① init → 生成 rule**       | `init` 类关键词（详见信号判定细则；"重建 <DOC>"强制重生成单个）                                | 初始化 rule（功能 1，直接全量 rebuild，无需 check 增量）                                                                                             |
| **② 文档与代码对齐（默认）** | `/doc-arch-rules` 无 init 关键字（默认动作，含"检查一下/需要更新吗/看看有没有漂移"等只读询问） | 对齐流水线。缺失判定以文档架构（宪法 §3.1）`必选性`列为 SSOT。**不清晰时做二次分诊**：与预期清单对比，必选缺失→初始化，按需缺失属正常（见宪法 §3.1） |

> 详细路由见下方「分诊决策树」与「信号判定细则」。

## 功能分诊（进入 skill 的第一件事）

**自动判断是默认，问用户只是 fallback**（实在分不清才问）。路由：按是否含 `init` 关键字分流到两种结果。

### 分诊决策树（两种结果）

```
用户输入
├─ 含 init 关键字（init / 初始化 / 生成rule / 生成文档规范）
│    → 分诊结果①：生成/更新 rule（功能 1，元数据直接全量 rebuild）
│    ├─ 项目无 .omo/rules/docs/ → 全量生成
│    └─ 已有 rule → 直接全量 rebuild（"重建 <DOC>"可指定单个，默认全量；无需 check 增量）
│
└─ 无 init 关键字（默认：/doc-arch-rules 啥都不带，含只读询问）
     → 分诊结果②：文档与代码对齐
     ├─ 步骤 0 · 只读摸底（先跑出清单：`--check-meta` 三态表 + 漂移机检——均只读，不写文件）
     ├─ 范围确认（把清单给用户看：哪些 rule 需更新、哪些文档需修/需新建、跳过哪些；确认后进入步骤 1/2，拒绝则仅输出只读报告）
     ├─ 步骤 1 · 确认后按需 update（重生成「需更新」的 rule + 刷新项目 meta）
     ├─ 步骤 2 · 文档与代码对齐
     │    ├─ 二次分诊：与文档架构（宪法 §3.1）预期 `docs/` 清单及其`必选性`列对比，缺失的按必选性判定：必选缺失→初始化；按需缺失属正常（见宪法 §3.1）；已有的 → 以代码为准修文档（遵守 rule；疑似 Bug 停下问用户）
     └─ 输出总报告：rule 更新了哪些 + 文档修/新建了哪些 + 待用户裁决项
```

### 信号判定细则

| 维度             | 判定                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **init 关键字**  | `init` / `初始化` / `生成rule` / `生成文档规范` → 分诊结果①；"重建 <DOC>"（指定单个文档）→ 结果①强制重生成该 rule                       |
| **对齐（默认）** | 无 init 关键字即分诊结果②（含只读询问"需要更新吗/检查一下/看看有没有漂移"——走步骤 0 只读摸底，不写文件；确认后才进入动手）              |
| **二次分诊**     | 同决策树「步骤 2 · 文档与代码对齐」的二次分诊（必选缺失→初始化；按需缺失属正常；已有的 → 漂移修复）。以此区分"首次生成"与"对齐修复"     |
| **安全默认**     | 结果①（rule 属元数据）直接全量 rebuild（无需 check 增量）；结果②（文档）走 check → update（不做无差别全量覆盖，动手前必须经过范围确认） |
| **范围确认**     | 结果① update / 结果② 步骤 1/2 动手前把清单给用户看（更新哪些、跳过哪些、疑似 Bug 哪些），确认后动手；用户可在此拒绝，退回只读           |
| **fallback**     | 带 init 关键字但又像在做别的 / 意图混合（如"更新 rule 然后检查漂移"）→ 问用户确认                                                       |

> **两个检查维度正交**：功能 2 检测 **rule 版本级漂移**（rule vs skill/模板指纹——AI 随机性与模板变更）；功能 3 检测 **文档内容级漂移**（文档 vs 代码，走宪法 第5条 差异分诊）。默认流水线把两者串起来，用户一次调用即完成全部对齐。

### Gap 处置询问（分诊后 → 动手前必问）

> **触发条件**：分诊结果为 ①（生成/更新 rule 已有内容）或 ②（对齐流水线），且 `docs/` 非空（非首次生成），且步骤 0 检出 code-doc 差异（`--check-meta` 需更新或漂移机检有 gap）时，**进入动手前必须先问用户 Gap 处置方式**。文档为空（首次生成）时跳过此问，直接生成。

**必问三选项**（单选）：

| 选项              | 含义                      | 后果                                                             |
| ----------------- | ------------------------- | ---------------------------------------------------------------- |
| **1. 以文档为准** | 文档是 SSOT，代码错了     | 按文档改代码（AI 改代码需用户二次确认是否改实现）                |
| **2. 以代码为准** | 代码是 SSOT（宪法 第1条） | 按代码改文档（遵守 rule，走 第5条 分诊，默认推荐）               |
| **3. 逐条判断**   | 每条差异单独定            | 列清单让用户逐条选 1/2，**生成漂移清单跟踪文档**，边修边更新状态 |

**选项 3 的跟踪文档机制（.omo/drift/ · 按文件一清单 · 宪法 第8条 固定格式可解析）**：

- **位置**：按漂移文件各落一清单 `.omo/drift/<doc>.md`（如 `DOMAIN-MODEL.md`→`.omo/drift/DOMAIN-MODEL.md`；`docs/L2/FOO.md`→`.omo/drift/FOO.md`；与 `.omo/plans` 同级，不入 docs/，不提交即跟踪态）
- **记录时机**：发现漂移即记（默认不问处置，不填以文档/以代码）；真正要解决时才必问 Gap 处置
- **格式**（默认记录，固定可解析）：
  ```markdown
  ## Drift: <doc>（YYYY-MM-DD HH:mm 生成，来源：rule 指纹 + 代码漂移）

  | #   | 位置                        | 差异（文档 vs 代码）                             | 状态    |
  | --- | --------------------------- | ------------------------------------------------ | ------- |
  | 1   | docs/L2/DOMAIN-MODEL.md:123 | 文档写「待规划业务域只含 OHS」vs 代码已建 Action | ☐待修复 |
  ```
  - `状态`：`☐待修复 → ◐修复中 → ☑已修复 → ☑已验证`（枚举固定，符号可选前缀）
- **解决时扩展**：用户选 Gap 处置 3.逐条判断时，**补 `建议`/`判定` 列**（`建议`=AI 按 第5条 预判 1/2，`判定`=用户逐条 1/2，默认同建议），表头变为 `| # | 位置 | 差异 | 建议 | 判定 | 状态 |`
- **更新时机**：每修复一条，**立即**更新该行 `状态`（不批量）；`--check-meta` / 漂移机检每完成一批，追加/更新对应行
- **完成判定**：单文件全部行 `状态=☑已验证`（或用户确认"剩余忽略"），且 `grep -rn "§x" docs/` 对已删章节零残留（第6条）
- **删除规则**：单文件判定通过后，**立即删除该 drift 文件**（如 `rm .omo/drift/DOMAIN-MODEL.md`，空目录一并 `rmdir`）；删除前可在报告中贴"已修复 N/M，最后一条 @ <commit>" 摘要。**禁止**将 drift 清单提交入库或长期保留——它是过程态跟踪文档，完成即清理。
- **异常**：中途用户改口（如"剩余全按 2 处理"）→ 批量更新 `判定` 列，继续跟踪。

## 文件清单（模板 SSOT）

源文件位于 `references/templates/`：**1 个全局 Rule 源（CONSTITUTION，无后缀）+ 21 个模板（.template 后缀，含 L2/deep-dives + L2/research + L3/integration-contracts + common/ADR 子目录）**。

| 层                       | 文件                                                                                     | 类型         | rule 输出                                                                                                                                                                    | 触发方式              |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| CONSTITUTION             | [CONSTITUTION](references/templates/CONSTITUTION.md)（无后缀）                           | 全局 Rule 源 | .omo/rules/docs/CONSTITUTION.md                                                                                                                                              | alwaysApply           |
| L1                       | [README](references/templates/L1/README.template.md)                                     | 模板         | .omo/rules/docs/L1/README.md                                                                                                                                                 | globs（根 README.md） |
| L1                       | [PRODUCT](references/templates/L1/PRODUCT.template.md)                                   | 模板         | .omo/rules/docs/L1/PRODUCT.md                                                                                                                                                | globs                 |
| L1                       | [USER-STORY](references/templates/L1/USER-STORY.template.md)                             | 模板         | .omo/rules/docs/L1/USER-STORY.md                                                                                                                                             | globs                 |
| L2                       | [APPLICATION-ARCHITECTURE](references/templates/L2/APPLICATION-ARCHITECTURE.template.md) | 模板         | .omo/rules/docs/L2/APPLICATION-ARCHITECTURE.md                                                                                                                               | globs                 |
| L2                       | [DOMAIN-MODEL](references/templates/L2/DOMAIN-MODEL.template.md)                         | 模板         | .omo/rules/docs/L2/DOMAIN-MODEL.md                                                                                                                                           | globs                 |
| L2                       | [DATA-ARCHITECTURE](references/templates/L2/DATA-ARCHITECTURE.template.md)               | 模板         | .omo/rules/docs/L2/DATA-ARCHITECTURE.md                                                                                                                                      | globs                 |
| L2                       | [TECHNOLOGY-ARCHITECTURE](references/templates/L2/TECHNOLOGY-ARCHITECTURE.template.md)   | 模板         | .omo/rules/docs/L2/TECHNOLOGY-ARCHITECTURE.md                                                                                                                                | globs                 |
| L2/deep-dives            | [INDEX](references/templates/L2/deep-dives/INDEX.template.md)                            | 模板         | .omo/rules/docs/L2/deep-dives/INDEX.md                                                                                                                                       | globs                 |
| L2/deep-dives            | [DEEP-DIVE](references/templates/L2/deep-dives/DEEP-DIVE.template.md)                    | 模板         | .omo/rules/docs/L2/deep-dives/DEEP-DIVE.md（目录级通配，globs: docs/L2/deep-dives/*.md 覆盖目录下多文档，物理单 rule）                                                       | globs                 |
| L2/research              | [RESEARCH](references/templates/L2/research/RESEARCH.template.md)                        | 模板         | .omo/rules/docs/L2/research/RESEARCH.md（目录级通配，globs: docs/L2/research/*.md 覆盖目录下多文档，物理单 rule，独立成篇无索引；无 INDEX，区别于 deep-dives 的 INDEX 管理） | globs                 |
| L3                       | [API](references/templates/L3/API.template.md)                                           | 模板         | .omo/rules/docs/L3/API.md                                                                                                                                                    | globs                 |
| L3                       | [INTEGRATION](references/templates/L3/INTEGRATION.template.md)                           | 模板         | .omo/rules/docs/L3/INTEGRATION.md（说明书模式，globs: docs/L3/INTEGRATION.md + docs/L3/integration-contracts/**）                                                            | globs                 |
| L3/integration-contracts | [CONTRACT](references/templates/L3/integration-contracts/CONTRACT.template.md)           | 模板         | .omo/rules/docs/L3/integration-contracts/CONTRACT.md（目录级通配，globs: docs/L3/integration-contracts/** 覆盖目录下多契约文件，物理单 rule，一服务一契约，字段 SSOT）       | globs                 |
| L4                       | [DEPLOYMENT](references/templates/L4/DEPLOYMENT.template.md)                             | 模板         | .omo/rules/docs/L4/DEPLOYMENT.md（globs 含 docs/L4/deployment/README.md，部署资产登记）                                                                                      | globs                 |
| L4                       | [TEST-PLAN](references/templates/L4/TEST-PLAN.template.md)                               | 模板         | .omo/rules/docs/L4/TEST-PLAN.md                                                                                                                                              | globs                 |
| common                   | [CODE-GUIDE](references/templates/common/CODE-GUIDE.template.md)                         | 模板         | .omo/rules/docs/common/CODE-GUIDE.md                                                                                                                                         | globs                 |
| common                   | [DATA-DICTIONARY](references/templates/common/DATA-DICTIONARY.template.md)               | 模板         | .omo/rules/docs/common/DATA-DICTIONARY.md（字段/枚举/事件级 SSOT）                                                                                                           | globs                 |
| common                   | [SECURITY](references/templates/common/SECURITY.template.md)                             | 模板         | .omo/rules/docs/common/SECURITY.md（贯穿所有层，密钥分层 SSOT 在 §6）                                                                                                        | globs                 |
| common                   | [GLOSSARY](references/templates/common/GLOSSARY.template.md)                             | 模板         | .omo/rules/docs/common/GLOSSARY.md                                                                                                                                           | globs                 |
| common                   | [STRUCTURE](references/templates/common/STRUCTURE.template.md)                           | 模板         | .omo/rules/docs/common/STRUCTURE.md                                                                                                                                          | globs                 |
| common                   | [ADR](references/templates/common/ADR.template.md)                                       | 模板         | .omo/rules/docs/common/ADR.md（目录级通配，globs: docs/adr/*.md 覆盖目录下多文档，物理单 rule）                                                                              | globs                 |

> **DATA-ARCHITECTURE 已合并**进 DOMAIN-MODEL（§5 数据设计），不生成 rule。
> **模板 frontmatter 的 `generation` 块**（tools/related/ask_user/flow/notes/checks）是 rule 对应目标文档（`docs/**` 下由 `globs` 指定的路径）的生成提示词，仅模板持有——生成 rule 时**内联翻译**进正文四节，不保留 YAML 形态。

## 功能 1：生成 rule（执行流程：AI 主流程）

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
- **rule 落盘校验**（本步骤对象）：frontmatter 中 `description`/`alwaysApply` 与模板 omo 一致，`globs` 含模板基线全部条目（允许含功能 3 追加的扩展条目，`--check` 只判基线子集、不禁扩展）；rule 内不含 `generation:` YAML 块；「模板」章节正文与模板正文一致——用 `--check <rule> <模板>` 逐 rule 复核（批量用 `--all` 解析全部模板拿清单后循环调用）
- **globs 基线（初始化不可改）**：功能 1 初始化时 `globs` 逐字抄模板基线，AI 不得删除/改写基线条目；项目演进后的扩展只在功能 3 对齐时追加（见功能 3 阶段 2），不在本功能动手
- **宿主文档单链校验（顺带，属功能 3 机检对象，非 rule 校验）**：生成 rule 后顺带检查宿主项目 `docs/` 文档的单链一致性——L2 三总览（APPLICATION-ARCHITECTURE / DOMAIN-MODEL / TECHNOLOGY-ARCHITECTURE = 3 个文件）各节有且仅有一处 `详见 deep-dives/`（应为 3）；仅 2 份 L2 总览（TECHNOLOGY-ARCHITECTURE + APPLICATION-ARCHITECTURE）引用 research，各一处 `详见 research/`（应为 2）。示例：`grep -rn "详见 deep-dives/" docs/L2/*.md | wc -l` 应为 3；`grep -rn "详见 research/" docs/L2/*.md | wc -l` 应为 2

---

## 功能 2：rule 更新检查（版本指纹）

> **解决的问题**：AI 组装 rule 有随机性——即使 skill 与模板都没变，两次生成的 rule 措辞也不同。所以「rule 是否需要更新」**不能靠全文 diff**（会把措辞差异误报为漂移），要靠**版本指纹对比**：随机性只影响措辞不影响信息，只要指纹一致就无需更新。
> **入口语义**：本功能承载分诊结果②对齐流水线中的 rule 检查与更新（决策树步骤 0 的 `--check-meta` 摸底 + 步骤 1 的按需 update）；分诊结果①（init）直接全量 rebuild，不经本功能 check。

### 机制：两份 meta.json + 逐条目对比

- **skill 侧 `<skill>/meta.json`**（自述版本，SSOT）：`{ version, implHash, templates, generatedAt }`
  - `version`：发布标记，**仅用户显式触发 `--gen-meta` 时递增**（push/commit 与版本更新无耦合——没 bump = 没发布，项目侧感知不到是正确行为）
  - `implHash`：assembly.md + SKILL.md + scripts/ 的内容指纹（组装逻辑全部输入）——区分 version 变更原因（implHash 变 = 组装逻辑变，影响全部 rule；implHash 不变 = 仅模板变，按模板粒度跳过）
  - `templates`：每个模板的内容指纹
- **项目侧 `<项目>/.omo/rules/docs/meta.json`**（生成时快照）：`{ rules: { "<DOC>": { version, implHash, templateHash } } }`——**按 rule 记条目**（不同 rule 可能不同版本生成），生成/更新某个 rule 时只更新该条目
- **对比（`--check-meta`，纯字段比对，无 AI 参与、无随机性）**：逐 rule 条目——缺失 → 需更新；implHash 变 → 需更新（影响全部）；templateHash 变 → 需更新；均同 → **最新（即使 version 标记不同，内容未变即跳过重生成）**
- **检测边界（指纹机制只回答"skill/模板是否变了"，不回答"组装质量"与"手工修改"）**：
  - **用户手工修改 rule**（改触发条件措辞/删节）→ 指纹不变，check 判定仍为最新、不会自动覆盖——**这是设计意图（防误覆盖）**；如需强制重生成请显式说"重建 <DOC>"
  - **组装质量**（AI 组装漏 generation 条目/曲解字段）→ 指纹不变；落盘 `--check` 只校验 frontmatter/无 generation YAML/模板章节，**四节正文信息完整性无机器闭环**——依赖落盘时 AI 自检（见功能 1 步骤 2 硬约束）
- **globs 扩展豁免与合并**：`--check-meta` 只比对 `version`/`implHash`/`templateHash`，**不比对 `globs` 内容**——功能 3 追加的扩展条目不触发"需更新"；`update`/`rebuild` 重生成某 rule 时必须做合并（基线以模板为准重写 + 仍存在于磁盘的扩展条目做并集保留），禁止用纯模板基线覆盖丢扩展；"重建 <DOC>"为显式重置，丢扩展并重写项目 meta 对应条目

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

> **定位**：宪法 §2.2 差异分诊（第5条）的 skill 化执行器——规则基础全部已存在（第1条 代码是唯一事实 / 第5条 四步分诊 / 第4条 主动修复 / 第7条 文档与代码同交付），本功能把它们变成**可重复调用的系统化流程**。**以代码为准修复文档，修复时遵守对应 rule**（等价于按 rule 重新生成受影响部分）。

**触发**：用户手动要求——"检查文档和代码有没有漂移"（疑问 → 分诊② 只读机检）/ "以代码为准修文档" / "docs 和代码对齐"（命令 → 分诊② 对齐流水线步骤 2）。

### 五阶段流程

**阶段 1 · 盘点（全量扫描，不抽样）**：① 全仓目录漫游：`ls -R`（排除 `.git/node_modules/dist/build/.venv/__pycache__`），产出实际目录树 + 各顶层目录文件数；② 读 `.omo/rules/docs/` 全部 rule 的 globs → 文档清单；③ 以实际目录树为准判定每个目录"干什么"（STRUCTURE §2 只做职责解释，现状以 `ls` 为准），STRUCTURE 文档与实际不一致即记漂移；④ 每份文档标注机检点（见下表）+ 其代码扫描范围（阶段 2 映射）。本阶段输出必须含"实际顶层目录清单 + 文件数"，缺此即未完成，不得进入阶段 3。

**阶段 2 · globs 自适应（代码→文档反向触发，AI 按项目现状改扩展条目）**：先读 skill [globs 语法与用法](references/globs.md)，再读 `docs/common/STRUCTURE.md` §1 目录树 + `ls` 实际目录，逐目录判定"它是干什么的"（职责见 STRUCTURE §2），产出代码→文档映射（目录/文件模式 → 对应 rule）；再逐 rule 对比"基线 globs + 已有扩展"与映射缺口，提出追加项（仅追加真实存在的路径，模式收敛到最小可用通配，如 `backend/app/models/**` 优于 `backend/**`）；**基线条目只增不减**（缺基线即异常，先补基线再谈扩展）；扩展清单随范围确认交用户确认，确认后写 rule frontmatter `globs` 并用 `--check <rule> <模板>` 复核基线子集通过。

**阶段 3 · 机检**（AI 用 grep/ls/diff 按清单执行；一期无独立脚本）：

| 机检点                                                 | 方法                         |
| ------------------------------------------------------ | ---------------------------- |
| 文档内 File:Line 引用有效性                            | 文件存在 + grep 符号存在     |
| STRUCTURE 目录树 vs 实际目录                           | diff 目录树与 `ls -R`        |
| openapi.yaml 端点数 vs API.md 头注释计数 vs 代码路由数 | 三方计数对比                 |
| 交叉引用死链（文档 A 引 文档 B §X，B 无该节）          | grep 目标文档章节标题        |
| PRODUCT 能力行 ↔ DOMAIN Action 清单双向对齐            | 交叉 grep 能力名/Action 名   |
| DOMAIN 签名草图 vs 代码函数签名                        | grep `def`/`func` 匹配签名表 |

**阶段 4 · AI 语义核对（逐文档全读，不抽样）**：对每份文档，按其 rule globs（含阶段 2 扩展）列出本次已读代码文件清单，逐文件读后对照文档陈述（行为/规则/流程/约束），差异逐条记"文件:位置 / 文档陈述 vs 代码事实"；禁止抽样（只读 1-2 个代表文件即违规），禁止无 `File:Line` 佐证的"一致/无漂移"结论；输出必须含每文档"已读 N 个文件" + 文件清单，否则视为没读。

**阶段 5 · 分诊修复**（严格走宪法 第5条 四步，按 ①→②→③→④ 执行）：

- ① **先判是否为 Bug**：代码偏离文档真实意图（文档真实反映用户需求，代码写错）→ **停下问用户裁决**：用户认可才修代码；不认可则按文档为准改文档；非 Bug 才走 ②③④
- ② 自动化优先（机检可判定的先自动处理；无自动化工具时跳过）
- ③ 默认**以代码为准**修文档（按对应 rule 重新生成受影响节，修后跑该 rule 的 checks 验证）
- ④ 漂移定级（低/中/高，定级决定是否单列跟踪，见宪法 第5条）

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
- **globs 两阶段生命周期**：初始化（功能 1）基线逐字抄、AI 不得改；演进（功能 3 阶段 2）AI 按 STRUCTURE 目录职责追加扩展、基线只增不减；`--check` 只验基线子集，`--check-meta` 不比 globs 内容，`update`/`rebuild` 合并保留有效扩展；语法与匹配语义见 [globs 语法与用法](references/globs.md)
- **rule 内禁止 YAML generation 原始块**：见 [组装规则（硬约束）](references/assembly.md)；generation 信息一律内联翻译为正文四节，不保留 YAML 形态
- **引用规范**：本 skill 内部引用一律用相对路径 + Markdown 链接（`references/templates/...`），禁止 `@path`、禁止硬编码绝对路径、禁止 `./xxx` 依赖 cwd
- **联动**：rule 触发后 AI 更新文档时按 `related` 同步关联文档；本 skill 保证 rule 正确携带 `related`；跨层引用单向向下，下层不链回上层
- **章节重排必须重编号连续 + 批量同步引用**（rule 触发后重构文档时生效，宪法 第6条 执行细则）：重排/删除章节后**禁止保留旧章节号跳号**（如 3.3 跳 3.6）——必须重编号连续，并用 grep 批量找出所有 `§X` 引用（含下游文档/rule/deep-dives/TEST-PLAN）同步更新；**禁止留「已迁移/已删除至 X」正文占位**（违反 第6条 当前态——需保留导航时用不渲染的 HTML 注释 `<!-- ... -->`）；`.omo/plans` 与 `.omo/evidence` 属历史记录不追溯；完成判定加「全仓无指向已删章节的 §x 引用」
- **内容收拢后原横切节必须删表改引用（第2条）**：把内容收进各域/各节后，原横切节（如全局事件清单）**禁止名义保留整表副本**——必须删表改为「各域见 §X.X」引用，否则与域内表重复违反 SSOT
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

- **版本维护（用户显式触发，禁止自动化）**：修改 SKILL.md / templates / scripts 后，**由用户显式要求**时执行 `--gen-meta`（递增 version + 刷新 implHash/templates 指纹）——push/commit 与版本更新无耦合（没 bump = 没发布，详见功能 2 版本指纹说明）；**禁止**以 git hook / 文件监听等形式自动 bump，未被授权时 AI 不得触碰 meta.json。版本变更与内容改动作为同一批改动提交（是否 commit/push 由用户显式指令）
- **模板更新**：修改 `references/templates/` 下文件后，用户显式要求时 bump 版本（`--gen-meta`）；项目侧按功能 2 check → update 按需重生成受影响 rule
- **新增文档类型**：在 `references/templates/<层>/` 加文件（无后缀=全局 rule；.template 后缀=模板，支持子目录如 `L2/deep-dives/`、`L2/research/`），重新生成对应 rule，更新本文件清单表与 meta
- **脚本维护**：脚本只做解析/校验/指纹（omo 五键 + generation 六字段 + 剥离 frontmatter + meta 生成/对比），模板缺 `description` 或 `alwaysApply`/`globs` 时报错退出（不兜底）；配置（`LAYER_ZH`/`SPECIAL_TARGETS`/`SKIP_FILES`）在脚本顶部。脚本为 **Node 零依赖**（手写 YAML 解析，复刻 omo parser-yaml.ts，不引入 npm 包）
