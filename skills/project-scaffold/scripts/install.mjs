#!/usr/bin/env node
/**
 * project-scaffold 安装器入口（薄壳，Node 零依赖）
 *
 * 把本 skill 持有的两类模板落地到目标项目：
 *   1. AGENTS 模板：references/agents-templates/** -> 目标项目同名相对路径（根 AGENTS.md、docs/**\/AGENTS.md）
 *      以 `<!-- project-scaffold:begin/end -->` 受管区块承载——重复安装只替换区块，保留区块外用户内容。
 *   2. Skill 模板：references/skill-templates/<name>/** -> <项目>/.opencode/skills/<name>/**
 *      整目录复制；SKILL.template.md 改名为 SKILL.md（frontmatter 只管理 name/description，正文进受管区块）；
 *      递归含隐藏文件（.env.example/.gitignore 等）。
 *
 * 模式：
 *   默认 / --check   只读计划：扫描并输出将要做什么，不写任何文件（退出码 0=无冲突，1=有冲突/被拒）
 *   --apply          应用计划（安全）：创建缺失文件、替换 AGENTS.md/SKILL.md 受管区块、合并受管 frontmatter 键
 *   --force          显式覆盖无标记区冲突（AGENTS.md/SKILL.md 无管理区块 / skill 文件内容不一致），默认不覆盖
 *   --migrate        迁移旧 .omo/rules/docs：check 输出迁移报告；仅配合 --apply 时才真正删除
 *
 * 用法（项目根一律经 --project-root <path> 传入，无位置参数）：
 *   node scripts/install.mjs --project-root <path> [--check|--apply] [--force] [--migrate] [--verbose]
 *
 * 实现拆分为零依赖模块：核心逻辑 install-core.mjs，命令行/展示 install-cli.mjs；本文件仅作入口。
 */

import {fileURLToPath} from "node:url";
import * as path from "node:path";

import {main} from "./install-cli.mjs";

// 公开核心 API（供测试与其它脚本 import）
export * from "./install-core.mjs";
export {parseArgs, printReport, run, USAGE} from "./install-cli.mjs";

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
