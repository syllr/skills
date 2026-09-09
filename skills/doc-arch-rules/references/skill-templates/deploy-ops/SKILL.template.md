---
name: deploy-ops
description: 部署与运维操作——按 docs/L4/DEPLOYMENT.md 执行部署：环境发现与确认、commit 询问、按文档发布流程执行、版本核对与结果报告。触发词：部署、发布前端、发布后端、部署 dev、启动 standalone、部署状态、发布版本、回滚部署
license: UNLICENSED
metadata:
  audience: ai-deploy-operator
  rule-source: .omo/rules/docs/L4/DEPLOYMENT.md
  generated-by: doc-arch-rules
---

# deploy-ops — 部署与运维

AI 是部署操作员：部署知识的 SSOT 是 `docs/L4/DEPLOYMENT.md`（环境矩阵 §2.1 / standalone 启动 §4 / dev 发布流程 §5.3 / 发布脚本 §7.4），执行时现场读文档照做，本 skill 不复制任何命令与环境信息。

## 流程

1. 环境确认：读 DEPLOYMENT §2.1 环境矩阵，列出可用环境，问用户部署到哪个环境、范围（前端/后端/全部）——未确认前不执行任何部署动作
2. commit 询问：问用户「先 commit 再部署」还是「不 commit 直接部署当前代码」；选先 commit 时，须用户显式授权后才执行 commit；选不 commit 直接部署时，版本核对中 BUILD_COMMIT 与本地 HEAD 不一致属预期，报告中如实说明
3. 执行：按 DEPLOYMENT 对应章节执行（dev 发布走 §5.3 一条龙脚本，standalone 启动走 §4），AI 不手拼部署命令
4. 报告：版本核对（BUILD_COMMIT 与本地 HEAD 对比）、健康检查结果、失败项（如有）
