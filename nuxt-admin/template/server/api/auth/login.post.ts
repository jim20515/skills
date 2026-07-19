// 登入：比對 users 表，密碼正確才簽發 JWT。
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'email 與密碼必填' })
  }

  const sql = useDb()
  const rows = await sql`select id, email, password_hash from users where email = ${email}`
  const row = rows[0]

  // 帳號不存在與密碼錯誤回同一訊息，避免洩漏該 email 是否註冊過。
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    throw createError({ statusCode: 401, statusMessage: 'email 或密碼錯誤' })
  }

  const token = await signToken({ sub: String(row.id), email: row.email })
  return { token, user: { id: row.id, email: row.email } }
})
