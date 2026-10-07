---
name: test-ops
description: 测试用例唯一入口与执行器（testcase ops，分诊）——用例只有接口与流程两类（无单元测试，见根 AGENTS.md §2.7），任何操作都只能经本 skill：执行用例（范围/环境/依赖排序/失败策略/执行/测试记录/汇报）；管理用例（新增/更新/删除/写卡规范自持）；DoD 持久化（用户显式要求时，把上下文里的 DoD 验证转成正式用例卡）。AI 不得自动创建任何用例，用例卡的新增与删除由用户手动配置。改动交付前用 tools 在 standalone 做的 DoD 验证由 AI 自持、不经本 skill（根 AGENTS.md §2.7）。触发词：跑用例、执行 case、执行测试、回归测试、测试用例、跑测试、新增用例、删除用例、更新用例、用例管理、用例卡规范、写用例卡、编辑用例、DoD 持久化、DoD 转用例卡、固化用例
metadata:
  opencode/autoinvoke: false
---

# test-ops — 测试用例执行与用例管理（testcase ops）

本 skill 是测试用例的唯一入口：一进来先看「分诊」，再进入对应子流程。

范围与自持：AI 既是测试执行器，也是用例库的维护者。用例只有接口与流程两类（无单元测试，见根 AGENTS.md §2.7），新增 /
更新 / 删除 / 执行都只能经本 skill——AI 不得自动创建任何用例，用例卡的新增与删除由用户手动配置（根
AGENTS.md §2.6 用例唯一入口）；改动交付前在 standalone 做的 DoD 验证由 AI 自持、不经本 skill（根
AGENTS.md §2.7），本 skill 只管正式用例卡与 DoD 持久化。

## 分诊

| 分诊             | 触发                                                                         | 进入                                                     |
|------------------|------------------------------------------------------------------------------|----------------------------------------------------------|
| 1 执行用例       | 跑用例 / 执行 case / 执行测试 / 回归测试                                     | [references/run-cases.md](references/run-cases.md)       |
| 2 用例生成与更新 | 新增 / 更新 / 删除用例；写 / 编辑用例卡；DoD 持久化（把 DoD 验证转成用例卡） | [references/manage-cases.md](references/manage-cases.md) |

> 执行用例、增删用例卡、DoD 持久化，三者一律由用户显式调起后才做；AI 不得因刚跑完 DoD 或判断「这次验证值得留」就自动触发。

- 用例卡骨架：[assets/case-templates/api-case.md](assets/case-templates/api-case.md)（API 卡，走本应用接口类工具）/
  [flow-case.md](assets/case-templates/flow-case.md)（FLOW 卡，走页面调用型工具 + 截图）——复制骨架后替换实体 / 接口与 Case
  内容。
- `docs/test/` 资产布局、落盘与旧资产清理见 [references/test-assets.md](references/test-assets.md)。
