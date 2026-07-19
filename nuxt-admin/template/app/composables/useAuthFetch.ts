import type { UseFetchOptions } from 'nuxt/app'

// 讀資料用：自動帶 Bearer token，401 時清 session 並導回登入。
// 用法：const { data, pending, error, refresh } = await useAuthFetch<T>('/api/xxx')
export function useAuthFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  const { authHeaders, clearSession } = useAuth()

  return useFetch(url, {
    ...options,
    headers: { ...(options.headers as Record<string, string>), ...authHeaders.value },
    onResponseError(ctx) {
      if (ctx.response.status === 401) {
        clearSession()
        navigateTo('/login')
      }
    },
  })
}
