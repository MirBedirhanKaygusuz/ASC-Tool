/**
 * Toplayıcı — App Store Connect'in tamamını gezer.
 *
 * ASC sekmesinin İÇİNDE koşar (çerez orada), veriyi bölüm bölüm service
 * worker'a yollar, o da IndexedDB'ye yazar. Uygulama başına tek seferde değil
 * PARÇA PARÇA gönderilir: hem mesaj boyutu makul kalır, hem çekim yarıda
 * kesilse eldeki iş durur (belkiPatlarız R7, R12).
 *
 * ÜÇ KURAL — üçü de sahada öğrenildi, hiçbiri süs değil:
 *
 *  1. YOL TAHMİN ETME. JSON:API her ilişki için `links.related` veriyor.
 *     Varsa oradan git. Kanaryada 404 alan uçların TAMAMI benim adres
 *     uydurmamdan çıkmıştı (belkiPatlarız, 2026-08-20 dördüncü tur).
 *
 *  2. BOŞ İLE OKUNAMADI AYRI ŞEY. Her başarısız uç `atlandi[]`'ye, her
 *     şüpheli yanıt `supheli[]`'ye yazılır ve arayüzde görünür. Sessiz eksik
 *     veri bu projedeki en pahalı hata (R2, R3).
 *
 *  3. HACİM VARSAYILAN OLARAK DAR. Tek uygulamada 111 build, 17 dil, 175
 *     tanıtım teklifi gördük. Filtresiz "her şey" Apple'a yüzlerce istek
 *     demek — R1'e aykırı. Geniş çekim ayrı bir seçenek, varsayılan değil.
 */
globalThis.__gl ??= {}

