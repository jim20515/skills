#!/usr/bin/env node
// 產生「業務流程測試 — 實測結果」Excel，欄位/樣式規範沿用 business-flow-test-plan skill，
// 額外多一張「重大發現與建議」工作表。
//
// 注意：原 business-flow-test-plan skill 用的 @oai/artifact-tool 套件只存在於
// ChatGPT/OpenAI Apps SDK 環境，在 Claude Code CLI 裡沒有，改用一般常見的 exceljs 套件
// （多數 Node 專案的 node_modules 裡已有，或 `npm install exceljs` 到 scratch 目錄即可）。
//
// Usage:
//   node build_results_workbook.mjs --input merged_rows.json --findings findings.json --output result.xlsx
import fs from 'node:fs/promises'
import ExcelJS from 'exceljs'

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--input') args.input = argv[++i]
    else if (arg === '--findings') args.findings = argv[++i]
    else if (arg === '--output') args.output = argv[++i]
  }
  if (!args.input || !args.output) throw new Error('Usage: --input merged.json --output result.xlsx [--findings findings.json]')
  return args
}

const HEADERS = [
  '編號', '大項', '分類', '金額重點', '優先級',
  '測試流程', '輸入資料 / 操作', '驗證位置', '期望呈現',
  '結果呈現', '是否通過', '問題位置', '建議覆蓋方式', '備註',
]

function normalizeStatus(value) {
  const text = String(value || '待測').trim()
  if (['通過', '失敗', '待測', '需確認'].includes(text)) return text
  return '待測'
}

