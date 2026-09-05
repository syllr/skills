---
title: DEPLOYMENT — 部署与发布
doc_type: template
layer: L4
description: L4 交付层 文档 DEPLOYMENT 的更新规范——修改 docs/L4/DEPLOYMENT.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L4/DEPLOYMENT.md"
  - "docs/L4/deployment/README.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - D2 部署容器图（§2.2 环境拓扑，图规范见 references/diagram-spec.md，C4 容器图按环境分区）
  related: # 关联模板与联动修改
    APPLICATION-ARCHITECTURE: 部署单元见它 §2.2，应用增减需同步部署
    TECHNOLOGY-ARCHITECTURE: 技术栈影响部署，选型变化需同步部署方式
    API: 接口上线需同步部署
    INTEGRATION: 外部服务密钥/回调需同步部署配置
    SECURITY: 密钥分层与注入规范见它 §6，本文 §6 集中登记见 §6
    CONSTITUTION: 文档分层/规则基准见宪法；版本标识与资产登记见本文件 §5/§7（宪法不重复）
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 部署形态（私有化单机/云开发/容器编排）有分歧时 → 问用户
    - 版本标识机制（SemVer vs BUILD_COMMIT）有分歧时 → 问用户
  flow: # 生成流程
    - 扫描（自主）：读应用清单 + 技术栈 + 目标文档 + docs/L4/deployment/ 目录现状（资产登记在本文档 §7）
    - 已有 DEPLOYMENT → 保留 §1/§3/§5 的业务值（部署形态/单元/命令；版本发布记录如启用一并保留），丢弃旧结构/旧图，按本模板重建结构与 D2 图
    - 按模板生成：§1 部署概述（含环境总览与唯一依赖）→ §2 环境（矩阵+拓扑）→ §3 部署单元与依赖服务 → §4 standalone 开发启动（进程直跑，按需）→ §5 dev 发布部署（全容器，按需）→ §6 密钥 → §7 部署配置文件详解（资产登记）
  notes: # 生成注意点（怎么生成）
    - 运维手册定位（非架构设计）：部署脚本/步骤/参数/环境
    - 部署单元来自 APPLICATION-ARCHITECTURE 应用划分图（引用不复制）
    - 按环境分章：§4 = standalone 环境开发启动（进程直跑）与 §5 = dev 环境产物化发布（全容器）二选一或并存——双形态项目（本地进程 vs 容器）按此分章，单一形态项目可合并为单一操作手册；standalone 与 dev 的差别只在运行形态，依赖完全相同（都连同一依赖编排组）时在 §1 明确声明
    - 版本标识二选一：SemVer 版本发布记录（按需，见 §7）或 BUILD_COMMIT 机制（git HEAD 写入容器 env，容器名即版本，见 §5）——未启用 SemVer 时裁剪 §7 版本记录节，版本标识在 §5 说明
    - 密钥管理：集中登记见 §6，不落日志、不落前端包；载体二选一——有密钥管理服务用注入，无则按团队约定集中登记于 §6（明文值见 §6，*.example 恒占位）
    - 每应用按环境说明部署参数与配置文件（参数/环境变量/配置文件路径按环境差异列清）；运行形态双列（standalone/dev）优于单列部署方式
    - 纳管部署资产：启动脚本/配置文件（compose/Dockerfile/nginx/config/scripts/.env 等）集中登记于本文档 §7（部署配置文件详解：路径 + 归属 + 生效机制合一，文件本体不移动，§7 即登记处）；§5.3 快速入口引用 §7，不另设 deployment/README.md 顶层清单
  checks: # 生成后反向 check
    - "部署单元与 APPLICATION-ARCHITECTURE 应用划分一致"
    - "部署单元数 == APPLICATION-ARCHITECTURE §2.2 应用数"
    - "每个应用都有分环境部署说明且参数/配置文件齐全"
    - "版本标识机制已明确（SemVer 见 §7 或 BUILD_COMMIT 见 §5，二选一不遗漏）"
    - "密钥未出现在任何示例/配置模板（*.example 恒占位，不落日志、不落前端包）"
    - "部署资产（compose/Dockerfile/nginx/scripts/.env）增删改已同步登记本文档 §7（可按目录树定位）"
---

