# 引导映射（bootstrap）

引导分诊用：探测到语言框架后，判定其「导出形态」（有 CLI 一行 / 需脚本），据此决定是否要从 `assets/reference-impl/` 复制脚本。

命令一律见项目 `docs/L3/API.md` §2（命令 SSOT），本文件只承载「形态分类 + 脚本是否需要 + 产物落点约定」，不复制命令。

## 1. 形态分类

| 框架                             | 形态                                 | 需要脚本                 | 脚本模板                | 关键前置                            |
| -------------------------------- | ------------------------------------ | ------------------------ | ----------------------- | ----------------------------------- |
| Go（huma）                       | 运行时暴露 → 需拉取                  | 是（启动+curl，或 dump） | 无（按 API.md §2 现写） | 应用可离线启动                      |
| Go（swaggo）                     | CLI 一行 `swag init`                 | 否                       | —                       | 注释注解已写                        |
| Java-Spring（springdoc）         | Maven 插件                           | 否                       | —                       | 插件已配置                          |
| Python-FastAPI                   | 需脚本 dump `app.openapi()`          | 是                       | `export_openapi.py`     | 应用可离线构建                      |
| Python-Django（drf-spectacular） | CLI 一行                             | 否                       | —                       | drf-spectacular 已入 INSTALLED_APPS |
| Python-Flask（flask-smorest）    | CLI 一行                             | 否                       | —                       | flask-smorest 已装                  |
| TypeScript（tsoa）               | CLI 一行 `npx tsoa spec`             | 否                       | —                       | tsoa.json 已配                      |
| TypeScript（zod-to-openapi）     | 需脚本 `registry.generateDocument()` | 是                       | 无（按 API.md §2 现写） | —                                   |
| Node-NestJS（@nestjs/swagger）   | 需脚本（启动 app 后导出）            | 是                       | 无（按 API.md §2 现写） | 应用可离线构建                      |

> FastAPI 是本仓主要生态，提供脚本模板 `assets/reference-impl/export_openapi.py`。其余「需脚本」框架由 AI 按 API.md §2 小节现场编写，避免为未验证场景预置死代码。

## 2. 脚本落点约定

- Python 项目：`backend/scripts/export_openapi.py`（与后端代码同根，能 import 应用）
- Node 项目：`scripts/export-openapi.mjs`
- 拆分脚本（通用，框架无关）：`scripts/split_openapi.py`（见 `assets/reference-impl/`）
- 落点须与 API.md §2 命令及 §4 step5 diff 目标一致

## 3. 引导输出（分诊 1 完成判定）

- 语言框架已探测并记录
- 需脚本者：脚本已从 assets 复制到项目落点，且 `--help`/试跑不报错
- API.md §2 命令与产物路径已确认（缺失则交 L3/API rule 更新）
- 报告：框架 / 脚本落点 / API.md §2 待回写 / 代码 instrument 缺口（tags、operationId、x-action/x-capability）
