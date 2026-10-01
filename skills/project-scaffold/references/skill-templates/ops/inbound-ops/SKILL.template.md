---
name: inbound-ops
description: L3 Inbound 契约域唯一入口——同时管辖接口契约说明书 docs/contracts/INBOUND.md、由代码导出的机器可读契约 docs/contracts/openapi/，以及契约导出执行（探测语言框架、落地导出与拆分脚本、导出到临时目录、拆分、机检、门禁落盘）。触发词：写 INBOUND.md、生成接口文档、更新接口文档、接口契约文档、对外接口说明、Inbound 接口、接口变更、接口漂移、导出 openapi、重导出契约、契约校验、openapi 校验、端点计数、契约目录守卫。代码改动触发更新：后端路由 / 端点增删改、请求响应 Schema / DTO 字段变化、状态码 / 错误码 / 校验变化、鉴权或协议变化、x-action 等扩展元数据变化时，先改代码再重导出 openapi 并同步说明书。
---

# inbound-ops — L3 Inbound 契约域（说明书 + 机器可读契约 + 导出执行）

## 定位与管辖文档

本 skill 是 L3 Inbound 契约域的唯一入口，同时管辖三类产物：

| 产物           | 路径                 | 性质 | 事实来源                      |
|----------------|----------------------|------|-------------------------------|
| 接口契约说明书 | `docs/contracts/INBOUND.md` | 文档 | 代码事实 + 导出产物的实际结构 |
| 机器可读契约   | `docs/contracts/openapi/`   | 资产 | 代码（导出，禁手写）          |
| 契约导出执行   | 临时目录 → 门禁落盘  | 动作 | `INBOUND.md` §2 的导出命令    |

Outbound 半边（`docs/contracts/OUTBOUND.md` 与 `docs/contracts/outbound-contracts/`）归 `outbound-ops` skill；跨文档编排、漂移清账与旧文档处置归
`align-docs` skill。

本 skill 自带资料：

- 产物骨架 [assets/TEMPLATE.md](assets/TEMPLATE.md)——`INBOUND.md` 的目标结构（`openapi/` 目录结构不在此，见下）
- 契约资产声明 [references/contract-assets.md](references/contract-assets.md)——`openapi/` 预期资产集的唯一来源，含落盘规则与旧资产检出
- 引导映射 [references/bootstrap.md](references/bootstrap.md)——各语言框架的导出形态（CLI 一行 / 需脚本）
- 执行方法论 [references/export-mechanics.md](references/export-mechanics.md)——临时目录策略、门禁落盘、拆分口径、机检清单、失败分诊
- 参考实现 [assets/reference-impl/](assets/reference-impl/)——导出与拆分脚本模板（按框架分），引导时复制到项目

## 读取

- 先读项目宪法和已落盘文档，按 `L1 → L2 → L3` 的顺序确认上下文。
- 读取 L1 业务文档的能力、Action 与状态（`docs-business`），L2 应用架构的接口归属（`docs-application-architecture`
  ）、领域操作与事件 （`docs-domain`）、外部数据结论（`docs-data-architecture`）。
- 扫描后端代码、路由、请求 / 响应 Schema、DTO 与技术栈文件（`package.json`、`go.mod`、`pom.xml`、`pyproject.toml`、
  `requirements.txt`）。
- 读取现有 `INBOUND.md` 与 `docs/contracts/openapi/`；已有产物只提取仍有效的信息。
- 导出前先读 `INBOUND.md` §2（导出命令 SSOT）与 §4 步骤 5（CI 漂移检测命令）；产物结构与端点计数口径读
  [contract-assets.md](references/contract-assets.md) §1，不以 `INBOUND.md` §1 为准。
- 需要判断跨层漂移时交 `align-docs` skill。

## 生成与更新

生成与更新走同一条流程：先读模板，再扫目标位置判断有无既有文档或同定位的旧产物，有则更新、无则新建。

