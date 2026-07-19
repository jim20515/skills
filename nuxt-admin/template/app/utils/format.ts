// 通用格式化 helper（全站單一來源）。Nuxt 自動匯入，直接用函式名即可。

// 日期時間：2026/07/19 14:30（zh-TW）
export const fmtDate = (s: string) =>
  new Date(s).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })

// 金額千分位：1,234,567
export const fmtMoney = (v: number) => v.toLocaleString('zh-TW')
