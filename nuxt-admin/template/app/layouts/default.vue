<script setup lang="ts">
// 通用外殼：側欄 + sticky header + 底部導覽（手機）+ Toast + 下拉刷新指示器。
const route = useRoute()
const { clearSession } = useAuth()
const sidebarOpen = ref(false)
watch(route, () => { sidebarOpen.value = false })

// 下拉刷新指示器狀態（各頁呼叫 usePullToRefresh 更新）
const ptr = usePullToRefreshState()

function logout() {
  clearSession()
  // TODO: 導向該專案的登入頁
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- 手機遮罩 -->
    <div v-if="sidebarOpen" class="fixed inset-0 bg-black/40 z-30 md:hidden" @click="sidebarOpen = false" />

    <LayoutSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="md:ml-60 flex-1 flex flex-col min-h-screen overflow-x-hidden">
      <LayoutAppHeader @logout="logout" @menu="sidebarOpen = true" />
      <main class="flex-1 p-4 md:p-6">
        <slot />
      </main>
      <footer class="px-4 md:px-6 py-3 border-t border-slate-100 text-center">
        <p class="text-xs text-slate-400">後台系統</p>
      </footer>
      <!-- 底部導覽列預留空間（手機） -->
      <div class="h-14 safe-bottom sm:hidden" aria-hidden="true" />
    </div>

    <!-- 下拉刷新指示器（手機） -->
    <div v-if="ptr.distance > 0 || ptr.refreshing"
      class="sm:hidden fixed top-0 inset-x-0 z-40 flex justify-center pointer-events-none"
      :style="{ transform: `translateY(${ptr.refreshing ? 64 : ptr.distance + 8}px)`, transition: (ptr.refreshing || ptr.distance === 0) ? 'transform 0.25s ease' : 'none' }">
      <div class="w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center">
        <svg class="w-4 h-4 text-indigo-500" :class="ptr.refreshing ? 'animate-spin' : ''"
          :style="ptr.refreshing ? undefined : { transform: `rotate(${ptr.distance * 2.4}deg)` }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    </div>

    <!-- 手機底部導覽列 -->
    <LayoutBottomNav @menu="sidebarOpen = true" />

    <!-- 全域 Toast -->
    <Toast />
  </div>
</template>
