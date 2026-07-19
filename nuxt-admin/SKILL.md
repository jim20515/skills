---
name: nuxt-admin
description: Nuxt 4 後台/管理系統的開發規範與共用元件正本。建立或修改任何 Nuxt admin/後台專案時使用——設計系統、繁中 UI、RWD/手機、loading（Spinner/DataState/LoadingOverlay/進度條）、清單表格「搜尋+排序+分頁」、彈窗 BottomSheet、Toast、下拉刷新、Neon(Postgres)+自建 JWT 認證，以及共用元件的取用與同步。此 skill 是這些規範與元件的單一真實來源（single source of truth）。
---

# Nuxt 後台開發套件（規範 + 共用元件正本）

這個 skill 是「所有 Nuxt 後台專案長得一致」的單一來源。它有兩部分：
1. **規範**（下方各節）——設計系統、RWD、loading、資料存取等慣例。
2. **共用元件正本**（本 skill 的 `template/` 目錄，鏡射專案結構）——`.vue`／`.ts` 實體檔。

> 核心觀念：**規範集中在這裡，各專案不要再整份複製** CLAUDE.md（複製的副本會過期，正是元件走鐘的主因）。各專案自己的 `CLAUDE.md` 只留「專案專屬設定」＋一行「本專案遵循 `nuxt-admin` skill」。

---

## 如何使用這個 skill

### A. 開新後台專案（bootstrap）
1. 建 Nuxt 4 專案（`npm create nuxt`），裝 `@nuxtjs/tailwindcss`、`@vite-pwa/nuxt`、`@neondatabase/serverless`、`jose`。
2. 把本 skill `template/` 下的檔案**依相同路徑**複製進專案（`app/`、`server/`、`nuxt.config.ts`、`.env.example`）。
3. **自動建立專案根目錄的 `CLAUDE.md`**：呼叫本 skill 開新專案時，**主動用 Write 工具**把下方〈專案 `CLAUDE.md` 範本〉整段寫進專案根目錄的 `CLAUDE.md`，並把 `<...>` 佔位換成該專案實際資訊、刪掉用不到的行。**不要只是口頭提示使用者，也不要把本 skill 的通用規範整份複製進去**（複製的副本會過期）。若專案已有 `CLAUDE.md`，就把範本內容併進去、別覆蓋既有專案設定。
4. 導覽（`Sidebar`/`BottomNav`）、`app.head` 標題、`.env` 換成該專案的。
5. `npm run build` 驗證。

### B. 既有專案要「加某個共用元件」或「用某個慣例」
- 直接從本 skill `template/` 取該檔的**最新正本**複製進專案，別自刻、別憑記憶重寫。
- 遵循下方對應章節的規範。

### C. 同步：把既有專案的共用元件更新成最新正本
當這個 skill 的 `template/` 更新後，既有專案**不會自動連動**（複製進去就各自獨立）。要同步時：
1. 逐一比對專案裡的共用檔 vs 本 skill `template/` 同路徑檔（`diff`）。
2. 專案裡若是**舊版**、且沒有專案專屬客製 → 用正本覆蓋。
3. 若專案有正當客製（例：導覽項目、色彩語意覆寫）→ 只合併正本的「機制/結構」改動，保留客製。
4. 覆蓋後 `npm run build` 驗證。
- 判斷「舊版」：比對關鍵實作（例：`Spinner` 是否為 `size` 參數版、`app.vue` 是否用 `<NuxtLoadingIndicator>` 而非自刻 bar）。

### 維護這個 skill 本身
- 有新的共用元件/慣例 → 把正本檔放進 `template/` 對應路徑、在下方「共用基礎建設」列一行、必要時補規範。**只更新這裡一處**，之後各專案 sync 即可。

---

## 專案 `CLAUDE.md` 範本（開新專案時自動寫入專案根目錄）

bootstrap（A）時，**用 Write 把下面這段整段寫成專案根目錄的 `CLAUDE.md`**，把 `<...>` 換成實際資訊、刪掉用不到的行。這是各專案唯一該自己維護的檔；其餘通用規範全部來自本 skill，**不要複製進來**：

