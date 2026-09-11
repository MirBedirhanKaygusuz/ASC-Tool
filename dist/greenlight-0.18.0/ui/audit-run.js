/**
 * Denetimi çalıştıran ORTAK kod.
 *
 * NEDEN AYRI DOSYA: denetim artık iki yerden koşuyor — yan panel ve tam
 * sayfa. Aynı mantığı iki dosyaya kopyalasaydık ikisi kaçınılmaz olarak
 * ayrışırdı ve "panelde farklı, sayfada farklı sonuç" en kötü hata sınıfına
 * girerdi (kullanıcı hangisine inanacağını bilemez).
 *
 * Bu dosya SONUÇ üretir, ekrana hiçbir şey çizmez. Çizim ui/report.js'te.
 */

const GLRun = (() => {
  const AYAR_KEY = 'gl:settings'

  /**
   * Depodaki bölümleri eşleyicinin beklediği tek nesneye topla.
   *
   * BU LİSTE EKSİK KALIRSA VERİ SESSİZCE ÇÖPE GİDER. `iapPrices` aylarca
   * burada yoktu: toplayıcı ürün başına istek atıp fiyat çizelgelerini
   * topluyordu, eşleyici de onları okumaya hazırdı, ama arada bu liste vardı.
   * Sonuç iki kat yanlıştı — fiyatlar 0 kalıyordu VE kullanıcıya "fiyat
   * bölümü bu çekimde HİÇ YOK, yeniden çek" deniyordu.
   *
   * Kural: toplayıcı `put(<bölüm>)` yapıyorsa ya bu listede olacak ya da
   * neden olmadığı burada yazacak.
   */
  const DUMP_SECTIONS = [
    'app', 'appInfos', 'appInfoLocalizations', 'ageRating', 'versionAgeRating',
    'versions', 'versionTexts', 'screenshots', 'reviewDetail', 'icon',
    'subscriptions', 'iaps', 'iapPrices', 'builds', 'dataUsages',
    'customProductPages',
    // Bilerek DIŞARIDA: 'threads' ve 'submissions' (ders sistemine gidiyor,
    // denetime değil), 'stateChanges', 'eula', 'customerReviews' (henüz
    // eşleyicide karşılığı yok — eklenince buraya da eklenecek).
  ]

  async function ayarlar() {
    const o = await chrome.storage.local.get(AYAR_KEY)
    return o[AYAR_KEY] ?? {}
  }

  async function ayarlariYaz(a) {
    await chrome.storage.local.set({ [AYAR_KEY]: a })
    return a
  }

  /**
   * Eski çekimler de okunur: `sema` damgası yoksa kayıt OKUMA ANINDA
   * normalleştirilir. Yeniden çekim istemek, elde duran veriyi çöpe atıp
   * Apple'a gereksiz trafik göndermek olurdu (belkiPatlarız R1).
   */
  async function dumpOf(appId) {
    const dump = {}
    let eski = 0
    for (const s of DUMP_SECTIONS) {
      const row = await GLStore.getRaw(appId, s)
      if (!row) continue
      if (row.sema === GLNormalize.SEMA) {
        dump[s] = row.data
      } else {
        dump[s] = GLNormalize.normalizeSection(s, row.data).data
        eski++
      }
    }
    if (eski) console.info(`[greenlight] ${eski} bölüm eski biçimdeydi, okuma anında sadeleştirildi`)
    return dump
  }

  /**
   * Adres canlılık sınaması ağ izni ister. İzni KURULUMDA değil burada
   * istiyoruz: "tüm sitelere erişebilir" uyarısını kurulum ekranında görmek,
   * ofiste haklı olarak güveni sarsar. İzin verilmezse sınama yapılmaz ve
   * rapor bunu "denetlenmedi" diye yazar — çalışan adresi "ölü" göstermektense.
   */
  async function agIzni() {
    try {
      if (await chrome.permissions.contains({ origins: ['<all_urls>'] })) return true
      return await chrome.permissions.request({ origins: ['<all_urls>'] })
    } catch {
      return false
    }
  }

  /**
   * Ortak ders havuzuna bağlan ve TÜM dersleri çek.
   *
   * NEDEN BURADA: `GLAudit` ağa çıkmıyor (aynı kod terminalde de koşuyor,
   * orada ayarlar .env'den geliyor). Havuzu çekmek çağıranın işi.
   *
   * NEDEN allLessons (aktifler değil): denetim yalnız aktifleri kullanıyor
   * ama rapor "kaç ders onay bekliyor" ve "kaç kapsama boşluğu var"
   * diyebilmeli. İkisi de aktif listesinde GÖRÜNMEZ.
   *
   * Hata YUTULMUYOR: havuz kapalıysa denetim koşar ama rapor bunu yazar.
   * Sessizce derssiz koşmak, raporu olduğundan güvenilir gösterirdi.
   */
  async function havuzaBaglan(AYAR) {
    if (!AYAR.havuzUrl) return { dersler: undefined, havuz: undefined, uyari: undefined }
    if (!(await agIzni())) {
      return { dersler: undefined, havuz: undefined,
        uyari: 'Ortak ders havuzu okunamadı: ağ izni verilmedi. Denetim yalnız kural kartlarıyla koştu.' }
    }
    const havuz = new GLHavuz.RemoteLessonStore(AYAR.havuzUrl, AYAR.havuzToken ?? '')
    const sag = await havuz.healthcheck()
    if (!sag.ok) {
      return { dersler: undefined, havuz: undefined,
        uyari: `Ortak ders havuzuna ulaşılamadı (${sag.reason}). Denetim yalnız kural kartlarıyla koştu.` }
    }
    try {
      return { dersler: await havuz.allLessons(), havuz, uyari: undefined }
    } catch (e) {
      return { dersler: undefined, havuz: undefined,
        uyari: `Ortak ders havuzu okunamadı (${e.message}). Denetim yalnız kural kartlarıyla koştu.` }
    }
  }

  /**
   * Tek giriş noktası. `onProgress` model turunun satırlarını yayar.
   * Dönen nesne doğrudan GLReport.render'a verilir.
   */
  async function calistir(app, { onProgress } = {}) {
    const AYAR = await ayarlar()
    const probeUrls = await agIzni()
    const dump = await dumpOf(app.id)
    const meta = app.meta ?? {}

    if (AYAR.havuzUrl) onProgress?.('ortak ders havuzu okunuyor…')
    const { dersler, havuz, uyari } = await havuzaBaglan(AYAR)
    if (dersler) onProgress?.(`havuz: ${dersler.length} ders`)

    const ortak = { probeUrls, meta, dersler, dersUyarisi: uyari }

    const sonuc = AYAR.proxyUrl
      ? await GLAudit.fullAudit(dump, {
          ...ortak,
          havuz,
          proxy: { url: AYAR.proxyUrl, token: AYAR.proxyToken, imageDetail: AYAR.imageDetail },
          onProgress,
        })
      : await GLAudit.audit(dump, ortak)

    return { sonuc, probeUrls }
  }

  return { AYAR_KEY, DUMP_SECTIONS, ayarlar, ayarlariYaz, dumpOf, agIzni, havuzaBaglan, calistir }
})()

globalThis.GLRun = GLRun
