# 维护：数据 / 中间件直连型工具

直连基础设施取数 / 查询（DB / Redis / Kafka / ES / 对象存储 / 向量库等）。一个中间件一个工具（如 `<工具>`）。

## 读取

- 现有 `docs/tools/tools/middleware/`（若有）与该类 `middleware.md`。
- `docs/deployment/`（该中间件各环境的连接参数取值）。

## 步骤

1. 明确要连的中间件、要覆盖的只读操作（查询 / 命令），以及要支持的写操作（若有）。
2. 落地 / 更新本工具（`tools/middleware/<工具>.mjs`，骨架 [assets/tool-middleware.mjs](assets/tool-middleware.mjs)
   ）：连接参数走命令行 flag（host / port / 账号 / 口令 /
   库名等），最典型的工具参数就是位置参数＝该中间件的命令 / 查询；默认只读，写加 `--write` 才允许（写须用户授权）；遵守统一契约。
3. 登记 AGENTS：该类 `docs/tools/tools/middleware/middleware.md` 只登记 **环境参数表**
   （其余固定内容在调用子文档 [call-middleware.md](call-middleware.md)）；同类多工具就复制该节，本类未落地就只写一行「本类未落地」。
4. 验证：只读命令跑通；未加 `--write` 的非只读被拒（退出码 1）；加 `--write` 的写生效（经用户授权）。

完成判据：只读命令跑通、未加 `--write` 的非只读被拒（退出码 1）、加 `--write` 的写生效；该类 `middleware.md` 的环境参数表已登记；符合统一契约。

## 边界

- 统一契约（stdout / 退出码 / 不默认 / fail-fast / 写授权 / `--help`）见 [contract.md](contract.md)。
- 环境清单 / 连接参数变化时，对齐该类 `middleware.md` 的环境参数表（Standalone 恒在最前；只改该类文档，不改 `DEPLOYMENT.md`
  本体——那按 deploy-ops）。

- 默认只读：不加 `--write` 时只放行只读语句 / 操作，其余拒绝。
- 写加 `--write` 才允许，且须先得到用户授权；清理类动作交用户确认。
