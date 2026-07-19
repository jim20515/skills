<script setup lang="ts">
// 頂部 sticky header。頁面專屬動作用 #actions 插槽塞入。
const route = useRoute()
const emit = defineEmits(['logout', 'menu'])

const titleMap: Record<string, string> = {
  '/': '總覽',
  '/items': '資料清單',
  '/settings': '設定',
}
const pageTitle = computed(() => titleMap[route.path] ?? '後台系統')
const today = computed(() =>
  new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
)
</script>

<template>
  <header class="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 md:px-6 safe-top">
    <div class="h-14 flex items-center justify-between">
      <div class="flex items-center gap-3 min-w-0">
        <button @click="emit('menu')" class="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div class="min-w-0">
          <h1 class="text-base font-semibold text-slate-800 truncate">{{ pageTitle }}</h1>
          <p class="text-xs text-slate-400 hidden sm:block">{{ today }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <!-- 頁面專屬動作按鈕放這 -->
        <slot name="actions" />
        <div class="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3 ml-1">
          <button @click="emit('logout')" title="登出"
            class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
