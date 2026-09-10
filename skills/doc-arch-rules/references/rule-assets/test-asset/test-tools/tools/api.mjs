#!/usr/bin/env node
// api.mjs —— 后端契约直调工具（入口①：被测系统本身）
// 形态：swagger-client 运行时直读契约 runner——AI 只需 operationId + 扁平参数值，
// 参数按 spec 自动归位到 path/query/header，requestBody 单独传；拼错 operationId/缺必填 fail-fast，不发脏请求。
// 契约源：docs/L3/openapi/（OpenAPI 3.1 多文件）→ 首次调用自动 redocly bundle 并缓存（源文件变更才重 bundle，对 AI 透明）。
// 环境变量：
//   API_BASE  （可选）后端 base URL 覆盖，如 http://localhost:8000/api/v1；缺省用契约自带 servers 默认值
//   API_TOKEN （可选）Bearer token（先 --operation authLogin 获取后注入）
//   HTTP_TIMEOUT_MS （可选）请求超时，默认 30000
// 用法：
//   npm run api -- --operation <operationId> [--path '<JSON>'] [--query '<JSON>'] [--header '<JSON>'] [--body '<JSON>'] [--omit 'k1,k2'] [--token <t>] [--list]
// 示例：
//   npm run api -- --operation authLogin --body '{"username":"admin","password":"..."}'
//   npm run api -- --operation listProjects --query '{"keyword":"TEST-","pageSize":10}'
//   npm run api -- --operation getProjectStatistics --path '{"projectCode":"XM-2026-001"}'
//   npm run api -- --operation createProject --body '{"auditUnit":"审计部-TEST","auditedUnit":"TEST-被审单位","owner":"张审计员",...}' --omit 'owner'

import { EXIT, done, env, parseArgs, helpIfRequested, loadDotEnv } from './_util.mjs'

loadDotEnv(import.meta.url)
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import SwaggerClient from 'swagger-client'

const require = createRequire(import.meta.url)

const USAGE = `用法：
  npm run api -- --operation <operationId> [--path '<JSON>'] [--query '<JSON>'] [--header '<JSON>'] [--body '<JSON>'] [--omit 'k1,k2'] [--token <t>] [--list]

示例：
  npm run api -- --list                                   # 列出契约中全部 operationId
  npm run api -- --operation authLogin --body '{"username":"admin","password":"..."}'
  npm run api -- --operation getProjectStatistics --path '{"projectCode":"XM-2026-022"}'   # URL 参数走 --path
  npm run api -- --operation listProjects --query '{"keyword":"TEST-","pageSize":10}'      # query 参数走 --query
  npm run api -- --operation transitionStage --path '{"projectCode":"XM-2026-022"}' --body '{"targetStage":"pre_survey"}'  # path+body 分通道
  npm run api -- --operation createProject --body '{...}' --omit 'owner,auditPeriod,startDate,endDate'   # 负路径：删键构造缺字段

参数说明：
  --operation  必填（或用 --list），契约中的 operationId（与 docs/L3/openapi 一致）
  --omit       可选，逗号分隔字段名——从 --body 删除指定顶层键（构造「缺字段」负路径）
  --body       可选，完整请求体 JSON（全字段字面量；键须 ∈ 契约 requestBody schema 属性，见 fail-fast 校验）
  --path       可选，path 参数 JSON（按契约 parameters 的 in: path 归位，如 {"projectCode":"TEST-001"}）
  --query      可选，query 参数 JSON（in: query 归位）
  --header     可选，header 参数 JSON（in: header 归位）
  --token      可选，Bearer token（缺省读环境变量 API_TOKEN）
  --list       列出契约全部 operationId 后退出

环境变量：API_BASE（可选，覆盖契约 servers 默认值）；API_TOKEN（可选）；HTTP_TIMEOUT_MS（可选，默认 30000）
退出码：0=2xx 成功；1=HTTP 非 2xx（业务失败）；2=参数错误；3=网络失败；10=配置/契约错误`

helpIfRequested(process.argv.slice(2), USAGE)

