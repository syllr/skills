---
name: d2
description: 用 D2（d2lang.com）声明式文本画架构图/流程图/时序图/ER 图/状态机——CLI 渲染 SVG/PNG/PDF/PPTX。当用户要画架构图、流程图、时序图、ER 图、状态机、网络拓扑、C4 企业架构、看板或任何关系图时使用。提供 CLI 工作流、语法速查、实战模板与陷阱清单。
---

# D2 画图技能（系统级 · 通用）

> D2（Declarative Diagramming）= 文本转图的声明式语言。`d2 in.d2 out.svg` 一行命令出图。
> 官方：https://d2lang.com/tour/intro/ ｜ Cheat Sheet：https://d2lang.com/tour/cheat-sheet/

---

## 1. 何时用 D2

| 想画什么               | 用 D2 适合吗                              | 替代方案                  |
| ---------------------- | ----------------------------------------- | ------------------------- |
| 架构图/分层图/模块依赖 | ✓ 强项（容器 + 自动布局）                 | drawio（GUI 手摆）        |
| 流程图/时序图/状态机   | ✓ 强项（内置 diagram 类型）               | drawio / PlantUML         |
| ER 图/数据库表         | ✓ 强项（`sql_table` shape）               | dbdiagram.io              |
| 业务时序/消息流/类图   | ✓（`sequence_diagram` / `class_diagram`） | PlantUML / Mermaid        |
| 云架构/微服务          | ✓ + Icons 库（AWS/K8s/GCP）               | drawio + 形状库           |
| 看板/仪表盘            | ✓（`grid-columns` 强制布局）              | drawio / Miro             |
| 思维导图/甘特图/BPMN   | △ 不擅长                                  | XMind / drawio / 专用工具 |

**核心优势**：文本 → git diff 友好 → CI 出图 → LLM 生成；**自动布局**（dagre/ELK）不用手摆坐标。

---

## 2. 安装（用户前置）

D2 是单二进制 Go CLI。

### Mac（最简，官方推荐）

```bash
brew tap terrastruct/d2
brew trust --formula d2    # Homebrew 4.x tap 信任
brew install d2
d2 --version               # 预期 v0.7.x 或 v0.8.x
```

### Linux

```bash
curl -fsSL https://d2lang.com/install.sh | sh -s --
d2 --version
```

### 已有 Go

```bash
go install oss.terrastruct.com/d2/cmd/d2@latest
# 确认 $GOPATH/bin 在 PATH
```

### 网络受限（国内/防火墙）

- brew 卡 GitHub：`export https_proxy=http://127.0.0.1:7897 http_proxy=http://127.0.0.1:7897` 再跑
- 最稳：浏览器代理下载 https://github.com/d2lang/d2/releases 的 `d2-vX.Y.Z-darwin-*.tar.gz`，解压到 `~/.local/bin/`，加 PATH

### 验证

```bash
d2 --version    # 应输出 v0.7.x 或 v0.8.x
d2 --help       # 列出 fmt/validate/watch/export 等子命令
```

---

## 3. 工作流（5 步）

1. 确认需求：图类型、输出格式（默认 SVG）
2. 写 `.d2` 文件（建议放 `docs/diagrams/` 或项目约定目录）
3. 格式化自检：`d2 fmt --check <file>.d2`（未格式化则 `d2 fmt <file>.d2`）
4. 校验：`d2 validate <file>.d2`（失败则修到通过）
5. 渲染：`d2 <file>.d2 <file>.svg`，`open <file>.svg` 看效果

完成标准：渲染命令 exit 0 且 SVG 文件生成。

---

## 4. 完整语法参考（内嵌官方 Cheat Sheet + Tour 关键内容）

> 调此 skill 不必再去查 d2lang.com——以下为官方 Cheat Sheet 与 Tour 关键内容的完整内嵌。

### 4.1 基础语法（Tour / Hello World）

