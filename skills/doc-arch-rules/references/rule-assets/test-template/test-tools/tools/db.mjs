#!/usr/bin/env node
// db.mjs —— MySQL 只读对账工具（入口③：业务库落位验证）
// 安全：只放行只读语句（SELECT/SHOW/DESCRIBE/EXPLAIN/WITH），其余一律拒绝（防 AI 误写）。
// 用法：
//   node tools/db.mjs -- "SELECT project_code, current_stage FROM audit_project WHERE project_code LIKE 'TEST-%'"
// 环境变量：
//   DB_HOST / DB_PORT / DB_USER / DB_PASS / DB_NAME（测试库连接参数，见 TEST-PLAN §3.3）

import mysql from 'mysql2/promise'
import { EXIT, done, requireEnv, env, parseArgs, helpIfRequested } from './_util.mjs'
import { loadDotEnv } from './_util.mjs'

loadDotEnv(import.meta.url)

const USAGE = `用法：
  node tools/db.mjs -- "<只读 SQL>"

示例：
  node tools/db.mjs -- "SELECT project_code, current_stage FROM audit_project WHERE project_code LIKE 'TEST-%'"

环境变量：DB_HOST、DB_PORT（默认 3306）、DB_USER、DB_PASS、DB_NAME
只读限制：仅放行 SELECT/SHOW/DESCRIBE/EXPLAIN/WITH 开头；UPDATE/DELETE/INSERT/DDL 一律拒绝（退出码 1）
退出码：0=查询成功（含空结果）；1=语句被拒（非只读）或对账不匹配；2=参数错误；4=连接/查询失败；10=配置错误`

helpIfRequested(process.argv.slice(2), USAGE)

const argv = process.argv.slice(2)
// 自制解析：位置参数 = SQL（npm run db -- "<SQL>"）；--sql 兼容；--cleanup <code> 取跟随值
const args = {}
const positional = []
let i = 0
while (i < argv.length) {
  const a = argv[i]
  if (a.startsWith('--')) {
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith('--')) { args[key] = next; i += 2 } else { args[key] = true; i += 1 }
  } else { positional.push(a); i += 1 }
}
const sql = (typeof args.sql === 'string' && args.sql) || positional[0]

// --cleanup <projectCode>：受控级联清理（测试失败/被测接口不可用时的 DB 兜底删除；只按 project_code 精确删业务表行）
const cleanupCode = typeof args.cleanup === 'string' ? args.cleanup : undefined
if (cleanupCode !== undefined) {
  const code = String(cleanupCode)
  if (!/^[A-Za-z0-9-]{1,64}$/.test(code)) done(EXIT.USAGE, { ok: false, error: '--cleanup 参数须为项目编码（字母数字-，≤64）' })
  const host0 = requireEnv('DB_HOST', '测试库地址，见 TEST-PLAN §3.3')
  const conn0 = await mysql.createConnection({ host: host0, port: Number(env('DB_PORT', '3306')), user: requireEnv('DB_USER'), password: requireEnv('DB_PASS'), database: requireEnv('DB_NAME'), connectTimeout: 10000 })
  try {
    const [[proj]] = await conn0.query('SELECT project_id, project_code FROM audit_project WHERE project_code = ?', [code])
    if (!proj) { await conn0.end(); done(EXIT.OK, { ok: true, message: `项目 ${code} 不存在，无清理动作` }) }
    const pid = proj.project_id
    await conn0.beginTransaction()
    const order = ['working_paper', 'evidence_sheet', 'rect_item', 'implementation_plan', 'audit_report', 'suspicion', 'collection_item', 'generation_task']
    const deleted = {}
    const [rEv] = await conn0.query('DELETE FROM working_paper_evidence WHERE paper_id IN (SELECT draft_id FROM working_paper WHERE project_id = ?)', [pid])
deleted.working_paper_evidence = rEv.affectedRows
for (const tbl of order) {
      const [r] = await conn0.query(`DELETE FROM ${tbl} WHERE project_id = ?`, [pid])
      deleted[tbl] = r.affectedRows
    }
    const [rProj] = await conn0.query('DELETE FROM audit_project WHERE project_id = ?', [pid])
    deleted.audit_project = rProj.affectedRows
    await conn0.commit()
    await conn0.end()
    done(EXIT.OK, { ok: true, message: `项目 ${code} 级联清理完成`, deleted })
  } catch (err) {
    try { await conn0.rollback() } catch {}
    try { await conn0.end() } catch {}
    done(EXIT.DB, { ok: false, error: `清理失败（已回滚）：${err.message}` })
  }
}

const trimmed = (sql ?? '').trim().toUpperCase()
if (!/^(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN|WITH)\b/.test(trimmed)) {
  done(EXIT.ASSERT_FAIL, { ok: false, error: `非只读语句被拒绝：${trimmed.slice(0, 60)}（仅放行 SELECT/SHOW/DESCRIBE/EXPLAIN/WITH）` })
}

const host = requireEnv('DB_HOST', '测试库地址，见 TEST-PLAN §3.3')
const user = requireEnv('DB_USER')
const pass = requireEnv('DB_PASS')
const database = requireEnv('DB_NAME')

let conn
try {
  conn = await mysql.createConnection({
    host,
    port: Number(env('DB_PORT', '3306')),
    user,
    password: pass,
    database,
    connectTimeout: 10000,
  })
  const [rows, fields] = await conn.query(sql)
  await conn.end()
  done(EXIT.OK, { ok: true, row_count: Array.isArray(rows) ? rows.length : 0, columns: fields?.map((f) => f.name) || [], rows })
} catch (err) {
  if (conn) { try { await conn.end() } catch {} }
  done(EXIT.DB, { ok: false, error: `MySQL 查询失败：${err.message}` })
}
