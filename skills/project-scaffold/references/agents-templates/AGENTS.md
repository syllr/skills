# 项目宪法

> 本「项目宪法」由 project-scaffold 模板生成，是适用于全仓的跨目录、跨任务约束，AI 不得编辑其中内容。需要对本宪法条款做例外或补充时，写到「项目宪法」之外的章节（AGENTS.md 中本宪法之外的部分归项目自行维护）。

## 1. 文档体系与目录架构

文档按 L0-L4 + common 分层，依赖方向 L0 → L1 → L2 → L3 → L4 单向向下，common 贯穿所有层。生成顺序自上而下逐层串行：生成某层文档前先读上一层已落盘产物，本层完成后方可进入下一层，common 最后。各文档的读取 / 生成 / 更新走对应 `docs-*` skill（见 §3）。

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
    │   ├── domain/          领域模型：DOMAIN-MODEL.md + 一域一文
    │   ├── deep-dives/      系统级问题深潜：INDEX.md + 单篇
    │   └── research/        选型 / 对比 / 验证调研：INDEX.md + 单篇
    ├── L3/                  契约
    │   ├── INBOUND.md       对外提供接口（Inbound）+ openapi/
    │   └── OUTBOUND.md      被调用第三方接口（Outbound）+ outbound-contracts/
    ├── L4/                  部署与验证
    │   ├── DEPLOYMENT.md    部署发布 + deployment/
    │   └── test/            测试用例 test-cases/ + 执行台账 test-records/
    ├── tools/               项目工具集（AI 访问系统的唯一通道）
    ├── changes/             变更规划：INDEX.md + 单篇（过程态，完成后删除）
    └── common/              贯穿层
        ├── STRUCTURE.md     目录结构与文档 ↔ 代码映射
        └── CODE-GUIDE.md    代码规范
