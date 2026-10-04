#!/usr/bin/env node
// webmcp.mjs —— 页面事务执行器（WebMCP 动态调度）
//
// 定位：playwright-core 驱动**本机真实 Chrome**（channel:'chrome'），在页面上下文经 WebMCP（document.modelContext）
// 枚举 / 执行**页面代码预制的子工具**。本工具不内置任何子工具或流程——子工具定义在工程页面代码里（见
// docs/tools/tools/webmcp/webmcp.md 的「子工具」），本工具只做「连页面 → --list 枚举 → --seq 按 {name,args} 通用调用」。
//
// 已实证的 WebMCP 行为（本机 Chrome 153；勿按官方文档猜）：
//   1. 入口是 document.modelContext（navigator.modelContext 可能 undefined，保留 ?? 回退）
//   2. API = getTools() / executeTool(tool, args) / registerTool(...)；无 provideContext / unregisterTool
//   3. executeTool 第二参**必须是 JSON 字符串**（传对象报 Failed to parse input arguments）→ 主路径传
//      JSON.stringify(args)，同时保留「对象形态」回退（见 runInPage 预置的 __exec，兼容未来 Chrome）
//   4. executeTool 第一参必须是 getTools() 返回的工具对象（传名字报 not of type 'RegisteredTool'）
//   5. 无 flag 时 document.modelContext 为 undefined → 启动参数必须含 WebMCP feature flag；但 Chrome 对
//      **未知 feature 名静默忽略**（flag 传了 ≠ 开了）→ 必须以页面内 feature-detect 为准（waitForModelContext）
//   6. getTools() 返回对象的 inputSchema 可能是对象也可能是字符串（构建差异）→ 两态都容忍
//   7. 默认无头；--headed 切有头（音频链路可视化 + 避免无头下音频节流）
//
// 输出契约：stdout 只输出一行 JSON（_util.mjs 的 done()）；人类诊断走 stderr；退出码用 EXIT.*
//
// 读捕获结果前先知道三点（音频类子工具返回的采集数据）：
//   - 捕获的 WAV 是 WebSocket 原始输出，位于应用 speakerGain 之前。用户实际听到的响度约等于该 WAV 乘以 speakerGain
//     （默认 8.0，即 +18.06 dB）。实测：原始 mean -43.8 dB / max -23.3 dB，乘 8 后为 -25.8 / -5.3 dB，与输入基准
//     （-23.2 / -6.1 dB）一致——不要用原始 WAV 的电平直接判定输出过轻。
//   - 采集开头约 2s 为静音，属流式管线固有的 lookback（extra_time_ce=2.5s 加环形缓冲）；firstAudibleMs 反映的正是这一固有延迟，首块静音不是链路故障。
//   - 送音相位不受控：fake 麦克风文件在页面加载时即开始循环播放，而 WS 连接晚于页面加载，故输入与输出的时间轴相位不固定——不能用输入/输出对齐推算端到端时延；需要时延结论时改用带标记音的素材，并在会话开始后再注入。

import {done, parseArgs, helpIfRequested} from '../_util.mjs'

