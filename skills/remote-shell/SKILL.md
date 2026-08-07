---
name: remote-shell
description: 通过 SSH 在远程服务器上执行命令。触发词：去 xxx 执行、在 xxx 上运行、连接 xxx 并执行、远程执行 xxx、在 xxx 查看 xxx
allowed-tools: Bash
---

# remote-shell

通过 SSH 在远程服务器上执行命令。

## 使用场景

当用户提到以下意图时使用此 skill：

- "去 [主机名/别名] 执行 [命令]"
- "在 [host] 上运行 [command]"
- "连接 [服务器] 并执行 [操作]"
- "远程执行 [command]"
- "在 [主机] 查看 [信息]"

## 使用说明

使用 `remote-shell` 命令在指定的远程主机上执行命令（假设已安装到 PATH）。

### 重要：主机识别流程

当用户提到主机名时，**不要直接假设**，必须按以下步骤执行：

**第一步：列出主机**
先用 `remote-shell list` 查看所有可用主机，了解：

- 主机别名（alias）
- 主机 IP/域名
- 端口号

**第二步：匹配主机**
根据用户说的主机名，匹配到配置中的 alias：

- 精确匹配：如用户说 "3070"，配置中 alias 是 "3070" → 直接使用
- 部分匹配：如用户说 "3070"，配置中 alias 是 "3070GPU" → 需要判断是否正确
- 模糊匹配：如用户说 "gpu 主机"，配置中有 "3070GPU"、"4090GPU" → 需要判断

**第三步：执行命令**
确认主机后执行命令。

### 歧义处理

如果无法确定用户指的是哪个主机（有两个以上相似的主机），**必须使用 question 工具询问用户确认**。

歧义示例：

- 用户说 "去 3070 执行" → 配置中有 "3070GPU" 和 "3070TIGPU" 两个
- 用户说 "去 dev 服务器" → 配置中有 "dev Beijing" 和 "dev Shanghai"

询问时要给出选项，让用户选择。

## 命令

### 列出可用主机

```bash
remote-shell list
```

### 执行命令

```bash
remote-shell <别名> '<命令>'
```

> ⚠️ 示例 alias（如下方 `3070`、`dev`）仅为示意，**实际可用别名以 `remote-shell list` 输出为准**，不要硬编码或假设具体主机名。

**重要：必须使用单引号包裹命令**

原因：命令中如果包含 `$` 变量引用（如 `$PATH`、`$i`），双引号会导致本地 shell 先展开变量，可能导致意外行为。

```bash
# 正确：单引号，$PATH 原样传给远程
remote-shell <别名> 'echo $PATH'

# 错误：双引号，本地 $PATH 会被展开
remote-shell <别名> "echo $PATH"
```

### 显示帮助

```bash
remote-shell --help
```

### 添加主机

支持交互式添加和参数化添加两种方式：

```bash
# 交互式添加（按提示输入各项信息）
remote-shell add

# 参数化添加（各项参数可组合使用）
remote-shell add --alias <别名> --host <主机> --username <用户名> --password <密码>
```

参数说明：

| 参数               | 说明                            |
| ------------------ | ------------------------------- |
| `--alias`          | 主机别名（必填）                |
| `--host`           | 主机 IP 或域名（必填）          |
| `--port`           | SSH 端口（默认 22）             |
| `--username`       | SSH 用户名（必填）              |
| `--password`       | SSH 密码（与私钥二选一）        |
| `--privateKeyPath` | SSH 私钥路径（与密码二选一）    |
| `--timeout`        | SSH 握手超时毫秒数（默认 5000） |

> ⚠️ 注意：`--password`/`--privateKeyPath` 必填其一，且**禁止在 skill 内容或对话中明文写入真实密码**。

### 删除主机

```bash
# 按别名删除
remote-shell delete <别名>

# 交互式选择删除
remote-shell delete
```

### 指定配置文件

```bash
remote-shell --config <路径> <别名> <命令>
```

### 错误处理

当别名不存在时，会报错并显示所有可用的主机别名：

```bash
$ remote-shell nonexistent 'echo test'
No hosts found for alias: nonexistent

Available hosts:
  <别名1> -> <用户>@<主机>:<端口>
```

> ⚠️ 上方的 `Available hosts` 内容仅为示意，实际以 `remote-shell list` 输出为准。

## 配置文件

### 配置文件位置

默认：`~/.config/remote-shell/hosts.json`（XDG 标准）

可通过 `--config <路径>` 或设置 `XDG_CONFIG_HOME` 环境变量覆盖。

### 配置文件格式

