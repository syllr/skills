# 调用：inbound 接口型工具（api）

调 `inbound` 工具直调 **本应用对外接口**。项目相关的只有一张表（环境参数），在 `docs/tools/tools/inbound/inbound.md`。

- 用途：AI 直调本应用 inbound API 取数 / 落库验证。
- 注意：写 / 变更类调用须先得到用户授权；参数一律不给默认值，缺任一必填项即报错（退出码 1）。

## 读取

- 该类 `docs/tools/tools/inbound/inbound.md`——本项目只有环境参数表。
- `docs/contracts/inbound/`（inbound-ops 维护；按应用维度、每应用一份：应用 → 接口 → 代码位置映射）。
- 单工具用法：`--help`。

## 步骤

1. 选环境：按类文档「环境参数」表选中该环境那一行。
2. 选接口：按 `docs/contracts/inbound/` 定位 operationId；调前读该接口代码核对入参键名 / 必填 /
   形态（同一会话内每个接口只在首次调用前核对一次）。
3. 调：把该行连接参数 + 接口与入参拼进命令（见下「工具参数」「调用方式」）。
4. 报告：结论 + 所用环境 + 原始证据（stdout 单行 JSON），按退出码判断失败类型。

## 工具参数（固定）

| 参数                              | 说明                  | 必填 | 示例                        |
|-----------------------------------|-----------------------|------|-----------------------------|
| `--operation <operationId>`       | 选接口                | 是   | `--operation <operationId>` |
| `--path` / `--query` / `--header` | 路径 / query / 请求头 | 否   | `--query page=1`            |
| `--body` / `--form`               | JSON body / 表单字段  | 否   | `--body '{…}'`              |

发请求前做 fail-fast 契约校验：输入键不在被测契约声明内即报错并列出可用键。完整语义以 `--help` 为准。

## 退出码（固定）

| 码 | 含义            |
|----|-----------------|
| 0  | 成功            |
| 1  | 参数 / 契约错误 |
| 2  | 网络失败        |
| 3  | 数据层失败      |
| 4  | 配置错误        |

- 输出契约：stdout 只输出一行 JSON，人类诊断信息走 stderr。

## 调用方式

```bash
# 只读：选接口 + 入参 + 环境参数表该行
npm run api -- --operation <operationId> [--path k=v] [--query k=v] [--header k=v] [--body '{…}' | --form k=v] <环境参数表该行>

# 写 / 变更类（须先得到用户授权）
npm run api -- --operation <operationId> [--body '{…}' | --form k=v] <环境参数表该行>
```

## 完成判据

- 参数取自类文档的环境参数表行；读 stdout 单行 JSON 并核对退出码；断言由 AI 判断、工具只取证据。

## 边界

- 写 / 变更类调用须先得到用户授权；唯一入口 / 禁旁路见 §2；目标无可用工具 → 走 §1 新增（骨架 `assets/tool-inbound.mjs`）。
