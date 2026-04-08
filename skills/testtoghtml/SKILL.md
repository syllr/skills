---
name: testtoghtml
description: 一键上传html文件到115.190.154.64服务器
metadata:
  supportedAgents: ["claude-code", "opencode"]
  internal: false
---

# TestTogHTML - 一键上传HTML文件

一键上传HTML文件到115.190.154.64服务器的/home/dev/tmp目录。

## When to Use / 使用场景

什么时候应该调用这个技能：
- **仅当**用户通过 slash 命令明确触发时使用，例如：
  - `/testtoghtml /path/to/file.html` （带参数，直接上传指定文件）
  - `/testtoghtml` （不带参数，询问用户文件路径）
  - `/skill testtoghtml`
- **不要**在用户没有明确使用 slash 命令的情况下自动触发此技能

## Instructions / 执行步骤

技能被激活后需要遵循的具体步骤：

1. **获取文件路径**：
   - 首先检查用户是否通过 slash 命令直接提供了文件路径参数
   - 如果用户提供了参数（例如 `/testtoghtml /Users/yutao/ainote/tog/index.html`），直接使用该路径
   - 如果没有提供参数，询问用户要上传的HTML文件的完整路径
   - 验证文件是否存在于本地

2. **检查远程目录**：
   - 首先连接到服务器 115.190.154.64，使用账号 dev/dev1110
   - 检查 /home/dev/tmp/ 目录下是否存在同名文件
   - 执行命令：`ls -la /home/dev/tmp/`

3. **处理同名文件**：
   - 如果存在同名文件，立即与用户对话：
     - 告知用户远程服务器已存在同名文件
     - 询问用户是选择"停止上传"还是"直接覆盖原有文件"
     - 等待用户明确选择后再继续

4. **上传文件**：
   - 如果用户选择覆盖或没有同名文件，执行文件上传
   - 使用 SFTP 或 SCP 将文件上传到 /home/dev/tmp/ 目录
   - 确保上传成功并验证文件大小

5. **完成确认**：
   - 上传完成后，向用户确认上传成功
   - 显示远程文件的路径

## Implementation Notes / 实现说明

- 服务器信息：115.190.154.64
- 用户名：dev
- 密码：dev1110
- 目标目录：/home/dev/tmp/
- 可以使用 Paramiko (Python) 或 scp 命令进行文件上传
- 上传前务必检查同名文件，不要未经用户确认就覆盖
