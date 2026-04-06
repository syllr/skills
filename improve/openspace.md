# OpenSpace 分析

**项目地址**: https://github.com/HKUDS/OpenSpace  
**团队**: 香港大学数据科学学院 (HKUDS)  
**信息来源**: 官方 README (获取于 2026-04-06)

---

## 项目概述

**OpenSpace** 是港大 HKUDS 出品的**自进化 Agent 框架**，让每个任务都让每个 Agent 变得更聪明、更省钱。

> "Make Your Agents: Smarter, Low-Cost, Self-Evolving"

核心设计思想：**一个 Agent 学习，所有 Agent 受益 — 大规模集体智能**。

---

## 核心问题与解决方案

### 问题场景

当今 AI Agents 的关键弱点 — 它们从不从真实经验中**学习、适应、进化**：
- ❌ **大量 Token 浪费** — 如何复用成功模式，而不是每次从头推理？
- ❌ **重复昂贵失败** — 如何跨 Agent 分享解决方案？
- ❌ **技能质量不可靠** — 工具和 API 演进时如何维护技能可靠性？

### 解决方案

三大超能力：

#### 🧬 自进化 (Self-Evolution)

技能自动学习和改进：
- ✅ **AUTO-FIX** — 技能损坏时自动修复
- ✅ **AUTO-IMPROVE** — 成功模式自动转化为更好版本
- ✅ **AUTO-LEARN** — 捕获可行工作流
- ✅ **质量监控** — 跟踪技能性能、错误率

#### 🌐 集体智能 (Collective Agent Intelligence)

将个体 Agent 转化为共享大脑：
- ✅ **共享进化** — 一个 Agent 的改进成为所有 Agent 的升级
- ✅ **网络效应** — 更多 Agent → 更丰富数据 → 更快进化
- ✅ **一键分享** — 上传/下载进化后的技能
- ✅ **访问控制** — 公开/私有/团队专属

#### 💰 Token 效率 (Token Efficiency)

更聪明的 Agent，显著降低成本：
- ✅ **停止重复工作** → 复用成功方案
- ✅ **任务成本递减** → 技能改进，成本降低
- ✅ **增量更新** → 只修复损坏部分
- ✅ **实测节省** — 4.2× 更好性能，46% Token 减少

---

## 架构设计

### 自进化引擎

技能不是静态文件 — 它们是自动选择、应用、监控、分析、进化的**活实体**。

**完整生命周期管理**: 从发现到应用到进化 — 全程无需人工干预。即使没有匹配技能，OpenSpace 也能完成任务。

### 三种进化模式

| 模式 | 说明 | 作用 |
|------|------|------|
| 🔧 **FIX** | 就地修复损坏或过时的指令 | 同技能，新版本 |
| 🚀 **DERIVED** | 从父技能创建增强或专门版本 | 新技能目录，与父技能共存 |
| ✨ **CAPTURED** | 从成功执行中提取新的可复用模式 | 全新技能，无父技能 |

### 三种独立触发机制

多重防线防止技能退化 — 成功和失败执行都驱动进化：

| 触发器 | 说明 |
|--------|------|
| 📈 **后执行分析** | 每次任务后运行，分析完整录音，建议 FIX/DERIVED/CAPTURED |
| ⚠️ **工具退化检测** | 工具成功率下降时，质量监控找到所有依赖技能批量进化 |
| 📊 **指标监控** | 定期扫描技能健康指标（应用率、完成率、回退率），进化低表现者 |

### 全栈质量监控

多层跟踪覆盖整个执行栈：

- **🎯 Skills** — 应用率、完成率、有效使用率、回退率
- **🔨 Tool Calls** — 成功率、延迟、标记问题
- **⚡ Code Execution** — 执行状态、错误模式

**级联进化**: 当任何组件退化 — 技能工作流或单个工具调用 — 自动触发所有上游依赖技能的进化。

### 智能安全进化

**🤖 自主演化**: 每次演化自主探索代码库、发现根因、决定修复 — 先收集真实证据再修改。

**⚡ 基于差异的高效**: 生成最小化针对性差异而非完全重写，失败自动重试。每个版本存储在版本 DAG 中，完整谱系跟踪。

