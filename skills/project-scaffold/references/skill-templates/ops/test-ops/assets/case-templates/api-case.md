# API-<模块>-<序号>

<!-- 生成提示：复制本卡结构与契约（头 + Case N 五段），按被测系统替换 <> 占位与示例值，落到 docs/test/test-cases/api/<实体>/；本注释不进产物。 -->

- 接口：`<METHOD> <path>`（operationId `<xxx>`）
- 业务对象：<领域实体>（Action/Event，或「查询，无 Action/Event」）
- 工具：全部经 `tools-ops` skill——接口调用走该 skill 的本应用接口类工具，对账与清理走该 skill 的中间件类工具（命令形态
  `npm run <工具> -- …`；清单与环境参数见 `tools-ops` skill 的类文档，用法见 `--help`）

---

## Case 1 · <语义名>

### 前置条件

```bash
# 登录 → 取 $.data.accessToken 注入 API_TOKEN
npm run <接口工具> -- --operation authLogin --body '{"username":"<账号>","password":"<凭据>"}'
```

### 执行流程

```bash
npm run <接口工具> -- --operation <operationId> --path <k>=<v> --body '{"<业务字段>":"<值>", ...}'
```

### 期望结果

<status>，`$.<字段>` = <值>（字段名以契约 schema 为准）

### 数据对账

```bash
npm run <中间件工具> -- "<SELECT 查询>"
# → 期望：<结果>
```

### 数据清理

- 正常（接口可用）：`npm run <接口工具> -- --operation <删除类> --path <标识>=<值>`
- 兜底 1（接口失败/被测不可用）：`npm run <中间件工具> -- "<清理语句>" --write`（写操作；所需授权由执行流程在开跑前一次拿齐）
- 兜底 2（外部依赖残留）：<以项目实际数据落位为准的清理命令>
