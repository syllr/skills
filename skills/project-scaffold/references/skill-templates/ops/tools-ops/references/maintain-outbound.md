# 维护：outbound 接口型工具

调 **外部系统**。接口来源是 `docs/contracts/outbound/`（outbound-ops 维护；按每个应用对外的 client
维度、每应用一份：外部系统 → Client 与调用方式 → 接口 → client 代码位置映射）。

## 读取

- `docs/contracts/outbound/`（按每个应用对外的 client 维度、每应用一份：接口 → client 代码映射）。
- 现有 `docs/tools/tools/outbound/`（若有）与该类 `outbound.md`。

## 步骤

1. 从 outbound 契约盘出要覆盖的外部系统与接口（接口名 / 方法签名 / client 代码位置 / 入参）。
2. 落地 / 更新本工具（`tools/outbound/<工具>.mjs`）：按 client 定义调用外部系统、传参与鉴权走命令行 flag；遵守统一契约。
3. 登记 AGENTS：该类 `docs/tools/tools/outbound/outbound.md` 只登记 **环境参数表**
   （其余固定内容在调用子文档 [call-outbound.md](call-outbound.md)）；同类多工具就复制该节，本类未落地就只写一行「本类未落地」。
4. 验证：能按接口直调通；失败按退出码归类。

## 完成判据

- 能按接口直调通、失败按退出码归类；该类 `outbound.md` 的环境参数表已登记、且与 `docs/deployment/` 一致；符合统一契约。

## 边界

- 统一契约（stdout / 退出码 / 不默认 / fail-fast / 默认只读·写开关 / `--help`）见 [contract.md](contract.md)。
- 环境清单 / 连接参数变化时，对齐该类 `outbound.md` 的环境参数表（Standalone 恒在最前；只改该类文档，不改 `DEPLOYMENT.md`
  本体——那按 deploy-ops）。

- 接口定义以 `docs/contracts/outbound/` 为准，不在本工具里另立清单。
- 默认只读；写 / 计费 / 幂等敏感调用加 `--write` 才允许，且须先得到用户授权。
