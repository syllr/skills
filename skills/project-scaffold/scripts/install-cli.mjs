/**
 * project-scaffold 安装器命令行层（Node 零依赖）
 *
 * 职责：参数解析、用法文本、人类可读报告打印、程序化入口 run、main。
 * 核心逻辑全部委托 install-core.mjs；本文件只做 I/O 与展示。
 *
 * 用法：
 *   node scripts/install.mjs --project-root <path> [--check|--apply] [--force] [--migrate] [--verbose]
 *
 * 零依赖：只用 Node 内置模块（node:fs / node:path），不引入任何 npm 包。
 */

import * as fs from "node:fs";
import * as path from "node:path";

import {applyInstall, planInstall, summarize} from "./install-core.mjs";

/** 各状态的中文标签（报告展示用）。 */
const STATUS_LABEL = {
    create: "新建",
    update: "更新受管区",
    unchanged: "未变化",
    conflict: "冲突",
    overwrite: "覆盖(force)",
    rejected: "拒绝(敏感信息)",
    "missing-template": "模板缺失",
};

/** 打印人类可读报告（log 可注入，便于测试静默）。 */
export function printReport(report, counts, log = console.log) {
    const mode = report.mode === "apply" ? "应用" : "计划(只读)";
    log(`=== project-scaffold 安装器（${mode}）===`);
    log(`目标项目根：${report.projectRoot}`);
    if (report.force) log("--force 已启用（显式覆盖冲突）");
    if (report.migrate) log("--migrate 已启用（迁移旧 .omo/rules/docs）");
    log("");

    log(`[AGENTS] ${report.agents.length} 个模板`);
    for (const item of report.agents) {
        const note = item.reason ? `  （${item.reason}）` : "";
        log(`  ${(STATUS_LABEL[item.status] ?? item.status).padEnd(14)} ${item.rel}${note}`);
    }
    log("");

    for (const skill of report.skills) {
        log(`[skill] ${skill.name} -> .opencode/skills/${skill.name}/  ${STATUS_LABEL[skill.status] ?? skill.status}`);
        if (skill.reason) log(`  （${skill.reason}）`);
        for (const f of skill.files) {
            if (f.status === "unchanged" && !report.verbose) continue;
            const note = f.reason ? `  （${f.reason}）` : "";
            log(`  ${(STATUS_LABEL[f.status] ?? f.status).padEnd(14)} ${f.targetRel}${note}`);
        }
    }
    log("");

    if (report.migration.exists) {
        const action = report.migrate ? (report.mode === "apply" ? "删除" : "待删除（--apply 生效）") : "仅报告（未启用 --migrate）";
        log(`[迁移] 检测到旧 rule 目录：${path.relative(report.projectRoot, report.migration.oldDir) || report.migration.oldDir}`);
        log(`  ${action}`);
        if (report.migration.deleted) log("  已删除");
    } else {
        log("[迁移] 未检测到旧 .omo/rules/docs");
    }
    log("");

    log(
        `汇总：新建 ${counts.create} / 更新受管区 ${counts.update} / 未变化 ${counts.unchanged} / ` +
        `冲突 ${counts.conflict} / 覆盖 ${counts.overwrite} / 拒绝 ${counts.rejected}`,
    );
    if (counts.blocking > 0) {
        log(`存在 ${counts.blocking} 项阻塞（冲突/拒绝/模板缺失）——` + (report.mode === "apply" ? "请检查后用 --force 或先修复" : "默认不会写入"));
    }
}

/** 用法文本。 */
export const USAGE = `用法：node scripts/install.mjs --project-root <path> [--check|--apply] [--force] [--migrate] [--verbose]

  --project-root <path>  目标项目根目录（必填，须为已存在目录）
  --check                只读计划（默认行为，不写任何文件）
  --apply                应用计划（安全写入；创建缺失文件、替换 AGENTS.md / SKILL.md 受管区块、更新受管 frontmatter 键）
  --force                显式覆盖冲突（AGENTS.md 无管理区块 / skill 文件内容不一致）
  --migrate              迁移旧 .omo/rules/docs（check 输出迁移报告；仅配合 --apply 时删除）
  --verbose              计划中列出未变化文件
  -h, --help             显示本帮助`;

/** 解析命令行参数（必需项一律经 --project-root <path> 传入，无位置参数）。 */
export function parseArgs(argv) {
    const opts = {projectRoot: null, mode: "check", force: false, migrate: false, verbose: false, help: false};
    for (let i = 0; i < argv.length; i += 1) {
        const a = argv[i];
        if (a === "--project-root") {
            opts.projectRoot = argv[i + 1];
            i += 1;
        } else if (a.startsWith("--project-root=")) {
            opts.projectRoot = a.slice("--project-root=".length);
        } else if (a === "--check") {
            opts.mode = "check";
        } else if (a === "--apply") {
            opts.mode = "apply";
        } else if (a === "--force") {
            opts.force = true;
        } else if (a === "--migrate") {
            opts.migrate = true;
        } else if (a === "--verbose") {
            opts.verbose = true;
        } else if (a === "-h" || a === "--help") {
            opts.help = true;
        } else {
            throw new Error(`未知参数：${a}（项目根须经 --project-root <path> 传入）`);
        }
    }
    return opts;
}

/** 程序化入口：解析 → 计划 →（可选）应用 → 报告。返回 {report, counts, exitCode}。 */
export function run(opts, {log = console.log} = {}) {
    if (!opts.projectRoot) {
        throw new Error("缺少 --project-root <path>");
    }
    const projectRoot = path.resolve(opts.projectRoot);
    if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
        throw new Error(`--project-root 不是已存在目录：${projectRoot}`);
    }
    const report = planInstall({projectRoot, force: opts.force, migrate: opts.migrate});
    report.mode = opts.mode;
    report.verbose = opts.verbose;
    if (opts.mode === "apply") {
        applyInstall(report);
    }
    const counts = summarize(report);
    log("");
    printReport(report, counts, log);
    const exitCode = counts.blocking > 0 ? 1 : 0;
    return {report, counts, exitCode};
}

/** CLI 主入口（供薄壳 install.mjs 在直接调用时触发）。 */
export function main() {
    let opts;
    try {
        opts = parseArgs(process.argv.slice(2));
    } catch (e) {
        console.error(`参数错误：${e.message}\n\n${USAGE}`);
        process.exit(2);
    }
    if (opts.help) {
        console.log(USAGE);
        process.exit(0);
    }
    try {
        const {exitCode} = run(opts);
        process.exit(exitCode);
    } catch (e) {
        console.error(`错误：${e.message}`);
        process.exit(2);
    }
}
