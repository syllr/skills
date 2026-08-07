# 脚本语言选择规范

## ⚠️ 先看这个：何时不需要脚本

**脚本不是万能的，不要为了用脚本而用脚本。**

### 不需要脚本的情况

| 情况              | AI 直接做             | 脚本做的必要性 |
| ----------------- | --------------------- | -------------- |
| 生成文本/代码     | ✅ 直接生成           | ❌ 不需要脚本  |
| 解释概念/回答问题 | ✅ 直接回答           | ❌ 不需要脚本  |
| 简单文件读写      | ✅ Read/Write/Edit    | ❌ 不需要脚本  |
| 搜索代码          | ✅ grep/AST-grep      | ❌ 不需要脚本  |
| 格式化输出        | ✅ AI 直接格式化      | ❌ 不需要脚本  |
| 读取网页内容      | ✅ webfetch/searchweb | ❌ 不需要脚本  |
| 简单计算          | ✅ 直接计算           | ❌ 不需要脚本  |

### 需要脚本的信号

**只有当满足以下条件时，才考虑用脚本：**

1. **重复性操作**：同一个操作要执行很多次，AI 调用工具太慢或容易出错
2. **确定性计算**：输入输出有固定映射关系，不需要 AI 理解/判断
3. **外部依赖**：需要调用第三方库/SDK，AI 无法自己调用
4. **性能要求**：大量数据处理，AI 直接做会超时
5. **系统集成**：需要调用系统命令、文件系统、Git 等

### 判断原则

```
任务判断

├─ AI 能直接完成（生成文本、解释概念、简单计算）？
│   └─ 是 → ❌ 不需要脚本，AI 直接做
│
├─ 需要重复执行同一操作？
│   └─ 是 → ✅ 需要脚本
│
├─ 需要调用第三方库/SDK？
│   └─ 是 → ✅ 需要脚本
│
└─ 其他情况 → 优先不用脚本
```

---

## 三种脚本语言对比

| 语言           | 优势                         | 限制                     | 适用场景                        |
| -------------- | ---------------------------- | ------------------------ | ------------------------------- |
| **Bash**       | 预装、启动快、系统命令集成   | 字符串处理弱、复杂逻辑难 | 文件操作、Git、系统命令、管道   |
| **Python**     | 生态丰富、跨平台、数据处理强 | 需安装、启动稍慢         | API调用、数据转换、JSON/CSV处理 |
| **TypeScript** | 与OpenCode集成、JSON处理方便 | 需Bun或Node环境          | 插件构建、OpenCode交互          |

---

## 选择决策树

```
需要脚本？
│
├─ 否 → ❌ 不需要 scripts/ 目录，AI 直接完成
│
└─ 是 → 选择语言
          │
          ├─ 系统命令调用、文件操作、Git操作？
          │   └─ 是 → Bash
          │
          ├─ API调用、数据处理、复杂文本处理？
          │   └─ 是 → Python
          │
          ├─ 与OpenCode插件系统交互？
          │   └─ 是 → TypeScript
          │
          └─ 其他 → Python
```

---

## 场景推荐

| 任务                   | 推荐           | 是否需要脚本 |
| ---------------------- | -------------- | ------------ |
| 生成代码/文本          | AI直接做       | ❌           |
| 解释概念               | AI直接做       | ❌           |
| 搜索代码               | AI直接做       | ❌           |
| 检查隐藏字符、文件扫描 | **Bash**       | ✅           |
| Git钩子、提交验证      | **Bash**       | ✅           |
| API调用、数据抓取      | **Python**     | ✅           |
| JSON/YAML处理          | **Python**     | ✅           |
| CSV/Excel处理          | **Python**     | ✅           |
| OpenCode插件构建       | **TypeScript** | ✅           |

---

## 环境检测

### Bash 检测 Python

```bash
if command -v python3 &> /dev/null; then
    exec python3 "$0" "$@"
fi
echo "Error: Python3 required"
exit 1
```

### Bash 检测 Node

```bash
if command -v node &> /dev/null; then
    exec node "$0" "$@"
fi
echo "Error: Node.js required"
exit 1
```

---

## 脚本路径引用（必读）

**SKILL.md 中引用 skill 内部任何资源（scripts/、references/、assets/、自定义目录……）时，用相对路径（相对于 skill 目录）或 Markdown 链接，禁止硬编码绝对路径，也禁止 `@path` 语法（agentskills.io 规范不允许）。** 详细规范见 [path-resolution.md](path-resolution.md)。核心要点：

```bash
# ✅ 正确：相对路径（相对于 skill 目录）
scripts/main.py --input data.json
scripts/render.py --template assets/templates/report.xml
scripts/load.py --source data/users.csv

# ❌ 错误 1：硬编码绝对路径
~/.config/opencode/skills/my-skill/scripts/main.py --input data.json

# ❌ 错误 2：依赖 cwd 的 ./ 写法
./scripts/main.py --input data.json
```

相对路径以 skill 目录为基准，skill 移动到任何安装位置都能正确解析。

---

## shebang 规范

```bash
#!/usr/bin/env python3    # 自动查找 Python3
#!/usr/bin/env node      # 自动查找 Node
#!/usr/bin/env bun       # 自动查找 Bun（推荐用于 TypeScript/JS 脚本）
#!/bin/bash              # Bash（假设在 /bin）
```

**推荐使用 `#!/usr/bin/env xxx`**，因为不同系统解释器路径不同。

**Bun 推荐**：项目已有 Bun 环境时，TypeScript/JavaScript 脚本优先用 `#!/usr/bin/env bun`（启动 ~5ms，比 Node 快 30 倍，原生支持 `.ts`）。

---

## 示例：Bash 脚本

```bash
#!/usr/bin/env bash
set -e

FILE="$1"

if [ -z "$FILE" ]; then
    echo "Usage: $0 <file>"
    exit 1
fi

if [ -f "$FILE" ]; then
    echo "File: $FILE"
    echo "Type: $(file -b "$FILE")"
    echo "Size: $(wc -c < "$FILE") bytes"
else
    echo "Error: File not found: $FILE"
    exit 1
fi
```

---

## 示例：Python 脚本

```python
#!/usr/bin/env python3

import sys
import json
import argparse
from urllib.request import urlopen, Request
from urllib.error import URLError

def fetch(url: str) -> dict:
    try:
        with urlopen(url, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except URLError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Fetch API data")
    parser.add_argument("url", help="API URL")
    args = parser.parse_args()

    data = fetch(args.url)
    print(json.dumps(data, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
```

---

## 示例：TypeScript 脚本

```typescript
#!/usr/bin/env bun
import * as fs from "fs";
import * as path from "path";

interface Config {
  name: string;
  version: string;
}

function readConfig(configPath: string): Config {
  const content = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(content) as Config;
}

function main() {
  const configPath = path.join(process.cwd(), "config.json");
  const config = readConfig(configPath);
  console.log(`Name: ${config.name}, Version: ${config.version}`);
}

main();
```

---

## 总结

| 原则             | 说明                                   |
| ---------------- | -------------------------------------- |
| **优先不用脚本** | AI 能直接完成的，不要用脚本            |
| **需要才用**     | 只有重复执行、第三方库、性能要求时才用 |
| **最小依赖**     | 优先使用系统必然存在的语言             |
| **任务匹配**     | 系统命令→Bash，数据处理→Python         |
| **添加检测**     | 脚本开头检查依赖是否可用               |
| **优雅降级**     | 提供 fallback 方案                     |
| **明确标注**     | 在 SKILL.md 中说明环境要求             |