**🛡️ 内置安全措施**:
- 确认门槛减少误报触发
- 防循环保护防止失控进化
- 安全检查标记危险模式（提示注入、凭证泄露）
- 进化后的技能在替换前验证

---

## 云社区

协作技能注册中心，Agent 分享进化后的技能。当一个 Agent 进化出改进，每个连接的 Agent 都可以发现、导入、并在其基础上构建 — 将个人进步转化为集体智能。

- 🔐 **灵活分享**: 公开分享、组内分享或保持私有。智能搜索找到所需并自动导入。每次进化都有完整谱系跟踪和差异对比。
- ☁️ **协作平台**: open-space.cloud — 注册获取 API key，浏览社区技能，管理团队。

---

## 基准测试 GDPVal

在 GDPVal (220 个真实世界专业任务，涵盖 44 种职业) 上评估，使用 ClawWork 评估协议。

**实测结果** (Qwen 3.5-Plus 作为骨干 LLM)：
- **4.2× 更高收入** vs ClawWork 基线
- **72.8% 价值捕获** — $15,764 任务价值中获得 $11,484
- **70.8% 平均质量** — 比最佳 ClawWork Agent (+30pp)
- **45.9% Phase 2 Token 使用** vs Phase 1 — 更好结果，大幅降低成本

### 进化产生了什么？

在 50 个 Phase 1 任务中，OpenSpace 自主演化了 **165 个技能**：

| 目的 | 数量 | 教会 Agent 什么 |
|------|------|----------------|
| **文件格式 I/O** | 44 | PDF 提取回退、DOCX 解析、Excel 合并单元格处理 |
| **执行恢复** | 29 | 分层回退：沙箱失败 → shell → 文件写入再运行 |
| **文档生成** | 26 | 端到端文档管道，document-gen-fallback 演化了 13 个版本 |
| **质量保证** | 23 | 写后验证：检查 Excel 行数、验证 PDF 页数 |
| **任务编排** | 17 | 多文件跟踪、ZIP 打包、零迭代失败检测 |
| **领域工作流** | 13 | SOAP 笔记、音频制作、视频管道 |
| **Web & 研究** | 11 | SSL/代理调试、搜索回退、JS 重页面处理 |

---

## 安装方式

### 基础安装

```bash
git clone https://github.com/HKUDS/OpenSpace.git && cd OpenSpace
pip install -e .
openspace-mcp --help   # 验证安装
```

### 集成到 Agent

OpenSpace 通过 MCP 协议集成到任何支持 `SKILL.md` 技能的 Agent：

```json
{
  "mcpServers": {
    "openspace": {
      "command": "openspace-mcp",
      "toolTimeout": 600,
      "env": {
        "OPENSPACE_HOST_SKILL_DIRS": "/path/to/your/agent/skills",
        "OPENSPACE_WORKSPACE": "/path/to/OpenSpace",
        "OPENSPACE_API_KEY": "sk-xxx (可选，用于云社区)"
      }
    }
  }
}
```

然后复制技能到 Agent 技能目录：

```bash
cp -r OpenSpace/openspace/host_skills/delegate-task/ /path/to/your/agent/skills/
cp -r OpenSpace/openspace/host_skills/skill-discovery/ /path/to/your/agent/skills/
```

### 作为独立工具使用

```bash
# 交互模式
openspace

# 执行任务
openspace --model "anthropic/claude-sonnet-4-5" --query "Create a monitoring dashboard"

# 云 CLI
openspace-download-skill <skill_id>         # 从云端下载技能
openspace-upload-skill /path/to/skill/dir   # 上传技能到云端
```

### Python API

```python
import asyncio
from openspace import OpenSpace

async def main():
    async with OpenSpace() as cs:
        result = await cs.execute("Analyze GitHub trending repos")
        print(result["response"])
        
        for skill in result.get("evolved_skills", []):
            print(f"  Evolved: {skill['name']} ({skill['origin']})")

asyncio.run(main())
```

---

## 本地仪表板

可视化技能进化 — 浏览技能、跟踪谱系、比较差异。

