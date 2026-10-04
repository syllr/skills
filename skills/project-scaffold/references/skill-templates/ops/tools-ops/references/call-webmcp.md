# 调用：页面调用型工具（webmcp）

调 `webmcp` 触达 **前端页面**（整体）；参数 / 页面 / 调用方式以 `docs/tools/tools/webmcp/AGENTS.md` 为准。

## 读取

- 该类 `docs/tools/tools/webmcp/AGENTS.md`（环境参数 / 工具参数 / 退出码 / 子工具页面清单 / 调用方式）。
- 单工具用法：`--help`。

## 步骤

1. 选环境：按类文档「环境参数」表选中该环境那一行（webmcp 只有 host）。
2. 选页面：按类文档「子工具」的页面清单（path + 说明）选能触达目标的页面。
3. 取子工具：`--list --path <页>` 拿该页真实注册的 name / description / inputSchema / annotations，按 `inputSchema` 组
   `args`。
4. 调：`--seq`——单子工具一条即可；多步 / 跨页用 `{name}` / `{goto}` / `{wait}`，并按 `${i.field}` 从前面结果插值；连接参数（
   `--host` / `--timeout`）拼进命令。
5. 报告：结论 + 所用环境 + 原始证据（stdout 单行 JSON），按退出码判断失败类型。

## 完成判据

- 参数取自类文档的环境参数表行；读 stdout 单行 JSON 并核对退出码；断言由 AI 判断、工具只取证据。

## 边界

- 默认只读（webmcp 无写开关）；唯一入口 / 禁旁路见 §2；目标无可用工具 → 走 §1 新增。
