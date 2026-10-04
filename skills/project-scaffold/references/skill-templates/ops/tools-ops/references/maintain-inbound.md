# 维护：inbound 接口型工具（api）

直调 **本应用对外接口**。接口来源是 `docs/contracts/inbound/`（inbound-ops 维护；按应用维度、每应用一份：应用 → 接口 →
代码位置映射）。

## 读取

- `docs/contracts/inbound/`（按应用维度、每应用一份：接口 → 代码映射）。
- 现有 `docs/tools/tools/inbound/`（若有）与该类 `AGENTS.md`。

## 步骤

1. 从 inbound 契约盘出要覆盖的接口（operationId / 方法 / 路径 / 入参键）。
2. 落地 / 更新本工具（`tools/inbound/api.mjs`）：`--operation <operationId>` + `--path/--query/--header/--body/--form`
   传参；发请求前做 **fail-fast 契约校验**（输入键不在被测契约声明内即报错并列出可用键）；遵守统一契约。
3. 登记 AGENTS：该类 `tools/inbound/AGENTS.md` 写该工具一节（含「接口来源」指向 `docs/contracts/inbound/`）。
4. 验证：`--operation <id>` 直调通；非法键被 fail-fast 拒绝。

## 完成判据

- 能按 `--operation` 直调通、非法键被 fail-fast 拒绝；该类 AGENTS 已登记、且与 `docs/contracts/inbound/` 一致；符合统一契约。

## 边界

- 统一契约（stdout / 退出码 / 不默认 / fail-fast / 默认只读·写开关 / `--help`）见 [contract.md](contract.md)。
- 环境清单 / 连接参数变化时，对齐该类 AGENTS.md 的环境参数表（Standalone 恒在最前；只改 AGENTS.md，不改 `DEPLOYMENT.md`
  本体——那按 deploy-ops）。

- 接口定义以 `docs/contracts/inbound/` 为准，不在本工具里另立清单。
- 默认只读；写接口 / 变更类调用加 `--write` 才允许，且须先得到用户授权。
