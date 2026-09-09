// 共享工具：JSON 输出约定 / 退出码 / 环境变量读取 / .env 加载
// 所有 test-tools 的输出契约：stdout 只输出一行 JSON，退出码表达结果类型（见 README「退出码约定」）。

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// 加载 test-tools/.env（不存在则跳过）；shell 已注入的变量优先于 .env
// 用法：各工具入口处调用 loadDotEnv(import.meta.url)
export function loadDotEnv(importMetaUrl) {
  const envPath = join(dirname(fileURLToPath(importMetaUrl)), '..', '.env')
  let content
  try {
    content = readFileSync(envPath, 'utf8')
  } catch {
    return
  }
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const key = m[1]
    const value = m[2].replace(/^["']|["']$/g, '')
    if (process.env[key] === undefined && value !== '') process.env[key] = value
  }
}

// 退出码约定（全工具统一）
export const EXIT = {
  OK: 0, // 执行成功（HTTP 2xx / 查询成功）
  ASSERT_FAIL: 1, // 执行成功但对账/断言失败（HTTP 非 2xx 业务失败、数据不匹配）
  USAGE: 2, // 参数或用法错误
  HTTP: 3, // 网络层失败（连不上/超时/TLS）
  DB: 4, // MySQL 连接/查询失败
  CONFIG: 10, // 环境变量缺失或鉴权错误
}

// stdout 输出一行 JSON 后退出
export function done(code, payload) {
  process.stdout.write(JSON.stringify(payload) + '\n')
  process.exit(code)
}

// 必填环境变量读取，缺失则报配置错误退出
export function requireEnv(name, hint = '') {
  const v = process.env[name]
  if (v === undefined || v === '') {
    done(EXIT.CONFIG, { ok: false, error: `缺少环境变量 ${name}${hint ? `（${hint}）` : ''}` })
  }
  return v
}

// 可选环境变量读取（带默认值）
export function env(name, def = '') {
  const v = process.env[name]
  return v === undefined || v === '' ? def : v
}

// 简易参数解析：--key value 或 --key=value，返回 { key: value }；无值 flag 返回 true
// 用法：node tools/xxx.mjs --sql "SELECT 1" --db audit_hub
export function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) {
      done(EXIT.USAGE, { ok: false, error: `无法识别的参数：${a}（参数需以 -- 开头）` })
    }
    const eq = a.indexOf('=')
    let key, val
    if (eq !== -1) {
      key = a.slice(2, eq)
      val = a.slice(eq + 1)
    } else {
      key = a.slice(2)
      val = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true
    }
    out[key] = val
  }
  return out
}

// 从 --help 触发输出用法并正常退出
export function helpIfRequested(argv, usage) {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(usage + '\n')
    process.exit(EXIT.OK)
  }
}
