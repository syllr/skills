# CLI 与配置参考

> 本文件承载 remote-shell CLI 的主机管理与配置文件细节（SKILL.md 主流程按需引用）。

## 添加主机

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

> ⚠️ 注意：`--password`/`--privateKeyPath` 必填其一，且禁止在 skill 内容或对话中明文写入真实密码。

## 删除主机

```bash
# 按别名删除
remote-shell delete <别名>

# 交互式选择删除
remote-shell delete
```

## 更新主机

支持交互式更新和参数化更新两种方式，只更新提供的字段，未提供的字段保持不变：

```bash
# 交互式更新（选择要更新的主机，按提示修改）
remote-shell update

# 按别名更新指定主机
remote-shell update <别名>

# 参数化更新（只改提供的字段；--alias 用于重命名）
remote-shell update <别名> --alias <新别名> --port <新端口>
```

可更新字段与「添加主机」的参数表一致，只更新提供的字段：`--alias` 表示重命名，其余参数含义与「添加主机」相同（见上表）。

> ⚠️ 更新凭据（`--password`/`--privateKeyPath`）时同样遵循「禁止明文写入真实密码」约定，命令在对话中展示时需遮蔽密码部分。

## 配置文件位置

默认：`~/.config/remote-shell/hosts.json`（XDG 标准）

可通过 `--config <路径>` 或设置 `XDG_CONFIG_HOME` 环境变量覆盖。

## 配置文件格式

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

示例（仅展示结构，请勿写入真实密码）：

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