const args = parseArgs(process.argv.slice(2))

// ---------- 路径定位：tools/api.mjs → test-tools/ → 仓库根 ----------
const toolsDir = dirname(fileURLToPath(import.meta.url))
const testToolsDir = resolve(toolsDir, '..')
const repoRoot = resolve(testToolsDir, '../..')
const SPEC_MAIN = join(repoRoot, 'docs', 'L3', 'openapi', 'openapi.yaml')
const SPEC_DIR = join(repoRoot, 'docs', 'L3', 'openapi')
const CACHE_DIR = join(testToolsDir, '.cache')
const BUNDLE_FILE = join(CACHE_DIR, 'openapi-bundled.json')

if (!existsSync(SPEC_MAIN)) {
  done(EXIT.CONFIG, { ok: false, error: `契约主文件不存在：${SPEC_MAIN}（相对仓库根 docs/L3/openapi/openapi.yaml）` })
}

// ---------- 契约 bundle：源 yaml 内容 hash 校验——内容变了必重 bundle，保证执行契约与 docs/L3/openapi 源一致 ----------
const HASH_FILE = join(CACHE_DIR, 'openapi-bundled.hash')

// 递归扫源目录全部 .yaml/.json 文件内容，聚合 sha256（内容级指纹：git checkout 同内容不触发重建，内容变必重建）
function computeSpecHash() {
  const h = createHash('sha256')
  function walk(dir) {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, name.name)
      if (name.isDirectory()) walk(p)
      else if (name.name.endsWith('.yaml') || name.name.endsWith('.json')) h.update(readFileSync(p))
    }
  }
  walk(SPEC_DIR)
  return h.digest('hex')
}

function ensureBundle() {
  mkdirSync(CACHE_DIR, { recursive: true })
  const currentHash = computeSpecHash()
  const stale = !existsSync(BUNDLE_FILE) || !existsSync(HASH_FILE) || readFileSync(HASH_FILE, 'utf8').trim() !== currentHash
  if (!stale) return
  // 优先本地 devDependency 的 redocly 二进制（离线可复现），缺失时回落 npx
  const redoclyBin = process.platform === 'win32'
    ? join(testToolsDir, 'node_modules', '.bin', 'redocly.cmd')
    : join(testToolsDir, 'node_modules', '.bin', 'redocly')
  const cmd = existsSync(redoclyBin) ? redoclyBin : 'npx'
  const cmdArgs = cmd === 'npx' ? ['--yes', '@redocly/cli', 'bundle', SPEC_MAIN, '-o', BUNDLE_FILE] : ['bundle', SPEC_MAIN, '-o', BUNDLE_FILE]
  try {
    execFileSync(cmd, cmdArgs, {
      cwd: repoRoot,
      stdio: 'pipe', // bundle 日志走 stderr 通道吞掉，保持 stdout 单行 JSON 纯净
      timeout: 120000,
    })
  } catch (err) {
    done(EXIT.CONFIG, { ok: false, error: `redocly bundle 失败（契约本身有错或 redocly 不可用）：${err.message}` })
  }
  // bundle 成功后才写 hash 记录（失败不更新，下次调用重试）
  try {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(HASH_FILE, currentHash)
  } catch { /* hash 记录写失败不阻塞执行（仅下次重 bundle） */ }
}

ensureBundle()

const spec = JSON.parse(readFileSync(BUNDLE_FILE, 'utf8'))

// API_BASE 覆盖契约 servers（变量化 {host}/api/v1 → 直接指向实测 base URL）
const apiBase = env('API_BASE')
if (apiBase) spec.servers = [{ url: apiBase }]

// ---------- operationId 索引与校验（fail-fast：不发脏请求） ----------
const OPERATION_METHODS = ['get', 'post', 'put', 'patch', 'delete']
function listOperations() {
  const out = []
  for (const [pathName, item] of Object.entries(spec.paths || {})) {
    for (const method of OPERATION_METHODS) {
      const op = item[method]
      if (op?.operationId) out.push({ operationId: op.operationId, method: method.toUpperCase(), path: pathName, summary: op.summary || '' })
    }
  }
  return out
}

