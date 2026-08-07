# 自定义参数说明（示例）

> 本文件是 `references/custom-args.md` 的标准示例——教你在 skill 里放一份"自定义参数/配置"参考文档。

## 定位

- 当 skill 的脚本/工具支持自定义参数模板时，用本文件说明各参数含义
- SKILL.md 引用方式：`[自定义参数说明](references/custom-args.md)`

## 内容结构

```markdown
## 参数总览

| 参数 | 必填 | 类型 | 默认值 | 说明 |

## 各参数详解

### <参数名>

- 用途：
- 可选值：
- 示例：

## 常见组合
```

## 与默认模板的关系

- 默认参数模板放 `assets/templates/default-args.json`（运行时资源）
- 自定义参数说明放 `references/custom-args.md`（参考文档）
