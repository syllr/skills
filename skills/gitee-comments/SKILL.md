---
name: gitee-comments
description: >
  管理 Gitee 仓库的评审评论：程序化记录评审意见、列出未解决待办清单、回复评论线程、
  解决/删除评论。用于评审文档或代码时在 Gitee 服务端留痕，AI 与团队成员共用一套机制。
  触发词：评审评论、提交评论、review comment、评审意见、待办评论、解决评论、回复评论、
  @ 同事评审、gitee 评论、查看未解决意见。当用户需要在 Gitee 上给**当前仓库当前分支的某文件某几行**提交评审意见、
  查询所有未解决的评审意见、回复一条评审评论、或把某条评审意见标记为已解决时使用此技能。
allowed-tools: Bash
---

# Gitee 评审评论（文件/文档行级意见）

对 Gitee 仓库的**当前分支某文件某几行**进行评审评论管理（承载 commit 与隐藏规则见「机制事实」）。评审意见存在 Gitee 服务端，不进入 git 对象，对 git 本身零影响。

> 本 skill 只做「评审评论」域（增删查改回）。**不**做 PR/Issue 操作——那是 Gitee 官方 MCP 的职责。

## 机制事实（给 AI 看，已实测 2026-08-29）

> **⚠️ commit 对用户隐藏**：下述 commit 仅是底层实现载体，向用户沟通时**只讲「文件:行区间」**，不要出现 sha/commit 字样。承载 commit 由 skill 自动选定（默认当前分支最新提交），用户无感。

- **评论必然依托某个 commit**：创建端点是 `POST /repos/{owner}/{repo}/commits/{sha}/comments`，`sha` 是必填路径参数；`GET /repos/{owner}/{repo}/comments` 及其 `/{id}` 管理端点注释均为「Commit 评论」。**没有不挂 commit 的独立仓库评论**。
- **Gitee 不支持真正的行锚定**：尽管官方文档为 `POST /comments` 列出 `path`（文件相对路径）+ `position`（Diff 相对行数），**实测服务器会静默忽略这两个参数**——POST 后响应仅含 `id/body/user/source/target(issue:null,pull:null)/时间`，无任何行/文件字段。即无法像 GitHub/GitLab 那样把评论精确锚定到某文件某行。
- **定位只能靠 body 内的 `location` 文本约定**：如 `location: docs/L1/USER-STORY.md:55-69`。这就是本 skill 把「文件:行区间」写进 body 的原因。

## 何时使用

- 评审项目内**任一文件**（Markdown 文档、代码、图片 PNG、配置文件等）时，需要程序化记录评审意见
- 需要按「文件:行区间」定位评审意见（Gitee 无行锚定，见「机制事实」，定位靠 body 的 `location` 文本）
- 需要查询所有未解决的评审意见（待办清单）
- 需要回复一位同事/对方 Agent 的评审意见（评论区，非私聊）
- 需要把一条评审意见标记为【已解决】或删除（删除即解决，清空即本轮评审闭环）

## CLI 可用性（无需预检，失败才提示安装）

**默认直接执行** `gitee api` 命令即可（绝大多数情况已安装）。**不要**每次先 `command -v gitee` 预检——那是浪费 token。仅当执行**失败**时才按退出码走降级/提示：

| 执行结果 / 退出码                | 场景             | 处理                                                  |
| -------------------------------- | ---------------- | ----------------------------------------------------- |
| 退出码 0                         | 成功             | 直接返回结果                                          |
| `command not found` / 退出码 127 | CLI 未安装       | **停止并提示**用户手动安装 + 登录，装好再继续（见下） |
| 退出码 5 / 认证错误              | 未登录或凭据失效 | **提示**用户先 `gitee auth login`                     |

**CLI 未安装时的提示**（让用户自行执行，**不代装**）：

```bash
npm install -g @gitee/gitee-cli
gitee auth login
```

> ⚠️ 本 skill **不替你安装**、不做任何 token/凭据处理。认证由 `gitee auth login` 的登录凭据承担，
> 调用时用 `gitee api` 自动读取 `~/.config/gitee/credentials.yml`。
>
> **重入语义**：CLI 缺失造成失败后，用户装好并登录，重新调用本 skill 即自动放行，无需修改 skill。

## 参数解析规则

