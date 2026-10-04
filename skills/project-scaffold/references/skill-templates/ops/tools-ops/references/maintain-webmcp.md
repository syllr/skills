# 维护：页面调用型工具（webmcp）

该工具驱动页面、执行 **页面代码预制**的 WebMCP 子工具；本工具不内置任何子工具或流程。系统有页面 / WebMCP 通道时才有该类工具。

## 读取

- 工程页面代码里的 WebMCP 工具定义（如 `frontend/**/webmcp/`：每页一文件 + 注册层），拿到子工具的名字 / 说明 / 入参与
  **注册方式**（怎么注册、AI 怎么解析）。
- 现有 `docs/tools/tools/webmcp/`（若有）与该类 `AGENTS.md`。

## 步骤

1. 读工程页面代码，盘点子工具（name / description / inputSchema / 定义位置）与注册方式。
2. 落地 / 更新本工具（`tools/webmcp/webmcp.mjs`）：动态调度器——`--list` 枚举子工具（含 inputSchema）、`--seq '<JSON 数组>'` 按
   `{name,args}` 顺序调用、同一页面会话内跨步保态、可从前面结果插值；遵守统一契约（stdout 单行 JSON / 退出码 / flag 不默认 /
   fail-fast / `--help`）。 **改子工具只改页面代码，本工具不动**。
3. 登记 AGENTS：总览清单加一行（工具 / 类 / 说明 / 目录）；该类 `tools/webmcp/AGENTS.md` 写「子工具」一节（代码位置 +
   注册方式 + 运行时枚举 + 子工具表）。
4. 验证：`--list` 能枚举到子工具；`--seq` 能按序调用（跨步插值生效）。

## 边界

- 统一契约（stdout / 退出码 / 不默认 / fail-fast / 只读红线 / `--help`）见 [contract.md](contract.md)。
- 环境清单 / 连接参数变化时，对齐该类 AGENTS.md 的环境参数表（Standalone 恒在最前；只改 AGENTS.md，不改 `DEPLOYMENT.md`
  本体——那按 deploy-ops）。

- 不把子工具的入参摊成本工具的「工具参数」——那是页面代码的事，本工具只做通用调度。
- 页面 / WebMCP 通道不存在时，本类工具不落地。
