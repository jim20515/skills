<script setup lang="ts">
// 通用分頁列：顯示「共 N 筆・X–Y」＋ 上一頁/頁碼/下一頁。放在表格捲動容器外，手機也看得到。
const props = defineProps<{
  page: number
  pageCount: number
  rangeStart: number
  rangeEnd: number
  total: number
}>()

const emit = defineEmits<{ 'update:page': [number]; prev: []; next: [] }>()

// 頁碼窗格（超過 7 頁時用省略號收合）
const pages = computed<(number | '…')[]>(() => {
  const { page, pageCount } = props
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  if (start > 2) out.push('…')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < pageCount - 1) out.push('…')
  out.push(pageCount)
  return out
})
</script>

<template>
  <div class="flex items-center justify-between gap-3 flex-wrap px-5 py-3.5 border-t border-slate-100">
    <p class="text-xs text-slate-400">
      共 {{ total.toLocaleString('zh-TW') }} 筆<span v-if="total"> ・顯示 {{ rangeStart }}–{{ rangeEnd }}</span>
    </p>
    <div v-if="pageCount > 1" class="flex items-center gap-1">
      <button type="button" @click="emit('prev')" :disabled="page <= 1"
        class="min-w-8 h-8 px-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent">
        ‹
      </button>
      <template v-for="(p, i) in pages" :key="i">
        <span v-if="p === '…'" class="px-1 text-xs text-slate-300">…</span>
        <button v-else type="button" @click="emit('update:page', p)"
          class="min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition"
          :class="p === page ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'">
          {{ p }}
        </button>
      </template>
      <button type="button" @click="emit('next')" :disabled="page >= pageCount"
        class="min-w-8 h-8 px-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent">
        ›
      </button>
    </div>
  </div>
</template>
