---
name: doc-arch-rules
description: >
  文档架构规范（L0-L4 + common 分层）与 omo rule 生成。为某个具体项目生成 .omo/rules/ 下的 rule 文件。
  两种文件模式：无 .template 后缀的文件（如 CONSTITUTION）本身即全局 Rule（内容 = 文件全文，alwaysApply 全局注入）；
  有 .template 后缀的文件是模板，rule = 生成指引（按模板 frontmatter 的 generation 元数据 scan/ask_user/flow/checks/related 执行）+ 模板全文拷贝。
  当用户要在项目里落地这套文档规范、生成文档 rule、维护文档模板、或要求"文档修改时按模板规范更新"时使用。
  模板与 rule 由 scripts/generate-rules.mjs 脚本驱动生成（Node 零依赖）。
allowed-tools: Read Write Edit Grep Bash(node:*)
---

# doc-arch-rules — 文档架构规范与 omo rule 生成

## 简介

本 skill 承载一套**文档架构规范**（基于 TOGAF 分层：L0 决策 → L1 产品 → L2 架构 → L3 契约 → L4 交付 + common 贯穿层），
以及把该规范落地到**具体项目**的工具：生成 omo 的 rule 文件（`.omo/rules/<DOC>.md`）。

**核心区分——按文件后缀分两种模式**：

| 文件类型                                                        | 是什么                            | rule 内容                                                                | 触发方式                                                   |
| --------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **无 `.template` 后缀**（如 `templates/L0/CONSTITUTION.md`）    | 本身就是全局 Rule，**不生成文档** | **文件全文**（rule = 该文件内容）                                        | `alwaysApply: true`（全局注入）                            |
| **有 `.template` 后缀**（如 `templates/L1/README.template.md`） | 模板，**用它生成某个文档**        | 生成指引（按模板 frontmatter `generation` 元数据执行）+ **模板全文拷贝** | `alwaysApply`（common 层）或 `globs`（L1-L4 匹配文档路径） |

**生成机制**：rule 由 `scripts/generate-rules.mjs` 脚本从 `references/templates/` 遍历生成（按文件名后缀自动分两类），模板更新后重跑脚本即可。

## 何时使用

- 用户想在某个项目里**落地这套文档架构规范**，生成 omo rule
- 用户要求"生成/更新某文档"（如 API、DOMAIN-MODEL、TEST-PLAN 等）
- 用户修改 `docs/**/` 下文档，希望按模板规范更新（由生成的 rule 触发）
- 用户想维护文档模板/重新生成 rule

## 文件清单（内置，本 skill 的 SSOT）

源文件位于 `references/templates/`（按层分目录）：**1 个全局 Rule 源（CONSTITUTION，无后缀）+ 13 个模板（.template 后缀）**。

| 层     | 文件                                                                                     | 类型         | rule 输出                            | 触发方式              |
| ------ | ---------------------------------------------------------------------------------------- | ------------ | ------------------------------------ | --------------------- |
| L0     | [CONSTITUTION](references/templates/L0/CONSTITUTION.md)（无后缀）                        | 全局 Rule 源 | rules/L0/CONSTITUTION.md             | alwaysApply           |
| L1     | [README](references/templates/L1/README.template.md)                                     | 模板         | rules/L1/README.md                   | globs（根 README.md） |
| L1     | [PRODUCT](references/templates/L1/PRODUCT.template.md)                                   | 模板         | rules/L1/PRODUCT.md                  | globs                 |
| L1     | [USER-STORY](references/templates/L1/USER-STORY.template.md)                             | 模板         | rules/L1/USER-STORY.md               | globs                 |
| L2     | [APPLICATION-ARCHITECTURE](references/templates/L2/APPLICATION-ARCHITECTURE.template.md) | 模板         | rules/L2/APPLICATION-ARCHITECTURE.md | globs                 |
| L2     | [DOMAIN-MODEL](references/templates/L2/DOMAIN-MODEL.template.md)                         | 模板         | rules/L2/DOMAIN-MODEL.md             | globs                 |
| L2     | [TECHNOLOGY-ARCHITECTURE](references/templates/L2/TECHNOLOGY-ARCHITECTURE.template.md)   | 模板         | rules/L2/TECHNOLOGY-ARCHITECTURE.md  | globs                 |
| L3     | [API](references/templates/L3/API.template.md)                                           | 模板         | rules/L3/API.md                      | globs                 |
| L3     | [INTEGRATION](references/templates/L3/INTEGRATION.template.md)                           | 模板         | rules/L3/INTEGRATION.md              | globs                 |
| L4     | [DEPLOYMENT](references/templates/L4/DEPLOYMENT.template.md)                             | 模板         | rules/L4/DEPLOYMENT.md               | globs                 |
| L4     | [TEST-PLAN](references/templates/L4/TEST-PLAN.template.md)                               | 模板         | rules/L4/TEST-PLAN.md                | globs                 |
| common | [CODE-GUIDE](references/templates/common/CODE-GUIDE.template.md)                         | 模板         | rules/common/CODE-GUIDE.md           | alwaysApply           |
| common | [GLOSSARY](references/templates/common/GLOSSARY.template.md)                             | 模板         | rules/common/GLOSSARY.md             | alwaysApply           |
| common | [STRUCTURE](references/templates/common/STRUCTURE.template.md)                           | 模板         | rules/common/STRUCTURE.md            | alwaysApply           |