# DEPLOYMENT — 部署与发布

> 本文档是「<项目名>」的 **DEPLOYMENT（部署与发布模板）**——L4 交付层的部署与发布文档（运维手册）。
> 【模板使用指引】复制为 `docs/L4/DEPLOYMENT.md`，按各章节指引填写；§7 版本发布记录为按需节（未启用时裁剪，版本标识见 §5 的 BUILD_COMMIT 机制）。
> 【原则】① **运维手册定位**（非架构设计）：部署脚本、部署步骤、部署参数、环境配置——回答"怎么部署上线、怎么运维"；② 部署单元来自 APPLICATION-ARCHITECTURE 应用划分图；③ **按环境分章**：§4 = standalone 开发启动（进程直跑）/ §5 = dev 发布部署（全容器）——双形态依赖相同时在 §1 声明；④ 密钥管理：集中登记见 §6，不落日志、不落前端包；⑤ 图用 **D2 部署容器图**（C4，按环境分区，图规范见 references/diagram-spec.md）。

---

## 1. 部署概述

### 1.1 部署形态与环境

> 【指引】先给环境总览表（环境/用途/运行形态/状态），再补 parity 与唯一依赖声明。私有化单机用"官方基准镜像+产物挂载（不构建自制镜像）"示例，云/K8s 项目改对应形态。双形态（standalone 进程直跑 vs dev 全容器）依赖相同时在此明确"差别只在运行形态，依赖完全相同"。

- 部署形态：<私有化单机 / 云开发 / 容器编排 / 混合>
- 部署方式：<如 官方基准镜像（python:3.11-slim / nginx）+ 产物挂载运行（不构建自制镜像）；或 容器镜像构建 + K8s 部署>

**环境**

| 环境       | 用途                           | 运行形态                                   | 状态       |
| ---------- | ------------------------------ | ------------------------------------------ | ---------- |
| standalone | 开发自测、联调（快速迭代）     | 进程直跑：<如 Vite dev + uvicorn>（§4）    | <已启用>   |
| dev        | 集成验证、发布前回归（兼预发） | 全容器：<如 产物上传 + 官方镜像挂载>（§5） | <已启用>   |
| prod       | 线上真实流量                   | <如 全容器与 dev 同 compose、同产物流程>   | <暂未启用> |

- **环境一致性（parity）**：<如 dev 运行形态与生产完全一致——同一 compose、同一产物发布流程，差异只有配置与数据>
- 依赖：<如 唯一依赖 = 本项目自建 <编排组>（独立 compose 运行于 <机器>，见 §3.1）。standalone 与 dev 都连它>
- 不部署：<如 外部大模型 API（云）/ SMTP（mock）>
- 待澄清：<如 服务器资源规格未定（见 §5.5）>

### 1.2 术语表

| 术语         | 含义                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| standalone   | 开发者本地环境（进程直跑形态，环境名即运行形态）                       |
| dev          | 集成验证/预发机（<如 192.168.1.225，全容器产物化发布>）                |
| 运行形态     | 环境内应用怎么跑（standalone=进程直跑 / dev=全容器官方镜像+产物挂载）  |
| 产物         | 开发者本地编译/打包后上传的运行物（前端 dist / 后端代码包 / 依赖产物） |
| 编排组       | <如 本项目自建 RAGFlow docker compose 组（含业务所需 mysql/es/minio）> |
| BUILD_COMMIT | 发布版本标识（容器 env，取开发者本地 git HEAD，容器名即版本）          |

---

## 2. 环境

### 2.1 环境矩阵

> 【指引】列按需裁剪：私有化/单人项目可删"版本/分支""负责人"列，增加"运行形态"列；版本不按分支管理时用 BUILD_COMMIT 机制说明。双形态项目"依赖（数据源）"列指向同一编排组。行数按实际环境增删，至少保留 2 行；§4/§5 须按本节实际环境行展开。

