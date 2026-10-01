# 项目宪法

> 本「项目宪法」由 project-scaffold 模板生成，是适用于全仓的跨目录、跨任务约束，AI
> 不得编辑其中内容。需要对本宪法条款做例外或补充时，写到「项目宪法」之外的章节（AGENTS.md 中本宪法之外的部分归项目自行维护）。

## 1. 文档体系与目录架构

文档只有链内与链外两种归属，判据是产物是否参与链内 L1 → L2 → L3 的分层描述。链内是分层的当前态描述，只有面向人读的 .md，按
L1 → L2 → L3
编号；链外是独立域，含三类：有资产的产物域（文档与其资产同处一个目录）、无资产的独立文档域（如系统级问题深潜与选型调研）、过程态台账。

链内按本体系的分层方法维护；链外各域是独立的域，变更由用户直接调该域的管辖 skill 处理，不由链内方法编排。链上某层变化确实牵连
到某个链外域时，由该层 skill 在联动里指明，不因此把链外拉进链内流程。

链内只有一条 L1 → L2 → L3，两个遍历方向：生成自上而下 L1 → L2 → L3（生成某层前先读上一层已落盘产物，本层完成才进下一层）；变更自下而上
L3 → L2 → L1（任何改动都先落 L3 的目录与文件，再逐层向上判定该层事实是否随之变化，要改就调该层 skill 改）。L3 是事实起点，L1
是抽象结论。各文档的读取 / 生成 / 更新走对应 skill（见 §3）。

```
项目根/
├── AGENTS.md                本文件：项目宪法（L0：文档体系与目录架构 + 跨目录通用规范 + Skill 路由）
└── docs/
    ├── L1/                  业务与需求
    │   └── BUSINESS.md      业务流程（业务全景 + 需求）
    ├── L2/                  架构
    │   ├── APPLICATION-ARCHITECTURE.md   应用架构
    │   ├── DATA-ARCHITECTURE.md          数据架构
    │   ├── TECHNOLOGY-ARCHITECTURE.md    技术架构
    │   └── domain/          领域模型：DOMAIN-MODEL.md + 一域一文
    ├── L3/                  事实层（变更起点）
    │   ├── STRUCTURE.md     目录结构与文档 ↔ 代码映射
    │   └── CODE-GUIDE.md    代码规范
    ├── contracts/          契约：INBOUND.md + openapi/ · OUTBOUND.md + outbound-contracts/
    ├── deployment/         部署：DEPLOYMENT.md + 部署资产（脚本 / compose / 多环境 .env）
    ├── test/                测试：do-drafts/ 草稿 → test-cases/ 正式用例卡（晋级）→ test-records/ 执行台账
    ├── tools/               项目工具集：TOOLS.md（说明书）+ Node CLI（AI 访问系统的唯一通道）
    ├── deep-dives/          系统级问题深潜：每问题一篇（跨 L1-L3 的独立陈述，不入链）
    ├── research/            选型与验证调研：每主题一篇（结论交技术架构文档）
    ├── changes/             变更规划：每变更一单篇（过程态，完成后删除）
    ├── drift/               漂移清单：每文档一份（过程态，全部清账后删除）
```

---

## 2. 跨目录通用规范

### 2.1 单一事实源（SSOT）

- 代码是唯一事实：文档与注释是代码的投影，与代码冲突时改文档 / 注释，不改代码；代码与代码的冲突由 Git 历史裁决。
- 同一信息只在一个文档维护，其他文档引用不复制；发现重复即归并到唯一源，其余改为引用。
- 可点击导航链接只允许上层指向下层（L0 / L1 可链 L2 / L3，下层不链回上层）；下层引用上层内容只做精简文字提及（如「见 §X」）。
- 差异主动修复：执行任何操作（读取 / 变更）时发现文档 / 注释与代码有差异，即主动修复文档 / 注释（不影响运行，无需用户授权）。

### 2.2 文档与注释当前态

