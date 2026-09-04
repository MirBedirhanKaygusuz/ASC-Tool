/**
 * Service worker — yalnızca ulak.
 *
 * İşin kendisini ASC sekmesine enjekte edilen kod yapar; service worker sadece
 * sekmeyi bulur, kodu enjekte eder ve gelen mesajları saklar. Sebep
 * belkiPatlarız R7: MV3 worker'ı boşta ~30 saniyede kapatılıyor, dakikalarca
 * sürecek bir çekimi ona yaptırmak kırılgan olurdu. Sekmedeki kod ise sekme
 * açık kaldığı sürece yaşar.
 *
 * DURUM YAZIMI SIRAYA SOKULMUŞTUR — bunun bedelini bir kez ödedik:
 * her mesaj için "oku → değiştir → yaz" yapılıyordu ve mesajlar saniyede birkaç
 * tane geldiği için yazımlar birbirini eziyordu. `gl:probe` durumu okuduktan
 * SONRA `gl:canary:done` "running:false" yazıyor, ardından probe'un gecikmiş
 * yazımı "running:true"yu geri getiriyordu. Sonuç: tur bitmiş ama arayüz
 * sonsuza kadar "Yokluyor…" — kullanıcı kilitli. Artık bütün yazımlar tek bir
 * promise zincirinden geçiyor ve her biri durumu zincirin İÇİNDE okuyor.
 */

importScripts('src/store.js')

const KEY = 'gl:state'
const ASC = 'https://appstoreconnect.apple.com'

/**
 * Simge tıklaması yan paneli açar.
 *
 * `manifest.json`'da `action.default_popup` YOKTUR — varsa Chrome popup'ı
 * açar ve panel hiç görünmez. Popup zaten gereksiz bir ara duraktı.
 *
 * GERİ DÜŞME: `chrome.sidePanel` Chrome 114 ile geldi. Eski bir Chrome'da
 * simge ölü kalmasın diye AYNI SAYFAYI sekmede açıyoruz. `sidepanel.html`
 * bağımsız çalışıyor — panel API'si olmasa da her iş görülüyor, sadece
 * App Store Connect'in yanında değil sekmede. Çalışmayan bir düğme, eksik
 * bir özellikten kötüdür (belkiPatlarız R17).
 */
if (chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((e) => console.error('yan panel davranışı ayarlanamadı', e))
} else {
  chrome.action?.onClicked?.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') })
  })
}

const EMPTY = {
  /** 'canary' = uç yoklama turu · 'collect' = gerçek çekim */
  mode: '',
  running: false,
  phase: '',
  runId: '',
  codeVersion: '',
  log: [],
  probes: [],
  report: null,
  error: null,
  startedAt: null,
  updatedAt: null,
  // Çekim ilerlemesi
  appIndex: 0,
  appCount: 0,
  apps: [],
  yeniRed: 0,
  run: null,
}

async function getState() {
  const o = await chrome.storage.local.get(KEY)
  return { ...EMPTY, ...(o[KEY] ?? {}) }
}

/** Sıraya alınmış güncelleme. fn, zincirin içinde TAZE durumu alır. */
let queue = Promise.resolve()
function update(fn) {
  queue = queue
    .then(async () => {
      const cur = await getState()
      const next = fn(cur)
      if (!next) return // null döndürmek "bu mesajı yoksay" demek
      await chrome.storage.local.set({ [KEY]: { ...cur, ...next, updatedAt: Date.now() } })
    })
    .catch((e) => console.error('durum yazılamadı', e))
  return queue
}

const withLog = (s, text) => ({ log: [...s.log, text].slice(-200) })

