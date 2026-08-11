# D2 官方文档本地参考

本目录是从 [d2lang.com/tour/](https://d2lang.com/tour/) 官方文档爬取并本地化的参考资料，原始来源为 [d2lang/d2-docs](https://github.com/d2lang/d2-docs) 仓库 `docs/tour/` 目录（默认分支 `master`）。

## 内容

| 文件               | 内容                          | 对应官方页面         |
| ------------------ | ----------------------------- | -------------------- |
| `intro.md`         | D2 是什么、CLI watch 模式     | /tour/intro/         |
| `hello-world.md`   | 第一个示例                    | /tour/hello-world/   |
| `shapes.md`        | 节点形状语法、1:1 比例形状    | /tour/shapes/        |
| `connections.md`   | 连接语法、箭头、引用连接      | /tour/connections/   |
| `containers.md`    | 容器嵌套、标签、父引用        | /tour/containers/    |
| `sql-tables.md`    | ER 图（sql_table）、外键连接  | /tour/sql-tables/    |
| `layouts.md`       | 布局引擎总览与方向            | /tour/layouts/       |
| `dagre.md`         | dagre 布局引擎（默认）        | /tour/dagre/         |
| `elk.md`           | ELK 布局引擎                  | /tour/elk/           |
| `tala.md`          | TALA 布局引擎（架构图专用）   | /tour/tala/          |
| `positions.md`     | 位置控制（near / top / left） | /tour/positions/     |
| `grid-diagrams.md` | 网格布局（grid-columns 等）   | /tour/grid-diagrams/ |
| `composition.md`   | 多板组合                      | /tour/composition/   |
| `imports.md`       | 导入语法                      | /tour/imports/       |
| `themes.md`        | 主题定制                      | /tour/themes/        |
| `exports.md`       | 导出格式                      | /tour/exports/       |
| `man.md`           | CLI 手册                      | /tour/man/           |
| `faq.md`           | 常见问题                      | /tour/faq/           |
| `troubleshoot.md`  | 故障排查                      | /tour/troubleshoot/  |
| `cheat-sheet.md`   | 速查表（PDF 预览页）          | /tour/cheat-sheet/   |

> `diagram-review.md` 为**本项目自研**的 PNG 识图自检审查清单（非官方文档），用于渲染后条理性审查（macOS：sips 转 PNG + 识图工具），详见 [SKILL.md 工作流第 4 步](../SKILL.md)。

## 处理说明

原始 `.md` 为 Docusaurus 格式（含 `import` 组件、`<CodeBlock>` 引用、SVG 嵌入 div 等），已转换处理：

- 外部 `.d2` 代码引用已**内联**为 ` ```d2 ` 代码块，可直接复制使用
- `:::info` / `:::caution` 提示块已转换为 GitHub 兼容的 `> [!NOTE]` / `> [!WARNING]`
- 删除了 SVG 渲染占位与导航/页脚噪音

## 更新方式

如需更新到最新版：

```bash
# 分支为 master
for f in intro hello-world shapes connections containers sql-tables layouts dagre elk tala positions grid-diagrams composition imports themes exports man faq troubleshoot cheat-sheet; do
  curl -fsSL "https://raw.githubusercontent.com/d2lang/d2-docs/master/docs/tour/$f.md" -o "$f.md"
done
# 随后用转换脚本（见仓库 skill 开发流程）内联代码引用
```
