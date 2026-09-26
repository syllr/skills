#!/usr/bin/env node
/**
 * project-scaffold 安装器测试（Node 内置 node:test，零依赖）
 *
 * 运行：node --test skills/project-scaffold/scripts/install.test.mjs
 * 或：  node --test skills/project-scaffold/scripts/
 *
 * 全部测试只在系统临时目录（os.tmpdir）内建项目根，不触碰仓库或任何真实项目。
 */

import {test} from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
    AGENTS_TEMPLATE_DIR,
    BEGIN_MARKER,
    END_MARKER,
    SKILL_NAMES,
    SKILL_TEMPLATE_DIR,
    skillTemplateRel,
    applyInstall,
    detectSensitive,
    planInstall,
    renderManaged,
    splitFrontmatter,
    splitManaged,
    summarize,
    walkFiles,
} from "./install-core.mjs";

/** 建临时项目根，测试结束自动清理。 */
function makeTmp(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "odob-"));
    t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
    return dir;
}

/** 静默日志。 */
const silent = () => {
};

/** 走完整流程：计划 + 应用。 */
function install(projectRoot, extra = {}) {
    const report = planInstall({projectRoot, ...extra});
    report.mode = "apply";
    applyInstall(report);
    return report;
}

// ---------------------------------------------------------------------------
// 敏感信息检查（单元）
// ---------------------------------------------------------------------------

test("detectSensitive：拦截私钥与明显真实凭据", () => {
    assert.ok(detectSensitive("-----BEGIN RSA PRIVATE KEY-----\nMIIE..."));
    assert.ok(detectSensitive("-----BEGIN OPENSSH PRIVATE KEY-----"));
    assert.ok(detectSensitive("aws = AKIAIOSFODNN7EXAMPLE"));
    assert.ok(detectSensitive('password = "SuperSecretValue12345"'));
    assert.ok(detectSensitive('api_key: "AbCdEf0123456789ZzYyXx"'));
    assert.ok(detectSensitive("token = 'ghp_abcdefghijklmnopqrstuvwxyz0123456789'"));
});

test("detectSensitive：放行占位符与空值", () => {
    assert.equal(detectSensitive("DB_PASS=\nJWT_SECRET=\nLLM_API_KEY="), null);
    assert.equal(detectSensitive('password: "your-password-here"'), null);
    assert.equal(detectSensitive("API_TOKEN=placeholder_value_1234567890"), null);
    assert.equal(detectSensitive('const password = requireEnv("DB_PASS")'), null);
    assert.equal(detectSensitive('{"username":"admin","password":"..."}'), null);
});

test("detectSensitive：全部模板零假阳性", () => {
    const roots = [AGENTS_TEMPLATE_DIR, path.join(AGENTS_TEMPLATE_DIR, "..", "skill-templates")];
    const hits = [];
    for (const root of roots) {
        for (const rel of walkFiles(root)) {
            const full = path.join(root, rel);
            const buf = fs.readFileSync(full);
            if (buf.includes(0)) continue;
            const hit = detectSensitive(buf.toString("utf-8"));
            if (hit) hits.push(`${rel}: ${hit.type}`);
        }
    }
    assert.deepEqual(hits, [], `模板出现疑似敏感信息：${hits.join("; ")}`);
});

// ---------------------------------------------------------------------------
// 管理区块（单元）
// ---------------------------------------------------------------------------

test("splitManaged/renderManaged：区块拆分与重建保留区块外内容", () => {
    const original = `用户头部\n${BEGIN_MARKER}\n旧内容\n${END_MARKER}\n用户尾部\n`;
    const managed = splitManaged(original);
    assert.ok(managed);
    assert.equal(managed.before, "用户头部\n");
    assert.equal(managed.inner.trim(), "旧内容");
    assert.equal(managed.after, "\n用户尾部\n");
    const rebuilt = renderManaged("新内容", managed.before, managed.after);
    assert.ok(rebuilt.includes("用户头部"));
    assert.ok(rebuilt.includes("用户尾部"));
    assert.ok(rebuilt.includes("新内容"));
    assert.ok(!rebuilt.includes("旧内容"));
});