`hosts.json` 是一个 JSON 对象，包含 `hosts` map，每个键为主机别名，值为主机配置对象：

| 字段             | 类型   | 说明                                        |
| ---------------- | ------ | ------------------------------------------- |
| `alias`          | string | 主机别名，用于命令中引用                    |
| `host`           | string | 主机 IP 或域名                              |
| `port`           | number | SSH 端口，默认 22                           |
| `username`       | string | SSH 用户名（注意是 `username` 不是 `user`） |
| `password`       | string | SSH 密码（与 `privateKeyPath` 二选一）      |
| `privateKeyPath` | string | SSH 私钥路径（与 `password` 二选一）        |
| `timeout`        | number | SSH 握手超时毫秒数，默认 5000               |

**示例**（仅展示结构，实际主机以 `remote-shell list` 输出为准，请勿写入真实密码）：

```json
{
  "hosts": {
    "example-host": {
      "alias": "example-host",
      "host": "192.168.1.100",
      "port": 22,
      "username": "ubuntu",
      "privateKeyPath": "~/.ssh/dev-key",
      "timeout": 5000
    }
  }
}
```

### 退出码获取与降级回退机制

**每次执行 `remote-shell` 后立即检查退出码**：

```bash
remote-shell <别名> '<命令>'; echo "EXIT:$?"
```

**必须基于 exit code 精确判断是否降级**——禁止"执行失败就直接切 sshpass"的经验式跳过。降级条件见下表：

| exit code   | 场景                                            | 是否降级      | 降级策略                                                          |
| ----------- | ----------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| **0**       | 成功执行                                        | ❌ 不降级     | 直接返回结果给用户                                                |
| **1**       | 连接拒绝/主机不可达/连接丢失                    | ✅ 降级       | 使用 sshpass 重试                                                 |
| **2**       | SSH 握手超时                                    | ✅ 降级       | 使用 sshpass 重试                                                 |
| **5**       | 认证失败/配置错误                               | ✅ 降级       | 使用 sshpass + 密码表重试                                         |
| **126/127** | 权限不足/命令未找到（`remote-shell` 不在 PATH） | ⚠️ 降级前报告 | ①向用户报告"remote-shell 不可用或权限不足"；②询问是否继续 sshpass |
| 其他非以上  | 未预期的内部错误                                | ⚠️ 谨慎降级   | ①向用户展示完整 stderr；②**不等待用户回复**，立即用 sshpass 重试  |

**降级执行方式**：使用 sshpass 直接 SSH 重试（连接参数与 `remote-shell list` 输出一致，密码取自本机密码表）。

**降级约束**：

- 执行 sshpass 时，**禁止在展示给用户的输出中回显完整命令行**（密码会泄露），需截断为 `sshpass ... ssh <用户>@<主机> '<命令摘要>'` 格式，或仅展示退出码 + 操作摘要
- **禁止在 skill 内容、示例或对话中写入任何真实密码**；密码仅从本机密码表读取使用，不展示、不回显
- 每次发起新的远程命令，必须重新从 `remote-shell` 开始尝试，不允许因上次 sshpass 成功而跳过
- 如果 `remote-shell` 和 `sshpass` 都失败，停止尝试，将两次失败信息展示给用户并给出排查建议（①手动 `ssh` 验证连通性；②确认密码表条目是否过期；③检查是否需要跳板机）

**补充：命令执行错误提示**：

| 错误场景         | 表现                                                       | 处理方式                                               |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| **命令执行超时** | 命令长时间无输出                                           | 建议使用 `timeout` 包装命令，如 `timeout 30 <command>` |
| **主机密钥变更** | 输出类似 `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED` | 提示用户使用 `ssh-keygen -R <host>` 清理旧密钥         |

如果执行出错，将错误信息原样返回给用户，并根据上述表格提供处理建议。

> ⚠️ 在降级流程中，不要因为退出码而反复询问用户——只在 `remote-shell` 不可用（126/127）或用户主动表示退出时，才建议用户自行执行命令。

## 示例

> ⚠️ 以下示例中的 alias（`3070`、`dev`）仅为示意，**实际可用别名以 `remote-shell list` 输出为准**。

查看 CPU 和内存：

```bash
remote-shell 3070 'uptime && free -h'
```

查看 GPU 状态：

```bash
remote-shell 3070 'nvidia-smi'
```

列出 dev 服务器上的文件：

```bash
remote-shell dev 'ls -la /tmp'
```

实时监控日志（流式输出）：

```bash
remote-shell dev 'tail -f /var/log/syslog'
```