function normalizeRow(row, index) {
  const moneyFocus = row.moneyFocus === true || row.moneyFocus === '是'
  return {
    id: row.id || `BF-${String(index + 1).padStart(3, '0')}`,
    section: row.section || '未分類',
    category: row.category || '未分類',
    moneyFocus: moneyFocus ? '是' : '否',
    priority: row.priority || (moneyFocus ? 'P0 金額' : 'P1'),
    flow: row.flow || '',
    input: row.input || '',
    verify: row.verify || '',
    expected: row.expected || '',
    actual: row.actual || '待測',
    status: normalizeStatus(row.status),
    issueLocation: row.issueLocation || '',
    coverage: row.coverage || '',
    notes: row.notes || '',
  }
}

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE9F9' } }
const HEADER_FONT = { bold: true, color: { argb: 'FF1B3A66' } }
const ROW_FILL_ALT = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F7FD' } }
const STATUS_STYLE = {
  '通過':   { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }, font: { bold: true, color: { argb: 'FF1E6B2E' } } },
  '失敗':   { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0392B' } }, font: { bold: true, color: { argb: 'FFFFFFFF' } } },
  '需確認': { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }, font: { bold: true, color: { argb: 'FF8A6D3B' } } },
  '待測':   { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE9F9' } }, font: { bold: true, color: { argb: 'FF1B3A66' } } },
}
const MONEY_STYLE = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }, font: { bold: true, color: { argb: 'FF8A6D3B' } } }
const SEVERITY_STYLE = {
  '🔴 嚴重': { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0392B' } }, font: { bold: true, color: { argb: 'FFFFFFFF' } } },
  '🟠 中等': { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }, font: { bold: true, color: { argb: 'FF8A6D3B' } } },
  '🟡 低':   { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE9F9' } }, font: { bold: true, color: { argb: 'FF1B3A66' } } },
}

const args = parseArgs(process.argv)
const payload = JSON.parse(await fs.readFile(args.input, 'utf8'))
const rawRows = Array.isArray(payload) ? payload : payload.rows
if (!Array.isArray(rawRows) || rawRows.length === 0) throw new Error('Input JSON must contain a non-empty rows array')
const rows = rawRows.map(normalizeRow)
const findings = args.findings ? JSON.parse(await fs.readFile(args.findings, 'utf8')) : []

const wb = new ExcelJS.Workbook()
wb.creator = 'Claude Code'
wb.created = new Date(payload.generatedDate || Date.now())

// ── 摘要 ──
const summary = wb.addWorksheet('摘要')
summary.columns = [{ width: 24 }, { width: 16 }]
summary.addRow([payload.title || '業務流程測試 — 實測結果']).font = { bold: true, size: 16 }
summary.mergeCells('A1:B1')
summary.addRow([`產生日期：${payload.generatedDate || ''}`])
summary.addRow(['執行方式：真實呼叫目標系統（非人工模擬 / 非假造）'])
summary.addRow([])

const s = payload.summary || {}
summary.addRow(['業務流程項目總數', s.totalMasterTests ?? '']).font = { bold: true }
summary.addRow(['已自動化執行項目', s.automatedTests ?? ''])
summary.addRow(['僅能人工/瀏覽器驗證項目', s.manualTests ?? ''])
summary.addRow(['實際執行資料筆數（含每項多組情境）', s.totalExecutedRows ?? rows.length])
summary.addRow(['通過', s.passCount ?? ''])
summary.addRow(['失敗', s.failCount ?? ''])
summary.addRow(['需確認', s.needsConfirmCount ?? ''])
summary.addRow([])

const bySection = new Map()
const byStatus = new Map()
for (const r of rows) {
  bySection.set(r.section, (bySection.get(r.section) || 0) + 1)
  byStatus.set(r.status, (byStatus.get(r.status) || 0) + 1)
}
const addBlock = (title, map) => {
  const headerRow = summary.addRow([title]); headerRow.font = { bold: true, size: 12 }
  for (const [k, v] of map) summary.addRow([k, v])
  summary.addRow([])
}
addBlock('依大項（資料筆數）', bySection)
addBlock('依是否通過（資料筆數）', byStatus)

if (findings.length) {
  const fh = summary.addRow(['⚠️ 重大發現摘要（詳見「重大發現與建議」工作表）'])
  fh.font = { bold: true, size: 12, color: { argb: 'FFC0392B' } }
  findings.forEach((f, i) => summary.addRow([`${i + 1}. [${f.severity}] ${f.title}`]))
}

// ── 完整測試清單 ──
const sheet = wb.addWorksheet('完整測試清單', { views: [{ state: 'frozen', ySplit: 1 }] })
sheet.columns = [
  { header: HEADERS[0], key: 'id', width: 12 },
  { header: HEADERS[1], key: 'section', width: 16 },
  { header: HEADERS[2], key: 'category', width: 18 },
  { header: HEADERS[3], key: 'moneyFocus', width: 10 },
  { header: HEADERS[4], key: 'priority', width: 12 },
  { header: HEADERS[5], key: 'flow', width: 40 },
  { header: HEADERS[6], key: 'input', width: 46 },
  { header: HEADERS[7], key: 'verify', width: 28 },
  { header: HEADERS[8], key: 'expected', width: 38 },
  { header: HEADERS[9], key: 'actual', width: 46 },
  { header: HEADERS[10], key: 'status', width: 10 },
  { header: HEADERS[11], key: 'issueLocation', width: 18 },
  { header: HEADERS[12], key: 'coverage', width: 10 },
  { header: HEADERS[13], key: 'notes', width: 40 },
]
const headerRow = sheet.getRow(1)
headerRow.eachCell((cell) => {
  cell.fill = HEADER_FILL; cell.font = HEADER_FONT
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
})
headerRow.height = 22

rows.forEach((r, i) => {
  const row = sheet.addRow(r)
  const isAlt = i % 2 === 1
  row.eachCell((cell, colNumber) => {
    cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
    if (isAlt) cell.fill = ROW_FILL_ALT
    const header = HEADERS[colNumber - 1]
    if (header === '是否通過') {
      const style = STATUS_STYLE[r.status] || STATUS_STYLE['待測']
      cell.fill = style.fill; cell.font = style.font
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    }
    if (header === '金額重點' && r.moneyFocus === '是') {
      cell.fill = MONEY_STYLE.fill; cell.font = MONEY_STYLE.font
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    }
    if (header === '優先級' && String(r.priority).includes('金額')) {
      cell.fill = MONEY_STYLE.fill; cell.font = MONEY_STYLE.font
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    }
  })
})
sheet.autoFilter = { from: 'A1', to: `N${rows.length + 1}` }

// ── 重大發現與建議 ──
if (findings.length) {
  const fsheet = wb.addWorksheet('重大發現與建議', { views: [{ state: 'frozen', ySplit: 1 }] })
  fsheet.columns = [
    { header: '嚴重程度', key: 'severity', width: 12 },
    { header: '標題', key: 'title', width: 30 },
    { header: '相關測項', key: 'relatedIds', width: 16 },
    { header: '問題描述', key: 'description', width: 55 },
    { header: '重現方式', key: 'repro', width: 45 },
    { header: '影響範圍', key: 'impact', width: 30 },
    { header: '建議', key: 'recommendation', width: 45 },
  ]
  const fHeaderRow = fsheet.getRow(1)
  fHeaderRow.eachCell((cell) => { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true } })
  fHeaderRow.height = 22
  findings.forEach((f, i) => {
    const row = fsheet.addRow(f)
    const isAlt = i % 2 === 1
    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
      if (isAlt) cell.fill = ROW_FILL_ALT
      if (colNumber === 1) {
        const style = SEVERITY_STYLE[f.severity] || SEVERITY_STYLE['🟡 低']
        cell.fill = style.fill; cell.font = style.font
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
    })
  })
  fsheet.autoFilter = { from: 'A1', to: `G${findings.length + 1}` }
}