| 环境                         | 用途                           | 入口                               | 配置来源                                                                                           | 依赖（数据源）                                 | 运行形态                                |
| ---------------------------- | ------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------- |
| **standalone（开发者本地）** | 开发自测、联调                 | <如 http://localhost:5173 / :8000> | <如 后端：docs/L4/deployment/standalone/.env.standalone（settings.py 直读）>                       | <如 dev 机 <IP> 编排组（mysql/ragflow）>       | 进程直跑：<如 uvicorn + Vite dev>（§4） |
| **dev（<机器>）**            | 功能验证、集成联调、发布前回归 | <如 http://<IP>:8080 / :8000>      | <如 backend：dev/.env.dev（env_file）；compose 变量：dev/.env（模板 configs/compose.env.example）> | <如 同机编排组（audit_hub 库 / ragflow:9380）> | 全容器：官方镜像 + 产物挂载（§5）       |

### 2.2 环境拓扑

> 【指引】本图为 **C4 部署容器图**（D2，按环境分区，图规范见 references/diagram-spec.md）。用户 → 各环境应用 → 数据与外部依赖分区；外部依赖归组"外部服务"边界，与平台边界单线相连。节点与连线必须与 §3 单元清单一一对应，环境分区与 §2.1 矩阵一致。

```d2
# 部署拓扑图（按环境分区 · C4 容器图）
vars: { d2-config: { layout-engine: elk } }

部署拓扑: {
  grid-rows: 1
  grid-columns: 1
  grid-gap: 24
  width: 1524
  style.fill: "#ffffff"
  style.font-color: "#1e293b"
  style.stroke: "#94a3b8"
  style.stroke-width: 1
  style.border-radius: 16

  用户: {
    label: "用户\n浏览器访问前端"
    width: 1500
    height: 50
    style.fill: "#f8fafc"
    style.font-color: "#1e293b"
    style.stroke: "#94a3b8"
    style.stroke-width: 1
    style.border-radius: 12
  }

  平台: {
    label: "<项目名>（环境分区）"
    width: 1500
    grid-columns: 2
    grid-gap: 12
    style.fill: "#ffffff"
    style.font-color: "#1e293b"
    style.stroke: "#64748b"
    style.stroke-width: 1
    style.border-radius: 12

    standalone: {
      label: "standalone（开发者本地）\n<进程直跑说明>"
      width: 732
      grid-columns: 1
      grid-gap: 8
      style.fill: "#dbeafe"
      style.font-color: "#1e293b"
      style.stroke: "#2563eb"
      style.stroke-width: 2
      style.border-radius: 12

      前端: { label: "前端 <Vite dev>\n<端口>"; width: 708; height: 50; class: mod }
      后端: { label: "后端 <uvicorn>\n<端口>"; width: 708; height: 50; class: mod }
      数据依赖: {
        label: "依赖：<如 dev 机 编排组>"
        width: 708
        grid-columns: 3
        grid-gap: 8
        style.fill: "#e0f2fe"
        style.font-color: "#1e293b"
        style.stroke: "#0284c7"
        style.stroke-width: 1
        style.border-radius: 8

        mysql: { label: "MySQL"; shape: stored_data; width: 222; height: 72; class: mod }
        ragflow: { label: "RAGFlow"; shape: stored_data; width: 222; height: 72; class: mod }
      }
    }

    dev: {
      label: "dev（<机器> 全容器）\n<官方镜像+产物挂载>"
      width: 732
      grid-columns: 1
      grid-gap: 8
      style.fill: "#dbeafe"
      style.font-color: "#1e293b"
      style.stroke: "#2563eb"
      style.stroke-width: 2
      style.border-radius: 12

      前端: { label: "前端 Nginx\n<dist 挂载>"; width: 708; height: 50; class: mod }
      后端: { label: "后端 Python\n<依赖产物+代码挂载>"; width: 708; height: 50; class: mod }
      数据依赖: {
        label: "依赖（编排组，独立 compose）"
        width: 708
        grid-columns: 3
        grid-gap: 8
        style.fill: "#e0f2fe"
        style.font-color: "#1e293b"
        style.stroke: "#0284c7"
        style.stroke-width: 1
        style.border-radius: 8

        mysql: { label: "MySQL"; shape: stored_data; width: 222; height: 72; class: mod }
        ragflow: { label: "RAGFlow"; shape: stored_data; width: 222; height: 72; class: mod }
      }
    }
  }

  外部服务: {
    label: "外部服务"
    width: 1500
    grid-columns: 2
    grid-gap: 12
    style.fill: "#e2e8f0"
    style.font-color: "#1e293b"
    style.stroke: "#64748b"
    style.stroke-width: 1
    style.border-radius: 12

    llm: { label: "大模型 API"; width: 732; height: 70; class: mod }
    datasource: { label: "业务数据源"; width: 732; height: 70; class: mod }
  }
}

部署拓扑.用户 -> 部署拓扑.平台.standalone.前端: 访问 { style.stroke: "#94a3b8" }
部署拓扑.用户 -> 部署拓扑.平台.dev.前端: 访问 { style.stroke: "#94a3b8" }
部署拓扑.平台.standalone.前端 -> 部署拓扑.平台.standalone.后端: HTTP { style.stroke: "#7c3aed" }
部署拓扑.平台.dev.前端 -> 部署拓扑.平台.dev.后端: /api 反代 { style.stroke: "#7c3aed" }
部署拓扑.平台.standalone.后端 -> 部署拓扑.平台.standalone.数据依赖: 读写 { style.stroke: "#0e7490" }
部署拓扑.平台.dev.后端 -> 部署拓扑.平台.dev.数据依赖: 读写 { style.stroke: "#0e7490" }
部署拓扑.平台 -> 部署拓扑.外部服务: 各环境后端出站调用 { style.stroke: "#64748b" }

classes: {
  mod: {
    style: {
      border-radius: 6
      fill: "#ffffff"
      stroke: "#64748b"
      stroke-width: 1
      font-size: 12
      font-color: "#1e293b"
    }
  }
}
```

