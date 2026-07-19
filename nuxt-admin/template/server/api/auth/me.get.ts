// 取得目前登入者（前端啟動時可用來驗證 token 是否仍有效）。
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return { user }
})
