# 调用：页面调用型工具（webmcp）

调 `webmcp` 触达 **前端页面**。核心是 **可用性绑定页面**：每个子工具只在 **它所属页面加载完成后**才真的能跑。项目相关的只有两张表（环境
host、工具 ↔ 可用页面），在 `docs/tools/tools/webmcp/webmcp.md`。

- 用途：驱动前端页面，执行 **页面代码预制** 的 WebMCP 子工具；本工具不内置任何子工具或流程，只做「连页面 → `--list` 枚举 →
  `--seq` 通用调用」。
- 注意：子工具按页面注册、运行时按页 `--list --path` 取；浏览器 profile 按环境隔离；默认无头，需要人工旁观 / 实时链路（音频等）时加
  `--headed`。

## 读取

- 该类 `docs/tools/tools/webmcp/webmcp.md`——本项目只有两张表：环境参数（host）、子工具（工具 ↔ 可用页面）。
- 单工具用法：`--help`。

## 步骤

1. 选环境：问用户连哪个环境（或按上下文确定），按类文档「环境参数」表选中该环境那一行（webmcp 只有 host）。
2. 选工具与页面：按类文档「子工具」找能触达目标的工具，记下它的 **可用页面**。
3. 到页：`{"goto":"<可用页面>"}`（或 `--path <页>`） **先到那页、等加载完成**——工具只有在所属页面加载完成后才可用。
4. 取子工具：`--list --path <页>` 返回该页当前真实注册、可用的子工具（name / description / inputSchema / annotations）——
   **发布后**的真值；读 `inputSchema`（`properties` 键名 / 类型、`required`、`enum`）组 `args`。子工具代码位置见页面组件的
   WebMCP 注册目录。
5. 调：`--seq`——单子工具一条；多步 / 跨页用 `{name}` / `{goto}` / `{wait}`，`${i.field}` 从前面结果插值；连接参数（`--host` /
   `--timeout`）拼进命令。
6. 报告：结论 + 所用环境 + 原始证据（stdout 单行 JSON），按退出码判断失败类型。

## 工具参数（固定）

| 参数                 | 说明                                                                                   | 必填   | 示例                                       |
|----------------------|----------------------------------------------------------------------------------------|--------|--------------------------------------------|
| `--timeout <ms>`     | 单步执行超时                                                                           | 是     | `30000`                                    |
| `--list`             | 枚举当前页面注册的子工具（含 description / inputSchema / annotations）（模式，二选一） | 二选一 | `--list`                                   |
| `--seq '<JSON>'`     | 顺序执行子工具序列（模式，二选一）；每步 `{name,args}`                                 | 二选一 | `--seq '[{"name":"<子工具>","args":{…}}]'` |
| `--path <路径>`      | 起始页面路径（须以 / 开头；默认 base 根路径）                                          | 否     | `--path <页面 path>`                       |
| `--headed`           | 有头模式（默认无头）                                                                   | 否     | `--headed`                                 |
| `--connect <cdpUrl>` | 连接已运行的 Chrome（CDP 端点）                                                        | 否     | `--connect http://127.0.0.1:9333`          |
| `--step-delay <ms>`  | 步间停留毫秒（有头默认 1500，无头 0）                                                  | 否     | `--step-delay 1000`                        |

`--host` 是环境参数，见类文档「环境参数」。

## 退出码（固定）

| 码 | 含义                                                   |
|----|--------------------------------------------------------|
| 0  | 成功                                                   |
| 1  | 子工具业务失败（`ok:false`）或断言不达标               |
| 2  | 参数 / 序列错误                                        |
| 3  | 浏览器 / 页面失败                                      |
| 10 | 配置错误（playwright-core 缺失 / modelContext 不可用） |

- 输出契约：stdout 只输出一行 JSON，人类诊断信息走 stderr。

## 调用方式

```bash
# ① 到页后枚举子工具：先到该页（--path 或 {goto}），等加载完成，再拿该页真实注册的 name / description / inputSchema / annotations
npm run webmcp -- --list --path <可用页面> --host <host> --timeout <ms>

# ② 单子工具
npm run webmcp -- --seq '[{"name":"<子工具>","args":{…}}]' --path <可用页面> --host <host> --timeout <ms>

# ③ 多步 / 跨页：一条 --seq 按序跑完（顺序 = 数组顺序，同一会话跨步保态）
#    {goto} 导航 + 重探工具（跨页必用）；{wait} 等待；${i.field} 从第 i 步结果插值（i = 已完成步骤下标）
npm run webmcp -- --seq '[
  {"name":"<子工具A>","args":{…}},
  {"goto":"<另一个可用页面>?x=${0.field}"},
  {"name":"<子工具B>","args":{"y":"${1.field}"}},
  {"wait":10000}
]' --host <host> --timeout <ms>

# ④ 有头（人工旁观 / 实时链路）+ 步间停留
npm run webmcp -- --seq '[{"name":"<子工具>","args":{…}}]' --headed --step-delay 1500 --path <可用页面> --host <host> --timeout <ms>

# ⑤ 连接已运行的 Chrome（该实例需自行带 WebMCP flag 启动）
npm run webmcp -- --list --path <可用页面> --connect http://127.0.0.1:9333 --host <host> --timeout <ms>
```

## 完成判据

- 参数取自类文档的环境参数表行；先到可用页面、等加载完成再调；读 stdout 单行 JSON 并核对退出码；断言由 AI 判断、工具只取证据。

## 边界

- 默认只读（webmcp 无写开关）；唯一入口 / 禁旁路见 §2；目标无可用工具 → 走 §1 新增。
- 可用性以能跑为准：页面未就绪时调会失败，先 `{goto}` 到可用页面并等加载完成。
