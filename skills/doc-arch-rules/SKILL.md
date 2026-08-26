---
name: doc-arch-rules
description: >
  文档架构规范（L0-L4 + common 分层）与 omo rule 生成。为具体项目生成 .omo/rules/docs/ 下的 rule，用于优化项目文档；本 skill 仅操作/修改 .omo/rules/docs/ 下的文件，只生成 rule 不生成文档。
  两种文件模式：无 .template 后缀的文件（如 CONSTITUTION）本身即全局 Rule（frontmatter 抄 omo + 文件全文，alwaysApply 全局注入）；
  有 .template 后缀的文件是模板，生成的 rule = frontmatter（抄 omo 字段）+ 四节正文（内联翻译 generation：触发条件/执行流程/硬性要求/完成判定）+ 「模板」章节（模板 Markdown 正文，不含 YAML frontmatter）。
  仅当用户手动要求更新文档规范（生成/更新 .omo/rules/docs 下的 rule）时触发，不自动触发。
---

# doc-arch-rules — 文档架构规范与 omo rule 生成

## 简介

本 skill 承载一套**文档架构规范**（基于 TOGAF 分层：L0 决策 → L1 产品 → L2 架构 → L3 契约 → L4 交付 + common 贯穿层），以及把该规范落地到具体项目的工具：**生成 omo rule**（`.omo/rules/docs/`）。

本 skill 是 **rule 工厂**：

- 输入：`references/templates/` 下模板（1 个全局 Rule 源 + 16 个模板，含 L2/deep-dives + L2/research 子目录）
- 输出：`.omo/rules/docs/` 下的 rule（一个模板对应一个 rule，目录结构与 `references/templates` 同构，含 `L2/deep-dives/` + `L2/research/`）
- **除 DEEP-DIVE/RESEARCH 目录级通配外，其余 1:1 同构**；目录级模板按 globs 通配覆盖，详见表
- **只生成 rule，不生成文档**：宿主项目 `docs/**` 由 rule 触发后的 AI 按 rule 内容生成/更新

**两种文件模式**：

| 文件类型                                               | 是什么       | rule 内容                                                                                                                                        | 触发方式               |
| ------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **无 `.template` 后缀**（`templates/CONSTITUTION.md`） | 全局 Rule 源 | frontmatter（抄 omo：`description + alwaysApply: true`）+ **文件全文**                                                                           | `alwaysApply` 全局注入 |
| **有 `.template` 后缀**（16 个）                       | 模板         | frontmatter（抄 omo：`description + globs`）+ **四节正文**（内联翻译 generation）+ **「模板」章节**（模板 Markdown 正文，剥离 YAML frontmatter） | `globs`                |

## 何时使用（仅手动触发）

- 用户想在项目里落地这套文档架构规范，生成 omo rule
- 用户手动要求"生成/更新文档规范"（即生成/更新 `.omo/rules/docs` 下的 rule）
- 用户想维护文档模板/重新生成 rule

> 每次调用本 skill 时，**批量重新生成全部 rule**：按 §文件清单 SSOT 批量覆盖（见上表），而非生成文档。

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

### 占位符映射（组装前先查表，消除对 `<DOC>/<层中文>/<target>` 的猜测）

| 占位符      | 取值                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LAYER_ZH`  | constitution→宪法，L1→L1 产品层，L2→L2 架构层，L3→L3 契约层，L4→L4 交付层，common→common 贯穿层（同 scripts/parse-template.mjs）；**子目录继承父层中文**（如 L2/deep-dives→L2 架构层；research 同理继承 L2） |
| `DOC`       | 模板文件名去 `.template.md` 后缀（如 APPLICATION-ARCHITECTURE）                                                                                                                                              |
| 特殊 target | README→README.md（根）                                                                                                                                                                                       |
| 其余 target | 按 globs[0] 逐字抄写，不推导                                                                                                                                                                                 |

### 步骤 2：组装 rule

**模式 A：全局 Rule（CONSTITUTION，无 .template）**

```markdown
---
description: <抄模板 description>
alwaysApply: true
---

<模板正文全文（宪法条款，无 generation）>
```

**模式 B：模板 Rule（有 .template）**——四节正文按以下映射**内联翻译** generation 的全部信息，末尾「模板」章节放剥离 frontmatter 后的模板正文：

```markdown
---
description: <抄模板 description>
globs:
  - "<抄模板 globs>"
---

# <DOC> 文档更新规范（<层中文>）

## 触发条件

当以下任一情况发生时，本规则必须生效：

- 编辑、新增或重建 `<target>`
- 关联文档变化需联动更新：
  - `<关联文档1>`（<联动说明>）
  - `<关联文档2>`（<联动说明>）
- 用户要求"生成/更新 <DOC>"

## 执行流程

1. **工具**：<tools 内容逐条列出>
2. **问用户**（仅当有歧义）：<ask_user 内容逐条列出>
3. **生成流程**（含读输入源/检查目标现状/探测项目）：<flow 内容逐条列出>
4. **联动同步**：修改目标文档后，先读关联文档判断影响，受影响的一并同步修改，完成后校验关联一致性

## 硬性要求

- <notes 内容逐条列出>
- **联动**：更新时按 related 同步关联文档（见触发条件）；跨层引用单向向下，下层不链回上层
- **图规范**：按 CONSTITUTION §3.2 用 D2 / Mermaid / ASCII

## 完成判定

以下全部通过才算完成：

- <checks 1>
- <checks 2>
- ...

---

## 模板（生成/更新文档的结构基准）

以下为 `<target>` 的模板正文（不含 YAML frontmatter，生成/更新时以此结构为准，按 `> 【指引】` 填写，实例不含 `> 【指引】` 说明）：

