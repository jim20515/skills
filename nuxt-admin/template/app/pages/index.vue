<script setup lang="ts">
// 範例頁：搜尋條件卡（獨立）+ 列表卡（表格→手機卡片、排序、分頁）+ BottomSheet、Toast、下拉刷新。
// 版面慣例：篩選/搜尋獨立成一張卡，放在列表卡「上方」，不要塞進列表卡 header。
// 實際專案把假資料換成 useAuthFetch('/api/...')，表格控制沿用 useDataTable + <SortableTh> + <TablePagination>。
const toast = useToast()

interface Item { id: number, name: string, status: string, amount: number }

// 假資料（筆數刻意多一點，讓分頁看得出效果）
const items = ref<Item[]>([
  { id: 1, name: '項目 A', status: '進行中', amount: 12000 },
  { id: 2, name: '項目 B', status: '完成', amount: 340000 },
  { id: 3, name: '項目 C', status: '待處理', amount: 5600 },
  { id: 4, name: '項目 D', status: '完成', amount: 89000 },
  { id: 5, name: '項目 E', status: '進行中', amount: 23400 },
  { id: 6, name: '項目 F', status: '待處理', amount: 1200 },
  { id: 7, name: '項目 G', status: '完成', amount: 456000 },
  { id: 8, name: '項目 H', status: '進行中', amount: 78900 },
  { id: 9, name: '項目 I', status: '待處理', amount: 3400 },
  { id: 10, name: '項目 J', status: '完成', amount: 210000 },
  { id: 11, name: '項目 K', status: '進行中', amount: 15600 },
  { id: 12, name: '項目 L', status: '待處理', amount: 8700 },
  { id: 13, name: '項目 M', status: '完成', amount: 99000 },
])

// 篩選：用 useDataTable 的 filter 選項（回傳判斷式，變動時自動回第 1 頁）。多欄篩選就在這裡多加條件。
const statuses = ['進行中', '完成', '待處理']
const statusFilter = ref('')
const filterFn = computed(() => {
  const s = statusFilter.value
  return (it: Item) => !s || it.status === s
})

// 搜尋 + 排序 + 分頁三件套：桌機表格與手機卡片共用同一份 rows（別各算一份）
const {
  search, sortKey, sortDir, toggleSort,
  rows, page, pageCount, filteredTotal, rangeStart, rangeEnd,
  setPage, nextPage, prevPage,
} = useDataTable<Item>(items, {
  searchKeys: ['name'],
  filter: filterFn,
  // 需要自訂排序取值時用 sortAccessors（例：日期轉時間戳、代碼轉排序序）；此例欄位可直接排序，故略。
  defaultSort: { key: 'id', dir: 'desc' },
  pageSize: 8,
})

// 手機排序下拉（卡片沒有表頭，用它取代可點的 <SortableTh>）
const sortFields: { key: string, label: string }[] = [
  { key: 'name', label: '名稱' },
  { key: 'status', label: '狀態' },
  { key: 'amount', label: '金額' },
]
function onMobileSort(e: Event) {
  const key = (e.target as HTMLSelectElement).value
  if (sortKey.value !== key) toggleSort(key)
}

// 載入狀態（實際專案用 useAuthFetch 的 pending；這裡用旗標示範 DataState）
const pending = ref(true)
onMounted(() => setTimeout(() => { pending.value = false }, 900))

async function refresh() {
  pending.value = true
  await new Promise(r => setTimeout(r, 700))
  pending.value = false
  toast.success('已更新')
}
usePullToRefresh(refresh)

const showSheet = ref(false)
const money = (v: number) => v.toLocaleString('zh-TW')

function save() {
  showSheet.value = false
  toast.success('已新增')
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- 統計卡 -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="i in 4" :key="i" class="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200">
        <p class="text-xs text-slate-400 mb-1">指標 {{ i }}</p>
        <p class="text-sm sm:text-xl font-bold text-slate-800 truncate">{{ money(i * 12345) }}</p>
      </div>
    </div>

    <!-- 搜尋條件卡（獨立於列表；欄位用 grid 排，手機自動堆疊成單欄） -->
    <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
      <h3 class="text-sm font-semibold text-slate-800">搜尋條件</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input
          v-model="search" type="search" placeholder="名稱關鍵字…"
          class="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300">
        <select
          v-model="statusFilter"
          class="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">全部狀態</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
        <!-- 實際專案在這裡繼續加篩選欄位（統編、方案、金流…），grid 會自動排版 -->
      </div>
    </div>

    <!-- 列表卡 -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <h3 class="text-sm font-semibold text-slate-800">資料清單</h3>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            @click="refresh">
            重新整理
          </button>
          <button
            class="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            @click="showSheet = true">
            新增
          </button>
        </div>
      </div>

      <!-- 載入中 / 空狀態 / 錯誤 一律用 DataState；有資料才走預設插槽 -->
      <DataState :pending="pending" :empty="!filteredTotal" empty-text="查無符合的資料" min-height="min-h-[240px]" @retry="refresh">
        <!-- 手機排序下拉（卡片無表頭，用它排序） -->
        <div class="sm:hidden flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
          <span class="text-xs text-slate-400">排序</span>
          <select
            :value="sortKey ?? ''" class="flex-1 px-2 py-1.5 text-base border border-slate-200 rounded-lg bg-white"
            @change="onMobileSort">
            <option v-for="f in sortFields" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
          <button
            v-if="sortKey"
            class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600"
            @click="toggleSort(sortKey)">
            {{ sortDir === 'asc' ? '升冪 ▲' : '降冪 ▼' }}
          </button>
        </div>

        <!-- 桌機表格：可點表頭排序用 <SortableTh>（自帶 ▲▼，不靠 hover） -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <SortableTh label="名稱" column-key="name" :active-key="sortKey" :dir="sortDir" @sort="toggleSort" />
                <SortableTh label="狀態" column-key="status" align="center" :active-key="sortKey" :dir="sortDir" @sort="toggleSort" />
                <SortableTh label="金額" column-key="amount" align="right" :active-key="sortKey" :dir="sortDir" @sort="toggleSort" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="it in rows" :key="it.id" class="hover:bg-slate-50/50 transition">
                <td class="px-5 py-3.5 font-medium text-slate-800">{{ it.name }}</td>
                <td class="px-4 py-3.5 text-center">
                  <span class="inline-flex px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-600">{{ it.status }}</span>
                </td>
                <td class="px-5 py-3.5 text-right text-slate-700">{{ money(it.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 手機卡片（吃同一份 rows） -->
        <div class="sm:hidden divide-y divide-slate-100">
          <div v-for="it in rows" :key="it.id" class="p-4 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-slate-800">{{ it.name }}</p>
              <p class="text-xs text-slate-400">{{ it.status }}</p>
            </div>
            <p class="text-slate-700 shrink-0">{{ money(it.amount) }}</p>
          </div>
        </div>

        <!-- 分頁列：放在捲動容器外，桌機/手機共用，保持可見 -->
        <TablePagination
          :page="page" :page-count="pageCount" :range-start="rangeStart" :range-end="rangeEnd" :total="filteredTotal"
          @update:page="setPage" @prev="prevPage" @next="nextPage" />
      </DataState>
    </div>

    <!-- 新增 BottomSheet -->
    <BottomSheet v-model="showSheet" title="新增項目">
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">名稱</label>
          <input
            type="text" placeholder="輸入名稱…"
            class="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300">
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3 px-6 py-4">
          <button
            class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            @click="showSheet = false">
            取消
          </button>
          <button
            class="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            @click="save">
            儲存
          </button>
        </div>
      </template>
    </BottomSheet>
  </div>
</template>
