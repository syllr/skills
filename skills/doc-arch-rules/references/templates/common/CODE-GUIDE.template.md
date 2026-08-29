---
title: CODE-GUIDE — 代码规范
doc_type: template
layer: common
description: common 贯穿层 文档 CODE-GUIDE 的更新规范——修改 docs/common/CODE-GUIDE.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/common/CODE-GUIDE.md"
generation:
  tools:
    - Markdown 表格（命名/方法签名/注释/坏味道检查对照表）
  scan: # 生成前自主扫描（不依赖用户）
    - 扫描宪法 §2.1（D 系列原则，SSOT）
    - 扫描现有 CODE-GUIDE（有效信息保留，结构按本模板重建）
    - 扫描项目 eslint/sonar 配置（实际启用的规则，坏味道检查需与之对齐）
  related:
    CONSTITUTION: 原则 SSOT 在宪法 §2.1
    GLOSSARY: 术语一致
  ask_user:
    - 命名风格有争议时（如某类命名规则取舍）→ 问用户（阈值冲突/既有约定冲突时问用户）
  flow:
    - 扫描（自主）：读宪法 + 目标文档
    - 已有 CODE-GUIDE → 参考旧文档有效信息，但结构按本模板重建（无现有 CODE-GUIDE 则跳过第二步）
    - 按模板生成：§1 原则 → §2 命名 → §3 方法签名 → §4 注释 → §5 坏味道检查（§6 待澄清按需生成，无则删）
  notes:
    - common 横切层：贯穿所有上下文的代码风格，原则在宪法，手段在本文件
  checks:
    - "命名/方法签名/注释均有好 vs 坏对比"
    - "坏味道检查工具已列且含阈值"
    - "与宪法 §2.1 D1-D9 逐条对齐"
---

# CODE-GUIDE — 代码规范

> 本文档是「<项目名>」的 **CODE-GUIDE（代码规范模板）**——common 横切层的代码风格规范。
> 【模板使用指引】复制为 `docs/common/CODE-GUIDE.md`，按各章节指引填写。

---

## 1. 原则（目标）

> 【指引】Clean Code 目标：代码长成业务的样子，可读、可维护。

- **目的**：Clean Code（为什么）—— 代码应自描述、可读、低耦合
- **手段**：命名、方法签名、注释、lint（怎么做）—— 本文件

---

## 2. 命名

> 【指引】接口/类/方法命名体现职责，来自领域语言。

| 类型   | 规则                   | 反例                                        | 正例                                                   |
| ------ | ---------------------- | ------------------------------------------- | ------------------------------------------------------ |
| 接口   | 角色/能力名            | `I<实体_用户>Service`、`<实体_用户>Manager` | `<资源_额度>Checker`、`<实体_用户>Authenticator`       |
| 实现类 | 加 `Impl` 或技术栈前缀 | `<实体_用户>Service`                        | `Mysql<实体_用户>Repository`、`<实体_用户>ServiceImpl` |
| 方法   | 业务动词短语           | `update()`、`set()`                         | `reserve<资源_额度>()`、`deductFor()`                  |

**纪律**：

- 不用 `Manager`/`Processor`/`Info`/`Util` 等万能名，改用职责名：`Manager → Coordinator/Registry`、`Processor → Handler/Service`、`Info → Details/Summary`、`Util → 具体工具类名`
- 不加 `I` 前缀（Java/TS）

---

## 3. 方法签名

> 【指引】方法签名设计，体现单一职责。

| 规则             | 说明                      | 例子                                                 |
| ---------------- | ------------------------- | ---------------------------------------------------- |
| 参数 ≤ 3         | 超过用参数对象（Command） | `reserve<资源_额度>(cmd: Reserve<资源_额度>Command)` |
| 无 boolean flag  | 拆成多个方法              | `processUrgent()` vs `processStandard()`             |
| 类型化 ID        | 不用裸 string             | `<实体_用户>Id` vs `string`                          |
| 返回 Result/异常 | 不返回 boolean            | `<凭证_预留>` vs `boolean`                           |

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
 * 预扣<资源_额度>。返回的 <凭证_预留> 可被 consume 或 refund。
 * @throws <资源_额度>ExceededException 当余额不足
 */
reserve(cmd: Reserve<资源_额度>Command): Promise<<凭证_预留>>;
```

---

## 5. 坏味道检查（自动化）

> 【指引】通过工具自动检查宪法 D1-D9（宪法§2.1）的规范。

| 工具                       | 检查什么（含阈值）                     | 对应宪法 |
| -------------------------- | -------------------------------------- | -------- |
| **ESLint**（JS/TS）        | 命名、圈复杂度≤10、参数≤3、方法行≤30   | D1,D5,D6 |
| **Checkstyle/PMD**（Java） | 命名、方法长度≤30、圈复杂度≤10、参数≤3 | D1-D9    |
| **SonarQube**              | 重复率、耦合                           | 全量     |

**CI 集成**：PR 阶段跑 lint + SonarQube，红则阻断合并。

---

## 6. 待澄清

> 【指引】有待澄清保留 checklist，无则删除本节。

- [ ] <问题>
