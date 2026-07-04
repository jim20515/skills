#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--input') args.input = argv[++i]
    else if (arg === '--output') args.output = argv[++i]
    else if (arg === '--preview-dir') args.previewDir = argv[++i]
  }
  if (!args.input || !args.output) {
    throw new Error('Usage: build_business_flow_workbook.mjs --input input.json --output output.xlsx [--preview-dir dir]')
  }
  return args
}

function normalizeStatus(value) {
  const text = String(value || '待測').trim()
  if (['通過', '失敗', '待測', '需確認'].includes(text)) return text
  return '待測'
}

function normalizeRow(row, index) {
  const moneyFocus = row.moneyFocus === true || row.moneyFocus === '是'
  return [
    row.id || `BF-${String(index + 1).padStart(3, '0')}`,
    row.section || row.major || '未分類',
    row.category || '未分類',
    moneyFocus ? '是' : '否',
    row.priority || (moneyFocus ? 'P0 金額' : 'P1'),
    row.flow || '',
    row.input || '',
    row.verify || '',
    row.expected || '',
    row.actual || '待測',
    normalizeStatus(row.status),
    row.issueLocation || '',
    row.coverage || '',
    row.notes || '',
  ]
}

const args = parseArgs(process.argv)
const payload = JSON.parse(await fs.readFile(args.input, 'utf8'))
const rawRows = Array.isArray(payload) ? payload : payload.rows
if (!Array.isArray(rawRows) || rawRows.length === 0) throw new Error('Input JSON must contain a non-empty rows array')

const rows = rawRows.map(normalizeRow)
const title = payload.title || '完整業務流程測試表'
const generatedDate = payload.generatedDate || new Date().toISOString().slice(0, 10)
const outputPath = path.resolve(args.output)
const outputDir = path.dirname(outputPath)
const previewDir = args.previewDir || outputDir

const headers = ['編號', '大項', '分類', '金額重點', '優先級', '測試流程', '輸入資料 / 操作', '驗證位置', '期望呈現', '結果呈現', '是否通過', '問題位置', '建議覆蓋方式', '備註']
const workbook = Workbook.create()
const summary = workbook.worksheets.add('摘要')
const detail = workbook.worksheets.add('完整測試清單')
const guide = workbook.worksheets.add('使用說明')
for (const ws of [summary, detail, guide]) ws.showGridLines = false

const headerFill = '#DDEBF7'
const headerFont = '#24415F'
const stripeOdd = '#FFFFFF'
const stripeEven = '#EAF4FF'
const borderColor = '#D7DEE8'

detail.getRangeByIndexes(0, 0, 1, headers.length).values = [headers]
detail.getRangeByIndexes(1, 0, rows.length, headers.length).values = rows
const used = detail.getRangeByIndexes(0, 0, rows.length + 1, headers.length)
used.format.borders = { preset: 'all', style: 'thin', color: borderColor }
used.format.wrapText = true
used.format.verticalAlignment = 'top'
const detailHeader = detail.getRange('A1:N1')
detailHeader.format.fill = { color: headerFill }
detailHeader.format.font = { bold: true, color: headerFont }
detailHeader.format.horizontalAlignment = 'center'
detailHeader.format.rowHeight = 28
detail.freezePanes.freezeRows(1)

const widths = [10, 24, 16, 10, 12, 44, 38, 34, 50, 28, 10, 18, 16, 34]
widths.forEach((width, idx) => detail.getRangeByIndexes(0, idx, 1, 1).format.columnWidth = width)

for (let i = 0; i < rows.length; i += 1) {
  const rowNumber = i + 2
  const fill = rowNumber % 2 === 0 ? stripeOdd : stripeEven
  detail.getRangeByIndexes(rowNumber - 1, 0, 1, headers.length).format.fill = { color: fill }
  if (rows[i][3] === '是' || String(rows[i][4]).includes('金額')) {
    detail.getRange(`D${rowNumber}:E${rowNumber}`).format.fill = { color: '#FFF2CC' }
    detail.getRange(`D${rowNumber}:E${rowNumber}`).format.font = { bold: true, color: '#7F6000' }
  }
  const status = rows[i][10]
  const statusCell = detail.getRange(`K${rowNumber}`)
  if (status === '通過') {
    statusCell.format.fill = { color: '#C6EFCE' }
    statusCell.format.font = { bold: true, color: '#006100' }
  } else if (status === '失敗') {
    statusCell.format.fill = { color: '#C00000' }
    statusCell.format.font = { bold: true, color: '#FFFFFF' }
  } else if (status === '需確認') {
    statusCell.format.fill = { color: '#FFF2CC' }
    statusCell.format.font = { bold: true, color: '#9C6500' }
  } else {
    statusCell.format.fill = { color: '#D9EAF7' }
    statusCell.format.font = { bold: true, color: '#1F4E79' }
  }
}

