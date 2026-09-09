#!/usr/bin/env node
// ragflow.mjs —— RAGFlow 对账工具（入口③的对账对象之一：外部向量服务）
// 零依赖：使用 Node 内置 fetch。查询 RAGFlow API 验证知识库/文档/chunks 落位。
// 用法：
//   node tools/ragflow.mjs datasets                                   # 列出全部知识库（对账库是否存在）
//   node tools/ragflow.mjs docs --name '<库名>'                       # 某知识库的文档列表
//   node tools/ragflow.mjs chunks --name '<库名>' --doc-id <id>       # 某文档的 chunks（对账切片是否入库）
// 环境变量：
//   RAGFLOW_BASE_URL（必填）如 http://192.168.1.225:9380/api/v1
//   RAGFLOW_API_KEY （必填）Bearer key

import { EXIT, done, requireEnv, parseArgs, helpIfRequested } from './_util.mjs'
import { loadDotEnv } from './_util.mjs'

loadDotEnv(import.meta.url)

const USAGE = `用法：
  node tools/ragflow.mjs datasets
  node tools/ragflow.mjs docs --name <知识库名>
  node tools/ragflow.mjs chunks --name <知识库名> --doc-id <文档ID>

环境变量：RAGFLOW_BASE_URL（必填，如 http://192.168.1.225:9380/api/v1）；RAGFLOW_API_KEY（必填）
退出码：0=成功；1=业务失败（库/文档不存在、chunks 为空等对账断言）；2=参数错误；3=网络失败；10=配置错误`

helpIfRequested(process.argv.slice(2), USAGE)

const base = requireEnv('RAGFLOW_BASE_URL', '如 http://192.168.1.225:9380/api/v1')
const key = requireEnv('RAGFLOW_API_KEY', 'RAGFlow 的 API key，见 DEPLOYMENT §6.2')

// 子命令是位置参数（datasets/docs/chunks），先剥离，剩余 -- 选项交给 parseArgs
const argv = process.argv.slice(2)
let sub = null
if (argv.length && !argv[0].startsWith('--')) sub = argv.shift()
const args = parseArgs(argv)

async function ragflow(path, params = {}, method = 'GET') {
  const qs = new URLSearchParams(params).toString()
  const url = `${base}${path}${qs ? `?${qs}` : ''}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)
  try {
    const resp = await fetch(url, {
      method,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timer)
    const text = await resp.text()
    let data = null
    try { data = JSON.parse(text) } catch { data = text }
    if (!resp.ok) {
      done(EXIT.ASSERT_FAIL, { ok: false, status: resp.status, data, error: `RAGFlow HTTP ${resp.status}` })
    }
    return data
  } catch (err) {
    clearTimeout(timer)
    const isAbort = err.name === 'AbortError'
    done(EXIT.HTTP, { ok: false, error: isAbort ? 'RAGFlow 请求超时' : `RAGFlow 网络请求失败：${err.message}` })
  }
}

async function findDatasetId(name) {
  const data = await ragflow('/datasets')
  const list = data?.data || []
  const hit = list.find((d) => d.name === name)
  if (!hit) {
    done(EXIT.ASSERT_FAIL, { ok: false, error: `知识库不存在：${name}`, available: list.map((d) => d.name) })
  }
  return hit.id
}

switch (sub) {
  case 'datasets': {
    const data = await ragflow('/datasets')
    const list = data?.data || []
    done(EXIT.OK, { ok: true, count: list.length, datasets: list.map((d) => ({ id: d.id, name: d.name, doc_count: d.document_count })) })
    break
  }
  case 'docs': {
    const name = args.name
    if (!name) done(EXIT.USAGE, { ok: false, error: 'docs 子命令需要 --name <知识库名>' })
    const dsId = await findDatasetId(name)
    const data = await ragflow(`/datasets/${dsId}/documents`)
    const docs = data?.data || []
    done(EXIT.OK, { ok: true, dataset: name, count: docs.length, documents: docs.map((d) => ({ id: d.id, name: d.name, chunk_count: d.chunk_count })) })
    break
  }
  case 'delete-dataset': {
    const name = args.name
    if (!name) done(EXIT.USAGE, { ok: false, error: 'delete-dataset 子命令需要 --name <知识库名>' })
    const dsId = await findDatasetId(name)
    const data = await ragflow(`/datasets/${dsId}`, {}, 'DELETE')
    done(EXIT.OK, { ok: true, dataset: name, id: dsId, message: '知识库已删除' })
    break
  }
  case 'chunks': {
    const name = args.name
    const docId = args['doc-id']
    if (!name || !docId) done(EXIT.USAGE, { ok: false, error: 'chunks 子命令需要 --name <知识库名> 与 --doc-id <文档ID>' })
    const dsId = await findDatasetId(name)
    const data = await ragflow(`/datasets/${dsId}/documents/${docId}/chunks`)
    const chunks = data?.data?.chunks || data?.chunks || []
    const ok = Array.isArray(chunks) && chunks.length > 0
    done(ok ? EXIT.OK : EXIT.ASSERT_FAIL, { ok, dataset: name, doc_id: docId, chunk_count: chunks.length })
    break
  }
  default:
    done(EXIT.USAGE, { ok: false, error: `未知子命令：${sub || '(空)'}。可用：datasets | docs --name X | chunks --name X --doc-id Y | delete-dataset --name X` })
}