import {mkdirSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'

// 本类退出码（连续，见 call-webmcp.md）
const EXIT = {OK: 0, FAIL: 1, USAGE: 2, PAGE: 3, CONFIG: 4}

const USAGE = `用法：
  node tools/webmcp/webmcp.mjs --list [--host <base>] [--path <页面路径>] [--headed] [--connect <cdpUrl>] --timeout <ms>
  node tools/webmcp/webmcp.mjs --seq '<JSON 数组>' [同上运行开关]

模式（二选一）：
  --list              枚举当前页面注册的 WebMCP 子工具后退出（输出 name / description / inputSchema / annotations；按页面，不跨页）
  --seq '<JSON>'      顺序执行子工具序列（同一页面会话内按数组顺序执行、跨步保态）；每步三选一：
                        {"name":"<子工具名>","args":{...}}   执行子工具（executeTool，业务失败返回 ok:false）
                        {"goto":"/<路径或绝对 URL>"}       导航：等 load + 重探 modelContext + 等下一步工具注册
                        {"wait":<毫秒>}                    仅等待
                      \${i.field} 插值：i = 已完成步骤下标，field = 该步 result 的顶层字段（支持点号路径，如
                      /voice-chat?instanceId=\${1.instanceId}；{goto} 按 URL 组件编码，args 按原值）

参数（一律不给默认值，缺任一必填项即报错，退出码 2）：
  --host <base>       该环境前端的 host（base URL，必填；取值见 docs/tools/tools/webmcp/webmcp.md 的 webmcp 环境参数表）
  --timeout <ms>      单步执行超时（必填）
  --path <路径>       起始页面路径（须以 / 开头；默认 base 根路径）
  --headed            有头模式（默认无头；音频链路可视化 + 避免无头下音频节流）
  --connect <cdpUrl>  连接已运行的 Chrome（如 http://127.0.0.1:9333）；该实例需自行带 WebMCP flag 启动
  --step-delay <ms>   步间停留（默认：有头 1500，无头 0——有头人工旁观时让每步结果可见）
  --help              显示本帮助

退出码：0=成功；1=子工具业务失败（ok:false）；2=参数 / 序列错误；3=浏览器 / 页面失败；4=配置错误`

helpIfRequested(process.argv.slice(2), USAGE)

const args = parseArgs(process.argv.slice(2))

// 前置校验（在启动浏览器前 fail-fast，避免白等几十秒）
if (typeof args.host !== 'string' || !args.host) {
    done(EXIT.USAGE, {
        ok: false,
        error: '缺少 --host <base>（不给默认值）；取值见 docs/tools/tools/webmcp/webmcp.md 的 webmcp 环境参数表'
    })
}
if (args.timeout === undefined) done(EXIT.USAGE, {ok: false, error: '缺少 --timeout <ms>（不给默认值）'})
const STEP_TIMEOUT = Number(args.timeout)
if (!(STEP_TIMEOUT > 0)) done(EXIT.USAGE, {ok: false, error: `--timeout 必须是正数毫秒：${String(args.timeout)}`})
if (!args.list && args.seq === undefined) done(EXIT.USAGE, {
    ok: false,
    error: '需要 --list / --seq 之一（--help 看用法）'
})

// --seq 早校验（启动浏览器前 fail-fast）
let SEQ = null
if (args.seq !== undefined) {
    try {
        SEQ = JSON.parse(String(args.seq))
    } catch (err) {
        done(EXIT.USAGE, {ok: false, error: `--seq 不是合法 JSON：${String((err && err.message) || err).slice(0, 160)}`})
    }
    if (!Array.isArray(SEQ) || SEQ.length === 0) {
        done(EXIT.USAGE, {
            ok: false,
            error: '--seq 必须是非空子工具序列数组，如 [{"name":"consume_grant_code","args":{...}}]'
        })
    }
}

const BASE_URL = String(args.host).replace(/\/+$/, '')
try {
    new URL(BASE_URL)
} catch {
    done(EXIT.USAGE, {ok: false, error: `--host 不是合法 URL：${BASE_URL}`})
}
const PAGE_URL = (() => {
    if (typeof args.path !== 'string') return BASE_URL
    if (!args.path.startsWith('/')) done(EXIT.USAGE, {
        ok: false,
        error: '--path 必须以 / 开头（页面路径，如 /voice-chat）'
    })
    return BASE_URL + args.path
})()

const HEADED = Boolean(args.headed) // 默认无头；--headed 切有头（音频链路建议可视化）
const STEP_DELAY = args['step-delay'] !== undefined ? Number(args['step-delay']) : (HEADED ? 1500 : 0)
if (!(STEP_DELAY >= 0)) done(EXIT.USAGE, {ok: false, error: `--step-delay 必须 >= 0：${String(args['step-delay'])}`})

// profile 按目标隔离（避免跨目标登录态串用），落在本工具目录：.webmcp-profile-<host>
const PROFILE_DIR = join(dirname(fileURLToPath(import.meta.url)), `.webmcp-profile-${new URL(BASE_URL).host.replace(/:/g, '_')}`)

const require = createRequire(import.meta.url)
let chromium
try {
    ;({chromium} = require('playwright-core'))
} catch {
    done(EXIT.CONFIG, {ok: false, error: 'playwright-core 未安装（cd docs/tools && npm install）'})
}

// 启动参数：WebMCP feature + 无手势音频 + SecureContext 放宽
function buildLaunchArgs(pageUrl) {
    const launchArgs = [
        // 三个 feature 名并列：WebMCPTesting 是 Chrome 149–152 的旧名，WebMCP 是新名；
        // Chrome 对未知 feature 名静默忽略（传了 ≠ 开了），实际生效与否由页面内 feature-detect 判定
        '--enable-features=WebMCP,WebMCPTesting,DevToolsWebMCPSupport',
        '--no-first-run',
        // AudioContext 无用户手势也能起（页面自动连 WS / 播放必需）
        '--autoplay-policy=no-user-gesture-required',
    ]
    // 非 localhost 的 http(s) 目标：放宽 SecureContext，否则 modelContext 不暴露（file:// 本身可信，跳过）
    try {
        const u = new URL(pageUrl)
        if (u.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(u.hostname)) {
            launchArgs.push(`--unsafely-treat-insecure-origin-as-secure=${u.origin}`)
        }
    } catch {
        done(EXIT.USAGE, {ok: false, error: `--host 不是合法 URL：${pageUrl}`})
    }
    return launchArgs
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 脱敏：默认保留前 6 位 + 后 4 位（过短则整体打码，绝不输出完整凭据）
function maskSecret(v, head = 6, tail = 4) {
    const s = String(v ?? '')
    if (!s) return ''
    if (s.length <= head + tail) return '*'.repeat(Math.min(s.length, 8)) || '***'
    return `${s.slice(0, head)}…${s.slice(-tail)}`
}

// URL 脱敏：grantCode / sessionToken / token 查询参数值替换为脱敏值
// （Playwright 错误消息里会带完整 URL —— 必须对字符串通用脱敏，避免凭据进入证据 JSON）
const SENSITIVE_QS = /([?&](?:grantCode|sessionToken|token)=)([^&#]*)/gi

function maskUrlSecrets(s) {
    return String(s).replace(SENSITIVE_QS, (_m, prefix, val) => {
        let raw = val
        try {
            raw = decodeURIComponent(val)
        } catch {
            /* 非法编码：保留原值脱敏 */
        }
        return prefix + maskSecret(raw)
    })
}

// 相对路径 → 绝对 URL（{goto} 的 /xxx 按 --host 解析；已是绝对 URL 则原样返回）
function toAbsoluteUrl(target, base) {
    const s = String(target)
    try {
        new URL(s)
        return s
    } catch {
        return base + (s.startsWith('/') ? s : `/${s}`)
    }
}

const B64_KEY_RE = /base64/i
// 敏感字段名（结果里出现即脱敏；${i.field} 插值走未脱敏的 raw，不受影响）
const SENSITIVE_KEY_RE = /^(grantCode|sessionToken|accessToken|refreshToken|token)$/i
const MAX_STR = 4000

// 证据脱敏：base64 字段只留长度（否则 stdout 单行 JSON 被 600KB 音频撑爆）；敏感字段值脱敏；超长字符串截断
function sanitize(v, depth = 0) {
    if (v == null) return v
    if (typeof v === 'string') {
        const masked = maskUrlSecrets(v)
        return masked.length > MAX_STR ? `${masked.slice(0, MAX_STR)}…（截断，共 ${masked.length} 字符）` : masked
    }
    if (typeof v !== 'object') return v
    if (depth > 6) return '(嵌套过深，已省略)'
    if (Array.isArray(v)) return v.map((x) => sanitize(x, depth + 1))
    const outObj = {}
    for (const [k, val] of Object.entries(v)) {
        if (typeof val === 'string' && B64_KEY_RE.test(k)) outObj[k] = `(base64 ${val.length} 字符，已省略)`
        else if (typeof val === 'string' && SENSITIVE_KEY_RE.test(k)) outObj[k] = maskSecret(val)
        else outObj[k] = sanitize(val, depth + 1)
    }
    return outObj
}

// ${i.field} 插值：i = 已完成步骤下标，field = 该步 result 顶层字段（支持点号路径）
class RefError extends Error {
    constructor(message, kind) {
        super(message)
        this.kind = kind // 'usage'=序列书参数错 / 'assert'=上游步骤无结果（失败归因给上游）
    }
}

const TEMPLATE_RE = /\$\{(\d+)\.([A-Za-z0-9_.]+)\}/g

function resolveTemplate(str, rawResults, urlEncode = true) {
    return String(str).replace(TEMPLATE_RE, (_m, iRaw, path) => {
        const i = Number(iRaw)
        const base = rawResults[i]
        if (base == null) throw new RefError(`模板引用了无结果的步骤 ${i}（\${${i}.${path}}）——该步未成功`, 'assert')
        let val = base
        for (const key of path.split('.')) {
            if (val == null) break
            val = val[key]
        }
        if (val == null || val === '') throw new RefError(`模板字段不存在或为空：\${${i}.${path}}`, 'usage')
        return urlEncode ? encodeURIComponent(String(val)) : String(val)
    })
}

// 子工具 args 的插值：递归字符串，按原值传入（不 URL 编码）
function interpolateArgs(v, rawResults) {
    if (typeof v === 'string') return resolveTemplate(v, rawResults, false)
    if (Array.isArray(v)) return v.map((x) => interpolateArgs(x, rawResults))
    if (v && typeof v === 'object') {
        const o = {}
        for (const [k, val] of Object.entries(v)) o[k] = interpolateArgs(val, rawResults)
        return o
    }
    return v
}

function parseLoose(v) {
    if (v == null) return null
    if (typeof v !== 'string') return v
    try {
        return JSON.parse(v)
    } catch {
        return v
    }
}

// ---------- 浏览器启动 / 连接 ----------
let driver // { page, close(): Promise<void> }
try {
    if (args.connect) {
        const browser = await chromium.connectOverCDP(String(args.connect))
        const context = browser.contexts()[0] || (await browser.newContext())
        const page = await context.newPage()
        driver = {page, close: () => browser.close()} // connectOverCDP 的 close 只断开连接，不关浏览器
    } else {
        mkdirSync(PROFILE_DIR, {recursive: true})
        const context = await chromium.launchPersistentContext(PROFILE_DIR, {
            channel: 'chrome', // 必须真实 Chrome（Playwright 自带 Chromium 无 WebMCP）
            headless: !HEADED,
            timeout: 30000,
            args: buildLaunchArgs(PAGE_URL),
        })
        const page = context.pages()[0] || (await context.newPage())
        driver = {page, close: () => context.close()}
    }
} catch (err) {
    done(EXIT.PAGE, {
        ok: false,
        error: sanitize(`浏览器启动/连接失败：${String((err && err.message) || err)}`).slice(0, 300)
    })
}

const {page, close} = driver

// ---------- 页面内基础设施（就绪探测 / 工具枚举 / 执行） ----------

// 轮询等待 document.modelContext 可用（Chrome 对未知 feature 静默忽略 → 必须页面内 feature-detect）
async function waitForModelContext(timeoutMs) {
    const deadline = Date.now() + timeoutMs
    for (; ;) {
        const ready = await page
            .evaluate(`(() => {
        const api = document.modelContext ?? navigator.modelContext;
        return typeof api?.getTools === 'function';
      })()`)
            .catch(() => false)
        if (ready) return true
        if (Date.now() >= deadline) return false
        await sleep(250)
    }
}

async function listToolNames() {
    const names = await page
        .evaluate(`(async () => {
      const api = document.modelContext ?? navigator.modelContext;
      if (typeof api?.getTools !== 'function') return [];
      try {
        const raw = await api.getTools();
        const tools = Array.isArray(raw) ? raw : ((raw && raw.tools) || []);
        return tools.map((t) => t && t.name).filter(Boolean);
      } catch { return []; }
    })()`)
        .catch(() => [])
    return Array.isArray(names) ? names : []
}

// 轮询等待目标工具注册（goto 后 SPA 异步注册；超时由调用方判定）
async function waitForTool(name, timeoutMs) {
    const deadline = Date.now() + timeoutMs
    for (; ;) {
        const found = await page
            .evaluate(`(async (name) => {
        const api = document.modelContext ?? navigator.modelContext;
        if (typeof api?.getTools !== 'function') return false;
        try {
          const raw = await api.getTools();
          const tools = Array.isArray(raw) ? raw : ((raw && raw.tools) || []);
          return tools.some((t) => t && t.name === name);
        } catch { return false; }
      })(${JSON.stringify(name)})`)
            .catch(() => false)
        if (found) return true
        if (Date.now() >= deadline) return false
        await sleep(250)
    }
}

// 页面上下文执行体：枚举工具 + 执行（executeTool 主路径 JSON 字符串；对象形态回退兼容未来 Chrome）
async function runInPage(body, payload) {
    const expr = `(async (payload) => {
    const api = document.modelContext ?? navigator.modelContext;
    if (!api || typeof api.getTools !== 'function') {
      return JSON.stringify({ __error: 'modelContext 暂不可用（页面导航中？）' });
    }
    const __raw = await api.getTools();
    const tools = Array.isArray(__raw) ? __raw : ((__raw && __raw.tools) || []);
    const __parseLoose = (v) => {
      if (v == null) return null;
      if (typeof v !== 'string') return v;
      try { return JSON.parse(v); } catch { return v; }
    };
    // executeTool 第二参：主路径 JSON 字符串；若抛「parse input arguments」类错误则回退对象形态（兼容未来 Chrome）
    const __exec = async (target, argsObj) => {
      const json = JSON.stringify(argsObj ?? {});
      try {
        return await api.executeTool(target, json);
      } catch (e1) {
        const m1 = String((e1 && e1.message) || e1);
        if (/parse input arguments/i.test(m1)) {
          try { return await api.executeTool(target, argsObj ?? {}); }
          catch (e2) { throw new Error(m1 + ' / 对象回退亦失败：' + String((e2 && e2.message) || e2)); }
        }
        throw e1;
      }
    };
    ${body}
  })(${JSON.stringify(payload)})`
    return Promise.race([
        page.evaluate(expr).then((r) => parseLoose(r)),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`页面执行超时（${STEP_TIMEOUT}ms）`)), STEP_TIMEOUT + 15000)),
    ])
}