---

## 3. 部署单元与依赖服务

> 【指引】部署单元 = APPLICATION-ARCHITECTURE §2.2 应用划分图的容器化落地；按环境区分运行形态（standalone/dev 双列），启动顺序用 compose depends_on 声明式解决则不手写。依赖服务单列 §3.1（唯一依赖编排组时强调"standalone 与 dev 都连它"）。

### 3.0 部署单元

| 单元             | 类型 | standalone 运行形态                                  | dev 运行形态                                              | 健康检查      | 回滚                     |
| ---------------- | ---- | ---------------------------------------------------- | --------------------------------------------------------- | ------------- | ------------------------ |
| <如 前端应用>    | 前端 | <如 Vite dev server（:5173）>                        | <如 官方 nginx:1.25-alpine + dist 挂载（:8080）>          | <如 页面冒烟> | <如 回退 dist 版本>      |
| <如 Python 后端> | 服务 | <如 uvicorn 直跑（:8000，配置直读 standalone/.env）> | <如 官方 python:3.11-slim + 依赖产物 + 代码挂载（:8000）> | <如 /healthz> | <如 回退产物后 recreate> |
| （补充）         |      |                                                      |                                                           |               |                          |

> **（补充）行**：每新增一个部署单元复制一行并填全 6 列（单元数须等于 APPLICATION-ARCHITECTURE §2.2 应用数）；无补充则删去此行。启动顺序由 compose `depends_on: service_healthy` 声明，不手写。

### 3.1 依赖服务

> 【指引】唯一依赖编排组时强调"standalone 与 dev 都连它"，列出被谁依赖与健康检查。

| 依赖服务                          | 类型   | 部署方式                                                                 | 被谁依赖  | 健康检查                 | 回滚              |
| --------------------------------- | ------ | ------------------------------------------------------------------------ | --------- | ------------------------ | ----------------- |
| <如 RAGFlow（含 mysql/es/minio）> | 中间件 | <如 独立 compose 运行于 <机器>（收编副本 dev/ragflow/）；业务库在 MySQL> | <如 后端> | <如 检索接口/业务库连通> | <如 编排容器重启> |
| （补充）                          |        |                                                                          |           |                          |                   |

---

## 4. standalone（开发者本地）开发启动

> 【指引】本章仅双形态项目需要（进程直跑形态）。单形态（全容器）项目可裁剪本章，合并至 §5 按应用展开。依赖来自 dev 机编排组时在此声明"本地不跑任何依赖容器"。

> **定位**：standalone 是开发环境——<如 前端 Vite + 后端 uvicorn 开发者本地直跑>，改代码即热重载。
> **依赖**：<如 mysql/ragflow 来自 dev 机 <IP> 编排组>，开发者本地不跑依赖容器。前提：编排组已就绪、本地可访问。

