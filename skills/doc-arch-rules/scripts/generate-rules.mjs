#!/usr/bin/env node
/**
 * doc-arch-rules rule 生成脚本（Node 零依赖版）
 *
 * 从 references/templates/ 目录遍历所有 .md 文件，按文件后缀分两类生成 rule 到 references/rules/：
 *
 * 1. 无 `.template` 后缀（如 L0/CONSTITUTION.md）：
 *    - 该文件本身就是全局 Rule（不生成文档、不依赖模板）
 *    - rule = frontmatter（description + alwaysApply: true）+ 文件全文
 *    - 落盘: rules/<层>/<文件名>.md
 *
 * 2. 有 `.template` 后缀（如 L1/README.template.md）：
 *    - 该文件是模板，用它生成某个文档（按 frontmatter generation 元数据执行）
 *    - rule = frontmatter（description + globs）+ 生成指引（scan/ask_user/flow/checks/related）+ 模板 Markdown 正文完整拷贝
 *    - 落盘: rules/<层>/<文档名>.md（去掉 .template）
 *
 * 关键机制：rule 的 frontmatter（description / alwaysApply / globs）**直接从模板 frontmatter 抄写**
 * （遵循 omo rules-engine parser-yaml.ts 语义），不再由脚本硬编码推导。模板缺 description 或
 * alwaysApply/globs 时报错退出（不兜底），避免生成不完整的 rule。
 *
 * 零依赖说明：Node 标准库本身没有 YAML 解析，本脚本**手写解析** omo 需要的 5 个键
 * （description / alwaysApply / globs / paths / applyTo），逻辑复刻 omo rules-engine
 * parser-yaml.ts（/packages/rules-engine/src/engine/parser-yaml.ts），不引入任何 npm 包、
 * 不使用 Bun 专有 API。与 Python 版保持相同的校验与报错信息（便于对比）。
 *
 * 用法:
 *     node scripts/generate-rules.mjs            # 重新生成全部 rule
 *     node scripts/generate-rules.mjs --check    # 只检查不写入（校验模板与 rule 一致性）
 */

import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import * as path from "node:path";

// __dirname 兼容（ESM 无 __dirname，用 fileURLToPath 从 import.meta.url 推导）
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");
const TEMPLATES_DIR = path.join(SKILL_ROOT, "references", "templates");
const RULES_DIR = path.join(SKILL_ROOT, "references", "rules");

// 层 -> 中文名（仅用于 rule 标题 "# {doc} 文档更新规范（{layer_zh}）"）
const LAYER_ZH = {
  L0: "L0 决策层",
  L1: "L1 产品层",
  L2: "L2 架构层",
  L3: "L3 契约层",
  L4: "L4 交付层",
  common: "common 贯穿层",
};

// 已废弃（DEPRECATED）：层 -> 是否 alwaysApply 的硬编码。
// 该决策已由模板 frontmatter 的 alwaysApply/globs 字段接管（见 parseOmoFrontmatter），
// 脚本不再用本常量决定 rule 触发方式；保留仅作历史说明，新增模板请直接写模板 frontmatter。
// eslint-disable-next-line no-unused-vars
const ALWAYS_APPLY_LAYERS = new Set(["L0", "common"]);

// 特殊落盘路径：文档名 -> 目标文档路径。
// 仅用于 extractTarget 推导 rule 正文里的 "修改 {target} 时触发" 文案，**不用于 globs**（globs 抄自模板）。
const SPECIAL_TARGETS = {
  README: "README.md", // README 在项目根，不在 docs/
};

// 已合并/废弃的模板：不生成 rule
const SKIP_FILES = new Set(["DATA-ARCHITECTURE.template.md"]);

/**
 * 递归遍历目录，返回所有文件绝对路径（含子目录）。
 * @param {string} dir 目录绝对路径
 * @returns {string[]} 文件绝对路径列表
 */
function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(full));
    else if (entry.isFile()) results.push(full);
  }
  return results;
}