```

---

## 2. 跨目录通用规范

### 2.1 单一事实源（SSOT）

- 代码是唯一事实：文档与注释是代码的投影，与代码冲突时改文档 / 注释，不改代码；代码与代码的冲突由 Git 历史裁决。
- 同一信息只在一个文档维护，其他文档引用不复制；发现重复即归并到唯一源，其余改为引用。
- 可点击导航链接只允许上层指向下层（L0 / L1 可链 L2 / L3 / L4，下层不链回上层）；下层引用上层内容只做精简文字提及（如「见 §X」）。
- 差异主动修复：执行任何操作（读取 / 变更）时发现文档 / 注释与代码有差异，即主动修复文档 / 注释（不影响运行，无需用户授权）。

### 2.2 文档与注释当前态

- 文档与注释只表现当前设计意图，不写因果链（不记录「以前是什么 / 为什么改」）。
- 历史与决策原因归 git log；正文只留当前意图。
- 删除或迁移章节时删净并重编号连续，禁止保留「已迁移 / 已删除至 X」正文占位；确需保留导航时用不渲染的 HTML 注释。
- 实例正文不写治理套话（「本文档只做索引 / 与 X 分工 / 引用不复制 / 唯一依据」这类声明只归 AGENTS.md 与文档元信息）；指向用自然引用（「见 §X / 详见某文档」）表达。

### 2.3 文档与代码同交付

- 任何实质代码变更（新增功能 / 修改逻辑 / 架构调整），会话结束前必须同步文档——文档是交付物的一部分，不是可选项。

### 2.4 章节引用与重编号

- 重排或删除章节后必须重编号连续，禁止跳号（如 3.3 跳 3.6）。

### 2.5 用例唯一入口

- 任何形式的用例（单元 / 接口 / 流程 / 集成）只能经 `test-ops` skill 触发与管理（新增 / 更新 / 删除 / 执行），AI 不得凭自身判断自动创建任何用例。
- 新增用例一律先落 DoD 草稿（过程态），经用户验证认可后晋升为正式用例（`docs/test/test-cases/`）；草稿位置与用例卡写卡规范以 `test-ops` skill 为准。
- 禁止绕过 `test-ops` skill 直接创建 / 修改 / 删除 `docs/test/test-cases/` 下的用例文件。

### 2.6 系统访问唯一入口

- AI 访问本系统的任何资源（前端页面 / 后端 API / 数据库 / 中间件 / 外部第三方接口）都只能经 `tools`（`docs/tools/`），不允许任何形式的旁路直连。
- 访问前先经 `tools` 查当前可用工具，再用对应工具访问；目标无可用工具时提醒用户经 `tools` skill 新增，AI 不得自行造旁路。

### 2.7 目录索引（INDEX）

- 一个目录内沉淀多篇同构文档时，必须以 `INDEX.md` 作为唯一入口（`deep-dives/`、`research/`、`outbound-contracts/`、`changes/`）；目录内已有总文档承担索引职责时（如 `domain/DOMAIN-MODEL.md`），不再另建。
- `INDEX.md` 只承载一张「文件 | 说明」两列纯导航表；目录内新增 / 删除 / 合并文档必须同步该表。

### 2.8 图示与格式

- 图即文本：所有图用 D2 / Mermaid / ASCII 代码块直接写入 .md，禁止位图截图或在线工具导出图。
- 图型选型：容器式分层图（多层大容器嵌套）用 D2；流程图 / 状态图 / 时序图 / 类图 / 结构拓扑图用 Mermaid；目录树用 ASCII；渲染环境不可用时退化为 ASCII。
- 文档与注释全中文；正文禁用加粗与 emoji。

---

## 3. 文档操作 Skill 路由

各文档的读取 / 生成 / 更新走对应 skill；跨文档编排（对齐 / 漂移 / 初始化）归 `docs-align`。

| 文档 / 目录                                     | 操作 skill                    |
| ----------------------------------------------- | ----------------------------- |
| docs/L1/BUSINESS.md                             | docs-business                 |
| docs/L2/APPLICATION-ARCHITECTURE.md             | docs-application-architecture |
| docs/L2/DATA-ARCHITECTURE.md                    | docs-data-architecture        |
| docs/L2/TECHNOLOGY-ARCHITECTURE.md              | docs-technology-architecture  |
| docs/L2/domain/                                 | docs-domain                   |
| docs/L2/deep-dives/                             | docs-deep-dives               |
| docs/L2/research/                               | docs-research                 |
| docs/L3/INBOUND.md + openapi/                   | docs-inbound                  |
| docs/L3/OUTBOUND.md + outbound-contracts/       | docs-outbound                 |
| docs/L4/DEPLOYMENT.md + deployment/             | docs-deployment               |
| docs/common/STRUCTURE.md                        | docs-structure                |
| docs/common/CODE-GUIDE.md                       | docs-code-guide               |
| docs/changes/                                   | docs-changes                  |
| 跨文档对齐 / 漂移 / 初始化                      | docs-align                    |

---

## 4. 执行类 Skill 与职责边界

文档类 skill（§3）只写文档；执行类 skill 只对真实系统做动作。同一对象的两类动作分走两个入口——改文档走 `docs-*`，改系统走执行类；执行类造成事实变化时必须回头调对应 `docs-*` 同步文档。

| Skill           | 唯一入口（做什么）                                                 | 不做                      | 事实变化后同步文档交给 |
| --------------- | ------------------------------------------------------------------ | ------------------------- | ---------------------- |
| docs-align      | 跨文档对齐 / 漂移 / 初始化的编排                                   | 不直接写单份文档正文      | 对应 `docs-*`          |
| test-ops        | 用例（`docs/test/test-cases/`）新增 / 更新 / 删除 / 执行与执行台账 | 不写项目其它文档          | 自持（用例卡与台账）   |
| tools           | 项目工具集（`docs/tools/`）生成 / 维护 / 调用（系统访问唯一入口）  | 不写项目其它文档          | 自持（工具 README）    |
| deploy-ops      | 部署执行与部署资产（脚本 / compose / .env）维护                    | 不写 `DEPLOYMENT.md` 正文 | docs-deployment        |
| contract-export | L3 Inbound 契约导出与门禁                                          | 不写 `INBOUND.md` 说明书  | docs-inbound           |
