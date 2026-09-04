/**
 * ASC teşhis — asc-grab.js'i koşturmadan önce zeminin sağlam olduğunu doğrular.
 *
 * Neden ayrı: uçlar Apple'ın resmi olmayan iris API'si. Alan adları haber
 * verilmeden değişebilir. Bu snippet her adımda HAM cevabı basar; bir şey
 * tutmuyorsa hangi adımda tuttuğunu görürsün, 200 satır kodu debug etmezsin.
 *
 * Kullanım:
 *   npm run asc:probe   → panoya
 *   appstoreconnect.apple.com → DevTools Console → yapıştır
 */
;(async () => {
  const H = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  async function get(path, label) {
    await sleep(800)
    const res = await fetch(path, { headers: H, credentials: 'same-origin' })
    console.log(`%c${res.ok ? '✓' : '✗'} ${label}%c  ${res.status} ${path}`,
      `font-weight:bold;color:${res.ok ? '#2a7' : '#c33'}`, 'color:#888')
    if (!res.ok) throw new Error(`${label} başarısız: ${res.status}`)
    return res.json()
  }

  // 0) Oturum gerçekten kurulu mu, hangi takım seçili?
  const session = await get('/olympus/v1/session', 'oturum')
  console.log('   kullanıcı:', session?.user?.emailAddress ?? '?',
    '· takım:', session?.provider?.name ?? '?')

  // 1) Uygulamalar
  const url = new URL(location.href)
  const fromUrl = url.pathname.match(/\/apps\/(\d+)/)
  let appId = fromUrl?.[1]
  if (!appId) {
    const apps = await get('/iris/v1/apps?limit=200', 'uygulamalar')
    console.table((apps.data ?? []).map((a) => ({ id: a.id, ad: a.attributes?.name })))
    appId = apps.data?.[0]?.id
    console.log('%c   ilk uygulamayla devam:', 'color:#888', appId)
  }
  if (!appId) return console.log('%cUygulama bulunamadı.', 'color:#c60')

  // 2) Submission'lar — state alanı ve tarih formatı burada doğrulanır
  const subs = await get(
    `/iris/v1/apps/${appId}/reviewSubmissions?include=appStoreVersionForReview&limit=200`,
    'reviewSubmissions')
  console.log(`   ${subs.data?.length ?? 0} submission`)
  console.table((subs.data ?? []).map((s) => ({
    id: s.id, state: s.attributes?.state, tarih: s.attributes?.submittedDate })))

  // Red yaşamış submission'ları önceye al — thread'i olan bunlar.
  const ordered = [...(subs.data ?? [])].sort((a, b) =>
    (b.attributes?.state === 'UNRESOLVED_ISSUES' ? 1 : 0) -
    (a.attributes?.state === 'UNRESOLVED_ISSUES' ? 1 : 0))

  // 3) İlk thread'i bulana kadar submission'ları gez
  let thread = null
  for (const sub of ordered) {
    const threads = await get(
      `/iris/v1/resolutionCenterThreads?filter[reviewSubmission]=${sub.id}&include=reviewSubmission`,
      `thread (${sub.id})`)
    if (threads.data?.length) { thread = threads.data[0]; break }
  }
  if (!thread) {
    return console.log('%cHiçbir submission\'da Resolution Center thread\'i yok — ' +
      'bu hesapta hiç red yaşanmamış olabilir.', 'color:#c60')
  }
  console.log('   thread:', thread.id, thread.attributes)

  // 4) Kritik iki uç — asc-grab.js'in metni ve guideline kodunu aldığı yer
  const msgs = await get(
    `/iris/v1/resolutionCenterThreads/${thread.id}/resolutionCenterMessages` +
    `?include=fromActor,rejections&limit[rejections]=200`, 'mesajlar')
  console.log(`   ${msgs.data?.length ?? 0} mesaj · ilk mesajın attribute anahtarları:`,
    Object.keys(msgs.data?.[0]?.attributes ?? {}))
  console.log('   messageBody ilk 300 karakter:\n',
    String(msgs.data?.[0]?.attributes?.messageBody ?? '(yok)').slice(0, 300))

  const rej = await get(
    `/iris/v1/reviewRejections?filter[resolutionCenterMessage.resolutionCenterThread]=${thread.id}` +
    `&include=rejectionAttachments&limit=200`, 'reviewRejections')
  const attrs = rej.data?.[0]?.attributes ?? {}
  console.log('   rejection attribute anahtarları:', Object.keys(attrs))
  console.log('   sebepler:', attrs.reasons ?? attrs.reviewRejectionReasons ?? '(ikisi de yok — ALAN ADI DEĞİŞMİŞ)')

  console.log('%c\nZemin sağlam. Şimdi: npm run asc:copy', 'font-weight:bold;color:#2a7')
  window.__ascProbe = { session, subs, thread, msgs, rej }
})()
