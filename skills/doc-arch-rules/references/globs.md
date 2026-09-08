# globs 语法与用法（rule 触发路径）

> 本文件是 `globs` 的用法说明：写在哪、怎么写、怎么匹配、基线与扩展各怎么动。执行 globs 目录同步（功能 1 步骤 4 / 功能 2 update·rebuild 后置检查 / 功能 3 阶段 2 / 入口③）前先读本文件。

## 1. 写在哪

`globs` 住在每份 rule 的 frontmatter 里，决定"编辑某个文件时注入本 rule"：

```markdown
---
description: L2 架构层 文档 DOMAIN-MODEL 的更新规范
globs:
  - "docs/L2/domain/DOMAIN-MODEL.md"
  - "backend/app/models/**"
---
```

`alwaysApply: true` 的 rule（仅 CONSTITUTION）无视 globs，全局注入；其余 rule 只看 globs。

## 2. 四种写法（解析脚本都认）

```yaml
globs: "docs/L1/PRODUCT.md" # 单串
globs: "docs/L1/PRODUCT.md, docs/L1/USER-STORY.md" # 逗号分隔
globs: ["docs/L2/deep-dives/*.md"] # 内联数组（推荐）
globs: # 多行列表（推荐，条目多时用）
  - "docs/L2/domain/DOMAIN-MODEL.md"
  - "backend/app/models/**"
```

## 3. 匹配语义（picomatch，bash + dot）

- 按三组路径依次试匹配（命中任一即触发）：项目根相对路径、scope 相对路径、basename；`/` 分隔；`*` 不跨 `/`，`**` 跨目录，`?` 匹配单字符（底层 `picomatch`，`bash + dot` 选项）。
- basename 兜底：裸文件名（如 `README.md`）可命中任意目录下同名文件 —— 写裸名即全局生效，谨慎使用。
- `!` 开头为排除：命中肯定模式后又命中排除模式则不触发。
- 大小写敏感，`.` 开头文件也参与匹配；brace 展开（如 `*.{ts,tsx}`）可用，但优先用直白写法。
- `paths`（Claude 别名）/`applyTo`（Copilot 别名）会被归并为 `globs` 再匹配 —— 新 rule 一律只写 `globs`。
- `globs` 为空且非 `alwaysApply` 的 rule 永不触发（缺触发路径即缺入口）。

## 4. 常用模式

| 意图                 | 写法                               | 说明                                 |
| -------------------- | ---------------------------------- | ------------------------------------ |
| 单个文档             | `docs/L2/domain/DOMAIN-MODEL.md`          | 基线条目多为此类                     |
| 目录下一层全部文档   | `docs/L2/deep-dives/*.md`          | 目录级通配（物理单 rule 覆盖多文档） |
| 目录递归（含子目录） | `docs/L3/integration-contracts/**` | 契约等多文件目录用此                 |
| 某类代码             | `backend/app/models/**`            | 扩展条目主力形态                     |
| 排除                 | `!backend/reference/**`            | 只读目录不触发                       |

## 5. 基线 vs 扩展（两阶段生命周期）

- 基线：模板自带的条目。生成 rule 时逐字抄，只增不减、永不参与清理——缺基线即异常，先补基线；基线以模板为准，归 update/rebuild 管。
- 扩展：globs 目录同步（功能 1 步骤 4 / 功能 2 update/rebuild 后置检查 / 功能 3 阶段 2 / 入口③）按 `STRUCTURE` 目录职责与磁盘现状双向同步的项目路径：
  - 追加项：目录存在但 globs 没接 → 提案追加。要求：① 真实存在于磁盘（不限代码目录）；② 收敛到最小可用通配（如 `backend/app/models/**` 优于 `backend/**`）。
  - 清理项：扩展指向的目录已从磁盘删除 → 提案删除该条目；目录改名 = 删旧 + 加新一对提案。
  - 两类提案合并成一张清单交用户确认后才落盘。
- `update`/`rebuild` 合并时：基线以模板为准重写 + 仍存在的扩展做并集保留；`重建 <DOC>` 为显式重置，丢扩展。

## 6. 改后验证

- `node <skill>/scripts/parse-template.mjs --check <rule> <模板>` 通过（基线子集校验，扩展不报错）。
- 自问：编辑该路径的文件时，本 rule 是否应该注入？不该注入的路径就是过宽信号，收紧通配。

## 7. 反模式

- `backend/**` 一把梭（改任何后端文件都注入，噪音淹没信号）。
- 删除/改写基线条目（下次 `--check` 直接判异常）。
- 指向不存在的路径（死条目，永远触发不了）——同步的清理项负责删掉它们，别手工新加
- 扩展与 `STRUCTURE` 目录职责脱节（加了路径却说不清它归哪份文档管）。
