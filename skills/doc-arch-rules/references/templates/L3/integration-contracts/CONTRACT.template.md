---
title: INTEGRATION-CONTRACT — 外部服务契约（Outbound）
doc_type: template
layer: L3
description: L3 契约层 外部服务契约文件的更新规范——修改 docs/L3/integration-contracts/ 下任一契约文件时触发，按模板 generation 元数据生成或更新该外部服务契约
globs:
  - "docs/L3/integration-contracts/**"
# 生成提示词（元信息 · 仅模板持有，实例不含本块）
generation:
  tools:
    - Markdown 表格（接口/字段/错误码）
  related: # 关联模板与联动修改
    INTEGRATION: 说明书 SSOT 在它 §1/§2（总览与概览），本契约文件的接入/状态变化需同步说明书（不复制字段）
    TECHNOLOGY-ARCHITECTURE: 外部依赖 SSOT 在它 §4，选型变化需同步本契约
    DOMAIN-MODEL: 外部数据源与 ACL Adapter 在它 §5.1/§7，字段术语需与领域模型对齐
    DEPLOYMENT: 外部服务密钥/回调需同步部署配置
  # 需要用户决策的才问（无歧义则不问）
  ask_user:
    - 外部服务选择有争议时（如选哪个 AI 供应商）→ 问用户
  flow: # 生成流程
    - 扫描（自主）：读 TECHNOLOGY-ARCHITECTURE §4 外部依赖 + INTEGRATION §1 总览（服务定位）+ DOMAIN-MODEL §5.1 外部数据资产（字段术语来源）+ DOMAIN-MODEL §7 ACL Adapter（翻译标准）+ 目标契约文件；扫描源缺失→以已有源+目标文档为准，不臆造
    - 已有契约文件 → 参考旧文档有效信息，但结构按本模板重建
    - 按模板生成：契约状态 → 接入方式 → 鉴权 → 接口清单 → 字段定义 → 错误码 → 调用方 → 失败处理
  notes: # 生成注意点（怎么生成）
    - **一服务一契约文件**：文件名为 `<service>-<name>.md` kebab-case（如 llm-api.md / vector-service.md），与 INTEGRATION §1 总览表「契约文件」列一一对应
    - **字段术语 SSOT 在本契约文件**：外部服务字段级定义/语义/错误码只在本文件维护，INTEGRATION 说明书不写字段；跨文件术语冲突以本契约文件为准（防 project_id/file_id ↔ kb_id/doc_id 类冲突）
    - **接口清单唯一事实源**：本契约文件的接口清单为准，说明书不列接口清单；接口与项目生命周期对应（如建库/删库与项目生命周期一一对应）
    - **契约状态必填**：`mock 中 / 已交付 / 已上线` 三态；mock 实现（如 InMemoryXxxAdapter）切换真实服务时替换 adapter，业务代码零改动
    - 鉴权/失败处理/错误码必填（错误码至少 1 行）
    - 外部服务归属应用须在 APPLICATION-ARCHITECTURE §2.2 可定位（由 INTEGRATION §1 总览维护，本文件引用不重复）
    - 字段类型与 DATA-DICTIONARY 一致（引用不复制）
  checks: # 生成后反向 check
    - "契约状态小节存在且值为 mock 中/已交付/已上线 三态之一"
    - "接入方式 + 鉴权 + 接口清单 + 错误码 + 失败处理齐全"
    - "文件名 kebab-case，与 INTEGRATION §1 总览表「契约文件」列一致"
    - "归属应用可在 APPLICATION-ARCHITECTURE §2.2 定位（由 INTEGRATION §1 总览维护，无悬空）"
    - "字段术语与 DOMAIN-MODEL §5.1/§7 一致（无旧术语残留）"
    - "接口清单与 INTEGRATION 说明书无重复声明（说明书不列接口）"
    - "错误码至少 1 行"
    - "迁移/删除后全仓 grep 旧名残留 = 0（STRUCTURE/README/上游文档/INTEGRATION 总览已同步）"
---

# <外部服务名> 契约

> 本文档是「<项目名>」外部服务 **<服务名>** 的契约文件——`docs/L3/integration-contracts/<service>-<name>.md`（kebab-case，如 llm-api.md）。
> 【模板使用指引】复制为契约文件，按各章节指引填写；本文件是字段级契约的唯一事实源（SSOT），INTEGRATION 说明书只引用不复制。
> 【原则】① 一服务一契约：字段术语/接口清单/错误码只在本文件维护（SSOT），INTEGRATION 说明书只引用不复制；② 契约状态标注 mock/真实切换；③ 表规范见宪法无元信息表、无变更记录。

---

## 1. 契约状态（重要）

> 【指引】接口契约由平台定义，交付外部团队按此实现；业务编码阶段先 mock，切换时替换 adapter 业务零改动。

- **契约状态**：<mock 中 / 已交付 / 已上线>
- **mock 实现**：<如 InMemory<Xxx>Adapter>
- **切换方式**：<替换 Adapter 实现类（推荐，业务代码零改动）/ 修改连接配置指向真实服务；业务代码零改动>

---

## 2. 接入方式

- **接入类型**：<API / SDK / Webhook>
- **接入地址**：<base URL / 端点>
- **鉴权**：<AppSecret / Token / 签名>（必填）
- **超时**：<毫秒数，如 5000>

---

## 3. 接口清单

> 【指引】本契约文件的接口清单是唯一事实源；接口与项目生命周期对应（如建库/删库与项目生命周期一一对应）。

| 方法     | 路径   | 说明   |
| -------- | ------ | ------ |
| <method> | <path> | <说明> |

---

## 4. 字段定义

> 【指引】字段级定义/语义只在本文件维护（SSOT），术语与 DOMAIN-MODEL §5.1/§7 对齐；INTEGRATION 说明书不写字段。

| 字段    | 类型   | 必填  | 说明   |
| ------- | ------ | ----- | ------ |
| <field> | <type> | <Y/N> | <语义> |

---

## 5. 错误码

| 错误码 | 说明   |
| ------ | ------ |
| <code> | <含义> |

---

## 6. 调用方与失败处理

- **调用方**：<哪个模块调用>
- **失败处理**：<超时/重试/降级>（必填，格式：超时<毫秒数>ms/重试<次数>次/降级<策略>，示例：超时5000ms/重试3次/降级返回缓存）
