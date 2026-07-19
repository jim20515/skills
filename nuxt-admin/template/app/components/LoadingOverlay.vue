<script setup lang="ts">
// 全螢幕過場：登入成功導向 / 需要蓋住整頁等待時用，避免看起來沒反應。預設文字「登入中…」。
// 複用全站 <Spinner>，與其他 loading 呈現一致。頂部進度條（NuxtLoadingIndicator）仍會同時跑。
defineProps<{ label?: string }>()
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center gap-3">
    <Spinner size="lg" />
    <p class="text-sm text-slate-500">{{ label || '登入中…' }}</p>
  </div>
</template>
