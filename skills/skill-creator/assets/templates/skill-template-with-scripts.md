---
name: skill-name
description: >
  通过脚本执行复杂的确定性任务。触发词1、触发词2时使用此技能。
allowed-tools: Read Write Bash
---

# Skill Name

## 简介

（技能概述）

## 何时使用

当用户提到"触发词1"、"触发词2"并需要执行以下操作时：

- 需要处理大量数据
- 需要调用外部 API
- 需要执行文件转换

## 执行流程

### 1. 准备阶段

（检查环境、验证输入）

### 2. 执行脚本

使用 `scripts/main.py` 执行核心逻辑：

```bash
# 基本用法（相对路径，详见 references/path-resolution.md）
scripts/main.py --input <input> --output <output>

# 示例
scripts/main.py --input <input-file> --output /tmp/result.json
```

### 3. 处理结果

（解释输出、生成报告）

## scripts/ 目录说明

| 脚本            | 用途           |
| --------------- | -------------- |
| `main.py`       | 主脚本，入口点 |
| `utils.py`      | 工具函数       |
| `api_client.py` | API 客户端     |

## 输出规范

（输出格式要求）

## 错误处理

| 错误类型     | 处理方式         |
| ------------ | ---------------- |
| 文件不存在   | 提示用户检查路径 |
| 脚本执行失败 | 报告错误信息     |
| 超时         | 重试或跳过       |

## 示例

**输入**: xxx
**输出**: yyy

## 注意事项

- 确保 Python 3.10+ 已安装
- 脚本依赖的包需要提前安装
- **调用脚本用相对路径 `scripts/xxx` 形式**（详见 [references/path-resolution.md](references/path-resolution.md)）
- 详细说明见 [references/script-language-guide.md](references/script-language-guide.md)
