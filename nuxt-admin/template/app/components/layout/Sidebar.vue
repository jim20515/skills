<script setup lang="ts">
import { h } from 'vue'
// 桌機側欄 / 手機抽屜。改 navItems 換成該專案的導覽項目即可。
const route = useRoute()
const isActive = (p: string) => route.path === p
defineProps<{ open?: boolean }>()
const emit = defineEmits(['close'])

const icon = (d: string) => () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d }),
])

const navItems = [
  { path: '/', label: '總覽', icon: icon('M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z') },
  { path: '/items', label: '資料清單', icon: icon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01') },
  { path: '/settings', label: '設定', icon: icon('M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z') },
]
</script>

<template>
  <aside class="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300"
    :class="open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'">
    <div class="px-6 py-5 border-b border-slate-200">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-800">後台系統</p>
          <p class="text-xs text-slate-400">Admin Dashboard</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 px-3 py-4 overflow-y-auto">
      <p class="px-3 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">主選單</p>
      <ul class="space-y-0.5">
        <li v-for="item in navItems" :key="item.path">
          <NuxtLink :to="item.path" @click="emit('close')"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(item.path) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'">
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span class="flex-1">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="px-4 py-4 border-t border-slate-200">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <span class="text-xs font-semibold text-indigo-600">我</span>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-800 truncate">使用者</p>
          <p class="text-xs text-slate-400 truncate">已登入</p>
        </div>
      </div>
    </div>
  </aside>
</template>
