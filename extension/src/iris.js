/**
 * iris çekirdeği — App Store Connect sekmesinin İÇİNDE koşar.
 *
 * Neden burada: iris/v1 çerezle korunuyor ve çerez httpOnly. Kod aynı origin'de
 * koştuğu için fetch onu kendisi taşır — kullanıcının girmesi gereken bir
 * anahtar, .env'e kopyalanacak bir sır, süresi dolacak bir token yok.
 *
 * Bu dosya tek bir şeyi yapar: Apple'a nazikçe istek atmak. Neyin çekileceği
 * endpoints.js'te, ne yapılacağı canary.js/collector.js'te.
 *
 * belkiPatlarız.md → R1 (hız sınırı), R6 (oturum), R11 (sayfalama)
 */
globalThis.__gl ??= {}

// KOŞULSUZ yeniden tanımlanır. "Zaten varsa dokunma" cazip görünüyor ama
// eklentiyi güncellediğinde sayfada ESKİ sürüm kalır ve düzeltmen hiç
// çalışmaz — teşhis edilmesi en zor hata türü. Yeniden tanımlamanın maliyeti
// yok: bu dosyada durum yalnızca sayaçlardan ibaret.
{
  // Apple'ın resmi olmayan ucu. Tarayıcının kendi davranışına yakın kal:
  // sıralı istek, arada nefes. Bu sayının altına İNME (belkiPatlarız R1).
  const THROTTLE_MS = 800

  // Tek çekimde bir listenin en fazla kaç sayfası izlenir. Sonsuz döngüye
  // ve farkında olmadan 500 isteklik bir tarama başlatmaya karşı emniyet.
  const MAX_PAGES = 40

  const state = {
    lastCall: 0,
    requests: 0,
    /** Doluysa bütün çağrılar reddedilir. 429 sonrası devam etmek yasak. */
    halted: '',
    /** Oturum gerçekten öldü mü. Tek bir 403 bunu KANITLAMAZ (aşağıya bak). */
    authFailed: false,
    /** Arka arkaya kaç yetki hatası geldi. Başarılı her istek sıfırlar. */
    authFails: 0,
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  /**
   * Tek istek. Fırlatmaz — sonucu nesne olarak döndürür ki çağıran
   * "hata mı, boş mu" ayrımını kendisi yapabilsin (R2: ikisi aynı şey değil).
   */
  async function raw(path) {
    if (state.halted) return { ok: false, status: 0, error: state.halted, halted: true }

    const wait = THROTTLE_MS - (Date.now() - state.lastCall)
    if (wait > 0) await sleep(wait)
    state.lastCall = Date.now()
    state.requests++

    let res
    try {
      // `method: 'GET'` AÇIKÇA yazılıyor. Varsayılan zaten GET ama bu bir
      // KAZA değil, bir SÖZ: bu eklenti App Store Connect'te hiçbir şeyi
      // değiştirmez, silmez, göndermez. Yalnızca okur.
      //
      // Şirket kurulumunda ilk sorulan soru bu ve cevabı doğrulanabilir
      // olmalı: iris'e giden TEK fetch burasıdır ve testi POST/PATCH/PUT/
      // DELETE geçmediğini her koşuda denetler. Bir gün yazma gerekirse
      // ayrı bir fonksiyon, ayrı bir onay ve ayrı bir test ister.
      res = await fetch(path, {
        method: 'GET',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
      })
    } catch (e) {
      return { ok: false, status: 0, error: `ağ hatası: ${e.message}` }
    }

    // 429: yeniden deneme YOK. Yavaşlamak da yok. Dururuz.
    if (res.status === 429) {
      state.halted =
        'Apple hız sınırı verdi (429). Çekim durduruldu — bugün bir daha deneme.'
      return { ok: false, status: 429, error: state.halted, halted: true }
    }
    // 401 ile 403 AYNI ŞEY DEĞİL:
    //   401 → oturum yok/düştü. Devam etmenin anlamı kalmaz.
    //   403 → oturum var ama BU kaynağa izin yok. iris bazı kaynakları
    //         doğrudan id ile vermiyor (ör. ageRatingDeclarations), yalnız
    //         include üzerinden veriyor. Tek bir 403 yüzünden turu kesmek,
    //         belkiPatlarız R5'in ("kırık uç turu düşürmesin") ihlalidir.
    //         Üst üste 3 tanesi ise gerçekten oturumun gittiğine işarettir.
    if (res.status === 401 || res.status === 403) {
      state.authFails++
      const forbidden = res.status === 403
      if (!forbidden || state.authFails >= 3) state.authFailed = true
      return {
        ok: false,
        status: res.status,
        forbidden,
        error: forbidden
          ? 'bu uca izin yok (403) — kaynak doğrudan okunamıyor olabilir'
          : "oturum reddedildi (401) — App Store Connect'e giriş yapılmamış",
      }
    }

    const text = await res.text()
    if (!res.ok) {
      return { ok: false, status: res.status, error: `${res.status} ${res.statusText}`, body: text.slice(0, 300) }
    }
    // Oturum düştüyse Apple JSON yerine giriş sayfasının HTML'ini döndürür.
    if (/^\s*</.test(text)) {
      state.authFailed = true
      return { ok: false, status: res.status, error: 'JSON yerine HTML döndü — oturum düşmüş olabilir' }
    }
    try {
      const json = JSON.parse(text)
      state.authFails = 0
      return { ok: true, status: res.status, json }
    } catch {
      return { ok: false, status: res.status, error: 'yanıt JSON olarak ayrıştırılamadı' }
    }
  }

  /**
   * links.next'i takip ederek tüm sayfaları toplar.
   *
   * meta.paging.total ile toplanan sayıyı karşılaştırıp döndürüyoruz: eksik
   * sayfalama sessiz veri kaybının en sık sebebi (R11). Çağıran "40 kayıt var
   * ama 20 topladım" durumunu görebilmeli.
   *
   * `opts.cap` = BİLEREK konan üst sınır. `limit=10` bir tavan DEĞİL, sayfa
   * boyutudur — burası `links.next`'i takip ettiği için 111 build ve 175 teklif
   * çekildiği görüldü (12+9 gereksiz istek, R1). Tavan isteyen çağıran bunu
   * açıkça söylemeli.
   *
   * `capped` ile `truncated` AYRI: biri "biz durduk", öteki "sınıra çarptık".
   * Bu yüzden bilerek durduğumuzda `shortfall` üretmiyoruz — o alan sessiz veri
   * kaybını gösterir, bilinçli tavanı değil (bkz. "gönderilmedi ≠ gönderilemedi").
   */
  async function getAll(path, opts = {}) {
    const cap = Number.isFinite(opts.cap) && opts.cap > 0 ? opts.cap : 0
    const first = await raw(path)
    if (!first.ok) return { ...first, data: [], included: [] }

    let payload = first.json
    const data = [...toArray(payload.data)]
    const included = [...(payload.included ?? [])]
    const total = payload.meta?.paging?.total
    let pages = 1
    let truncated = false

    while (payload.links?.next) {
      if (cap && data.length >= cap) break
      if (pages >= MAX_PAGES) {
        truncated = true
        break
      }
      const next = await raw(payload.links.next)
      if (!next.ok) return { ok: false, status: next.status, error: next.error, data, included, pages, total, truncated: true }
      payload = next.json
      data.push(...toArray(payload.data))
      included.push(...(payload.included ?? []))
      pages++
    }

    const kesildi = cap > 0 && data.length > cap
    const alinan = kesildi ? data.slice(0, cap) : data

    return {
      ok: true,
      status: first.status,
      data: alinan,
      included,
      pages,
      total: typeof total === 'number' ? total : null,
      truncated,
      /** Bilerek durduk: {alinan, toplam}. Çağıran bunu rapora yazmalı — sessiz tavan yok. */
      capped: cap && (kesildi || (typeof total === 'number' && total > alinan.length))
        ? { alinan: alinan.length, toplam: typeof total === 'number' ? total : null }
        : null,
      // R11: Apple "48 kayıt var" diyorsa ve elimizde 20 varsa, bu boş bir
      // liste kadar tehlikeli — sessizce eksik. Tavan koyduysak bu ayrı konu.
      shortfall:
        !cap && typeof total === 'number' && total > data.length ? total - data.length : 0,
    }
  }

  const toArray = (d) => (Array.isArray(d) ? d : d ? [d] : [])

  globalThis.__gl.iris = { raw, getAll, sleep, state, toArray, THROTTLE_MS, MAX_PAGES }
}
