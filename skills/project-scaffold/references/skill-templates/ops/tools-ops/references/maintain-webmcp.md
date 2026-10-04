# 维护：页面调用型工具（webmcp）

该工具驱动页面、执行 **页面代码预制**的 WebMCP 子工具；本工具不内置任何子工具或流程。有页面 / WebMCP 通道才有该类工具；没有则保留类目录与
`AGENTS.md`、内容写「本类未落地」。

## 读取

- 工程页面代码里的 WebMCP 工具定义（如 `frontend/**/webmcp/`：每页一文件 + 注册层），拿到子工具的名字 / 说明 / 入参与
  **注册方式**（怎么注册、AI 怎么解析）。
- 现有 `docs/tools/tools/webmcp/`（若有）与该类 `AGENTS.md`。

## 步骤

1. 读工程页面代码，盘点子工具（name / description / inputSchema / 定义位置）与注册方式。
2. 落地 / 更新本工具（`tools/webmcp/webmcp.mjs`）：动态调度器——`--list` 枚举子工具（含 inputSchema）、`--seq '<JSON 数组>'` 按
   `{name,args}` 顺序调用、同一页面会话内跨步保态、可从前面结果插值；遵守统一契约（stdout 单行 JSON / 退出码 / flag 不默认 /
   fail-fast / `--help`）。 **改子工具只改页面代码，本工具不动**。
3. 登记 AGENTS：该类 `tools/webmcp/AGENTS.md` 写该工具一节，其中「子工具」小节（代码位置 +
   注册方式 + 运行时枚举 + 子工具表）。
4. 验证：`--list` 能枚举到子工具；`--seq` 能按序调用（跨步插值生效）。

## 完成判据

- 该类工具落地：`--list` 能枚举到子工具、`--seq` 能按序调用（跨步插值生效）；该类 AGENTS 的「子工具」小节已登记、且与工程页面代码一致；符合统一契约。

## 边界

- 统一契约（stdout / 退出码 / 不默认 / fail-fast / 默认只读·写开关 / `--help`）见 [contract.md](contract.md)。
- 环境清单 / 连接参数变化时，对齐该类 AGENTS.md 的环境参数表（Standalone 恒在最前；只改 AGENTS.md，不改 `DEPLOYMENT.md`
  本体——那按 deploy-ops）。

- 不把子工具的入参摊成本工具的「工具参数」——那是页面代码的事，本工具只做通用调度。
- 调度型：本工具自己还会调用一组子工具——用通用参数（JSON）携带子工具与入参，子工具各自写进 AGENTS.md 的「子工具」一节，预置流程写进「流程」一节。
- 本工具只读（页面子工具只取证据），没有写开关。
- 页面 / WebMCP 通道不存在时，本类不落地，`AGENTS.md` 保留并写「本类未落地」。
