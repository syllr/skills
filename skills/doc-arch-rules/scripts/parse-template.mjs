#!/usr/bin/env node
/**
 * doc-arch-rules 模板解析工具（Node 零依赖）
 *
 * 解析 references/templates/ 下的模板文件，输出结构化 JSON，供 AI 按 SKILL.md 流程组装 rule。
 * 本脚本只做解析/校验，**不组装 rule**（组装由 AI 按 SKILL.md 执行流程完成）。
 *
 * 解析输出结构（每模板一个 JSON）：
 * {
 *   "file": "L2/APPLICATION-ARCHITECTURE.template.md",   // 相对 templates/ 的路径
 *   "layer": "L2",
 *   "doc": "APPLICATION-ARCHITECTURE",
 *   "isTemplate": true,                                   // 是否 .template 后缀（false = 全局 rule 源）
 *   "omo": { "description": "...", "alwaysApply": true|null, "globs": [...] },  // rule frontmatter 抄写用
 *   "target": "docs/L2/APPLICATION-ARCHITECTURE.md",      // 目标文档路径（正文触发条件用）
 *   "generation": { "tools": [...], "related": {...}, "ask_user": [...], "flow": [...], "notes": [...], "checks": [...] },
 *   "content": "模板 Markdown 正文（剥离 YAML frontmatter，含 > 【指引】 行）"     // 「模板」章节用
 * }
 *
 * 用法:
 *     node <skill>/scripts/parse-template.mjs <模板路径>             # 解析单个模板，stdout 输出 JSON
 *     node <skill>/scripts/parse-template.mjs --all                  # 解析 references/templates/ 下全部 .md，输出 JSON 数组
 *     node <skill>/scripts/parse-template.mjs --check <rule路径> <模板路径>  # 校验 rule（frontmatter 一致 + 无 generation YAML + 模板章节正文一致）
 *
 * 零依赖说明：Node 标准库无 YAML 解析，本脚本**手写解析** omo 5 键（description/alwaysApply/globs/paths/applyTo）
 * 与 generation 6 字段（tools/related/ask_user/flow/notes/checks），逻辑复刻 omo rules-engine
 * parser-yaml.ts（/packages/rules-engine/src/engine/parser-yaml.ts），不引入 npm 包、不使用 Bun 专有 API。
 */

import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import * as path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");
const TEMPLATES_DIR = path.join(SKILL_ROOT, "references", "templates");

// 层 -> 中文名（rule 标题用）
const LAYER_ZH = {
  constitution: "宪法",
  L1: "L1 产品层",
  L2: "L2 架构层",
  "L2/deep-dives": "L2 架构层",
  L3: "L3 契约层",
  L4: "L4 交付层",
  common: "common 贯穿层",
};

// 特殊目标路径：文档名 -> 目标文档路径（正文触发条件用；globs 抄自模板不推导）
const SPECIAL_TARGETS = {
  README: "README.md",
};

// 已合并/废弃的模板：不解析
const SKIP_FILES = new Set(["DATA-ARCHITECTURE.template.md"]);

/**
 * 递归遍历目录，返回所有文件绝对路径（含子目录）。
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
 */
function splitFrontmatter(text) {
  if (!text.startsWith("---")) return [null, text];
  const parts = text.split("---");
  if (parts.length < 3) return [null, text];
  return [parts[1], parts.slice(2).join("---")];
}

/**
 * 去掉行内注释（引号内保留 #），复刻 parser-yaml.ts 的 stripComment。
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
 * 解析标量字符串：双引号走 JSON 解析，单引号直接剥壳，其余原样返回。
 */