const LIST_BODY = `
  return JSON.stringify({
    toolCount: tools.length,
    tools: tools.map((t) => {
      let schema = t && t.inputSchema;
      if (typeof schema === 'string') { try { schema = JSON.parse(schema); } catch { /* 保留原字符串 */ } }
      return { name: (t && t.name) ?? null, description: String((t && t.description) || ''), inputSchema: schema ?? null, annotations: (t && t.annotations) ?? null };
    }),
  });
`

const EXEC_TOOL_BODY = `
  const target = tools.find((t) => t && t.name === payload.name);
  if (!target) {
    return JSON.stringify({ __error: '子工具不存在：' + payload.name + '（当前页面可用：' + (tools.map((t) => t && t.name).filter(Boolean).join(', ') || '无') + '）' });
  }
  try {
    const raw = await __exec(target, payload.args ?? {});
    return JSON.stringify({ __result: __parseLoose(raw) });
  } catch (e) {
    return JSON.stringify({ __error: String((e && e.message) || e).slice(0, 300) });
  }
`

// 导航（等 load → 重探 modelContext → 等下一步工具注册）
async function gotoAndWait(targetUrl, expectTool, timeoutMs) {
    try {
        await page.goto(targetUrl, {waitUntil: 'load', timeout: 30000})
    } catch (err) {
        return {ok: false, kind: 'page', error: `页面加载失败：${String((err && err.message) || err).slice(0, 200)}`}
    }
    if (!(await waitForModelContext(10000))) {
        const names = await listToolNames()
        return {
            ok: false,
            kind: 'config',
            error: 'modelContext 不可用（WebMCP flag 未生效或页面未注册工具）——确认本机真实 Chrome 149+（channel:chrome）'
                + `且启动参数含 --enable-features=WebMCP,WebMCPTesting,DevToolsWebMCPSupport；当前页工具：${names.join(', ') || '无'}`,
        }
    }
    if (expectTool && !(await waitForTool(expectTool, timeoutMs))) {
        const names = await listToolNames()
        return {
            ok: false,
            kind: 'page',
            error: `子工具 ${expectTool} 未在 ${timeoutMs}ms 内注册（当前页面可用：${names.join(', ') || '无'}）`
        }
    }
    return {ok: true}
}

