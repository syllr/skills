# 维护：数据 / 中间件直连型工具

直连基础设施取数 / 对账（DB / Redis / Kafka / ES / 对象存储 / 向量库等）。一个中间件一个工具（如 `db`）。

## 读取

- 现有 `docs/tools/tools/middleware/`（若有）与该类 `AGENTS.md`。
- `docs/deployment/`（该中间件各环境的连接参数取值）。

## 步骤

1. 明确要连的中间件与要覆盖的只读操作（查询 / 命令）。
2. 落地 / 更新本工具（`tools/middleware/<工具>.mjs`）：连接参数走命令行 flag（host / port / 账号 / 口令 /
   库名等），最典型的工具参数就是位置参数＝该中间件的只读命令 / 查询； **对账 / 校验类只读、拒绝非只读操作**；遵守统一契约。
3. 登记 AGENTS：总览清单加一行；该类 `tools/middleware/AGENTS.md` 写该工具一节。
4. 验证：只读命令跑通；非只读被拒（退出码 1）。

## 边界

- 统一契约（stdout / 退出码 / 不默认 / fail-fast / 只读红线 / `--help`）见 [contract.md](contract.md)。
- 环境清单 / 连接参数变化时，对齐该类 AGENTS.md 的环境参数表（Standalone 恒在最前；只改 AGENTS.md，不改 `DEPLOYMENT.md`
  本体——那按 deploy-ops）。

- 只读红线：只放行只读语句 / 操作，其余拒绝。
- 不写库 / 不产生副作用；清理类动作交用户确认。
