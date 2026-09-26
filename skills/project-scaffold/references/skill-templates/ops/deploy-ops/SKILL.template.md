---
name: deploy-ops
description: L3 部署域唯一入口——同时管辖部署说明书 docs/deployment/DEPLOYMENT.md、部署资产目录 docs/deployment/（结构由本 skill 的 deploy-assets.md §2 声明：配置模板 / 多环境 .env 与 compose / 发布脚本），以及部署执行与校验（环境确认、按发布流程发布、版本核对、回滚、部署配置校验）。触发词：部署文档、DEPLOYMENT、部署说明书、写部署、更新部署文档、部署、发布前端、发布后端、部署指定环境、启动指定环境、部署状态、发布版本、回滚部署、新增环境、部署单元、环境矩阵、环境拓扑、发布流程、回滚说明、部署脚本、部署配置、密钥登记、compose 登记。代码改动触发更新：部署方式 / 环境矩阵 / 部署参数变化、发布脚本 / compose / .env 结构调整、应用增减时，更新说明书与资产。
---

# deploy-ops — L3 部署域（说明书 + 部署资产 + 部署执行）

## 定位与管辖

本 skill 是 L3 部署域的唯一入口，同时管辖三类产物：

| 产物       | 路径                       | 性质 | 事实来源                                 |
|------------|----------------------------|------|------------------------------------------|
| 部署说明书 | `docs/deployment/DEPLOYMENT.md`    | 文档 | 项目事实（应用划分 / 技术栈 / 资产现状） |
| 部署资产   | `docs/deployment/`      | 资产 | 本 skill 生成与维护                      |
| 部署执行   | 按说明书发布 / 启动 / 回滚 | 动作 | `DEPLOYMENT.md` §4 与 §5.3               |

部署知识的 SSOT 是 `DEPLOYMENT.md`（环境矩阵 §2.1 / 各环境启动 §4 / 各环境发布流程 §5.3 / 密钥 §6 / 资产逐项说明
§7），执行时现场读文档照做，本 skill 不复制任何命令与环境信息。资产的预期集 SSOT 是
[deploy-assets.md](references/deploy-assets.md) §2，`DEPLOYMENT.md` §7 只是人类可读说明。

跨文档编排、生成顺序与漂移处理归 `align-docs` skill；测试期访问系统经 `tools-ops` skill，部署期的健康检查与冒烟验证属于系统访问约束的部署期豁免，由本
skill 执行。

本 skill 自带资料：

- 产物骨架 [assets/TEMPLATE.md](assets/TEMPLATE.md)——`DEPLOYMENT.md` 的目标结构
- 资产与多环境约定 [references/deploy-assets.md](references/deploy-assets.md)——部署资产结构、多环境 `.env` 目录与命名约定、新增环境步骤
- 发布流水线方法论 [references/release-mechanics.md](references/release-mechanics.md)——发布链机制（`releases/` +
  `current` 软链）、流水线、过期提示、校验清单
- 参考实现 [assets/reference-impl/](assets/reference-impl/)——可运行的发布脚本（`release-backend` / `release-frontend` /
  `rollback` + `lib/release-common`）+ compose + `.env.example`（配置区占位，按项目替换；占位符未替换即 fail-fast）

## 读取

- 编辑、重建说明书或生成资产前，先读本 skill 与 [assets/TEMPLATE.md](assets/TEMPLATE.md)，再列 `docs/deployment/`
  的实际目录树。
- 读取应用架构（`docs-application-architecture`）定位部署单元、技术架构（`docs-technology-architecture`）定位运行时与存储方式。
- 读取接口契约（`inbound-ops`）与外部集成（`outbound-ops`）确认上线入口、外部服务、密钥与回调。
- 读取目标文档、项目宪法和关联代码或配置，区分已落盘事实、待确认事项与部署资产现状。
- 执行部署前读 `DEPLOYMENT.md` §2.1 环境矩阵、§4 与 §5 中目标环境的小节、§6 密钥、§7 资产说明。
- 文档按 L1 → L2 → L3 生成，生成下层文档前先读上层产物；跨文档顺序与漂移清账由 `align-docs` skill 编排。
- 图使用 D2、Mermaid 或 ASCII 代码块直接写入 Markdown；容器式分层图遵循 `c4-container-diagram` skill，D2
  图保留图名、视角、用途与边界等自描述信息，正文和注释使用中文。

## 生成

### 说明书

