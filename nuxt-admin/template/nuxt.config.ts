// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // 僅伺服器端可讀；jwtSecret 由環境變數 NUXT_JWT_SECRET 覆寫。
  // DATABASE_URL 由 Vercel Neon 整合注入，server 直接讀 process.env.DATABASE_URL。
  runtimeConfig: {
    jwtSecret: '',
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt',
  ],
  css: ['~/assets/css/app.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant' },
      meta: [
        // 禁縮放 + 防對焦放大 + 沿伸到瀏海（App 感），詳見 CLAUDE.md
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content' },
        { name: 'theme-color', content: '#4f46e5' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: '後台' },
      ],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '後台系統',
      short_name: '後台',
      lang: 'zh-Hant',
      theme_color: '#4f46e5',
      background_color: '#f1f5f9',
      display: 'standalone',
      start_url: '/',
      // 圖示放 public/icons/（用 sharp 產生 192/512/maskable，見 README）
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: undefined,
      globPatterns: ['**/*.{js,css,svg,png,ico,woff2}'],
      // API 一律走網路，不快取（避免快取私人資料或壞掉的 token）
      runtimeCaching: [{ urlPattern: /\/api\//, handler: 'NetworkOnly' }],
    },
    devOptions: { enabled: false },
  },
})
