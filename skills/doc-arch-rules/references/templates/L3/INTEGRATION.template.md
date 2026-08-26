---
title: INTEGRATION — 外部集成（Outbound）
doc_type: template
layer: L3
description: L3 契约层 文档 INTEGRATION 的更新规范——修改 docs/L3/INTEGRATION.md 时触发，按模板 generation 元数据生成或更新该文档
globs:
  - "docs/L3/INTEGRATION.md"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - Markdown 表格（供应商/鉴权/接口/错误码）
  related: # 关联模板与联动修改
    TECHNOLOGY-ARCHITECTURE: 外部依赖 SSOT 在它 §4，选型变化需同步集成；infra 拓扑（DB/OSS/缓存）见它 §3.1 而非本表
    APPLICATION-ARCHITECTURE: 应用清单 SSOT 在它 §2.2，集成调用方归属应用需与之一致
    DOMAIN-MODEL: 外部数据源与外部接口契约在它 §3（聚合操作）+ §5.1（外部数据资产）+ §7（ACL Adapter），集成需与领域模型对齐
    API: 互补（Inbound vs Outbound），外部服务变化需同步本系统接口
    DEPLOYMENT: 外部服务密钥/回调需同步部署配置
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 外部服务选择有争议时（如选哪个 AI 供应商）→ 问用户
  flow: # 生成流程
    - 扫描（自主）：读 TECHNOLOGY §4 外部依赖（技术外部集成）+ APPLICATION §2.2 应用归属（确认调用方所在应用）+ DOMAIN-MODEL §3 聚合操作（领域触发的外部接口）+ DOMAIN-MODEL §5.1 外部数据源（领域视角的外部数据资产）+ DOMAIN-MODEL §7 ACL Adapter（integration 层翻译标准）+ 目标文档；扫描源缺失→以已有源+目标文档为准，不臆造
    - 已有 INTEGRATION → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：§1 外部集成总览 → §2 每服务详情（接入/鉴权/接口/失败处理）
  notes: # 生成注意点（怎么生成）
    - 只写外部集成契约（Outbound）：本系统调用的第三方服务（微信/支付/AI 供应商等）
    - 与 API（Inbound）互补：API 管"我提供什么"，INTEGRATION 管"我调用什么"
    - 数据库/对象存储/缓存属于基础设施（infra 层），不是外部集成（integration 层）——不列入本表，其选型与拓扑见 TECHNOLOGY-ARCHITECTURE §3.1 与 DEPLOYMENT
    - 集成来源两个维度：①技术外部依赖（TECHNOLOGY §4：基础设施与外部服务清单）+ ②领域外部数据源（DOMAIN-MODEL §5.1：外部数据资产），二者并集去重后落地为本表外部服务；不一致时以 TECHNOLOGY §4 为准
    - 集成调用方归属应用须在 APPLICATION-ARCHITECTURE §2.2 可定位；integration 层落地的 ACL Adapter 翻译遵循 DOMAIN-MODEL §7 标准
    - 鉴权/失败处理/错误码必填
    - 外部依赖 SSOT 在 TECHNOLOGY-ARCHITECTURE §4（引用不重列）
  checks: # 生成后反向 check
    - "每个外部服务有接入方式 + 鉴权 + 关键接口 + 失败处理"
    - "外部服务清单与 TECHNOLOGY-ARCHITECTURE §4 一致（SSOT 引用，不重列）"
    - "外部数据源覆盖 DOMAIN-MODEL §5.1 中标注的外部数据资产（无遗漏、无臆造）"
    - "每个外部服务的调用方归属应用可在 APPLICATION-ARCHITECTURE §2.2 找到对应（不悬空）"
    - "与 API（Inbound）方向不混淆"
    - "数据库/对象存储/缓存未误列为外部集成（infra ≠ integration）"
    - "内容条目无顺序编号（外部服务按服务名标识，不用 EXT-N；2.1 为章节序号，非条目编号）"
    - "无集成时 §1 填「无」、§2 保留标题写「暂无」"
---

# INTEGRATION — 外部集成（Outbound）

> 本文档是「<项目名>」的 **INTEGRATION（外部集成模板）**——L3 契约层的本系统调用第三方服务文档。
> 【模板使用指引】复制为 `docs/L3/INTEGRATION.md`，按各章节指引填写。
> 【原则】① **外部集成契约（Outbound）**：本系统调用的第三方服务——微信/支付/AI 供应商（L3 技术契约）；② 与 API（Inbound）互补：API 管"我提供什么"，INTEGRATION 管"我调用什么"；③ 表规范见宪法无元信息表、无变更记录。

---

## 1. 外部集成总览

> 【指引】本系统调用的第三方服务清单（供应商 + 用途 + 鉴权方式）。

| 外部服务 | 用途   | 鉴权方式 | 归属应用     |
| -------- | ------ | -------- | ------------ |
| <服务名> | <用途> | <鉴权>   | <归属应用名> |

> 【定位】"归属应用"列的值须能在 APPLICATION-ARCHITECTURE §2.2 应用清单中定位到对应应用，不允许悬空应用名。

---

## 2. 集成详情

### 2.1 <外部服务名>

**接入方式**：<API / SDK / Webhook>

**鉴权**：<AppSecret / Token / 签名>

**关键接口**：

| 方法     | 路径   | 说明   |
| -------- | ------ | ------ |
| <method> | <path> | <说明> |

**调用方**：<哪个模块调用>

**失败处理**：<超时/重试/降级>（必填，格式：超时__ms/重试__次/降级__策略，示例：超时5000ms/重试3次/降级返回缓存）

**错误码**：（必填，至少 1 行）

| 错误码 | 说明   |
| ------ | ------ |
| <code> | <含义> |

（每个外部服务一小节，补充）
