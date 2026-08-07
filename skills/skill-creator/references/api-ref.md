# API 参考（示例）

> 本文件是 `references/api-ref.md` 的标准示例——教你在 skill 里放一份"API/命令参考"文档。

## 定位

- 与 `guide.md` 同级的 references 参考文档（一级深度）
- 内容：skill 涉及的外部 API、CLI 命令、接口参数的全量参考
- SKILL.md 引用方式：`[API 参考](references/api-ref.md)`

## 目录结构示例

```
skill-name/
├── SKILL.md
└── references/
    ├── guide.md       # 使用指南
    └── api-ref.md     # API/命令参考（本文件）
```

## 编写要点

- 每个 API/命令一节：用途、参数表、返回值、示例、错误处理
- 参数表用表格（参数名/必填/类型/说明）
- 代码示例用代码块，可直接复制
