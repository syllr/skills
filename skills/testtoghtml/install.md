# TestTogHTML 技能安装指南

## AI Agent 执行流程

**重要提示**：本指南供 AI Agent 阅读和执行。请严格按照以下步骤操作。

---

## 步骤 1：检查 Python 安装

首先，执行以下命令验证系统上是否已安装 Python 3：

```bash
python3 --version
```

如果未安装 Python 3，请告知用户从 https://www.python.org/downloads/ 安装。

## 步骤 2：安装所需依赖

testtoghtml 技能需要以下 Python 包：
- paramiko（用于 SFTP 文件传输）
- python-dotenv（用于环境文件处理）

执行以下命令安装它们：

```bash
pip3 install paramiko python-dotenv
```

## 步骤 3：询问用户选择 AI 编程助手

**必须执行此步骤**：请使用交互式方式询问用户，让用户从下面的列表中选择他们要安装到的 AI 编程助手：

可用选项：
1. Claude Code
2. OpenCode
3. Qwen Code

**请等待用户明确选择后，再继续下一步。不要假设用户的选择。**

## 步骤 4：根据用户选择执行安装

根据用户在步骤 3 中的选择，执行对应的安装命令：

### 如果用户选择的是 OpenCode：

执行以下命令：

```bash
# 导航到技能目录
cd /Users/yutao/ainote/skills/skills/testtoghtml

# 创建目录并复制所有文件
mkdir -p ../../.opencode/skills/testtoghtml && cp -r ./* ../../.opencode/skills/testtoghtml/

# 验证安装
ls -la ../../.opencode/skills/testtoghtml/
```

### 如果用户选择的是 Claude Code：

执行以下命令：

```bash
# 导航到技能目录
cd /Users/yutao/ainote/skills/skills/testtoghtml

# 创建目录并复制所有文件
mkdir -p ../../.claude/skills/testtoghtml && cp -r ./* ../../.claude/skills/testtoghtml/

# 验证安装
ls -la ../../.claude/skills/testtoghtml/
```

### 如果用户选择的是 Qwen Code：

执行以下命令：

```bash
# 导航到技能目录
cd /Users/yutao/ainote/skills/skills/testtoghtml

# 创建目录并复制所有文件
mkdir -p ../../.qwen/skills/testtoghtml && cp -r ./* ../../.qwen/skills/testtoghtml/

# 验证安装
ls -la ../../.qwen/skills/testtoghtml/
```

## 步骤 5：确认安装成功

执行完上述命令后，向用户确认安装已成功完成，并告知用户可以使用该技能了。

## 补充说明

### OpenCode 技能搜索位置

OpenCode 会搜索以下位置的技能：
- 项目配置：`.opencode/skills/<name>/SKILL.md`
- 全局配置：`~/.config/opencode/skills/<name>/SKILL.md`
- 项目 Claude 兼容：`.claude/skills/<name>/SKILL.md`
- 项目代理兼容：`.agents/skills/<name>/SKILL.md`

### 技能使用方法

安装完成后，用户可以在 AI 编程助手中使用该技能：
- `/testtoghtml /path/to/file.html` - 上传指定的 HTML 文件
- `/testtoghtml` - 交互式询问文件路径

### 故障排除

如果遇到问题：
1. 确保 Python 3 和 pip3 在 PATH 中
2. 验证依赖是否已安装：`pip3 list | grep -E "paramiko|python-dotenv"`
3. 检查是否在正确的目录中
4. 确保目标目录有正确的写入权限

更多信息，请访问：https://github.com/vercel-labs/skills
