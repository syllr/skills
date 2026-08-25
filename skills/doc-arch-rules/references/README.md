# doc-arch-rules references 清单

本 skill 的参考资源：**文档架构源文件**（模板与全局 rule 源）与 **omo rule 生成模板**（脚本派生物）。

## 目录结构

```
doc-arch-rules/
├── SKILL.md                # 主指令（两种模式 + 脚本用法）
├── scripts/
│   └── generate-rules.mjs  # rule 生成脚本（Node 零依赖，从 templates/ 遍历生成 rules/）
└── references/
    ├── README.md           # 本清单
    ├── templates/          # 源文件（1 个全局 Rule 源 + 13 个模板）——SSOT，按层分目录
    │   ├── L0/CONSTITUTION.md            # 无 .template 后缀 → 全局 Rule 源（rule 内容即宪法全文）
    │   ├── L1/README.template.md ...     # 有 .template 后缀 → 模板（生成对应文档）
    │   ├── L2/ ...
    │   ├── L3/ ...
    │   ├── L4/ ...
    │   └── common/ ...
    └── rules/              # 脚本生成的 rule（勿手工改，重跑脚本更新）——按层分目录
        ├── L0/CONSTITUTION.md            # 全局 rule（alwaysApply，内容 = CONSTITUTION.md 全文）
        ├── L1/README.md ...              # 模板 rule（globs 或 alwaysApply + 模板全文拷贝）
        ├── ...
        └── common/ ...
```

## 文件清单

| 层     | 文件                                              | 类型         | rule 输出                            | 触发方式              |
| ------ | ------------------------------------------------- | ------------ | ------------------------------------ | --------------------- |
| L0     | templates/L0/CONSTITUTION.md（无后缀）            | 全局 Rule 源 | rules/L0/CONSTITUTION.md             | alwaysApply           |
| L1     | templates/L1/README.template.md                   | 模板         | rules/L1/README.md                   | globs（根 README.md） |
| L1     | templates/L1/PRODUCT.template.md                  | 模板         | rules/L1/PRODUCT.md                  | globs                 |
| L1     | templates/L1/USER-STORY.template.md               | 模板         | rules/L1/USER-STORY.md               | globs                 |
| L2     | templates/L2/APPLICATION-ARCHITECTURE.template.md | 模板         | rules/L2/APPLICATION-ARCHITECTURE.md | globs                 |
| L2     | templates/L2/DOMAIN-MODEL.template.md             | 模板         | rules/L2/DOMAIN-MODEL.md             | globs                 |
| L2     | templates/L2/TECHNOLOGY-ARCHITECTURE.template.md  | 模板         | rules/L2/TECHNOLOGY-ARCHITECTURE.md  | globs                 |
| L3     | templates/L3/API.template.md                      | 模板         | rules/L3/API.md                      | globs                 |
| L3     | templates/L3/INTEGRATION.template.md              | 模板         | rules/L3/INTEGRATION.md              | globs                 |
| L4     | templates/L4/DEPLOYMENT.template.md               | 模板         | rules/L4/DEPLOYMENT.md               | globs                 |
| L4     | templates/L4/TEST-PLAN.template.md                | 模板         | rules/L4/TEST-PLAN.md                | globs                 |
| common | templates/common/CODE-GUIDE.template.md           | 模板         | rules/common/CODE-GUIDE.md           | alwaysApply           |
| common | templates/common/GLOSSARY.template.md             | 模板         | rules/common/GLOSSARY.md             | alwaysApply           |
| common | templates/common/STRUCTURE.template.md            | 模板         | rules/common/STRUCTURE.md            | alwaysApply           |

## 说明

- **两种模式（按文件后缀区分）**：
  - **无 `.template` 后缀**（CONSTITUTION）：本身就是全局 Rule，不生成文档——rule 内容 = 文件全文，`alwaysApply` 全局注入。
  - **有 `.template` 后缀**（其余 13 个）：是模板，用它生成对应文档——rule = 生成指引（按模板 frontmatter `generation` 元数据执行）+ **模板全文完整拷贝**（frontmatter + Markdown 正文）。
- **DATA-ARCHITECTURE 已合并**进 DOMAIN-MODEL（§5 数据设计），脚本跳过，不生成 rule。
- **模板 frontmatter 的 `generation` 块**（scan/ask_user/flow/reentrant/notes/checks/related/tools）是"生成/更新该文档的提示词"，仅模板持有，实例文档不含该块。
- **rule 是脚本派生物**：`rules/` 由 `scripts/generate-rules.mjs` 从 `templates/` 生成，勿手工修改；模板更新后重跑脚本。

## 更新命令

模板与 rule 的**上游来源**是项目 `toolbox-lab/.omo/demo/`（文档架构 demo）。同步流程：

```bash
# 1. 同步模板/源文件（按层复制，排除已合并的 DATA-ARCHITECTURE）
cp <上游>/L0/*.md references/templates/L0/          # 含 CONSTITUTION.md（无后缀，全局 rule 源）
cp <上游>/L1/*.template.md references/templates/L1/
cp <上游>/L2/*.template.md references/templates/L2/  # 排除 DATA-ARCHITECTURE.template.md
cp <上游>/L3/*.template.md references/templates/L3/
cp <上游>/L4/*.template.md references/templates/L4/
cp <上游>/common/*.template.md references/templates/common/

# 2. 重新生成 rule
node scripts/generate-rules.mjs
```

> rule 的 frontmatter（`description`/`alwaysApply`/`globs`）**直接从模板 frontmatter 抄写**（omo parser-yaml 语义），模板缺 `description` 或 `alwaysApply`/`globs` 时脚本报错退出（不兜底）。脚本配置（`LAYER_ZH`/`SPECIAL_TARGETS`/`SKIP_FILES`）在 `scripts/generate-rules.mjs` 顶部，新增层/特殊路径时调整。脚本为 **Node 零依赖**（手写 YAML 解析复刻 omo parser-yaml.ts，不引入 npm 包）。
