import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'

// 自簽 JWT（Neon 不含 Auth，認證自管）。密鑰讀 runtimeConfig.jwtSecret（＝環境變數 NUXT_JWT_SECRET）。
const TOKEN_TTL = '7d'
const encoder = new TextEncoder()

function secretKey(): Uint8Array {
  const s = useRuntimeConfig().jwtSecret
  if (!s) {
    throw createError({ statusCode: 500, statusMessage: 'JWT 密鑰未設定（NUXT_JWT_SECRET）' })
  }
  return encoder.encode(s)
}

// sub = users 表主鍵（user id），資料一律以此為 key，不要用 email。
export function signToken(payload: { sub: string; email: string }): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey())
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secretKey())
  return payload
}

// 密碼雜湊：bcrypt（純 JS，serverless 相容）。絕不存明文。
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
