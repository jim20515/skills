import { onMounted, watch, type Ref } from 'vue'

// 依「登入者 user id + 清單 key」把一組搜尋／篩選／排序狀態存到 localStorage，
// 下次同一位使用者再進入同一清單時，自動還原上次的搜尋條件。
// 純前端、每位使用者各自獨立（同一台電腦換人登入不會互相看到）。
//
// 用法：把該頁的搜尋/篩選/排序 ref 交進來（reactive 物件用 toRefs 攤開）：
//   usePersistentFilters('orders', { search, statusFilter, sortKey, sortDir })
//   usePersistentFilters('members', { ...toRefs(filters), sortKey, sortDir })
export function usePersistentFilters(key: string, state: Record<string, Ref<any>>) {
  // 只在瀏覽器端運作（SSR 沒有 localStorage）
  if (!import.meta.client) return

  const { user } = useAuth() // 以 user id（JWT sub）為 key，不同帳號互相隔離
  const storageKey = () => {
    const id = user.value?.id
    return id ? `admin:filters:${key}:${id}` : null
  }

  const snapshot = () => {
    const out: Record<string, any> = {}
    for (const name in state) out[name] = state[name]!.value
    return out
  }
  // 進頁當下的原始狀態；若使用者在還原前就先自行改動，就不覆蓋他的操作
  const pristine = JSON.stringify(snapshot())
  let restored = false

  function restore() {
    if (restored) return
    const sk = storageKey()
    if (!sk) return // 還不知道是哪位使用者，等 user 就緒後由 watch 補試
    restored = true
    if (JSON.stringify(snapshot()) !== pristine) return // 使用者已互動，不蓋掉
    let saved: Record<string, any> | null = null
    try { saved = JSON.parse(localStorage.getItem(sk) || 'null') } catch { return }
    if (!saved) return
    for (const name in state) {
      if (Object.prototype.hasOwnProperty.call(saved, name)) state[name]!.value = saved[name]
    }
  }

  function persist() {
    const sk = storageKey()
    if (!sk) return
    try { localStorage.setItem(sk, JSON.stringify(snapshot())) } catch { /* 無痕模式/配額滿：略過 */ }
  }

  // 還原時機：掛載後才做（避免 hydration 不一致）；使用者較晚就緒時由 watch 補還原
  onMounted(restore)
  watch(() => user.value?.id, restore)
  // 任一條件變動就記住（還原本身觸發的寫回是同值，無害）
  watch(Object.values(state), persist)
}