test("splitManaged：无区块或缺结束标记返回 null", () => {
    assert.equal(splitManaged("只有普通内容"), null);
    assert.equal(splitManaged(`${BEGIN_MARKER}\n内容`), null);
});

// ---------------------------------------------------------------------------
// 首次安装
// ---------------------------------------------------------------------------

test("首次安装：AGENTS 全部新建且带管理区块，skill 整目录复制并改名", (t) => {
    const root = makeTmp(t);
    const report = install(root);

    // AGENTS：仅根 AGENTS.md（项目宪法）
    assert.equal(report.agents.length, 1);
    assert.equal(report.agents[0].rel, "AGENTS.md");
    assert.ok(report.agents.every((a) => a.status === "create"), JSON.stringify(report.agents.map((a) => [a.rel, a.status])));

    // 固定目标路径存在：只装根 AGENTS.md，不再有逐目录 AGENTS.md
    const rootAgents = path.join(root, "AGENTS.md");
    assert.ok(fs.existsSync(rootAgents), "根 AGENTS.md 应存在");
    assert.ok(!fs.existsSync(path.join(root, "docs", "AGENTS.md")), "不应生成逐目录 AGENTS.md");

    // 根 AGENTS.md 带管理区块，区块内即模板正文
    const written = fs.readFileSync(rootAgents, "utf-8");
    const managed = splitManaged(written);
    assert.ok(managed, "写入的 AGENTS.md 应含管理区块");
    const template = fs.readFileSync(path.join(AGENTS_TEMPLATE_DIR, "AGENTS.md"), "utf-8");
    assert.equal(managed.inner.trim(), template.trim());

    // skill：五个名称，SKILL.template.md 已改名，隐藏文件与嵌套资产齐全
    assert.deepEqual(report.skills.map((s) => s.name), SKILL_NAMES);
    assert.ok(report.skills.every((s) => s.status === "create"));
    const skillRoot = path.join(root, ".opencode", "skills");
    for (const name of SKILL_NAMES) {
        assert.ok(fs.existsSync(path.join(skillRoot, name, "SKILL.md")), `${name}/SKILL.md 应存在`);
        assert.ok(!fs.existsSync(path.join(skillRoot, name, "SKILL.template.md")), `${name} 不应保留 SKILL.template.md`);
    }
    assert.ok(fs.existsSync(path.join(skillRoot, "deploy-ops", "references", "deploy-assets.md")));
    assert.ok(fs.existsSync(path.join(skillRoot, "test-ops", "assets", "case-templates", "api-case.md")));
    // 文档操作 skill 就位
    assert.ok(fs.existsSync(path.join(skillRoot, "docs-business", "SKILL.md")));
    assert.ok(fs.existsSync(path.join(skillRoot, "docs-changes", "SKILL.md")));
    // 隐藏文件递归复制
    assert.ok(fs.existsSync(path.join(skillRoot, "tools-ops", "assets", "reference-impl", ".env.example")));
    assert.ok(fs.existsSync(path.join(skillRoot, "tools-ops", "assets", "reference-impl", ".gitignore")));
    assert.ok(fs.existsSync(path.join(skillRoot, "deploy-ops", "assets", "reference-impl", "configs", ".env.example")));
    assert.ok(fs.existsSync(path.join(skillRoot, "deploy-ops", "assets", "reference-impl", "docker-compose.<env>.yml")));

});

// ---------------------------------------------------------------------------
// 幂等
// ---------------------------------------------------------------------------