1. 按 [assets/TEMPLATE.md](assets/TEMPLATE.md) 逐节写入项目事实，不在本 skill 另定结构。
2. 已有 `DEPLOYMENT.md` 时，提取仍然有效的业务值，按模板重建章节、表格、图和命令，删除过期结构与旧图。
3. 依据应用划分、技术栈、接口契约和部署资产现状填写真实内容；没有事实依据的值不臆造。
4. 部署形态或版本标识机制存在歧义时询问用户；其余无歧义事项自主完成。

### 部署资产（首次落地）

1. 读源：`DEPLOYMENT.md` §2.1 环境矩阵（环境清单）+ §5.3
   发布流程（脚本须实现的接口）+ [deploy-assets.md](references/deploy-assets.md) §2（资产结构 SSOT）。
2. 按环境创建目录与配置：逐环境建 `<env>/` 与 `<env>/.env.<env>`（由 `configs/.env.example` 复制，空值 / 占位）；compose 变量用
   `<env>/.env`（由 `configs/compose.env.example` 复制）；编排复制为 `<env>/docker-compose.<env>.yml`
   ；详见 [references/deploy-assets.md](references/deploy-assets.md)。
3. 复制脚本参考实现：从 `assets/reference-impl/` 复制 `release-backend.sh` / `release-frontend.sh` / `rollback.sh` 与
   `lib/release-common.sh` 到 `docs/deployment/`，替换配置区（主机走 `remote-shell` 别名或 `.env`）。
4. 回写登记：把新增资产按「生成 §1 说明书」重建 `DEPLOYMENT.md` §7（路径 / 归属 /
   生效机制）；结构变更同时改 [deploy-assets.md](references/deploy-assets.md) §2。
5. 走「校验」后报告：生成清单 + `.env` 待补项 + API 记录。

## 更新

1. 先读目标文档与 [assets/TEMPLATE.md](assets/TEMPLATE.md)，再读发生变化的关联文档和资产；只修改受影响内容，保留仍有效的当前态信息。
2. 应用增减或应用边界变化时，联动部署单元、环境说明与部署参数。
3. 技术栈、运行时或存储方式变化时，联动部署方式与运行形态。
4. 接口上线、外部服务、密钥或回调变化时，联动部署配置与验证入口。
5. 新增环境：补 `<env>/.env.<env>` + compose `.env`（由 configs 模板复制），同步 §1 环境总览 / §2.1 矩阵 / §3 部署单元。
6. 改发布流程：先改 `DEPLOYMENT.md` §5.3（接口 SSOT）→ 再改脚本实现匹配；两者必须一致。
7. 改 compose / 配置：改 `<env>/docker-compose.<env>.yml` 与 `configs/*.example`（键集 SSOT），真实 `.env` 键集与之对齐。
8. 确认 `TARGET_MODE`（`compose` = VM / 物理机有 Docker；`native` = 目标机是容器无 Docker，当前未实现）——形态由部署环境决定，勿硬套
   compose 流程。
9. 资产增删改后同步 `DEPLOYMENT.md` §7 登记；章节删除或迁移后同步重编号并清理旧引用。
10. 发现说明书与代码或配置不一致时，以实际代码和配置为准修正说明书。
11. 数据库迁移按项目实际工具执行：已应用 revision 不再改，默认值使用字面量，发布前本地先完成 `upgrade head`
    自测，发布顺序为覆盖代码、执行迁移、recreate 容器，迁移失败即中断。
12. 跨文档生成顺序、漂移扫描与一致性清账交 `align-docs` skill。

## 执行

执行分诊（进入执行的第一件事）：

| 分诊       | 触发                                                | 动作    |
|------------|-----------------------------------------------------|---------|
| 1 执行部署 | 部署 / 发布 / 启动指定环境 / 回滚 / 部署状态        | §1 执行 |
| 2 生成资产 | 项目无部署脚本 / compose，或首次落地部署资产        | §2 生成 |
| 3 维护资产 | 新增环境 / 改发布流程 / 改 compose / 同步 .env 键集 | §3 更新 |
| 4 校验     | 校验部署配置（只检不写、非破坏）                    | §4 校验 |

### §1 执行部署

1. 环境确认：读 `DEPLOYMENT.md` §2.1 环境矩阵，列出可用环境，问用户部署到哪个环境、范围（前端 / 后端 / 全部）——未确认前不执行任何部署动作。
2. commit 询问：问用户「先 commit 再部署」还是「不 commit 直接部署当前代码」；选先 commit 时，须用户显式授权后才执行 commit；选不
   commit 直接部署时，版本核对中 `BUILD_COMMIT` 与本地 HEAD 不一致属预期，报告中如实说明。
