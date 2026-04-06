# 自改进工具汇总 - Claude / OpenCode / OpenClaw 通用

搜集各个平台（Claude Code、OpenCode、OpenClaw）下流行的自改进/自学习技能工具。

---

## 已知名单

### 自改进技能工具（直接提供自改进能力）

| 项目                                      | 仓库                                        | 适用平台        | 星标  | 特点                                   |
|-----------------------------------------|-------------------------------------------|-------------|-----|--------------------------------------|
| **claude-reflect-system**               | haddock-development/claude-reflect-system | Claude Code | -   | 用户纠正一次永久学会                           |
| **singularity-claude**                  | Shmayro/singularity-claude                | Claude Code | 14+ | 完整递归进化循环，缺口检测→创建→评分→修复→固化            |
| **agent-playbook/self-improving-agent** | syllr/agent-playbook                      | Claude Code | -   | 多内存架构，从所有技能经验中持续学习                   |
| **OpenSpace**                           | HKUDS/OpenSpace                           | 多平台         | -   | 港大HKUDS出品，云社区共享进化，46% Token节省        |
| **Moltron**                             | adridder/moltron                          | SmythOS     | -   | 灵感来源，自进化技能引擎（singularity-claude 基于此） |

### 网关/框架（配合自改进工具使用）

| 项目           | 仓库                | 适用平台 | 特点                                                            |
|--------------|-------------------|------|---------------------------------------------------------------|
| **OpenClaw** | openclaw/openclaw | 多平台  | AI Agent Gateway，支持 WhatsApp/Telegram 等多渠道接入，本地优先，可以配合自改进工具使用 |
| **OpenCode** | sst/opencode      | 多平台  | 开源 AI 编程终端，原生支持 Agent Skills 标准，可以加载自改进技能                     |

---

## 各工具详细分析

### 1. claude-reflect-system (第三方技能)

**仓库**: https://github.com/haddock-development/claude-reflect-system  
**作者**: haddock-development  
**适用平台**: Claude Code CLI  
**核心思想**: "Correct once, never again" —— 纠正一次，永不再犯

**主要特点**:

- 针对用户纠正式学习，检测用户纠正模式
- 三置信度分级：HIGH/MEDIUM/LOW
- 安全机制：备份、验证、用户审批、自动回滚、Git 提交
- 支持 Hook 在会话结束自动反射

**安装方式**:

```bash
# 复制到 Claude Code 技能目录
cp -r reflect ~/.claude/skills/
```

**详细分析**: [./claude-reflect-system.md](./claude-reflect-system.md)

---

### 2. singularity-claude (第三方插件)

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

**安装方式**:

```bash
# 方式1: 从 Claude Code 插件注册表安装（推荐）
/plugin marketplace add Shmayro/singularity-claude
/plugin install singularity-claude

# 方式2: 从 npm 安装
npm install -g singularity-claude
/plugin marketplace add $(npm root -g)/singularity-claude
/plugin install singularity-claude

# 方式3: 从源码安装
git clone https://github.com/Shmayro/singularity-claude.git
/plugin marketplace add .
/plugin install singularity-claude
```

**详细分析**: [./singularity-claude.md](./singularity-claude.md)

---

### 3. agent-playbook/self-improving-agent (第三方技能)

**仓库**: https://github.com/syllr/agent-playbook  
**作者**: syllr  
**适用平台**: Claude Code CLI  
**核心思想**: 从每一次交互中学习，将具体经验抽象为可复用模式

**完整四阶段流程**:

```
经验提取 → 模式抽象 → 技能更新 → 内存合并
```

**多内存架构**:

- **Semantic Memory**: 抽象模式和规则 (可跨上下文复用)
- **Episodic Memory**: 具体的经验片段和发生了什么
- **Working Memory**: 当前会话上下文

**安装方式**:

