#!/usr/bin/env node
// tool-inbound.mjs —— inbound 接口型工具 Demo（骨架）
//
// 生成时改三处：① 连接字段/鉴权（对齐类文档「环境参数」表）；② CONTRACT 里填该应用被覆盖的接口与入参键；③ callApi() 里接请求层。
// 约定见 call-inbound.md；契约见 contract.md。stdout 只输出一行 JSON；退出码从 0 连续、无跳号。

// —— 本类退出码（连续，见 call-inbound.md）——
const EXIT = {OK: 0, USAGE: 1, NET: 2, DATA: 3, CONFIG: 4}

function done(code, payload) {
    process.stdout.write(JSON.stringify(payload) + '\n')
    process.exit(code)
}

const fail = (code, error) => done(code, {ok: false, error})

function parseArgs(argv) {
    const args = {}
    const positional = []
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (a === '--') {
            positional.push(...argv.slice(i + 1))
            break
        }
        if (!a.startsWith('--')) {
            positional.push(a)
            continue
        }
        const eq = a.indexOf('=')
        if (eq !== -1) {
            args[a.slice(2, eq)] = a.slice(eq + 1)
            continue
        }
        const key = a.slice(2)
        const next = argv[i + 1]
        if (next !== undefined && !next.startsWith('--')) {
            args[key] = next
            i += 1
        } else {
            args[key] = true
        }
    }
    return {args, positional}
}

const USAGE = `用法：node api.mjs --operation <operationId> [--path k=v] [--query k=v] [--header k=v] [--body '<json>' | --form k=v] <连接参数...>

  连接参数按类文档「环境参数」表该行拼装；参数一律不给默认值，缺任一必填项即报错。
  退出码：0 成功 / 1 参数·契约 / 2 网络 / 3 数据层 / 4 配置`

const {args} = parseArgs(process.argv.slice(2))
if (args.help) process.stdout.write(USAGE + '\n'), process.exit(EXIT.OK)

// ① 连接字段 / 鉴权：对齐类文档「环境参数」表（按项目改字段名）
const conn = {'base-url': args['base-url'], token: args.token}
for (const [k, v] of Object.entries(conn)) {
    if (typeof v !== 'string' || v === '') {
        fail(EXIT.USAGE, `缺少连接参数 --${k}（一律不给默认值；取值见类文档「环境参数」）`)
    }
}

// ② 契约表：生成时填该应用被覆盖的接口（operationId → { method, path, 入参键 }），来源 docs/contracts/inbound/
const CONTRACT = {
    // '<operationId>': { method: 'GET', path: '/x', params: ['id', 'page'] },
}

const operationId = args.operation
if (typeof operationId !== 'string' || operationId === '') fail(EXIT.USAGE, '缺少 --operation <operationId>')

// fail-fast 契约校验：operation 必须在契约表；入参键必须在声明内，否则列可用键
const op = CONTRACT[operationId]
if (!op) {
    fail(EXIT.USAGE, `未知 operationId：${operationId}（可用：${Object.keys(CONTRACT).join(', ') || '（契约表为空，生成时填）'}）`)
}
const kv = (s) => Object.fromEntries(String(s || '').split(/\s+/).filter(Boolean).map((x) => x.split('=')))
const inputs = {...kv(args.path), ...kv(args.query), ...kv(args.header), ...kv(args.form)}
if (args.body !== undefined) inputs.body = '<body>'
const unknown = Object.keys(inputs).filter((k) => !op.params.includes(k))
if (unknown.length) fail(EXIT.USAGE, `入参键不在契约声明内：${unknown.join(', ')}（可用：${op.params.join(', ') || '（无）'}）`)

// ③ 调接口：生成时接项目请求层（此处示意用 fetch；鉴权、baseURL、重试按项目填）
async function callApi(_conn, _op, _inputs) {
    // const res = await fetch(new URL(op.path, conn['base-url']), { method: op.method, headers: {...}, body })
    // if (!res.ok) throw new Error(`HTTP ${res.status}`)
    // return await res.json()
    throw new Error('生成时在此接项目请求层（鉴权 / baseURL / 错误处理）')
}

callApi(conn, op, inputs)
    .then((data) => done(EXIT.OK, {ok: true, data}))
    .catch((err) => fail(EXIT.DATA, `接口调用失败：${(err && err.message) || err}`))
