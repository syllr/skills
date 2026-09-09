---
name: deploy-ops
description: 部署与运维操作——发布前端/后端到 dev 环境（release 脚本一键：构建→上传→迁移→recreate→健康检查）、启动/停止 standalone 本地环境、查看部署状态与版本、发布前置检查（git 未提交拦截/DNS 与代理故障诊断）。触发词：部署 dev、发布前端、发布后端、启动 standalone、部署状态、发布版本、回滚部署
license: UNLICENSED
metadata:
  audience: ai-deploy-operator
  rule-source: .omo/rules/docs/L4/DEPLOYMENT.md
  generated-by: doc-arch-rules
---

# deploy-ops — 部署与运维

AI 是部署操作员：按 DEPLOYMENT 文档（`docs/L4/DEPLOYMENT.md`）的流程执行部署/启动/状态检查。**发布脚本是唯一执行通道，AI 不手拼部署命令**；本 skill 沉淀流程纪律与故障处理。

## 1. 职责

- **发布**：前端 dist / 后端代码+依赖 → dev 环境（release 脚本一键：构建 → upload → init_db → alembic check → recreate → 健康检查）
- **standalone**：本地进程直跑环境启动（后端 uvicorn + 前端 Vite dev，依赖 dev 机 ragflow 编排组）
- **状态与版本**：容器状态/版本标识（BUILD_COMMIT）核对、健康检查（healthz/页面/反代）
- **发布前置检查**：git 未提交拦截（发布要求 commit——AI 需用户显式授权后才 commit）、网络连通性预检

## 2. 工具箱

> 【实例化】本节按目标项目实际部署资产生成：探测 `<部署资产目录>`（release 脚本/compose/env）、`<远程执行通道>`（remote-shell 主机别名）、环境矩阵。下表为 enterprise-ai-hub 项目的实例基线。

| 操作            | 命令                                                                                                     | 说明                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 发布前端到 dev  | `cd docs/L4/deployment && ./release-frontend.sh`                                                         | 本地 Vite build（`VITE_API_BASE=/api/v1`）→ tar → remote-shell upload → 覆盖 dist → recreate frontend                  |
| 发布后端到 dev  | `cd docs/L4/deployment && ./release-backend.sh`                                                          | 打包代码 → 本地 uv lock → dev 机 Docker 编译依赖 → upload → init_db（迁移+种子幂等）→ alembic check → recreate backend |
| 版本确认        | 容器 env `BUILD_COMMIT`（docker inspect）                                                                | 必须与本地 `git rev-parse --short HEAD` 一致                                                                           |
| 健康检查        | `curl http://192.168.1.225:8000/healthz`（后端）；`curl http://192.168.1.225:8080/`（前端）+ `/api` 反代 | 三者全 200 才算发布成功                                                                                                |
| standalone 后端 | `cd backend && .venv/bin/python -m uvicorn app.main:app --reload --port 8000`                            | 配置直读 `docs/L4/deployment/standalone/.env.standalone`                                                               |
| standalone 前端 | `cd frontend && npm run dev`                                                                             | Vite :5173，API 兜底 localhost:8000                                                                                    |
| 远程执行        | `remote-shell cmaitest '<命令>'`                                                                         | dev 机 192.168.1.225；只读诊断优先，变更走 release 脚本                                                                |

环境与凭据：DEPLOYMENT §2.1 环境矩阵 / §6 密钥登记（本 skill 不复制）。

## 3. 发布纪律

1. **commit 前置**：release 脚本拦截未提交改动（`git status --porcelain` 非空即退出）——发布前必须 commit（AI 须用户显式授权后才执行 commit；`SKIP_GIT_CHECK=1` 绕过会误导 BUILD_COMMIT 版本标识，禁用）
2. **顺序不可换**：后端发布固定「覆盖代码 → 迁移（init_db）→ 一致性校验（alembic check）→ recreate」；迁移失败/校验失败即中断，不带病 recreate
3. **双端一致性**：BUILD_COMMIT 取本地 HEAD——发布前后用版本确认步骤核对，不一致 = 发布的不是你以为的版本
4. **健康检查收口**：healthz + 前端页面 + /api 反代三者全通过才算完成；任何一步失败停下诊断，不带病宣布完成

## 4. 故障处理（实测沉淀）

| 症状                                          | 诊断                                                                      | 处置                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `uv pip compile` 失败（lock 未产出）          | 本机系统 DNS 故障（`scutil --dns` 无 nameserver）或网络断                 | 系统级修复由用户执行（重启 Wi-Fi/重连 VPN）；临时绕过：注入代理 env（`https_proxy=http://127.0.0.1:<port>`）后重跑发布         |
| `npm install/ci` 网络失败                     | 同上（或 registry 不通）                                                  | Node 可用进程内 DNS patch（`NODE_OPTIONS="--require <dns-patch.cjs>"` + `--registry` 镜像源）；uv 等原生二进制只能代理或修 DNS |
| 前端页面/接口 curl 000 但 remote-shell SSH 通 | 到目标网段的路由/VPN 断开                                                 | 用户侧开 VPN 后重试；发布前先 curl healthz 预检                                                                                |
| 后端健康检查失败（recreate 后）               | 看容器日志：`remote-shell cmaitest "docker logs <backend容器> --tail 50"` | 常见：依赖产物与代码不匹配（重跑 release-backend）、迁移失败（按 DEPLOYMENT §5.3 迁移铁律处理）                                |
| tar 解包 LIBARCHIVE.xattr 警告                | macOS bsdtar 扩展头在 Linux 解包的无害提示                                | 忽略（产物已正常解压）                                                                                                         |

## 5. 流程

**发布 dev**：预检（git 状态 + 网络连通性 healthz curl）→ 用户确认发布范围（前端/后端）→ 执行 release 脚本 → 版本确认（BUILD_COMMIT 对比本地 HEAD）→ 健康检查三项 → 报告（版本/耗时/失败项）

**启动 standalone**：后端（init_db 幂等 → uvicorn）→ 前端（Vite dev）→ 验证（healthz + 登录 + 页面）

**发布后回归建议**：跑 test-ops 的冒烟用例（authLogin/listProjects）确认端到端
