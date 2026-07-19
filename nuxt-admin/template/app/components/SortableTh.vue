<script setup lang="ts">
// 可點擊排序的表頭儲存格。搭配 useDataTable：綁 :active-key/:dir，點擊 emit('sort', columnKey)。
const props = withDefaults(defineProps<{
  label: string
  columnKey: string
  activeKey: string | null
  dir: 'asc' | 'desc'
  align?: 'left' | 'center' | 'right'
}>(), { align: 'left' })

const emit = defineEmits<{ sort: [key: string] }>()

const active = computed(() => props.activeKey === props.columnKey)
const justify = computed(() =>
  props.align === 'right' ? 'justify-end' : props.align === 'center' ? 'justify-center' : 'justify-start',
)
</script>

<template>
  <th class="px-4 py-3 first:px-5">
    <button type="button" @click="emit('sort', columnKey)"
      class="group w-full inline-flex items-center gap-1 text-xs font-medium transition select-none"
      :class="[justify, active ? 'text-slate-700' : 'text-slate-500 hover:text-slate-700']">
      <span>{{ label }}</span>
      <span class="flex flex-col leading-none gap-0.5 text-[9px] shrink-0">
        <span :class="active && dir === 'asc' ? 'text-indigo-600' : 'text-slate-300'">▲</span>
        <span :class="active && dir === 'desc' ? 'text-indigo-600' : 'text-slate-300'">▼</span>
      </span>
    </button>
  </th>
</template>