```markdown
# <專案名稱> — 開發須知

> 本專案的通用規範與共用元件一律遵循 `nuxt-admin` skill（設計系統、繁中 UI、RWD/手機、loading、清單表格「搜尋+排序+分頁」、BottomSheet、Toast、下拉刷新、Neon + 自建 JWT）。
> **勿在此重述或複製那些規範**；要改共用元件請改 skill 的 `template/` 正本再 sync 回本專案。

## 本專案專屬設定

- **領域 / 用途**：<一句話說明這個後台在管什麼>
- **色彩語意覆寫**：預設 主要=indigo、成功=green、危險=red。<若領域有特殊語意（例：台股「紅漲綠跌」對調）在此定義；否則刪掉這行>
- **特殊資料格式**：<例：金額千分位、日期 YYYY/MM/DD、民國轉西元…沒有就寫「無」>
- **主要導覽項目**：<Sidebar / BottomNav 的入口，例：儀表板、訂單、會員、設定>
- **資料庫 / 認證**：Neon（Postgres）+ 自建 JWT。<不同再改>
```

> 寫完順手把 `<專案名稱>` 同步到 `nuxt.config.ts` 的 `app.head` 標題，以及 `Sidebar`／`BottomNav` 的導覽項目。

---

## 技術棧

- **Nuxt 4 + Vue 3**（`<script setup lang="ts">`，TypeScript strict）+ **Tailwind**。
- **不引入任何 UI library**（無 shadcn / MUI / Element / Vant），一律 Tailwind primitive 手刻。
- 後端：Nitro server routes（`server/api/`）+ **Neon（serverless Postgres）**，驅動 `@neondatabase/serverless`，連線字串走 `DATABASE_URL`（別硬寫、別 commit）。
- 部署預設 **Vercel**；環境變數在 Vercel 專案設定，本機用 `.env`（進 `.gitignore`）。
- 元件放 `app/components/`、可複用邏輯 `app/composables/`（`useXxx`）、頁面 `app/pages/`、跨頁外殼 `app/layouts/`。

## 語言與樣式（設計系統）

- **UI 文字用繁體中文，程式識別字用英文**。
- **色彩語意**（預設；特殊語意在專案 CLAUDE.md 覆寫）：主要操作/強調＝`indigo`；中性＝`slate`；成功＝`green`；危險/錯誤＝`red`；警告＝`amber`。
- 圓角：卡片/視窗 `rounded-2xl`、按鈕/輸入框 `rounded-lg`、badge `rounded-full`。
- **金額/大數字一律千分位**（focus 顯示純數字、blur `toLocaleString`；**不用 `type="number"`**，改文字框自行格式化）。
- 每個畫面都要有**載入中 / 空狀態 / 錯誤**三種樣子，別留白或整頁卡住：
  - **統一用 `<DataState>`**（`app/components/DataState.vue`）：傳 `:pending`／`:error`／`:empty`，載入顯示置中 `<Spinner>`、錯誤顯示訊息 + 重試（`@retry` 接 `refresh`）、空狀態顯示提示；整頁 splash 傳 `min-height="min-h-screen"`。
  - **轉圈一律用 `<Spinner>`**（`app/components/Spinner.vue`，`size` sm/md/lg、class 換色）；按鈕內等待也用它（有色底按鈕 `<Spinner size="sm" class="text-white" />`），**不要純文字「處理中…」或各刻 svg**。
  - **換頁 / 登入後跳轉**用頂部 `<NuxtLoadingIndicator>`（掛在 `app/app.vue`，indigo）；`async setup`／取資料時自動顯示。
  - **登入成功導向**可再蓋 `<LoadingOverlay>`（全螢幕「登入中…」＋大 `<Spinner>`）：登入頁設 `redirecting` 旗標，成功後設 `true` 再 `await navigateTo(...)`，`finally` 用 `if (!redirecting.value) submitting.value = false` 讓按鈕撐到換頁。

## 響應式（RWD / 手機）— 每個功能都要一起做

- **每次開發都同時考慮手機**：純 Tailwind 斷點（`sm:`/`md:`/`lg:`），單一程式碼庫；不做雙版本、不偵測裝置、不引行動元件庫。桌機外觀用 `sm:` 以上維持不變。
- **外殼已響應式**：sidebar 手機為抽屜 + 漢堡、`md:ml-60`、`p-4 md:p-6`，沿用即可。
- **每個 `<table>` 都必須有手機卡片版**（含彈窗內表格，唯一例外：純 2 欄 label｜value 窄表）：桌機 `<div class="hidden sm:block overflow-x-auto"><table>…`；手機另做 `sm:hidden` 堆疊卡片（用**同一份** computed 資料與 helper），分頁放捲動容器外。
  - `overflow-x-auto` 只是桌機保險——手機出現左右捲動＝漏做卡片。改動任何表格後，逐一確認每個 `<table>` 都有對應 `sm:hidden` 卡片。