```bash
# 终端1: 启动后端 API
openspace-dashboard --port 7788

# 终端2: 启动前端开发服务器
cd frontend
npm install
npm run dev
```

---

## 代码结构

```
OpenSpace/
├── openspace/
│   ├── tool_layer.py              # 主类 & 配置
│   ├── mcp_server.py              # MCP 服务器 (4 个工具)
│   │
│   ├── agents/                    # Agent 系统
│   │   ├── base.py                # 基础 Agent 类
│   │   └── grounding_agent.py     # 执行 Agent
│   │
│   ├── grounding/                 # 统一后端系统
│   │   ├── core/                  # 核心组件
│   │   └── backends/              # 各种后端 (shell, GUI, MCP, web)
│   │
│   ├── skill_engine/              # 自进化技能系统
│   │   ├── registry.py            # 发现、选择
│   │   ├── analyzer.py            # 后执行分析
│   │   ├── evolver.py             # FIX / DERIVED / CAPTURED 进化
│   │   ├── patch.py               # 多文件应用
│   │   └── store.py               # SQLite 持久化、版本 DAG
│   │
│   ├── cloud/                     # 云社区
│   │   ├── client.py              # HTTP 客户端
│   │   └── search.py              # 混合搜索引擎
│   │
│   └── skills/                    # 内置技能
```

---

## 优缺点分析

### 优点

✅ **学术背景** — 港大 HKUDS 出品，研究驱动设计  
✅ **多平台支持** — Claude Code、Codex、OpenClaw、nanobot、Cursor 等  
✅ **云社区** — 技能云端共享，集体智能  
✅ **Token 效率** — 实测 46% Token 节省  
✅ **三模式进化** — FIX/DERIVED/CAPTURED 覆盖各种场景  
✅ **三触发机制** — 后执行/工具退化/指标监控多重保障  
✅ **全栈监控** — 技能→工具调用→代码执行三层跟踪  
✅ **级联进化** — 组件退化自动触发上游依赖进化  
✅ **安全措施** — 确认门槛、防循环、安全检查  
✅ **可视仪表板** — 本地 Web UI 查看进化谱系

### 局限性

- 需要配置 MCP 才能集成到 Agent
- 云社区需要 API key
- 相比轻量级技能包，安装配置更复杂

---

## 与其他方案对比

| 特性 | OpenSpace | singularity-claude | self-improving-agent |
|------|-----------|--------------------|-----------------------|
| **学习来源** | 执行分析+工具退化和指标监控 | 自动评分 + 用户可选 | 全技能经验 + 用户反馈 |
| **进化模式** | FIX/DERIVED/CAPTURED | 缺口检测→创建→固化 | 经验提取→模式抽象→更新 |
| **成熟度模型** | 版本 DAG + 谱系跟踪 | Draft → Crystallized | 置信度跟踪 |
| **存储** | SQLite | 独立 JSON 文件 | 多内存分离 |
| **云社区** | ✅ 有 | ❌ 无 | ❌ 无 |
| **Token 效率优化** | ✅ 有 (46% 节省) | ❌ 无 | ❌ 无 |
| **跨平台** | ✅ 多平台 | ❌ Claude Code 仅 | ❌ Claude Code 仅 |
| **依赖** | MCP 协议 | Haiku 评分 | 零依赖 |

---

## 推荐选型

| 场景 | 推荐方案 |
|------|----------|
| 需要云社区技能共享，多 Agent 协同进化 | **OpenSpace** |
| 需要最大化 Token 效率，降低成本 | **OpenSpace** |
| 需要全栈质量监控和级联进化 | **OpenSpace** |
| 只需要单 Agent 自进化，无需云端 | singularity-claude 或 self-improving-agent |
| 需要多内存架构支持复杂知识沉淀 | self-improving-agent |

---

## 参考资料

- **GitHub**: https://github.com/HKUDS/OpenSpace
- **官网**: https://open-space.cloud
- **GDPVal Benchmark**: https://huggingface.co/datasets/openai/gdpval
- **论文**: 基于 SimpleMem 和 Multi-Memory Survey 研究