1. 读 [assets/TEMPLATE.md](assets/TEMPLATE.md)，选择目标产物对应的骨架。
2. 扫描目标位置（`docs/contracts/INBOUND.md` 与 `docs/contracts/openapi/`），判断有无既有说明书、导出产物或同定位的旧产物。
3. 无既有产物：探测代码与语言框架；契约以代码中的路由、请求 / 响应 Schema 和 DTO
   为依据，不能脱离代码凭空手写；无后端代码时先与用户确定接口定义，在代码中建立路由与请求 / 响应 Schema，再导出。
4. 有既有产物：读现有说明书与导出产物，提取仍有效的信息，再按模板重建目标结构；旧版内联的接口清单、字段表、错误码表移出说明书，字段级内容只保留在
   `openapi/` 产物中。
5. 按模板写 `INBOUND.md`，只写导出产物结构、导出命令、维护规范、CI pipeline、协议支持表与端点计数，不复制字段、校验与错误码；写入后删除模板中的
   HTML 生成提示注释。
6. 代码中的路由、Schema、校验、错误码或扩展元数据变化时，先改代码，再走「执行
   §2」重新导出、拆分、校验、落盘，最后回写说明书；同步说明书的导出产物结构、导出命令、维护规范、CI pipeline、协议支持表与端点计数；不手工编辑
   `openapi/` 文件。
7. 项目无导出脚本或 `INBOUND.md` §2 缺命令时走「执行 §1 引导」；`openapi/` 产物由「执行 §2 导出」产出。
8. 删除或迁移接口时同步清理代码、导出产物、引用与计数，检查悬空引用与残留 Stub。
9. 协议超出默认范围、接口定义有歧义或项目无后端代码时询问用户；领域 Action、业务能力、应用边界、接口上线与部署配置变化时的跨
   skill 同步见「联动」。

## 执行

导出分诊（进入执行的第一件事）：

| 分诊             | 触发                                                              | 动作    |
|------------------|-------------------------------------------------------------------|---------|
| 1 引导           | 项目无导出脚本，或 `INBOUND.md` §2 无导出命令，或首次接入         | §1 引导 |
| 2 导出（主路径） | 导出契约 / 重导出 openapi / 契约同步 / 更新 openapi / 生成 schema | §2 导出 |
| 3 机检           | 校验契约 / 契约一致性（只检不写）                                 | §3 机检 |

### §1 引导（让导出路径成立）

1. 探测语言框架：扫后端代码与技术栈文件，按 [references/bootstrap.md](references/bootstrap.md) 判定形态（CLI 一行 / 需脚本）。
2. 按框架从 `assets/reference-impl/` 复制对应脚本到项目约定位置（如 FastAPI `backend/scripts/export_openapi.py`）；CLI
   类框架无需脚本，跳过本步。
3. 把导出命令与产物路径写入 `INBOUND.md` §2 对应框架小节——命令以说明书为 SSOT，本 skill 的导出步骤只读它，不另存命令文本。
4. 试跑导出（按 §2 步骤 3 的临时目录策略）——代码未 instrument 时导出会缺 operationId / x-action，属预期，报告缺口。
5. 报告：框架 / 落地脚本 / `INBOUND.md` §2 待回写项 / 代码 instrument 缺口（tags、operationId、x-action、x-capability）。

### §2 导出（主路径）

1. 读源：`INBOUND.md` §2（导出命令 SSOT）+ §4 步骤 5（CI
   漂移检测命令，与本地共用同一入口）+ [contract-assets.md](references/contract-assets.md) §1（多文件口径）；确认项目导出与拆分脚本存在——不存在走
   §1 引导。
2. 环境确认：导出若依赖 DB / Redis / env，确认其可用；命令缺失或多文件口径未定时问用户（其余不问）。
3. 导出到临时目录（不直接落 `docs/`）：执行 §2 命令 → 临时文件（如 `/tmp/openapi-export.json`）。
4. 拆分：按 [contract-assets.md](references/contract-assets.md) §1 口径跑拆分脚本 → 临时目录产出
   `openapi.yaml + paths/<domain>.yaml + components/*`。
5. 机检（按 [references/export-mechanics.md](references/export-mechanics.md) 清单）：`$ref`
   完整性（无悬空）、端点计数三方一致（`openapi.yaml` 尾注释 = `INBOUND.md` §1 计数字段 = `paths/` 文件头汇总）、每个
   operation 有
   `x-action` / `x-capability`、`servers`
   变量化、组织正确（`openapi.yaml` 只承载元信息与 `$ref`）；工具可用时跑 lint / spectral。
