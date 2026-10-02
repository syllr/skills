# openapi/ 目录骨架

## 1. 目录结构

<!-- 生成提示:begin -->
本节不写目录树。`openapi/` 的目录层级、每个文件的作用与落盘规则由本 skill
的 [contract-assets.md](../references/contract-assets.md) §1 声明；本 skill 按该声明生成与验收，不以本文档为准。
<!-- 生成提示:end -->

## 2. `openapi.yaml`

<!-- 生成提示:begin -->
主契约只承载元信息与 `$ref`，`paths` 与 `components` 的定义都在拆分文件里。字段顺序：文件头注释（声明只承载元信息与引用）、
`openapi` 版本（3.1.0）、`info`（title / version）、`servers`（url / description）、`tags`（name / description）、`security`、`paths`
（每个端点用 `$ref` 指向 `./paths/{domain}.yaml` 的对应路径）、`components`（`schemas` / `responses` / `securitySchemes` 各用
`$ref` 指向对应拆分文件）；文件末尾用注释记录删除留痕与端点计数。
<!-- 生成提示:end -->

## 3. `paths/{domain}.yaml` 文件头注释块

<!-- 生成提示:begin -->
paths 拆分文件的文件头注释固定三行：依据来源（`docs/L2/domain/{domain}.md` 的章节与 Action 清单）、边界（本文件覆盖的端点范围）、x-action
汇总（Action 清单）。正文按 `paths` → `/{path}` → `{method}` 层级写 operationId、x-action、x-capability，响应以 `$ref` 指向
`components/responses`。
<!-- 生成提示:end -->

## 4. `components/` 拆分文件

<!-- 生成提示:begin -->
写 Schema、响应与鉴权方案拆分文件的顶层结构：`components` 下分 `schemas` / `responses` / `securitySchemes`，各自登记本文件承载的定义。
<!-- 生成提示:end -->
