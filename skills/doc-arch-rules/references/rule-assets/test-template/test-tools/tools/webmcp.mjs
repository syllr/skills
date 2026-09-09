#!/usr/bin/env node
// webmcp.mjs —— WebMCP 工具序列执行器（入口②：前端页面业务能力，宿主 chrome）
// 通过 playwright-core 驱动本机 Chrome（channel:'chrome'），在页面上下文枚举/执行
// document.modelContext 注册的 WebMCP 工具，等价浏览器内 agent 调用链路。
// 输出契约：stdout 单行 JSON；退出码见 README（0=全部成功 / 1=工具业务失败 / 2=参数 / 3=浏览器连接 / 10=配置）
// 用法：
//   npm run webmcp -- --seq '<JSON>' [--url <pageUrl>] [--headed] [--connect <http://127.0.0.1:9333>] [--list]
// 示例：
//   npm run webmcp -- --list
//   npm run webmcp -- --seq '[{"name":"login","args":{"username":"admin","password":"..."}},{"name":"query_projects","args":{"pageSize":5}}]'
//   npm run webmcp -- --seq '[...]' --headed        # 有头（人工旁观）
//   npm run webmcp -- --seq '[...]' --connect http://127.0.0.1:9333   # 连接已运行的 Chrome

import { EXIT, done, env, parseArgs, helpIfRequested } from './_util.mjs'
import { loadDotEnv } from './_util.mjs'

loadDotEnv(import.meta.url)
import { mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const USAGE = `用法：
  npm run webmcp -- --seq '<JSON>' [--path <页面路径>] [--url <baseUrl>] [--headed] [--connect <cdpUrl>] [--list]

参数说明：
  --seq      工具序列 JSON 数组，元素 {"name":"工具名","args":{...}}，同页面顺序执行（会话保持）
  --path     页面路径（如 /projects/new；host 走 --url/.env WEBMCP_URL）
  --url      base URL（默认取 WEBMCP_URL）
  --headed   有头模式（默认无头；人工旁观时用）
  --connect  连接已运行的 Chrome（默认自动启动独立实例）
  --list     只枚举页面注册的工具后退出

环境变量：WEBMCP_TIMEOUT_MS（工具单步超时，默认 30000）
退出码：0=序列全部成功；1=任一工具业务失败；2=参数错误；3=浏览器/页面连接失败；10=配置错误（Chrome 缺失/flag 未生效）`

helpIfRequested(process.argv.slice(2), USAGE)

const args = parseArgs(process.argv.slice(2))

const PAGE_URL = (() => {
  const base = typeof args.url === 'string' ? args.url : env('WEBMCP_URL', 'http://192.168.1.225:8080')
  // --path 指定页面路径（如 /projects/new）；host 走 base（.env WEBMCP_URL）
  if (typeof args.path === 'string') {
    if (!args.path.startsWith('/')) done(EXIT.USAGE, { ok: false, error: '--path 必须以 / 开头（页面路径，如 /projects/new）' })
    return base.replace(/\/$/, '') + args.path
  }
  return base
})()
const STEP_TIMEOUT = Number(env('WEBMCP_TIMEOUT_MS', '30000'))
const toolsDir = dirname(fileURLToPath(import.meta.url))
const testToolsDir = resolve(toolsDir, '..')
const PROFILE_DIR = join(testToolsDir, '.webmcp-profile')

const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('playwright-core'))
} catch {
  done(EXIT.CONFIG, { ok: false, error: 'playwright-core 未安装（cd test-tools && npm install）' })
}

function buildLaunchArgs(pageUrl) {
  const launchArgs = [
    '--enable-features=WebMCPTesting,DevToolsWebMCPSupport',
    '--no-first-run',
  ]
  // 非 localhost 的 http 目标：放宽 SecureContext，否则 modelContext 不暴露
  try {
    const origin = new URL(pageUrl).origin
    if (!['localhost', '127.0.0.1'].includes(new URL(pageUrl).hostname)) {
      launchArgs.push(`--unsafely-treat-insecure-origin-as-secure=${origin}`)
    }
  } catch {
    done(EXIT.USAGE, { ok: false, error: `--url 不是合法 URL：${pageUrl}` })
  }
  return launchArgs
}

