# agent-playbook/self-improving-agent 分析

**项目地址**: https://github.com/syllr/agent-playbook  
**信息来源**: 直接读取 SKILL.md 及相关文档 (获取于 2026-04-05)

---

## 项目概述

**self-improving-agent** 是 agent-playbook 体系中的**通用终身自改进系统**，能够从**所有技能的执行经验中学习**，持续进化技能体系。

> "An AI agent that learns from every interaction, accumulating patterns and insights to continuously improve its own capabilities."

核心设计思想：**从每一次交互中学习，将具体经验抽象为可复用模式，更新技能指导**。

---

## 核心问题与解决方案

### 问题场景

传统技能体系是静态的：
- 技能写好后就不变了，即使发现问题也无法自动改进
- 同类错误重复发生，无法从经验中学习
- 没有系统化机制积累最佳实践和避免错误

### 解决方案

完整的闭环反馈系统：

```
Skill Event → Extract Experience → Abstract Pattern → Update Skill → Consolidate Memory
```

每次技能执行都提供学习机会，技能随着使用次数增加越来越精准。

---

## 架构设计

### 多内存架构 (Multi-Memory Architecture)

基于 2025 年研究 (SimpleMem, Multi-Memory Survey)，采用三类内存分离存储：

| 内存类型 | 存储内容 | 位置 | 作用 |
|----------|----------|------|------|
| **Semantic Memory** | 抽象模式和规则 (可跨上下文复用) | `memory/semantic-patterns.json` | 沉淀可泛化的知识 |
| **Episodic Memory** | 具体的经验片段和发生了什么 | `memory/episodic/YYYY-MM-DD-{skill}.json` | 保存完整上下文供追溯 |
| **Working Memory** | 当前会话上下文 | `memory/working/` | 支持错误检测和自修正 |

### Semantic Memory 结构

```json
{
  "patterns": {
    "pattern_id": {
      "id": "pat-2025-01-11-001",
      "name": "Pattern Name",
      "source": "user_feedback|implementation_review|retrospective",
      "confidence": 0.95,
      "applications": 5,
      "created": "2025-01-11",
      "category": "prd_structure|react_patterns|async_patterns|...",
      "pattern": "One-line summary",
      "problem": "What problem does this solve?",
      "solution": { ... },
      "quality_rules": [ ... ],
      "target_skills": [ ... ]
    }
  }
}
```

### Episodic Memory 结构

```json
{
  "id": "ep-2025-01-11-001",
  "timestamp": "2025-01-11T10:30:00Z",
  "skill": "debugger",
  "situation": "User reported data not refreshing after form submission",
  "root_cause": "Empty callback in onRefresh prop",
  "solution": "Implement actual refresh logic in callback",
  "lesson": "Always verify callbacks are not empty functions",
  "related_pattern": "callback_verification",
  "user_feedback": {
    "rating": 8,
    "comments": "This was exactly the issue"
  }
}
```

---

## 自改进循环

### 完整四阶段流程

### Phase 1: 经验提取 (Experience Extraction)

任何技能完成后，提取：

```yaml
What happened:
  skill_used: {which skill}
  task: {what was being done}
  outcome: {success|partial|failure}

Key Insights:
  what_went_well: [what worked]
  what_went_wrong: [what didn't work]
  root_cause: {underlying issue if applicable}

User Feedback:
  rating: {1-10 if provided}
  comments: {specific feedback}
```

### Phase 2: 模式抽象 (Pattern Abstraction)

将具体经验转化为可复用模式：

| 具体经验 | 抽象模式 | 目标技能 |
|----------|----------|----------|
| "User forgot to save PRD notes" | "Always persist thinking to files" | prd-planner |
| "Code review missed SQL injection" | "Add security checklist item" | code-reviewer |
| "Callback was empty, didn't work" | "Verify callback implementations" | debugger |

**抽象规则**：

```yaml
If experience_repeats 3+ times:
  pattern_level: critical
  action: Add to skill's "Critical Mistakes" section

If solution_was_effective:
  pattern_level: best_practice
  action: Add to skill's "Best Practices" section

If user_rating >= 7:
  pattern_level: strength
  action: Reinforce this approach

If user_rating <= 4:
  pattern_level: weakness
  action: Add to "What to Avoid" section
```