/**
 * 拆分文本为 [frontmatter 原文, 正文]。frontmatter 缺失/格式错误时返回 [null, 全文]。
 * 注意：body 部分可能包含 "---"（如 Markdown 分隔线），split 后需用 "---" 重新拼回，
 * 等效于 Python 的 text.split("---", 2)（只按前两个分隔符切）。
 * @param {string} text
 * @returns {[string|null, string]}
 */
function splitFrontmatter(text) {
  if (!text.startsWith("---")) return [null, text];
  const parts = text.split("---");
  if (parts.length < 3) return [null, text];
  return [parts[1], parts.slice(2).join("---")];
}

/**
 * 去掉行内注释（引号内保留 #），复刻 parser-yaml.ts 的 stripComment。
 * 注意：Python 版不剥行内注释，但实际模板的 description/globs 值均不含 " #"，两者结果一致。
 * @param {string} line
 * @returns {string}
 */
function stripComment(line) {
  let quote = null;
  let escaped = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote !== null && ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"' || ch === "'") {
      if (quote === null) quote = ch;
      else if (quote === ch) quote = null;
      continue;
    }
    if (quote === null && ch === "#") return line.slice(0, i);
  }
  return line;
}

/**
 * 解析标量字符串：双引号走 JSON 解析（等效 Python 的 \" 与 \\ 反转义），单引号直接剥壳，
 * 其余原样返回。与 Python 版 parse_scalar 对合法输入结果一致。
 * @param {string} value
 * @returns {string}
 */
function parseStringValue(value) {
  if (value.length === 0) return "";
  if (value.startsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "string" ? parsed : value.slice(1, -1);
    } catch {
      // 非法 JSON 双引号串：退化为 Python 的剥壳处理（保持校验报错口径一致）
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  return value;
}

/**
 * 解析布尔：仅认 true/false；其余返回 undefined（由校验报错兜底）。
 * Python 版 parse_bool 返回 None，语义一致（parser-yaml.ts 此处会 throw，本脚本保持 lenient）。
 * @param {string} value
 * @returns {boolean|undefined}
 */
function parseBooleanValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

/**
 * 查找与开头 '[' 配对的 ']' 位置（引号感知）；找不到返回 -1。
 * @param {string} value
 * @returns {number}
 */
function findClosingBracket(value) {
  let quote = null;
  let escaped = false;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote !== null && ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"' || ch === "'") {
      if (quote === null) quote = ch;
      else if (quote === ch) quote = null;
      continue;
    }
    if (quote === null && ch === "]") return i;
  }
  return -1;
}

/**
 * 按逗号切分字符串，忽略引号内的逗号，返回去掉首尾空白的分片（过滤空片）。
 * @param {string} value
 * @returns {string[]}
 */
