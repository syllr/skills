---
name: deploy-ops
description: 部署与运维——按 docs/L4/DEPLOYMENT.md 执行部署（环境确认、commit 询问、按发布流程执行、版本核对与报告），并生成/维护部署资产（部署脚本、compose、多环境 .env 结构）。触发词：部署、发布前端、发布后端、部署 dev、启动 standalone、部署状态、发布版本、回滚部署、新增环境、部署脚本、部署配置
license: UNLICENSED
metadata:
  audience: ai-deploy-operator
  rule-source: .omo/rules/docs/L4/DEPLOYMENT.md
  generated-by: doc-arch-rules
---

# deploy-ops — 部署与运维（执行 / 资产生成维护）

AI 是部署操作员与部署资产维护者：部署知识的 SSOT 是 `docs/L4/DEPLOYMENT.md`（环境矩阵 §2.1 / standalone 启动 §4 / dev 发布流程 §5.3 / 密钥 §6 / 部署配置文件详解 §7），执行时现场读文档照做，本 skill 不复制任何命令与环境信息。

本 skill 自带资料（模板，不直接运行）：

- 资产与多环境约定 [references/deploy-assets.md](references/deploy-assets.md)——部署资产结构、多环境 .env 目录与命名约定、新增环境步骤
- 发布流水线方法论 [references/release-mechanics.md](references/release-mechanics.md)——发布链机制（releases/ + current 软链）、流水线、过期提示、校验清单
- 参考实现 [assets/reference-impl/](assets/reference-impl/)——可运行的发布脚本（release-backend/frontend + rollback + lib/release-common）+ compose + .env.example（配置区占位，按项目替换；占位符未替换即 fail-fast）

## 分诊（进入第一件事）

| 分诊       | 触发                                                | 动作 |
| ---------- | --------------------------------------------------- | ---- |
| 1 执行部署 | 部署 / 发布 / 启动 standalone / 回滚 / 部署状态     | §1   |
| 2 生成资产 | 项目无部署脚本/compose，或首次落地部署资产          | §2   |
| 3 维护资产 | 新增环境 / 改发布流程 / 改 compose / 同步 .env 键集 | §3   |
| 4 校验     | 校验部署配置（只检不写、非破坏）                    | §4   |

## 1. 执行部署

1. 环境确认：读 DEPLOYMENT §2.1 环境矩阵，列出可用环境，问用户部署到哪个环境、范围（前端/后端/全部）——未确认前不执行任何部署动作
2. commit 询问：问用户「先 commit 再部署」还是「不 commit 直接部署当前代码」；选先 commit 时，须用户显式授权后才执行 commit；选不 commit 直接部署时，版本核对中 BUILD_COMMIT 与本地 HEAD 不一致属预期，报告中如实说明
3. 执行：按 DEPLOYMENT 对应章节执行（dev 发布走 §5.3 一条龙脚本，standalone 启动走 §4），AI 不手拼部署命令；回滚用 `rollback.sh`（切 current 旧链节）
4. 过期提示：部署脚本会检查历史产物（current 之外）Age，超 `RELEASE_RETENTION_DAYS`（默认 30 天）即提示——向用户报告并询问是否清理（不自行删；用户确认才用 `--prune`）
5. 报告：版本核对（BUILD_COMMIT 与本地 HEAD 对比）、健康检查结果、失败项（如有）

## 2. 生成部署资产（首次落地）

1. 读源：DEPLOYMENT §2.1 环境矩阵（环境清单）+ §5.3 发布流程（脚本须实现的接口）+ §7 目录结构约定
2. 按环境创建目录与配置：逐环境建 `<env>/` 与 `<env>/.env.<env>`（由 `configs/.env.example` 复制，空值/占位）；compose 变量用 `<env>/.env`（由 `configs/compose.env.example` 复制）；编排复制为 `<env>/docker-compose.<env>.yml`；详见 [references/deploy-assets.md](references/deploy-assets.md)
3. 复制脚本参考实现：从 `assets/reference-impl/` 复制 `release-backend.sh`/`release-frontend.sh`/`rollback.sh` 与 `lib/release-common.sh` 到 `docs/L4/deployment/`，替换配置区（主机走 remote-shell 别名或 `.env`，脚本不硬编码 host/凭据）
4. 回写登记：把新增资产登记进 DEPLOYMENT §7（路径/归属/生效机制）；若文档结构不符，交 DEPLOYMENT rule 更新，本 skill 不手改 doc 正文
5. 校验（见 §4）后报告：生成清单 + `.env` 待补凭据项（取值来源见 §6）+ API 记录

## 3. 维护部署资产

1. 新增环境：按 DEPLOYMENT §2.1 补 `<env>/.env.<env>` + compose `.env`（由 configs 模板复制）；同步 §1 环境总览/§2.1 矩阵/§3 部署单元（经 DEPLOYMENT rule）
2. 改发布流程：先改 DEPLOYMENT §5.3（接口 SSOT）→ 再改脚本实现匹配；两者一致（本 skill 不复制流程正文）
3. 改 compose/配置：改 `dev/docker-compose.*.yml` 与 `configs/*.example`（键集 SSOT）；真实 `.env` 键集与之对齐
4. 键集对账：`configs/*.example` 与各环境真实 `.env` 键集应一致（真实值可空）；不一致即修
5. 目标机形态：确认 `TARGET_MODE`（`compose`=VM/物理机有 Docker；`native`=目标机是容器无 Docker，当前未实现）——形态由部署环境决定，勿硬套 compose 流程
6. 回写登记：资产增删改同步 DEPLOYMENT §7

## 4. 校验（只检不写，非破坏）

- 脚本语法：`bash -n <script>`
- compose 解析：`docker compose -f <file> config`（不启动）
- 环境一致性：逐环境核对 `.env.<env>` 键集 = `configs/.env.example` 键集
- 登记一致性：磁盘资产与 DEPLOYMENT §7 登记项一一对应（缺失/多余即报告）
- 报告：通过/未通过项 + 修复建议（生成走 §2 / 维护走 §3）；不执行真实发布（真实部署走 §1）

## 边界与纪律

- 部署命令 SSOT 在 DEPLOYMENT §5.3/§4；本 skill 不复制命令正文、不手拼部署命令
- 部署脚本参考实现含占位值，不得直接运行 `assets/reference-impl/` 副本（非运行实例）
- 参考实现与文档不写真实主机/凭据（主机走 remote-shell 别名或 `.env`，凭据取值来源登记 DEPLOYMENT §6）
- 密钥纪律：生成的 `.env` 只放空值/占位，不代填凭据；`.env`/`.env.*` 不入库，仅 `*.example` 入库
- 环境名唯一词表 = DEPLOYMENT §2.1（standalone/dev/prod），不新建命名
- 只写 `docs/L4/deployment/` 与回写 §7；不修改应用业务代码；不自动 commit/push
