#!/usr/bin/env node
/**
 * docs-changes 变更元数据工具（只做机械动作）。
 *
 * 读取 docs/changes/ 下的 change 单篇，解析文件名与 frontmatter，用于：
 *   list     列出与筛选（默认命令）
 *   check    校验 frontmatter 与文件名
 *   advance  把「待清漂移 → 规划中」推进一步（前提：登记的漂移清单已全部解决）
 *
 * 状态流转里只有这一步可机械推进，其余状态一律由 AI 按 SKILL 推进。
 *
 * 用法：
 *   node scripts/changes.mjs list [--status <状态>]
 *   node scripts/changes.mjs check
 *   node scripts/changes.mjs advance [--dry-run]
 *
 * 目录可用环境变量覆盖：CHANGES_DIR（默认 docs/changes）、DRIFT_DIR（默认 docs/drift）。
 */
import {readdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import process from 'node:process'

const CHANGES_DIR = process.env.CHANGES_DIR ?? 'docs/changes'
const DRIFT_DIR = process.env.DRIFT_DIR ?? 'docs/drift'
const STATUSES = ['待查漂移', '待清漂移', '规划中', '待执行', '执行中', '待同步', '已实行']
const REQUIRED = ['状态', '影响产物', '漂移', '关联']
const FILE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/

function parseFrontmatter(text) {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!m) return null
    const fm = {}
    let key = null
    for (const raw of m[1].split(/\r?\n/)) {
        const line = raw.replace(/\s+$/, '')
        if (!line.trim()) continue
        const listItem = line.match(/^\s+-\s+(.+)$/)
        if (listItem && Array.isArray(fm[key])) {
            fm[key].push(listItem[1].trim())
            continue
        }
        const kv = line.match(/^([^:]+):\s*(.*)$/)
        if (!kv) continue
        key = kv[1].trim()
        const v = kv[2].trim()
        if (v.startsWith('[') && v.endsWith(']')) {
            fm[key] = v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
        } else if (v === '') {
            fm[key] = []
        } else {
            fm[key] = v
        }
    }
    return fm
}

function load() {
    if (!existsSync(CHANGES_DIR)) return []
    return readdirSync(CHANGES_DIR)
        .filter((f) => f.endsWith('.md'))
        .sort()
        .map((file) => {
            const path = join(CHANGES_DIR, file)
            const text = readFileSync(path, 'utf8')
            return {file, path, text, fm: parseFrontmatter(text)}
        })
}

/**
 * 漂移清单是否已清：清单不存在即视为已清；
 * 存在则看 frontmatter 清单状态（未清理 / 已清理），缺该状态时回落到表格行状态。
 */
function driftResolved(path) {
    if (!path || path === '无') return null
    const abs = path.startsWith(DRIFT_DIR) ? path : join(DRIFT_DIR, path.replace(/^.*\//, ''))
    if (!existsSync(path) && !existsSync(abs)) {
        return {resolved: true, reason: '清单不存在（视为已清）', path}
    }
    const real = existsSync(path) ? path : abs
    const text = readFileSync(real, 'utf8')
    const status = parseFrontmatter(text)?.['状态']
    if (status === '已清理') return {resolved: true, reason: '已清理', path: real}
    if (status === '未清理') return {resolved: false, reason: '未清理', path: real}
    /** @type {string[]} */
    const rows = text
        .split(/\r?\n/)
        .filter((l) => l.trim().startsWith('|'))
        .slice(1) // 去掉表头
        .filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l)) // 去掉分隔行
    if (rows.length === 0) return {resolved: false, reason: '清单无状态且无数据行', path: real}
    const pending = rows.filter((l) => !/已修复/.test(l))
    return pending.length === 0
        ? {resolved: true, reason: `行状态已清（${rows.length} 行）`, path: real}
        : {resolved: false, reason: `行状态未清（${pending.length}/${rows.length}）`, path: real}
}

function cmdList(args) {
    const i = args.indexOf('--status')
    const want = i >= 0 ? args[i + 1] : null
    const all = load()
    const rows = all.filter((c) => !want || c.fm?.['状态'] === want)
    console.log('文件\t状态\t影响产物\t漂移')
    for (const c of rows) {
        const s = c.fm?.['状态'] ?? '(无 frontmatter)'
        const impact = (c.fm?.['影响产物'] ?? []).join(' / ')
        const drift = c.fm?.['漂移']
        const d = drift && drift !== '无' ? (driftResolved(drift)?.reason ?? '') : '无'
        console.log(`${c.file}\t${s}\t${impact}\t${d}`)
    }
    console.log(`共 ${rows.length}/${all.length} 篇`)
    return 0
}

function cmdCheck() {
    const all = load()
    let bad = 0
    for (const c of all) {
        const errs = []
        if (!c.fm) errs.push('缺 frontmatter')
        else {
            for (const k of REQUIRED) if (!(k in c.fm)) errs.push(`缺字段 ${k}`)
            const status = c.fm['状态']
            const drift = c.fm['漂移']
            if (status && !STATUSES.includes(status)) errs.push(`状态非法：${status}`)
            if (drift && drift !== '无') {
                const r = driftResolved(drift)
                if (r && !r.resolved) errs.push(`漂移未清：${r.reason}`)
                if (r?.resolved && status === '待清漂移') errs.push('漂移已清但状态仍为待清漂移（可 advance）')
                if (r?.resolved === false && status === '规划中') errs.push('漂移未清却已进入规划')
            }
        }
        if (!FILE_RE.test(c.file)) errs.push(`文件名非 kebab-case：${c.file}`)
        if (errs.length) {
            bad++
            console.log(`✗ ${c.file}: ${errs.join('；')}`)
        }
    }
    console.log(bad === 0 ? `✓ ${all.length} 篇全部通过` : `${bad} 篇有问题`)
    return bad === 0 ? 0 : 1
}

function cmdAdvance(args) {
    const dry = args.includes('--dry-run')
    let moved = 0
    for (const c of load()) {
        if (c.fm?.['状态'] !== '待清漂移') continue
        const r = driftResolved(c.fm?.['漂移'])
        if (!r) {
            console.log(`- ${c.file}: 保持待清漂移（未登记漂移清单）`)
            continue
        }
        if (!r.resolved) {
            console.log(`- ${c.file}: 保持待清漂移（${r.reason}）`)
            continue
        }
        moved++
        console.log(`${dry ? '（dry-run）' : ''}${c.file}: 待清漂移 → 规划中（${r.reason}）`)
        if (!dry) writeFileSync(c.path, c.text.replace(/^状态:.*$/m, '状态: 规划中'), 'utf8')
    }
    console.log(`推进 ${moved} 篇`)
    return 0
}

const [cmd = 'list', ...args] = process.argv.slice(2)
const run = {list: cmdList, check: cmdCheck, advance: cmdAdvance}[cmd]
if (!run) {
    console.error('用法：changes.mjs [list [--status <状态>] | check | advance [--dry-run]]')
    process.exit(2)
}
process.exit(run(args))
