/**
 * project-scaffold 安装器核心逻辑（Node 零依赖）
 *
 * 纯逻辑模块：常量、敏感信息检查、文件遍历、受管区块拆分/渲染、计划/应用/汇总。
 * 不含任何命令行/输出格式职责（那部分在 install-cli.mjs），可被测试与其它脚本直接 import。
 *
 * 零依赖：只用 Node 内置模块（node:fs / node:path / node:url），不引入任何 npm 包。
 */

import {fileURLToPath} from "node:url";
import * as fs from "node:fs";
import * as path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** skill 根目录（scripts/ 的上一级）。 */
export const SKILL_ROOT = path.resolve(__dirname, "..");
/** AGENTS 模板目录。 */
export const AGENTS_TEMPLATE_DIR = path.join(SKILL_ROOT, "references", "agents-templates");
/** Skill 模板目录。 */
export const SKILL_TEMPLATE_DIR = path.join(SKILL_ROOT, "references", "skill-templates");
/**
 * Skill 分组（模板目录布局的 SSOT）：A 类放 docs/、B 类放 ops/、C 类放 skill-templates 根。
 * dir 为空字符串表示模板直接位于 skill-templates/ 下。
 */
export const SKILL_GROUPS = [
    {
        dir: "docs",
        label: "A 类 · 纯文档",
        names: [
            "docs-business",
            "docs-application-architecture",
            "docs-data-architecture",
            "docs-technology-architecture",
            "docs-domain",
            "docs-structure",
            "docs-code-guide",
            "docs-changes",
            "docs-draft",
        ],
    },
    {
        dir: "ops",
        label: "B 类 · 文档 + 资产",
        names: ["inbound-ops", "outbound-ops", "deploy-ops", "test-ops", "tools-ops"],
    },
    {dir: "", label: "C · 编排", names: ["align-docs"]},
];

/** 固定的安装 skill 名称（模板目录必须一一存在；顺序 = A → B → C）。 */
export const SKILL_NAMES = SKILL_GROUPS.flatMap((group) => group.names);

/** skill 名 → 模板目录相对 skill-templates/ 的路径；未登记的名字原样返回（由调用方判定缺失）。 */
export function skillTemplateRel(name) {
    const group = SKILL_GROUPS.find((g) => g.names.includes(name));
    if (!group) return name;
    return group.dir ? path.join(group.dir, name) : name;
}

/** 受管区块标记（AGENTS.md 与 SKILL.md 共用，成对出现，标记之间为受管内容）。 */
export const BEGIN_MARKER = "<!-- project-scaffold:begin -->";
export const END_MARKER = "<!-- project-scaffold:end -->";

// ---------------------------------------------------------------------------
// 敏感信息拒绝检查（简单启发式）
// ---------------------------------------------------------------------------

