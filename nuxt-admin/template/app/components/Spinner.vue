<script setup lang="ts">
// 全站統一轉圈。size 控制大小；顏色預設 indigo，用 class 覆寫（例：按鈕內 <Spinner class="text-white" />）。
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
</script>

<template>
  <svg
    class="animate-spin text-indigo-500" :class="sizeClass[size]"
    viewBox="0 0 24 24" fill="none" role="status" aria-label="載入中">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
</template>