| 参数         | 默认来源                                                                                                                                                                          | 说明                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `owner/repo` | `git remote get-url origin` 解析（如 `git@gitee.com:syllr/enterprise-ai-hub.git` → `syllr/enterprise-ai-hub`）；可用 `--repo owner/repo` 覆盖                                     | 用户可感知（仓库）                               |
| `sha`        | **承载 commit，自动选定，用户无感**。规则见下方「承载 commit 决策链」——默认当前分支的*远程最新* sha（`git ls-remote origin refs/heads/<分支>`），兜底 `gitee api branches/<分支>` | **内部承载，不向用户暴露**；仅调试/管理时给到 AI |

解析 `owner/repo` 并校验是否为 Gitee 仓库：

> **参数映射**：用户传 `--repo owner/repo` → 注入环境变量 `REPO_OVERRIDE`（AI 在调用命令时把 `--repo` 的值设为该变量）。`REPO_OVERRIDE` 存在时，`repo` 直接用它的值，跳过 origin 解析与 host 校验。

```bash
# ① 用户显式 --repo owner/repo（=REPO_OVERRIDE）→ repo 直接用该值，跳过 origin 解析与 host 校验
if [ -n "$REPO_OVERRIDE" ]; then
  repo="$REPO_OVERRIDE"
else
  # ② 否则从 origin 解析
  url=$(git remote get-url origin)
  host=$(echo "$url" | sed -E 's#(https?|ssh|git)://##; s#git@##; s#[:/].*##')
  repo=$(echo "$url" | sed -E 's#.*[:/]([^/]+)/([^/.]+)(\.git)?$#\1/\2#')
  # ③ 校验：默认（未显式 --repo）时，remote host 必须是 gitee.com
  [ "$host" != "gitee.com" ] && echo "⚠️ 当前仓库不是 Gitee 仓库（remote host = $host）。本 skill 只能操作 Gitee 仓库的评论，流程结束。若目标确是 Gitee 仓库，请用 --repo owner/repo 显式指定。" && exit 1
fi
```

- **显式传 `--repo owner/repo` 时跳过 host 校验**——信任用户指定的目标仓库（此时本地 `origin` 可能不是 Gitee，但评审目标是 Gitee 仓库）。`repo` 取 `REPO_OVERRIDE` 值。
- 未传 `--repo` 时，host 非 `gitee.com` → **提示并结束**（本 skill 不操作非 Gitee 仓库）。

## 承载 commit 决策链（给 AI 看；对用户隐藏）

> 评论必须依托 commit（commit 对用户隐藏，见「机制事实」）。用户只给「分支(可选) + location」，承载 sha 由 AI 按本链自动选定，不向用户展示 sha/commit 字样。分支名同时用于 body 的 `branch:` 标注。

**Step 1 确定分支名（用户可感知）**：

1. 用户显式指定 `--branch <名>` → 用之
2. 否则 `git branch --show-current`（本地检出分支）
3. 为空（detached/CI）→ CI 环境变量 `${GIT_BRANCH:-${CI_COMMIT_REF_NAME:-${GITHUB_REF#refs/heads/}}}`
4. 仍空 → `git ls-remote --symref origin HEAD` 取远程默认分支
5. 全空 → **问用户**指定分支（唯一需要用户输入的点）

**Step 2 获取承载 sha（保证存在于 Gitee 服务端，只读）**：

```bash
# ① 显式 --repo 指定过：origin 可能不是目标仓库，直接用官方 API（ls-remote 的 sha 会 404）
if [ -n "$REPO_OVERRIDE" ]; then
  sha=$(gitee api -p "/repos/$repo/branches/$branch" | python3 -c 'import json,sys; print(json.load(sys.stdin)["commit"]["sha"])')
else
  # ② 首选：当前分支远程最新（只读、免登录、浅 clone 也可靠）
  sha=$(git ls-remote origin "refs/heads/$branch" | awk '{print $1}')
  # ③ 本地分支名 ≠ 远程名时，试 upstream 名
  [ -z "$sha" ] && { up=$(git rev-parse --abbrev-ref @{u} | sed 's#^origin/##'); [ -n "$up" ] && sha=$(git ls-remote origin "refs/heads/$up" | awk '{print $1}'); }
  # ④ 官方 API 兜底（确认分支存在 + 最新 sha）
  [ -z "$sha" ] && sha=$(gitee api -p "/repos/$repo/branches/$branch" | python3 -c 'import json,sys; print(json.load(sys.stdin)["commit"]["sha"])')
fi
[ -z "$sha" ] && { echo "分支 $branch 不存在或无提交，请核对分支名"; exit 1; }
```

**承载 commit 关键点**：