let driver // { close(): Promise<void> }
try {
  if (args.connect) {
    const browser = await chromium.connectOverCDP(String(args.connect))
    const context = browser.contexts()[0] || (await browser.newContext())
    const page = await context.newPage()
    driver = { page, close: () => browser.close() } // connectOverCDP 的 close 只断开连接，不关浏览器
  } else {
    mkdirSync(PROFILE_DIR, { recursive: true })
    const context = await chromium.launchPersistentContext(PROFILE_DIR, {
      channel: 'chrome',
      headless: !args.headed,
      timeout: 30000,
      args: buildLaunchArgs(PAGE_URL),
    })
    const page = context.pages()[0] || (await context.newPage())
    driver = { page, close: () => context.close() }
  }
} catch (err) {
  done(EXIT.HTTP, {
    ok: false,
    error: `浏览器启动/连接失败：${String(err && err.message || err).slice(0, 300)}`,
  })
}

const { page, close } = driver

// 页面加载 + WebMCP API 就绪探测（SPA 工具注册在 main.ts 启动即调，load 后轮询至多 10s）
try {
  await page.goto(PAGE_URL, { waitUntil: 'load', timeout: 30000 })
} catch (err) {
  await close()
  done(EXIT.HTTP, { ok: false, error: `页面加载失败：${String(err && err.message || err).slice(0, 200)}` })
}

const probe = await page
  .waitForFunction(
    `(() => {
      const api = document.modelContext ?? navigator.modelContext;
      return typeof api?.getTools === 'function';
    })()`,
    { timeout: 10000 },
  )
  .then(() => true)
  .catch(() => false)

if (!probe) {
  await close()
  done(EXIT.CONFIG, {
    ok: false,
    error: 'modelContext 不可用（WebMCP flag 未生效或页面未注册工具）——确认 Chrome 149+ 且 --enable-features=WebMCPTesting,DevToolsWebMCPSupport',
  })
}

// 页面上下文执行体：枚举 + 执行（executeTool 第二参为 JSON 字符串；arg 经 JSON 内嵌进表达式源码）
async function runInPage(body, payload) {
  const expr = `(async (payload) => {
    const api = document.modelContext ?? navigator.modelContext;
    const tools = await api.getTools();
    ${body}
  })(${JSON.stringify(payload)})`
  return Promise.race([
    page.evaluate(expr).then((r) => (typeof r === 'string' ? JSON.parse(r) : r)),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`页面执行超时（${STEP_TIMEOUT}ms）`)), STEP_TIMEOUT + 15000)),
  ])
}

const out = { ok: true, url: PAGE_URL }

try {
  if (args.list) {
    const r = await runInPage(
      `return { toolCount: tools.length, tools: tools.map(t => ({ name: t.name, description: (t.description || '').slice(0, 120) })) };`,
      {},
    )
    await close()
    done(EXIT.OK, { ok: true, toolCount: r.toolCount, tools: r.tools })
  }

  const seq = args.seq !== undefined ? JSON.parse(String(args.seq)) : null
  if (!Array.isArray(seq) || seq.length === 0) {
    await close()
    done(EXIT.USAGE, { ok: false, error: '--seq 必须是非空工具序列数组，如 [{"name":"login","args":{...}}]' })
  }

  const results = []
  let failed = false
  for (const step of seq) {
    if (!step || typeof step.name !== 'string') {
      results.push({ name: String(step?.name ?? '(invalid)'), error: '步骤缺 name' })
      failed = true
      continue
    }
    const t0 = Date.now()
    try {
      const r = await runInPage(
        `const target = tools.find(t => t.name === payload.name);
         if (!target) return JSON.stringify({ __error: 'tool not found: ' + payload.name });
         try {
           const raw = await api.executeTool(target, JSON.stringify(payload.args ?? {}));
           return JSON.stringify({ __result: JSON.parse(raw) });
         } catch (e) {
           return JSON.stringify({ __error: String(e && e.message || e) });
         }`,
        { name: step.name, args: step.args ?? {} },
      )
      if (r && r.__error) {
        results.push({ name: step.name, ms: Date.now() - t0, error: r.__error })
        failed = true
      } else {
        results.push({ name: step.name, ms: Date.now() - t0, result: r?.__result ?? r })
      }
    } catch (e) {
      results.push({ name: step.name, ms: Date.now() - t0, error: String(e && e.message || e).slice(0, 300) })
      failed = true
    }
  }
  await close()
  done(failed ? EXIT.ASSERT_FAIL : EXIT.OK, { ok: !failed, results })
} catch (err) {
  await close().catch(() => {})
  done(EXIT.HTTP, { ok: false, error: String(err && err.message || err).slice(0, 300) })
}
