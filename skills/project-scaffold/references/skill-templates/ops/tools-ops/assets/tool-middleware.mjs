#!/usr/bin/env node
// tool-middleware.mjs —— 数据 / 中间件直连型工具 Demo（骨架）
//
// 生成时改三处：① 连接字段（对齐类文档「环境参数」表）；② isReadOnly 放行的命令前缀；③ run() 里接该中间件客户端。
// 约定见 call-middleware.md；契约见 contract.md。stdout 只输出一行 JSON；退出码从 0 连续、无跳号。

// —— 本类退出码（连续，见 call-middleware.md）——
const EXIT = {OK: 0, REJECTED: 1, USAGE: 2, NET: 3, DATA: 4, CONFIG: 5}

function done(code, payload) {
    process.stdout.write(JSON.stringify(payload) + '\n')
    process.exit(code)
}

const fail = (code, error) => done(code, {ok: false, error})

// 简易参数解析：--key value / --key=value / 裸开关（如 --write）/ 位置参数
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
        if (key === 'write') {
            args.write = true
            continue // 裸开关：不吃下一个值
        }
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

const USAGE = `用法：node <工具>.mjs "<命令 / 查询>" <连接参数...> [--write]

  位置参数 = 该中间件的命令 / 查询；连接参数按类文档「环境参数」表该行拼装（示例：--host --port --user --pass --name）。
  默认只读，写加 --write（本类唯一带写开关）；参数一律不给默认值，缺任一必填项即报错。
  退出码：0 成功 / 1 操作被拒 / 2 参数 / 3 网络 / 4 数据层 / 5 配置`

const {args, positional} = parseArgs(process.argv.slice(2))
if (args.help) process.stdout.write(USAGE + '\n'), process.exit(EXIT.OK)

// ① 连接字段：对齐类文档「环境参数」表（按中间件改字段名）
const conn = {
    host: args.host,
    port: args.port,
    user: args.user,
    pass: args.pass,
    name: args.name,
}
for (const [k, v] of Object.entries(conn)) {
    if (typeof v !== 'string' || v === '') {
        fail(EXIT.USAGE, `缺少连接参数 --${k}（一律不给默认值；取值见类文档「环境参数」）`)
    }
}

const command = positional.join(' ')
if (!command) fail(EXIT.USAGE, '缺少位置参数：该中间件的命令 / 查询')

// ② 只读默认、写加 --write（本类唯一带写开关）
const allowWrite = args.write === true
if (!allowWrite && !isReadOnly(command)) {
    fail(EXIT.REJECTED, `非只读命令被拒（未加 --write）：${command.slice(0, 60)}`)
}

function isReadOnly(cmd) {
    // 生成时按该中间件替换：DB=SELECT/…；Redis=GET/KEYS/…；ES=_search；…
    return /^(SELECT|SHOW|DESCRIBE|EXPLAIN|WITH|GET|KEYS|EXISTS|SCAN)\b/i.test(cmd.trim())
}

// ③ 执行：生成时在此接该中间件的客户端 / 协议
async function run(_conn, _command, _allowWrite) {
    throw new Error('生成时在此接该中间件的客户端 / 协议（只读命令、写命令分开处理）')
}

run(conn, command, allowWrite)
    .then((data) => done(EXIT.OK, {ok: true, data}))
    .catch((err) => fail(EXIT.DATA, `执行失败：${(err && err.message) || err}`))
