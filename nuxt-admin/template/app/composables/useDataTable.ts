import { computed, ref, watch, toValue, type MaybeRefOrGetter } from 'vue'

// 表格通用邏輯：搜尋 + 排序 + 分頁。桌機表格與手機卡片共用同一份輸出（table.rows）。
// 未來任何清單頁都可直接套用：傳入資料來源與設定，取回已處理好的當頁資料與控制項。
export interface UseDataTableOptions<T> {
  // 搜尋要比對的欄位（值轉字串做不分大小寫比對）。不給則掃描整列所有值。
  searchKeys?: (keyof T)[]
  // 進階篩選：回傳保留為 true 的判斷式（用 computed 包住篩選狀態即可，變動時自動回第 1 頁）。
  filter?: MaybeRefOrGetter<((row: T) => boolean) | null | undefined>
  // 排序取值：欄位 key → 取值函式（例如日期轉時間戳、代碼轉排序序）。未指定的 key 直接用 row[key]。
  sortAccessors?: Record<string, (row: T) => string | number | Date | null | undefined>
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
  pageSize?: number
}

function toText(v: unknown): string {
  return v == null ? '' : String(v)
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1 // null 排最後
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  return String(a).localeCompare(String(b), 'zh-TW', { numeric: true })
}

export function useDataTable<T extends Record<string, any>>(
  source: MaybeRefOrGetter<T[]>,
  options: UseDataTableOptions<T> = {},
) {
  const search = ref('')
  const sortKey = ref<string | null>(options.defaultSort?.key ?? null)
  const sortDir = ref<'asc' | 'desc'>(options.defaultSort?.dir ?? 'asc')
  const pageSize = ref(options.pageSize ?? 10)
  const page = ref(1)

  const all = computed<T[]>(() => toValue(source) ?? [])

  const filtered = computed(() => {
    let list = all.value
    // 進階篩選條件
    const fn = toValue(options.filter)
    if (fn) list = list.filter(fn)
    // 關鍵字搜尋
    const q = search.value.trim().toLowerCase()
    if (q) {
      const keys = options.searchKeys
      list = list.filter((row) => {
        if (keys?.length) return keys.some(k => toText(row[k]).toLowerCase().includes(q))
        return Object.values(row).some(v => toText(v).toLowerCase().includes(q))
      })
    }
    return list
  })

  const sorted = computed(() => {
    const key = sortKey.value
    if (!key) return filtered.value
    const acc = options.sortAccessors?.[key]
    const dir = sortDir.value === 'desc' ? -1 : 1
    const valueFor = (row: T) => (acc ? acc(row) : row[key])
    // 複製再排序，避免動到來源陣列
    return [...filtered.value].sort((a, b) => dir * compare(valueFor(a), valueFor(b)))
  })

  const total = computed(() => all.value.length)
  const filteredTotal = computed(() => filtered.value.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(filteredTotal.value / pageSize.value)))
  // 對外的當前頁一律夾在有效範圍內（資料變少或搜尋後不會停在空白頁）
  const currentPage = computed(() => Math.min(Math.max(1, page.value), pageCount.value))

  const rows = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return sorted.value.slice(start, start + pageSize.value)
  })

  const rangeStart = computed(() => (filteredTotal.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1))
  const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredTotal.value))

  // 搜尋或篩選條件改變時回到第一頁
  watch([search, () => toValue(options.filter)], () => { page.value = 1 })

  function toggleSort(key: string) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
    page.value = 1
  }

  function setPage(p: number) { page.value = Math.min(Math.max(1, p), pageCount.value) }
  function nextPage() { setPage(currentPage.value + 1) }
  function prevPage() { setPage(currentPage.value - 1) }

  return {
    search, sortKey, sortDir, pageSize,
    page: currentPage,
    pageCount, total, filteredTotal, rangeStart, rangeEnd,
    rows, toggleSort, setPage, nextPage, prevPage,
  }
}
