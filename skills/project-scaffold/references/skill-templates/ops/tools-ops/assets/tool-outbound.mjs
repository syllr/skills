#!/usr/bin/env node
// tool-outbound.mjs —— outbound 接口型工具 Demo（骨架）
//
// 生成时改三处：① 连接字段/凭据（对齐类文档「环境参数」表，每环境一份外部凭据）；② 接该外部系统的 client / 协议；③ 按接口传参。
// 一个外部系统一个工具。约定见 call-outbound.md；契约见 contract.md。stdout 只输出一行 JSON；退出码从 0 连续、无跳号。

// —— 本类退出码（连续，见 call-outbound.md）——
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

const USAGE = `用法：node <工具>.mjs <接口与入参...> <连接参数...>

  连接参数按类文档「环境参数」表该行拼装（每环境一份外部凭据）；参数一律不给默认值，缺任一必填项即报错。
  写 / 计费 / 幂等敏感调用须先得到用户授权。退出码：0 成功 / 1 参数 / 2 网络 / 3 数据层 / 4 配置`

const {args, positional} = parseArgs(process.argv.slice(2))
if (args.help) process.stdout.write(USAGE + '\n'), process.exit(EXIT.OK)

// ① 连接字段 / 凭据：对齐类文档「环境参数」表（按外部系统改字段名）
const conn = {endpoint: args.endpoint, 'app-key': args['app-key'], 'app-secret': args['app-secret']}
for (const [k, v] of Object.entries(conn)) {
    if (typeof v !== 'string' || v === '') {
        fail(EXIT.USAGE, `缺少连接参数 --${k}（一律不给默认值；取值见类文档「环境参数」）`)
    }
}

// 要调的接口 + 入参（生成时按 client 定义/接口列表定参数形态）
const [iface, ...rest] = positional
if (!iface) fail(EXIT.USAGE, '缺少接口名（见项目 outbound 集成文档 / client 代码）')
const inputs = Object.fromEntries(rest.filter((x) => x.includes('=')).map((x) => x.split('=')))
if (rest.length && !Object.keys(inputs).length) fail(EXIT.USAGE, '入参须为 k=v 形式')

// ② 调外部系统：生成时接该外部系统的 client / 协议
async function invoke(_conn, _iface, _inputs) {
    // const client = makeClient(conn)             // SDK / Adapter / 防腐层
    // return await client[_iface](inputs)
    throw new Error('生成时在此接该外部系统的 client / 协议')
}

invoke(conn, iface, inputs)
    .then((data) => done(EXIT.OK, {ok: true, data}))
    .catch((err) => fail(EXIT.DATA, `外部系统调用失败：${(err && err.message) || err}`))
