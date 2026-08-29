---
name: score-prompt
description: 对任意 LLM prompt / 文档（markdown、YAML、JSON、TOML）跑 5 维度质量评分（Clarity/Conciseness/Actionability/Consistency/Minimal-slop）并迭代修复至目标分数，默认目标 90 分，可用 target_score 参数覆盖（例 target_score=95）。当用户想校验并改进 LLM 面向的 prompt、指令或 skill 质量时使用。
license: MIT
metadata:
  author: openspec-omo-bridge
  version: "1.0"
  supportedAgents: '["opencode"]'
---

# 1. 输入解析

## 1.1 必填参数

`target_file`（位置 1）— 待评分文件绝对路径。支持的扩展名：`.md` / `.yaml` / `.yml` / `.json` / `.toml` / `.txt`。**不支持二进制 / 编程语言源码**（不是该 skill 的评估对象）。

## 1.2 可选参数

- `target_score=N`（默认 90）— 退出循环所需的最低 Overall 分数（百分制，0-100）。低于此分则继续迭代。
- `max_rounds=N`（默认 10）— 最大迭代轮次上限。达到上限未达标则停止（不抛错，输收口报告说明未达）。
- `review_focus="..."`（默认空）— 评审侧重说明。例 `review_focus="schema instruction"` 或 `review_focus="OpenCode skill body"`。传空则 oracle 用通用 baseline。

# 2. 全局规则

## 2.1 Fast Fail Rule

任何 `task()` / `tool()` / `skill()` 调用失败（超时、agent 不可用、返回错误等）：

1. 立即停止当前 round
2. 报告「🔴 [round 名] 中断：[调用名] 调用失败。[错误信息]」
3. 等待用户介入

禁止降级、禁止重试、禁止跳过、禁止自行替代执行。

## 2.2 评分体系（百分制）

每个维度 1-5 分，乘以 20 得百分制分数。**Overall = 5 维度平均分 × 20**。

| 维度          | 含义                                                             |
| ------------- | ---------------------------------------------------------------- |
| Clarity       | 意图对 LLM 是否无歧义？动词具体 vs 模糊？条件显式 vs 隐式？      |
| Conciseness   | 是否有可移除的重复？有没有增加 token 但不增加约束的措辞？        |
| Actionability | LLM 能否端到端执行而无需问"等等，我该做什么"？失败模式是否处理？ |
| Consistency   | 内部术语、PHASE/Step 编号、格式约定是否一致？                    |
| Minimal-slop  | 有没有 AI 生成的冗余 / 营销框架 / 魔数 token / 重述？            |

## 2.3 target_score 模式

默认值与取值范围见 §1.2（未传时默认 90，合法区间 0-100）。

- `target_score >= 95` 视为"严格模式"（每次修复都需更高 ROI）
- `target_score < 80` 视为"宽松模式"（oracle 会更关注阻塞性问题）
- `target_score < 0` 或 `> 100` 视为非法，停止并提示用户

# 3. R0：baseline 摸底

**目的**：拿到首份 oracle 报告，建立修复 backlog。

**调用**（单 oracle agent，run_in_background=false）：

```

task(subagent_type="oracle", prompt="
你是 Oracle 评审 agent，负责对 <target_file> 跑 5 维度质量评分（baseline 摸底）。

**任务**：

1. 阅读本 skill body（§2.2 5 维度定义 + §5 输出格式 + §2.3 target_score 模式 — 全部以 skill body 为权威源）
2. 阅读 <target_file>（待评审文件）
3. 按 §5 输出格式输出 5 维度分数 + 3 类 findings + Quick wins

**目标分数**（百分制）：<target_score>，< 80 表示宽松 / ≥95 表示严格 / 默认 90。
   ")

```

**解析输出**：提取 Overall 分数（如 "Overall: 4.5/5" → 90/100），记为 R0 baseline。

# 4. R1+：修复-重审循环

## 4.1 循环入口