- **每個清單表格都要「搜尋 + 排序 + 分頁」三件套**（例外：純 2 欄窄表、或筆數天生極少固定）。用 `useDataTable` 串成**單一資料管線**：`原始 → 篩選/搜尋 → 排序 → 分頁`，桌機表格與手機卡片**吃同一份 `rows`**（回傳的當頁資料）。
  - **API**：`useDataTable<T>(source, { searchKeys, filter, sortAccessors, defaultSort, pageSize })` → 回傳 `{ search, sortKey, sortDir, toggleSort, rows, page, pageCount, total, filteredTotal, rangeStart, rangeEnd, setPage, prevPage, nextPage }`。
    - `searchKeys`：要做關鍵字搜尋的欄位；`filter`：進階篩選判斷式（用 `computed` 包篩選狀態，變動時自動回第 1 頁）；`sortAccessors`：欄位 key → 取值函式（日期轉時間戳、代碼轉排序序）；`defaultSort`：預設排序。
    - 桌機可排序表頭用 `<SortableTh label column-key :active-key="sortKey" :dir="sortDir" @sort="toggleSort" align>`；分頁列用 `<TablePagination :page :page-count :range-start :range-end :total="filteredTotal" @update:page="setPage" @prev="prevPage" @next="nextPage">`。**完整範例見 `template/app/pages/index.vue`**。
  - **搜尋**：清單上方搜尋框（手機字級 ≥16px），不分大小寫子字串比對；搜尋/篩選改變**自動回第 1 頁**（composable 內建）；無結果走空狀態。
  - **搜尋/篩選卡與列表卡分開**：1 個篩選可放列表卡 header 同列；**多個篩選**一律**獨立成「搜尋條件」卡**放列表卡上方，用 `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`。
  - **排序**：桌機可排序 `<th>` 可點擊 + **▲▼** 指示（點擊循環 未→升→降）；手機另放排序下拉。預設排序明確（例：建立時間新到舊）。
  - **分頁**：預設每頁 10／20；分頁列放捲動容器外、顯示頁碼/總數 + 上下頁與邊界停用態。
  - **資料量大（>數百筆）改伺服器端**：搜尋/排序/頁碼當 query 傳給 API，Neon 端 `where`/`order by`/`limit offset`；小資料量客戶端即可，別過度設計。
- **彈窗一律用 `<BottomSheet v-model>`**：手機從底部滑上（握把＋安全區＋鎖背景捲動），桌機置中淡入。`title`／`#header`／`#footer`／`max-width`／`persistent`。**不要手刻 `fixed inset-0` 彈窗**。
- **App 化互動共用件，直接沿用勿重造**：
  - **Toast**：`const toast = useToast()` → `toast.success(...)`／`.error(...)`；**不要用 `alert`**。全域 host 掛在 layout。
  - **下拉刷新**：清單頁 setup 呼叫 `usePullToRefresh(refresh)`（彈窗開啟自動停用）。
  - **底部導覽**：`BottomNav.vue`；主入口改這裡，桌機用 `Sidebar.vue`。
  - **安全區**：貼齊螢幕邊緣的固定元素加 `.safe-top`／`.safe-bottom`。
  - **手感**：可點元素靠全域 CSS 自動按壓回饋；頁面維持**單一根節點**（尾端 `<Teleport>` tooltip 收進根 `<div>`），否則轉場失效。
- **全域規則在 `app/app.vue <style>` 與 `nuxt.config.ts`，勿破壞**：viewport 禁縮放；手機輸入框強制 16px 防 iOS 對焦放大（**別設 <16px**）；UI 元件 `user-select:none`（但 `td`／卡片數據可長按複製，**別對 body 禁選**）；`overscroll-behavior:none`。
- **PWA**：SW 只快取靜態資源、`/api` 一律 `NetworkOnly`。

## 資料存取

- 讀資料用 `useAuthFetch('/api/...')`（自動帶 Bearer token、401 自動導回登入）。
- 寫資料（POST/PUT/DELETE）用全域 `$authFetch`，完成後呼叫對應 `refresh()`，成功 `toast.success(...)`。
- **DB 查詢（Neon）**：server route 內用 `@neondatabase/serverless` 的 `sql` 標籤模板，一律**參數化**（`sql\`... where id = ${id}\``），**絕不字串拼接 SQL**；連線集中在 `server/utils/db.ts`。
- **認證自管**：登入 API 比對 `users` 表（密碼 argon2/bcrypt 雜湊，別存明文），用 `jose` 簽 JWT（HS256 + `NUXT_JWT_SECRET`）；`useAuth` 存 token cookie，`server/utils/requireUser` 驗 JWT。解 JWT 注意 **base64url**（含 `-` `_`，不能直接 `atob`）。
- 資料以 **user id**（JWT `sub`）為 key，不要用 email。
- **部分更新先讀舊值再合併**（`body.x ?? existing.x ?? default`，避免沒帶到的欄位被覆蓋清空）。