/** Açık bir ASC sekmesi bul; yoksa aç ve yüklenmesini bekle. */
async function ensureAscTab() {
  const open = await chrome.tabs.query({ url: `${ASC}/*` })
  // Öndeki sekmeyi tercih et: kullanıcı bir uygulamanın sayfasını açtıysa
  // kanarya o uygulamayı yokluyor (endpoints.js → 'apps' adımı). Rastgele bir
  // arka plan sekmesi seçersek yanlış uygulamayı yoklarız.
  const existing = open.find((t) => t.active) ?? open[0]
  if (existing) return existing

  const tab = await chrome.tabs.create({ url: `${ASC}/apps`, active: true })
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdate)
      reject(new Error('Sekme 60 saniyede yüklenmedi. Giriş ekranında kalmış olabilirsin.'))
    }, 60_000)
    function onUpdate(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        clearTimeout(timer)
        chrome.tabs.onUpdated.removeListener(onUpdate)
        resolve()
      }
    }
    chrome.tabs.onUpdated.addListener(onUpdate)
  })
  return chrome.tabs.get(tab.id)
}

/** Sekmeyi hazırla, kodu enjekte et, koşmasını söyle. İki akış da bunu kullanır. */
async function launch({ mode, files, runMessage }) {
  const runId = `${Date.now()}`
  await update(() => ({ ...EMPTY, mode, running: true, runId, phase: 'sekme hazırlanıyor', startedAt: Date.now() }))
  try {
    const tab = await ensureAscTab()
    if (!tab.url?.startsWith(ASC)) {
      throw new Error('App Store Connect sekmesi bulunamadı. Giriş yapıp tekrar dene.')
    }
    await update((s) => withLog(s, `Sekme: ${tab.url.slice(0, 70)}`))
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files })
    const ack = await chrome.tabs.sendMessage(tab.id, { ...runMessage, runId })
    await update((s) => (s.runId !== runId ? null : { codeVersion: ack?.version ?? '?', phase: 'çalışıyor' }))
  } catch (e) {
    await update((s) => (s.runId !== runId ? null : { running: false, phase: '', error: e.message }))
  }
}

async function startCanary() {
  return launch({
    mode: 'canary',
    files: ['src/iris.js', 'src/endpoints.js', 'src/canary.js'],
    runMessage: { type: 'gl:canary:run' },
  })
}

/**
 * Çekim öncesi depo uyarısı.
 *
 * Kota dolduğunda IndexedDB yazması düşer ve çekim "başarılı" görünür (R3).
 * Yazma anındaki yakalama son savunma; bu ilk savunma: dolmaya YAKLAŞTIĞINDA
 * kullanıcı tura başlamadan görsün. ENGELLEMİYOR — tahmini kota tarayıcıya
 * göre değişiyor, yanlış bir eşik yüzünden çalışan bir çekimi durdurmak
 * kaçırılan veriden daha kötü.
 */
async function kotayiUyar() {
  const k = await GLStore.kota().catch(() => null)
  if (!k || !k.tavan) return
  const yuzde = Math.round(k.oran * 100)
  const mb = (n) => `${(n / 1048576).toFixed(0)} MB`
  if (k.oran >= 0.8) {
    await update((s) => withLog(
      s,
      `UYARI: depo %${yuzde} dolu (${mb(k.kullanilan)}/${mb(k.tavan)}). ` +
      'Dolarsa bölümler sessizce yazılamaz; Tam yedek alıp eski uygulamaları silin.',
    ))
  }
}