// 子工具调用：归一三种结果 —— __nav（导航销毁上下文/空返回）/ __error / __result
const NAV_ERR_RE = /Execution context was destroyed|Cannot find context with specified id|frame was detached/i

async function callTool(name, argsObj) {
    try {
        const r = await runInPage(EXEC_TOOL_BODY, {name, args: argsObj})
        if (r == null) return {__nav: true, __note: 'evaluate 返回空（子工具可能触发了页面导航，无返回值）'}
        if (typeof r !== 'object') return {__error: `页面返回意外类型：${String(r).slice(0, 120)}`, __kind: 'page'}
        return r
    } catch (err) {
        const msg = String((err && err.message) || err)
        if (NAV_ERR_RE.test(msg)) return {__nav: true, __note: `页面导航导致执行上下文销毁（${msg.slice(0, 120)}）`}
        return {__error: msg.slice(0, 300), __kind: 'page'}
    }
}

function nextToolName(step) {
    return step && typeof step.name === 'string' ? step.name : null
}

// 步骤执行器：逐条执行并返回「输出记录 + 原始结果」双轨（输出脱敏、原始供插值）
async function runSteps(steps) {
    const records = [] // 输出用（已脱敏/截断）
    const raw = [] // 内部用（原始 result，供 ${i.field} 插值）
    let assertFailed = false // 子工具业务失败（ok:false / 工具抛错）
    let usageFailed = false // 序列书参数错误（非法步骤 / 插值字段缺失）
    let pageFailed = false // 浏览器/页面失败（导航失败 / modelContext 不可用）
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        if (i > 0 && STEP_DELAY > 0) await sleep(STEP_DELAY)
        if (!step || typeof step !== 'object') {
            records.push({step: String(step), error: '步骤必须是对象'})
            raw.push(null)
            usageFailed = true
            continue
        }

        // ① 导航步骤
        if (typeof step.goto === 'string') {
            const t0 = Date.now()
            let target
            try {
                // 先按 ${i.field} 插值，再把相对路径解析成绝对 URL（/voice-chat?... → <--host>/voice-chat?...）
                target = toAbsoluteUrl(resolveTemplate(step.goto, raw), BASE_URL)
            } catch (err) {
                const kind = err instanceof RefError ? err.kind : 'usage'
                records.push({
                    goto: sanitize(step.goto),
                    ms: Date.now() - t0,
                    error: sanitize(String((err && err.message) || err))
                })
                raw.push(null)
                if (kind === 'assert') assertFailed = true
                else usageFailed = true
                continue
            }
            const expectTool = typeof step.expect === 'string' ? step.expect : nextToolName(steps[i + 1])
            const r = await gotoAndWait(target, expectTool, STEP_TIMEOUT)
            records.push(
                r.ok
                    ? {goto: sanitize(target), ms: Date.now() - t0, result: {ok: true, expectTool: expectTool ?? null}}
                    : {goto: sanitize(target), ms: Date.now() - t0, error: sanitize(r.error)},
            )
            raw.push(r.ok ? {ok: true} : null)
            if (!r.ok) pageFailed = true
            continue
        }

        // ② 等待步骤（长流程编排）
        if (typeof step.wait === 'number') {
            const t0 = Date.now()
            await sleep(step.wait)
            records.push({wait: step.wait, ms: Date.now() - t0, result: {ok: true}})
            raw.push({ok: true})
            continue
        }

        // ③ 子工具步骤
        if (typeof step.name === 'string') {
            const t0 = Date.now()
            let argsObj
            try {
                argsObj = interpolateArgs(step.args ?? {}, raw)
            } catch (err) {
                const kind = err instanceof RefError ? err.kind : 'usage'
                records.push({
                    name: step.name,
                    ms: Date.now() - t0,
                    error: sanitize(String((err && err.message) || err))
                })
                raw.push(null)
                if (kind === 'assert') assertFailed = true
                else usageFailed = true
                continue
            }
            const r = await callTool(step.name, argsObj)
            const ms = Date.now() - t0
            if (r.__nav) {
                records.push({name: step.name, ms, args: sanitize(argsObj), result: null, note: sanitize(r.__note)})
                raw.push(null)
            } else if (r.__error) {
                records.push({name: step.name, ms, args: sanitize(argsObj), error: sanitize(r.__error)})
                raw.push(null)
                if (r.__kind === 'page') pageFailed = true
                else assertFailed = true
            } else {
                const res = r.__result ?? null
                records.push({name: step.name, ms, args: sanitize(argsObj), result: sanitize(res)})
                raw.push(res)
                if (res && typeof res === 'object' && res.ok === false) assertFailed = true
            }
            continue
        }

        // ④ 非法步骤
        records.push({
            step: sanitize(JSON.stringify(step).slice(0, 120)),
            error: '无法识别的步骤：需要 {name,args} / {goto} / {wait}'
        })
        raw.push(null)
        usageFailed = true
    }
    return {records, raw, assertFailed, usageFailed, pageFailed}
}