test("幂等：二次安装全部 unchanged 且文件字节不变", (t) => {
    const root = makeTmp(t);
    install(root);

    const before = fs.readFileSync(path.join(root, "AGENTS.md"), "utf-8");
    const skillFile = path.join(root, ".opencode", "skills", "test-ops", "SKILL.md");
    const skillBefore = fs.readFileSync(skillFile);

    const report2 = planInstall({projectRoot: root});
    assert.ok(report2.agents.every((a) => a.status === "unchanged"));
    assert.ok(report2.skills.every((s) => s.status === "unchanged"), JSON.stringify(report2.skills.map((s) => [s.name, s.status])));
    const counts = summarize(report2);
    assert.equal(counts.create + counts.update + counts.conflict + counts.overwrite, 0);
    assert.equal(counts.blocking, 0);

    // 计划为只读：再次 apply 不改字节
    applyInstall(report2);
    assert.equal(fs.readFileSync(path.join(root, "AGENTS.md"), "utf-8"), before);
    assert.ok(fs.readFileSync(skillFile).equals(skillBefore));
});

// ---------------------------------------------------------------------------
// AGENTS 区块保留
// ---------------------------------------------------------------------------

test("AGENTS 区块保留：只替换区块，保留区块外用户内容", (t) => {
    const root = makeTmp(t);
    const agentsPath = path.join(root, "AGENTS.md");
    fs.writeFileSync(agentsPath, `我的自定义头部\n${BEGIN_MARKER}\n过期的旧区块内容\n${END_MARKER}\n我的自定义尾部\n`, "utf-8");

    const report = planInstall({projectRoot: root});
    const rootItem = report.agents.find((a) => a.rel === "AGENTS.md");
    assert.equal(rootItem.status, "update");

    applyInstall(report);
    const result = fs.readFileSync(agentsPath, "utf-8");
    assert.ok(result.startsWith("我的自定义头部\n"), "区块前用户内容应保留");
    assert.ok(result.endsWith("我的自定义尾部\n"), "区块后用户内容应保留");
    assert.ok(!result.includes("过期的旧区块内容"), "旧区块应被替换");
    const managed = splitManaged(result);
    const template = fs.readFileSync(path.join(AGENTS_TEMPLATE_DIR, "AGENTS.md"), "utf-8");
    assert.equal(managed.inner.trim(), template.trim());

    // 再次安装该文件应为 unchanged
    const report2 = planInstall({projectRoot: root});
    assert.equal(report2.agents.find((a) => a.rel === "AGENTS.md").status, "unchanged");
});

// ---------------------------------------------------------------------------
// 冲突
// ---------------------------------------------------------------------------

test("AGENTS 冲突：无管理区块默认不写，--force 才覆盖", (t) => {
    const root = makeTmp(t);
    const agentsPath = path.join(root, "AGENTS.md");
    const userContent = "# 我自己的 AGENTS\n\n无管理区块的用户内容\n";
    fs.writeFileSync(agentsPath, userContent, "utf-8");

    // 默认：conflict，apply 不写
    const report = planInstall({projectRoot: root});
    assert.equal(report.agents.find((a) => a.rel === "AGENTS.md").status, "conflict");
    applyInstall(report);
    assert.equal(fs.readFileSync(agentsPath, "utf-8"), userContent, "冲突时不得改写");

    // --force：overwrite
    const forced = planInstall({projectRoot: root, force: true});
    assert.equal(forced.agents.find((a) => a.rel === "AGENTS.md").status, "overwrite");
    applyInstall(forced);
    const after = fs.readFileSync(agentsPath, "utf-8");
    assert.ok(after.includes(BEGIN_MARKER) && after.includes(END_MARKER));
    assert.ok(!after.includes("无管理区块的用户内容"));
});