3. 执行：按 `DEPLOYMENT.md` 对应章节执行（发布走 §5.3 一条龙脚本，开发启动走 §4，环境名取 §2.1），AI 不手拼部署命令；回滚用
   `rollback.sh`（切 `current` 旧链节）。
4. 过期提示：部署脚本会检查历史产物（`current` 之外）Age，超 `RELEASE_RETENTION_DAYS`（默认 30
   天）即提示——向用户报告并询问是否清理（不自行删；用户确认才用 `--prune`）。
5. 报告：版本核对（`BUILD_COMMIT` 与本地 HEAD 对比）、健康检查结果、失败项（如有）。

### §4 校验（只检不写，非破坏）

- 脚本语法：`bash -n <script>`。
- compose 解析：`docker compose -f <file> config`（不启动）。
- 环境一致性：逐环境核对 `.env.<env>` 键集 = `configs/.env.example` 键集。
- 登记一致性：磁盘资产与 `DEPLOYMENT.md` §7 登记项一一对应（缺失 / 多余即报告）。
- 说明书一致性：部署单元数等于应用数、环境矩阵与实际 `.env.<env>` 目录一一对应、版本标识机制与发布流程一致。
- 报告：通过 / 未通过项 + 修复建议（生成走 §2 / 维护走 §3）；不执行真实发布（真实部署走 §1）。

## 完成判定

格式与结构纪律（正文无加粗与 emoji、无 SSOT 或单一事实源字样、无模板说明与未替换元变量、图为 D2 / Mermaid / ASCII
代码块而无位图、无治理套话与固定元信息、章节编号连续不跳号、相对链接可解析、跨文档章节引用无死链、标题层级与骨架 模板一致、不补写
frontmatter）见根 `AGENTS.md` §2.8，各文档不重复列出；以下为本文档专有判定，全部通过才算完成。

说明书侧：

- 应用部署单元与 `docs-application-architecture` 的应用划分一致，部署单元数等于应用数。
- 环境矩阵、环境拓扑、各环境启动与发布说明相互一致，每个应用的参数、配置文件和健康检查入口齐全；环境名称只使用环境矩阵中的名称，
  各环境的运行形态边界保持一致。
- 版本标识机制明确，采用 SemVer 或 `BUILD_COMMIT` 机制并与发布流程一致，发布流程可定位到实际脚本或命令，回滚方式在部署单元与操作说明中完整可追溯。

资产侧：

- `docs/deployment/` 的 compose、Dockerfile、nginx、脚本、配置文件和 `.env` 资产齐全，脚本可执行、compose 可解析。
- `configs/*.example` 与各环境真实 `.env` 键集一致（真实值可空）。
- 参考实现副本未被直接当作运行实例使用；占位值未替换即 fail-fast。

说明书与资产一致性：

- `docs/deployment/` 磁盘内容与 [deploy-assets.md](references/deploy-assets.md) §2
  预期资产集逐项对应：无缺失项，无预期外残留（残留即旧资产，提示用户确认后删）。
- `DEPLOYMENT.md` §7 的说明项与磁盘资产一一对应，无缺失说明、无多余说明。
- §5.3 描述的发布流程与实际脚本实现的接口一致；环境矩阵中的每个环境都有对应目录与 `.env`。
- 说明书引用的每条命令、每个脚本路径在资产目录中真实存在且可执行。
- 接口、集成、应用、配置的关联信息已完成一致性检查。

## 边界

- 部署命令 SSOT 在 `DEPLOYMENT.md` §5.3 与 §4，本 skill 不复制命令正文、不手拼部署命令。
- 部署脚本参考实现含占位值，不得直接运行 `assets/reference-impl/` 副本（非运行实例）。
- 环境名唯一词表 = `DEPLOYMENT.md` §2.1 的环境矩阵，不新建命名、不预设具体环境名；一次操作绑定一个环境。
- 环境 host 不写死，前端入口和测试连接参数通过工具配置或已登记的环境配置提供。
- 只写 `docs/deployment/DEPLOYMENT.md` 与 `docs/deployment/`；不修改应用业务代码。
- 文档只写项目当前事实；历史与决策原因归 Git 历史，不在正文中保留过期占位。
- 正文无 `SSOT`、单一事实源或唯一事实源字样，无加粗与 emoji，图均为可编辑文本。
- 不自动 commit 或 push；commit 只在 §1 执行时经用户显式授权。
