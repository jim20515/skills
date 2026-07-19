import { neon } from '@neondatabase/serverless'

// Neon（Vercel 內建 serverless Postgres）連線。
// 連線字串走 Vercel Neon 整合注入的 DATABASE_URL；本機開發用 .env（見 .env.example）。
// 用法：const sql = useDb(); const rows = await sql`select * from users where id = ${id}`
// ＊一律用標籤模板參數化（${...}），絕不字串拼接 SQL。
let _sql: ReturnType<typeof neon> | null = null

export function useDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DATABASE_URL 未設定（請接上 Vercel Neon 整合，或在 .env 填連線字串）',
    })
  }
  if (!_sql) _sql = neon(url)
  return _sql
}