- **不要死盯 main**——团队分支评审时用 `git branch --show-current` 取当前分支，否则评论挂错分支的最新 commit。
- **承载 commit 不刻意找"最后改动目标文件的 commit"**——Gitee 静默忽略 `path`/`position`，定位靠 body 的 `location` 文本，挂哪个 commit 不影响正确性；挂当前分支最新 commit 网页可见性最好。
- **本地 `git rev-parse HEAD` 不作为默认**——本地 commit 可能未 push，POST 会 404（此时提示用户 push 或确认分支名）。

## 评论格式约定（固定格式，所有评论必须遵循）

### body 模板（标准评审评论）

```markdown
【待处理】branch: <分支名> · location: <文件>:<行区间>

> <摘原文一行>

<意见内容>

@<需要答复的人>
```

> 模板中 `<>` 内为**占位符**（填写时替换）；各字段的必填性/说明见下方「字段速查表」，**不要照抄占位符或括号说明进 body**。

### 字段速查表（固定位置，不要乱序）

| 字段         | 位置         | 必填 | 说明                                                                                      |
| ------------ | ------------ | ---- | ----------------------------------------------------------------------------------------- |
| **状态**     | 首行开头     | ✅   | `【待处理】`（默认）/ `【已解决】`；`resolve` 即改此前缀                                  |
| **分支**     | 首行         | ✅   | `branch: <分支名>`；默认当前分支（`git branch --show-current`），用户没指定时自动带       |
| **location** | 首行         | ✅   | `location: <文件>:<行区间>`；**相对项目根路径**，可指向任意文件类型；行数找不到可只留文件 |
| **摘原文**   | 首行下引用块 | 建议 | `> <原文一行>`，帮助读者定位；必写更好                                                    |
| **意见内容** | 正文         | ✅   | 评审意见主体，可多行                                                                      |
| **@ 某人**   | 末尾         | 可选 | `@<login>`，需要答复的同事                                                                |

> 首行是**元信息行**：`【状态】branch: 分支 · location: 文件:行区间`，三者用 `·` 分隔，固定顺序（状态 → branch → location）。`list`/解析就从这一行提取分支、location、状态。

### 回复评论（reply）格式

```markdown
Re: <被回复评论的ID>

<回复内容>
```

- 回复挂在**同一提交**下，正文首行 `Re: <被回复评论的ID>`。

### 解决方式

- **首选 PATCH** 改 body 首行 `【待处理】` → `【已解决】`；**删除即清理**（作者/owner 可删）。
- **Gitee 无行锚定（实测）**：官方文档虽为 `POST` 列出 `path`/`position`，但**服务器静默忽略**，不要期待有行字段返回。定位只靠 body 内的 `location` 文本。

### location 定位规则（用户没给文件/行时，AI 主动找）

> **`location` 必须是相对当前项目根路径**（如 `docs/L1/USER-STORY.md`、`assets/xxx.png`、`src/api/handler.go`），**不加仓库名/绝对路径**；可指向任意文件类型，**图片（PNG 等）也可直接作为评论对象**（`location: assets/diagram.png`）。

- **优先用用户给的**「文件:行区间」（或文件路径）；用户给了就直接写进 `location`。
- **用户没给文件/行** → AI **主动定位**，不强问：用 `grep`/上下文（按评价主题、关键词、文件名、章节）找到对应文件；行数好找就带上（`location: 文件:行区间`）。
- **行数找不到或跨多处**（语义不确定、影响多个位置）→ `location` **至少写文件路径**，行区间可省略（`location: docs/L1/USER-STORY.md`）。不要因为没有精确行号就卡住/放弃评论。
- **优先级**：文件必须找到（找不到才问用户）；行数是**尽力而为**，找不到就留文件级。

## 原子操作（走 `gitee api`）

> 所有命令中 `{owner}/{repo}` 与 `{sha}` 按上方参数解析规则代入。
> **body 引号规则**：body 含中文用**单引号**包裹；**含 shell 变量**时用**双引号**展开（如 `-f "body=$body"`）；内容含单引号或多行时，改用 `--body "$(cat file)"` 存到文件读取。

### 1. list —— 查全仓评论（= 未解决待办清单）

```bash
gitee api -p "/repos/{owner}/{repo}/comments"
```

> 该端点**不返回挂载的 commit 信息**。按提交过滤请用 `show-commit`。输出为 JSON，需解析成表格。

**输出表格列**：`id / 分支（从 body 提取）/ location（从 body 提取）/ 状态（【待处理】/【已解决】）/ 作者 / 时间`

