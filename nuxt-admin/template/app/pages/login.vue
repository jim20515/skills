<script setup lang="ts">
// 登入 / 註冊。不套後台外殼（layout: false）。串 /api/auth/login｜/api/auth/register。
definePageMeta({ layout: false })

const { setSession, isLoggedIn } = useAuth()
const toast = useToast()

// 已登入直接進後台
if (isLoggedIn.value) navigateTo('/')

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const submitting = ref(false)
const redirecting = ref(false)

const title = computed(() => mode.value === 'login' ? '登入' : '註冊')

async function submit() {
  if (submitting.value) return
  if (!email.value.trim() || !password.value) {
    toast.error('請填寫 email 與密碼')
    return
  }
  submitting.value = true
  try {
    const url = mode.value === 'login' ? '/api/auth/login' : '/api/auth/register'
    const res = await $fetch<{ token: string; user: { id: string; email: string } }>(url, {
      method: 'POST',
      body: { email: email.value.trim(), password: password.value },
    })
    setSession(res.token, res.user)
    toast.success(mode.value === 'login' ? '已登入' : '註冊成功')
    // 導向後台時蓋上全螢幕過場，撐到頁面換掉為止（頂部進度條也會同時跑）
    redirecting.value = true
    await navigateTo('/')
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || e?.statusMessage || '操作失敗，請稍後再試')
  } finally {
    // 導向中不要恢復按鈕，避免閃一下可按狀態
    if (!redirecting.value) submitting.value = false
  }
}
</script>

<template>
  <!-- 登入成功導向時的全螢幕過場 -->
  <LoadingOverlay v-if="redirecting" />

  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
      <div class="text-center space-y-1">
        <h1 class="text-lg font-bold text-slate-800">後台系統</h1>
        <p class="text-sm text-slate-400">請{{ title }}以繼續</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
          <input v-model="email" type="email" autocomplete="email" placeholder="you@example.com"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">密碼</label>
          <input v-model="password" type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" placeholder="••••••••"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <button type="submit" :disabled="submitting"
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60">
          <Spinner v-if="submitting" size="sm" class="text-white" />
          {{ submitting ? '處理中…' : title }}
        </button>
      </form>

      <p class="text-center text-xs text-slate-400">
        {{ mode === 'login' ? '還沒有帳號？' : '已經有帳號了？' }}
        <button type="button" class="text-indigo-600 font-medium"
          @click="mode = mode === 'login' ? 'register' : 'login'">
          {{ mode === 'login' ? '註冊' : '登入' }}
        </button>
      </p>
    </div>
  </div>
</template>
