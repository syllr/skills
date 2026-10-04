# 工具集整体（`docs/tools/`）

工具集是 `docs/tools/` 下的一个 **Node 项目**（`type: module`、Node ≥ 20）；所有工具都是 `.mjs`，经 `node tools/<类>/<工具>.mjs`
跑。工具集整体由本 skill 落地与演进。

## 目录布局（固定 4 类）

```
docs/tools/
├── package.json            # scripts（每个工具一条）+ 依赖
├── package-lock.json
├── .gitignore              # 见下
└── tools/
    ├── _util.mjs           # 共享 helpers：JSON 输出 / 参数解析 / --help（骨架 assets/_util.mjs）
    ├── webmcp/             # 页面调用型：webmcp.mjs（冻结件）+ webmcp.md（类文档）
    ├── inbound/            # inbound 接口型：api.mjs + inbound.md
    ├── outbound/           # outbound 接口型：<工具>.mjs + outbound.md
    └── middleware/         # 数据 / 中间件直连型：<工具>.mjs + middleware.md
```

- 一个工具 = `tools/<类>/<工具>.mjs`；类文档 `<类>.md` 与该类工具同目录（只放项目相关数据表，见 `section-*.md`）。
- 连接信息一律走命令行参数（类文档「环境参数」表）， **不读配置文件**。

## `package.json`

```json
{
  "name": "tools",
  "version": "1.0.0",
  "description": "AI 访问本系统资源的 Node CLI 工具集",
  "type": "module",
  "private": true,
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "<工具>": "node tools/<类>/<工具>.mjs"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- `scripts`： **每个工具一条**——与类文档的工具清单一一对应；
- `dependencies` / `devDependencies`：按工具实情（如 `pg`、`playwright-core`）；连接信息不进依赖、不进配置。

## `.gitignore`

```
# 工具集本地文件（一律不入库）
node_modules/
.cache/
.webmcp-profile/
.webmcp-profile-*/
```

## 新增工具时登记（与 `maintain-*.md` 配套）

1. 工具代码落到 `tools/<类>/<工具>.mjs`（骨架 `assets/tool-<类>.mjs`）；
2. `package.json` 的 `scripts` 加一条；
3. 类文档 `<类>.md` 按 `maintain-*.md` 登记（环境参数 / 工具 ↔ 可用页面等）。
