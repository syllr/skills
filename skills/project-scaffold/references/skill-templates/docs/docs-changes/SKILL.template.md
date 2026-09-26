---
name: docs-changes
description: 维护 docs/changes/ 变更规划目录（过程态）——读取与定位进行中的 change，生成或重建 change 单篇（四位递增编号 NNNN-{kebab-case}.md），校验骨架四段与状态枚举，推进状态机（规划中 → 执行中 → 已实行），完成后把内容沉淀进对应层文档并删除本文件。触发词：变更规划、change 文档、新建 change、更新 change、推进 change 状态、变更已实行、沉淀变更、改动记录、正在做的改动、编排一次变更。代码改动触发更新：开始或推进一次有边界的改动时，新建或更新对应 change。
---

# docs-changes — 变更规划

## 定位与管辖文档

`docs/changes/` 是变更规划目录，只承载进行中的 change 单篇，不设索引文件。本 skill 是该目录文档的读取、生成、更新与校验入口。

生成、重建或更新 change 单篇前，先读 [assets/TEMPLATE.md](assets/TEMPLATE.md)，按其中骨架、文件命名和元信息落盘；本 skill
不在正文重复模板结构。

每篇 change 记录一次有边界的过程态改动。定型后的知识归入对应层文档，过程态 change 不作为永久架构或决策记录。

## 读取

1. 先读 [assets/TEMPLATE.md](assets/TEMPLATE.md)，确认当前目标的产物类型。
2. 列出 `docs/changes/` 确定在途 change；已有 change 读取全文并保留仍有效的事实。
3. 定位改动涉及的上层文档、目标层文档和代码事实；目标层文档由对应 `docs-*` skill 维护，本 skill 只引用并推动沉淀。
4. 检查 change 的当前状态、关联文档和实际改动是否一致。

## 生成流程

1. 扫描现有 `docs/changes/`、相关上层文档、目标层文档和代码，做同主题检测，判断复用已有 change 还是新建 change。
2. 新建时按 [assets/TEMPLATE.md](assets/TEMPLATE.md) 的文件命名规则确定四位编号，并按模板写 change 单篇。
3. 按模板写入本次变更所需的项目事实，使用代码位置或相对文档引用，不凭空补造事实。
4. 状态从规划中开始；涉及目标层文档的生成、更新和引用按对应 `docs-*` skill 的职责交接。
5. 生成后复读 change，检查编号、状态、关联关系、交叉引用和结构是否符合模板，并报告产物清单。

## 更新流程

1. 按文件命名定位 change，先读取旧内容与 [assets/TEMPLATE.md](assets/TEMPLATE.md)，再做增量更新或结构重建。
2. 状态按规划中 → 执行中 → 已实行推进。
3. change 涉及的代码、接口、数据结构或目标层文档发生变化时，先更新过程态内容，再由对应 `docs-*` skill 维护正式文档。
4. 收尾时把已实现内容沉淀到目标层文档并复核；确认已实行后删除 change 文件，历史与决策原因归 git log。
5. 更新完成后检查目录内无已实行的残留 change，必要时将文档漂移交 `align-docs` skill。

## 联动

- 目标层文档由对应 skill 维护：L1 业务流程 `docs-business`；L2 应用架构 `docs-application-architecture`、数据架构
  `docs-data-architecture`、技术架构 `docs-technology-architecture`、领域 `docs-domain`；链外契约接口 `inbound-ops`、集成
  `outbound-ops`、部署 `deploy-ops`；L3 目录结构 `docs-structure`、代码规范
  `docs-code-guide`。
- 验收用例经 `test-ops` skill；工具访问经 `tools-ops` skill。
- 文档与代码漂移交 `align-docs` skill 分诊和修复，文档体系生成与初始化也由其编排。
- 沉淀按 L1 → L2 → L3 顺序进行；生成下层前先读上层产物，跨文档只做相对 Markdown 链接或自然引用。

## 完成判定

格式与结构纪律（正文无加粗与 emoji、无 SSOT 或单一事实源字样、无模板说明与未替换元变量、图为 D2 / Mermaid / ASCII
代码块而无位图、无治理套话与固定元信息、章节编号连续不跳号、相对链接可解析、跨文档章节引用无死链、标题层级与骨架 模板一致、不补写
frontmatter）见根 `AGENTS.md` §2.8，各文档不重复列出；以下为本文档专有判定，全部通过才算完成。

- 每篇 change 的文件命名、标题、元信息、正文结构和状态均符合 [assets/TEMPLATE.md](assets/TEMPLATE.md)，状态取值合法。
- 状态为已实行的 change 已完成目标层文档沉淀并删除对应文件。
- 相关目标层文档、验收用例和交叉引用已由对应 skill 复核，目录中没有遗留的过程态占位内容。

## 边界

- 只维护 `docs/changes/` 的 change 单篇；不生成其他层正文，不改业务代码。日常且不改变架构边界的小修不单独建立 change。
- 不在 change 中保留定型知识、独立决策记录或重复的目标层文档内容；历史与决策原因归 git log。
- 跨文档使用相对 Markdown 链接或自然引用，不复制目标层正文，不设置聚合式相关文档章节。
- 不自动 commit 或 push；迁移、删除和正式文档更新按对应 skill 的边界执行。