{
  const VERSION = '0.2.0'
  const IRIS = '/iris/v1'

  /**
   * `app.supheli` ÜÇ FARKLI ŞEYİ TAŞIYOR. Ayırmazsak liste çöplük olur.
   *
   * SAHA HATASI (2026-08-21): panel "Şüpheli yanıtlar (5)" diyordu ve beşinin
   * BEŞİ de şüpheli değildi — ikisi bilerek konmuş hacim sınırı, üçü başarı
   * notuydu ("3 üründen 3'ünün fiyatı okundu" dahil). Yalancı alarm, eksik
   * alarmdan farklı bir yoldan aynı yere varır: liste okunmaz olur ve içine
   * düşen GERÇEK uyarı da görülmez.
   *
   *   'supheli' → beklenmedik. Veri yanlış ya da eksik olabilir. VARSAYILAN.
   *   'sinir'   → bilerek. Ayarlardaki hacim tavanı devreye girdi; beklenen
   *               davranış ama sayıların "en az" olduğunu bilmek gerekiyor.
   *   'not'     → tanı izi. Hangi yol çalıştı, kaç kayıt sadeleşti. Sorun yok.
   *
   * Emin değilsen 'supheli' bırak: fazla uyarmak, eksik uyarmaktan iyidir.
   */
  const DEFAULTS = {
    /** Kaç sürümün METNİ çekilsin (0 = yalnız güncel sürüm). */
    surumMetni: 3,
    /** Listing metinleri tüm dillerde mi, yalnız birincil dilde mi. */
    tumDiller: false,
    ekranGoruntuleri: true,
    /** Kullanıcı yorumları — denetimde kullanılmıyor, varsayılan kapalı. */
    yorumlar: false,
    /** Etkinlik, özel sayfa, deney, EULA, gizlilik beyanı. */
    ekstralar: true,
    /**
     * SAYFA BOYUTU (Apple'ın `limit` parametresi) — tavan DEĞİL.
     * Tavanı `buildTavani` koyuyor; ikisini karıştırmak 111 build çektirmişti.
     */
    buildLimit: 10,
    /** Kaç build saklanacak. İkon artık sürümden geliyor; build yalnız cihaz aileleri için. */
    buildTavani: 3,
    /**
     * Kaç tanıtım teklifi saklanacak. Apple teklifi ÜLKE BAŞINA bir satır
     * döndürüyor: tek bir haftalık teklif 175 satır olarak geldi, hepsi aynı.
     */
    teklifTavani: 30,
    /** Kaç özel ürün sayfası çekilsin. */
    ozelSayfaTavani: 12,
    /**
     * Özel ürün sayfalarının METİN ve GÖRSELLERİ de çekilsin mi?
     *
     * Varsayılan AÇIK: bu hesabın iki reddi tam oradan geldi ve sayfa kabuğu
     * tek başına hiçbir soruyu cevaplamıyor. Sayfa başına ~3 istek ekler.
     */
    ozelSayfaIcerigi: true,
    /**
     * Kaç sürümün durum geçmişi (ASC'nin "Activity" tablosu) çekilsin.
     *
     * Sürüm başına bir istek. "Kaç kez reddedildik" sorusunun tek doğru
     * kaynağı bu; tavan aşılırsa sayı EKSİK olur ve rapora öyle yazılır.
     */
    durumGecmisi: 25,
  }

  const iris = () => globalThis.__gl.iris
  const SCREENSHOT_EDGE = 900
  const ICON_EDGE = 512

  let runId = ''
  let emit = async () => {}

  const progress = (text, extra = {}) => emit({ type: 'gl:collect:progress', text, ...extra })

  // -------------------------------------------------------------------------
  // Graf gezintisi
  // -------------------------------------------------------------------------

  /** İlişkinin adresi: önce Apple'ın verdiği link, yoksa kurduğumuz yol. */
  function relPath(record, name, fallback) {
    const related = record?.relationships?.[name]?.links?.related
    return related || fallback || null
  }

  /**
   * Sorgu ekle. Doğrudan '?' yapıştırmak hataydı: Apple'ın verdiği `related`
   * linki kendi sorgusunu taşıyorsa ortaya iki '?' çıkar ve uç 400 döner.
   * Adresi biz kurmadığımız için biçimi hakkında varsayım da yapamayız.
   */
  function q(path, query) {
    if (!path) return null
    if (!query) return path
    return path + (path.includes('?') ? '&' : '?') + query.replace(/^[?&]/, '')
  }

  /**
   * Bir bölümü çek ve toleransı uygula.
   *
   * Dönüş null ise "okunamadı" demektir — çağıran boş dizi ile karıştırmasın.
   */
  async function take(app, section, path, opts = {}) {
    if (!path) {
      app.atlandi.push({ section, reason: 'bağımlı olduğu kimlik gelmedi' })
      return null
    }
    const r = await iris().getAll(path, { cap: opts.cap })

    if (!r.ok) {
      app.atlandi.push({ section, path: short(path), status: r.status, error: r.error })
      return null
    }
    if (r.shortfall) {
      app.supheli.push({ section, reason: `${r.shortfall} kayıt gelmedi (sayfalama)` })
    }
    if (r.truncated) {
      app.supheli.push({ section, reason: 'sayfa sınırına takıldı, liste eksik olabilir' })
    }
    // SESSİZ TAVAN YOK: bilerek durduysak bunu da yazıyoruz. "Bilerek almadık"
    // ile "alamadık" ayrı satırlar; ikisini aynı kovaya koymak yanlış alarm.
    if (r.capped) {
      app.supheli.push({
        section,
        tur: 'sinir',
        reason: `bilerek ilk ${r.capped.alinan} kayıt alındı${r.capped.toplam ? ` (toplam ${r.capped.toplam})` : ''}`,
      })
    }
    const first = r.data[0]
    if (first) {
      const attrs = Object.keys(first.attributes ?? {})
      const rels = Object.keys(first.relationships ?? {})
      if (!attrs.length && !rels.length) {
        app.supheli.push({ section, reason: 'kayıt var ama içi boş — include gerekiyor olabilir' })
      }
      for (const entry of opts.expect ?? []) {
        const alts = Array.isArray(entry) ? entry : [entry]
        if (!alts.some((k) => attrs.includes(k))) {
          app.supheli.push({ section, reason: `beklenen alan yok: ${alts.join('|')}` })
        }
      }
    }
    return r
  }

  const short = (p) => String(p).replace(/^https:\/\/[^/]+/, '').slice(0, 120)
  const byId = (list, type) => new Map((list ?? []).filter((r) => r.type === type).map((r) => [r.id, r]))

  /** imageAsset şablonu: ".../{w}x{h}{c}.{f}" — boyutu biz seçiyoruz. */
  function renderUrl(asset, maxEdge) {
    const tpl = asset?.templateUrl
    if (typeof tpl !== 'string') return ''
    const w = Number(asset.width) || 1290
    const h = Number(asset.height) || 2796
    const scale = Math.min(1, maxEdge / Math.max(w, h))
    return tpl
      .replace('{w}', String(Math.round(w * scale)))
      .replace('{h}', String(Math.round(h * scale)))
      .replace('{c}', 'bb')
      .replace('{f}', 'png')
  }

  function pickLocale(rows, locale) {
    const want = String(locale ?? '').toLowerCase()
    return (
      rows.find((r) => String(r.attributes?.locale ?? '').toLowerCase() === want) ??
      rows.find((r) => String(r.attributes?.locale ?? '').toLowerCase().startsWith(want.split('-')[0])) ??
      rows[0]
    )
  }

  // -------------------------------------------------------------------------
  // Red metni üretimi — biçim `learn`/ingest'in beklediği biçimdir, değiştirme
  // -------------------------------------------------------------------------

  function toPlainText(html) {
    if (!html) return ''
    const withBreaks = String(html)
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\s*\/\s*(p|div|li|tr|h[1-6])\s*>/gi, '\n')
      .replace(/<\s*li[^>]*>/gi, '- ')
      .replace(/(?:<[^>]*>)/g, '')
    const el = document.createElement('textarea')
    el.innerHTML = withBreaks
    return el.value
      .split('\n')
      .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  // Apple tek mesajda birden çok madde reddedebiliyor; learn bir metni tek red
  // sayıyor. Bölmezsek yalnız ilki ders olur, gerisi sessizce düşer.
  const GUIDELINE_LINE = /^[\s\d.)-]{0,6}Guideline\s+([0-9][0-9A-Za-z.()]*)[^\n]*$/gm
  const BOILERPLATE = /^(Resources|Support|Test on the latest betas)\s*$/m

  function splitByGuideline(text) {
    if (!text) return { preamble: '', blocks: [] }
    GUIDELINE_LINE.lastIndex = 0
    const hits = [...text.matchAll(GUIDELINE_LINE)]
    if (!hits.length) return { preamble: text.trim(), blocks: [] }
    const blocks = hits.map((hit, i) => {
      const end = i + 1 < hits.length ? hits[i + 1].index : text.length
      let body = text.slice(hit.index, end).trim()
      const cut = body.search(BOILERPLATE)
      if (cut > 0) body = body.slice(0, cut).trim()
      return { code: hit[1], body }
    })
    return { preamble: text.slice(0, hits[0].index).trim(), blocks }
  }

  const fieldFrom = (preamble, label) =>
    preamble.match(new RegExp(`^${label}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? ''

  function reasonsOf(resource) {
    const attrs = resource?.attributes ?? {}
    // İki isim de görüldü; hangisinin geleceği garanti değil (belkiPatlarız R2).
    const raw = attrs.reasons ?? attrs.reviewRejectionReasons
    if (!Array.isArray(raw)) return []
    return raw
      .map((r) => ({
        code: r?.reasonCode ?? '',
        section: r?.reasonSection ?? '',
        description: r?.reasonDescription ?? '',
      }))
      .filter((r) => r.code || r.section || r.description)
  }

  /**
   * Bir yazışmadan red metinleri üretir. id = thread:mesaj:parça (mükerrer engeli).
   *
   * YALNIZCA APPLE'IN YAZDIKLARI RED SAYILIR.
   *
   * Önceki sürüm "Apple mesajı yoksa hepsini al" diyordu ve geliştiricinin
   * kendi yazdığı notları "Apple'ın red gerekçesi" başlığıyla derse
   * çeviriyordu. Aynı karışıklık ürünün her yerine sızıyordu: geliştiricinin
   * geri çektiği (Developer Rejected) gönderimler, Apple reddi gibi
   * sayılıyordu. İkisi bambaşka şeyler — biri "Apple bunu kabul etmedi",
   * öteki "biz vazgeçtik".
   */
  function rejectTextsFrom(app, thread, messages, included, rejections) {
    const actors = new Map((included ?? []).filter((r) => /actor/i.test(r.type)).map((r) => [`${r.type}#${r.id}`, r]))
    const whoOf = (m) => {
      const ref = m.relationships?.fromActor?.data
      const a = ref ? actors.get(`${ref.type}#${ref.id}`) : null
      return String(a?.attributes?.actorType ?? '').toUpperCase()
    }

    const ordered = [...messages].sort((a, b) =>
      String(a.attributes?.createdDate ?? '').localeCompare(String(b.attributes?.createdDate ?? '')))
    const appleMsgs = ordered.filter((m) => whoOf(m) === 'APPLE')
    const devMsgs = ordered.filter((m) => whoOf(m) !== 'APPLE')

    // Geliştirici yanıtları maddeye göre indekslenir: dersin "neyle geçtik"
    // alanı buradan besleniyor.
    const devByCode = new Map()
    // Madde başlığı OLMAYAN yanıtlar. Geliştirici her zaman "Guideline 2.3.3"
    // diye yazmıyor; düz metin yazdığında eski kod yanıtı sessizce düşürüyordu.
    // Kaybedilen şey dersin "neyle geçtik" alanı — suggestedFix'i gerçekçi
    // yapan tek bilgi. Hangi maddeye ait olduğunu bilemediğimiz için tüm
    // maddelere, GENEL etiketiyle ekliyoruz: yanlış atıf, kayıp bilgiden iyidir
    // ve etiket sayesinde model de bunu biliyor.
    const devGenel = []
    for (const m of devMsgs) {
      const plain = toPlainText(m.attributes?.messageBody)
      const { blocks } = splitByGuideline(plain)
      const date = m.attributes?.createdDate ?? ''
      if (!blocks.length) {
        if (plain.trim()) devGenel.push({ date, body: plain })
        continue
      }
      for (const b of blocks) {
        devByCode.set(b.code, [...(devByCode.get(b.code) ?? []), { date, body: b.body }])
      }
    }

    const allReasons = (rejections ?? []).flatMap(reasonsOf)
    const seen = new Set()
    const reasons = allReasons.filter((r) => {
      const k = `${r.code}|${r.section}|${r.description}`
      return seen.has(k) ? false : (seen.add(k), true)
    })

    const out = []
    if (!appleMsgs.length) {
      // Apple hiç yazmamışsa bu bir red yazışması değil. Sessizce atlamıyoruz:
      // "red yok" ile "burada red aramadık" ayrı şeyler.
      app.supheli.push({
        section: `thread:${thread.id}`,
        reason: `yazışmada Apple mesajı yok (${messages.length} mesaj, tip: ${thread.attributes?.threadType ?? '?'}) — red sayılmadı`,
      })
      return out
    }
    for (const msg of appleMsgs) {
      const plain = toPlainText(msg.attributes?.messageBody)
      const { preamble, blocks } = splitByGuideline(plain)
      const rejectedAt = String(msg.attributes?.createdDate ?? '').slice(0, 10) || 'tarihsiz'
      const device = fieldFrom(preamble, 'Review Device')
      const reviewed = fieldFrom(preamble, 'Version reviewed')
      const parts = blocks.length ? blocks : [{ code: '', body: plain }]

      for (const [i, part] of parts.entries()) {
        const L = []
        L.push(`App: ${app.name}`)
        L.push('Platform: IOS')
        if (part.code) L.push(`Guideline: ${part.code}`)
        L.push(`Reddedilme: ${rejectedAt}`)
        if (reviewed) L.push(`Version: ${reviewed}`)
        if (device) L.push(`Review Device: ${device}`)
        L.push(`Thread: ${thread.id}`)
        L.push(`Message: ${msg.id}`)
        // Kaynağı metne yaz: ders çıkaran model de, raporu okuyan insan da
        // bunun Apple'ın reddi olduğunu görsün.
        L.push('Kaynak: Apple App Review')
        if (thread.attributes?.threadType) L.push(`Yazışma tipi: ${thread.attributes.threadType}`)
        const tag = reasons.find(
          (r) => part.code && r.code.startsWith(part.code.split('(')[0].slice(0, 3)),
        )
        if (tag) L.push(`Apple etiketi: ${tag.code}${tag.description ? ` — ${tag.description}` : ''}`)
        L.push('')
        L.push("=== Apple'ın red gerekçesi ===")
        L.push(part.body)
        L.push('')
        for (const r of devByCode.get(part.code) ?? []) {
          L.push(`=== Geliştirici yanıtı (${String(r.date).slice(0, 10)}) ===`)
          L.push(r.body)
          L.push('')
        }
        for (const r of devGenel) {
          L.push(`=== Geliştirici yanıtı — genel, madde belirtilmemiş (${String(r.date).slice(0, 10)}) ===`)
          L.push(r.body)
          L.push('')
        }
        out.push({
          id: `${thread.id}:${msg.id}:${i}`,
          appId: app.id,
          appName: app.name,
          guideline: part.code || '',
          rejectedAt: rejectedAt === 'tarihsiz' ? null : rejectedAt,
          threadId: thread.id,
          messageId: msg.id,
          threadType: thread.attributes?.threadType ?? '',
          kaynak: 'apple',
          text: L.join('\n').trim() + '\n',
        })
      }
    }
    return out
  }

  // -------------------------------------------------------------------------
  // Uygulama çekimi
  // -------------------------------------------------------------------------

  async function collectApp(record, opts) {
    const app = {
      id: record.id,
      name: String(record.attributes?.name ?? record.id),
      bundleId: String(record.attributes?.bundleId ?? ''),
      primaryLocale: String(record.attributes?.primaryLocale ?? 'en-US'),
      sku: String(record.attributes?.sku ?? ''),
      storeUrl: String(record.attributes?.storeUrl ?? ''),
      fetchedAt: Date.now(),
      atlandi: [],
      supheli: [],
      istek: 0,
      sayilar: {},
    }
    const istekBaslangic = iris().state.requests
    /**
     * Bölümü depoya yolla — SADELEŞTİREREK.
     *
     * Ham JSON:API kaydının %76'sı zarf (links, boş relationships, ayrı
     * duran included havuzları) ve denetim onların hiçbirini okumuyor.
     * Sadeleştirme burada, `put()` SINIRINDA yapılır; kaydın kendisinde
     * DEĞİL. Sebep: gezinti sırasında `relPath()` canlı kayıttan
     * `links.related` okuyor — kaydı yerinde değiştirseydik yol uydurmaya
     * dönerdik (kanaryadaki 404'lerin sebebi buydu).
     *
     * `sema: 2` damgası satıra gider; görüntüleyici eski (sema 1) kayıtları
     * okuma anında aynı koddan geçirir, yeniden çekim gerekmez.
     */
    const put = (section, data, meta) => {
      const N = globalThis.GLNormalize
      if (!N) {
        // Sessizce ham yazmıyoruz: paket enjekte edilmemişse bunu söylüyoruz.
        app.supheli.push({ section, reason: 'normalleştirici (GLNormalize) yüklenmedi — ham yazıldı' })
        return emit({ type: 'gl:chunk', appId: app.id, section, data, meta })
      }
      const { data: sade, notlar } = N.normalizeSection(section, data)
      // Normalleştirici notları iki cinstir ve modül bunu bize söylemiyor
      // (ortak TypeScript kaynağı; orada değiştirmek başka tüketicileri de
      // etkiler). Burada, DAR ve AÇIK bir kalıpla ayırıyoruz. Tanımadığımız
      // her not 'supheli' kalır — fazla uyarmak, eksik uyarmaktan iyidir.
      const IZ = /tekil teklife indi$/
      for (const not of notlar) {
        app.supheli.push({ section, tur: IZ.test(not) ? 'not' : 'supheli', reason: not })
      }
      return yazimiDogrula(section, emit({
        type: 'gl:chunk', appId: app.id, section, data: sade,
        meta: { ...meta, sema: N.SEMA },
      }))
    }

    /** Depo yazması düştüyse bölümü "atlandı" say — çekildi sanmayalım. */
    const yazimiDogrula = async (section, sozu) => {
      const res = await sozu
      if (res && res.ok === false) {
        app.atlandi.push({ section, reason: `depoya yazılamadı: ${res.error ?? 'sebep bilinmiyor'}` })
      }
      return res
    }
    await put('app', record)

    // --- appInfo ağacı ------------------------------------------------------
    progress(`${app.name}: künye ve kategori`, { app: app.name })
    const infos = await take(
      app, 'appInfos',
      q(relPath(record, 'appInfos', `${IRIS}/apps/${app.id}/appInfos`), 'include=primaryCategory,secondaryCategory,ageRatingDeclaration'),
      { expect: ['appStoreState'] },
    )
    if (infos) {
      await put('appInfos', { data: infos.data, included: infos.included })
      const info = infos.data[0]
      const ageRating = infos.included.find((r) => r.type === 'ageRatingDeclarations')
      if (ageRating) await put('ageRating', ageRating)
      else app.supheli.push({ section: 'ageRating', reason: 'yaş sınırı beyanı include ile gelmedi' })

      // info yoksa yol kurma: "/appInfos/undefined/..." diye bir istek atmak,
      // Apple'a çöp trafik göndermek ve hatayı yanlış yere yazmaktır.
      const locs = info
        ? await take(
            app, 'appInfoLocalizations',
            q(relPath(info, 'appInfoLocalizations', `${IRIS}/appInfos/${info.id}/appInfoLocalizations`), 'limit=200'),
            { expect: ['locale', 'name'] },
          )
        : null
      if (locs) {
        await put('appInfoLocalizations', locs.data)
        // Künye dili (ad, altyazı, kategori) — sürüm METNİ dilinden AYRI.
        // Bu hesapta künye 17 dilde ama yayındaki 2.0.7'nin açıklama/anahtar
        // kelime metni yalnız 1 dilde. Tek "17 dil" sayısı, denetimin 17 dil
        // metni gördüğünü sandırıyordu.
        app.sayilar.diller = locs.data.length
      }
    }

    // --- Sürümler: tam geçmiş, metinler son N sürüm için --------------------
    progress(`${app.name}: sürüm geçmişi`, { app: app.name })
    const versions = await take(
      app, 'versions',
      q(relPath(record, 'appStoreVersions', `${IRIS}/apps/${app.id}/appStoreVersions`), 'limit=200'),
      { expect: [['appVersionState', 'appStoreState'], 'versionString'] },
    )
    const versionList = versions?.data ?? []
    if (versions) {
      await put('versions', versionList)
      app.sayilar.surumler = versionList.length
    }

    // --- Durum geçmişi: "kaç kez reddedildik"in TEK doğru kaynağı ----------
    //
    // Eskiden sayaç sürümün ANLIK durumuna bakıyordu
    // (`appVersionState === 'REJECTED'`). Reddedilip sonra onaylanan bir sürüm
    // bugün READY_FOR_DISTRIBUTION görünüyor, yani sayaç sıfır diyordu. Sahada
    // tam bu oldu: ASC'nin Activity tablosunda 3 "Rejected" ve 5 "Developer
    // Rejected" varken panel "0 geri çekildi" gösteriyordu.
    //
    // Doğru kaynak sürüm başına `appStoreVersionStateChanges` — ASC'nin
    // Activity tablosunun ta kendisi. Sürüm başına bir istek; tavanlı.
    //
    // Sayım DURUM ADINA bakıyor, `initiator`a değil: eski kayıtlarda (2025)
    // Apple'ın User kolonu boş geliyor, initiator'a güvenen bir sayım o
    // sürümleri kaçırırdı. Üstelik initiator kişisel veri (R4).
    progress(`${app.name}: durum geçmişi`, { app: app.name })
    const durumTavani = Math.max(1, opts.durumGecmisi ?? 25)
    const gecmisSurumleri = versionList.slice(0, durumTavani)
    if (versionList.length > gecmisSurumleri.length) {
      app.supheli.push({
        section: 'stateChanges',
        tur: 'sinir',
        reason: `${versionList.length} sürümün ilk ${gecmisSurumleri.length} tanesinin geçmişi çekildi — ` +
          'red sayıları bu pencereyi kapsıyor',
      })
    }
    const gecmis = []
    let gecmisiOkunmayan = 0
    for (const v of gecmisSurumleri) {
      const surumAdi = v.attributes?.versionString ?? v.id
      const changes = await take(
        app, `stateChanges:${surumAdi}`,
        q(relPath(v, 'appStoreVersionStateChanges', `${IRIS}/appStoreVersions/${v.id}/appStoreVersionStateChanges`), 'limit=200'),
      )
      if (!changes) { gecmisiOkunmayan++; continue }
      gecmis.push({ versionId: v.id, versionString: surumAdi, olaylar: changes.data })
    }
    if (gecmis.length) await put('stateChanges', gecmis)

    // Apple reddi ile geliştiricinin kendi geri çekmesi AYRI SAYILIR. Aynı
    // kovaya koymak "kaç kez Apple reddetti" sorusunu yanlış cevaplatıyor.
    const RED_APPLE = /^(REJECTED|METADATA_REJECTED)$/
    const olaylar = gecmis.flatMap((g) => g.olaylar ?? [])
    const olayDurumu = (o) => String(o.attributes?.appVersionState ?? o.attributes?.appStoreState ?? '')
    if (gecmis.length) {
      app.sayilar.appleReddi = olaylar.filter((o) => RED_APPLE.test(olayDurumu(o))).length
      app.sayilar.geriCekilen = olaylar.filter((o) => olayDurumu(o) === 'DEVELOPER_REJECTED').length
    }
    if (gecmisiOkunmayan) {
      // Eksik geçmişle "3 red" demek, "en az 3" demeyi "tam 3" gibi gösterir.
      app.supheli.push({
        section: 'stateChanges',
        reason: `${gecmisiOkunmayan} sürümün durum geçmişi okunamadı — red sayıları EKSİK olabilir`,
      })
    }

    const current = versionList[0] ?? null
    const textVersions = versionList.slice(0, Math.max(1, opts.surumMetni || 1))
    const texts = []
    for (const v of textVersions) {
      const r = await take(
        app, `versionTexts:${v.attributes?.versionString}`,
        q(relPath(v, 'appStoreVersionLocalizations', `${IRIS}/appStoreVersions/${v.id}/appStoreVersionLocalizations`), 'limit=200'),
        { expect: ['locale', 'description'] },
      )
      if (!r) continue
      const rows = opts.tumDiller ? r.data : [pickLocale(r.data, app.primaryLocale)].filter(Boolean)
      texts.push({
        versionId: v.id,
        versionString: v.attributes?.versionString ?? '',
        state: v.attributes?.appVersionState ?? v.attributes?.appStoreState ?? '',
        createdDate: v.attributes?.createdDate ?? '',
        toplamDil: r.data.length,
        locales: rows,
      })
    }
    if (texts.length) {
      await put('versionTexts', texts)
      // Denetimin gerçekten okuduğu metin bu: yayındaki sürümün listing dili.
      app.sayilar.surumDili = texts[0]?.toplamDil ?? 0
    }

    // --- Ekran görüntüleri: güncel sürüm ------------------------------------
    if (opts.ekranGoruntuleri && texts[0]?.locales?.length) {
      progress(`${app.name}: ekran görüntüleri`, { app: app.name })
      const shots = []
      for (const loc of texts[0].locales) {
        const sets = await take(
          app, `screenshots:${loc.attributes?.locale}`,
          q(relPath(loc, 'appScreenshotSets', `${IRIS}/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`), 'include=appScreenshots&limit=50'),
        )
        if (!sets) continue
        const imgs = byId(sets.included, 'appScreenshots')
        for (const set of sets.data) {
          const refs = set.relationships?.appScreenshots?.data ?? []
          shots.push({
            locale: loc.attributes?.locale ?? '',
            displayType: set.attributes?.screenshotDisplayType ?? '',
            images: refs
              .map((ref) => imgs.get(ref.id))
              .filter(Boolean)
              .map((img, i) => ({
                id: img.id,
                order: i + 1,
                fileName: img.attributes?.fileName ?? '',
                url: renderUrl(img.attributes?.imageAsset, SCREENSHOT_EDGE),
                width: img.attributes?.imageAsset?.width,
                height: img.attributes?.imageAsset?.height,
                state: img.attributes?.assetDeliveryState?.state ?? '',
              })),
          })
        }
      }
      if (shots.length) {
        await put('screenshots', shots)
        app.sayilar.ekranGoruntusu = shots.reduce((n, s) => n + s.images.length, 0)
      }
    }

    // --- Review detayı, durum geçmişi, ikon ---------------------------------
    if (current) {
      const detail = await take(
        app, 'reviewDetail',
        relPath(current, 'appStoreReviewDetail', `${IRIS}/appStoreVersions/${current.id}/appStoreReviewDetail`),
      )
      if (detail?.data.length) await put('reviewDetail', detail.data[0])

      const ageV = await take(
        app, 'versionAgeRating',
        relPath(current, 'ageRatingDeclaration', `${IRIS}/appStoreVersions/${current.id}/ageRatingDeclaration`),
        { expect: ['userGeneratedContent'] },
      )
      if (ageV?.data.length) await put('versionAgeRating', ageV.data[0])
    }

    // --- İkon ve build'ler ---------------------------------------------------
    //
    // İkonu ÖNCE sürümden alıyoruz: `appStoreVersions[].storeIcon` zaten
    // 1024×1024 bir templateUrl taşıyor. Eskiden ikon için build zinciri
    // izleniyordu ve `limit` bir tavan sanılmıştı — `links.next` takip edildiği
    // için 111 build (417 KB, 12 istek) çekiliyordu. İkon için hiçbiri gerekli
    // değildi.
    const storeIcon = current?.attributes?.storeIcon
    if (storeIcon?.templateUrl) {
      await put('icon', {
        id: current.id,
        url: renderUrl(storeIcon, ICON_EDGE),
        iconType: 'APP_STORE',
        kaynak: 'appStoreVersions.storeIcon',
      })
    }

    // Build'ler yine de lazım ama BAŞKA bir şey için: `deviceFamilies` (hangi
    // cihazlar destekleniyor) ekran görüntüsü setleriyle çelişebiliyor — 2.3.3.
    // Bunun için son birkaç build yeter.
    const builds = await take(
      app, 'builds',
      q(relPath(record, 'builds', `${IRIS}/apps/${app.id}/builds`), `limit=${opts.buildLimit}`),
      { cap: opts.buildTavani },
    )
    if (builds?.data.length) {
      await put('builds', builds.data)

      // İkon sürümden gelmediyse eski zincire düş — sessizce ikonsuz kalmak yok.
      if (!storeIcon?.templateUrl) {
        const icons = await take(
          app, 'icon',
          relPath(builds.data[0], 'icons', `${IRIS}/builds/${builds.data[0].id}/icons`),
        )
        const chosen =
          icons?.data.find((i) => String(i.attributes?.iconType ?? '') === 'APP_STORE') ?? icons?.data[0]
        if (chosen) {
          await put('icon', {
            id: chosen.id,
            url: renderUrl(chosen.attributes?.iconAsset, ICON_EDGE),
            iconType: chosen.attributes?.iconType ?? '',
            kaynak: 'builds.icons',
          })
        }
      }
    }

    // --- Red geçmişi: projenin asıl hazinesi --------------------------------
    progress(`${app.name}: red geçmişi`, { app: app.name })
    const subs = await take(
      app, 'submissions',
      q(relPath(record, 'reviewSubmissions', `${IRIS}/apps/${app.id}/reviewSubmissions`), 'include=appStoreVersionForReview&limit=200'),
      { expect: ['state'] },
    )
    if (subs) {
      await put('submissions', { data: subs.data, included: subs.included })
      app.sayilar.gonderimler = subs.data.length
    }

    const threads = await take(
      app, 'threads',
      q(relPath(record, 'resolutionCenterThreads', `${IRIS}/apps/${app.id}/resolutionCenterThreads`), 'limit=200'),
    )
    const yazismalar = []
    const rejectTexts = []
    for (const thread of threads?.data ?? []) {
      const messages = await take(
        app, `messages:${thread.id}`,
        q(relPath(thread, 'resolutionCenterMessages', `${IRIS}/resolutionCenterThreads/${thread.id}/resolutionCenterMessages`), 'include=fromActor,rejections&limit[rejections]=200'),
        { expect: ['messageBody'] },
      )
      if (!messages) continue
      const rejections = await take(
        app, `rejections:${thread.id}`,
        `${IRIS}/reviewRejections?filter[resolutionCenterMessage.resolutionCenterThread]=${thread.id}` +
          '&include=rejectionAttachments&limit=200',
      )
      yazismalar.push({
        thread,
        messages: messages.data,
        included: messages.included,
        rejections: rejections?.data ?? [],
      })
      rejectTexts.push(
        ...rejectTextsFrom(app, thread, messages.data, messages.included, [
          ...(rejections?.data ?? []),
          ...messages.included.filter((r) => /rejection/i.test(r.type)),
        ]),
      )
    }
    if (yazismalar.length) await put('threads', yazismalar)
    if (rejectTexts.length) {
      await emit({ type: 'gl:rejects', appId: app.id, list: rejectTexts })
      app.sayilar.redler = rejectTexts.length
    }

    // --- Para -------------------------------------------------------------
    progress(`${app.name}: abonelikler ve ürünler`, { app: app.name })
    const groups = await take(
      app, 'subscriptionGroups',
      q(relPath(record, 'subscriptionGroups', `${IRIS}/apps/${app.id}/subscriptionGroups`), 'include=subscriptions&limit=50'),
    )
    const abonelikler = []
    for (const sub of groups?.included.filter((r) => r.type === 'subscriptions') ?? []) {
      const locs = await take(
        app, `subLocales:${sub.id}`,
        q(relPath(sub, 'subscriptionLocalizations', `${IRIS}/subscriptions/${sub.id}/subscriptionLocalizations`), 'limit=50'),
      )
      const prices = await take(
        app, `subPrice:${sub.id}`,
        q(relPath(sub, 'prices', `${IRIS}/subscriptions/${sub.id}/prices`), 'include=subscriptionPricePoint&filter[territory]=USA&limit=10'),
      )
      // 175 kayıt görüldü (Dance AI) ve `limit=20` bunu DURDURMUYORDU: o sayfa
      // boyutu, `links.next` takip ediliyor. Teklif ülke başına bir satır
      // olduğu için 175'in tamamı aynı teklifti. Gerçek tavan `cap` ile.
      const offers = await take(
        app, `subOffers:${sub.id}`,
        q(relPath(sub, 'introductoryOffers', `${IRIS}/subscriptions/${sub.id}/introductoryOffers`), 'limit=20'),
        { cap: opts.teklifTavani },
      )
      // ABONELİK FİYATI — "havuzdaki ilk fiyat noktası" DEĞİL.
      //
      // Apple bir abonelik için birden çok fiyat kaydı döndürüyor: eski
      // abonelere korunan (preserved) fiyat ve yeni müşterinin ödediği
      // fiyat. Havuzdan ilkini almak korunmuş fiyatı yazıyordu — Weekly
      // Pack raporda 5.99, App Store'da 14.99 (2026-08-21).
      //
      // Seçimi yapan kod resmi API yolunun kullandığının AYNISI
      // (src/iap-price.ts → GLPrice): iki yolun farklı fiyat söylemesi
      // kabul edilemez.
      const secim = globalThis.GLPrice?.pickCurrentPrice(prices?.data ?? [])
      const pointId = secim?.record?.relationships?.subscriptionPricePoint?.data?.id
      const point = pointId
        ? (prices?.included ?? []).find((r) => r.id === pointId)
        : // Çözücü yoksa fiyatı UYDURMUYORUZ: tek kayıt varsa onu okuruz,
          // birden çoksa hangisinin geçerli olduğunu bilemeyiz.
          (prices?.data ?? []).length === 1
          ? (prices?.included ?? []).find((r) => r.type === 'subscriptionPricePoints')
          : null
      if (!point && (prices?.data ?? []).length) {
        app.supheli.push({
          section: `subPrice:${sub.id}`,
          reason: 'fiyat kaydı var ama bugün geçerli olanı seçilemedi',
        })
      }
      if (secim?.note) {
        app.supheli.push({ section: `subPrice:${sub.id}`, reason: secim.note })
      }
      abonelikler.push({
        id: sub.id,
        productId: sub.attributes?.productId ?? '',
        name: sub.attributes?.name ?? '',
        period: sub.attributes?.subscriptionPeriod ?? '',
        state: sub.attributes?.state ?? '',
        locales: locs?.data ?? [],
        price: point
          ? {
              customerPrice: point.attributes?.customerPrice,
              currency: point.attributes?.currency,
              proceeds: point.attributes?.proceeds,
            }
          : null,
        offers: (offers?.data ?? []).map((o) => o.attributes),
      })
    }
    if (abonelikler.length) {
      await put('subscriptions', abonelikler)
      app.sayilar.abonelikler = abonelikler.length
    }

    // Önce fiyat çizelgesini include ile istiyoruz: tutarsa ürün başına ek
    // istek hiç gerekmez. iris bu include'u tanımazsa 400 döner ve TÜM ürün
    // listesini kaybederiz — bu yüzden başarısızlıkta sade sürümle tekrar.
    const iapBase = relPath(record, 'inAppPurchasesV2', `${IRIS}/apps/${app.id}/inAppPurchasesV2`)
    let iaps = await take(
      app, 'iaps',
      q(iapBase, 'include=inAppPurchaseLocalizations,iapPriceSchedule&limit=200'),
      { expect: ['productId'] },
    )
    if (!iaps) {
      iaps = await take(
        app, 'iaps',
        q(iapBase, 'include=inAppPurchaseLocalizations&limit=200'),
        { expect: ['productId'] },
      )
    }
    if (iaps) {
      await put('iaps', { data: iaps.data, included: iaps.included })
      app.sayilar.urunler = iaps.data.length

      // IAP FİYATLARI — dördüncü deneme. Üçüncüsü sessizce sıfır yazıyordu.
      //
      // Geçmiş: (1) "iris bu ucu vermiyor" dedim, yolu ben uydurmuştum.
      // (2) `links.related` üzerinden gitmeyi denedim, o link her zaman
      // gelmiyor. (3) Ürün listesini `include=iapPriceSchedule` ile isteyip
      // "include tuttu, istek atmaya gerek yok" dedim.
      //
      // ÜÇÜNCÜSÜNÜN HATASI: "include tuttu" testi yanlıştı. Havuzda
      // `iapPriceSchedules` TİPİNDE bir kayıt görmeyi yeterli saydım. Oysa
      // Apple çizelgenin KABUĞUNU gönderiyor, fiyat noktasını göndermiyor:
      // zincir (ürün → çizelge → fiyat → fiyat noktası) havuzda kopuk
      // kalıyor. Sonuç: toplayıcı "fiyat geldi" deyip ürün başına istek
      // atmıyor, eşleyici aynı veriden fiyatı okuyamıyor, rapor her ürüne
      // `price=0` yazıyor. Sessiz veri bozulmasının ta kendisi (R3).
      //
      // DOĞRUSU: testi "fiyat OKUNABİLİYOR mu" diye sor. Testi yapan kod
      // eşleyicinin kullandığı kodun AYNISI (src/ext/iap-price.ts, buraya
      // GLPrice olarak enjekte ediliyor) — iki ayrı kopya olsaydı ikisi
      // yeniden ayrışırdı.
      const cozucu = globalThis.GLPrice
      if (!cozucu) {
        // Enjeksiyon listesi eksikse durmuyoruz ama bunu söylüyoruz: her
        // ürüne ayrı istek gider (yavaş ama doğru), sessiz sıfır olmaz.
        app.supheli.push({
          section: 'iapPrices',
          reason: 'fiyat çözücü (GLPrice) yüklenmedi — her ürün için ayrı istek atılıyor',
        })
      }

      // Yol tahmini yerine ADAY DENEMESİ: birkaç adayı sırayla dene, ilk
      // tutanı öğren, kalan ürünlerde yalnız onu kullan. Hiçbiri tutmazsa
      // "okunamadı" deriz — sessizce sıfır yazmayız.
      const adaylar = (item) => [
        relPath(item, 'iapPriceSchedule', null),
        `${IRIS}/inAppPurchasesV2/${item.id}/iapPriceSchedule`,
        `${IRIS}/inAppPurchases/${item.id}/iapPriceSchedule`,
        `${IRIS}/inAppPurchasePriceSchedules/${item.id}`,
      ].filter(Boolean)

      const INCLUDE_ZENGIN =
        'include=manualPrices.inAppPurchasePricePoint,automaticPrices.inAppPurchasePricePoint'
      const INCLUDE_SADE = 'include=manualPrices,automaticPrices'

      const URUN_TAVANI = 25
      if (iaps.data.length > URUN_TAVANI) {
        // Sessiz tavan yok: kaç ürünün fiyatına bakılmadığı raporda görünsün.
        app.supheli.push({
          section: 'iapPrices',
          tur: 'sinir',
          reason: `${iaps.data.length} üründen yalnız ilk ${URUN_TAVANI} tanesinin fiyatına bakıldı`,
        })
      }

      const fiyatlar = []
      let calisanKalip = null
      let includeIleGelen = 0
      for (const item of iaps.data.slice(0, URUN_TAVANI)) {
        const etiket = item.attributes?.productId ?? item.id

        // Include fiyatı GERÇEKTEN getirdiyse istek atmaya gerek yok.
        if (cozucu?.priceFromPool(item, iaps.included ?? [])) {
          includeIleGelen++
          continue
        }

        const denenecek = calisanKalip
          ? [calisanKalip.replace('{id}', item.id)]
          : adaylar(item)
        let sched = null
        let kazanan = ''
        for (const yol of denenecek) {
          // ZENGİN include önce: `include=manualPrices` çizelgenin fiyat
          // KAYITLARINI getiriyor ama fiyatın kendisi bir alt halkada
          // (`inAppPurchasePricePoint`). Sahada bu yüzden havuzda tek bir
          // `customerPrice` yoktu ve altı ürünün altısı da 0 kalıyordu.
          // İç içe include'u tanımayan uç TÜM çizelgeyi düşürebileceği için
          // başarısızlıkta sade sürümle tekrar.
          let r = await iris().getAll(q(yol, INCLUDE_ZENGIN))
          if (!r.ok) r = await iris().getAll(q(yol, INCLUDE_SADE))
          if (r.ok) {
            sched = r
            kazanan = yol
            break
          }
        }
        if (!sched) {
          app.atlandi.push({
            section: `iapPrice:${etiket}`,
            reason: `${denenecek.length} aday yolun hiçbiri tutmadı`,
            path: short(denenecek[denenecek.length - 1] ?? ''),
          })
          continue
        }
        if (!calisanKalip) {
          calisanKalip = kazanan.replace(item.id, '{id}')
          app.supheli.push({ section: 'iapPrices', tur: 'not', reason: `çalışan yol: ${short(calisanKalip)}` })
        }

        // Fiyat hâlâ havuzda yoksa çizelgenin KENDİ `manualPrices` linkinden
        // git. Yol kurmuyoruz — Apple'ın verdiği adresi kullanıyoruz (R5).
        let included = sched.included
        if (!included.some((r) => r.attributes?.customerPrice !== undefined)) {
          const link = relPath(sched.data[0], 'manualPrices', null)
          const ek = link
            ? await iris().getAll(q(link, 'include=inAppPurchasePricePoint&filter[territory]=USA&limit=20'))
            : null
          if (ek?.ok) included = [...included, ...ek.data, ...ek.included]
          else {
            app.supheli.push({
              section: `iapPrice:${etiket}`,
              reason: link ? 'fiyat noktası okunamadı' : 'çizelgede manualPrices linki yok',
            })
          }
        }

        fiyatlar.push({
          iapId: item.id,
          productId: item.attributes?.productId ?? '',
          data: sched.data,
          included,
        })
      }
      // Fiyat raporu TEK satır ve İKİ yol da denendikten SONRA yazılıyor.
      // Eskiden ürün listesi aşamasında ürün başına "çözülemedi" düşüyordu;
      // çizelgeden okunan fiyat o satırları geri almıyordu, panelde 10
      // şüphelinin 6'sı yalancı alarmdı ve araç bozuk görünüyordu.
      const cozucuVar = !!cozucu
      const cizelgedenCozulen = cozucuVar
        ? fiyatlar.filter((f) => cozucu.priceFromSchedule(f)).length
        : 0
      const fiyatsiz = cozucuVar
        ? fiyatlar.filter((f) => !cozucu.priceFromSchedule(f)).map((f) => f.productId || f.iapId)
        : []
      const bakilan = Math.min(iaps.data.length, URUN_TAVANI)
      // Bu satır ÖZET, alarm değil: gerçek eksik varsa hemen aşağıdaki
      // `fiyatsiz` dalı onu ayrıca ve şüpheli olarak yazıyor. Özeti şüpheli
      // saymak "3 üründen 3'ü okundu" cümlesini uyarı listesine sokuyordu.
      app.supheli.push({
        section: 'iapPrices',
        tur: 'not',
        reason: `${bakilan} üründen ${includeIleGelen + cizelgedenCozulen} tanesinin fiyatı okundu` +
          (includeIleGelen ? ` (${includeIleGelen} ürün listesinden, ${cizelgedenCozulen} çizelgeden)` : ''),
      })
      if (fiyatsiz.length) {
        // Gerçek eksik: burada alarm YERİNDE.
        app.supheli.push({
          section: 'iapPrices',
          reason: `fiyatı hiçbir yoldan okunamayan ürün: ${fiyatsiz.join(', ')}`,
        })
      }
      // KOŞULSUZ yazılıyor, boş olsa bile. Bölümün YOKLUĞU eşleyicide
      // "eski çekim, yeniden çek" mesajını tetikliyor; fiyatlar include'dan
      // geldiği için liste boş kaldığında bu mesaj yanlış olurdu.
      await put('iapPrices', fiyatlar)
    }

    // --- Ekstralar ---------------------------------------------------------
    if (opts.ekstralar) {
      progress(`${app.name}: gizlilik ve ek bilgiler`, { app: app.name })
      // dataUsages kayıtları boş geliyor; anlam include'da (kanarya notu).
      const privacy = await take(
        app, 'dataUsages',
        q(relPath(record, 'dataUsages', `${IRIS}/apps/${app.id}/dataUsages`), 'include=category,grouping,purpose,dataProtection&limit=200'),
      )
      if (privacy) await put('dataUsages', { data: privacy.data, included: privacy.included })

      const eula = await take(
        app, 'eula',
        relPath(record, 'endUserLicenseAgreement', `${IRIS}/apps/${app.id}/endUserLicenseAgreement`),
      )
      if (eula?.data.length) await put('eula', eula.data[0])

      // --- ÖZEL ÜRÜN SAYFALARI ------------------------------------------
      //
      // Eskiden yalnız sayfa KABUĞU çekiliyordu (ad/adres/görünürlük) ve
      // içeriği hiç görülmüyordu. Oysa Apple bu sayfaları da inceliyor: bu
      // hesabın iki reddi (5.2.1 "FIFA benzeri içerik" ve 2.3.3 "ekran
      // görüntüleri uygulamayı göstermiyor") DOĞRUDAN özel ürün sayfaları
      // üzerinden geldi — ana listing tertemizdi.
      //
      // Hacim bilerek artıyor: burası hacmin doğru harcandığı yer. Yine de
      // tavanlı — sayfa başına tek dil ve tek görsel seti yeter, denetim
      // "bu sayfada uygulamayı göstermeyen görsel var mı" sorusunu soruyor.
      const pages = await take(
        app, 'customProductPages',
        q(relPath(record, 'appCustomProductPages', `${IRIS}/apps/${app.id}/appCustomProductPages`), 'limit=50'),
        { cap: opts.ozelSayfaTavani },
      )
      if (pages?.data.length) {
        const sayfalar = []
        for (const sayfa of pages.data) {
          const kayit = {
            id: sayfa.id,
            name: sayfa.attributes?.name ?? '',
            visible: sayfa.attributes?.visible !== false,
            url: sayfa.attributes?.url ?? '',
            metinler: [],
            gorseller: [],
            icerikCekildi: false,
          }
          if (opts.ozelSayfaIcerigi) {
            const surumler = await take(
              app, `cpp:${kayit.name}`,
              q(relPath(sayfa, 'appCustomProductPageVersions', null), 'limit=5'),
            )
            const guncel = surumler?.data?.[0]
            const yerel = guncel
              ? await take(
                  app, `cppMetin:${kayit.name}`,
                  q(relPath(guncel, 'appCustomProductPageLocalizations', null), 'limit=20'),
                )
              : null
            const loc = yerel?.data?.length ? pickLocale(yerel.data, app.primaryLocale) : null
            if (loc) {
              kayit.metinler = [{ locale: loc.attributes?.locale ?? '', promotionalText: loc.attributes?.promotionalText ?? '' }]
              const sets = await take(
                app, `cppGorsel:${kayit.name}`,
                q(relPath(loc, 'appScreenshotSets', null), 'include=appScreenshots&limit=20'),
              )
              if (sets) {
                const imgs = byId(sets.included, 'appScreenshots')
                for (const set of sets.data) {
                  for (const ref of set.relationships?.appScreenshots?.data ?? []) {
                    const img = imgs.get(ref.id)
                    if (!img) continue
                    kayit.gorseller.push({
                      id: img.id,
                      displayType: set.attributes?.screenshotDisplayType ?? '',
                      url: renderUrl(img.attributes?.imageAsset, SCREENSHOT_EDGE),
                    })
                  }
                }
                kayit.icerikCekildi = true
              }
            }
          }
          if (!kayit.icerikCekildi) {
            // Sessiz eksik yok: sayfanın içeriğine bakılmadığı raporda görünsün.
            app.supheli.push({
              section: 'customProductPages',
              reason: `"${kayit.name}" sayfasının metin/görselleri çekilmedi — denetim dışı`,
            })
          }
          sayfalar.push(kayit)
        }
        await put('customProductPages', sayfalar)
      }
    }

    if (opts.yorumlar) {
      const reviews = await take(
        app, 'customerReviews',
        q(relPath(record, 'customerReviews', `${IRIS}/apps/${app.id}/customerReviews`), 'limit=50&sort=-createdDate'),
      )
      if (reviews) {
        await put('customerReviews', reviews.data)
        app.sayilar.yorumlar = reviews.data.length
      }
    }

    app.istek = iris().state.requests - istekBaslangic
    return app
  }

  // -------------------------------------------------------------------------

  /** Liste gerçekten boş mu? Boş liste "hata yok ama veri de yok" hâli. */
  const wantedKontrol = (data) => Array.isArray(data) && data.length > 0

  async function collect(options = {}, emitFn, id = `${Date.now()}`) {
    const opts = { ...DEFAULTS, ...options }
    emit = emitFn
    runId = id
    globalThis.__gl.currentRun = id
    const started = Date.now()

    const session = await iris().raw('/olympus/v1/session')
    const team = session.ok ? (session.json?.provider?.name ?? '') : ''
    const teams = session.ok ? (session.json?.availableProviders ?? []).map((p) => p?.name).filter(Boolean) : []

    const appsRes = await iris().getAll(`${IRIS}/apps?limit=200`)
    if (!appsRes.ok) {
      // İLK KIRILMA NOKTASI BURASI ve en sık sebebi giriş yapılmamış olması.
      // "Uygulama listesi alınamadı: 401" teknik olarak doğru ama kullanıcıya
      // NE YAPACAĞINI söylemiyor. Oturum sorunuysa adım adım anlat; değilse
      // ham hatayı olduğu gibi göster — uydurma teşhis, teşhissizlikten kötü.
      const oturumSorunu =
        /401|oturum|HTML/i.test(String(appsRes.error)) || (session && !session.ok)
      throw new Error(
        oturumSorunu
          ? 'App Store Connect oturumu bulunamadı.\n\n' +
            '1) Bir sekmede appstoreconnect.apple.com adresini aç\n' +
            '2) Giriş yap (gerekiyorsa 2FA kodunu gir)\n' +
            '3) Bu panelde tekrar "Her şeyi çek" de\n\n' +
            `Teknik ayrıntı: ${appsRes.error}`
          : `Uygulama listesi alınamadı: ${appsRes.error}`,
      )
    }
    if (!wantedKontrol(appsRes.data)) {
      throw new Error(
        'Oturum açık ama bu hesapta hiç uygulama görünmüyor.\n\n' +
          (teams.length > 1
            ? `${teams.length} takımın var (${teams.join(', ')}). App Store Connect'te ` +
              'sağ üstten doğru takıma geç ve tekrar dene.'
            : 'App Store Connect\'te uygulamaların görünüyorsa bu bir uç değişikliği ' +
              'olabilir; Menü → Teşhis → Yokla ile kontrol et.'),
      )
    }

    const wanted = options.apps?.length
      ? appsRes.data.filter((a) => options.apps.includes(a.id))
      : appsRes.data

    await progress(`${wanted.length} uygulama çekilecek · takım: ${team || '?'}`, { total: wanted.length })

    const özet = []
    for (const [i, record] of wanted.entries()) {
      if (globalThis.__gl.currentRun !== id) return null
      await emit({ type: 'gl:collect:appStart', index: i + 1, total: wanted.length, name: record.attributes?.name })
      const app = await collectApp(record, opts)
      await emit({ type: 'gl:collect:app', app })
      özet.push(app)
      if (iris().state.halted) break
    }

    const run = {
      id,
      startedAt: started,
      finishedAt: Date.now(),
      requests: iris().state.requests,
      team,
      teams,
      apps: özet.map((a) => ({ id: a.id, name: a.name, sayilar: a.sayilar })),
      atlandi: özet.flatMap((a) => a.atlandi.map((x) => ({ app: a.name, ...x }))),
      supheli: özet.flatMap((a) => a.supheli.map((x) => ({ app: a.name, ...x }))),
      halted: iris().state.halted || null,
      version: VERSION,
    }
    await emit({ type: 'gl:collect:done', run })
    return run
  }

  if (globalThis.__gl.collectorListener) {
    try {
      chrome.runtime.onMessage.removeListener(globalThis.__gl.collectorListener)
    } catch {
      /* eski bağlam geçersizleşmiş olabilir */
    }
  }
  const listener = (msg, _sender, sendResponse) => {
    if (msg?.type !== 'gl:collect:run') return
    sendResponse({ started: true, version: VERSION })
    const send = (m) => {
      m.runId = msg.runId
      try {
        const p = chrome.runtime.sendMessage(m)
        // Hatayı YUTMUYORUZ, sonuca çeviriyoruz. Eskiden `catch(() => {})`
        // vardı: depo yazması düştüğünde (kota, kapanan service worker)
        // çekim "başarılı" görünüyor, denetim eksik veriyle koşuyordu — R3'ün
        // ders kitabı ihlali.
        return p?.catch
          ? p.catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
          : Promise.resolve({ ok: true })
      } catch (e) {
        return Promise.resolve({ ok: false, error: String(e?.message ?? e) })
      }
    }
    collect(msg.options ?? {}, send, msg.runId).catch((e) =>
      send({ type: 'gl:error', message: e.message }),
    )
  }
  chrome.runtime.onMessage.addListener(listener)
  globalThis.__gl.collectorListener = listener
  globalThis.__gl.collector = { collect, rejectTextsFrom, splitByGuideline, toPlainText, version: VERSION, DEFAULTS }
}
