# 自检、验收与 CLI 速查（troubleshooting）

> 本文件是 c4-container-diagram skill 的「生成后自检/验收」详参，由 SKILL.md 的 §7.0~§7.4 + §8 拆出。**SKILL.md 只留一条命令闭环，详细流程在本节**。铁律速查与主流程见 [SKILL.md](../SKILL.md)。

## Contents

- [7.0 检查流程总纲（踩坑总结 → 生成前/后闭环）](#70-检查流程总纲踩坑总结--生成前后闭环)
- [7.1 SVG 坐标验证（判断超界/等宽/圆角 — 落地脚本）](#71-svg-坐标验证判断超界等宽圆角--落地脚本)
- [7.2 验收执行（一条命令：提取 → 渲染 → 脚本校验）](#72-验收执行一条命令提取--渲染--脚本校验)
- [7.3 辅助检查（脚本无法数值化的项）](#73-辅助检查脚本无法数值化的项)
- [7.4 SVG fallback 嵌入（渲染器不支持 d2 时，按需）](#74-svg-fallback-嵌入渲染器不支持-d2-时按需)
- [8. CLI 速查（自检用，仅 SVG）](#8-cli-速查自检用仅-svg)

---

## 7.0 检查流程总纲（踩坑总结 → 生成前/后闭环）

> 所有踩过的坑都固化成确定性规则——写代码前算好、写代码后验证，不再靠试错。

**生成前（写 d2 代码前，按顺序）**：

1. **定结构**：与用户对齐层数/每层模块/标签样式（SKILL.md 工作流）。
2. **按 layout-and-grid 尺寸公式算出每个容器、每个子容器的 width**：
   - 多列容器（grid-columns:N, N≥2）：`子width = (父宽−24−(N−1)×gap)/N`（设计宽度，layout-and-grid），**整组自动居中**；超界判断用 `Σ子宽+(N−1)×gap ≤ 父宽−4`
   - 单列容器/竖条（grid-columns:1）：**不设 width**，让 ELK 按子容器+等边距自动包裹 → 子容器天然居中（v0.8.1 实测，见 layout-and-grid §6.13 B）
   - 每一层嵌套都要算（A→B→C→D 每层，见 layout-and-grid §6.13），**不能只算最外层**。
   - ⚠️ **cylinder（数据库/存储节点）**：一律显式设 `width`（layout-and-grid §6.7a）——不设则由 label 决定且会撑大整列；label 用短行（每行 ≤4-6 字）。
3. **按 c4-container-spec §4.8 给每个节点挂圆角 class**（border-radius）——**含最外层 wrapper 容器**（如 `整体架构: { ... }` 这个整体容器，用 `border-radius: 16`）。实测坑：漏外层容器 → verify 报"1 个图形无圆角"，靠坐标+label 定位（见 §7.1）。
4. **检查 label 长度**：子容器 width 是否放得下最长的 label？放不下 → d2-syntax-cheatsheet §6.14 trade-off（缩文本/改布局/扩父容器/消减子项数，**禁止接受超界**）。

**生成后（渲染完，按顺序）**：

5. **d2 validate**（语法）+ 渲染。
6. **运行验收脚本**：`python3 scripts/verify-svg.py out.svg`——确定性判断超界 + 单列等宽 + 圆角 + **文字溢出**（§7.1），输出 PASS/FAIL + 数值。
7. **脚本 FAIL** → 按 layout-and-grid §6.13 超界排查序定位根因（**label 撑宽/文字溢出 → N 取错 → 公式**），改代码重渲染重跑，直到脚本全过（最多 3 轮）。
8. **识图 checklist 辅助**（§7.3 固定 prompt）复核配色/形状/整体协调等脚本无法数值化的项（**文字完整性已由脚本强制**，不再依赖识图）。

**发现问题的处理**：先按 layout-and-grid §6.13 超界排查序定位根因（label 撑宽第一嫌疑，非公式错），再改代码重跑；3 轮不过回 SKILL.md §3 ASCII 重确认。**不要逐个容器猜**。

---

## 7.1 SVG 坐标验证（判断超界/等宽/圆角 — 落地脚本）

**有真实脚本，直接运行**（不靠识图描述）：

```bash
python3 scripts/verify-svg.py <渲染出的.svg> [--source file.d2]
# 输出: 每对父容器→直接子容器的 4 边超界数值 + 单列容器左右等宽判定 + 圆角(rx)检查
#       + 文字溢出检测 + 嵌套深度报告（含 --source 时输出 .d2 真实层级树）
# 超界 >0、单列不等宽、图形无圆角、或文字溢出 → 脚本报 FAIL 并 exit 1
```

> **嵌套层级（P8）**：脚本会输出整图最大嵌套层数；加 `--source <file.d2>` 时，用 .d2 缩进解析真实层级树，并与几何嵌套判定对比——**不一致则告警**（深嵌套下几何推断可能误判父/子，以 .d2 源码层级为准）。**已知坑**：D2 可能生成重复的画布背景 rect（面积相同），脚本按"面积=最大"排除所有背景，勿依赖"仅第 1 个"。**脚本方法论**（也是手写验证的算法）：

> **⚠️ cylinder 检测（P0 修复）**：`shape: cylinder` 由 `<path>` 渲染、**不产生 `<rect>`**。旧版 `verify-svg.py` 只扫 `<rect>`，导致 cylinder 视觉超界被漏报（P0 盲区）。现脚本通过 `parse_cylinders` 把 cylinder 外体 path 的 bbox 并入 shapes 统一检测（超界/等宽/嵌套/文字溢出主机），且**天然跳过 cylinder 的圆角检查**（圆柱顶弧自身即圆角，无 rx）。

**超界判断**（对每个父容器 c 和其直接子容器 k，容差 = stroke-width/2 + 0.5）：

```python
左超 = c.x - k.x                    # >容差 → 子超出父左
右超 = (k.x + k.w) - (c.x + c.w)    # >容差 → 子超出父右
上超 = c.y - k.y
下超 = (k.y + k.h) - (c.y + c.h)
```

**等宽判断**（单列容器，竖条不设 width 时 ELK 自动包裹，子容器天然居中）：

```python
左距 = k.x - c.x
右距 = (c.x + c.w) - (k.x + k.w)
# 左距 == 右距 → 等宽（竖条不设 width 时左右都是 60）; 右距 ≈ 0 → 竖条误设 width（v0.8.1 贴右, 见 layout-and-grid §6.13 B）
```

**圆角判断**（c4-container-spec §4.8 铁律）：

```python
# 排除项: 画布背景(面积最大, rx=0 正常) + 箭头文字标签背景(h<40) + grid-column-span 徽章
# (span 徽章 = 小直角矩形 + 中心数字文本, 见 layout-and-grid §6.15)
# 其余图形节点 rx 缺失或 =0 → 违反 §4.8, FAIL
```

**文字溢出判断**（铁律 4 文本完整，P0-1——脚本强制，不再依赖识图）：

```python
# 估算文本宽度: CJK≈font-size(16px), ASCII≈0.55×font-size
# 找承载文本的最小容器 rect → 比较文本左右边界与容器边界
# 超出容差(TEXT_OVERFLOW_TOL=10px) → 报 [文字溢出] 节点 + 溢出 px + 修复指引(§6.17 \n 拆行)
```

**判断结论**：直接给用户 PASS/FAIL + 数值。超界/不等宽/无圆角/文字溢出 → 按 layout-and-grid §6.13 超界排查序定位根因（**label 撑宽 → 文字溢出 → N → 公式**，文字溢出是第一嫌疑），再渲染重跑脚本。**脚本是权威，识图（7.3）只做辅助**。

---

## 7.2 验收执行（一条命令：提取 → 渲染 → 脚本校验）

> ⚠️ **CJK 字体 2 列宽**：中文字符在 ELK/dagre 下按 2 列宽处理，ASCII 输出时字符间会被插入对齐空格（如"应用"渲染为"应 用"），影响 grep 与对齐。**自检用 cat 全文阅读，不要 grep 中文字面**。

**推荐（一条命令闭环，杜绝转义事故，改图首选）**——SKILL.md 工作流工作台脚本：

```bash
# 从 md 提取 d2 块（--name 按图名语义匹配，不带参数列出所有图名）→ 工作区 .d2/.svg/.png + 自动校验
python3 scripts/d2-workbench.py extract docs.md --name "系统架构图"
# 改图迭代：编辑工作区 .d2 后
python3 scripts/d2-workbench.py render docs-fig1.d2
# 回写 md（替换原代码块，默认无 fallback，自动 round-trip 校验并防多张图）
python3 scripts/d2-workbench.py sync docs.md docs-fig1.d2 --name "系统架构图"
```

> [!WARNING]
> **改图后必须重新 verify（不能只看临时 .d2）——本次复盘踩坑根因**：
>
> - **写完 md 后必须重新从 md 提取再跑一次 `verify-svg.py`**。只对临时 `.d2` 验证过不算数（临时 `.d2` 与写回 md 的内容可能不一致，尤其手写/脚本直接改 md 时）。`sync` 已内置 round-trip 校验（提取→validate→渲染→verify-svg→viewBox），**切勿绕过它手动改 md**。
> - **改一次图就要重新 verify 一次**（超界/等宽/圆角/文字溢出是渲染产物属性，改任何色值/label/width 都可能影响），不要只在"最终图"上跑一次。
> - 违背上述任一 → 出现"verify 通过但视觉超界"的假阳性（P0 场景）。

**手动替代流程**（工作台不可用/单次验证时）：

```bash
# 提取代码块到临时文件（⚠️ 必须用单引号定界符 heredoc，echo 会把 \n 转义成真实换行）
TMPDIR_D2="$TMPDIR/d2-$(date +%Y%m%d%H%M%S).d2"
cat > "$TMPDIR_D2" <<'EOF'
<提取的 d2 代码>
EOF

# 校验语法（失败则修代码块）
d2 validate "$TMPDIR_D2"

# 渲染为 SVG
SVG="${TMPDIR_D2%.d2}.svg"
d2 "$TMPDIR_D2" "$SVG"

# 运行验收脚本（权威校验：超界/等宽/圆角）
python3 scripts/verify-svg.py "$SVG"
```

> **不做 PNG 转码（默认）**：验收完全靠 `verify-svg.py` 解析 SVG（超界/等宽/圆角/文字溢出），**工作台默认不生成 PNG**（避免诱导用识图验收——识图对 CJK 不可靠）。仅在**用户要看视觉效果**时才临时转：`extract/render --png` 或 `sips -s format png out.svg --out out.png`。

**⚠️ viewBox 检查（渲染后必做，坑 d2-syntax-cheatsheet §6.16）**：工作台脚本自动检查；手动流程用：

```bash
# viewBox 必须是正数且合理；出现 -9e18 即整数溢出（空白图）
grep -o 'viewBox="[^"]*"' "$SVG"
# ✅ 正常: viewBox="0 0 1578 893"
# ❌ 溢出: viewBox="0 0 -9223372036854774056 -9223372036854774925" → 按 d2-syntax-cheatsheet §6.16 规避修正
```

**⚠️ 禁止用 `grep -c '<rect'` 判断 SVG 是否空白**：SVG 里 rect 标签带多行属性，grep 按行匹配会漏数（实测 32 个 rect 只数到 5）。判断"空白"的正确方式：① viewBox 是否正常（上一步）② PNG 是否能转出（sips 是否报 Cannot extract）。需要数节点时用 `python3 -c` 正则解析或看完整 SVG。

---

## 7.3 辅助检查（脚本无法数值化的项）

> 脚本已覆盖几何+文字验收（超界/等宽/圆角/**文字溢出**，见 §7.1）。以下项脚本查不了，用识图工具或人工复核（固定 prompt，不要自由描述）：

```
请按 checklist 检查，每项只回答 PASS/FAIL + 位置：
1.【配色】颜色是否按层/按功能域区分（c4-container-spec §4.2/4.6）？同层色系是否统一？
2.【形状】数据库是否用 cylinder？有无不该出现的圆形？
3.【柱体文字】shape: cylinder 内文字是否在椭圆内、不贴底？
4.【整体】层间是否左对齐、宽度一致？视觉是否协调？
```

> **文字完整性已由脚本强制**（`[文字溢出]` 检测），不再依赖识图——见 §7.1。识图仅用于配色/形状/整体协调等主观项；**识图结论与脚本冲突时一律以脚本为准**（PNG 识图对 CJK 图表不可靠，见 §7.4）。

**回环规则**：脚本 FAIL 或辅助检查 FAIL → 按 layout-and-grid §6.13 超界排查序定位根因（**label 撑宽/文字溢出 → N → 公式**）→ 修改 d2 代码 → 重渲染重跑脚本，最多 3 轮；3 轮未通过 → 回到 SKILL.md §3 重新确认 ASCII 架构本身。

---

## 7.4 SVG fallback 嵌入（渲染器不支持 d2 时，按需）

**背景**：部分 Markdown 渲染器不渲染 ` ```d2 ` 代码块（只显示代码文本），historically 用 SVG fallback（`<img src="data:image/svg+xml;base64,...">`）兜底。但当目标渲染器已原生支持 ` ```d2 `（如本项目、GitHub 等），双轨并存会导致双图重复，且 34KB base64 不可 diff，违反项目宪法定"文本可 diff"原则（fallback 应走 ASCII 文本图，见文档架构 CONSTITUTION §3.2）。

**硬性规则**：

1. **渲染器已支持 ` ```d2 ` 时禁止嵌入 img fallback**（会产生双图）。本项目即此场景，`sync` 默认 **不写 fallback**。
2. **fallback 加开关**：`sync --fallback=none|img`（默认 `none`）/`--remove-fallback`。`none`=不插入不更新；`img`=显式嵌入 base64 img。无开关时不写 fallback。
3. **只保留一份**：`img` 模式下更新时先删所有旧 fallback 再插入新的；删除以 `<!-- D2 渲染 Fallback SVG` 锚定的整段（正则 `\n<!-- D2 渲染 Fallback SVG.*?/>\n`，自闭合 `/>` 结尾）。
4. **清理历史污染**：`python3 scripts/d2-workbench.py clean-fallback docs.md` 或 `sync --remove-fallback` 删除 `<!-- D2 渲染 Fallback SVG -->` 及其后 img 行。
5. **fallback 保留时遵循项目图规范**：本项目 fallback 走 **ASCII 文本图**，不在 md 嵌入 base64 img；需 img 时显式 `--fallback=img`。

**sync 同步语义（修复后）**：`sync` 自动保证围栏独占一行（` ```d2\n` + 内容 + `\n``` `，`D2_BLOCK_RE` 要求闭合围栏独占一行，粘连直接报错），写回后强制 **round-trip 回读校验**（extract 第 N 块 → `d2 validate` → 渲染 → `verify-svg.py` → viewBox），任一失败则回滚本次写回并以非零码退出。

---

## 8. CLI 速查（自检用，仅 SVG）

```bash
# === 渲染（自检用） ===
d2 in.d2 out.svg                                # 渲染为 SVG（默认）
d2 in.d2 out.svg --layout=elk                    # 指定布局（默认 elk 已写在 vars 内）

# === 校验 ===
d2 validate in.d2                              # 语法校验（不输出文件）
d2 fmt --check in.d2                            # 格式检查

# === 输出格式 ===
# 架构图只输出 SVG（验收用 verify-svg.py 解析）；PNG 仅在用户要看视觉时用 sips 临时转

# === 主题（白底浅色背景推荐 ID 0 Neutral Default 或 ID 200 Dark Mauve 深色） ===
d2 --theme=0 in.d2 out.svg
d2 --theme=200 in.d2 out.svg
```