/** 明确的密钥特征（前缀/块头）。 */
const SECRET_SIGNATURES = [
    {type: "私钥块", re: /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/},
    {type: "AWS Access Key", re: /\bAKIA[0-9A-Z]{16}\b/},
    {type: "GitHub Token", re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/},
    {type: "Slack Token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/},
    {type: "OpenAI/Stripe 密钥", re: /\b(?:sk|rk)_(?:live|test)?_?[A-Za-z0-9]{20,}\b/},
];
/** 占位符特征：命中即视为非真实凭据，不拒绝。 */
const PLACEHOLDER_RE = /(?:<[^>]*>|\$\{|\byour\b|\bxxx+\b|example|placeholder|changeme|change_me|dummy|sample|redacted|\.\.\.)/i;
/** 疑似真实凭据赋值：secret 类键 = 20 位以上的引号值，且含大小写/数字混合。 */
const SECRET_ASSIGN_RE =
    /\b(password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key)\s*[:=]\s*["']([A-Za-z0-9+/=_\-]{20,})["']/gi;

/**
 * 检测文本中的明显敏感信息。命中返回 {type, match}，否则返回 null。
 * 有意保守：只拦「明显真实」的私钥/令牌/赋值，占位符与空值一律放行。
 */
export function detectSensitive(text) {
    for (const sig of SECRET_SIGNATURES) {
        const m = sig.re.exec(text);
        if (m) return {type: sig.type, match: m[0]};
    }
    SECRET_ASSIGN_RE.lastIndex = 0;
    let m;
    while ((m = SECRET_ASSIGN_RE.exec(text)) !== null) {
        const value = m[2];
        if (PLACEHOLDER_RE.test(value)) continue;
        // 要求大小写/数字混合，降低对普通说明文字的误报
        if (!/[a-z]/.test(value) || !/[A-Z0-9]/.test(value)) continue;
        return {type: "疑似真实凭据赋值", match: `${m[1]}=<redacted>`};
    }
    return null;
}

// ---------------------------------------------------------------------------
// 通用工具
// ---------------------------------------------------------------------------

/** 递归列出目录下所有文件（相对 base 的路径，含隐藏文件），排序返回。 */
export function walkFiles(dir, base = dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walkFiles(full, base));
        else if (entry.isFile()) out.push(path.relative(base, full));
    }
    return out.sort();
}

/** 判断文件是否为二进制（含 NUL 字节）。 */
function isBinary(buf) {
    return buf.includes(0);
}

/**
 * 拆分受管区块：返回 { before, inner, after } 或 null（无有效区块）。
 * 要求 BEGIN 与 END 同时存在且 END 在 BEGIN 之后。
 */
export function splitManaged(text) {
    const b = text.indexOf(BEGIN_MARKER);
    if (b === -1) return null;
    const e = text.indexOf(END_MARKER, b + BEGIN_MARKER.length);
    if (e === -1) return null;
    return {
        before: text.slice(0, b),
        inner: text.slice(b + BEGIN_MARKER.length, e),
        after: text.slice(e + END_MARKER.length),
    };
}

/** 用模板正文渲染受管区块全文（保留 before/after）。 */
export function renderManaged(content, before = "", after = "\n") {
    return `${before}${BEGIN_MARKER}\n${content.replace(/\s+$/, "")}\n${END_MARKER}${after}`;
}

// ---------------------------------------------------------------------------
// SKILL.md：frontmatter 与受管区块
//
// AGENTS.md 模板正文整体进受管区块；SKILL.md 还多一段 YAML frontmatter，
// 标记注释包不住它，因此单独按「键」管理：安装器只覆盖模板里定义的键
// （当前是 name / description），用户自行新增的键原样保留。
// ---------------------------------------------------------------------------

/**
 * 拆分 YAML frontmatter：返回 { raw, body } 或 null。
 * raw 为两条 `---` 之间的正文（不含定界符）；body 为闭合 `---` 行之后的内容。
 */
export function splitFrontmatter(text) {
    const firstNl = text.indexOf("\n");
    if (firstNl === -1) return null;
    if (text.slice(0, firstNl).trim() !== "---") return null;
    let idx = firstNl + 1;
    while (idx <= text.length) {
        const nl = text.indexOf("\n", idx);
        const lineEnd = nl === -1 ? text.length : nl;
        if (text.slice(idx, lineEnd).trim() === "---") {
            const raw = text.slice(firstNl + 1, idx).replace(/\n$/, "");
            const body = nl === -1 ? "" : text.slice(nl + 1);
            return {raw, body};
        }
        if (nl === -1) break;
        idx = nl + 1;
    }
    return null;
}

/** 顶层键的起始行特征：非缩进、`key:` 形式（键可含字母数字与 _ . / -）。 */
const FM_KEY_RE = /^([A-Za-z0-9_./-]+)\s*:/;

/**
 * 把 frontmatter 正文按顶层键切成块：每个块含键行及其所有续行（缩进行 / 空行）。
 * 返回 [{ key, lines }]；键前若有无法归属的非空行，归入 key=null 的前导块。
 */
export function parseFrontmatterBlocks(raw) {
    const blocks = [];
    let cur = null;
    for (const line of raw.split("\n")) {
        const m = FM_KEY_RE.exec(line);
        if (m && !/^\s/.test(line)) {
            if (cur) blocks.push(cur);
            cur = {key: m[1], lines: [line]};
        } else if (cur) {
            cur.lines.push(line);
        } else if (line.trim() !== "") {
            cur = {key: null, lines: [line]};
        }
    }
    if (cur) blocks.push(cur);
    for (const b of blocks) {
        while (b.lines.length && b.lines[b.lines.length - 1].trim() === "") b.lines.pop();
    }
    return blocks;
}

/** 把键块渲染回 frontmatter 正文。 */
function renderBlocks(blocks) {
    return blocks.map((b) => b.lines.join("\n")).join("\n");
}

/** frontmatter 正文的规范形态（幂等比较基准）。 */
export function canonicalFrontmatter(raw) {
    return renderBlocks(parseFrontmatterBlocks(raw));
}

/**
 * 合并 frontmatter：模板定义的键（受管）一律取模板值，用户独有的键原样保留。
 * 输出受管键在前（模板顺序），用户键在后。
 */
export function mergeFrontmatter(templateRaw, userRaw) {
    const tBlocks = parseFrontmatterBlocks(templateRaw);
    const managed = new Set(tBlocks.map((b) => b.key));
    const out = [...tBlocks];
    for (const b of parseFrontmatterBlocks(userRaw)) {
        if (!b.key || managed.has(b.key)) continue;
        out.push(b);
    }
    return renderBlocks(out);
}

/** 渲染完整 SKILL.md：frontmatter + 受管区块（保留区块外 before/after）。 */
export function renderSkillMd(frontmatterRaw, body, before = "", after = "\n") {
    return `---\n${frontmatterRaw}\n---\n${renderManaged(body, before, after)}`;
}

// ---------------------------------------------------------------------------
// 规划
// ---------------------------------------------------------------------------

/** 规划 AGENTS 模板落地。 */
export function planAgents({projectRoot, templateDir = AGENTS_TEMPLATE_DIR, force = false}) {
    if (!fs.existsSync(templateDir)) {
        throw new Error(`AGENTS 模板目录不存在：${templateDir}`);
    }
    const items = [];
    for (const rel of walkFiles(templateDir)) {
        const src = path.join(templateDir, rel);
        const target = path.join(projectRoot, rel);
        const content = fs.readFileSync(src, "utf-8");
        const sensitive = detectSensitive(content);
        if (sensitive) {
            items.push({kind: "agents", rel, src, target, status: "rejected", reason: `敏感信息：${sensitive.type}`});
            continue;
        }
        const item = {kind: "agents", rel, src, target, content};
        if (!fs.existsSync(target)) {
            item.status = "create";
        } else {
            const existing = fs.readFileSync(target, "utf-8");
            const managed = splitManaged(existing);
            if (!managed) {
                item.status = force ? "overwrite" : "conflict";
                item.reason = "已有 AGENTS.md 无 project-scaffold 管理区块";
            } else if (managed.inner.trim() === content.trim()) {
                item.status = "unchanged";
            } else {
                item.status = "update";
                item.before = managed.before;
                item.after = managed.after;
            }
        }
        items.push(item);
    }
    return items;
}

/**
 * 规划单个 skill 整目录复制。
 * SKILL.template.md 特殊处理：落为 SKILL.md，frontmatter 按「键」管理（只覆盖 name/description），
 * 正文进受管区块、区块外用户内容保留，升级时区块内直接替换。其余文件按字节比对。
 */
export function planSkill({projectRoot, name, templateDir = SKILL_TEMPLATE_DIR, force = false}) {
    const srcDir = path.join(templateDir, skillTemplateRel(name));
    const targetDir = path.join(projectRoot, ".opencode", "skills", name);
    if (!fs.existsSync(srcDir)) {
        return {
            kind: "skill",
            name,
            srcDir,
            targetDir,
            status: "missing-template",
            files: [],
            reason: `模板目录不存在：${srcDir}`
        };
    }
    const files = [];
    for (const rel of walkFiles(srcDir)) {
        const src = path.join(srcDir, rel);
        const targetRel = rel === "SKILL.template.md" ? "SKILL.md" : rel;
        const target = path.join(targetDir, targetRel);
        const buf = fs.readFileSync(src);
        const sensitive = isBinary(buf) ? null : detectSensitive(buf.toString("utf-8"));
        if (sensitive) {
            files.push({
                rel,
                targetRel,
                src,
                target,
                fileType: "raw",
                status: "rejected",
                reason: `敏感信息：${sensitive.type}`
            });
            continue;
        }
        if (targetRel === "SKILL.md") {
            files.push(planSkillMd({rel, targetRel, src, target, buf, force}));
            continue;
        }
        const item = {rel, targetRel, src, target, fileType: "raw", buf};
        if (!fs.existsSync(target)) {
            item.status = "create";
        } else {
            const existing = fs.readFileSync(target);
            item.status = existing.equals(buf) ? "unchanged" : force ? "overwrite" : "conflict";
        }
        files.push(item);
    }
    const statuses = new Set(files.map((f) => f.status));
    const status = statuses.has("rejected")
        ? "rejected"
        : statuses.has("conflict")
            ? "conflict"
            : statuses.has("missing-template")
                ? "missing-template"
                : statuses.has("overwrite")
                    ? "overwrite"
                    : statuses.has("update")
                        ? "update"
                        : statuses.has("create")
                            ? "create"
                            : "unchanged";
    return {kind: "skill", name, srcDir, targetDir, status, files};
}

/** 规划单个 SKILL.md：frontmatter 键级合并 + 正文受管区块。 */
function planSkillMd({rel, targetRel, src, target, buf, force}) {
    const templateText = buf.toString("utf-8");
    const tf = splitFrontmatter(templateText);
    if (!tf) {
        return {
            rel,
            targetRel,
            src,
            target,
            fileType: "skill-md",
            status: "missing-template",
            reason: "SKILL 模板缺少 frontmatter"
        };
    }
    const fm = canonicalFrontmatter(tf.raw);
    const base = {rel, targetRel, src, target, fileType: "skill-md", frontmatter: fm, body: tf.body};
    if (!fs.existsSync(target)) {
        return {...base, status: "create"};
    }
    const ef = splitFrontmatter(fs.readFileSync(target, "utf-8"));
    if (!ef) {
        return {...base, status: force ? "overwrite" : "conflict", reason: "已有 SKILL.md 无 frontmatter"};
    }
    const managed = splitManaged(ef.body);
    if (!managed) {
        return {
            ...base,
            status: force ? "overwrite" : "conflict",
            reason: "已有 SKILL.md 无 project-scaffold 管理区块"
        };
    }
    const mergedFm = mergeFrontmatter(tf.raw, ef.raw);
    if (mergedFm === canonicalFrontmatter(ef.raw) && managed.inner.trim() === tf.body.trim()) {
        return {...base, status: "unchanged"};
    }
    return {...base, status: "update", frontmatter: mergedFm, before: managed.before, after: managed.after};
}

/**
 * 生成完整安装计划（只读，不写文件）。
 * 返回结构化报告，供打印与测试断言。
 */
export function planInstall(opts) {
    const {
        projectRoot,
        force = false,
        skillNames = SKILL_NAMES,
        agentsTemplateDir = AGENTS_TEMPLATE_DIR,
        skillTemplateDir = SKILL_TEMPLATE_DIR,
    } = opts;
    const agents = planAgents({projectRoot, templateDir: agentsTemplateDir, force});
    const skills = skillNames.map((name) => planSkill({projectRoot, name, templateDir: skillTemplateDir, force}));
    return {projectRoot, force, agents, skills};
}

// ---------------------------------------------------------------------------
// 应用
// ---------------------------------------------------------------------------

/** 应用计划：写文件。返回更新后的报告（含 applied 标记）。 */
export function applyInstall(report) {
    const applied = {agents: 0, skills: 0};
    for (const item of report.agents) {
        if (item.status === "create" || item.status === "overwrite") {
            fs.mkdirSync(path.dirname(item.target), {recursive: true});
            fs.writeFileSync(item.target, renderManaged(item.content, "", "\n"), "utf-8");
            applied.agents += 1;
        } else if (item.status === "update") {
            fs.writeFileSync(item.target, renderManaged(item.content, item.before, item.after), "utf-8");
            applied.agents += 1;
        }
    }
    for (const skill of report.skills) {
        for (const file of skill.files) {
            if (file.fileType === "skill-md") {
                if (file.status === "create" || file.status === "overwrite") {
                    fs.mkdirSync(path.dirname(file.target), {recursive: true});
                    fs.writeFileSync(file.target, renderSkillMd(file.frontmatter, file.body, file.before ?? "", file.after ?? "\n"), "utf-8");
                    applied.skills += 1;
                } else if (file.status === "update") {
                    fs.writeFileSync(file.target, renderSkillMd(file.frontmatter, file.body, file.before, file.after), "utf-8");
                    applied.skills += 1;
                }
            } else if (file.status === "create" || file.status === "overwrite") {
                fs.mkdirSync(path.dirname(file.target), {recursive: true});
                fs.writeFileSync(file.target, file.buf);
                applied.skills += 1;
            }
        }
    }
    report.applied = applied;
    return report;
}

/** 统计各状态数量。 */
export function summarize(report) {
    const counts = {create: 0, update: 0, unchanged: 0, conflict: 0, overwrite: 0, rejected: 0, "missing-template": 0};
    const bump = (s) => {
        counts[s] = (counts[s] ?? 0) + 1;
    };
    for (const item of report.agents) bump(item.status);
    for (const skill of report.skills) {
        if (skill.files.length === 0 && skill.status === "missing-template") bump("missing-template");
        for (const f of skill.files) bump(f.status);
    }
    counts.blocking = counts.conflict + counts.rejected + counts["missing-template"];
    return counts;
}
