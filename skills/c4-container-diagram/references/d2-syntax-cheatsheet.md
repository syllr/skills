# D2 语法速查与关键坑（syntax cheatsheet）

> 本文件是 c4-container-diagram skill 的「D2 语法/引擎/文本」速查，由 SKILL.md 的 §6.4/6.5/6.6/6.14/6.16/6.17 拆出。**关键坑：viewBox 整数溢出（最严重）、`\n` 字面量、长 label 换行**。铁律速查与主流程见 [SKILL.md](../SKILL.md)。

## Contents

- [6.4 dagre 不支持容器 width/height](#64-dagre-不支持容器-widthheight)
- [6.5 多板图（layers/scenarios/steps）禁用](#65-多板图layersscenariossteps禁用)
- [6.6 TALA 引擎禁用](#66-tala-引擎禁用)
- [6.14 文本溢出 trade-off（必须给用户选择）](#614-文本溢出-trade-off必须给用户选择)
- [6.16 viewBox 整数溢出 → 空白图（最严重坑）](#616-viewbox-整数溢出--空白图最严重坑)
- [6.17 长 label 撑宽容器（必须 `\n` 换行）](#617-长-label-撑宽容器必须-n-换行)
- [6.18 数据存储节点用 stored_data（弃用 cylinder）](#618-数据存储节点用-stored_data弃用-cylinder)

---

## 6.4 dagre 不支持容器 `width`/`height`

`dagre` 布局下给容器写 `width: 800` 会报错 `does not support dimensions set on containers`。**架构图必备 `elk` 布局引擎**（本 skill 默认 elk 配方）。

---

## 6.5 ❌ 多板图（layers/scenarios/steps）禁用

**多板语法无法在 Markdown 渲染引擎输出**（报 `multiboard output cannot be written to stdout`）——拆成多张独立 ` ```d2 ` 代码块。

---

## 6.6 ❌ TALA 引擎禁用

TALA 是**闭源付费引擎**（商用需许可，免费版有水印），本 skill 一律用 `elk`；出现 `layout-engine: tala` 一律改 `elk`。

---

## 6.14 文本溢出 trade-off（必须给用户选择）

子容器 width 按公式算出后放不下文本（文本溢出/被截断）时，**不要自己偷偷改布局**，按 c4-container-spec 的 1.6 四选项流程处理（缩 label → 改布局 → 扩父容器 → 消减子项数，优先级 1>2>3>4，详见 c4-container-spec §1.6）。

**两个方向（缩文本 vs 扩父容器）都在生成前用 ASCII 或渲染结果向用户确认，不要自作主张**。**任何"接受超界"的选项都是被禁止的**。

---

## 6.16 viewBox 整数溢出 → 空白图（最严重坑，实测 v0.8.1）

**症状**：`d2 render` 输出 SVG 后，viewBox 变成 `0 0 -9223372036854774056 -9223372036854774925`（int64 最小值边界）。`sips -s format png` 报 `Cannot extract image`，查看器显示**空白图**。但 SVG 内部 rect/text 节点都在（grep 能看到 label）——**d2 validate 通过 ≠ 渲染正常**。

**触发条件**（多条独立路径，命中任一即可能溢出，实测定位）：

- 多 class（≥2 种 class **各自带独立 fill/stroke，样式在同一节点上冲突归属**）+ 深嵌套 grid（>2 层）+ 竖条 组合
- 左主体容器内部写 `grid-rows: 2` 或 `grid-rows: 3`（而非标准 1×1）
- 深度嵌套 grid（≥3 层）+ 长 label 也可能触发

> **免责澄清**：**并非所有多 class 都会溢出**。若 `module` 类只带形状（border-radius/stroke-width），热力类（`core`/`support`/`edge`）只带 fill、状态类（`planned`）只带 stroke-dash——`[module; core; planned]` 这种「职责分离」的多 class 是**安全**的（实测产品能力架构图，见 references/templates.md §5.6）。溢出的关键是「多个 class 同时写独立 fill」导致样式归属冲突。

> **关键认知**：触发路径不止一条（修改时加 class/加层都可能是诱因）。**只要遵守规避写法（单 class + 外层 1×1 grid + 竖条不设 width）就不会溢出**——修改后溢出时按这三点排查，而不是怀疑"class 数量是不是问题"。

**规避（稳定写法）**：

1. **优先单 class**（如 `module`），节点自身写 `style.fill`/`style.stroke`/`style.font-color`——不要把不同样式分散到多个 class
2. **左主体容器固定 `grid-rows: 1; grid-columns: 1`**（ELK 自动把多个子容器纵向堆叠）——不要写 2 或 3
3. 外层 `grid-columns: 2; grid-rows: 1`

**验收必须检查 viewBox**：渲染后按 troubleshooting.md 验收执行检查 viewBox 是正数且合理（如 `0 0 1000~3000 500~1500`）；出现负数大值（`-9e18`）即溢出，按上述规避修正。**d2 validate 通过不代表 viewBox 正常——必须看渲染产物**。

---

## 6.17 长 label 撑宽容器（必须 `\n` 换行）

**症状**：容器/竖条的 label 较长（> 8 字符）时，ELK 按**最长行定宽**，容器被撑宽（实测竖条 label 从 280 撑到 714）。

**解决（关键认知）**：不是必须缩短 label，而是用 `\n` 换行拆成短行：

```d2
# ✅ 换行后竖条按最长行定宽（实测回落 281）
label: "③ 共享业务服务层\n（横向能力）\n被多个垂直能力共用"

# ❌ 不换行 → 容器被撑到 714
label: "③ 共享业务服务层（横向能力 · 被多个垂直能力共用）"
```

**规则**：容器/竖条/分区 label 若较长（> 8 字符），**必须用 `\n` 换行成短行（每行 ≤ 8 字）**，否则 label 撑宽容器。语义完整保留，宽度可控。**这是"必须换行"，不是"必须缩短"**。

> **⚠️ 数据存储节点（首选 stored_data，弃用 cylinder）**：数据库/对象存储/缓存节点用 `shape: stored_data`（label 垂直居中，两行不贴边，见 §6.18）。cylinder 的历史坑（v0.8.1-HEAD 实测，见 layout-and-grid §6.7a）：
>
> - cylinder **设了 width** → 宽度**受控**，label 不覆盖，但长/多行 label 在**单列容器内会把整列一起撑宽**（该列列宽 = 最宽子内容）
> - cylinder **未设 width** → 宽度 = label 所需；长 label 会把圆柱本身撑大（实测 `MySQL` 与 `向量服务\n检索·存储` 同列时均被撑到 129）
> - **弃用 cylinder**：label 底部锚定、两行贴边溢出、`label.near` 无 center 值——改用 stored_data（见 §6.18）

> **⚠️ `\n` 写入方式铁律（反复踩坑的根因）**：d2 的 `\n` 是**字面量**（反斜杠 + n 两个字符），在 Markdown 代码块中原样书写即可。但**用脚本/命令行写临时 .d2 时**，`echo`、未加引号的 heredoc、Python 字符串拼接都会把 `\n` 解释成真实换行，破坏 d2 字符串语法（编译失败）：
>
> ```bash
> # ❌ 错误：echo / heredoc 会把 \n 变真实换行
> echo 'label: "a\nb"' > tmp.d2
>
> # ✅ 正确：单引号定界符 heredoc（不展开转义）
> cat > tmp.d2 <<'EOF'
> label: "a\nb"
> EOF
> ```
>
> **最稳妥**：用 [SKILL.md 修改模式工作台脚本](../SKILL.md)（`d2-workbench.py`）——文件 IO 直写，从机制上杜绝转义问题。

---

## 6.18 数据存储节点用 `stored_data`（弃用 cylinder）

**症状**：`shape: cylinder` 的 label **默认底部锚定**（D2 v0.8.1 实测）——文字沉在圆柱下缘，两行 label（如「向量服务/RAGFlow」）直接贴边溢出。

**无法修复定位**：`label.near` 没有单独的 `center` 值（仅 8 个方位常量，写 center 编译报错）；`top-center` 在圆柱上实测会把文字移到形状外面。

**解决**：数据存储节点（数据库/对象存储/缓存）一律用 `shape: stored_data`（数据库筒仓图标，语义同为数据存储）：

```d2
# ✅ stored_data：label 默认垂直居中，单行/多行都不贴边
db: { label: "[MySQL 8]\n业务主库"; shape: stored_data; width: 285; height: 72 }

# ❌ cylinder：label 底部锚定，两行文字贴边溢出
db: { label: "[MySQL 8]\n业务主库"; shape: cylinder; width: 285; height: 60 }
```

**规则**：

- 数据库/对象存储/缓存节点 **首选 `stored_data`**，**不用 cylinder**（形状表 §4.7）
- 两行 label 时 `height` 提至 **72**（单行 label 60 即可）
- 仍有 width 显式设置要求（按 §6.13 公式，与普通节点一致）
