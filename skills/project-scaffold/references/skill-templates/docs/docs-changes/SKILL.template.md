---
name: docs-changes
description: 维护 docs/changes/ 变更规划目录（过程态）——读取与定位进行中的 change，生成或重建 change 单篇（{kebab-case}.md），校验骨架章节与状态枚举，维护状态（待查漂移 / 待清漂移 / 规划中 / 待执行 / 执行中 / 待同步 / 已实行）的流转，完成后把内容沉淀进对应层文档并删除本文件。触发词：变更规划、change 文档、新建 change、更新 change、推进 change 状态、变更已实行、沉淀变更、改动记录、正在做的改动、编排一次变更。代码改动触发更新：开始或推进一次有边界的改动时，新建或更新对应 change。
metadata:
  opencode/autoinvoke: false
---

# docs-changes — 变更规划

## 定位与管辖文档

`docs/changes/` 是变更规划目录，只承载进行中的 change 单篇，目录内不出现 change 单篇以外的文件。本 skill
是该目录文档的读取、生成、更新与校验入口。

- 目标文档结构以 [assets/TEMPLATE.md](assets/TEMPLATE.md) 为准，本 skill 不另行维护章节骨架；生成、重建或更新 change
  单篇前先读该模板，按其中骨架、文件命名和元信息落盘。
- 变更清单由 `scripts/changes.mjs` 机械处理：`list` 盘点与筛选、`check` 校验文件名与 frontmatter、`advance`
  在漂移清单已清时把「待清漂移」推进到「规划中」。状态流转里只有这一步可脚本推进，其余一律由本 skill 推进。

每篇 change 只记录一次有边界的过程态改动。定型后的知识归入对应层文档后，该 change 单篇随之删除——change 只作过程态，不作为永久架构或决策记录。

每篇 change 自带状态（待查漂移 / 待清漂移 / 规划中 / 待执行 / 执行中 / 待同步 / 已实行），状态流转由本 skill
维护：新建单篇先置待查漂移，做完漂移检查后——无漂移直接置规划中，有漂移置待清漂移并登记清单、待清单解决后置规划中；方案定稿置待执行，用户下达执行指令后置执行中，改动落地并经
DoD 验证通过后置待同步，文档同步完成后置已实行；删除前状态可随实际进展自由流转，到达已实行即删除本篇。待执行即可执行——用户说执行时，读取该单篇，按其改动方案与验收清单执行。

影响产物覆盖链内三层（L1 / L2 / L3）与链外产物域（契约 / 部署 / 测试 / 工具 / 专项），按本次改动实际触及的产物多选。

## 读取

1. 先读 [assets/TEMPLATE.md](assets/TEMPLATE.md)，确认当前目标的产物类型。
2. 用 `scripts/changes.mjs list` 列出 `docs/changes/` 的在途 change 与状态（可按 `--status` 筛选）；已有 change
   读取全文并保留仍有效的事实。
3. 定位改动涉及的上层文档、目标层文档和代码事实；目标层文档由对应 `docs-*` skill 维护，本 skill 只引用并推动沉淀。
4. 检查 change 的当前状态、关联文档和实际改动是否一致。

## 生成与更新

生成与更新走同一条流程：先读模板，再扫目标位置判断有无既有文档或同定位的旧产物，有则更新、无则新建。本流程处理 change
单篇的新建、更新与推进。

1. 先读 [assets/TEMPLATE.md](assets/TEMPLATE.md)，再扫描 `docs/changes/` 及其所在目录，按文件命名定位既有 change
   或判断是否有同定位旧产物。
2. 生成 change 前先调 `docs-draft` 做漂移检查，本 skill 只划定范围：改动落在某个业务域时范围是该域，改动偏技术或基础设施（DB、整条链路等）时从
   `docs/L3/STRUCTURE.md` 入手、波及全部业务域；有漂移即形成卡点，调 `docs-draft` 落一份漂移清单
   `docs/drift/{change名}-draft.md`（一篇 change 只对应一份，命名为
   `{change名}-draft`），在 frontmatter 的 `漂移` 字段登记该路径，单篇停在待清漂移，待清单解决后才进入规划。
3. 无既有 change：做同主题检测后按模板的文件命名规则新建 change 单篇，初始置待查漂移；随后按第 2 步的漂移检查结果置待清漂移或规划中。
4. 有既有 change：读取旧内容，做增量更新或结构重建，状态按实际进展更新（待查漂移 / 待清漂移 / 规划中 / 待执行 / 执行中 /
   待同步 / 已实行）。
5. 逐项向用户确认变更涉及的数据是否需要迁移、兼容或回滚，不默认要做——开发中的脏数据通常直接清理；确认要做的才写入改动方案。
6. 按模板写入本次变更所需的项目事实，使用代码位置或相对文档引用，不凭空补造事实；涉及目标层文档的生成、更新和引用按对应
   `docs-*` skill 的职责交接。
7. change 涉及的代码、接口、数据结构或目标层文档发生变化时，先更新过程态内容，再由对应 `docs-*` skill 维护正式文档。
8. 收尾时把已实现内容沉淀到目标层文档并复核；确认已实行后删除 change 文件，历史与决策原因归 git log。
9. 复读 change，检查文件名、状态、关联关系、引用和结构是否符合模板，检查目录内无已实行的残留 change，并报告产物清单。

## 联动

- 目标层文档由对应 skill 维护：L1 业务流程 `docs-business`；L2 架构 `docs-architecture`、数据建模
  `docs-data-model`、领域 `docs-domain`；链外契约接口 `inbound-ops`、集成
  `outbound-ops`、部署 `deploy-ops`；L3 目录结构 `docs-structure`；各子项目 AGENTS.md 归 `code-guide`。
- 验收用例经 `test-ops` skill；工具访问经 `tools-ops` skill。
- 漂移检查、记录与收口修复归 `docs-draft`：本 skill 只划定检查范围（改动的业务域，或偏技术改动从 L3 起的全链路）并在
  frontmatter
  登记清单路径（`docs/drift/{change名}-draft.md`）；清单不存在或清单级状态为 `已清理` 即视为漂移已清，据此放行；文档体系生成与初始化归
  `align-docs`。
- 沉淀按 L1 → L2 → L3 顺序进行；生成下层前先读上层产物，跨文档只做相对 Markdown 链接或自然引用。

## 完成判定

- 每篇 change 的文件命名、标题、frontmatter 字段与正文结构均符合 [assets/TEMPLATE.md](assets/TEMPLATE.md)，状态取值合法。
- frontmatter 登记了漂移清单的 change，其漂移清单已解决后才进入规划。
- 状态为已实行的 change 已完成目标层文档沉淀并删除对应文件。
- 相关目标层文档与验收用例已由对应 skill 复核，沉淀后文档间引用无死链，目录中没有遗留的过程态占位内容。

## 边界

- 日常且不改变架构边界的小修不单独建立 change。
- 不在 change 中保留定型知识、独立决策记录或重复的目标层文档内容；历史与决策原因归 git log。
- 本 skill 只由用户显式调起（斜杠命令或明确指令）；AI 不得自动创建、更新或推进 change，也不得自行补建 change 单篇。
