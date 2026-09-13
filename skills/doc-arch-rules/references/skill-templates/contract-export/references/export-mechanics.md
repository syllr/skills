# 执行方法论（export-mechanics）

导出/拆分的执行细则——本文件承载 rule 不承载的「怎么执行」（临时目录、门禁、口径、机检、失败分诊）。命令与产物结构见项目 `docs/L3/API.md` §1/§2。

## 1. 临时目录策略（门禁落盘）

导出产物不直接写入 `docs/L3/openapi/`，先落临时目录，机检 + diff 通过后才落盘：

1. 导出 → 临时单文件（如 `/tmp/openapi-export.json`）
2. 拆分 → 临时目录（如 `/tmp/openapi-export/`）
3. 机检（§3）通过后，与现有 `docs/L3/openapi/` diff
4. diff 门禁（§4）通过后，整体落盘

理由：现契约若非代码导出，首次导出必然全量差异，直接覆盖会静默抹掉手写语义（x-action/描述/依据注释）。

## 2. 拆分口径（多文件 $ref）

- 由导出 + 拆分脚本产出，禁止手工编辑拆分文件（悬空 `$ref` 的根因）
- 口径二选一（API.md §1 已定，全篇一致）：components 全量收敛 `components/`，或 paths 文件含本地 components
- 推荐口径：components 全量收敛 `components/`，paths 文件零本地 components——避免路径文件内 `#/components/...` 解析不到（悬空）
- 主文件 `paths` 用 path item 级 `$ref` 聚合，`$ref` 分隔符用 `~1` 转义
- 拆分后必须 `redocly bundle`/`lint` 通过（悬空 $ref 会报）

## 3. 机检清单

| 检查                  | 方法                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| $ref 完整性（无悬空） | `npx @redocly/cli bundle` 通过                                             |
| 端点计数三方一致      | `openapi.yaml` 尾注释 = `docs/L3/API.md` §1 表 = `paths/*.yaml` 文件数     |
| operation 元数据      | 每个 operation 含 `x-action` 与 `x-capability`（或豁免映射单值）           |
| servers 变量化        | servers 不含随环境变化的硬编码 host（应变量化或指向环境配置）              |
| 组织正确              | `openapi.yaml` 只承载元信息与 `$ref`，不内联 path/schema                   |
| 语法/规则             | `npx @redocly/cli lint` / `npx @stoplight/spectral-cli lint`（工具可用时） |

## 4. 门禁落盘（diff 判定）

落盘前与现有契约 diff，命中以下任一即停止并报告，不覆盖：

- 语义丢失：现有手写 `x-action`/`x-capability`/描述/依据注释在导出产物中缺失
- 代码未 instrument：导出产物缺 `operationId`（会打断 L4 测试工具的 operationId 调用）或 tags
- $ref 悬空或 lint 失败
- servers 随环境漂移

报告后交用户决策（补齐代码元数据后重导出 / 授权保留手写标注 / 暂不迁移）。

## 5. 失败分诊

| 现象                                | 处置                                                                 |
| ----------------------------------- | -------------------------------------------------------------------- |
| 导出命令不存在                      | 走引导分诊（SKILL §1），落脚本并回写 API.md §2                       |
| 导出报应用构建失败（DB/Redis 依赖） | 调整脚本为离线构建（延迟连接/注入 stub env），或在环境齐备时导出     |
| 拆分后 $ref 悬空                    | 检查口径是否统一；重跑拆分脚本；禁止手改拆分文件                     |
| 计数不一致                          | 重导出后应同步；若仍不一致，检查 `openapi.yaml` 尾注释是否由脚本生成 |
| operationId 缺失                    | 代码补 operationId（框架对应声明），属代码 instrument，报告给用户    |
| 与 CI step5 结果不一致              | 本地直接调用 API.md §4 step5 的同一命令，不做第二套导出路径          |
