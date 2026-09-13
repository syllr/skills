---
name: contract-export
description: L3 Inbound API 契约（openapi）导出执行器——按 docs/L3/API.md §2 的命令从代码导出 OpenAPI 契约、按 §1 口径拆分多文件、机检、门禁落盘并报告。含引导能力：项目无导出脚本时探测语言框架、落地导出/拆分脚本、试跑。触发词：导出契约、导出 openapi、重导出契约、契约同步、更新 openapi、生成 schema、openapi 导出、契约漂移、契约不一致、校验契约
license: UNLICENSED
metadata:
  audience: ai-contract-exporter
  rule-source: .omo/rules/docs/L3/API.md
  generated-by: doc-arch-rules
---

# contract-export — L3 Inbound API 契约导出执行器

定位：把「代码」导出为「机器可读契约」（`docs/L3/openapi/`），是 L3 契约层「自动化优先」（宪法 §2.2 第 5 条）中契约类差异的执行体。契约的规范正文（文件结构/导出命令/维护规范/CI pipeline/协议表）SSOT 是 `docs/L3/API.md`（由 L3/API rule 承载），本 skill 只读它并执行，不复制其内容、不生成 API.md 正文。

> 边界（不做）：不做文档-代码漂移的分诊与清账（归 docs-align）；不生成 API.md 正文（归 L3/API rule）；不生成客户端代码；不管理 Outbound 集成契约（INTEGRATION）；不手工编辑契约（一切经导出+拆分脚本）。

本 skill 自带资料：

- 引导映射 [references/bootstrap.md](references/bootstrap.md)——各语言框架的导出形态（CLI 一行 / 需脚本），命令一律见 API.md §2，本文件不复制命令
- 执行方法论 [references/export-mechanics.md](references/export-mechanics.md)——临时目录策略、门禁落盘、拆分口径、机检清单、失败分诊
- 参考实现 [assets/reference-impl/](assets/reference-impl/)——导出/拆分脚本模板（按框架分），引导时复制到项目

## 分诊（进入第一件事）

| 分诊             | 触发                                                              | 动作 |
| ---------------- | ----------------------------------------------------------------- | ---- |
| 1 引导           | 项目无导出脚本，或 `docs/L3/API.md` §2 无导出命令，或首次接入     | §1   |
| 2 导出（主路径） | 导出契约 / 重导出 openapi / 契约同步 / 更新 openapi / 生成 schema | §2   |
| 3 机检           | 校验契约 / 契约一致性（只检不写）                                 | §3   |

## 1. 引导（让导出路径成立）

1. 探测语言框架：扫后端代码与技术栈（package.json / go.mod / pom.xml / pyproject.toml / requirements.txt 等），按 [references/bootstrap.md](references/bootstrap.md) 判定形态（CLI 一行 / 需脚本）
2. 按框架从 `assets/reference-impl/` 复制对应脚本到项目约定位置（如 FastAPI `backend/scripts/export_openapi.py`）；CLI 类框架无需脚本，跳过本步
3. 把导出命令与产物路径写入 `docs/L3/API.md` §2 对应框架小节（命令 SSOT 落 API.md；若 §2 缺失/不符，交 L3/API rule 更新，本 skill 不手改正文）
4. 试跑导出（见 §2 步骤 3-4 的临时目录策略）——代码未 instrument 时导出会缺 operationId/x-action，属预期，报告缺口
5. 报告：框架 / 落地脚本 / API.md §2 待回写项 / 代码 instrument 缺口（tags、operationId、x-action/x-capability）

## 2. 导出（主路径）

1. 读源：`docs/L3/API.md` §2（导出命令 SSOT）+ §1（多文件口径）+ §4 step5（CI 漂移检测命令，与本地共用同一入口）；确认项目导出/拆分脚本存在——不存在走 §1 引导
2. 环境确认：导出若依赖 DB/Redis/env，确认其可用；命令缺失或多文件口径未定时问用户（其余不问）
3. 导出到临时目录（不直接落 `docs/`）：执行 §2 命令 → 临时文件（如 `/tmp/openapi-export.json`）
4. 拆分：按 §1 口径跑拆分脚本 → 临时目录产出 `openapi.yaml + paths/<domain>.yaml + components/*`
5. 机检（按 [references/export-mechanics.md](references/export-mechanics.md) 清单）：$ref 完整性（无悬空）、端点计数三方一致（`openapi.yaml` 尾注释 = API.md §1 表 = paths 文件）、每个 operation 有 x-action/x-capability、servers 变量化、组织正确（`openapi.yaml` 只承载元信息与 $ref）；工具可用时跑 lint/spectral
6. 门禁落盘：与现有契约 diff——若检出语义丢失（手写 x-action/描述/依据注释）或代码未 instrument 导致缺口，停止并报告，不覆盖；否则落盘到 `docs/L3/openapi/`
7. 报告：变化摘要 + API.md §1 端点计数差异（交 L3/API rule 同步，本 skill 不手改正文）+ 未通过项

## 3. 机检（只检不写）

按 §2 步骤 5 的清单执行，输出通过/未通过项；检出问题只报告并建议（引导 §1 / 重导出 §2 / 交 docs-align 记录漂移），不修改契约。

## 边界与纪律

- 契约一律从代码导出（代码是 SSOT）：禁止手写 yaml、禁止「先 yaml 后生成代码」反向流程
- 一切写入经导出+拆分脚本；本 skill 不手工编辑 `docs/L3/openapi/` 下任何文件
- 命令 SSOT 在 `docs/L3/API.md` §2，本 skill 不复制命令文本（跨项目通用）；框架形态映射见 references
- 门禁落盘不可省：它是防止首次导出静默抹掉手写契约语义的唯一机制
- 契约漂移的检测/分诊/清账归 docs-align；本 skill 只做「按代码重生成」的执行
- 不生成客户端代码、不自动 commit/push
