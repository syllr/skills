// 共享 helpers：JSON 输出 / 参数解析 / --help（退出码由各工具自行定义——各类的码不同、从 0 连续，见 call-*.md）
// 所有 tools 的输出契约：stdout 只输出一行 JSON，退出码表达结果类型（见 docs/tools/tools/<类>/<类>.md）。
// 环境由调用方按 docs/tools/tools/<类>/<类>.md 的「环境参数」表选定，把该行连接参数经命令行传入——工具不读配置文件。

// stdout 输出一行 JSON 后退出
export function done(code, payload) {
    process.stdout.write(JSON.stringify(payload) + '\n')
    process.exit(code)
}

// 简易参数解析：--key value 或 --key=value，返回 { key: value }；无值 flag 返回 true
// 用法：node tools/xxx/xxx.mjs --sql "SELECT 1"
export function parseArgs(argv, usageExit = 2) {
    const out = {}
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (!a.startsWith('--')) {
            done(usageExit, {ok: false, error: `无法识别的参数：${a}（参数需以 -- 开头）`})
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

// 从 --help 触发输出用法并正常退出（成功码 0）
export function helpIfRequested(argv, usage) {
    if (argv.includes('--help') || argv.includes('-h')) {
        process.stdout.write(usage + '\n')
        process.exit(0)
    }
}
