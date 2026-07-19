import type { H3Event } from 'h3'

// 從 Authorization: Bearer <token> 驗 JWT，回傳 { id, email }。驗不過一律 401。
// 用法：export default defineEventHandler(async (event) => { const user = await requireUser(event); ... })
export async function requireUser(event: H3Event): Promise<{ id: string; email: string }> {
  const header = getRequestHeader(event, 'authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: '未登入' })
  }
  try {
    const payload = await verifyToken(token)
    if (!payload.sub) throw new Error('token 缺少 sub')
    return { id: String(payload.sub), email: typeof payload.email === 'string' ? payload.email : '' }
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'token 無效或已過期' })
  }
}