const total = rows.length
const p0 = rows.filter((r) => String(r[4]).startsWith('P0')).length
const money = rows.filter((r) => r[3] === '是').length
const passed = rows.filter((r) => r[10] === '通過').length
const failed = rows.filter((r) => r[10] === '失敗').length
const confirm = rows.filter((r) => r[10] === '需確認').length
const pending = rows.filter((r) => r[10] === '待測').length

summary.getRange('A1:H1').merge()
summary.getRange('A1').values = [[title]]
summary.getRange('A1').format.font = { bold: true, size: 18, color: headerFont }
summary.getRange('A3:B10').values = [
  ['產出日期', generatedDate],
  ['總測試項目', total],
  ['P0 / P0 金額', p0],
  ['金額重點項目', money],
  ['目前通過', passed],
  ['目前失敗', failed],
  ['需確認', confirm],
  ['待測', pending],
]
summary.getRange('A3:B10').format.borders = { preset: 'all', style: 'thin', color: borderColor }
summary.getRange('A3:A10').format.fill = { color: headerFill }
summary.getRange('A3:A10').format.font = { bold: true, color: headerFont }
summary.getRange('A:A').format.columnWidth = 18
summary.getRange('B:B').format.columnWidth = 18

const sectionCounts = [...new Map(rows.map((r) => [r[1], rows.filter((x) => x[1] === r[1]).length])).entries()]
summary.getRange('D3:E3').values = [['大項', '筆數']]
summary.getRangeByIndexes(3, 3, sectionCounts.length, 2).values = sectionCounts
summary.getRangeByIndexes(2, 3, sectionCounts.length + 1, 2).format.borders = { preset: 'all', style: 'thin', color: borderColor }
summary.getRange('D3:E3').format.fill = { color: headerFill }
summary.getRange('D3:E3').format.font = { bold: true, color: headerFont }
summary.getRange('D:D').format.columnWidth = 30
summary.getRange('E:E').format.columnWidth = 10

guide.getRange('A1:F1').merge()
guide.getRange('A1').values = [['使用說明']]
guide.getRange('A1').format.font = { bold: true, size: 16, color: headerFont }
guide.getRange('A3:F10').values = [
  ['欄位', '說明', '', '', '', ''],
  ['金額重點', '是：牽涉金額、付款、退款、折扣、稅金、分潤、點數、權益、報表或匯出。', '', '', '', ''],
  ['優先級', 'P0 金額 表示最高優先且牽涉金額；P0 表示最高優先的一般流程；P1/P2 依風險降低。', '', '', '', ''],
  ['測試流程', '用人看得懂的流程描述，不使用工程欄位名稱。', '', '', '', ''],
  ['期望呈現', '寫成驗收者能直接核對的畫面、報表、通知或匯出結果。', '', '', '', ''],
  ['結果呈現', '實測後填入實際看到的數字、狀態、畫面文字或錯誤訊息。', '', '', '', ''],
  ['是否通過', '通過 / 失敗 / 待測 / 需確認。', '', '', '', ''],
  ['格式', '表頭淺藍、資料列交錯底色，狀態欄用顏色凸顯。', '', '', '', ''],
]
guide.getRange('A3:F10').format.borders = { preset: 'all', style: 'thin', color: borderColor }
guide.getRange('A3:A10').format.fill = { color: headerFill }
guide.getRange('A3:A10').format.font = { bold: true, color: headerFont }
for (const row of [3, 4, 5, 6, 7, 8, 9, 10]) guide.getRange(`B${row}:F${row}`).merge()
guide.getRange('A1:F10').format.wrapText = true
guide.getRange('A:A').format.columnWidth = 18
guide.getRange('B:F').format.columnWidth = 24

const errorScan = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  maxChars: 2000,
})
console.log(errorScan.ndjson)

await fs.mkdir(outputDir, { recursive: true })
await fs.mkdir(previewDir, { recursive: true })
const preview = await workbook.render({ sheetName: '完整測試清單', range: 'A1:N14', scale: 1, format: 'png' })
await fs.writeFile(path.join(previewDir, 'preview-business-flow-test-plan.png'), new Uint8Array(await preview.arrayBuffer()))

const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)
console.log(outputPath)
