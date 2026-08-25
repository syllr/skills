---
title: CODE-GUIDE — 代码规范
doc_type: template
layer: common
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