解析要点（从 body 中提取）：

- `location`：body 中含 `location: <路径>:<行区间>` 的行，取冒号后内容
- `分支（branch）`：body 中含 `branch: <分支名>` 的行，取冒号后内容；旧版无 `branch:` 的评论标为「未标注」
- 状态：body 首行以 `【已解决】` 开头 → 已解决；否则（`【待处理】` 或未标状态）→ 待处理

### 2. add —— 发一条「文件:行区间」评审意见

> 语义：给**当前仓库当前分支的某文件某几行**提评审意见。承载 commit 自动选定（默认当前分支最新提交），**用户无感**。

```bash
gitee api -X POST -f 'body=<body 内容>' \
  "/repos/{owner}/{repo}/commits/{sha}/comments"
```

响应含 `id`（新建评论 ID，后续 resolve/reply 用）。

### 3. reply —— 回复评论线程

body 按「回复格式」构造（首行 `Re: <ID>`，换行后写回复内容），用 `--body` 传多行内容：

```bash
gitee api -X POST --body "Re: {id}
<回复内容>" \
  "/repos/{owner}/{repo}/commits/{sha}/comments"
```

回复评论挂在**同一提交**下，正文首行 `Re: <被回复的评论ID>`（详见「回复评论（reply）格式」）。

### 4. resolve —— 解决评论

**首选 PATCH（无权限门槛）：**

1. 先 `GET /repos/{owner}/{repo}/comments/{id}` 取原 body
2. 构造新 body：首行 `【待处理】` 改成 `【已解决】`，其余内容不变
3. PATCH 提交：

```bash
gitee api -X PATCH -f "body=【已解决】<原 body 去掉首行【待处理】>" \
  "/repos/{owner}/{repo}/comments/{id}"
```

**或 DELETE（删除即解决，需权限）：**

```bash
gitee api -X DELETE "/repos/{owner}/{repo}/comments/{id}"
```

### 5. show-commit —— 查某提交下全部评论

```bash
gitee api -p "/repos/{owner}/{repo}/commits/{sha}/comments"
```

## 一轮评审闭环流程

```
add（记录评审意见，含 location + 摘原文）
  → list（汇总待办，给用户/对方 Agent）
  → reply（对方答复）或 resolve（处理完标记【已解决】）
  → list（列表为空 = 本轮评审闭环）
```

## 错误处理与权限边界

| 场景                                        | 处理方式                                                              |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `gitee` CLI 不存在                          | 输出 `npm install -g @gitee/gitee-cli` + `gitee auth login`，停止等待 |
| DELETE 他人评论失败（普通成员只能删自己的） | **降级**为 PATCH【已解决】并提示用户「无删除权限，已标记为已解决」    |
| 未登录 / 凭据失效                           | 提示用户先执行 `gitee auth login`                                     |
| body 含单引号导致引号冲突                   | 改用 `--body "$(cat file)"` 从文件读取                                |
| 404（评论不存在 / 无权限）                  | 原样输出错误，核对 `{id}` 与 `{owner}/{repo}`                         |

## 示例

**记录一条评审意见（自动选定当前分支最新提交承载，用户无感）：**

```bash
repo=$(git remote get-url origin | sed -E 's#.*[:/]([^/]+)/([^/.]+)(\.git)?$#\1/\2#')
branch=$(git branch --show-current)   # 当前分支（用户感知；也可 --branch 指定）
sha=$(git ls-remote origin "refs/heads/$branch" | awk '{print $1}')   # 远程承载 sha，用户无感
body='【待处理】branch: '"$branch"' · location: docs/L1/USER-STORY.md:55-69

> 一表汇总所有故事，让读者 30 秒看清"有哪些用户故事"。按角色组织。

L61-L69 每行末尾重复的「（DOMAIN-MODEL §3）」可上收到表头说明一次即可'

gitee api -X POST -f "body=$body" "/repos/$repo/commits/$sha/comments"
```

**列出未解决待办清单：**

```bash
gitee api -p "/repos/{owner}/{repo}/comments"
```

把返回 JSON 解析为 `id / 分支 / location / 状态 / 作者 / 时间` 表格呈现，仅标出【待处理】项。

**解决一条评论（PATCH 加【已解决】）：**

```bash
# 先把原 body 复制出来，去掉【待处理】、前缀改为【已解决】，再提交
gitee api -X PATCH -f 'body=【已解决】...' "/repos/{owner}/{repo}/comments/{id}"
```