```d2
direction: down              # 主方向：down/right/left/up

# 节点定义（label 在 : 后）
server                       # 简单标识符
"带空格的节点"
server: "服务器"               # 带中文标签
server.label: "动态标签"      # 后置 label

# 边（边可带 label、样式）
a -> b                        # 有向
a <-> b                       # 无向
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

### 4.2 Shapes 完整列表（节点形状）

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

### 4.3 内置 Diagrams（整图类型）

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
shape: mermaid   # 嵌入 Mermaid
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
| `mermaid`               | 嵌入 Mermaid 语法                           |

### 4.4 样式完整属性（Tour / Customization）

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
    target-arrowhead: { shape: triangle }   # 箭头：triangle/arrow/diamond/circle/cross/lasso/cf-many/cf-one/crowfoot/dot
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

### 4.5 网格布局（Tour / Hello World 进阶）

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

### 4.6 多板：layers / scenarios / steps（Tour / Composition）

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

### 4.7 全局方向与变量

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

### 4.8 完整导出选项（Tour / Exports）

```bash
d2 in.d2 out.svg              # 默认 SVG
d2 in.d2 out.png              # 需 Playwright
d2 in.d2 out.pdf              # 需 Playwright
d2 in.d2 out.pptx             # PowerPoint（每 board 一页）
d2 in.d2 out.gif              # 需 ffmpeg
d2 --animate-interval=1000 in.d2 out.svg  # steps 板动画
d2 --ascii in.d2              # ASCII art
d2 --bundle=true in.d2 out.svg  # 嵌入字体/依赖到单文件
d2 --theme=200 in.d2 out.svg  # 0=100=Neutral 200=Cool 300=Dark
d2 --pad=20 in.d2 out.svg     # 边距
d2 --sketch=true in.d2 out.svg  # 手绘风格
d2 --font=mono in.d2 out.svg  # 等宽字体
```

### 4.9 CLI 完整子命令

```bash
d2 fmt <file>.d2             # 格式化
d2 fmt --check <file>.d2     # 检查格式（不改）
d2 validate <file>.d2        # 校验
d2 watch <file>.d2 <out>     # 热重载预览
d2 <in> <out>                # 渲染
d2 --layout=dagre in.d2 out.svg     # dagre（默认）
d2 --layout=elk in.d2 out.svg       # elk（紧凑）
d2 --layout=tala in.d2 out.svg      # tala（架构图专用，需独立二进制）
d2 --theme=100 in.d2 out.svg        # 主题
d2 --help                     # 详细帮助
d2 version                    # 版本
```

### 4.10 Tour 关键章节摘要（直接查阅 d2lang.com/tour/ 对应页）

| Tour 章节       | 关键内容                                                               | URL                 |
| --------------- | ---------------------------------------------------------------------- | ------------------- |
| Introduction    | Hello World 示例、第一个 .d2、运行 `d2 input.d2 output.svg` 开浏览器看 | /tour/intro/        |
| Shapes          | 节点形状语法（4.2 节完整列表）                                         | /tour/shapes/       |
| Connections     | 边类型（无向/有向/标签/样式/箭头）                                     | /tour/connections/  |
| Containers      | 容器语法（嵌套/命名空间）                                              | /tour/containers/   |
| Layouts         | dagre/ELK/TALA 选择 + 网格布局                                         | /tour/layouts/      |
| Composition     | layers/scenarios/steps 多板                                            | /tour/composition/  |
| Imports         | 多文件模块化、globs 批量样式                                           | /tour/imports/      |
| Customization   | 主题、字体、3D、阴影                                                   | /tour/themes/       |
| Exports         | 5.8 节完整导出                                                         | /tour/exports/      |
| Cheat Sheet     | 一页速查 PDF                                                           | /tour/cheat-sheet/  |
| FAQ             | 常见问题（动画/LSP/CI/字体等）                                         | /tour/faq/          |
| Troubleshooting | 故障排查                                                               | /tour/troubleshoot/ |

### 4.11 关键 Tour 例句（推荐记住）

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

### 4.12 实战经验（基于实测 / 社区共识）

- **复杂图（>15 节点）**用 ELK 而非 dagre（更紧凑）
- **架构分层图**用 `vars: { d2-config: { layout-engine: elk } }` 设默认
- **边太长/交错**：改用 `direction: right`、加 `grid-columns` 强制布局、或拆子图
- **中文字符串**必须用引号包起来，否则解析失败
- **样式不生效**：99% 是漏了 `.style.` 前缀或 `:` 后没空格

---

## 5. 实战模板（可直接复制改用）

### 5.1 简单 A→B 关系图

```d2
direction: right
user -> frontend: "HTTPS"
frontend -> backend: "REST"
backend -> database: "SQL"
```

### 5.2 分层架构（带容器）

```d2
direction: down
frontend: { web: "Web App"; mobile: "Mobile App" }
backend: { api: "REST API"; worker: "Job Worker" }
data: { postgres: { shape: cylinder }; redis: { shape: cylinder } }
frontend.web -> backend.api
backend.api -> data.postgres
backend.worker -> data.redis
```

### 5.3 条件分支（IF）

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

### 5.4 序列图

```d2
shape: sequence_diagram
user -> frontend: "点击登录"
frontend -> auth_api: "POST /login"
auth_api -> db: "SELECT user"
db -> auth_api: "用户记录"
auth_api -> frontend: "JWT token"
frontend -> user: "登录成功"
```

### 5.5 ER 图

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
users.id < orders.user_id
```

