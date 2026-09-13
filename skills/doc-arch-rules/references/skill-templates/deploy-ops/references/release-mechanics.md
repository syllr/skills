# 发布流水线方法论（release-mechanics）

发布脚本的执行形态与方法论——本文件承载 rule 不承载的「怎么实现发布脚本」。发布流程步骤的正文在项目 `docs/L4/DEPLOYMENT.md` §5.3（脚本须实现的接口契约），本文件讲实现模式与校验。

## 1. 发布链机制（挂载式部署）

目标机采用「发布链 + current 软链」实现原子发布与秒级回滚：

```
<DEPLOY_ROOT>/
├── releases/
│   ├── 20260912-140000-abc1234/   每个发布一个目录（<YYYYMMDD-HHMMSS>-<short-sha>，时间有序）
│   │   ├── backend/               或 dist/（前端）
│   │   └── manifest               commit / time / sha256 / service（制品不可变标识）
│   ├── 20260910-093000-def5678/
│   └── ...
├── current -> releases/<最新或回滚目标>   现役软链（原子切换）
└── releases.log                   审计日志（时间 | 动作 | 服务 | 版本 | 结果）
```

- 产物经 `current` 软链挂载进容器；发布 = 原子切 `current` + recreate（`ln -sfn` + `mv -T` 原子替换）
- 回滚 = 把 `current` 切回旧链节（rollback.sh），不重新打包
- 老产物不自动删除——保留完整发布链，任意版本可回滚

## 2. 发布流水线（典型步骤）

1. 过期检查：历史产物（current 之外）中最老的若超阈值 → 提示（见 §3）
2. 前置检查：版本标识（BUILD_COMMIT 取本地 git HEAD）；未提交改动拦截（可显式跳过）
3. 打包：源码/产物打包 + sha256（不可变制品）
4. 依赖编译/锁定：依赖锁版本 → 目标机编译依赖产物（不依赖本地 daemon）
5. 上传到新 release 目录 + 写 manifest（commit/time/sha256）
6. 数据变更：迁移/初始化（幂等，与发布解耦，可独立执行）
7. 原子切 current + recreate
8. 健康检查：通过则记录审计；失败自动回滚到上一版

> 各项目按实际技术栈裁剪，步骤接口以 DEPLOYMENT §5.3 为准。

## 3. 过期提示与清理（历史产物）

- 阈值 `RELEASE_RETENTION_DAYS`（默认 30 天）；过期判定对象是历史产物，即 releases 中未被 current 指向的版本
- 豁免现役：current 指向的版本永不判过期（它是正在用的发布版本，不是历史产物）
- 默认只提示不删除；加 `--prune` 才清理超期历史产物（仍豁免 current）
- 提示文本给出最老历史产物的版本目录与年龄，交用户决定

## 4. 脚本约定

- 占位符 fail-fast：`<...>` 类占位值（如 `DEPLOY_HOST`/`DEPLOY_ROOT`）在入口 `require_config` 校验——为空或仍含 `<` 即报错退出
- 目标机执行后端：`TARGET_MODE`（由部署环境决定，非每次发布临时选择）
  - `compose`（默认，已实现）：目标机是 VM/物理机，有 Docker daemon，用 `docker compose` 起容器
  - `native`（预留，未实现）：目标机本身是容器、无 Docker daemon——同一发布流程换执行后端（artifact-only 部署）
  - 起服务/跑迁移/回滚起服务收敛为 `deploy_recreate`/`run_migration` 封装（`release-common.sh`），加 native 分支只改此处
- 远程路径：compose 文件与部署配置目录用独立绝对路径（`REMOTE_DEPLOY_DIR`/`REMOTE_COMPOSE`），不由 `DEPLOY_ROOT` 拼接推导
- 路径推算：脚本自行推算仓库根，不依赖 cwd；共享函数在 `lib/release-common.sh`（跨脚本 source）
- 主机：走 remote-shell 别名或环境变量，不硬编码真实主机；凭据不写进脚本（取值来源登记 DEPLOYMENT §6）
- 原子切换：`switch_current` 用 `ln -sfn` + `mv -T` 原子替换软链
- 失败即中断：迁移/校验失败不继续 recreate（校验步骤不加管道——管道会吞掉退出码）
- 自动回滚：健康/冒烟失败 → 切回上一版 + 记审计

## 4.1 目标机形态（compose vs native）

发布机制（打包 → 上传 release 包 → `releases/` + `current` 软链 → 回滚）与目标机形态无关；差异只在「启动执行方式」：

| 关注点         | compose（VM/物理机）                    | native（目标机是容器）                             |
| -------------- | --------------------------------------- | -------------------------------------------------- |
| 依赖编译       | 目标机 `docker run` 编译                | 改为开发机本地编译                                 |
| 迁移           | `docker compose run --rm`               | 目标机进程管理器/裸进程执行                        |
| 起服务/回滚    | `docker compose up -d --force-recreate` | 目标机进程管理器重启（如 supervisorctl/systemctl） |
| `current` 软链 | 容器挂载点                              | 版本清单（切链后需重启生效）                       |

> native 未实现：`TARGET_MODE=native` 时脚本 fail-fast 并提示待补项（本地编译 + 进程管理器重启 + 裸进程迁移）。

## 5. 校验清单（非破坏）

| 检查          | 方法                                                   |
| ------------- | ------------------------------------------------------ |
| 脚本语法      | `bash -n <script>`                                     |
| compose 解析  | `docker compose -f <file> config`（不启动）            |
| 环境键集一致  | 各环境 `.env.<env>` 键集 = `configs/.env.example` 键集 |
| 登记一致      | 磁盘资产 = DEPLOYMENT §7 登记项                        |
| 主机/凭据占位 | 脚本无真实主机/密码（`grep` 硬编码特征）               |

## 6. 与执行的分工

- 本 skill 的校验（分诊 4）与生成（分诊 2）均为非破坏操作
- 真实发布（分诊 1）按 DEPLOYMENT §5.3 执行；执行前须环境确认与 commit 询问（见 SKILL.md §1）
- 流程正文（步骤/命令）只在 DEPLOYMENT §5.3，本文件不复制
