---
name: inbound-ops
description: L3 Inbound 契约域唯一入口——为每个应用生成 / 维护对外接口文档 docs/contracts/inbound/<应用>.md，本质是「接口 → 代码」的映射（按应用、按 API 类型 / 框架分章写解析方式，按业务域分小节列接口与代码位置），字段与解析细节现读代码。触发词：写接口文档、生成接口文档、更新接口文档、接口契约文档、对外接口说明、Inbound 接口、接口变更、接口漂移、接口映射、AI 读代码写接口。
---

# inbound-ops — L3 Inbound 契约域

本 skill 是 L3 Inbound 契约域唯一入口：对外接口契约按应用逐个应用写成 `docs/contracts/inbound/<应用>.md`，本质是「接口 →
代码」的映射——只登记接口与代码位置，字段 / 校验 / 错误码等细节现读代码。

- 负责 `docs/contracts/inbound/`（每应用一份）的生成与维护。
- Outbound 半边（外部集成）归 `outbound-ops` skill；跨文档编排归 `align-docs` skill。

## 读取

- 骨架 [assets/INBOUND-APP.template.md](assets/INBOUND-APP.template.md)（单应用接口文档骨架）。
- 读应用清单（`docs-architecture`）、业务域（`docs-domain`，业务分类依据）与后端代码：按应用盘点它有几类 inbound API
  与各自框架（Go / Python / Java 等，路由与方法的标识方式各不相同）。
- 读现有 `docs/contracts/inbound/`；已有文档只提取仍有效的信息。

## 生成与更新

生成与更新走同一条流程：先读模板，再扫目标位置判断有无既有文档，有则更新、无则新建。

1. 确定要覆盖的应用：应用清单见 `docs-architecture`。
2. 每个应用在 `docs/contracts/inbound/<应用>.md`
   建一份接口文档（按 [assets/INBOUND-APP.template.md](assets/INBOUND-APP.template.md)）： **按该应用的 inbound API 类型 /
   框架分章**，每章写解析方式（什么框架、路由与 HTTP 方法怎么标识、怎么解析）；接口列表 **按业务域分组**（业务域取自
   `docs/L2/domain/`），每接口给 方法 + 路径 + 代码位置，让 AI 据此去读代码解析。
3. 接口或代码位置变化时更新对应应用文档；应用 / 接口删除时清理文件与引用，检查悬空引用与残留。
4. 有既有产物时读现有文档，提取仍有效的信息，按该形态重建。
5. 报告变更清单。

## 联动

- 应用清单与边界变化时，联动 `docs-architecture`；业务域清单、领域 Action、业务能力变化时，联动 `docs-domain`、
  `docs-business`。
- Outbound 半边（`docs/contracts/outbound/`）归 `outbound-ops` skill。

## 完成判定

- 每个被覆盖应用有一份 `docs/contracts/inbound/<应用>.md`；正文是「接口 → 代码位置」映射，不复述字段 / 校验 / 错误码（以代码为准）。
- 按 API 类型 / 框架分章，每章含解析方式；接口按业务域分组，且业务域与 `docs-domain` 一致。
- 文档与代码一致，无悬空引用；应用 / 接口删除后无残留文档。

## 边界

- 只覆盖部分接口即可；文档是接口到代码的映射，字段 / 校验 / 错误码以代码为准、不在此复述。
- 不生成客户端代码。