### 4.1 后端启动

```bash
# 前置：<如 Python ≥3.11、可访问 <IP>>
cd backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/python scripts/init_db.py        # 首次/需重置时：建库 + 迁移 + 种子（幂等）
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

- **配置**：<如 settings.py 直接读取 docs/L4/deployment/standalone/.env.standalone（无需复制）>
- **依赖参数**：<如 MySQL <IP>:3306 / RAGFlow http://<IP>:9380>
- **验证**：`curl http://localhost:8000/healthz` → `{"status":"ok"}`

### 4.2 前端启动

```bash
cd frontend
npm install
npm run dev        # <如 Vite :5173>
```

- **API 地址**：<如 前端兜底 http://localhost:8000/api/v1，连本地后端>
- **访问**：<如 http://localhost:5173>

### 4.3 验证

| 检查     | 命令                                                                                                                                    | 预期              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 后端健康 | `curl http://localhost:8000/healthz`                                                                                                    | `{"status":"ok"}` |
| 登录     | `curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"<pwd>"}'` | 返回 token        |
| 页面     | 浏览器 http://localhost:5173                                                                                                            | 登录后进入工作台  |

### 4.4 种子凭据（如有）

| 用户名 | 密码            | 角色   | 说明                             |
| ------ | --------------- | ------ | -------------------------------- |
| admin  | <如 Audit@2026> | <审计> | <如 种子用户（scripts/seed.py）> |

---

## 5. dev 发布部署

> 【指引】本章为全容器产物化发布（官方镜像+产物挂载，不构建自制镜像，或按项目形态改 K8s/云函数）。BUILD_COMMIT 机制与发布脚本是本章核心；单形态项目本章即全部署操作手册。

> **定位**：dev 兼作预发环境，**运行形态与未来生产完全一致**（全容器产物化）——<如 开发者本地编译产物，经 upload 传到 dev，官方镜像挂载运行，不在 dev 装依赖>。

### 5.1 形态总览

| 组件     | 官方镜像                            | 挂载的产物（开发者本地出 → upload）                                  | dev 端口                       |
| -------- | ----------------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| backend  | <如 python:3.11-slim>               | <如 依赖产物 backend-dist + 代码 /app>                               | <如 8000>                      |
| frontend | <如 nginx:1.25-alpine>              | <如 dist + nginx.conf（/api 反代 backend:8000）>                     | <如 8080>                      |
| 编排     | —                                   | <如 docs/L4/deployment/dev/docker-compose.dev.yml（2 服务，同网络）> | —                              |
| 依赖     | <如 ragflow 编排组（独立 compose）> | —                                                                    | <如 mysql 3306 / ragflow 9380> |

### 5.2 发布前置规则（版本标识）

> 【指引】二选一：BUILD_COMMIT（git HEAD → 容器 env，容器名即版本）或 SemVer 表。未启用 SemVer 时本节为版本标识说明，§7 版本记录裁剪。

- 每次发布前，本地代码改动**先 `git commit`（无需 push）**——`BUILD_COMMIT` 取本地 HEAD 写入容器 env
- 未提交改动不会体现在版本标识；`release-*.sh` 检测到未提交改动会**拦截**，确需强制用 `SKIP_GIT_CHECK=1`
- 查 dev 当前版本：容器名即版本（`docker ps`）或 `docker inspect` 查容器 env `BUILD_COMMIT`

### 5.3 发布流程（开发者本地执行，一条龙脚本）

> 【指引】发布脚本位于 docs/L4/deployment/，列出产物/命令/做什么/何时跑；步骤按"发布前置 → 执行 → 验证"展开；数据库变更（alembic/migrate）随发布同步的在此说明。

**发布脚本**（`docs/L4/deployment/`）：

| 产物      | 发布命令（开发者本地一键） | 做什么                                                | 何时跑           |
| --------- | -------------------------- | ----------------------------------------------------- | ---------------- |
| 前端 dist | `./release-frontend.sh`    | build → upload → 覆盖 dist → recreate                 | 每次前端代码变更 |
| 后端      | `./release-backend.sh`     | ①打包代码 ②编译依赖产物 → 都 upload → 覆盖 → recreate | 每次后端代码变更 |
| （补充）  |                            |                                                       |                  |