async function startCollect(options) {
  await kotayiUyar()
  return launch({
    mode: 'collect',
    // iap-price.bundle.js: fiyat zincirini çözen ORTAK kod (kaynağı
    // src/ext/iap-price.ts). Toplayıcı "include fiyatı getirdi mi?"
    // sorusunu bununla soruyor; eşleyici de aynı kodu kullanıyor.
    files: [
      'src/iris.js',
      'src/iap-price.bundle.js',
      // normalize.bundle.js: ham JSON:API kaydını sade kayda çeviren ORTAK kod
      // (kaynağı src/dump/normalize.ts). Toplayıcı depoya bunun çıktısını
      // yazar; görüntüleyici de eski kayıtları okurken aynısını kullanır.
      'src/normalize.bundle.js',
      'src/collector.js',
    ],
    runMessage: { type: 'gl:collect:run', options },
  })
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // --- Yan panelden -------------------------------------------------------
  if (msg?.type === 'gl:state') {
    getState().then(sendResponse)
    return true
  }
  if (msg?.type === 'gl:start') {
    startCanary()
    sendResponse({ ok: true })
    return true
  }
  if (msg?.type === 'gl:collectStart') {
    startCollect(msg.options ?? {})
    sendResponse({ ok: true })
    return true
  }
  if (msg?.type === 'gl:stats') {
    GLStore.stats().then(sendResponse).catch((e) => sendResponse({ error: e.message }))
    return true
  }

  // --- Sekmedeki koddan ---------------------------------------------------
  // Eski turun gecikmiş mesajları yenisini bozmasın: runId tutmuyorsa yoksay.
  const stale = (s) => msg.runId && s.runId && msg.runId !== s.runId

  if (msg?.type === 'gl:progress') {
    update((s) => (stale(s) ? null : { phase: `${msg.i}/${msg.n} · ${msg.label}` }))
    return
  }
  if (msg?.type === 'gl:probe') {
    update((s) => (stale(s) ? null : { probes: [...s.probes, msg.probe] }))
    return
  }
  if (msg?.type === 'gl:canary:done') {
    update((s) => (stale(s) ? null : { running: false, phase: 'bitti', report: msg.report }))
    return
  }
  if (msg?.type === 'gl:error') {
    update((s) => (stale(s) ? null : { running: false, phase: '', error: msg.message }))
    return
  }

  // --- Çekim akışı --------------------------------------------------------
  // Bu üçünde sendResponse'u YAZIM BİTİNCE çağırıyoruz: sekmedeki kod yanıtı
  // beklediği için doğal bir akış kontrolü oluşuyor. Böylece toplayıcı,
  // depo yetişemezken yüzlerce parçayı belleğe yığmıyor.
  if (msg?.type === 'gl:chunk') {
    GLStore.putRaw(msg.appId, msg.section, msg.data, msg.meta)
      .then(() => sendResponse({ ok: true }))
      // Yazma hatasının en olası sebebi kota. Sebebi cevaba koyuyoruz ki
      // toplayıcı "atlandı" satırına ne yazacağını bilsin — "bilinmeyen hata"
      // yazan bir kayıt, kullanıcıyı yanlış yere baktırır.
      .catch(async (e) => {
        const k = await GLStore.kota().catch(() => null)
        const kotaNotu = k && k.oran > 0.9
          ? ` (depo %${Math.round(k.oran * 100)} dolu — kota sınırı olabilir)`
          : ''
        sendResponse({ ok: false, error: `${e.message}${kotaNotu}` })
      })
    return true
  }
  if (msg?.type === 'gl:rejects') {
    GLStore.putRejects(msg.list)
      .then(({ added }) => {
        update((s) => (stale(s) ? null : { yeniRed: s.yeniRed + added }))
        sendResponse({ ok: true, added })
      })
      .catch((e) => sendResponse({ ok: false, error: e.message }))
    return true
  }
  if (msg?.type === 'gl:collect:appStart') {
    update((s) =>
      stale(s) ? null : { appIndex: msg.index, appCount: msg.total, phase: `${msg.index}/${msg.total} · ${msg.name}` },
    )
    return
  }
  if (msg?.type === 'gl:collect:progress') {
    update((s) => (stale(s) ? null : { phase: msg.text }))
    return
  }
  if (msg?.type === 'gl:collect:app') {
    GLStore.putApp(msg.app)
      .then(() => update((s) => (stale(s) ? null : { apps: [...s.apps, msg.app] })))
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message }))
    return true
  }
  if (msg?.type === 'gl:collect:done') {
    GLStore.putRun(msg.run)
      .then(() => update((s) => (stale(s) ? null : { running: false, phase: 'bitti', run: msg.run })))
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message }))
    return true
  }
})
