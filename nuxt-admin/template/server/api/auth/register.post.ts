// 註冊：建立 users 一筆、雜湊密碼、簽發 JWT。
// 正式環境若不開放自助註冊，改成管理員後台建帳號即可（此檔可刪）。
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'email 與密碼必填' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: '密碼至少 8 碼' })
  }

  const sql = useDb()
  const existing = await sql`select id from users where email = ${email}`
  if (existing.length) {
    throw createError({ statusCode: 409, statusMessage: '此 email 已註冊' })
  }

  const passwordHash = await hashPassword(password)
  const rows = await sql`
    insert into users (email, password_hash)
    values (${email}, ${passwordHash})
    returning id, email
  `
  const user = rows[0]
  const token = await signToken({ sub: String(user.id), email: user.email })
  return { token, user: { id: user.id, email: user.email } }
})