### Phase 3: 技能更新 (Skill Updates)

使用**进化标记**更新相关技能文件：

```markdown
<!-- Evolution: 2025-01-12 | source: ep-2025-01-12-001 | skill: debugger -->

## Pattern Added (2025-01-12)

**Pattern**: Always verify callbacks are not empty functions

**Source**: Episode ep-2025-01-12-001

**Confidence**: 0.95

### Updated Checklist
- [ ] Verify all callbacks have implementations
- [ ] Test callback execution paths
```

**修正标记**（修复错误指导）：

```markdown
<!-- Correction: 2025-01-12 | was: "Use callback chain" | reason: caused stale refresh -->

## Corrected Guidance

Use direct state monitoring instead of callback chains:
```typescript
// ✅ Do: Direct state monitoring
const prevPendingCount = usePrevious(pendingCount);
```
```

### Phase 4: 内存合并 (Memory Consolidation)

1. 更新 semantic memory (`semantic-patterns.json`)
2. 存储 episodic memory (`episodic/`)
3. 根据应用/反馈更新模式置信度
4. 剪枝过时模式（低置信度，无近期应用）

---

## 触发机制

### 自动触发（通过 hooks）

| 事件 | 触发动作 |
|------|----------|
| `before_start` | 任何技能开始时，记录会话开始到 session-logger |
| `after_complete` | 任何技能完成后，提取模式，更新技能 |
| `on_error` | Bash 非零退出/测试失败，捕获错误上下文，触发自修正 |

### 手动触发

- "自我进化" / "self-improve"
- "从经验中学习"
- "分析今天的经验" / "总结教训"
- 要求改进特定技能

---

## 自修正 (Self-Correction)

当技能指导产生错误结果时触发：

**自修正工作流**：

1. **检测错误** - 从 working/last_error.json 获取错误上下文
2. **验证根因** - 判断是技能指导错误 / 被误解 / 不完整
3. **应用修正** - 更新技能文件，添加修正标记，更新语义内存
4. **验证修复** - 测试修正后的指导，请求用户验证

---

## 进化优先级矩阵

触发进化的条件和优先级：

| 触发条件 | 目标技能 | 优先级 | 动作 |
|----------|----------|----------|------|
| 发现新 PRD 模式 | prd-planner | High | 添加到质量检查清单 |
| 架构权衡澄清 | architecting-solutions | High | 添加决策模式 |
| API 设计规则学到 | api-designer | High | 更新模板 |
| 调试方案发现 | debugger | High | 添加到反模式 |
| 评审清单有缺口 | code-reviewer | High | 添加清单项 |
| 性能/安全洞见 | performance-engineer, security-auditor | High | 添加模式 |
| UI/UX 规范问题 | prd-planner, architecting-solutions | High | 添加视觉规范要求 |
| React/state 模式 | debugger, refactoring-specialist | Medium | 添加模式 |
| 测试策略改进 | test-automator, qa-expert | Medium | 更新方法 |
| CI/deploy 修复 | deployment-engineer | Medium | 添加故障排除 |

---

## Hooks 集成

### Claude Code Settings 配置

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${SKILLS_DIR}/self-improving-agent/hooks/pre-tool.sh \"$TOOL_NAME\" \"$TOOL_INPUT\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${SKILLS_DIR}/self-improving-agent/hooks/post-bash.sh \"$TOOL_OUTPUT\" \"$EXIT_CODE\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${SKILLS_DIR}/self-improving-agent/hooks/session-end.sh"
          }
        ]
      }
    ]
  }
}
```

替换 `${SKILLS_DIR}` 为实际技能路径。

---

## 人在回路 (Human-in-the-Loop)

### 反馈收集

每次更新后向用户收集反馈：

```markdown
## Self-Improvement Summary

I've learned from our session and updated:

### Updated Skills
- `debugger`: Added callback verification pattern
- `prd-planner`: Enhanced UI/UX specification requirements

### Patterns Extracted
1. **state_monitoring_over_callbacks**: Use usePrevious for state-driven side effects
2. **ui_ux_specification_granularity**: Explicit visual specs prevent rework

