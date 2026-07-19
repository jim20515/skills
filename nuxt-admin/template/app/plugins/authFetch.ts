// 寫資料用全域 $authFetch（POST/PUT/DELETE）：自動帶 Bearer token，401 導回登入。
// 用法：await $authFetch('/api/xxx', { method: 'POST', body: {...} })，完成後呼叫對應的 refresh()。
export default defineNuxtPlugin(() => {
  const authFetch = $fetch.create({
    onRequest({ options }) {
      const { authHeaders } = useAuth()
      options.headers = new Headers(options.headers)
      for (const [k, v] of Object.entries(authHeaders.value)) {
        options.headers.set(k, v)
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        const { clearSession } = useAuth()
        clearSession()
        navigateTo('/login')
      }
    },
  })

  return { provide: { authFetch } }
})