## 工作方式

- **部署前先確認，不擅自部署**；commit / push 需經同意。
- 錯誤不要靜默吞掉，要讓使用者看得到原因。
- 每做一段就 `npm run build` 驗證再往下。

## DRY / 抽共用（每做一個功能都要檢查）

專案越大，可共用的越多；靠複製貼上會變成「改 A、B 沒改」的 bug 溫床。做任何功能時：

- **保持輕量、別為了查而燒 token**：先看「共用基礎建設」清單（多半已在 context，Spinner/DataState/useDataTable/format… 直接用即可，免搜尋）；只有想寫的東西**不在清單上**時，才針對那**一個名稱** `grep` 一下確認。是快速 sanity check，不是完整稽核——別為了檢查去讀一堆檔。
- **動手前先查有沒有現成可用的**，別重刻：`grep` 關鍵名稱，掃 `app/components`、`app/composables`、`app/utils`、`server/utils`，以及本 skill 的 `template/`。
- **同一段資料或邏輯出現第 2 次，就抽成單一定義點**（改一處全變，杜絕改 A 忘 B）：
  - 通用（日期/金額格式化、驗證、共用型別…）→ `app/utils/*`；夠通用就**回饋到 skill 的 `template/app/utils/`** 讓其他專案也共用（例：`fmtDate`／`fmtMoney` 在 `app/utils/format.ts`）。
  - 領域對照（狀態/類型的 label 與樣式、選項清單）→ 專案內 `app/composables/useXxxMeta.ts`（領域專屬，不進 skill）。
  - 重複的畫面片段 → 抽成元件。
- **分清「資料」與「版面」**：資料/邏輯（label 對照、格式化、計算）**必須單一來源**；版面允許桌機表格 + 手機卡片兩套 markup，但都綁**同一份**資料與 helper（別各算一份）。
- **收尾自檢**：新增/改動後，`grep` 一下同一個 map/helper/型別是不是被貼了第二份；桌機與手機是否吃同一份資料。

---

## 共用基礎建設（正本在本 skill `template/`，鏡射專案路徑）

> 「每個後台長一致」的關鍵實體檔。取用/同步時從 `template/` 複製最新正本，勿自刻。

- `app/app.vue`：全域 `<style>`（禁縮放高光、16px 輸入、UI 禁選、overscroll、安全區 util、按壓回饋、頁面轉場）＋ `<NuxtLoadingIndicator>` 頂部進度條 ＋ `<NuxtPage :transition>`。
- `nuxt.config.ts`：`app.head`（viewport / theme-color / apple-*）與 `pwa` 設定。
- `app/layouts/default.vue`：外殼（sidebar + header + 底部導覽 + Toast host + 下拉刷新指示器）。
- `app/components/layout/{Sidebar,AppHeader,BottomNav}.vue`：導覽（項目改成該專案的）。
- `app/components/BottomSheet.vue`、`Toast.vue`＋`app/composables/useToast.ts`、`usePullToRefresh.ts`。
- `app/utils/format.ts`：通用格式化 helper（`fmtDate` 日期時間、`fmtMoney` 千分位），全站單一來源、Nuxt 自動匯入。
- Loading：`app/components/Spinner.vue`（size sm/md/lg）＋`DataState.vue`（載入/錯誤/空/內容四選一）＋`LoadingOverlay.vue`（登入導向全螢幕過場，複用 Spinner）。
- `app/composables/useDataTable.ts`（搜尋 `searchKeys` + 進階 `filter` + `sortAccessors` 排序 + 分頁，回傳 `rows`）＋配套 `app/components/SortableTh.vue`（可點排序表頭，自帶 ▲▼）＋ `app/components/TablePagination.vue`（分頁列）；桌機表格與手機卡片共用 `rows`。完整範例見 `template/app/pages/index.vue`。
- **DB**：`server/utils/db.ts`（Neon 連線）+ `users` 表 schema。
- **認證**：`app/composables/useAuth.ts`（token cookie）+ `app/composables/useAuthFetch.ts` + `app/plugins/authFetch.ts` + `server/utils/{auth,requireUser}.ts` + `server/api/auth/{login,register,me}`＋登入頁 `app/pages/login.vue`。
