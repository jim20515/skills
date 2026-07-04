#!/usr/bin/env node
// 合併 business-flow-test-plan 的測試計畫 JSON 與多份分組執行結果 JSON，
// 展開每條測試的 N 組 variants 成獨立列，供 build_results_workbook.mjs 使用。
//
// Usage:
//   node merge_test_results.mjs --plan business_flow_input.json --results-dir ./results --output final_merged_rows.json
//
// --results-dir 底下所有 *.json 檔都會被當成一份分組結果讀入，每份格式：
//   [
//     {"id": "BF-001", "automated": true, "variants": [{"input","actualOutput","pass","note"}, ...]},
//     {"id": "BF-XXX", "automated": false, "manualReason": "..."}
//   ]
import fs from 'node:fs/promises'
import path from 'node:path'

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--plan') args.plan = argv[++i]
    else if (arg === '--results-dir') args.resultsDir = argv[++i]
    else if (arg === '--output') args.output = argv[++i]
  }
  if (!args.plan || !args.resultsDir || !args.output) {
    throw new Error('Usage: merge_test_results.mjs --plan plan.json --results-dir ./results --output merged.json')
  }
  return args
}

const args = parseArgs(process.argv)
const plan = JSON.parse(await fs.readFile(args.plan, 'utf8'))

const resultMap = new Map()
const files = (await fs.readdir(args.resultsDir)).filter(f => f.endsWith('.json'))
if (!files.length) throw new Error(`No .json files found in ${args.resultsDir}`)
for (const file of files) {
  const arr = JSON.parse(await fs.readFile(path.join(args.resultsDir, file), 'utf8'))
  if (!Array.isArray(arr)) { console.error(`SKIP (not an array): ${file}`); continue }
  for (const r of arr) {
    if (resultMap.has(r.id)) console.error(`DUP RESULT ID ${r.id} (in ${file}, already set by another file)`)
    resultMap.set(r.id, r)
  }
}

console.error('plan rows:', plan.rows.length, '| result entries:', resultMap.size)
for (const row of plan.rows) {
  if (!resultMap.has(row.id)) console.error('MISSING RESULT FOR', row.id)
}

const outRows = []
for (const row of plan.rows) {
  const result = resultMap.get(row.id)
  if (!result || result.automated === false) {
    outRows.push({
      id: row.id,
      section: row.section,
      category: row.category,
      moneyFocus: row.moneyFocus,
      priority: row.priority,
      flow: row.flow,
      input: row.input,
      verify: row.verify,
      expected: row.expected,
      actual: result?.manualReason || '（未執行：無對應結果，請檢查是否有分組漏派）',
      status: '需確認',
      issueLocation: '',
      coverage: '人工 / UI測試',
      notes: [row.notes, result?.manualReason ? `未自動化原因：${result.manualReason}` : ''].filter(Boolean).join('；'),
    })
    continue
  }
  result.variants.forEach((v, i) => {
    const passStatus = v.pass === true ? '通過' : v.pass === false ? '失敗' : '需確認'
    outRows.push({
      id: `${row.id}-${i + 1}`,
      section: row.section,
      category: row.category,
      moneyFocus: row.moneyFocus,
      priority: row.priority,
      flow: row.flow,
      input: typeof v.input === 'string' ? v.input : JSON.stringify(v.input),
      verify: row.verify,
      expected: row.expected,
      actual: typeof v.actualOutput === 'string' ? v.actualOutput : JSON.stringify(v.actualOutput),
      status: passStatus,
      issueLocation: passStatus === '失敗' ? `${row.section} / ${row.category}` : '',
      coverage: 'API',
      notes: [v.note, i === 0 ? row.notes : ''].filter(Boolean).join('；'),
    })
  })
}

const summary = {
  totalMasterTests: plan.rows.length,
  totalExecutedRows: outRows.length,
  automatedTests: plan.rows.filter(r => resultMap.get(r.id)?.automated).length,
  manualTests: plan.rows.filter(r => resultMap.get(r.id)?.automated === false).length,
  passCount: outRows.filter(r => r.status === '通過').length,
  failCount: outRows.filter(r => r.status === '失敗').length,
  needsConfirmCount: outRows.filter(r => r.status === '需確認').length,
}
console.error('SUMMARY', JSON.stringify(summary, null, 2))

await fs.writeFile(args.output, JSON.stringify({ title: plan.title, generatedDate: plan.generatedDate, rows: outRows, summary }, null, 2))
console.error(`wrote ${args.output} with ${outRows.length} rows`)