<模板 Markdown 正文>
```

**组装规则（硬约束）**：

- frontmatter 的 `description`/`alwaysApply`/`globs` **逐字抄**模板 omo 字段，不推导、不改写
- 四节正文**必须覆盖** generation 全部字段信息（tools/related/ask_user/flow/notes/checks 逐条内联，related 保留"文档名+联动说明"配对）
- 「模板」章节**只放剥离 YAML frontmatter 后的 Markdown 正文**（保留 `> 【指引】` 行）
- **rule 内禁止出现 YAML frontmatter 的 generation 原始块**（`---` 内 YAML dump）；generation 信息一律以自然语言四节形式存在

### 步骤 3：落盘校验

- 批量写入 `.omo/rules/docs/<路径>`（CONSTITUTION.md 在根；其余在 `<层>/<DOC>.md`，含 `L2/deep-dives/<name>.md` + `L2/research/<name>.md`）
- 校验：frontmatter 与模板 omo 一致；rule 内不含 `generation:` YAML 块；「模板」章节正文与模板正文一致；L2 三总览与 `deep-dives/INDEX` 单链一致（各节有且仅有一处 `详见 deep-dives/`），`research` 同理（各 RESEARCH 结论有且仅有一处链回 ADR，TECHNOLOGY-ARCHITECTURE 有且仅有一处详见 research/）。校验示例：`grep -rn "详见 deep-dives/" .omo/rules/docs/L2/*.md | wc -l` 应为 3；`grep -rn "详见 research/" .omo/rules/docs/L2/*.md | wc -l` 应为 2
- 可用 `--check` 复核（`--all` 递归覆盖子目录）

## 脚本用法（解析工具，可选）

脚本只做**解析/校验**，不组装 rule；组装由 AI 按本 SKILL 流程完成。

```bash
node <skill>/scripts/parse-template.mjs <模板路径>            # 解析单个模板，输出 JSON：{omo, target, generation, content}
node <skill>/scripts/parse-template.mjs --check <rule路径> <模板路径>  # 校验 rule（frontmatter 一致 + 无 generation YAML + 模板章节正文一致）
```

> `<skill>` 为 skill 实际安装路径（全局 `~/.config/opencode/skills/doc-arch-rules` 或项目级 `.opencode/skills/doc-arch-rules`），可先探测：

```bash
skill=$(ls -d ~/.config/opencode/skills/doc-arch-rules .opencode/skills/doc-arch-rules 2>/dev/null | head -1)  # 探测 skill 实际安装路径，供 <skill> 占位使用
test -n "$skill" || echo "未找到 skill（未安装或路径不符，请手动指定 <skill>）"
```

## 硬性要求

- **SSOT**：模板是 rule 的唯一来源；`references/templates/` 目录结构 = `.omo/rules/docs/` 目录结构
- **rule 内禁止 YAML generation 原始块**：见「组装规则」；generation 信息一律内联翻译为正文四节，不保留 YAML 形态
- **引用规范**：本 skill 内部引用一律用相对路径 + Markdown 链接（`references/templates/...`），禁止 `@path`、禁止硬编码绝对路径、禁止 `./xxx` 依赖 cwd
- **联动**：rule 触发后 AI 更新文档时按 `related` 同步关联文档；本 skill 保证 rule 正确携带 `related`；跨层引用单向向下，下层不链回上层
- **图规范**（rule 内容规范，rule 触发后生效）：文档中的图按模板要求用 D2 / Mermaid / ASCII，绘制规范见 CONSTITUTION §3.2

## 错误处理

- **模板缺失**：若用户要的 rule 不在清单（如 DATA-ARCHITECTURE），说明该模板已合并或不存在，不臆造；CONSTITUTION 无模板属正常（全局 rule 即宪法全文）
- **rule 未触发**：检查 `.omo/rules/docs/<DOC>.md` 的 globs 是否匹配实际文档路径；确认 `.omo/` 目录存在
- **rule 与模板不一致**：按模板重新生成，覆盖旧 rule
- **模板更新后 rule 未同步**：按「执行流程」重新生成全部 rule

## 维护

- **模板更新**：修改 `references/templates/` 下文件后，按「执行流程」重新生成全部 rule
- **新增文档类型**：在 `references/templates/<层>/` 加文件（无后缀=全局 rule；.template 后缀=模板，支持子目录如 `L2/deep-dives/`、`L2/research/`），重新生成对应 rule，更新本文件清单表
- **L2 deep-dives 约束**：目录名 `deep-dives`、文件 kebab-case 已定勿改；收敛标准 2/4 阈值命中即单列（AWS Lens/arc42/C4/Google 4 源）；L2 根为索引（1 图+1 表）、deep-dives 为详情，S2 引用不复制；File:Line 链代码
- **L2 research 约束**：目录名 `research`、文件 kebab-case 已定勿改；准入 候选≥2 或维度≥3 即建议单列；对比表（功能/性能/成本/许可证/生态）+ POC 验证 + 风险/合规 6 章骨架，结论链 ADR
- **脚本维护**：脚本只做解析/校验（omo 五键 + generation 六字段 + 剥离 frontmatter），模板缺 `description` 或 `alwaysApply`/`globs` 时报错退出（不兜底）；配置（`LAYER_ZH`/`SPECIAL_TARGETS`/`SKIP_FILES`）在脚本顶部。脚本为 **Node 零依赖**（手写 YAML 解析，复刻 omo parser-yaml.ts，不引入 npm 包）

[^scan]: 原 `scan` 字段已删除——读关联文档并入 `related`、检查目标现状与探测项目并入 `flow`。