function parseStringValue(value) {
  if (value.length === 0) return "";
  if (value.startsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "string" ? parsed : value.slice(1, -1);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  return value;
}

/**
 * 解析布尔：仅认 true/false；其余返回 undefined。
 */
function parseBooleanValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

/**
 * 查找与开头 '[' 配对的 ']' 位置（引号感知）；找不到返回 -1。
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
 */
function parseInlineArray(value) {
  const close = findClosingBracket(value);
  if (close === -1) return [];
  const trailing = value.slice(close + 1).trim();
  if (trailing.length > 0) return [];
  const content = value.slice(1, close).trim();
  if (content.length === 0) return [];
  return splitCommaSeparated(content).map(parseStringValue).filter(Boolean);
}

/**
 * 解析多行 - 列表：'key:' 后的 '  - "item"' 行；遇到非列表行停止。
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
 * 单串 / 逗号 / 内联数组 / 多行列表。
 */
function parseGlobValue(rawValue, lines, lineIndex) {
  if (rawValue.startsWith("[")) {
    return { values: parseInlineArray(rawValue), consumed: 1 };
  }
  if (rawValue.length === 0) {
    return parseMultilineArray(lines, lineIndex);
  }
  const quotedScalar = rawValue.startsWith('"') || rawValue.startsWith("'");
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

/**
 * 解析模板 frontmatter 中的 omo 字段（description / alwaysApply / globs）。
 * 复刻 omo rules-engine parser-yaml.ts 语义，paths/applyTo 归并为 globs 并去重。
 */
function parseOmoFrontmatter(fmText) {
  const omo = { description: undefined, alwaysApply: undefined, globs: [] };
  const lines = fmText.replace(/\r\n/g, "\n").split("\n");
  const globKeys = new Set(["globs", "paths", "applyTo"]);
  const seenGlobs = new Set();
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
 * 解析 frontmatter 中的 generation 块（tools/related/ask_user/flow/notes/checks）。
 * 缩进感知：2 空格子键 + 其下 4 空格内容行。related 为 map（key: 说明），其余为 list。
 */
function parseGeneration(fmText) {
  const gen = {};
  const lines = fmText.replace(/\r\n/g, "\n").split("\n");
  let inGen = false;
  let currentKey = null;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!inGen) {
      if (/^generation:\s*$/.test(raw)) {
        inGen = true;
      }
      continue;
    }
    // 退出 generation：遇到无缩进的顶层键
    if (/^[a-zA-Z_]+:/.test(raw) && !raw.startsWith(" ")) {
      break;
    }
    // 2 空格子键
    const subMatch = raw.match(/^  ([a-z_]+):\s*(.*)$/);
    if (subMatch) {
      currentKey = subMatch[1];
      if (currentKey === "related") {
        gen[currentKey] = {};
      } else {
        gen[currentKey] = [];
      }
      const inlineVal = subMatch[2].trim();
      // 子键行的内联注释（如 flow: # 生成流程）不作为内容项
      if (inlineVal && !inlineVal.startsWith("#")) {
        if (currentKey === "related") {
          // 内联 related 一般无，跳过
        } else {
          gen[currentKey].push(parseStringValue(inlineVal));
        }
      }
      continue;
    }
    // 4 空格内容行（list item 或 related 的 key: 说明）
    const itemMatch = raw.match(/^    -\s*(.*)$/);
    const relatedMatch = raw.match(/^    ([^:#]+):\s*(.*)$/);
    if (itemMatch && currentKey && Array.isArray(gen[currentKey])) {
      gen[currentKey].push(parseStringValue(itemMatch[1].trim()));
    } else if (relatedMatch && currentKey === "related") {
      const k = relatedMatch[1].trim();
      const v = parseStringValue(relatedMatch[2].trim());
      if (k) gen[currentKey][k] = v;
    }
    // 更深缩进（如 notes 下的 - 子项）保持追加到当前 list
    const deepMatch = raw.match(/^      -\s*(.*)$/);
    if (deepMatch && currentKey && Array.isArray(gen[currentKey])) {
      gen[currentKey].push(parseStringValue(deepMatch[1].trim()));
    }
  }
  return gen;
}

/**
 * 校验 omo 字段：必须有 description，且 alwaysApply==true 与 globs 二选一。缺失即报错退出。
 */
function validateOmo(omo, layer, docName) {
  if (!omo.description) {
    console.error(`错误: 模板 ${layer}/${docName}.md 缺少 description`);
    process.exit(1);
  }
  if (omo.alwaysApply !== true && omo.globs.length === 0) {
    console.error(`错误: 模板 ${layer}/${docName}.md 缺少 alwaysApply 或 globs（omo rule 必须二选一）`);
    process.exit(1);
  }
}

/**
 * 从模板正文的『复制为 X』指引提取目标文档路径；无指引时按层推导。
 */
function extractTarget(docName, layer, body) {
  if (Object.prototype.hasOwnProperty.call(SPECIAL_TARGETS, docName)) {
    return SPECIAL_TARGETS[docName];
  }
  const m = body.match(/复制为\s*`?([^`\n，。；]+)/);
  if (m) {
    const target = m[1].trim();
    if (target && target !== "<项目名>") {
      return target;
    }
  }
  if (docName === "CONSTITUTION") return "CONSTITUTION.md";
  return `docs/${layer}/${docName}.md`;
}

/**
 * 解析单个模板文件为结构化数据。
 */
function parseTemplateFile(tmplPath) {
  const fullText = fs.readFileSync(tmplPath, "utf-8");
  const filename = path.basename(tmplPath);
  const relDir = path.relative(TEMPLATES_DIR, path.dirname(tmplPath));
  const isRoot = relDir === "" || relDir === ".";
  // 嵌套目录（如 L2/deep-dives）取首段为层，非根时 file 保留完整相对路径
  const layer = isRoot ? "constitution" : relDir.split(path.sep)[0];
  const fileRel = isRoot ? filename : path.join(relDir, filename);
  const isTemplate = filename.endsWith(".template.md");
  const docName = isTemplate
    ? filename.slice(0, -".template.md".length)
    : filename.slice(0, -".md".length);

  const [fmText, body] = splitFrontmatter(fullText);
  let omo;
  if (fmText === null) {
    omo = { description: undefined, alwaysApply: undefined, globs: [] };
  } else {
    omo = parseOmoFrontmatter(fmText);
  }
  validateOmo(omo, layer, docName);

  const generation = fmText !== null ? parseGeneration(fmText) : {};
  // 优先用 globs 推导 target（支持 deep-dives/*.md 通配），仅 README 特例需判断是否在根
  const targetFromGlobs = omo.globs.length > 0 ? omo.globs[0] : null;
  const target = isTemplate
    ? targetFromGlobs || extractTarget(docName, layer, fullText)
    : docName === "CONSTITUTION"
      ? "CONSTITUTION.md"
      : `docs/${layer}/${docName}.md`;

  return {
    file: fileRel,
    layer,
    doc: docName,
    layerZh: LAYER_ZH[layer] ?? layer,
    isTemplate,
    omo: {
      description: omo.description,
      alwaysApply: omo.alwaysApply ?? null,
      globs: omo.globs,
    },
    target,
    generation,
    content: body.trim(),
  };
}

/**
 * 校验 rule：frontmatter 与模板 omo 一致 + 无 generation YAML + 模板章节正文与模板一致。
 */
function checkRule(rulePath, tmplPath) {
  const data = parseTemplateFile(tmplPath);
  const ruleText = fs.readFileSync(rulePath, "utf-8");
  const errors = [];

  // 1. frontmatter 一致
  const [ruleFm] = splitFrontmatter(ruleText);
  const ruleOmo = ruleFm ? parseOmoFrontmatter(ruleFm) : {};
  if (ruleOmo.description !== data.omo.description) {
    errors.push(`description 不一致: rule=${ruleOmo.description} 模板=${data.omo.description}`);
  }
  if (data.omo.alwaysApply === true && ruleOmo.alwaysApply !== true) {
    errors.push("alwaysApply 缺失（模板为 true）");
  }
  if (data.omo.globs.length > 0) {
    const ruleGlobs = ruleOmo.globs ?? [];
    for (const g of data.omo.globs) {
      if (!ruleGlobs.includes(g)) errors.push(`globs 缺失: ${g}`);
    }
  }

  // 2. rule 内无 generation YAML 原始块
  if (ruleText.includes("generation:")) {
    errors.push("rule 内出现 generation: YAML 原始块（应内联翻译为四节正文）");
  }

  // 3. 模板章节正文与模板 content 一致
  const content = data.content;
  if (!ruleText.includes(content.slice(0, 100))) {
    errors.push("「模板」章节未包含模板正文（前 100 字符未匹配）");
  }

  if (errors.length > 0) {
    console.error(`校验失败: ${rulePath}`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`OK ${rulePath}`);
}

function main() {
  const args = process.argv.slice(2);

  // --check <rule> <template>
  const checkIdx = args.indexOf("--check");
  if (checkIdx !== -1) {
    const rulePath = args[checkIdx + 1];
    const tmplPath = args[checkIdx + 2];
    if (!rulePath || !tmplPath) {
      console.error("错误: --check 需要 <rule路径> <模板路径> 两个参数");
      process.exit(1);
    }
    checkRule(rulePath, tmplPath);
    return;
  }

  // --all：解析全部模板输出 JSON 数组
  if (args.includes("--all")) {
    const files = walkDir(TEMPLATES_DIR).filter((f) => f.endsWith(".md")).sort();
    const results = [];
    for (const f of files) {
      const filename = path.basename(f);
      if (SKIP_FILES.has(filename)) continue;
      results.push(parseTemplateFile(f));
    }
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // 默认：解析单个模板路径
  const tmplPath = args[0];
  if (!tmplPath) {
    console.error("用法: node parse-template.mjs <模板路径> | --all | --check <rule> <模板>");
    process.exit(1);
  }
  const resolved = path.isAbsolute(tmplPath) ? tmplPath : path.resolve(process.cwd(), tmplPath);
  if (!fs.existsSync(resolved)) {
    console.error(`错误: 文件不存在 ${resolved}`);
    process.exit(1);
  }
  console.log(JSON.stringify(parseTemplateFile(resolved), null, 2));
}

main();