```bash
# 方式1: 使用 npx skills 安装（推荐）
npx skills add syllr/agent-playbook --skill self-improving-agent -g -a claude-code

# 方式2: 手动复制
git clone https://github.com/syllr/agent-playbook.git
cp -r agent-playbook/skills/self-improving-agent ~/.claude/skills/
```

**详细分析**: [./agent-playbook-self-improving-agent.md](./agent-playbook-self-improving-agent.md)

---

### 4. OpenSpace (港大HKUDS 自进化框架)

**仓库**: https://github.com/HKUDS/OpenSpace  
**作者**: HKUDS (香港大学数据科学学院)  
**适用平台**: Claude Code、Codex、OpenClaw、nanobot、Cursor 等  
**核心思想**: Make Your Agents Smarter, Low-Cost, Self-Evolving

**三大核心能力**:

#### 🧬 自进化 (Self-Evolution)

- **AUTO-FIX** — 技能损坏时自动修复
- **AUTO-IMPROVE** — 成功模式自动转化为更好的技能版本
- **AUTO-LEARN** — 从实际使用中捕获可行工作流
- **质量监控** — 跟踪技能性能、错误率、执行成功率

**三种进化模式**:
- 🔧 **FIX** — 就地修复损坏或过时的指令
- 🚀 **DERIVED** — 从父技能创建增强或专门版本
- ✨ **CAPTURED** — 从成功执行中提取新的可复用模式

**三种触发机制**:
- 📈 **后执行分析** — 每次任务后运行
- ⚠️ **工具退化检测** — 工具成功率下降时批量进化
- 📊 **指标监控** — 定期扫描技能健康指标

#### 🌐 集体智能 (Collective Agent Intelligence)

- **共享进化**: 一个 Agent 的改进成为所有 Agent 的升级
- **网络效应**: 更多 Agent → 更丰富数据 → 更快进化
- **云社区**: 一键上传/下载进化后的技能
- **访问控制**: 公开/私有/团队专属

#### 💰 Token 效率 (Token Efficiency)

- **停止重复工作** → 复用成功方案
- **任务成本递减** → 技能改进，成本降低
- **增量更新** → 只修复损坏部分
- **实测节省**: 46% Token 减少，4.2× 收入提升

**安装方式**:
```bash
# 安装
git clone https://github.com/HKUDS/OpenSpace.git && cd OpenSpace
pip install -e .

# 添加到 Agent MCP 配置
# (参考官方文档配置 mcpServers)

# 或作为独立工具使用
openspace --model "anthropic/claude-sonnet-4-5" --query "your task"
```

**官方文档**: https://open-space.cloud

---

### 5. OpenClaw (多平台 Gateway)

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

### 6. Moltron (灵感来源)

**仓库**: https://github.com/adridder/moltron  
**平台**: SmythOS  
**核心**: 自进化技能引擎，启发了 singularity-claude

singularity-claude 采用相同核心思想（评分、自动修复、固化、成熟），为零外部依赖的 Claude Code 实现。

---

## 跨平台兼容性对比

Agent Skills 是开放标准，大多数工具遵循该标准，因此可以跨平台使用：

| 工具                                      | Claude Code | OpenCode | OpenClaw | 遵循 Agent Skills         |
|-----------------------------------------|-------------|----------|----------|-------------------------|
| **claude-reflect-system**               | ✅ 第三方技能     | ✅ 可适配    | ✅ 可适配    | ✅ Yes                   |
| **singularity-claude**                  | ✅ 第三方插件     | ✅ 可适配    | ✅ 可适配    | ⚠️ Claude Code 插件格式，可转换 |
| **agent-playbook/self-improving-agent** | ✅ 第三方技能     | ✅ 可适配    | ✅ 可适配    | ✅ Yes                   |
| **OpenSpace**                           | ✅ 第三方框架     | ✅ 原生支持   | ✅ 原生支持   | ✅ Yes                   |
| **OpenClaw**                            | ✅ 协同        | ✅ 协同     | ✅ 原生     | ✅ Yes （网关+技能兼容）         |
| **OpenCode**                            | ✅ 协同        | ✅ 原生     | ✅ 协同     | ✅ Yes （原生支持技能）          |

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