读取上一轮 oracle 输出，列出所有 🔴 / 🟡 / ⚪ findings。对每个 finding 决定"本轮修"或"延后"。

**修复优先级**：

- 🔴 必修（本轮）
- 🟡 视 ROI 修（本轮，如改动 ≤ 3 行）
- ⚪ 选最优 ROI 的 1-2 个修（本轮）

## 4.2 应用修复

用 Read/Edit 工具直接改 `target_file`（**原文件**）：

1. 改动前先 Read 确认当前行号
2. 用 Edit 替换（精确匹配，不模糊替换）
3. 改完用 `bash` 跑 `bun test` / `openspec schema validate` 等验证（如目标文件关联项目有这些测试）。**若无任何可用测试套件**（如审 README/独立 .md），跳过本步骤，仅依赖 oracle 重审作为质量门禁。

**严禁**：批量改 3 处以上未经验证，一次改一处立即确认。

## 4.3 重抽 + 重审

每次改完后：

1. （无需重新读取 target_file —— oracle 每轮自动重读；如有改动，直接进入下一轮审查）
2. 重跑 oracle（同 §3 的 task() 调用，**复用 session_id 保持跨轮上下文**）。具体机制：从 R0 的 `task()` 返回值中提取 `session_id` 字段（OpenCode 标准），后续 `task(subagent_type="oracle", session_id=<提取值>, prompt=...)` 调用中作为参数传入。**不要**省略 session_id——省略会导致 oracle 每次重审时丢失跨轮已知 findings，导致 R(N) 评分震荡。
3. 解析新分数，记为 R(N)

## 4.4 循环退出条件（每轮修复前先检查）

读取最新 R(N) oracle 报告：

- **Overall × 20 ≥ target_score** → 退出循环，进入 §5 收口
- **rounds 计数 ≥ max_rounds** → 强制停止，进入 §5 收口（说明未达标 + 残留 findings）
- **否则** → 进入 §4.1 下一轮

# 5. 收口报告

**findings 等级符号定义**：🔴 = 严重问题，必须修复；🟡 = 建议改进，视 ROI 修复；⚪ = 可选优化，择高 ROI 项处理。

无论循环是因达标退出还是 max_rounds 强制停止，都输出最终收口报告：

```

## score-prompt 收口报告

**目标文件**: <target_file>
**目标分数**: <target_score>
**实际分数**: <R(N) Overall × 20>/100
**迭代轮数**: R0 → R(N)
**耗时**: <估算分钟数>

### 分数演进

| Round | Overall | Δ   | 修复内容摘要   |
| ----- | ------- | --- | -------------- |
| R0    | 80/100  | —   | baseline 摸底  |
| R1    | 88/100  | +8  | 修 3 🟡 + 2 ⚪ |
| R2    | 92/100  | +4  | 修 1 🟡 残留   |
| ...   |         |     |                |

### 达标状态

✅ 已达 target_score（≥ 90）/ ❌ 未达（残留 N 个 findings）

### 残留 findings（如有）

- 🟡 L45: ...
- ⚪ L78: ...

### 建议后续

- 如需更高分数，可传 target_score=95 重新跑此 skill
- 残留 findings 中标 [低 ROI] 的可在未来 review 时一并处理

```

收口报告输出后，**skill 任务完成**，返回控制权给用户。

# 6. 错误处理

- **目标文件不存在** → 立即报告「🔴 target_file 不存在：<path>」，停止
- **目标文件不是支持类型** → 报告「🔴 不支持的文件类型：<ext>，本 skill 支持 .md/.yaml/.yml/.json/.toml/.txt」，停止
- **oracle agent 不可用** → 报告「🔴 oracle agent 不可用，本 skill 强依赖 oracle 做质量评审」，停止
- **max_rounds 内未达标** → 不抛错，输出收口报告（标 ❌ 未达），返回控制权
- **target_score 非法** → 报告「🔴 target_score 必须在 0-100 之间」，停止