**发布步骤**：

```bash
# 0. 前置：代码已 git commit（见 §5.2，未提交会被脚本拦截）
cd docs/L4/deployment
./release-frontend.sh       # 前端发布
./release-backend.sh        # 后端发布
```

**首次部署初始化数据库**（如有）：

```bash
docker compose -f docs/L4/deployment/dev/docker-compose.dev.yml exec backend python scripts/init_db.py
```

**数据库变更流程**（如有，DDL/DML 随发布同步）：<如 本地 alembic revision → review → commit → 发布时自动 upgrade head，迁移失败中断>

**迁移编写铁律（沉淀位）**：

> 【指引】本节为**迁移编写铁律的沉淀位**——按项目实际迁移工具（alembic / migrate / 手写 SQL）填充，随项目踩坑持续补充。以下为通用铁律，按项目实际改写/增删。

- **① 已应用 revision 禁止再改**：已应用到任一环境的 revision 视为不可变，后续变更一律**新建 revision**（不修改已应用迁移，保证各环境迁移历史一致可回放）
- **② 默认值用字面量**：迁移中默认值写**字面量**（如 `CURRENT_TIMESTAMP`），**禁用函数式默认值**（如 `now()` 等运行时函数），保证迁移结果可复现、可 diff
- **③ 发布前本地自测**：发布前本地先 `upgrade head` 自测通过，再走发布流程（迁移失败不带上线）
- **④ 发布顺序不可换**：发布顺序固定为 **覆盖代码 → 执行迁移 → recreate 容器**，不可调换；**迁移失败则中断**（不继续 recreate，避免代码与 schema 不一致）

### 5.4 运维命令（在 dev 机执行）

```bash
# 启动应用服务
docker compose -f docs/L4/deployment/dev/docker-compose.dev.yml up -d

# 查看状态 / 日志
docker compose -f docs/L4/deployment/dev/docker-compose.dev.yml ps
docker compose -f docs/L4/deployment/dev/docker-compose.dev.yml logs -f backend

# 查看当前发布版本
docker ps --filter name=<prefix> --format "table {{.Names}}\t{{.Status}}"
docker inspect $(docker ps -q --filter "name=<backend>" | head -1) --format '{{range .Config.Env}}{{println .}}{{end}}' | grep BUILD_

# 停止（保留数据）
docker compose -f docs/L4/deployment/dev/docker-compose.dev.yml down
```

**健康检查**：<如 后端 curl /healthz；前端页面 + /api 反代冒烟>

### 5.5 参数与配置文件

> 【指引】backend 连接配置、compose 变量、端口、回滚、待澄清项在此聚合。

- **backend 连接配置**：<如 dev/.env.dev（compose env_file）；敏感项可在部署机 dev/.env 覆盖>
- **compose 变量**：<如 部署机把 configs/compose.env.example 复制为 compose 同目录 .env（gitignore）可覆盖端口/密钥/BUILD_COMMIT>
- **端口**：<如 backend 8000、frontend 8080>
- **回滚**：<如 后端回退产物并 force-recreate；前端回退 dist>
- **待澄清**：<如 服务器资源规格未定>

---

## 6. 密钥与配置管理

> 【指引】配置分层：代码内置默认值（兜底）→ 环境级配置（域名/开关）→ 运行期配置（热更新）→ 密钥（团队约定：集中登记于 §6.1/§6.2，载体二选一：有密钥管理服务用注入，无则按团队约定登记）。密钥安全红线：不落日志、不落前端包、支持轮换、*.example 恒占位。

| 层             | 内容            | 管理方式                                 |
| -------------- | --------------- | ---------------------------------------- |
| 代码内置默认值 | 兜底配置        | 代码库（git 可追踪）                     |
| 环境级配置     | 域名、URL、开关 | 环境变量/配置文件（按环境分离）          |
| 运行期配置     | 动态开关、阈值  | 配置中心（可热更新）                     |
| 密钥           | 密钥/token/证书 | **集中登记于 §6.1/§6.2**，见密钥管理约定 |

**密钥管理约定**：集中登记（§6.1/§6.2）；不落日志（日志脱敏默认）；不落前端包；支持轮换（改文档 + 部署配置，不触发代码变更）。载体二选一：有密钥管理服务用注入，无则按团队约定集中登记于 §6（明文值见 §6，*.example 恒占位）。