test("skill 冲突：内容不一致默认不覆盖，--force 才覆盖", (t) => {
    const root = makeTmp(t);
    install(root);

    const skillFile = path.join(root, ".opencode", "skills", "tools-ops", "SKILL.md");
    fs.writeFileSync(skillFile, "项目侧手工改动的内容\n", "utf-8");

    // 默认 conflict
    const report = planInstall({projectRoot: root});
    const skill = report.skills.find((s) => s.name === "tools-ops");
    assert.equal(skill.status, "conflict");
    assert.ok(skill.files.some((f) => f.targetRel === "SKILL.md" && f.status === "conflict"));
    applyInstall(report);
    assert.equal(fs.readFileSync(skillFile, "utf-8"), "项目侧手工改动的内容\n", "冲突时不得覆盖");

    // --force 覆盖：写回受管形态（frontmatter + 管理区块）
    const forced = planInstall({projectRoot: root, force: true});
    const forcedSkill = forced.skills.find((s) => s.name === "tools-ops");
    assert.equal(forcedSkill.files.find((f) => f.targetRel === "SKILL.md").status, "overwrite");
    applyInstall(forced);
    const restored = fs.readFileSync(skillFile, "utf-8");
    const rf = splitFrontmatter(restored);
    assert.ok(rf, "覆盖后应为受管 SKILL.md");
    const restoredManaged = splitManaged(rf.body);
    assert.ok(restoredManaged, "覆盖后正文应带管理区块");
    const templateText = fs.readFileSync(path.join(SKILL_TEMPLATE_DIR, skillTemplateRel("tools-ops"), "SKILL.template.md"), "utf-8");
    assert.equal(restoredManaged.inner.trim(), splitFrontmatter(templateText).body.trim());
});

// ---------------------------------------------------------------------------
// SKILL.md 受管形态与区块保留
// ---------------------------------------------------------------------------

test("首次安装：SKILL.md 带管理区块，frontmatter 只含 name/description", (t) => {
    const root = makeTmp(t);
    install(root);

    const skillFile = path.join(root, ".opencode", "skills", "test-ops", "SKILL.md");
    const fm = splitFrontmatter(fs.readFileSync(skillFile, "utf-8"));
    assert.ok(fm, "SKILL.md 应有 frontmatter");
    assert.match(fm.raw, /^name: test-ops$/m);
    assert.match(fm.raw, /^description: /m);
    assert.doesNotMatch(fm.raw, /^license:/m, "不应残留 license 键");
    assert.doesNotMatch(fm.raw, /^metadata:/m, "不应残留 metadata 键");

    const managed = splitManaged(fm.body);
    assert.ok(managed, "SKILL.md 正文应含 project-scaffold 管理区块");
    const templateText = fs.readFileSync(path.join(SKILL_TEMPLATE_DIR, skillTemplateRel("test-ops"), "SKILL.template.md"), "utf-8");
    assert.equal(managed.inner.trim(), splitFrontmatter(templateText).body.trim());
});

test("SKILL.md 区块保留：替换受管区块，保留区块外内容与用户新增 frontmatter 键", (t) => {
    const root = makeTmp(t);
    install(root);
    const skillFile = path.join(root, ".opencode", "skills", "deploy-ops", "SKILL.md");
    const fm = splitFrontmatter(fs.readFileSync(skillFile, "utf-8"));
    fs.writeFileSync(
        skillFile,
        `---\n${fm.raw}\ncustom-key: my-value\n---\n${BEGIN_MARKER}\n过期的旧区块\n${END_MARKER}\n我的自定义尾部\n`,
        "utf-8",
    );

    const report = planInstall({projectRoot: root});
    const md = report.skills.find((s) => s.name === "deploy-ops").files.find((f) => f.targetRel === "SKILL.md");
    assert.equal(md.status, "update");

    applyInstall(report);
    const result = fs.readFileSync(skillFile, "utf-8");
    const rf = splitFrontmatter(result);
    assert.match(rf.raw, /^name: deploy-ops$/m, "受管键应来自模板");
    assert.match(rf.raw, /^custom-key: my-value$/m, "用户新增键应保留");
    assert.ok(!result.includes("过期的旧区块"), "旧区块应被替换");
    assert.ok(result.endsWith("我的自定义尾部\n"), "区块外用户内容应保留");
    const templateText = fs.readFileSync(path.join(SKILL_TEMPLATE_DIR, skillTemplateRel("deploy-ops"), "SKILL.template.md"), "utf-8");
    assert.equal(splitManaged(rf.body).inner.trim(), splitFrontmatter(templateText).body.trim());

    // 再次 plan → unchanged（幂等）
    const report2 = planInstall({projectRoot: root});
    assert.equal(report2.skills.find((s) => s.name === "deploy-ops").files.find((f) => f.targetRel === "SKILL.md").status, "unchanged");
});