- 文档与注释只表现当前设计意图，不写因果链（不记录「以前是什么 / 为什么改」）。
- 历史与决策原因归 git log；正文只留当前意图。
- 删除或迁移章节时删净并重编号连续，禁止保留「已迁移 / 已删除至 X」正文占位；确需保留导航时用不渲染的 HTML 注释。
- 实例正文不写治理套话（「本文档只做说明 / 与 X 分工 / 引用不复制 / 唯一依据」这类声明只归 AGENTS.md 与文档元信息）；指向用自然引用（「见
  §X / 详见某文档」）表达。

### 2.3 文档与代码同交付

- 任何实质代码变更（新增功能 / 修改逻辑 / 架构调整），会话结束前必须同步文档——文档是交付物的一部分，不是可选项。

### 2.4 产物与说明书同交付

- B 类 skill（`*-ops`）的能力域内，文档产物与资产产物必须同会话同步：资产变了说明书同会话更新，说明书变了资产同会话重生成；两者不一致即视为未完成。
- 资产产物必须有可执行或可机检的判据（导出命令跑通、compose 可解析、用例可执行、端点计数三方对账），不接受「看起来对」。
- 一个能力域只允许一个 skill 作为入口：该域的说明书、资产与执行动作分走多个入口即视为违规。

### 2.5 章节引用与重编号

- 重排或删除章节后必须重编号连续，禁止跳号（如 3.3 跳 3.6）。

### 2.6 用例唯一入口

- 任何形式的用例（单元 / 接口 / 流程 / 集成）只能经 `test-ops` skill 触发与管理（新增 / 更新 / 删除 / 执行），AI
  不得凭自身判断自动创建任何用例。
- 新增用例一律先落 DoD 草稿（过程态），经用户验证认可后晋升为正式用例（`docs/test/test-cases/`）；草稿位置与用例卡写卡规范以
  `test-ops` skill 为准。
- 禁止绕过 `test-ops` skill 直接创建 / 修改 / 删除 `docs/test/test-cases/` 下的用例文件。

### 2.7 系统访问唯一入口

- AI 访问本系统的任何资源（前端页面 / 后端 API / 数据库 / 中间件 / 外部第三方接口）都只能经 `tools-ops`（`docs/tools/`
  ），不允许任何形式的旁路直连。
- 访问前先经 `tools-ops` 查当前可用工具，再用对应工具访问；目标无可用工具时提醒用户经 `tools-ops` skill 新增，AI 不得自行造旁路。

### 2.8 图示与格式

- 图即文本：所有图用 D2 / Mermaid / ASCII 代码块直接写入 .md，禁止位图截图或在线工具导出图。
- 图型选型：容器式分层图（多层大容器嵌套）用 D2；流程图 / 状态图 / 时序图 / 类图 / 结构拓扑图用 Mermaid；目录树用
  ASCII；渲染环境不可用时退化为 ASCII。
- 文档与注释全中文；正文禁用加粗与 emoji。
- 正文只写当前态，不留模板痕迹：不得出现模板的说明文字、未替换的 `{占位}` 或 `<占位>`、未替换的占位符与待填标记；模板中的
  `<!-- 生成提示：… -->` 只作生成提示，写入产物时删除、不留在产物中。
- 正文不写治理套话与固定元信息（不出现「本文档只做…」「与 X 分工」「引用不复制」「固定元信息」「固定画法」这类声明）。
- 不出现 `SSOT`、单一事实源、唯一事实源字样；事实来源靠文档结构表达，不靠标签声明。
- 章节编号连续不跳号（3.3 之后不得直接 3.6），删除或迁移章节后重编号并清理旧引用。
- 跨文档用相对 Markdown 链接，链接目标与 `§章节号` 必须真实存在；删除章节后不留指向它的引用。
- 标题层级与层级顺序遵循该文档的骨架模板；不补写骨架未定义的 frontmatter 或其他元信息块。

