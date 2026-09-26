# API-<模块>-<序号>

- 接口：`<METHOD> <path>`（operationId `<xxx>`）
- 业务对象：<领域实体>（Action/Event，或「查询，无 Action/Event」）

---

## Case 1 · <语义名>

### 前置条件

```bash
# 登录 → 取 $.data.accessToken 注入 API_TOKEN
npm run api -- --operation authLogin --body '{"username":"<账号>","password":"<凭据来源>"}'
```

### 执行流程

```bash
npm run api -- --operation <operationId> --path '{"<path参数>":"<值>"}' --body '{"<业务字段>":"<值>", ...}'
```

### 期望结果

<status>，`$.<字段>` = <值>（字段名以契约 schema 为准）

### 数据对账

```bash
npm run db -- "SELECT <列> FROM <表> WHERE <标识> = '<值>'"
# → 期望：<结果>
```

### 数据清理

- 正常（接口可用）：`npm run api -- --operation <删除类> --path '{"<标识>":"<值>"}'`
- 兜底 1（接口失败/被测不可用）：`npm run db -- --cleanup <标识值>`
- 兜底 2（外部依赖残留）：<以项目实际数据落位为准的清理命令>