// ---------- 初始页面加载 + 就绪探测 ----------
const initial = await gotoAndWait(PAGE_URL, null, STEP_TIMEOUT)
if (!initial.ok) {
    await close().catch(() => {
    })
    done(initial.kind === 'config' ? EXIT.CONFIG : EXIT.PAGE, {ok: false, error: sanitize(initial.error)})
}

process.stderr.write(`[webmcp] 模式=${args.list ? 'list' : 'seq'} url=${PAGE_URL} 有头=${HEADED} 步间=${STEP_DELAY}ms 超时=${STEP_TIMEOUT}ms\n`)

// ---------- 主流程 ----------
try {
    // ① --list：只枚举子工具后退出
    if (args.list) {
        const r = await runInPage(LIST_BODY, {})
        await close()
        done(EXIT.OK, {ok: true, url: PAGE_URL, toolCount: r?.toolCount ?? 0, tools: r?.tools ?? []})
    }

    // ② --seq：通用子工具序列（已在启动前校验）
    const seq = SEQ
    // 首步是子工具时先等它注册（避免竞态）；等不到也继续，步骤执行器会给出「子工具不存在 + 可用清单」
    if (nextToolName(seq[0])) await waitForTool(seq[0].name, Math.min(STEP_TIMEOUT, 10000))

    const {records, assertFailed, usageFailed, pageFailed} = await runSteps(seq)
    let code = EXIT.OK
    if (usageFailed) code = EXIT.USAGE
    else if (pageFailed) code = EXIT.PAGE
    else if (assertFailed) code = EXIT.FAIL
    await close().catch(() => {
    })
    done(code, {ok: code === EXIT.OK, url: PAGE_URL, results: records})
} catch (err) {
    await close().catch(() => {
    })
    done(EXIT.PAGE, {ok: false, error: sanitize(String((err && err.message) || err)).slice(0, 300)})
}
