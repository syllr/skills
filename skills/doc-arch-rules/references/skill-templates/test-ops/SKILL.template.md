---
name: test-ops
description: 测试用例执行器（testcase runner）——按 docs/L4/DEPLOYMENT.md 确认测试环境、扫描用例目录与用户确认执行范围、依赖分析排序、失败策略确认、按需部署（经 deploy-ops）、按序执行用例并汇报。触发词：跑用例、执行 case、执行测试、回归测试、测试用例、跑测试
license: UNLICENSED
metadata:
  audience: ai-test-executor
  rule-source: .omo/rules/docs/L4/TEST-PLAN.md
  generated-by: doc-arch-rules
---

# test-ops — 测试用例执行器（testcase runner）

AI 是测试执行器：用例卡结构与写卡规范的 SSOT 是 TEST-PLAN rule（`.omo/rules/docs/L4/TEST-PLAN.md`，写/更新用例由该 rule 触发承载，本 skill 不重复），测试工具用法现场读 `test-tools/README.md`，本 skill 只固化执行编排。

## 流程

1. 环境确认：读 DEPLOYMENT §2.1 环境矩阵，列出可用环境，问用户要在哪些环境上测试
2. 范围确认：扫描 `docs/test/test-cases/` 用例目录（api/<领域实体>/ 与 flow/<USER-STORY 场景>/），列出可用用例，问用户执行范围（全部 / 某领域目录 / 指定 <文件> 的 caseN / 某一批用例）——未确认不执行
3. 排序分析：通读范围内用例，按前置条件做依赖分析确定执行顺序——被依赖的用例先行（如查询类用例的前置通常是新建业务对象，新建用例必须先跑）；上游失败是否阻塞下游具体问题具体分析（结构性前置缺失会阻塞，字段级差异一般不阻塞）
4. 策略确认：问用户失败策略——fail-fast（遇失败即停下定位）或全量跑完再逐个定位
5. 部署判断：按范围内用例涉及的模块推断需部署的应用（前端/后端），与用户确认
6. 执行：建 todo——第一项按步骤 1/5 的结论经 deploy-ops 部署对应应用到目标环境；随后按步骤 3 顺序逐卡执行（读卡，按卡的前置/执行/期望/数据对账/清理照做，逐条记录 pass/fail 与对账证据），按步骤 4 策略处理失败；完成后汇报 pass/fail 清单与失败定位
