# 部署资产声明（deploy-assets）

本文件是 `docs/deployment/` 预期资产的唯一来源：目录结构、文件命名与旧资产检出都在这里定义。 命令与流程正文见项目
`docs/deployment/DEPLOYMENT.md`（§5.3 发布流程 / §7 部署资产说明），`DEPLOYMENT.md` §7 只做人类可读的 逐项说明，不作为资产齐全性的判定依据。

## 1. 环境词表（唯一来源）

环境名以 DEPLOYMENT §2.1 环境矩阵为准（如 standalone / dev / prod），目录、`.env` 文件名、compose 服务名一律沿用，不新建命名。

## 2. 预期资产集（唯一来源）

```
docs/deployment/
├── configs/                       # 配置模板（不参与运行）
│   ├── .env.example               # 后端/应用基础变量模板（键集 SSOT）
│   └── compose.env.example        # compose 层变量模板（${VAR} 替换）
├── <env>/                         # 每环境一目录，环境名 = §2.1
│   ├── .env.<env>                 # 应用运行配置（进容器/进程，应用直读）
│   ├── .env                       # compose 变量替换（docker compose 自动读，仅部署机存在）
│   └── docker-compose.<env>.yml   # 应用编排（环境名入文件名）
├── lib/release-common.sh          # 发布链共享函数（配置校验/release 目录/current 切换/过期检查/审计）
├── release-frontend.sh            # 发布脚本（前端）
├── release-backend.sh             # 发布脚本（后端）
├── rollback.sh                    # 回滚脚本（切回旧链节）
└── <中间件收编副本>/              # 如 ragflow/：第三方编排副本，单列，不纳入应用多环境约定
```

目标机运行时目录（发布脚本在目标机构建，非本仓资产）：

```
<DEPLOY_ROOT>/
├── releases/<YYYYMMDD-HHMMSS>-<short-sha>/   发布链（每个发布一目录，时间有序）
├── current -> releases/<...>                 现役软链（原子切换；compose 挂载点）
└── releases.log                              审计日志
```

## 3. 多环境变量约定

- 应用运行配置：`<env>/.env.<env>`（读方 = 应用；如 settings.py 直读或 compose env_file）
- compose 变量替换：`<env>/.env`（读方 = docker compose；只做 `${VAR}` 替换，不进应用）
- 配置模板：`configs/*.example`（永不参与运行；是键集 SSOT）
- 中间件副本：`<中间件>/` 下的 `.env` 属被收编的第三方编排，单列登记，不套用上述命名
- 目标机形态：`TARGET_MODE`（`compose` 默认 / `native` 预留）属部署环境变量，登记在部署机 `.env`——形态由环境固有能力决定，不由每次发布临时选择；
  `native`（目标机是容器、无 Docker daemon）当前未实现

| 维度       | `.env.<env>`   | `.env`（compose） | `*.example` |
|------------|----------------|-------------------|-------------|
| 读方       | 应用/进程/容器 | docker compose    | 无（模板）  |
| 是否进应用 | 是             | 否                | 否          |
| 作用       | 应用运行参数   | `${VAR}` 替换     | 键集基准    |

### 2.1 旧资产检出

每次环境变更或对齐时逐项核对磁盘与第 2 节的预期资产集：

- 预期有而磁盘无：环境目录、`.env`、compose 或脚本缺失，按 §4 生成动作补齐。
- 磁盘有而预期无：旧资产，提示用户确认后删除。判断依据是 `DEPLOYMENT.md` §2.1 环境矩阵与 §3.1 部署单元表里已不存在的
  环境或单元，不因为「`DEPLOYMENT.md` §7 还列着它」而保留。
- 环境删除：`<环境>/` 整目录删除，`DEPLOYMENT.md` §2.1 矩阵行、§4 / §5 对应小节、§7 说明项同步清行。
- 编排副本收编状态变化：`<中间件收编副本>/` 按当前是否仍由本仓编排决定去留，不长期空挂。
- 键集漂移：`configs/*.example` 与各环境真实 `.env` 的键集必须一致，多出的键与缺失的键都要报出来。

## 4. 生成动作（分诊 2）

1. 由 `configs/.env.example` 复制出各环境 `<env>/.env.<env>`
2. 由 `configs/compose.env.example` 复制出 `<env>/.env`（部署机用，如端口/版本标识/密钥覆盖）
3. 从 `assets/reference-impl/` 复制 `release-*.sh`、`rollback.sh`、`lib/release-common.sh`、compose 到
   `docs/deployment/`
4. 逐项登记进 DEPLOYMENT §7

## 5. 维护动作（分诊 3）

- 新增环境：建 `<env>/` + 两份 `.env`（复制模板）+ 同步 §1 环境总览 / §2.1 矩阵 / §3 部署单元（按 `deploy-ops` skill）
- 新增变量：改 `configs/*.example`（键集）+ 各环境 `.env.<env>` 对齐 + 登记 §6
- 脚本与流程一致性：改 DEPLOYMENT §5.3 后同步脚本实现（反之亦然）
- 回滚与过期：回滚用 `rollback.sh`（切 current 旧链节）；历史产物超 `RELEASE_RETENTION_DAYS`（默认 30）天提示，`--prune` 才清理（豁免
  current 现役版本）

## 6. 纪律

- 环境名一律来自 §2.1；配置模板是键集 SSOT，真实 `.env` 键集与之对齐
