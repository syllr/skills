---
name: skill-name
description: >
  完整的技能模板，包含所有可选目录。当用户提到"触发词1"、"触发词2"、
  "触发词3"时使用此技能。
allowed-tools: Read Write Edit Bash Glob Grep
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
  category: tool
---

# Skill Name

## 简介

（技能概述，1-2 句话）

## 何时使用

当用户提到"触发词1"、"触发词2"、"触发词3"并需要：

- xxx
- yyy
- zzz

## 执行流程

### Phase 1: 准备

1. 验证输入
2. 检查环境
3. 准备资源

### Phase 2: 执行

1. 执行主要任务
2. 调用脚本（如需要）
3. 处理结果

### Phase 3: 输出

1. 格式化输出
2. 生成报告
3. 清理临时文件

## 工具使用

| 阶段 | 使用工具   |
| ---- | ---------- |
| 准备 | Read, Glob |
| 执行 | Bash       |
| 输出 | Write      |

> 需要用户确认/提问时直接在主对话中进行，不需要额外的提问工具。

## scripts/ 目录

| 脚本           | 用途     |
| -------------- | -------- |
| `main.py`      | 主入口   |
| `processor.py` | 数据处理 |
| `utils.py`     | 工具函数 |
| `*_test.py`    | 测试     |

## references/ 文档

| 文档                 | 内容         |
| -------------------- | ------------ |
| `guide.md`           | 详细使用指南 |
| `api-ref.md`         | API 参考     |
| `troubleshooting.md` | 故障排除     |

## assets/ 资源

| 资源         | 用途     |
| ------------ | -------- |
| `templates/` | 输出模板 |
| `data/`      | 示例数据 |

## 输出规范

（详细格式要求）

## 错误处理

| 错误 | 处理 |
| ---- | ---- |
| xxx  | yyy  |

## 示例

**示例 1**:

- 输入：xxx
- 处理：zzz
- 输出：yyy

**示例 2**:

- 输入：xxx
- 处理：zzz
- 输出：yyy

## 注意事项

- xxx
- yyy
