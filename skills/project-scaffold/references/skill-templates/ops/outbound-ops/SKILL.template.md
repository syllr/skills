---
name: outbound-ops
description: L3 Outbound 契约域唯一入口——为每个应用生成 / 维护对外集成文档 docs/contracts/outbound/<应用>.md，本质是「接口 → client 代码」的映射（按该应用调用的外部系统分章，每章写清 Client 与调用方式，再列接口与 方法签名 + client 代码位置），字段与接入细节现读 client 代码。触发词：写集成文档、生成集成文档、更新集成文档、外部集成说明、Outbound 集成、第三方接口、外部服务契约、集成契约、接口映射、新增外部服务、AI 读代码写集成。
---

# outbound-ops — L3 Outbound 外部集成文档

本 skill 是 L3 Outbound 契约域唯一入口：外部集成契约按应用逐个应用写成 `docs/contracts/outbound/<应用>.md`，本质是「接口 →
client 代码」的映射——登记本应用调用了哪些外部系统、每个外部系统调了哪些接口与 client 代码位置，字段 / 接入细节 / 错误码现读
client 代码。

- 负责 `docs/contracts/outbound/`（每应用一份）的生成与维护；数据库、对象存储、缓存等基础设施不算外部集成。
- Inbound 半边（对外接口）归 `inbound-ops` skill。

## 读取

- 骨架 [assets/CONTRACT.template.md](assets/CONTRACT.template.md)（单应用集成文档骨架）。
- 读应用清单（`docs-architecture`）与集成 client / Adapter
  代码：按应用盘点它调用了哪些外部系统、每个系统有几类接入方式与各自框架（HTTP / gRPC / SDK 等）。
- 读现有 `docs/contracts/outbound/`；已有文档只提取仍有效的信息。

## 生成与更新

生成与更新走同一条流程：先读模板，再扫目标位置判断有无既有文档，有则更新、无则新建。

1. 确定要覆盖的应用：应用清单见 `docs-architecture`。
2. 每个应用在 `docs/contracts/outbound/<应用>.md`
   建一份集成文档（按 [assets/CONTRACT.template.md](assets/CONTRACT.template.md)）： **按该应用调用的外部系统分章**
   ，每章分两个子小节——`Client 与调用方式`（解析方式）与 `接口列表`（每接口给 方法签名 + client 代码位置），让 AI 据此去读
   client 代码解析。
3. 接口或 client 代码位置变化时更新对应应用文档；外部系统 / 接口删除时清理文件与引用，检查悬空引用与残留。
4. 有既有产物时读现有文档，提取仍有效的信息，按该形态重建。
5. 报告变更清单。

## 联动

- 架构外部依赖或调用方变化时，联动 `docs-architecture`。
- 外部数据资产与字段术语变化时，联动 `docs-data-model`；部署密钥、回调或连接配置变化时，联动 `deploy-ops`。
- Inbound 半边归 `inbound-ops` skill。

## 完成判定

- 每个被覆盖应用有一份 `docs/contracts/outbound/<应用>.md`；正文是「接口 → client 代码位置」映射，不复述字段 / 接入细节 /
  错误码（以 client 代码为准）。
- 按该应用调用的外部系统分章，每章含「Client 与调用方式」「接口列表」两个子小节；接口每行给 方法签名 + client 代码位置。
- 文档与 client 代码一致，无悬空引用；外部系统 / 接口删除后无残留文档。

## 边界

- 只覆盖本应用实际调用的接口、只做部分即可；文档是接口到 client 代码的映射，字段 / 接入细节 / 错误码以 client 代码为准、不在此复述。
- 不生成客户端代码。