function splitCommaSeparated(value) {
  const values = [];
  let current = "";
  let quote = null;
  let escaped = false;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (quote !== null && ch === "\\") {
      current += ch;
      escaped = true;
      continue;
    }
    if (ch === '"' || ch === "'") {
      if (quote === null) quote = ch;
      else if (quote === ch) quote = null;
      current += ch;
      continue;
    }
    if (quote === null && ch === ",") {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  values.push(current.trim());
  return values.filter(Boolean);
}

/**
 * 解析内联数组 [a, b]。
 * @param {string} value
 * @returns {string[]}
 */
function parseInlineArray(value) {
  const close = findClosingBracket(value);
  if (close === -1) return []; // 未闭合：交给校验报错（视为无 globs）
  const trailing = value.slice(close + 1).trim();
  if (trailing.length > 0) return []; // 数组后有尾随内容：视为无效，交给校验报错
  const content = value.slice(1, close).trim();
  if (content.length === 0) return [];
  return splitCommaSeparated(content).map(parseStringValue).filter(Boolean);
}

/**
 * 解析多行 - 列表：'globs:' 后的 '  - "item"' 行；遇到非列表行停止。
 * @param {string[]} lines
 * @param {number} lineIndex globs: 所在行号
 * @returns {{values: string[], consumed: number}}
 */
function parseMultilineArray(lines, lineIndex) {
  const values = [];
  let consumed = 1;
  for (let i = lineIndex + 1; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const lineWithoutComment = stripComment(rawLine);
    if (lineWithoutComment.trim().length === 0) {
      consumed += 1;
      continue;
    }
    const m = lineWithoutComment.match(/^\s+-\s*(.*)$/);
    if (m === null) break;
    values.push(parseStringValue(m[1] ?? ""));
    consumed += 1;
  }
  return { values: values.filter(Boolean), consumed };
}

/**
 * 解析 globs 值，返回 {values, consumed}。支持 4 种写法（复刻 parser-yaml.ts parseGlobValue）：
 * 1. 单串      globs: docs/x.md
 * 2. 逗号      globs: "docs/a.md, docs/b.md"（非引号包裹的裸串才按逗号切）
 * 3. 内联数组  globs: [docs/a.md, docs/b.md]
 * 4. 多行列表  globs:\n  - "docs/a.md"
 * @param {string} rawValue
 * @param {string[]} lines
 * @param {number} lineIndex
 * @returns {{values: string[], consumed: number}}
 */
function parseGlobValue(rawValue, lines, lineIndex) {
  if (rawValue.startsWith("[")) {
    return { values: parseInlineArray(rawValue), consumed: 1 };
  }
  if (rawValue.length === 0) {
    return parseMultilineArray(lines, lineIndex);
  }
  const quotedScalar = isQuotedScalar(rawValue);
  const value = parseStringValue(rawValue);
  if (!quotedScalar && value.includes(",")) {
    return {
      values: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      consumed: 1,
    };
  }
  return { values: [value], consumed: 1 };
}

/** 判断标量是否被引号包裹。 */
function isQuotedScalar(value) {
  return value.startsWith('"') || value.startsWith("'");
}

/**
 * 解析模板 frontmatter 中的 omo 字段（description / alwaysApply / globs）。
 *
 * 复刻 omo rules-engine parser-yaml.ts 的语义：
 * - description: 单行字符串（可带双/单引号）
 * - alwaysApply: true / false 布尔
 * - globs / paths / applyTo：统一归并为 globs 列表（见 parseGlobValue），**按出现顺序去重**
 * 其余键（title/layer/generation 等）忽略。返回 {description, alwaysApply, globs}。
 * @param {string} fmText frontmatter 原文（不含 --- 分隔线）
 * @returns {{description: string|undefined, alwaysApply: boolean|undefined, globs: string[]}}
 */
function parseOmoFrontmatter(fmText) {
  const omo = { description: undefined, alwaysApply: undefined, globs: [] };
  const lines = fmText.replace(/\r\n/g, "\n").split("\n");
  const globKeys = new Set(["globs", "paths", "applyTo"]);
  const seenGlobs = new Set(); // 去重：同值 glob 只保留首次出现
  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    if (rawLine === undefined) break;
    const line = stripComment(rawLine).trim();
    if (line.length === 0) {
      i += 1;
      continue;
    }
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      i += 1;
      continue;
    }
    const key = line.slice(0, colonIndex).trim();
    const rawValue = line.slice(colonIndex + 1).trim();
    if (key === "description") {
      omo.description = parseStringValue(rawValue);
      i += 1;
      continue;
    }
    if (key === "alwaysApply") {
      omo.alwaysApply = parseBooleanValue(rawValue);
      i += 1;
      continue;
    }
    if (globKeys.has(key)) {
      const { values, consumed } = parseGlobValue(rawValue, lines, i);
      for (const g of values) {
        if (!seenGlobs.has(g)) {
          seenGlobs.add(g);
          omo.globs.push(g);
        }
      }
      i += consumed;
      continue;
    }
    i += 1;
  }
  return omo;
}

/**
 * 校验 omo 字段：必须有 description，且 alwaysApply==True 与 globs 二选一。缺失即报错退出。
 * @param {{description: string|undefined, alwaysApply: boolean|undefined, globs: string[]}} omo
 * @param {string} layer
 * @param {string} docName
 */
function validateOmo(omo, layer, docName) {
  if (!omo.description) {
    console.error(`错误: 模板 ${layer}/${docName}.md 缺少 description`);
    process.exit(1);
  }
  if (omo.alwaysApply !== true && omo.globs.length === 0) {
    console.error(
      `错误: 模板 ${layer}/${docName}.md 缺少 alwaysApply 或 globs（omo rule 必须二选一）`,
    );
    process.exit(1);
  }
}