---

## 3. Skill 路由（三类）

Skill 分三类，命名即类型，类型后标注链内 / 链外归属：

- A 类 · 纯文档（前缀 `docs-`）：产物只有面向人读的说明书，没有资产、状态机与门禁；删掉文档不影响项目行为。 A·链内 7 个分属
  L1 / L2 / L3；A·链外 4 个：过程态 `docs/changes/` 变更单篇与 `docs/drift/` 漂移清单，无资产独立域 `docs/deep-dives/`
  系统级问题深潜与 `docs/research/` 选型调研。
- B 类 · 文档 + 资产（后缀 `-ops`）：一个能力域一个 skill，同时管辖该域的说明书、资产与执行动作，并保证三者一致；全部 B·链外。
- C · 编排（`align-docs`）：只调度 A / B 类，不生产任何文档正文或资产，连过程态清单也交 `docs-draft` 落盘；C·链外。

| Skill                         | 类型   | 管辖文档                                                                            | 管辖资产                            |
|-------------------------------|--------|-------------------------------------------------------------------------------------|-------------------------------------|
| docs-business                 | A·链内 | docs/L1/BUSINESS.md                                                                 | —                                   |
| docs-application-architecture | A·链内 | docs/L2/APPLICATION-ARCHITECTURE.md                                                 | —                                   |
| docs-data-architecture        | A·链内 | docs/L2/DATA-ARCHITECTURE.md                                                        | —                                   |
| docs-technology-architecture  | A·链内 | docs/L2/TECHNOLOGY-ARCHITECTURE.md                                                  | —                                   |
| docs-domain                   | A·链内 | docs/L2/domain/                                                                     | —                                   |
| docs-structure                | A·链内 | docs/L3/STRUCTURE.md                                                                | —                                   |
| docs-code-guide               | A·链内 | docs/L3/CODE-GUIDE.md                                                               | —                                   |
| docs-changes                  | A·链外 | docs/changes/                                                                       | —                                   |
| docs-draft                    | A·链外 | docs/drift/（每文档一份 `<doc>.md` 漂移清单）                                       | —                                   |
| docs-deep-dives               | A·链外 | docs/deep-dives/（每问题一篇 kebab-case 单篇）                                      | —                                   |
| docs-research                 | A·链外 | docs/research/（每主题一篇 kebab-case 单篇）                                        | —                                   |
| inbound-ops                   | B·链外 | docs/contracts/INBOUND.md                                                           | docs/contracts/openapi/             |
| outbound-ops                  | B·链外 | docs/contracts/OUTBOUND.md                                                          | docs/contracts/outbound-contracts/  |
| deploy-ops                    | B·链外 | docs/deployment/DEPLOYMENT.md                                                       | docs/deployment/                    |
| test-ops                      | B·链外 | docs/test/test-cases/（正式用例卡）+ docs/test/do-drafts/（DoD 草稿），写卡规范自持 | docs/test/test-records/（执行台账） |
| tools-ops                     | B·链外 | docs/tools/TOOLS.md                                                                 | docs/tools/（Node CLI）             |
| align-docs                    | C·链外 | —（不生产任何文档正文）                                                             | —                                   |

## 4. 通用纪律

- 类型边界：A 类不生成资产；B 类不把本域的说明书或资产交给别的 skill；C 类不直接写任何单份文档正文，只做编排与跨文档核对。
- 管辖边界：各 skill 只维护其管辖范围内的文档与资产，不改业务代码、其他文档正文或 Git
  状态；发现文档与代码冲突时以代码为准修正文档；跨文档编排、文档初始化、漂移检测与旧布局迁移一律归 `align-docs`。
- 迁移：文档的合并、改名、删除按 `align-docs` 的「旧版本文档清理与融合」执行，需用户逐次认可，不自动执行。
- 提交：任何 skill 都不自动 commit 或 push；`deploy-ops` 在部署前需要 commit 时，须用户显式授权。
