---
name: gitee-comments
description: >
  管理 Gitee 仓库的提交（commit）评审评论：程序化记录评审意见、列出未解决待办清单、回复评论线程、
  解决/删除评论。用于评审文档或代码时在 Gitee 服务端留痕，AI 与团队成员共用一套机制。
  触发词：评审评论、提交评论、review comment、评审意见、待办评论、解决评论、回复评论、
  @ 同事评审、gitee 评论、查看未解决意见。当用户需要在 Gitee 上给某个 commit 添加评审意见、
  查询所有未解决的评审意见、回复一条评审评论、或把某条评审意见标记为已解决时使用此技能。
allowed-tools: Bash
---

# Gitee 提交评论（评审意见）

对 Gitee 仓库的**提交（commit 层）**进行评审评论管理。评审意见存在 Gitee 服务端，不进入 git 对象，
因此对 git 本身零影响，适合「AI + 人类 + 双方 Agent」共用一套留痕机制。

> 本 skill 只做「提交评论」域（增删查改回）。**不**做 PR/Issue 操作——那是 Gitee 官方 MCP 的职责。

## 何时使用

- 评审 `docs/` 下 Markdown 文档或代码时，需要程序化记录评审意见
- 需要按「文件:行区间」定位评审意见（Gitee 无行锚定，定位靠 body 内的 `location` 文本）
- 需要查询所有未解决的评审意见（待办清单）
- 需要回复一位同事/对方 Agent 的评审意见（评论区，非私聊）
- 需要把一条评审意见标记为【已解决】或删除（删除即解决，清空即本轮评审闭环）

## 前置检查（可重入，每次执行必做）

**第一步，检查 `gitee` CLI 是否可用：**

```bash
command -v gitee
```

- 若**有输出**（CLI 存在且已登录凭据）→ 继续执行下方流程。
- 若**无输出**（CLI 未安装）→ **停止**，向用户输出以下两条命令，让用户自行安装并登录，装好后再继续：

```bash
npm install -g @gitee/gitee-cli
gitee auth login
```

> ⚠️ 本 skill **不替你安装**、不做任何 token/凭据处理。认证由 `gitee auth login` 的登录凭据承担，
> 调用时用 `gitee api` 自动读取 `~/.config/gitee/credentials.yml`，全程零令牌暴露。
>
> **重入语义**：每次调用本 skill 都重新执行此检查。用户装好 CLI 并登录后再次调用即自动放行，
> 无需修改 skill。

## 参数解析规则

| 参数         | 默认来源                                                                                                                                             | 覆盖方式            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `owner/repo` | `git remote get-url origin` 解析（如 `git@gitee.com:syllr/enterprise-ai-hub.git` → `syllr/enterprise-ai-hub`）                                       | `--repo owner/repo` |
| `sha`        | main 最新提交：`git ls-remote origin refs/heads/main` 取 sha（只读，不改 git 对象）；失败时回退 `gitee api -p "/repos/{owner}/{repo}/branches/main"` | `--sha <sha>`       |

解析 `owner/repo`：

```bash
git remote get-url origin | sed -E 's#.*[:/]([^/]+)/([^/.]+)(\.git)?$#\1/\2#'
```

## 评论格式约定（尽量固化）

### body 模板

```markdown
【待处理】location: docs/L1/USER-STORY.md:55-69

> 摘原文一行（帮助读者定位，务必写）

意见内容（可多行）……

@pengyu_php（可选，@ 需要答复的人）
```

- **状态前缀（body 首行）**：`【待处理】`（默认）/ `【已解决】`。首行固定放状态，`resolve` 即改此前缀。
- **回复线程**：往同一提交 POST 新评论，正文首行 `Re: <被回复评论的ID>`
- **解决方式**：首选 PATCH 改 body 加【已解决】；删除即清理（作者/owner 可删）
- **Gitee 无行锚定**：POST 请求体只有 `body` 字段，`path`/`line`/`position` 参数会被静默忽略，
  不要传，也不要期待有行字段返回。定位只靠 body 内的 `location` 文本。

## 原子操作（走 `gitee api`）

> 所有命令中 `{owner}/{repo}` 与 `{sha}` 按上方参数解析规则代入。
> body 含中文时用**单引号**包裹；内容中若含单引号，改用 `--body "$(cat file)"`。

### 1. list —— 查全仓评论（= 未解决待办清单）

```bash
gitee api -p "/repos/{owner}/{repo}/comments"
```

> 该端点**不返回挂载的 commit 信息**。按提交过滤请用 `show-commit`。输出为 JSON，需解析成表格。

**输出表格列**：`id / location（从 body 提取）/ 状态（【待处理】/【已解决】）/ 作者 / 时间`

解析要点（从 body 中提取）：

- `location`：body 中含 `location: <路径>:<行区间>` 的行，取冒号后内容
- 状态：body 首行以 `【已解决】` 开头 → 已解决；否则（`【待处理】`、旧样例 `【评审·测试】` 等无【已解决】标记）→ 待处理

### 2. add —— 发评审评论（默认挂到 main 最新提交）

```bash
gitee api -X POST -f 'body=<body 内容>' \
  "/repos/{owner}/{repo}/commits/{sha}/comments"
```

响应含 `id`（新建评论 ID，后续 resolve/reply 用）。

### 3. reply —— 回复评论线程

```bash
gitee api -X POST -f 'body=Re: {id} <回复内容>' \
  "/repos/{owner}/{repo}/commits/{sha}/comments"
```

回复评论挂在**同一提交**下，正文首行 `Re: <被回复的评论ID>`。

### 4. resolve —— 解决评论

**首选 PATCH（无权限门槛）：**

```bash
gitee api -X PATCH -f 'body=【已解决】<原 body 去掉【待处理】>' \
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

**记录一条评审意见并挂到 main 最新提交：**

```bash
repo=$(git remote get-url origin | sed -E 's#.*[:/]([^/]+)/([^/.]+)(\.git)?$#\1/\2#')
sha=$(git ls-remote origin refs/heads/main | awk '{print $1}')
body='【待处理】location: docs/L1/USER-STORY.md:55-69

> 一表汇总所有故事，让读者 30 秒看清"有哪些用户故事"。按角色组织。

L61-L69 每行末尾重复的「（DOMAIN-MODEL §3）」可上收到表头说明一次即可'

gitee api -X POST -f "body=$body" "/repos/$repo/commits/$sha/comments"
```

**列出未解决待办清单：**

```bash
gitee api -p "/repos/{owner}/{repo}/comments"
```

把返回 JSON 解析为 `id / location / 状态 / 作者 / 时间` 表格呈现，仅标出【待处理】项。

**解决一条评论（PATCH 加【已解决】）：**

```bash
# 先把原 body 复制出来，去掉【待处理】、前缀改为【已解决】，再提交
gitee api -X PATCH -f 'body=【已解决】...' "/repos/{owner}/{repo}/comments/{id}"
```
