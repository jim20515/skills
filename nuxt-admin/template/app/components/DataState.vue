<script setup lang="ts">
// 每個畫面的「載入中 / 錯誤 / 空狀態 / 內容」四選一，全站統一（見 CLAUDE.md）。
// 用法：<DataState :pending="pending" :error="error" :empty="!items.length" @retry="refresh"> ...內容... </DataState>
// 三種狀態都可用具名插槽覆寫：#loading / #error / #empty。
withDefaults(defineProps<{
  pending?: boolean
  error?: unknown
  empty?: boolean
  loadingText?: string
  emptyText?: string
  errorText?: string
  minHeight?: string // 讓載入/空狀態不會太扁；整頁 splash 傳 min-h-screen
}>(), {
  loadingText: '載入中…',
  emptyText: '目前沒有資料',
  errorText: '載入失敗，請稍後再試',
  minHeight: 'min-h-[200px]',
})
defineEmits<{ retry: [] }>()
</script>

<template>
  <!-- 載入中 -->
  <div v-if="pending" class="flex flex-col items-center justify-center gap-3 text-slate-400" :class="minHeight">
    <slot name="loading">
      <Spinner size="lg" />
      <p class="text-sm">{{ loadingText }}</p>
    </slot>
  </div>

  <!-- 錯誤（不要靜默吞掉，讓使用者看得到 + 可重試） -->
  <div v-else-if="error" class="flex flex-col items-center justify-center gap-3 text-center px-6" :class="minHeight">
    <slot name="error" :error="error">
      <p class="text-sm text-red-600">{{ errorText }}</p>
      <button
        class="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        @click="$emit('retry')">
        重試
      </button>
    </slot>
  </div>

  <!-- 空狀態 -->
  <div v-else-if="empty" class="flex items-center justify-center text-sm text-slate-400" :class="minHeight">
    <slot name="empty">{{ emptyText }}</slot>
  </div>

  <!-- 有資料 -->
  <slot v-else />
</template>