const ops = listOperations()

if (args.list) {
  done(EXIT.OK, { ok: true, count: ops.length, operations: ops })
}

const operationId = typeof args.operation === 'string' ? args.operation : ''
if (!operationId) {
  done(EXIT.USAGE, { ok: false, error: '缺少 --operation <operationId>（用 --list 查看全部可用 operationId）' })
}

const target = ops.find((o) => o.operationId === operationId)
if (!target) {
  done(EXIT.USAGE, {
    ok: false,
    error: `契约中不存在 operationId：${operationId}（共 ${ops.length} 个可用，用 --list 查看）`,
  })
}

// ---------- 参数解析 ----------
function parseJsonArg(name) {
  if (args[name] === undefined || args[name] === true) return undefined
  try {
    return JSON.parse(args[name])
  } catch (err) {
    done(EXIT.USAGE, { ok: false, error: `--${name} 不是合法 JSON：${err.message}` })
  }
}

const pathArgs = parseJsonArg('path')
const queryArgs = parseJsonArg('query')
const headerArgs = parseJsonArg('header')
const bodyOverride = parseJsonArg('body')
const omitKeys = typeof args.omit === 'string' ? args.omit.split(',').map((s) => s.trim()).filter(Boolean) : []
const formArgs = parseJsonArg('form')

// 四通道参数合法性（各通道均为对象）
for (const [name, val] of [['--path', pathArgs], ['--query', queryArgs], ['--header', headerArgs], ['--body', bodyOverride], ['--form', formArgs]]) {
  if (val !== undefined && (typeof val !== 'object' || Array.isArray(val) || val === null)) {
    done(EXIT.USAGE, { ok: false, error: `${name} 必须是对象，如 ${name} '{"key":"value"}'` })
  }
}

// 契约：该操作是否声明 requestBody
const opItem = spec.paths?.[target.path]?.[target.method.toLowerCase()] ?? {}
const hasRequestBody = !!opItem.requestBody
if (hasRequestBody && bodyOverride === undefined && formArgs === undefined) {
  done(EXIT.USAGE, { ok: false, error: `操作 ${operationId} 需要请求体（契约声明 requestBody）：提供 --body` })
}

function deepMerge(base, override) {
  if (override === undefined || override === null) return base
  if (typeof base !== 'object' || base === null || Array.isArray(base) || typeof override !== 'object' || Array.isArray(override)) return override
  const out = { ...base }
  for (const [k, v] of Object.entries(override)) out[k] = deepMerge(base[k], v)
  return out
}

// ========== fail-fast 输入校验：契约未声明的键直接报错（拼错静默忽略会误导执行） ==========
// bundle 产物中 $ref 需解析（如 #/components/parameters/ProjectCodeParam、#/components/schemas/X）
function resolveRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return undefined
  let node = spec
  for (const seg of ref.slice(2).split('/').map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))) node = node?.[seg]
  return node
}

