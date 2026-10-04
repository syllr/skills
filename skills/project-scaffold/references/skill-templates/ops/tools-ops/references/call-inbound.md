# 调用：inbound 接口型工具（api）

调 `inbound` 工具直调 **本应用对外接口**；接口来源 `docs/contracts/inbound/`，参数 / 调用方式以
`docs/tools/tools/inbound/AGENTS.md` 为准。

## 读取

- 该类 `docs/tools/tools/inbound/AGENTS.md`（环境参数 / 工具参数 / 退出码 / 调用方式）。
- `docs/contracts/inbound/`（接口 → 代码映射）。
- 单工具用法：`--help`。

## 步骤

1. 选环境：按类文档「环境参数」表选中该环境那一行。
2. 选接口：按 `docs/contracts/inbound/` 定位 operationId；调前读该接口代码核对入参键名 / 必填 / 形态。
3. 调：把该行连接参数 + 接口与入参拼进命令（见类文档「调用方式」）。
4. 报告：结论 + 所用环境 + 原始证据（stdout 单行 JSON），按退出码判断失败类型。

## 完成判据

- 参数取自类文档的环境参数表行；读 stdout 单行 JSON 并核对退出码；断言由 AI 判断、工具只取证据。

## 边界

- 默认只读；写接口加 `--write` 且须先得到用户授权；唯一入口 / 禁旁路见 §2；目标无可用工具 → 走 §1 新增。
