# C4 Container Diagram skill 文档参考

本目录是从 [d2lang.com/tour/](https://d2lang.com/tour/) 官方文档爬取并本地化的参考资料（skill 用 D2 画 [C4 Container Diagram](https://c4model.com/diagrams/container)——C4 model 第 2 层图），原始来源为 [d2lang/d2-docs](https://github.com/d2lang/d2-docs) 仓库 `docs/tour/` 目录（默认分支 `master`）。

## 保留内容（画 C4 Container Diagram 必需）

经过精简，仅保留画架构图实际用得到的 D2 语法参考（其余 17 个文件已删除——如 sequence_diagram/sql_table/ER 图/tala 付费引擎/CLI 完整手册等与 C4 Container 画图无关）：

| 文件                | 内容                                              | 对应官方页面         | C4 画图用途                                         |
| ------------------- | ------------------------------------------------- | -------------------- | --------------------------------------------------- |
| `containers.md`     | 容器嵌套、标签、父引用                            | /tour/containers/    | **核心**——多层大容器嵌套语法                        |
| `connections.md`    | 连接语法（有向/无向/标签/引用）                   | /tour/connections/   | **核心**——容器间通信关系                            |
| `grid-diagrams.md`  | 网格布局（grid-columns/rows/gap）                 | /tour/grid-diagrams/ | **核心**——"千层蛋糕"纵向堆叠 + 等宽分布             |
| `elk.md`            | ELK 布局引擎                                      | /tour/elk/           | **核心**——默认推荐引擎（含 grid + 容器 width 支持） |
| `diagram-review.md` | **本项目自研** PNG 识图自检审查清单（非官方文档） | —                    | 自检核心——macOS sips 转 PNG 后用识图工具审查        |

## 处理说明

原始 `.md` 为 Docusaurus 格式（含 `import` 组件、`<CodeBlock>` 引用、SVG 嵌入 div 等），已转换处理：

- 外部 `.d2` 代码引用已**内联**为 ` ```d2 ` 代码块，可直接复制使用
- `:::info` / `:::caution` 提示块已转换为 GitHub 兼容的 `> [!NOTE]` / `> [!WARNING]`
- 删除了 SVG 渲染占位与导航/页脚噪音

## 更新方式

如需更新到最新版（仅保留的 5 个文件）：

```bash
# 分支为 master
for f in containers connections grid-diagrams elk; do
  curl -fsSL "https://raw.githubusercontent.com/d2lang/d2-docs/master/docs/tour/$f.md" -o "$f.md"
done
# 随后用转换脚本（见仓库 skill 开发流程）内联代码引用
```