// ── 使用說明 ──
const help = wb.addWorksheet('使用說明')
help.columns = [{ width: 20 }, { width: 80 }]
const helpRows = [
  ['欄位', '說明'],
  ['編號', '格式為 {原編號}-{N}，N 為該業務流程項目第幾組實測情境（同一測項通常有多組不同輸入資料）'],
  ['大項', '人看得懂的大分類（主要業務流程）'],
  ['分類', '更細的功能、頁面或模組'],
  ['金額重點', '牽涉金額、帳務、付款、報表等高風險數字時為「是」'],
  ['優先級', 'P0 金額 > P0 > P1 > P2'],
  ['測試流程', '用人話描述的操作流程'],
  ['輸入資料 / 操作', '本次實際送出的請求資料（真實執行，非模擬）'],
  ['驗證位置', '要去哪個頁面/報表/通知確認結果'],
  ['期望呈現', '驗收者應該看到的結果'],
  ['結果呈現', '本次實際執行後，系統回傳/資料庫查詢到的真實內容'],
  ['是否通過', '通過 / 失敗 / 需確認（需確認＝環境限制或純前端UI無法自動化驗證，需人工開瀏覽器確認）'],
  ['問題位置', '失敗時填功能區塊，方便追蹤'],
  ['建議覆蓋方式', 'API＝已用API自動化驗證；人工/UI測試＝需開瀏覽器人工確認'],
  ['備註', '執行過程中的補充說明、發現的邊界行為'],
  [],
  ['執行方式說明', '本次測試在乾淨、獨立的測試環境（非正式環境）上，透過真實請求執行，每個業務流程項目至少設計多組不同的輸入資料驗證（例如不同金額、不同角色、不同邊界值），並非人工假想結果。'],
  ['「需確認」項目', '少數項目本質是純前端畫面渲染（如顏色、拖曳互動、Tab版面），無法透過自動化呼叫驗證，已如實標記，備註中會說明原因與建議如何人工驗證。'],
  ['重大發現', '測試過程中意外發現的、超出原測項範圍的系統性問題，已整理在「重大發現與建議」工作表並依嚴重程度排序，建議優先處理其中標示🔴的項目。'],
]
helpRows.forEach((r, i) => {
  const row = help.addRow(r)
  if (i === 0) { row.font = HEADER_FONT; row.eachCell(c => c.fill = HEADER_FILL) }
  row.eachCell(c => { c.alignment = { vertical: 'top', wrapText: true } })
})

await wb.xlsx.writeFile(args.output)
console.log(`Workbook written to ${args.output} (${rows.length} test rows, ${findings.length} findings)`)