function resolveParamDecl(p) {
  if (!p || typeof p !== 'object') return undefined
  if (p.$ref) return resolveRef(p.$ref)
  return p
}
// 按 in 分组的参数名集（path/query/header；header 本项目契约未声明，放行传输层头）
const paramNamesByIn = { path: new Set(), query: new Set(), header: new Set() }
for (const p of opItem.parameters ?? []) {
  const d = resolveParamDecl(p)
  if (d?.in && d.name) paramNamesByIn[d.in].add(d.name)
}
// multipart/form-data 字段集（--form 校验用）
let formFieldNames = null
if (opItem.requestBody) {
  const fs_ = opItem.requestBody?.content?.['multipart/form-data']?.schema
  if (fs_?.properties) formFieldNames = new Set(Object.keys(fs_.properties))
}
// body schema 属性集（--body/--omit 校验用）；additionalProperties 显式声明时放行额外键
let bodySchemaProps = null
let bodyAllowExtra = false
if (opItem.requestBody) {
  const bs = opItem.requestBody?.content?.['application/json']?.schema
  const s = bs?.$ref ? resolveRef(bs.$ref) : bs
  if (s?.properties) bodySchemaProps = new Set(Object.keys(s.properties))
  if (s?.additionalProperties) bodyAllowExtra = true
}
function validateChannel(label, obj, allowed, extraNote) {
  if (!obj) return
  const bad = Object.keys(obj).filter((k) => !allowed.has(k))
  if (bad.length) {
    const known = [...allowed].slice(0, 12).join(', ')
    done(EXIT.USAGE, {
      ok: false,
      error: `${label} 含契约未声明的键：${bad.join(', ')}（契约 ${operationId} 的可用${extraNote ?? '参数'}：${known}${allowed.size > 12 ? '…' : ''}——拼写检查或确认契约已更新）`,
    })
  }
}
// 执行顺序：path → query → header（header 契约无声明时放行）；body/omit 在 requestBody 构造后校验
validateChannel('--path', pathArgs, paramNamesByIn.path, 'in:path 参数')
validateChannel('--query', queryArgs, paramNamesByIn.query, 'in:query 参数')
if (paramNamesByIn.header.size > 0) validateChannel('--header', headerArgs, paramNamesByIn.header, 'in:header 参数')

// body/omit 键校验：body schema 有 properties 且未声明 additionalProperties 时，额外键 fail-fast（拼错检测）
if (bodySchemaProps && !bodyAllowExtra) {
  validateChannel('--body', bodyOverride, bodySchemaProps, 'body schema 属性')
  const badOmit = omitKeys.filter((k) => !bodySchemaProps.has(k))
  if (badOmit.length) {
    done(EXIT.USAGE, { ok: false, error: `--omit 含 body schema 未声明的键：${badOmit.join(', ')}（拼写检查——omit 只能删 schema 属性）` })
  }
}
let requestBody = bodyOverride
for (const k of omitKeys) delete requestBody[k]
if (formArgs && formFieldNames) {
  const bad = Object.keys(formArgs).filter((k) => !formFieldNames.has(k))
  if (bad.length) {
    done(EXIT.USAGE, { ok: false, error: `--form 含契约未声明的字段：${bad.join(', ')}（multipart 字段：${[...formFieldNames].join(', ')}）` })
  }
}



// execute 参数：--path/--query/--header 扁平合并后交给 swagger-client 按契约（parameters 的 in 声明）自动归位
// （swagger-js execute 对 path 分组支持不稳——实测 query 分组可、path 分组不识别；扁平按名归位是其原生成熟能力）
const execParams = {}
for (const [chan, obj] of [['--path', pathArgs], ['--query', queryArgs], ['--header', headerArgs]]) {
  if (!obj) continue
  for (const [k, v] of Object.entries(obj)) {
    if (k in execParams) {
      done(EXIT.USAGE, { ok: false, error: `参数 ${k} 在多个通道（${chan}）重复提供——同个参数只应出现在一个通道` })
    }
    execParams[k] = v
  }
}

const token = (typeof args.token === 'string' && args.token) || env('API_TOKEN')
const timeoutMs = Number(env('HTTP_TIMEOUT_MS', '30000'))

