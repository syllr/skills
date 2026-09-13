// 共享工具：JSON 输出约定 / 退出码 / 环境变量读取 / .env 加载
// 所有 test-tools 的输出契约：stdout 只输出一行 JSON，退出码表达结果类型（见 README「退出码约定」）。

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// 已解析的环境名（'' = 默认环境 .env；非空 = .env.<name>）——供输出契约并入 env 字段做溯源
export let RESOLVED_ENV = ''

// 从 argv 读取 --key 的值（支持 --key value 与 --key=value）；未出现返回 undefined
function argvValue(argv, key) {
  const flag = `--${key}`
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === flag) return argv[i + 1]
    if (a.startsWith(`${flag}=`)) return a.slice(flag.length + 1)
  }
  return undefined
}

// 扫描 test-tools 目录下已配置的环境名（.env.<name>，排除 .example）
function listEnvs(dir) {
  try {
    return readdirSync(dir)
      .filter((f) => /^\.env\.[A-Za-z0-9_-]+$/.test(f) && !f.endsWith('.example'))
      .map((f) => f.slice('.env.'.length))
      .sort()
  } catch {
    return []
  }
}

// 加载环境变量文件：选择器 = --env <name> → TEST_ENV → 默认 .env（严格模式，不叠加）
// - 指定环境名但文件不存在 → 配置错误退出（退出码 10），列出可用环境——禁止静默回退
// - 环境名非法（防路径穿越）→ 用法错误退出（退出码 2）
// - shell 已注入的变量优先于文件（文件只填未定义键）
export function loadDotEnv(importMetaUrl) {
  const dir = join(dirname(fileURLToPath(importMetaUrl)), '..')
  const argv = process.argv.slice(2)
  // --help/-h 时不解析环境（避免 --help --env bogus 先报环境错）
  if (argv.includes('--help') || argv.includes('-h')) return

  const pickIdx = argv.indexOf('--env')
  const rawFlag = argvValue(argv, 'env')
  const fromArg = rawFlag !== undefined
  // --env 缺值（末尾裸 --env）→ 用法错误
  if (pickIdx !== -1 && (rawFlag === undefined || /^--/.test(String(rawFlag)))) {
    done(EXIT.USAGE, { ok: false, error: '--env 缺少环境名，如 --env dev（可用环境见 test-tools 目录下 .env.<环境名>）' })
  }
  const envName = String((fromArg ? rawFlag : undefined) ?? process.env.TEST_ENV ?? '').trim()

  if (envName && !/^[A-Za-z0-9_-]+$/.test(envName)) {
    done(EXIT.USAGE, { ok: false, error: `--env 名称非法：${envName}（仅允许字母、数字、-、_）` })
  }

  const file = envName ? `.env.${envName}` : '.env'
  const envPath = join(dir, file)

  if (envName && !existsSync(envPath)) {
    done(EXIT.CONFIG, {
      ok: false,
      error: `环境 ${envName} 未配置：${file} 不存在（禁止回退默认 .env，防跑错环境）`,
      available: listEnvs(dir),
    })
  }
  if (!existsSync(envPath)) return // 默认 .env 缺失 → 静默跳过（保持向后兼容）

  RESOLVED_ENV = envName
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
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

// stdout 输出一行 JSON 后退出（统一并入本次使用的环境，供证据溯源）
export function done(code, payload) {
  const out = payload && typeof payload === 'object' && !Array.isArray(payload) ? { env: RESOLVED_ENV || 'default', ...payload } : payload
  process.stdout.write(JSON.stringify(out) + '\n')
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