/**
 * 解析模板 omo 字段并校验；返回 {omo, body}。校验失败打印错误到 stderr 并退出。
 * @param {string} text 模板全文
 * @param {string} layer
 * @param {string} docName
 * @returns {{omo: {description: string|undefined, alwaysApply: boolean|undefined, globs: string[]}, body: string}}
 */
function parseTemplateOmo(text, layer, docName) {
  const [fmText, body] = splitFrontmatter(text);
  let omo;
  if (fmText === null) {
    // 无 frontmatter：构造空 omo，交给校验报错（提示缺 description）
    omo = { description: undefined, alwaysApply: undefined, globs: [] };
  } else {
    omo = parseOmoFrontmatter(fmText);
  }
  validateOmo(omo, layer, docName);
  return { omo, body };
}

/**
 * 把解析出的 omo 字段格式化为 rule frontmatter 主体（description + 触发方式）。
 * 优先 alwaysApply；无 alwaysApply 时输出 globs 列表（逐项加引号）。
 * @param {{description: string|undefined, alwaysApply: boolean|undefined, globs: string[]}} omo
 * @returns {string}
 */
function formatOmoFields(omo) {
  const lines = [`description: ${omo.description}`];
  if (omo.alwaysApply === true) {
    lines.push("alwaysApply: true");
  } else {
    lines.push("globs:");
    for (const g of omo.globs) {
      lines.push(`  - "${g}"`);
    }
  }
  return lines.join("\n");
}

/**
 * 从模板正文的『复制为 X』指引提取目标文档路径；无指引时按层推导。
 * @param {string} docName
 * @param {string} layer
 * @param {string} body 模板全文
 * @returns {string}
 */
function extractTarget(docName, layer, body) {
  if (Object.prototype.hasOwnProperty.call(SPECIAL_TARGETS, docName)) {
    return SPECIAL_TARGETS[docName];
  }
  // 复用现有正则：『复制为 `X`』，捕获到第一个 ` / 换行 / 中文逗号句号分号为止
  const m = body.match(/复制为\s*`?([^`\n，。；]+)/);
  if (m) {
    const target = m[1].trim();
    if (target && target !== "<项目名>") {
      return target;
    }
  }
  // 默认推导: docs/<层>/<文档名>.md（README 特殊在项目根）
  return `docs/${layer}/${docName}.md`;
}

/**
 * 无 .template 后缀：rule = frontmatter（description + alwaysApply 抄自模板）+ 文件正文。
 * @param {string} docName
 * @param {string} layer
 * @param {string} fullText
 * @returns {string}
 */
function genGlobalRule(docName, layer, fullText) {
  const { omo, body } = parseTemplateOmo(fullText, layer, docName);
  const fm = formatOmoFields(omo);
  return `---
${fm}
---

${body.trim()}
`;
}

/**
 * 有 .template 后缀：rule = frontmatter（description + globs/alwaysApply 抄自模板）+ 生成指引 + 模板全文完整拷贝。
 * @param {string} docName
 * @param {string} layer
 * @param {string} templateText
 * @returns {string}
 */
