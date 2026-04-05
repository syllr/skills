# 自改进工具汇总 - Claude / OpenCode / OpenClaw 通用

搜集各个平台（Claude Code、OpenCode、OpenClaw）下流行的自改进/自学习技能工具。

---

## 已知名单

| 项目                        | 仓库                                        | 适用平台        | 星标   | 特点                                     |
|---------------------------|-------------------------------------------|-------------|------|----------------------------------------|
| **claude-reflect-system** | haddock-development/claude-reflect-system | Claude Code | -    | 用户纠正一次永久学会                             |
| **singularity-claude**    | Shmayro/singularity-claude                | Claude Code | 14+  | 完整递归进化循环，缺口检测→创建→评分→修复→固化              |
| **OpenClaw**              | openclaw/openclaw                         | 多平台         | 快速增长 | AI Agent Gateway，支持多渠道，配合 Claude 实现自改进 |
| **Moltron**               | adridder/moltron                          | SmythOS     | -    | 灵感来源，自进化技能引擎                           |

---

## 各工具详细分析

### 1. claude-reflect-system (Claude Code 原生)

**仓库**: https://github.com/haddock-development/claude-reflect-system  
**作者**: haddock-development  
**适用平台**: Claude Code CLI  
**核心思想**: "Correct once, never again" —— 纠正一次，永不再犯

**主要特点**:

- 针对用户纠正式学习，检测用户纠正模式
- 三置信度分级：HIGH/MEDIUM/LOW
- 安全机制：备份、验证、用户审批、自动回滚、Git 提交
- 支持 Hook 在会话结束自动反射

**详细分析**: [./claude-reflect-system.md](./claude-reflect-system.md)

---

### 2. singularity-claude (Claude Code 原生)

**仓库**: https://github.com/Shmayro/singularity-claude  
**作者**: Shmayro  
**适用平台**: Claude Code CLI  
**核心思想**: Skills that evolve themselves —— 技能自我进化

**完整进化循环**:

```
缺口检测 → 创建 → 执行 → 评分 → 修复 → 固化
```

**五级成熟度**:

- Draft → Tested → Hardened → Crystallized

**五个评分维度** (总分 0-100):

- 正确性 (20)
- 完整性 (20)
- 边界情况 (20)
- 效率 (20)
- 可复用性 (20)

**详细分析**: [./singularity-claude.md](./singularity-claude.md)

---

### 3. OpenClaw (多平台 Gateway)

**官网**: https://openclaw.ai/  
**仓库**: https://github.com/openclaw  
**适用平台**: 多平台（Claude Code、Pi 等）  
**核心思想**: AI Agent Gateway，连接聊天渠道和后端 AI 智能体

**主要特点**:

- 🦞 **本地优先**：所有数据本地存储，隐私保护
- 📱 **多渠道支持**：WhatsApp、Telegram、Discord、iMessage 等，支持插件扩展
- 🔀 **多智能体路由**：按智能体/工作区隔离会话
- 🖥️ **Web 控制界面**：浏览器仪表板管理聊天、配置、会话
- 📱 **移动节点**：配对 iOS/Android 节点，支持 Canvas

**自改进协同模式**:

- OpenClaw 作为执行层，接收自然语言需求
- Claude Code 生成/优化代码，自动校验
- OpenClaw 执行，反馈结果
- 失败时 Claude 自动分析修复，循环迭代 → 实现自主自改进

**官方文档**: https://docs.openclaw.ai/zh-CN

---

### 4. Moltron (灵感来源)

**仓库**: https://github.com/adridder/moltron  
**平台**: SmythOS  
**核心**: 自进化技能引擎，启发了 singularity-claude

singularity-claude 采用相同核心思想（评分、自动修复、固化、成熟），但为 Claude Code 原生重构，零外部依赖。

---

## 跨平台兼容性对比

Agent Skills 是开放标准，大多数工具遵循该标准，因此可以跨平台使用：

| 工具                    | Claude Code | OpenCode | OpenClaw | 遵循 Agent Skills         |
|-----------------------|-------------|----------|----------|-------------------------|
| claude-reflect-system | ✅ 原生        | ✅ 可适配    | ✅ 可适配    | ✅ Yes                   |
| singularity-claude    | ✅ 原生        | ✅ 可适配    | ✅ 可适配    | ⚠️ Claude Code 插件格式，可转换 |
| OpenClaw              | ✅ 协同        | ✅ 协同     | ✅ 原生     | ✅ Yes                   |

---

## Agent Skills 开放标准

所有现代自改进工具都基于 Agent Skills 开放标准：

- **官方网站**: https://agentskills.io/
- **格式**: 每个技能一个目录，`SKILL.md` 入口 + YAML frontmatter
- **发现机制**: 只有 `SKILL.md` 会被发现，其他文件不会被加载
- **internal 标记**: `metadata.internal: true` 可以隐藏技能，默认不安装
- **支持平台**: 40+ AI 编程工具支持，包括 Claude Code、OpenCode、OpenClaw、Cursor、Roo Code 等

**详细分析**: [./agentskills-io.md](./agentskills-io.md)

---

## Claude Code 官方 Skills 机制

Claude Code 完全遵循 Agent Skills 标准，并扩展了额外功能：

- `context: fork` 在隔离 subagent 中运行
- `disable-model-invocation: true` 禁止自动调用，仅用户可触发
- `allowed-tools` 限制可用工具
- 动态上下文注入 `` !`command` ``
- `paths` 限制仅在特定路径激活

**详细分析**: [./claude-code-skills-doc.md](./claude-code-skills-doc.md)

---

## 对比总结

| 特性                  | claude-reflect-system | singularity-claude     | OpenClaw  |
|---------------------|-----------------------|------------------------|-----------|
| **自改进方式**           | 用户纠正学习                | 自动评分 + 递归进化            | 协同执行层     |
| **完整生命周期**          | ❌ 仅限改进现有技能            | ✅ 缺口检测→创建→固化           | ✅ 作为网关配合  |
| **成熟度模型**           | ❌ 无                   | ✅ Draft → Crystallized | -         |
| **量化评分**            | ❌ 置信度分级               | ✅ 5维度 0-100            | -         |
| **自动修复**            | 用户触发                  | 低分自动触发                 | 需要配合      |
| **遵循 Agent Skills** | ⚠️ 插件格式               | ⚠️ 插件格式                | ✅ 网关+技能兼容 |
| **跨平台**             | ❌ Claude Code 仅       | ❌ Claude Code 仅        | ✅ 多平台     |

---

## 推荐选型

| 场景                               | 推荐工具                                                                    |
|----------------------------------|-------------------------------------------------------------------------|
| 你主要用 Claude Code，只需要从用户纠正中学习     | **claude-reflect-system**                                               |
| 你想要完整的自动进化，从创建到固化完整循环            | **singularity-claude**                                                  |
| 你需要跨渠道（WhatsApp/Telegram）访问，本地部署 | **OpenClaw** + 上述任一技能                                                   |
| 需要遵循 `npx skills` 标准，自己设计新工具     | 基于本仓库设计，参考 [self-improve-tool-design.md](./self-improve-tool-design.md) |

---

## 信息来源

- claude-reflect-system: 官方 README 获取于 2026-04-05
- singularity-claude: 官方 README 获取于 2026-04-05
- OpenClaw: 官方文档 获取于 2026-04-05
- Agent Skills: 官方文档 获取于 2026-04-05
- Claude Code Skills: 官方文档 获取于 2026-04-05