6. 门禁落盘：与现有契约 diff——若检出语义丢失（手写 `x-action`、描述、依据注释）或代码未 instrument 导致缺口，停止并报告，不覆盖；否则落盘到
   `docs/contracts/openapi/`。
7. 报告：变化摘要 + 端点计数差异 + 与 [contract-assets.md](references/contract-assets.md) §1 预期资产集的逐项核对结论（缺失项、待删旧资产）+
   未通过项。

### §3 机检（只检不写）

按 §2 步骤 5 的清单执行，输出通过 / 未通过项；检出问题只报告并建议（走 §1 引导 / §2 重导出 / 交 `align-docs` 记录漂移），不修改契约。

## 联动

- 领域 Action、业务能力与应用边界变化时，联动 `docs-domain`、`docs-business`、`docs-application-architecture`。
- 接口上线、部署配置或环境变化时，联动 `deploy-ops`。
- Outbound 半边（`docs/contracts/OUTBOUND.md` 与 `docs/contracts/outbound-contracts/`）归 `outbound-ops` skill。
- 跨文档漂移的检测、分诊与清账归 `align-docs` skill，本 skill 只做「按代码重生成」的执行。

## 完成判定

格式与结构纪律（正文无加粗与 emoji、无 SSOT 或单一事实源字样、无模板说明与未替换元变量、图为 D2 / Mermaid / ASCII
代码块而无位图、无治理套话与固定元信息、章节编号连续不跳号、相对链接可解析、跨文档章节引用无死链、标题层级与骨架模板一致、不补写
frontmatter）见根 `AGENTS.md` §2.8，各文档不重复列出；以下为本文档专有判定，全部通过才算完成。

说明书侧：

- 协议支持表包含默认 HTTP / REST，并保留其他协议的占位或已启用规范。
- `INBOUND.md` 只保留选定语言框架的导出命令，包含完整五步 CI 防漂移 pipeline。
- 说明书没有接口字段表、Action 映射表、能力映射表或接口清单表的重复内容；接口按 endpoint 标识。
- 每个接口可追溯到业务文档能力并覆盖领域 Action；待规划能力没有端点。

资产侧：

- 契约由代码导出，接口定义、字段、校验和错误码与 `openapi/` 产物一致。
- `openapi/` 无手工编辑痕迹，端点计数三方一致（`INBOUND.md` §1 计数字段 = `paths/` 文件头汇总 = 导出结果），无悬空 `$ref`、残留
  Stub 或删除端点。
- 重新导出后产物与代码无差异，删除端点已从代码和产物中移除。

说明书与资产一致性：

- `openapi/` 磁盘内容与 [contract-assets.md](references/contract-assets.md) §1 预期资产集逐项对应：无缺失项，代码中已不存在的域无残留文件。
- §2 的导出命令与 §4 步骤 5 的漂移检测命令是同一条入口；命令改动后两侧同步。
- 导出命令在说明书与实际执行环境中都能跑通，任一侧失效即视为未完成。

## 边界

- 代码是接口契约的事实来源，禁止先手写 YAML 再由 YAML 生成代码。
- `openapi/` 一律由导出与拆分脚本产生，禁止手工编辑；一切写入经导出流程。
- 门禁落盘不可省：它是防止首次导出静默抹掉手写契约语义的唯一机制。
- `INBOUND.md` 不手抄字段、校验或错误码；字段级契约只查 `openapi/`。
- 待规划能力不建路由、不留 tag、paths 或 Stub；接口按方法与路径标识，不使用顺序编号。
- 导出命令 SSOT 在 `INBOUND.md` §2，references 不复制命令文本（跨项目通用）。
- 契约漂移的检测、分诊与清账归 `align-docs` skill，本 skill 只做「按代码重生成」的执行。
- 不管理 Outbound 契约（归 `outbound-ops`），不生成客户端代码，不修改业务代码，不自动 commit 或 push。
- 正文不使用加粗或 emoji。
