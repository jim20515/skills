<template>
  <div>
    <NuxtRouteAnnouncer />
    <!-- 換頁 / 登入後跳轉 / async setup 取資料時的頂部進度條（App 感） -->
    <NuxtLoadingIndicator color="#4f46e5" />
    <NuxtLayout>
      <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    </NuxtLayout>
  </div>
</template>