> **DATA-ARCHITECTURE 已合并**进 DOMAIN-MODEL（§5 数据设计），脚本跳过，不生成 rule。
> **CONSTITUTION 无模板**：宪法是唯一真源（SSOT），不生成 docs/ 副本——rule 内容即宪法全文（`alwaysApply`），生成到目标项目时替换 `<项目名>` 占位符。
> **模板的 `generation` 块**（scan/ask_user/flow/reentrant/notes/checks/related/tools）是"生成/更新该文档的提示词"，仅模板持有，实例文档不含该块。

## 执行流程：生成 rule（脚本驱动，推荐）

rule 由脚本从模板自动生成，**不手工维护**：

```bash
node scripts/generate-rules.mjs            # 重新生成全部 rule（覆盖 references/rules/）
node scripts/generate-rules.mjs --check    # 只校验不写入（模板与 rule 一致性）
```

脚本逻辑（按文件名后缀自动分两类）：

1. 遍历 `references/templates/**/*.md`
2. **无 `.template` 后缀** → 全局 rule：`description + alwaysApply: true` + 文件全文
3. **有 `.template` 后缀** → 模板 rule：`description + globs/alwaysApply` + 生成指引（scan/ask_user/flow/checks/related）+ **模板全文完整拷贝**（frontmatter generation 元数据 + Markdown 正文）
4. 跳过 `DATA-ARCHITECTURE.template.md`（已合并）；README 的 globs 匹配根 `README.md`（特殊落盘）

## 执行流程：在目标项目落地 rule

1. **确认目标项目**：当前工作目录即目标项目；确认存在 `.omo/` 目录，无则 `mkdir -p .omo/rules`。
2. **复制 rule**：把 `references/rules/` 下的 rule 复制到目标项目 `.omo/rules/<层>/`（或按需选择部分 rule）。
   - **CONSTITUTION**：生成时把 `<项目名>` 占位符替换为实际项目名。
3. **可选：生成文档实例**：对模板类文档，若项目还没有这些文档，用模板（rule 内的「模板全文」）生成对应落盘路径，按 `> 【指引】` 填写。
4. **验证**：确认 rule 触发方式（CONSTITUTION/common 为 alwaysApply，其余为 globs）与项目实际文档路径匹配。

## 执行流程：更新某份文档（rule 触发后）

按生成的 rule 正文执行。两种模式：

**模式 A：全局 Rule（CONSTITUTION）**——rule 内容即宪法全文，任何会话开始即加载并遵守其条款，无"生成文档"动作。

**模式 B：模板 Rule（其余 13 个）**——修改目标文档时，按 rule 内「模板全文」执行：

1. **读 generation 元数据**（模板全文 frontmatter 的 `generation` 块），逐字段执行：
   - `scan`：自主扫描列出的源（不问用户）
   - `ask_user`：仅当列出的决策点有歧义时才问用户
   - `flow`：按流程分支执行（全量重建 / 增量修改）
   - `reentrant`：全量与增量都要支持
   - `notes`：注意点
   - `checks`：生成后逐条反向核对
   - `related`：更新后同步联动关联文档
2. **按模板正文生成**：以模板 Markdown 正文为结构基准，复制为落盘路径，按 `> 【指引】` 填写，**删除 generation 元数据块与全部 `> 【指引】`**。
3. **反向 check**：`generation.checks` 全部通过。

## 硬性要求

- **SSOT**：无后缀文件 = 全局 rule 内容即文件全文；模板 = 生成文档的唯一结构源；`generation` 元数据是文档的更新提示词，实例不复制该块。
- **不用 emoji**（S8）：文档/注释/rule 均不含 emoji（grep 校验 `grep -P "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" <文件>`）。
- **引用规范**：本 skill 内部引用一律用相对路径 + Markdown 链接（`references/templates/...`），**禁止 `@path`、禁止硬编码绝对路径、禁止 `./xxx` 依赖 cwd**。
- **联动**：更新某文档时按 `related` 同步关联文档；跨层引用单向向下，下层不链回上层。
- **图规范**：文档中的图按模板要求用 D2 / Mermaid / ASCII，绘制规范见 CONSTITUTION §3.2。

## 错误处理

- **模板缺失**：若用户要的文档不在清单（如 DATA-ARCHITECTURE），说明该模板已合并或不存在，不臆造；CONSTITUTION 无模板属正常（全局 rule 即宪法全文）。
- **rule 未触发**：检查 `.omo/rules/<DOC>.md` 的 globs 是否匹配实际文档路径；确认 `.omo/` 目录存在。
- **文档与模板冲突**：以模板结构为准重建（全量）或按 `reentrant` 增量更新，保留用户定制内容。
- **模板更新后 rule 未同步**：重跑 `node scripts/generate-rules.mjs` 重新生成。

## 维护

- **模板更新**：修改 `references/templates/` 下文件后，重跑 `scripts/generate-rules.mjs` 重新生成 rule（rule 是模板的派生物，不手工改）。
- **新增文档类型**：在 `references/templates/<层>/` 加文件（无后缀=全局 rule；.template 后缀=模板），重跑脚本自动生成对应 rule，更新本文件清单表。
- **脚本维护**：rule 的 frontmatter（`description`/`alwaysApply`/`globs`）**从模板 frontmatter 直接抄写**（omo parser-yaml 语义），模板缺 `description` 或 `alwaysApply`/`globs` 时脚本报错退出（不兜底）。脚本配置（`LAYER_ZH`/`SPECIAL_TARGETS`/`SKIP_FILES`）在 `scripts/generate-rules.mjs` 顶部，新增层/特殊路径时调整。脚本为 **Node 零依赖**（手写 YAML 解析，复刻 omo parser-yaml.ts，不引入 npm 包）。
