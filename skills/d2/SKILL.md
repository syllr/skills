---
name: d2
description: 用 D2（d2lang.com）声明式文本画架构图/流程图/时序图/ER 图/状态机——CLI 渲染 SVG/PNG/PDF/PPTX。当用户要画架构图、流程图、时序图、ER 图、状态机、网络拓扑、C4 企业架构、看板或任何关系图时使用。提供 CLI 工作流、语法速查、实战模板与陷阱清单。⚠️ 注意：画图前必须先读取 references/layouts.md 选择布局引擎！
---

# D2 画图技能（系统级 · 通用）

> D2（Declarative Diagramming）= 文本转图的声明式语言。`d2 in.d2 out.svg` 一行命令出图。
> 完整官方文档已本地化到本 skill 的 [references/](references/) 目录（见 [3.10 节映射表](#310-tour-关键章节摘要已本地化到-references无需联网)），无需联网查阅。

---

## 1. 何时用 D2

| 想画什么               | 用 D2 适合吗                              |
| ---------------------- | ----------------------------------------- |
| 架构图/分层图/模块依赖 | ✓ 强项（容器 + 自动布局）                 |
| 流程图/时序图/状态机   | ✓ 强项（内置 diagram 类型）               |
| ER 图/数据库表         | ✓ 强项（`sql_table` shape）               |
| 业务时序/消息流/类图   | ✓（`sequence_diagram` / `class_diagram`） |
| 云架构/微服务          | ✓ + Icons 库（AWS/K8s/GCP）               |
| 看板/仪表盘            | ✓（`grid-columns` 强制布局）              |
| 思维导图/甘特图/BPMN   | △ 不擅长                                  |

**核心优势**：文本 → git diff 友好 → CI 出图 → LLM 生成；**自动布局**（dagre/ELK）不用手摆坐标。

---

## 2. 工作流（7 步）

> **CRITICAL — BLOCKING（阻塞性要求）: 画任何图之前，第一步 MUST 使用 Read 工具读取 [`references/layouts.md`](references/layouts.md)（布局引擎总览）与第 7 章选型速查，根据图类型与复杂度选定布局引擎（dagre/ELK/TALA）。未读取并确定引擎前，禁止写 `.d2` 文件或调用渲染命令。**
> 选型速查：通用小图 → **dagre**（默认）；节点多/容器嵌套/边密 → **ELK**；架构图/需手动锁位 → **TALA**；看板/仪表盘 → `grid-columns` 强制布局。

> **渲染后不要打开浏览器预览，不要执行 `open` 命令**。渲染完成只需报告文件路径与结果。**除非用户明确要求"打开看看"**，否则一律不打开。

> **平台限定**：本 skill 的 PNG 转换自检依赖 **macOS 自带 `sips` 命令**，仅支持 Mac。非 macOS 环境跳过 PNG 转换自检，降级为 Read `.d2` 源码核对 + `d2 validate` 校验，并在报告注明"未做 PNG 自检（仅支持 macOS）"。

0. **选引擎（强制）**：Read [references/layouts.md](references/layouts.md) → 确定布局引擎（默认 dagre）
1. 确认需求：图类型、输出格式（默认 SVG）
2. 写 `.d2` 文件——**位置不固定，放在当前项目内即可，由用户指定或按项目约定**（如 `docs/diagrams/`、项目根目录等），按需在文件头设 `vars: { d2-config: { layout-engine: <engine> } }`
3. 格式化自检：`d2 fmt --check <file>.d2`（未格式化则 `d2 fmt <file>.d2`）
4. 校验：`d2 validate <file>.d2`（失败则修到通过）
5. 渲染：`d2 <file>.d2 <file>.svg`——**SVG 必须输出到与 `.d2` 相同的目录**（`docs/diagrams/foo.d2` → `docs/diagrams/foo.svg`；`.d2` 在项目根 → SVG 也在项目根）。**不执行 `open`，不打开浏览器**。⚠️ 多板图（layers/scenarios/steps）输出为目录结构（`foo/layers/xxx.svg`、`foo/scenarios/yyy.svg`…），属 d2 固有行为——每张 SVG 都要单独自检
6. **PNG 识图自检（强制，macOS）**：
   a. 转换：`mkdir -p "$TMPDIR/d2png"` 然后执行 `sips -s format png "<file>.svg" --out "$TMPDIR/d2png/$(basename "<file>")-$(date +%Y%m%d%H%M%S).png"`——**输出到 macOS 每用户私有临时目录 `$TMPDIR/d2png/`**（避免 `/tmp` 共享目录的符号链接与跨用户可读问题），**文件名必须带时间戳且用 `$(basename ...)` 取裸文件名**（`<file>` 可能含目录路径，如 `docs/diagrams/foo`，basename 后才是 `foo`），避免重复渲染时旧 PNG 被覆盖/误读。用 macOS 自带 `sips` 转 PNG，**不需要 d2 装 Chromium**
   b. 识别：用系统可用的**识图工具**（如 `MiniMax_understand_image`）查看该 PNG，按 [references/diagram-review.md](references/diagram-review.md) 清单逐项审查（A 结构：方向流/层级/连线标签/节点顺序/容器层级；B 内容：图与源码一致/箭头语义/信息完整；C 识图工具局限、D 使用注意参见清单）
   c. 发现问题 → 修改 `.d2` → 重跑第 3-6 步（fmt → validate → 渲染 → PNG 自检），**最多 3 轮**；第 3 轮后仍有问题则如实报告剩余问题
   d. 多板图：对每张 SVG 分别执行 a-b；**非 macOS、sips 不可用、或识图工具不可用时**，降级为 Read `.d2` 源码核对 + `d2 validate` 校验，并在报告注明"未做 PNG 自检（原因）"
7. 报告：文件路径 + 渲染结果（exit 0 / SVG 大小）+ 自检结论

完成标准：渲染命令 exit 0 且 SVG 生成在与 `.d2` 相同目录（多板图为目录结构，见第 5 步）；PNG 识图自检通过（或 3 轮后如实报告剩余问题；非 macOS/工具不可用降级后注明）。

---

## 3. 完整语法参考（内嵌官方 Cheat Sheet + Tour 关键内容）

> 调此 skill 不必再去查 d2lang.com——以下为官方 Cheat Sheet 与 Tour 关键内容的完整内嵌。

### 3.1 基础语法（Tour / Hello World）

```d2
direction: down              # 主方向：down/right/left/up

# 节点定义（label 在 : 后）
server                       # 简单标识符
"带空格的节点"
server: "服务器"               # 带中文标签
server.label: "动态标签"      # 后置 label

# 边（边可带 label、样式）
a -> b                        # 有向
a -- b                        # 无向
a <-> b                       # 双向
a -> b: "GET /api"            # 边标签
a -> b: "调用" { style.stroke: red }
a.a -> b.b                    # 端口连接（节点进出口显式定义 id 用 .a/.b）

# 容器（层级与命名空间）
network: {
  cloud: "云端"
  lb: "负载均衡"
  app: { web: "Web"; worker: "Job" }   # 嵌套容器
}
network.lb -> network.app
network.app -> db: "SQL"

# 导入与变量（大图模块化）
import other.d2                # 引入其他 .d2
vars: { env: "prod"; region: "us-east-1" }
api: "API ({vars.env})"
db: "DB-{vars.region}" { shape: cylinder }
```

### 3.2 Shapes 完整列表（节点形状）

```d2
a: { shape: rectangle }       # 默认矩形
b: { shape: oval }
c: { shape: diamond }         # 决策
d: { shape: parallelogram }    # 输入/输出
e: { shape: page }            # 文档
f: { shape: cylinder }        # 数据库/存储
g: { shape: queue }           # 消息队列
h: { shape: package }         # 包/模块
i: { shape: hexagon }         # 进程/服务
j: { shape: cloud }           # 云
k: { shape: person }          # 用户/角色
l: { shape: stored_data }     # 数据存储
m: { shape: document }        # 文档
n: { shape: queue }            # 队列
o: { shape: class }           # 类（也可用 class_diagram）
p: { shape: image; icon: https://icons.terrastruct.com/aws/Compute/Amazon-EC2.svg }  # 图标
q: { shape: text }            # 纯文本节点
r: { shape: callout }         # 标注气泡
s: { shape: stored_data }     # 数据存储（同 l）
t: { shape: timeline }        # 时间线
u: { shape: step }            # 步骤
```

### 3.3 内置 Diagrams（整图类型）

设置 `shape: <type>` 切换整图为指定类型，所有边自动按该类型渲染：

```d2
# 在文件第一行加 shape: <type> 切换整图类型
shape: sequence_diagram
shape: class_diagram
shape: state_machine_diagram
shape: sql_table
shape: c4
shape: archimate
shape: network
shape: sankey
```

| 类型                    | 适合场景                                    |
| ----------------------- | ------------------------------------------- |
| `sequence_diagram`      | 时序/消息流/API 调用顺序                    |
| `class_diagram`         | OOP 类结构、领域模型                        |
| `state_machine_diagram` | 状态流转（订单/工单/协议）                  |
| `sql_table`             | 数据库 ER 表（自动识别 `constraint:` 字段） |
| `c4`                    | C4 架构（Context/Container/Component/Code） |
| `archimate`             | 企业架构（archiMate 标准）                  |
| `network`               | 网络拓扑                                    |
| `sankey`                | 桑基图（流量/能量）                         |

### 3.4 样式完整属性（Tour / Customization）

```d2
node: "标题" {
  style: {
    # 颜色
    fill: "#b3d9ff"           # 背景填充
    stroke: "#003366"         # 边框
    stroke-width: 2           # 边框粗细
    stroke-dash: 4            # 虚线（4=长虚线，3=短）
    opacity: 0.8              # 透明度

    # 形状
    border-radius: 10         # 圆角

    # 文字
    font-color: "#003366"
    font-size: 18
    font: mono                 # 等宽（mono/sans/serif/handwritten）
    bold: true
    italic: true
    underline: true
    underline-color: red

    # 尺寸
    width: 200                 # 节点宽
    height: 80                # 节点高
    min-width: 150
    min-height: 60

    # 阴影/3D（3D 需要 dagre 或 ELK 布局）
    shadow: true
  }
}

# 边样式
edge: {
  style: {
    stroke: red
    stroke-width: 2
    stroke-dash: 5
    target-arrowhead: { shape: triangle }   # 箭头：triangle/arrow/diamond/circle/box/cf-one/cf-one-required/cf-many/cf-many-required/cross
    source-arrowhead: { shape: none }
    target-arrowhead.label: "MSG"           # 箭头标签
  }
}

# 容器样式
container: {
  style: {
    fill: "#fff8e1"
    stroke: "#d4a000"
    stroke-width: 2
    border-radius: 12
    opacity: 0.5
  }
}
```

### 3.5 网格布局（Tour / Hello World 进阶）

```d2
dashboard: {
  grid-columns: 3            # 每行 3 个节点
  grid-gap: 30               # 节点间距
  grid-rows: 2               # 也可显式行数

  a; b; c                    # 简写：3 个未定义节点
  d: "模块 D"; e: "模块 E"; f: "模块 F"
}

# 也可仅指定 grid-columns，不指定行数（自动换行）
```

### 3.6 多板：layers / scenarios / steps（Tour / Composition）

```d2
direction: right
layers: {                    # 并列展示
  frontend: { web; mobile }
  backend: { api; db }
}

scenarios: {                 # 场景对比（同一图不同情况）
  happy: { user -> api: "GET" }
  error: { user -> api: "500" { style.stroke: red } }
}

steps: {                     # 逐步演进（可加 --animate-interval 动画）
  step1: { a; b }
  step2: { a -> b }
  step3: { a -> b; b -> c }
}
```

**动画导出**：`d2 --animate-interval=1000 x.d2 x.svg`（steps 板自动循环切换）

### 3.7 全局方向与变量

```d2
direction: down              # 全局：down/right/left/up

vars: {                      # 变量
  env: "prod"
  region: "us-east-1"
  ttl: 3600
}
api: "API ({vars.env})"
db: "DB-{vars.region}"

# globs：批量样式
*.style.fill: "#f0f0f0"      # 所有顶层节点
**.style.stroke: blue          # 所有边
internal.** -> external.**: { style.stroke-dash: 3 }  # 边匹配
```

### 3.8 完整导出选项（Tour / Exports）

```bash
d2 in.d2 out.svg              # 默认 SVG
d2 in.d2 out.png              # 需 Playwright
d2 in.d2 out.pdf              # 需 Playwright
d2 in.d2 out.pptx             # PowerPoint（每 board 一页）
d2 in.d2 out.gif              # 需 ffmpeg
d2 --animate-interval=1000 in.d2 out.svg  # steps 板动画
d2 --ascii-mode standard in.d2 out.txt  # ASCII 输出（standard/extended）
d2 --bundle=true in.d2 out.svg  # 嵌入字体/依赖到单文件
d2 --theme=200 in.d2 out.svg  # 主题 ID：0=Default 100=Neutral Gray 200=Flagship 300=Shirley（d2 themes 看全部）
d2 --pad=20 in.d2 out.svg     # 边距
d2 --sketch=true in.d2 out.svg  # 手绘风格
d2 --font=mono in.d2 out.svg  # 等宽字体
```

### 3.9 CLI 完整子命令

```bash
d2 fmt <file>.d2             # 格式化
d2 fmt --check <file>.d2     # 检查格式（不改）
d2 validate <file>.d2        # 校验
d2 --watch --browser=0 <file>.d2 <out>  # 热重载预览（-w flag；--browser=0 不弹浏览器，仅用户要求时用）
d2 <in> <out>                # 渲染
d2 --layout=dagre in.d2 out.svg     # dagre（默认）
d2 --layout=elk in.d2 out.svg       # elk（紧凑）
d2 --layout=tala in.d2 out.svg      # tala（架构图专用，需独立二进制）
d2 --theme=200 in.d2 out.svg        # 主题（0=Default 100=Neutral 200=Flagship 300=Shirley）
d2 --help                     # 详细帮助
d2 version                    # 版本
```

### 3.10 Tour 关键章节摘要（已本地化到 references/，无需联网）

> 下表对应文件均在 `references/` 目录（本 SKILL.md 同目录下），内容已内联全部代码示例，可直接复制使用。原始出处为 d2lang.com/tour/。

| Tour 章节       | 关键内容                                                             | 本地文件                                                   |
| --------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| Introduction    | Hello World 示例、第一个 .d2、运行 `d2 input.d2 output.svg` 渲染出图 | [references/intro.md](references/intro.md)                 |
| Hello World     | 第一个示例：`x -> y: hello world`                                    | [references/hello-world.md](references/hello-world.md)     |
| Shapes          | 节点形状语法（3.2 节完整列表）、1:1 比例形状                         | [references/shapes.md](references/shapes.md)               |
| Connections     | 边类型（无向/有向/标签/样式/箭头）、引用连接                         | [references/connections.md](references/connections.md)     |
| Containers      | 容器语法（嵌套/命名空间/父引用）                                     | [references/containers.md](references/containers.md)       |
| SQL Tables      | `sql_table` ER 图、外键连接                                          | [references/sql-tables.md](references/sql-tables.md)       |
| Layouts         | 布局引擎总览 + 方向                                                  | [references/layouts.md](references/layouts.md)             |
| Dagre           | 默认布局引擎：特点/局限                                              | [references/dagre.md](references/dagre.md)                 |
| ELK             | 布局引擎：特点/局限                                                  | [references/elk.md](references/elk.md)                     |
| TALA            | 架构图专用引擎：特点/局限                                            | [references/tala.md](references/tala.md)                   |
| Positions       | 位置控制：`near` 锚点 / `top` / `left`                               | [references/positions.md](references/positions.md)         |
| Grid            | 网格布局：`grid-columns` / `grid-rows`                               | [references/grid-diagrams.md](references/grid-diagrams.md) |
| Composition     | layers/scenarios/steps 多板                                          | [references/composition.md](references/composition.md)     |
| Imports         | 多文件模块化、globs 批量样式                                         | [references/imports.md](references/imports.md)             |
| Customization   | 主题、字体、3D、阴影                                                 | [references/themes.md](references/themes.md)               |
| Exports         | 3.8 节完整导出                                                       | [references/exports.md](references/exports.md)             |
| CLI manual      | `d2` 全部子命令与参数                                                | [references/man.md](references/man.md)                     |
| Cheat Sheet     | 一页速查 PDF（预览图页）                                             | [references/cheat-sheet.md](references/cheat-sheet.md)     |
| FAQ             | 常见问题（动画/LSP/CI/字体等）                                       | [references/faq.md](references/faq.md)                     |
| Troubleshooting | 故障排查                                                             | [references/troubleshoot.md](references/troubleshoot.md)   |

### 3.11 关键 Tour 例句（推荐记住）

```d2
# Hello World (Tour/Hello World)
x -> y: "go go go"
y -> z

# Nested + direction (Tour/Containers)
direction: down
parent: {
  child_a: { shape: hexagon }
  child_b: { shape: rectangle }
}
parent.child_a -> parent.child_b: "data flow"

# Step 1 -> Step 2 (Tour/Composition)
direction: right
steps: {
  s1: { a; b }
  s2: { a -> b }
}
```

### 3.12 实战经验（基于实测 / 社区共识）

- **复杂图（>15 节点）**用 ELK 而非 dagre（更紧凑）
- **架构分层图**用 `vars: { d2-config: { layout-engine: elk } }` 设默认
- **边太长/交错**：改用 `direction: right`、加 `grid-columns` 强制布局、或拆子图
- **中文字符串**必须用引号包起来，否则解析失败
- **样式不生效**：99% 是漏了 `.style.` 前缀或 `:` 后没空格

---

## 4. 实战模板（可直接复制改用）

### 4.1 简单 A→B 关系图

```d2
direction: right
user -> frontend: "HTTPS"
frontend -> backend: "REST"
backend -> database: "SQL"
```

### 4.2 分层架构（带容器）

```d2
direction: down
frontend: { web: "Web App"; mobile: "Mobile App" }
backend: { api: "REST API"; worker: "Job Worker" }
data: { postgres: { shape: cylinder }; redis: { shape: cylinder } }
frontend.web -> backend.api
backend.api -> data.postgres
backend.worker -> data.redis
```

### 4.3 条件分支（IF）

```d2
direction: right
start: "Webhook\n(触发)" { shape: parallelogram }
check: "天气好？" { shape: diamond; style.fill: "#fff2cc" }
if_yes: "订机票" { shape: rectangle }
if_no: "订火车" { shape: rectangle }
end: "完成" { shape: oval; style.fill: "#d5e8d4" }
start -> check
check -> if_yes: "YES" { style.stroke: "#82b366" }
check -> if_no: "NO" { style.stroke: "#b85450" }
if_yes -> end
if_no -> end
```

### 4.4 序列图

```d2
shape: sequence_diagram
user -> frontend: "点击登录"
frontend -> auth_api: "POST /login"
auth_api -> db: "SELECT user"
db -> auth_api: "用户记录"
auth_api -> frontend: "JWT token"
frontend -> user: "登录成功"
```

### 4.5 ER 图

```d2
users: {
  shape: sql_table
  id: int { constraint: primary_key }
  email: varchar { constraint: unique }
  name: varchar
}
orders: {
  shape: sql_table
  id: int { constraint: primary_key }
  user_id: int { constraint: foreign_key }
  total: decimal
}
users.id -> orders.user_id
```

### 4.6 状态机

```d2
shape: state_machine_diagram
待支付 -> 已支付: "付款"
已支付 -> 配送中: "发货"
配送中 -> 已签收
已签收 -> 已完成: "15 天后"
```

### 4.7 AWS 云架构（Icons 库）

```d2
direction: down
user: "用户" { shape: person }
cf: "CloudFront" { shape: image; icon: https://icons.terrastruct.com/aws/Networking-Content-Delivery/Amazon-CloudFront.svg }
s3: "S3" { shape: image; icon: https://icons.terrastruct.com/aws/Storage/Amazon-S3.svg }
apigw: "API GW" { shape: image; icon: https://icons.terrastruct.com/aws/Networking-Content-Delivery/Amazon-API-Gateway.svg }
lambda: "Lambda" { shape: image; icon: https://icons.terrastruct.com/aws/Compute/AWS-Lambda.svg }
ddb: "DynamoDB" { shape: image; icon: https://icons.terrastruct.com/aws/Database/Amazon-DynamoDB.svg }
user -> cf
cf -> s3
cf -> apigw
apigw -> lambda
lambda -> ddb
```

### 4.8 看板/仪表盘（grid 强制布局）

```d2
kanban: {
  style.fill: "#e8e8e8"
  grid-columns: 3
  grid-gap: 40
  todo: "TODO" { style.fill: "#fff2cc" }
  doing: "DOING" { style.fill: "#dae8fc" }
  done: "DONE" { style.fill: "#d5e8d4" }
  task1: "写文档" { shape: rectangle }
  task2: "修 bug" { shape: rectangle }
  task3: "部署" { shape: rectangle }
  todo -> task1
  doing -> task2
  done -> task3
}
```

---

## 5. 常见陷阱（LLM 易错点）

1. **样式语法**：`node.style.fill: "#eee"` —— `:` 后**带空格**，别漏 `.style.`
2. **容器缩进**：容器内节点缩进 2 空格，花括号 `{ }` 必须闭合
3. **`shape:` 位置**：写在节点 value 的第二行，不是边标签
4. **SVG 需 Web 查看**：D2 SVG 依赖 CSS + foreignObject，Inkscape/纯文本查看会乱
5. **中文字符串**：必须用引号 `"中文节点"`，否则解析失败
6. **imports 路径**：相对路径以当前 .d2 文件所在目录为基准
7. **size 估计**：复杂图（>15 节点）记得用 elk 布局
8. **缩略图嵌入**：`shape: image; icon: <url>` 的 url 必须 HTTPS 且公开可访问

---

## 6. 验证命令

```bash
# 语法检查（输出未格式化文件列表）
d2 fmt --check <file>.d2

# 校验（错误指出行号）
d2 validate <file>.d2

# 渲染
d2 <file>.d2 <file>.svg
# 多种导出
d2 <file>.d2 <file>.png       # 需 Playwright
d2 <file>.d2 <file>.pdf       # 需 Playwright
d2 <file>.d2 <file>.pptx

# 实时预览（会拉起浏览器；可用 --browser=0 关闭浏览器弹窗。仅用户明确要求时使用；默认不用）
d2 --watch --browser=0 <file>.d2 <file>.svg

# 主题（0=Default 100=Neutral 200=Flagship 300=Shirley，`d2 themes` 查看全部）
d2 --theme 200 <file>.d2 <file>.svg

# 布局引擎（复杂图用 elk 更清晰）
d2 --layout=elk <file>.d2 <file>.svg
# 或在 .d2 文件内设默认：
# vars: { d2-config: { layout-engine: elk } }

# 动画（steps 板自动切换）
d2 --animate-interval=1000 <file>.d2 <file>.svg
```

完成标准：`d2 <file>.d2 <file>.svg` exit 0 且 SVG 生成在与 `.d2` 相同目录；完整流程见 §2 工作流（含 PNG 识图自检与 3 轮上限）。

---

## 7. 排版布局（引擎 / 方向 / 位置 / 网格）

### 7.1 布局引擎选择

| 引擎              | 排版风格                               | 何时用                                     | 设置                                                                                     |
| ----------------- | -------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **dagre**（默认） | 分层/层级布局（Graphviz DOT 算法）     | 节点 ≤ 15、边 ≤ 25、通用                   | `d2 in.d2 out.svg`                                                                       |
| **ELK**           | 层级布局（正交布线，交叉最少）         | 节点多/边密/端口连接/容器嵌套——布局更紧凑  | `d2 --layout=elk in.d2 out.svg` 或在文件内 `vars: { d2-config: { layout-engine: elk } }` |
| **TALA**          | 通用正交布局（非层级也可），架构图专用 | 架构图/需手动锁位/非层级图（需独立二进制） | 单独安装 `install.sh --tala`，文件内 `vars: { d2-config: { layout-engine: tala } }`      |

**经验**：模块架构图（容器分层）显著 elk > dagre。查看可用引擎：`d2 layout`。

### 7.2 各引擎能力差异（决定排版能力上限）

| 能力                             | dagre        | ELK | TALA     |
| -------------------------------- | ------------ | --- | -------- |
| `direction` 全局方向             | ✓            | ✓   | ✓        |
| `direction` 每容器独立方向       | ✗            | ✗   | ✓        |
| `near: 锚点`（top-left 等 8 点） | ✓            | ✓   | ✓        |
| `near: <对象ID>`（靠近某形状）   | ✗            | ✗   | ✓        |
| `top` / `left` 锁定坐标          | ✗            | ✗   | ✓        |
| 容器宽高 `width`/`height`        | ✗            | ✓   | 即将支持 |
| 对称性优先                       | ✗            | ✗   | ✓        |
| 容器→子容器连线                  | ✗（需 shim） | ✓   | ✓        |

### 7.3 方向（direction）

```d2
direction: up | down | right | left   # 全局流向（默认 down）
```

每容器独立方向（仅 TALA）：

```d2
vars: { d2-config: { layout-engine: tala } }
direction: down
b: {
  direction: right   # 容器内单独流向
  1 -> 2 -> 3
}
```

### 7.4 位置控制（near / top / left）

`near` 锚点把对象钉在图周围 8 个点——常用于标题、图例、说明文字：

```d2
title: "架构图" { near: top-center }        # top-left/top-center/top-right
legend: { ... } { near: bottom-right }      # center-left/center-right/bottom-*
```

label/icon 定位额外支持 `outside-` 前缀（放形状外）与 `border-` 前缀（放边框）：

```d2
server: DB {
  label: "数据库" { near: outside-bottom-center }
}
```

TALA 专属：`near: <对象ID>` 靠近指定形状；`top` / `left` 直接锁定坐标（引擎只移动周围对象）。

### 7.5 网格布局（看板/仪表盘）

```d2
dashboard: {
  grid-columns: 3            # 每行 3 个节点（自动换行）
  grid-gap: 30               # 节点间距
  grid-rows: 2               # 可选，显式行数
  a; b; c
  d: "模块 D"; e: "模块 E"; f: "模块 F"
}
```

### 7.6 选型速查

- 通用小图 → **dagre**（默认零配置）
- 复杂/容器多/边密 → **ELK**（布线整齐、交叉最少）
- 架构图/要手动摆位 → **TALA**（`top`/`left`/`near` 对象、对称性）
- 看板/仪表盘 → `grid-columns` 强制布局
- 详细官方文档见 [references/layouts.md](references/layouts.md) / [references/dagre.md](references/dagre.md) / [references/elk.md](references/elk.md) / [references/tala.md](references/tala.md) / [references/positions.md](references/positions.md) / [references/grid-diagrams.md](references/grid-diagrams.md)

---

## 8. 导出格式速查

| 格式        | 命令                                       | 用途                                   |
| ----------- | ------------------------------------------ | -------------------------------------- |
| SVG（默认） | `d2 in.d2 out.svg`                         | Web 嵌入、浏览器查看                   |
| PNG         | `d2 in.d2 out.png`                         | 文档/PPT（首次下载 Playwright ~150MB） |
| PDF         | `d2 in.d2 out.pdf`                         | 打印、高保真                           |
| PPTX        | `d2 in.d2 out.pptx`                        | 演示文稿（每板一页）                   |
| GIF         | `d2 --animate-interval=1000 in.d2 out.gif` | 动画                                   |
| ASCII       | `d2 --ascii-mode standard in.d2 out.txt`   | 终端查看（standard/extended）          |

---

## 9. 安装位置（opencode/Claude Code skill）

| 范围               | 路径                                                                      | 加载时机                                          |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| 项目级（仅本项目） | `.opencode/skills/d2/SKILL.md` 或 `<项目>/skills/d2/SKILL.md`             | opencode 在该目录启动时加载                       |
| 用户级（所有项目） | `~/.config/opencode/skills/d2/SKILL.md` 或 `~/.agents/skills/d2/SKILL.md` | opencode 任何目录启动时加载（自动对所有项目生效） |

**本 skill 文件通用**（含 CLI/语法/模板）——可直接放项目级或用户级。

---

## 附录：参考链接

- 官方 Tour（完整文档已本地化到 [references/](references/)，联网对照用）：https://d2lang.com/tour/intro/
- Cheat Sheet（PDF 下载页）：https://d2lang.com/tour/cheat-sheet/
- CLI manual：`d2 --help` / `man d2` / https://d2lang.com/tour/man/（本地见 [references/man.md](references/man.md)）
- 官方示例：https://github.com/d2lang/d2/tree/master/docs/examples
- Icons 库：https://icons.terrastruct.com/（AWS/K8s/GCP/Azure 路径前缀）
- 官方 Play 调试：https://play.d2lang.com