| 特性                  | claude-reflect-system | singularity-claude     | self-improving-agent | OpenSpace       | OpenClaw  | OpenCode |
|---------------------|-----------------------|------------------------|----------------------|-----------------|-----------|----------|
| **自改进方式**           | 用户纠正学习                | 自动评分 + 递归进化            | 全技能经验 + 用户反馈         | 三模式进化+三触发机制     | 网关协同执行    | 原生支持技能   |
| **完整生命周期**          | ❌ 仅限改进现有技能            | ✅ 缺口检测→创建→固化           | ✅ 所有技能持续进化           | ✅ 发现→应用→进化完整闭环  | ✅ 作为网关配合  | ✅ 加载技能   |
| **成熟度模型**           | ❌ 无                   | ✅ Draft → Crystallized | ✅ 置信度跟踪              | ✅ 版本DAG+谱系跟踪   | -         | -        |
| **量化评分**            | ❌ 置信度分级               | ✅ 5维度 0-100            | ✅ 用户评分(1-10)+置信度     | ✅ 质量监控+指标跟踪    | -         | -        |
| **自动修复**            | 用户触发                  | 低分自动触发                 | 错误钩子触发               | ✅ 三种触发自动修复     | 需要配合      | 需要配合     |
| **多内存架构**           | ❌ 无                   | ❌ 无                    | ✅ 语义+情景+工作           | ❌ SQLite存储     | -         | -        |
| **云社区共享**           | ❌ 无                   | ❌ 无                    | ❌ 无                  | ✅ 技能云端共享       | ❌ 无       | ❌ 无      |
| **Token效率**         | ❌ 无优化                 | ❌ 无优化                  | ❌ 无优化                | ✅ 46% Token节省  | ❌ 无优化     | ❌ 无优化    |
| **遵循 Agent Skills** | ✅ Yes                 | ⚠️ 插件格式                | ✅ Yes                | ✅ Yes           | ✅ 网关+技能兼容 | ✅ 原生支持   |
| **跨平台**             | ❌ Claude Code 仅       | ❌ Claude Code 仅        | ❌ Claude Code 仅      | ✅ 多平台           | ✅ 多平台     | ✅ 多平台    |

---

## 推荐选型

| 场景                                        | 推荐工具                                                                    |
|-------------------------------------------|-------------------------------------------------------------------------|
| 你主要用 Claude Code，只需要从用户纠正中学习              | **claude-reflect-system**                                               |
| 你想要完整的自动进化，从创建到固化完整循环                     | **singularity-claude**                                                  |
| 你需要从所有技能经验中持续学习，支持多内存架构                  | **agent-playbook/self-improving-agent**                                 |
| 你需要云社区技能共享，多平台支持，Token效率优化                | **OpenSpace**                                                           |
| 你需要跨渠道（WhatsApp/Telegram）访问，本地部署          | **OpenClaw** + 上述任一技能                                                   |
| 你使用 OpenCode 开源终端，需要自改进能力               | OpenCode 原生支持 Agent Skills，可直接安装任一上述技能                                  |
| 需要遵循 `npx skills` 标准，自己设计新工具              | 基于本仓库设计，参考 [self-improve-tool-design.md](./self-improve-tool-design.md) |

---

## 信息来源

- claude-reflect-system: 官方 README 获取于 2026-04-05
- singularity-claude: 官方 README 获取于 2026-04-05
- agent-playbook/self-improving-agent: SKILL.md 及相关文档 获取于 2026-04-05
- OpenSpace: 官方 README 获取于 2026-04-06
- OpenClaw: 官方文档 获取于 2026-04-05
- Agent Skills: 官方文档 获取于 2026-04-05
- Claude Code Skills: 官方文档 获取于 2026-04-05
