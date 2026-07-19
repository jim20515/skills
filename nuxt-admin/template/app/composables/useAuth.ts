// 認證狀態（自簽 JWT）。token 存 cookie + localStorage，供 useAuthFetch / $authFetch 帶 Bearer。
export function useAuth() {
  const secureCookie = import.meta.client
    ? window.location.protocol === 'https:'
    : process.env.NODE_ENV === 'production'

  const token = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 天，與後端 JWT 效期一致
    sameSite: 'lax',
    secure: secureCookie,
    path: '/',
  })
  const user = useCookie<{ id: string; email: string } | null>('auth_user', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: secureCookie,
    path: '/',
  })

  if (import.meta.client) {
    if (!token.value) token.value = localStorage.getItem('auth_token')
    if (!user.value) {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        try {
          user.value = JSON.parse(stored)
        } catch {
          localStorage.removeItem('auth_user')
        }
      }
    }
  }

  const isLoggedIn = computed(() => !!token.value)

  function setSession(accessToken: string, userData: { id: string; email: string }) {
    token.value = accessToken
    user.value = userData

    if (import.meta.client) {
      const maxAge = 60 * 60 * 24 * 7
      const secure = secureCookie ? '; Secure' : ''
      document.cookie = `auth_token=${encodeURIComponent(accessToken)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
      document.cookie = `auth_user=${encodeURIComponent(JSON.stringify(userData))}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
      localStorage.setItem('auth_token', accessToken)
      localStorage.setItem('auth_user', JSON.stringify(userData))
    }
  }

  function clearSession() {
    token.value = null
    user.value = null

    if (import.meta.client) {
      document.cookie = 'auth_token=; Max-Age=0; Path=/; SameSite=Lax'
      document.cookie = 'auth_user=; Max-Age=0; Path=/; SameSite=Lax'
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  const authHeaders = computed(() => token.value
    ? { Authorization: `Bearer ${token.value}` }
    : {},
  )

  return { token, user, isLoggedIn, setSession, clearSession, authHeaders }
}