### 6.1 应用层密钥

| 密钥项          | 环境变量/来源       | 明文值                           | 用途          |
| --------------- | ------------------- | -------------------------------- | ------------- |
| <如 MySQL 口令> | <如 MYSQL_PASSWORD> | <如 infini_rag_flow>             | <如 业务主库> |
| <如 JWT 签名>   | <如 JWT_SECRET>     | <如 change-me-before-production> | <如 登录签名> |
| <如 种子口令>   | <如 SEED_PASSWORD>  | <如 Audit@2026>                  | <如 种子登录> |
| （补充）        |                     |                                  |               |

### 6.2 中间件层密钥

| 密钥项           | 环境变量/来源          | 明文值               | 用途                  |
| ---------------- | ---------------------- | -------------------- | --------------------- |
| <如 MySQL root>  | <如 ragflow 编排 .env> | <如 infini_rag_flow> | <如 业务库所在 MySQL> |
| <如 RAGFlow Key> | <如 RAGFlow 检索接口>  | <如 ragflow-xxx>     | <如 检索鉴权>         |
| （补充）         |                        |                      |                       |

---

## 7. 部署配置文件详解

> 【指引】本节即**部署资产登记**（路径 + 归属 + 生效机制合一）：按 `docs/L4/deployment/` **目录树**组织，章节与目录一一对应；具体变量明细不在此重复，以文件自身为准（文件即字典：键值对+内联注释）。文件增删改同步本节；密钥明文值统一登记 §6。本节为资产登记处，§5.3 只做快速入口引用。版本发布记录为按需节，未启用时裁剪（版本标识见 §5 的 BUILD_COMMIT 机制）。

**目录总览**（章节锚点）：

```
docs/L4/deployment/
├── configs/                          ← 7.1 配置模板（不参与运行）
│   ├── .env.example                    7.1.1 后端基础变量模板
│   └── compose.env.example             7.1.2 compose 层变量模板
├── standalone/                       ← 7.2 standalone 环境配置
│   └── .env.standalone
├── dev/                              ← 7.3 dev 环境配置
│   ├── docker-compose.dev.yml          7.3.1 应用编排
│   ├── .env.dev                        7.3.2 dev 后端容器配置
│   └── ragflow/                        7.3.3 RAGFlow 编排（7 件套，如有）
├── release-frontend.sh               ← 7.4 发布脚本
├── release-backend.sh
└── rebuild-ragflow.sh                  RAGFlow 编排重建（如有）
```

### 7.1 `configs/` — 配置模板（不参与运行）

#### 7.1.1 `.env.example`（后端基础变量模板）

| 维度     | 说明                                 |
| -------- | ------------------------------------ |
| 环境     | 全环境通用（模板，不参与任何运行时） |
| 归属应用 | backend                              |
| 生效机制 | 不参与运行——新环境起步时对照/复制用  |

- 密钥全占位（不落真值）；完整键集以文件自身与 7.2/7.3 为准

#### 7.1.2 `compose.env.example`（compose 层变量模板，部署机复制为 `dev/.env`）

| 维度     | 说明                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 环境     | dev 部署机（未来生产同用）                                                                                                     |
| 归属     | **docker compose 变量替换**——与 7.3.2 的本质区别：`.env.dev` 进容器给应用读，这个只做 compose 文件里 `${VAR}` 的替换，不进应用 |
| 生效机制 | 部署机复制为 `dev/.env`（已被 .gitignore 忽略，仅存部署机）；`docker compose` 自动读取 compose 文件同目录 `.env`               |

- 内容：<如 应用宿主端口、JWT_SECRET 覆盖、BUILD_COMMIT/BUILD_TIME 版本标识（release-*.sh 自动写入，见 §5.2）>

### 7.2 `standalone/` — standalone 环境配置

**`.env.standalone`**（standalone 后端配置）：

| 维度     | 说明                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| 环境     | standalone（开发者本地进程直跑）                                              |
| 归属应用 | backend（**前端不读它**——前端由代码兜底）                                     |
| 生效机制 | <如 app/settings.py 直接读取本文件（改后重启生效）；容器环境无此路径自动忽略> |