// ---------- multipart（--form）专用分支：直接 fetch（swagger-client execute 对 multipart 支持不稳） ----------
if (formArgs) {
  // URL：servers base + path（替换 {path 参数}）
  const base = env('API_BASE') || (spec.servers?.[0]?.url || 'http://localhost:8000/api/v1')
  let url = `${base}${target.path}`
  for (const [k, v] of Object.entries(execParams)) url = url.replace(new RegExp(`\\{${k}\\}`), String(v))
  const qs = Object.entries(execParams).filter(([k]) => !target.path.includes(`{${k}}`))
  if (qs.length) url += '?' + qs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  const fd = new FormData()
  for (const [k, v] of Object.entries(formArgs)) {
    if (typeof v === 'string' && v.startsWith('@')) {
      const pth = v.slice(1)
      const buf = readFileSync(pth)
      fd.append(k, new Blob([buf]), pth.split('/').pop())
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'string' && item.startsWith('@')) {
          const pth = item.slice(1)
          fd.append(k, new Blob([readFileSync(pth)]), pth.split('/').pop())
        } else fd.append(k, String(item))
      }
    } else {
      fd.append(k, String(v))
    }
  }
  const headers = {}
  if (token) headers.authorization = `Bearer ${token}`
  let resp
  try {
    resp = await Promise.race([
      fetch(url, { method: target.method, headers, body: fd }),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`请求超时（${timeoutMs}ms）`)), timeoutMs)),
    ])
  } catch (err) {
    done(EXIT.HTTP, { ok: false, operation: operationId, error: `网络请求失败：${err.message}` })
  }
  const text = await resp.text()
  let data = null
  try { data = JSON.parse(text) } catch { data = text }
  if (resp.ok) done(EXIT.OK, { ok: true, status: resp.status, operation: operationId, data })
  done(EXIT.ASSERT_FAIL, { ok: false, status: resp.status, operation: operationId, data, error: `HTTP ${resp.status} 业务失败` })
}

// ---------- 加载 client 并执行 ----------
let client
try {
  client = await SwaggerClient({ spec })
} catch (err) {
  done(EXIT.CONFIG, { ok: false, error: `契约加载/解析失败：${err.message}` })
}

const requestInterceptor = (req) => {
  if (token) req.headers.authorization = `Bearer ${token}`
  return req
}

let res
try {
  res = await Promise.race([
    client.execute({ operationId, parameters: execParams, requestBody, requestInterceptor }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`请求超时（${timeoutMs}ms）`)), timeoutMs)),
  ])
} catch (err) {
  // swagger-js 对部分非 2xx 抛 HttpError（带 status/response）——按业务失败处理，不算网络错误
  if (err && typeof err.status === 'number') {
    done(EXIT.ASSERT_FAIL, {
      ok: false,
      status: err.status,
      operation: operationId,
      data: err.response?.body ?? err.response?.text ?? null,
      error: `HTTP ${err.status} 业务失败`,
    })
  }
  // fetch failed 的真实原因在 err.cause（ECONNREFUSED=后端未起 / ENOTFOUND=DNS），带出便于诊断
  const cause = err.cause?.code || ''
  const hint = cause === 'ECONNREFUSED' ? `（连接被拒绝——后端未启动？API_BASE 当前指向何处）` : cause === 'ENOTFOUND' ? '（域名解析失败）' : ''
  done(EXIT.HTTP, { ok: false, operation: operationId, error: `网络请求失败：${err.message}${cause ? ` [${cause}]` : ''}${hint}` })
}

// ---------- 输出契约：stdout 单行 JSON ----------
if (res?.ok) {
  done(EXIT.OK, { ok: true, status: res.status, operation: operationId, request: `${target.method} ${res.url || target.path}`, data: res.body ?? null })
}

// swagger-js 层错误（参数构建/网络）：err 存在且无 status → 参数问题归 USAGE，带网络特征归 HTTP
if (res?.err && !res.status) {
  const msg = String(res.err.message || res.err)
  const isNetwork = /fetch|network|ECONN|ENOTFOUND|EAI_AGAIN|timeout|aborted/i.test(msg)
  done(isNetwork ? EXIT.HTTP : EXIT.USAGE, { ok: false, operation: operationId, error: msg })
}

if (res?.status) {
  done(EXIT.ASSERT_FAIL, {
    ok: false,
    status: res.status,
    operation: operationId,
    request: `${target.method} ${res.url || target.path}`,
    data: res.body ?? res.text ?? null,
    error: `HTTP ${res.status} 业务失败`,
  })
}

// 兜底：既非 ok 也非已识别错误（不应发生，防御性报告原始返回摘要）
done(EXIT.HTTP, { ok: false, operation: operationId, error: `未识别的执行结果：${JSON.stringify(res).slice(0, 500)}` })
