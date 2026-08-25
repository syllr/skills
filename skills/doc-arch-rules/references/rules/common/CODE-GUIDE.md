---
description: common 贯穿层 文档 CODE-GUIDE 的全局规范——代码指南，全局加载，任何代码改动都需遵守
alwaysApply: true
---

# CODE-GUIDE 文档更新规范（common 贯穿层）

**本文档在修改 `docs/common/CODE-GUIDE.md` 时生效。** 目标：按下方模板生成/更新 `docs/common/CODE-GUIDE.md`，使其结构符合模板契约，保持 SSOT、不漂移、不遗漏联动。

## 触发条件

当以下任一情况发生时，本规则必须生效：

- 编辑、新增或重建 `docs/common/CODE-GUIDE.md`
- 该文档关联的其他文档（见模板 `related`）发生变化，需要联动更新本文档
- 用户要求"生成/更新 CODE-GUIDE"

## 执行流程

1. **读模板 generation 元数据**：下方「模板全文」的 frontmatter `generation` 块是本文档的"生成/更新提示词"，逐字段执行：
   - `scan`：自主扫描列出的源（不问用户），作为更新依据
   - `ask_user`：仅当列出的决策点存在歧义时，才用询问工具问用户
   - `flow`：按列出的流程分支执行（全量重建 or 增量修改）
   - `reentrant`：支持可重入——全量重生成或增量修改都要能处理
   - `notes`：注意点（怎么生成，避免常见错误）
   - `checks`：生成后逐条反向核对（含 S8：文档不含 emoji）
   - `related`：关联模板与联动修改——更新本文档时，检查并同步 `related` 列出的关联文档
2. **按模板正文生成**：以下方「模板全文」的 Markdown 正文为结构基准，把模板复制为 `docs/common/CODE-GUIDE.md`，按 `> 【指引】` 填写，**删除 generation 元数据块与全部 `> 【指引】` 说明**（实例不含这两者）。
3. **反向 check**：逐条执行模板 `generation.checks`，全部通过才算完成。

## 硬性要求

- **SSOT**：模板是本文档的唯一结构源；已合并/已删除的模板（如 DATA-ARCHITECTURE 已并入 DOMAIN-MODEL）不生成独立文档。
- **不用 emoji**（S8，grep 校验：`grep -P "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" <文档>`）。
- **联动**：`related` 列的关联文档必须同步检查；跨层引用单向向下，下层不链回上层。
- **图规范**：文档中的图按模板要求用 D2 / Mermaid / ASCII，绘制规范见 CONSTITUTION §3.2。

## 完成判定

模板 `generation.checks` 全部通过 + 文档与关联文档无漂移。

---

## 模板全文（本 rule 的生成依据）

以下是 `CODE-GUIDE` 的完整模板（frontmatter generation 元数据 + Markdown 正文，SSOT，来自 references/templates/common/CODE-GUIDE.template.md）：

```markdown
---
title: CODE-GUIDE — 代码规范
doc_type: template
layer: common
description: common 贯穿层 文档 CODE-GUIDE 的全局规范——代码指南，全局加载，任何代码改动都需遵守
alwaysApply: true
generation:
  scan:
    - 扫描宪法 §2.1 模块设计（D 系列）与 §2.3 领域建模
    - 扫描 docs/common/CODE-GUIDE.md 是否已存在
  flow:
    - 扫描（自主）：读宪法 + 目标文档
    - 已有 CODE-GUIDE → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 原则 → §2 命名 → §3 方法签名 → §4 注释 → §5 坏味道检查
  notes:
    - 横切层：贯穿所有上下文的代码风格，不是某一个上下文的规范
    - 原则在宪法（Clean Code），手段在本文件
    - 不用 emoji
  checks:
    - "命名/方法签名/注释均有好 vs 坏对比"
    - "坏味道检查工具已列（lint/SonarQube）"
    - "与宪法 §2.1 D 系列一致"
    - "S8：文档不含 emoji"
  related:
    CONSTITUTION: 原则 SSOT 在宪法 §2.1
    GLOSSARY: 术语一致
---

# CODE-GUIDE — 代码规范

> 本文档是「<项目名>」的 **CODE-GUIDE（代码规范模板）**——common 横切层的代码风格规范。
> 【模板使用指引】复制为 `docs/common/CODE-GUIDE.md`，按各章节指引填写。
> 【原则】① 原则在宪法（Clean Code）；② 手段在本文件（命名/方法签名/注释/lint）；③ 横切所有上下文；④ 不用 emoji。

---

## 1. 原则（目标）

> 【指引】Clean Code 目标：代码长成业务的样子，可读、可维护。

- **目的**：Clean Code（为什么）—— 代码应自描述、可读、低耦合
- **手段**：命名、方法签名、注释、lint（怎么做）—— 本文件

---

## 2. 命名

> 【指引】接口/类/方法命名体现职责，来自领域语言。

| 类型   | 规则                   | 反例                          | 正例                                     |
| ------ | ---------------------- | ----------------------------- | ---------------------------------------- |
| 接口   | 角色/能力名            | `IUserService`、`UserManager` | `QuotaChecker`、`UserAuthenticator`      |
| 实现类 | 加 `Impl` 或技术栈前缀 | `UserService`                 | `MysqlUserRepository`、`UserServiceImpl` |
| 方法   | 业务动词短语           | `update()`、`set()`           | `reserveQuota()`、`deductFor()`          |

**纪律**：

- 不用 `Manager`/`Processor`/`Info`/`Util` 等万能名
- 不加 `I` 前缀（Java/TS）

---

## 3. 方法签名

> 【指引】方法签名设计，体现单一职责。

| 规则             | 说明                      | 例子                                     |
| ---------------- | ------------------------- | ---------------------------------------- |
| 参数 ≤ 3         | 超过用参数对象（Command） | `reserveQuota(cmd: ReserveQuotaCommand)` |
| 无 boolean flag  | 拆成多个方法              | `processUrgent()` vs `processStandard()` |
| 类型化 ID        | 不用裸 string             | `UserId` vs `string`                     |
| 返回 Result/异常 | 不返回 boolean            | `Reservation` vs `boolean`               |

---

## 4. 注释

> 【指引】注释规范。

| 场景                  | 是否需要                                   |
| --------------------- | ------------------------------------------ |
| 公开 API 接口         | **必须** JSDoc（含 @throws/@returns/@see） |
| 复杂业务规则          | **必须**                                   |
| 自描述命名 + 简单逻辑 | 不需要                                     |

```typescript
/**
 * 预扣配额。返回的 Reservation 可被 consume 或 refund。
 * @throws QuotaExceededException 当余额不足
 */
reserve(cmd: ReserveQuotaCommand): Promise<Reservation>;
```

---

## 5. 坏味道检查（自动化）

> 【指引】通过工具自动检查宪法 D/S/M 的规范。

| 工具                       | 检查什么                 | 对应宪法 |
| -------------------------- | ------------------------ | -------- |
| **ESLint**（JS/TS）        | 命名、复杂度、参数个数   | D1-D9    |
| **Checkstyle/PMD**（Java） | 命名、方法长度、圈复杂度 | D1-D9    |
| **SonarQube**              | 坏味道、重复、耦合       | 全量     |
| **oasdiff/spectral**       | OpenAPI 破坏性变更       | 契约     |

**CI 集成**：PR 阶段跑 lint + SonarQube + 契约测试，红则阻断合并。

---

## 6. 待澄清

- [ ] <问题>
```