- 内容：<如 MySQL / RAGFlow / LLM / JWT / 应用 五个配置块，DEBUG=true>

### 7.3 `dev/` — dev 环境配置

#### 7.3.1 `docker-compose.dev.yml`（应用编排）

| 维度     | 说明                                                                  |
| -------- | --------------------------------------------------------------------- |
| 环境     | dev                                                                   |
| 归属     | 全平台（backend + frontend，同网络）                                  |
| 生效机制 | `docker compose -f` 启动；`${VAR}` 替换来自 7.1.2 的部署机 `dev/.env` |

| 服务     | 构成要点                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| backend  | <如 官方 python:3.11-slim + 依赖产物/代码挂载（不构建镜像）+ env_file: .env.dev + healthcheck（/healthz）> |
| frontend | <如 官方 nginx:1.25-alpine + dist/nginx.conf 挂载 + /api 反代 backend:8000 + depends_on backend healthy>   |

#### 7.3.2 `.env.dev`（dev 后端容器配置）

| 维度     | 说明                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| 环境     | dev                                                                                                                 |
| 归属应用 | backend（frontend 不读它）                                                                                          |
| 生效机制 | `docker-compose.dev.yml` 的 `env_file` 注入 backend 容器；敏感项可被部署机 `dev/.env`（7.1.2）的 `environment` 覆盖 |

**与 7.2 的差异**：<如 Key 类真值全部留空（只放部署机），DEBUG=false；UPLOAD_DIR 为容器内路径>

#### 7.3.3 `ragflow/`（RAGFlow 编排收编副本，如有）

| 维度 | 说明                                                                    |
| ---- | ----------------------------------------------------------------------- |
| 环境 | dev 机中间件（独立 compose，**不属于应用环境**，与 7.3.1 并行运行）     |
| 详见 | `dev/ragflow/README.md`（与现网逐字节对齐 + 应用层配置现状 + 一键重建） |

### 7.4 发布与重建脚本（开发者本地执行，位于 `deployment/` 根）

| 脚本                                         | 用途                                | 详情                    |
| -------------------------------------------- | ----------------------------------- | ----------------------- |
| `release-frontend.sh` / `release-backend.sh` | 产物打包 → upload → 覆盖 → recreate | §5.3 发布流程           |
| `rebuild-ragflow.sh`                         | RAGFlow 编排一键重建（保数据卷）    | `dev/ragflow/README.md` |

### 7.5 运行类资产（保留运行位置，仅登记）

> 与代码/运行环境耦合（相对路径/导入移动即断），文件本体不移动。

| 资产类型   | 文件路径                     | 用途                                   | 归属应用  |
| ---------- | ---------------------------- | -------------------------------------- | --------- |
| 运行       | `frontend/nginx.conf`        | <如 Nginx 静态托管 + /api 反代>        | <如 前端> |
| 初始化脚本 | `backend/scripts/init_db.py` | <如 建库 + 迁移 + 种子数据（幂等）>    | <如 后端> |
| 初始化脚本 | `backend/scripts/seed.py`    | <如 种子数据（含 SEED_PASSWORD 常量）> | <如 后端> |
| 迁移配置   | `backend/alembic.ini`        | <如 Alembic 迁移元信息>                | <如 后端> |

### 7.6 版本发布记录（按需，未启用时裁剪）

> 【指引】版本发布记录为**按需节**（未启用 SemVer 时裁剪本节，版本标识见 §5 的 BUILD_COMMIT 机制）。启用时格式与发布流程在此节定义。

**版本号规则（本节，按需）**：

- **格式**：<如 SemVer `MAJOR.MINOR.PATCH`（MAJOR=不兼容 / MINOR=新功能 / PATCH=修复）>
- **预发布**：<如 -alpha / -beta / -rc.1>
- **不可篡改**：已发布版本号不可修改；回滚通过新版本
- 发布文档一律引用本节，不得另写

**发布记录**（按需，每次发布一行）：

| 版本号      | 日期            | 变更内容      | 环境   |
| ----------- | --------------- | ------------- | ------ |
| <如 v1.0.0> | <如 2026-09-01> | <如 首次发布> | <prod> |
| （补充）    |                 |               |        |