### 5.6 状态机

```d2
shape: state_machine_diagram
待支付 -> 已支付: "付款"
已支付 -> 配送中: "发货"
配送中 -> 已签收
已签收 -> 已完成: "15 天后"
```

### 5.7 AWS 云架构（Icons 库）

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

### 5.8 看板/仪表盘（grid 强制布局）

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

## 6. 常见陷阱（LLM 易错点）

1. **样式语法**：`node.style.fill: "#eee"` —— `:` 后**带空格**，别漏 `.style.`
2. **容器缩进**：容器内节点缩进 2 空格，花括号 `{ }` 必须闭合
3. **`shape:` 位置**：写在节点 value 的第二行，不是边标签
4. **SVG 需 Web 查看**：D2 SVG 依赖 CSS + foreignObject，Inkscape/纯文本查看会乱
5. **中文字符串**：必须用引号 `"中文节点"`，否则解析失败
6. **imports 路径**：相对路径以当前 .d2 文件所在目录为基准
7. **size 估计**：复杂图（>15 节点）记得用 elk 布局
8. **缩略图嵌入**：`shape: image; icon: <url>` 的 url 必须 HTTPS 且公开可访问

---

## 7. 验证命令

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

# 实时预览（浏览器开 SVG，改 .d2 自动刷新）
d2 --watch <file>.d2 <file>.svg

# 主题（0~300，100=浅，200=中性，300=深色）
d2 --theme 200 <file>.d2 <file>.svg

# 布局引擎（复杂图用 elk 更清晰）
d2 --layout=elk <file>.d2 <file>.svg
# 或在 .d2 文件内设默认：
# vars: { d2-config: { layout-engine: elk } }

# 动画（steps 板自动切换）
d2 --animate-interval=1000 <file>.d2 <file>.svg
```

完成标准：`d2 <file>.d2 <file>.svg` exit 0 且 SVG 文件生成。

---

## 8. 布局引擎选择

| 引擎              | 何时用                                     | 设置                                                                                     |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **dagre**（默认） | 节点 ≤ 15、边 ≤ 25、通用                   | `d2 in.d2 out.svg`                                                                       |
| **ELK**           | 节点多/边密/端口连接——布局更紧凑           | `d2 --layout=elk in.d2 out.svg` 或在文件内 `vars: { d2-config: { layout-engine: elk } }` |
| **TALA**          | 架构图专用（需独立二进制，brew d2 包不含） | 单独 `install.sh --tala`                                                                 |

**经验**：模块架构图（容器分层）显著 elk > dagre。

---

## 9. 导出格式速查

| 格式        | 命令                                       | 用途                                   |
| ----------- | ------------------------------------------ | -------------------------------------- |
| SVG（默认） | `d2 in.d2 out.svg`                         | Web 嵌入、浏览器查看                   |
| PNG         | `d2 in.d2 out.png`                         | 文档/PPT（首次下载 Playwright ~150MB） |
| PDF         | `d2 in.d2 out.pdf`                         | 打印、高保真                           |
| PPTX        | `d2 in.d2 out.pptx`                        | 演示文稿（每板一页）                   |
| GIF         | `d2 --animate-interval=1000 in.d2 out.gif` | 动画                                   |
| ASCII       | `d2 --ascii in.d2`                         | 终端查看                               |

---

## 10. 安装位置（opencode/Claude Code skill）

| 范围               | 路径                                                                      | 加载时机                                          |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| 项目级（仅本项目） | `.opencode/skills/d2/SKILL.md` 或 `<项目>/skills/d2/SKILL.md`             | opencode 在该目录启动时加载                       |
| 用户级（所有项目） | `~/.config/opencode/skills/d2/SKILL.md` 或 `~/.agents/skills/d2/SKILL.md` | opencode 任何目录启动时加载（自动对所有项目生效） |

**本 skill 文件通用**（含安装/CLI/语法/模板）——可直接放项目级或用户级。

---

## 附录：参考链接

- 官方 Tour：https://d2lang.com/tour/intro/
- Cheat Sheet：https://d2lang.com/tour/cheat-sheet/
- CLI manual：`d2 --help` / `man d2` / https://d2lang.com/tour/man/
- 官方示例：https://github.com/d2lang/d2/tree/master/docs/examples
- Icons 库：https://icons.terrastruct.com/（AWS/K8s/GCP/Azure 路径前缀）
- 官方 Play 调试：https://play.d2lang.com