### Confidence Levels
- New patterns: 0.85 (needs validation)
- Reinforced patterns: 0.95 (well-established)

### Your Feedback
Rate these improvements (1-10):
- Were the updates helpful?
- Should I apply this pattern more broadly?
- Any corrections needed?
```

### 反馈整合

```yaml
User Feedback:
  positive (rating >= 7):
    action: Increase pattern confidence
    scope: Expand to related skills

  neutral (rating 4-6):
    action: Keep pattern, gather more data
    scope: Current skill only

  negative (rating <= 3):
    action: Decrease confidence, revise pattern
    scope: Remove from active patterns
```

---

## 完整工作流集成

```
Any Skill Run
  -> workflow-orchestrator
    -> self-improving-agent (background)
    -> create-pr (ask_first)
    -> session-logger (auto)
```

完成后如果技能文件被修改，会触发 `create-pr` 询问用户是否提交 PR。

---

## 优缺点分析

### 优点

✅ **普适性** - 从 ALL 技能学习，不限于特定领域  
✅ **基于研究** - 采用最新 2025 终身学习研究成果 (SimpleMem, Multi-Memory)  
✅ **多内存分离** - 语义/情景/工作内存分离，符合认知科学  
✅ **可追溯** - 进化/修正标记保留完整来源，可回溯  
✅ **置信度跟踪** - 模式置信度随使用反馈调整  
✅ **人在回路** - 始终需要用户确认，不擅自覆盖  
✅ **钩子集成** - 通过 Claude Code hooks 实现全自动触发  
✅ **零外部依赖** - 纯 Claude Code 原生，不需要额外服务

### 局限性

- 需要正确配置 hooks 才能捕捉错误事件
- 模式抽象质量依赖 AI 判断，需要用户反馈校准
- 实验性架构，仍在活跃演进

---

## 与其他方案对比

| 特性 | claude-reflect-system | singularity-claude | agent-playbook/self-improving-agent |
|------|-----------------------|--------------------|---------------------------------------|
| **学习来源** | 用户纠正 | 自动评分 + 用户可选 | 全技能经验 + 用户反馈 |
| **改进对象** | 现有技能 | 从创建到固化完整生命周期 | 全技能体系持续进化 |
| **内存架构** | 修改 skill 文件 | 评分/telemetry 独立存储 | 语义+情景+工作 多内存分离 |
| **成熟度模型** | ❌ 无 | Draft → Crystallized | 通过置信度跟踪隐式实现 |
| **量化评分** | ❌ 置信度分级 | 5维度 0-100 | 用户评分(1-10) + 置信度 |
| **自动修复** | 用户触发 | 低分自动触发 | 错误钩子触发 |
| **缺口检测** | ❌ 无 | ✅ 自动检测建议 | 通过经验重复度隐式检测 |
| **跨技能学习** | ❌ 单技能 | ✅ 多技能 | ✅ 模式可应用到多技能 |
| **依赖** | PyYAML | Haiku 评分 | 零依赖（只用 Claude 原生） |
| **适用平台** | Claude Code 仅 | Claude Code 仅 | Claude Code（通过 hooks） |

---

## 推荐选型

| 场景 | 推荐方案 |
|------|----------|
| 只需要从用户纠正中学习，简单直接 | **claude-reflect-system** |
| 需要完整自动技能创建-进化-固化循环 | **singularity-claude** |
| 需要集成到现有 agent-playbook 技能体系，从所有技能经验中持续学习 | **self-improving-agent** |
| 需要多内存架构支持更复杂的知识沉淀 | **self-improving-agent** |

---

## 信息来源

- **Repository**: https://github.com/syllr/agent-playbook
- **Path**: `skills/self-improving-agent/`
- **Retrieved**: 2026-04-05
- **License**: MIT

---

## 参考资料

- [SimpleMem: Efficient Lifelong Memory for LLM Agents](https://arxiv.org/html/2601.02553v1)
- [A Survey on the Memory Mechanism of Large Language Model Agents](https://dl.acm.org/doi/10.1145/3748302)
- [Lifelong Learning of LLM based Agents](https://arxiv.org/html/2501.07278v1)
- [Evo-Memory: DeepMind's Benchmark](https://shothota.medium.com/evo-memory-deepminds-new-benchmark)