function genTemplateRule(docName, layer, templateText) {
  const layerZh = LAYER_ZH[layer] ?? layer;
  const { omo } = parseTemplateOmo(templateText, layer, docName);
  const target = extractTarget(docName, layer, templateText);
  const fm = formatOmoFields(omo);

  // 模板全文：保留 frontmatter（含 generation 元数据）+ 正文——rule 自包含
  const templateFull = templateText.trim();

  return `---
${fm}
---

# ${docName} 文档更新规范（${layerZh}）

**本文档在修改 \`${target}\` 时生效。** 目标：按下方模板生成/更新 \`${target}\`，使其结构符合模板契约，保持 SSOT、不漂移、不遗漏联动。

## 触发条件

当以下任一情况发生时，本规则必须生效：

- 编辑、新增或重建 \`${target}\`
- 该文档关联的其他文档（见模板 \`related\`）发生变化，需要联动更新本文档
- 用户要求"生成/更新 ${docName}"

## 执行流程

1. **读模板 generation 元数据**：下方「模板全文」的 frontmatter \`generation\` 块是本文档的"生成/更新提示词"，逐字段执行：
   - \`scan\`：自主扫描列出的源（不问用户），作为更新依据
   - \`ask_user\`：仅当列出的决策点存在歧义时，才用询问工具问用户
   - \`flow\`：按列出的流程分支执行（全量重建 or 增量修改）
   - \`reentrant\`：支持可重入——全量重生成或增量修改都要能处理
   - \`notes\`：注意点（怎么生成，避免常见错误）
   - \`checks\`：生成后逐条反向核对（含 S8：文档不含 emoji）
   - \`related\`：关联模板与联动修改——更新本文档时，检查并同步 \`related\` 列出的关联文档
2. **按模板正文生成**：以下方「模板全文」的 Markdown 正文为结构基准，把模板复制为 \`${target}\`，按 \`> 【指引】\` 填写，**删除 generation 元数据块与全部 \`> 【指引】\` 说明**（实例不含这两者）。
3. **反向 check**：逐条执行模板 \`generation.checks\`，全部通过才算完成。

## 硬性要求

- **SSOT**：模板是本文档的唯一结构源；已合并/已删除的模板（如 DATA-ARCHITECTURE 已并入 DOMAIN-MODEL）不生成独立文档。
- **不用 emoji**（S8，grep 校验：\`grep -P "[\\x{1F300}-\\x{1FAFF}\\x{2600}-\\x{27BF}]" <文档>\`）。
- **联动**：\`related\` 列的关联文档必须同步检查；跨层引用单向向下，下层不链回上层。
- **图规范**：文档中的图按模板要求用 D2 / Mermaid / ASCII，绘制规范见 CONSTITUTION §3.2。

## 完成判定

模板 \`generation.checks\` 全部通过 + 文档与关联文档无漂移。

---

## 模板全文（本 rule 的生成依据）

以下是 \`${docName}\` 的完整模板（frontmatter generation 元数据 + Markdown 正文，SSOT，来自 references/templates/${layer}/${docName}.template.md）：

\`\`\`markdown
${templateFull}
\`\`\`
`;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");

  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.error(`错误: 模板目录不存在 ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  const generated = [];
  // 递归遍历 templates/**/*.md 并排序（与 Python glob recursive + sorted 一致）
  const tmplFiles = walkDir(TEMPLATES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  for (const tmpl of tmplFiles) {
    const layer = path.basename(path.dirname(tmpl));
    const filename = path.basename(tmpl);

    if (SKIP_FILES.has(filename)) {
      console.log(`跳过（已合并）: ${layer}/${filename}`);
      continue;
    }

    const fullText = fs.readFileSync(tmpl, "utf-8");
    const isTemplate = filename.endsWith(".template.md");
    const docName = isTemplate
      ? filename.slice(0, -".template.md".length)
      : filename.slice(0, -".md".length);

    let rule;
    let outName;
    if (isTemplate) {
      rule = genTemplateRule(docName, layer, fullText);
      outName = `${docName}.md`;
    } else {
      rule = genGlobalRule(docName, layer, fullText);
      outName = filename;
    }

    const outDir = path.join(RULES_DIR, layer);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, outName);

    if (check) {
      if (fs.existsSync(outPath)) {
        const old = fs.readFileSync(outPath, "utf-8");
        const status = old === rule ? "OK" : "DIFF";
        console.log(`${status}  ${layer}/${outName}`);
      } else {
        console.log(`MISSING  ${layer}/${outName}`);
      }
    } else {
      fs.writeFileSync(outPath, rule, "utf-8");
      generated.push(outPath);
      const kind = !isTemplate ? "全局 rule" : "模板 rule";
      console.log(`生成 ${kind}: ${layer}/${outName}`);
    }
  }

  if (!check) {
    console.log(`\n共生成 ${generated.length} 个 rule`);
  }
}

main();
