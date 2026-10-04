# AGENTS.md — tools/webmcp（页面调用型）

## webmcp

- 用途：驱动前端页面（整体），执行 **页面代码预制**的 WebMCP 子工具；本工具不内置任何子工具或流程，只做「连页面 → `--list`
  枚举 → `--seq` 通用调用」。
- 注意：子工具按页面注册、运行时按页 `--list --path` 取（见「子工具」）；浏览器 profile 按环境隔离；默认无头，需要人工旁观 /
  实时链路（音频等）时加 `--headed`。

### 环境参数

<!-- 生成提示:begin -->
本节动态生成：行 = 环境（Standalone 放最前，其下与 `docs/deployment/` 的环境一一对应），列 = **host**（该环境前端的地址，如
`http://localhost:5173` / `https://voice.bnfai.com`）——webmcp 的环境参数只有这一个。写一句「按环境选中对应行，把该行参数拼进命令」；连接信息只此一处、不落配置文件。
<!-- 生成提示:end -->

按环境选中对应行，把该行参数拼进命令：

| 环境 | host |
|------|------|

### 子工具（工具归属页面）

<!-- 生成提示:begin -->
本节动态生成：只登记 **页面清单**（path + 页面名 + 该页前端代码文件 + 说明：这页是干什么的，供按目标选页）；子工具不抄（运行时按页实时取）。
<!-- 生成提示:end -->

本工具触达的是 **前端页面**（整体：本前端应用的全部页面，而非某一个页面）；子工具由各页面代码在组件挂载时注册、卸载时注销，运行时按页实时取，文档只登记页面清单：

| path | 页面名 | 页面组件文件 | 说明 |
|------|--------|--------------|------|

### 工具参数

| 参数                 | 说明                                                                                   | 必填   | 示例                                       |
|----------------------|----------------------------------------------------------------------------------------|--------|--------------------------------------------|
| `--timeout <ms>`     | 单步执行超时                                                                           | 是     | `30000`                                    |
| `--list`             | 枚举当前页面注册的子工具（含 description / inputSchema / annotations）（模式，二选一） | 二选一 | `--list`                                   |
| `--seq '<JSON>'`     | 顺序执行子工具序列（模式，二选一）；每步 `{name,args}`                                 | 二选一 | `--seq '[{"name":"<子工具>","args":{…}}]'` |
| `--path <路径>`      | 起始页面路径（须以 / 开头；默认 base 根路径）                                          | 否     | `--path <页面 path>`                       |
| `--headed`           | 有头模式（默认无头）                                                                   | 否     | `--headed`                                 |
| `--connect <cdpUrl>` | 连接已运行的 Chrome（CDP 端点）                                                        | 否     | `--connect http://127.0.0.1:9333`          |
| `--step-delay <ms>`  | 步间停留毫秒（有头默认 1500，无头 0）                                                  | 否     | `--step-delay 1000`                        |

### 退出码约定

| 码 | 含义                                                   |
|----|--------------------------------------------------------|
| 0  | 成功                                                   |
| 1  | 子工具业务失败（`ok:false`）或断言不达标               |
| 2  | 参数 / 序列错误                                        |
| 3  | 浏览器 / 页面失败                                      |
| 10 | 配置错误（playwright-core 缺失 / modelContext 不可用） |

- 输出契约：stdout 只输出一行 JSON，人类诊断信息走 stderr。

### 调用方式

- 取子工具：`--list --path <页>` 返回该页当前真实注册的子工具（name / description / inputSchema / annotations）。
- 怎么读入参：读返回的 `inputSchema`——`properties` 键名 / 类型、`required`、`enum`，即调用入参。
- 怎么调：`{"name":"<子工具>","args":{…}}` 交给 `--seq`；跨页先 `{"goto":"<页>"}`。
- 页面代码位置 / 启用门控：各页 WebMCP 注册目录（与该页页面组件同工程）+ 启用门控（如 `VITE_WEBMCP=1`）。
- 先按「环境参数」选 host、再按「子工具」选页面 path，再选子工具 / 编排（`--timeout` 必填；`--list` / `--seq` 二选一）：

```bash
# ① 枚举某页子工具：拿到该页真实注册的 name / description / inputSchema / annotations
npm run webmcp -- --list --path <页面 path> --host <host> --timeout <ms>

# ② 单子工具
npm run webmcp -- --seq '[{"name":"<子工具>","args":{…}}]' --path <页面 path> --host <host> --timeout <ms>

# ③ 多步场景：一条 --seq 按序跑完（顺序 = 数组顺序，同一会话跨步保态）
#    {goto} 导航 + 重探工具；{wait} 等待；${i.field} 从第 i 步结果插值（i = 已完成步骤下标）
npm run webmcp -- --seq '[
  {"name":"<子工具A>","args":{…}},
  {"goto":"<页面 path>?x=${0.field}"},
  {"name":"<子工具B>","args":{"y":"${1.field}"}},
  {"wait":10000}
]' --host <host> --timeout <ms>

# ④ 有头（人工旁观 / 实时链路）+ 步间停留
npm run webmcp -- --seq '[{"name":"<子工具>","args":{…}}]' --headed --step-delay 1500 --host <host> --timeout <ms>

# ⑤ 连接已运行的 Chrome（该实例需自行带 WebMCP flag 启动）
npm run webmcp -- --list --connect http://127.0.0.1:9333 --host <host> --timeout <ms>
```
