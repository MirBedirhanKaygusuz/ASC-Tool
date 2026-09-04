/**
 * Kanarya turu — toplayıcıyı yazmadan önce zeminin sağlam olduğunu doğrular.
 *
 * Hiçbir şey toplamaz, hiçbir şey kaydetmez. Tek yaptığı: endpoints.js'teki
 * her ucu bir kez çağırıp "yaşıyor mu, hangi alan adlarıyla cevap veriyor"
 * sorusunu yanıtlamak.
 *
 * NEDEN ÖNCE BU: uçların yarısı tahmin (endpoints.js'te kanit:false). Körlemesine
 * 600 satır toplayıcı yazıp sonra alan adlarının tutmadığını görmek, beş
 * dakikalık bu turdan çok daha pahalı. Ve sessiz kırılmanın (belkiPatlarız R2)
 * tek panzehiri: "200 döndü" ile "beklediğim alan geldi" arasındaki farkı
 * ölçmek.
 *
 * Çıktı kasıtlı olarak KISA ve GİZLENMİŞ: şifre/token içeren alanlar maskelenir
 * (R4), uzun değerler kırpılır. Rapor sohbete yapıştırılmak üzere üretiliyor.
 */
globalThis.__gl ??= {}

{
  const VERSION = '0.1.4'

  // Eklenti güncellenip yeniden enjekte edildiğinde eski dinleyici sayfada
  // kalabiliyor. "Zaten kuruluysa atla" dersek eski kod koşmaya devam eder ve
  // düzeltmelerin hiç devreye girmez. Onun yerine: eskisini kaldır, yenisini
  // tak. Aynı sebeple mükerrer dinleyici de oluşmaz.
  // İki ayrı gizleme kovası:
  //   SECRET_KEY → sır. Asla görünmemeli.
  //   PERSONAL   → kişisel veri. Rapor sohbete yapıştırılıyor; iş arkadaşının
  //                telefonu, e-postası, yorumcunun takma adı oraya gitmemeli.
  //                (2026-08-20'de tam olarak bu oldu — kalıp sonradan eklendi.)
  // Dar tutuluyor: ilk sürümde /token/ kalıbı `iconAssetToken`'ı da gizledi;
  // gereksiz gizleme teşhis için lazım olan veriyi yok ediyor.
  // BU İKİ SATIR src/store.js İLE BİREBİR AYNI OLMAK ZORUNDA. Ayrışırlarsa
  // biri sızdırır ve hangisi olduğunu kimse fark etmez; test ikisini
  // karakter karakter karşılaştırıyor.
  const SECRET_KEY =
    /password|passwd|secret|credential|api[-_]?key|(access|auth|refresh|session|bearer)[-_]?token|^token$|^pass$|^pwd$/i
  const PERSONAL =
    /phone|email|firstname|lastname|nickname|initiator|publishedby|contactname|reviewername|demoaccountname|^user$|^username$/i
  const MAX_VALUE = 60
  const MAX_SAMPLE_KEYS = 24

  const iris = () => globalThis.__gl.iris
  const endpoints = () => globalThis.__gl.endpoints

  let runId = ''
  const emit = (msg) => {
    msg.runId = runId
    // Popup kapalı olabilir; alıcı yoksa sendMessage reddediyor. Yutuyoruz —
    // ilerleme mesajının düşmesi turu durdurmamalı.
    try {
      const p = chrome.runtime.sendMessage(msg)
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch {
      /* boş */
    }
  }

  /** Değeri rapora sokulabilir hale getir: maskele, kırp, tipini göster. */
  function safeValue(key, value) {
    if (SECRET_KEY.test(key)) return '‹gizlendi›'
    if (PERSONAL.test(key)) return value === null ? null : '‹kişisel veri›'
    if (value === null) return null
    if (Array.isArray(value)) return `[${value.length} eleman]`
    if (typeof value === 'object') return `{${Object.keys(value).slice(0, 6).join(',')}}`
    const s = String(value)
    return s.length > MAX_VALUE ? `${s.slice(0, MAX_VALUE)}…(${s.length})` : s
  }

  function sampleOf(attributes) {
    const out = {}
    for (const [k, v] of Object.entries(attributes ?? {}).slice(0, MAX_SAMPLE_KEYS)) out[k] = safeValue(k, v)
    return out
  }

  /**
   * Beklenen alanlar geldi mi?
   *
   * Dizi girdi = "şunlardan herhangi biri" — Apple aynı veriyi iki isimle
   * döndürebiliyor (reasons / reviewRejectionReasons).
   */
  function missingKeys(expect, attributes) {
    const have = new Set(Object.keys(attributes ?? {}))
    const missing = []
    for (const entry of expect ?? []) {
      const alts = Array.isArray(entry) ? entry : [entry]
      if (!alts.some((k) => have.has(k))) missing.push(alts.join('|'))
    }
    return missing
  }

  async function runProbe(ep, ctx) {
    const out = { id: ep.id, label: ep.label, weight: ep.weight, kanit: !!ep.kanit }

    // --- İsteği at ---------------------------------------------------------
    let result = null
    if (ep.find) {
      const found = await ep.find(ctx, iris())
      out.path = found.path
      if (found.note) out.note = found.note
      result = found.result
      if (!result) {
        out.verdict = 'atlandı'
        out.why = found.path
        return out
      }
    } else {
      const path = ep.path(ctx)
      if (!path) {
        out.verdict = 'atlandı'
        out.why = 'bağımlı olduğu kimlik önceki adımda gelmedi'
        return out
      }
      out.path = path
      result = ep.kind === 'plain' ? await iris().raw(path) : await iris().getAll(path)
    }

    out.status = result.status ?? 0

    if (!result.ok) {
      // 403 ayrı bir kova: uç var, oturum var, ama bu kaynak doğrudan
      // okunamıyor. "Bozuk" demek yanlış teşhis olurdu.
      out.verdict = result.halted ? 'durduruldu' : result.forbidden ? 'yasak' : 'kırık'
      out.error = result.error
      if (result.body) out.body = String(result.body).slice(0, 160)
      return out
    }

    // --- JSON:API olmayan uç (olympus/session) -----------------------------
    if (ep.kind === 'plain') {
      out.verdict = 'tamam'
      out.keys = Object.keys(result.json ?? {}).slice(0, 14)
      ep.after?.(result.json, ctx)
      return out
    }

    // --- Liste uçları ------------------------------------------------------
    out.count = result.data.length
    out.pages = result.pages
    if (result.total !== null && result.total !== undefined) out.total = result.total
    ep.after?.(result, ctx)

    if (!result.data.length) {
      // Boş liste HATA DEĞİL — ama "gerçekten yok" ile "okuyamadım" ayrımını
      // burada kaybedersek her şeyi kaybederiz (R2). Ayrı etiketleniyor.
      out.verdict = 'boş'
      return out
    }

    const attributes = result.data[0]?.attributes ?? {}
    out.keys = Object.keys(attributes)
    out.sample = sampleOf(attributes)
    // İlişkiler = bu kaynaktan hangi uçlara gidilebileceğinin haritası.
    // Toplayıcının gezinme planı buradan çıkacak, tahminle değil.
    out.rels = Object.keys(result.data[0]?.relationships ?? {})
    // JSON:API her ilişki için "related" linki verebiliyor. Veriyorsa
    // toplayıcı yolu TAHMİN ETMEZ, oradan gider — R2'nin en büyük parçası.
    const rel0 = Object.values(result.data[0]?.relationships ?? {})[0]
    if (rel0?.links?.related) out.relLinkOrnegi = String(rel0.links.related).slice(0, 120)
    if (result.included?.length) {
      out.included = {}
      for (const r of result.included) out.included[r.type] = (out.included[r.type] ?? 0) + 1
    }
    const missing = missingKeys(ep.expect, attributes)
    if (missing.length) out.missing = missing
    // Kayıt VAR ama içinde tek alan YOK: JSON:API sparse yanıtı, veri
    // muhtemelen include ile geliyor. "expect" boş diye tamam demek, R2'nin
    // tam da kaçırmak istediğimiz hali olurdu — kendiliğinden şüpheli say.
    if (!out.keys.length && !Object.keys(result.data[0]?.relationships ?? {}).length) {
      out.bosKayit = true
    }

    // include ile gelen yan kaynak da kontrol edilir (ekran görüntüsü,
    // fiyat noktası, mesajı yazan aktör — hepsi included içinde geliyor).
    if (ep.inspect) {
      const extra = ep.inspect(result)
      if (!extra) {
        out.includedMissing = true
      } else {
        out.includedType = extra.type
        out.includedKeys = Object.keys(extra.attributes ?? {})
        out.includedSample = sampleOf(extra.attributes)
        const m2 = missingKeys(ep.inspectExpect, extra.attributes)
        if (m2.length) out.includedMissingKeys = m2
      }
    }

    // R11: Apple "48 kayıt var" diyor, elimizde 20 varsa bu sessiz veri kaybı.
    if (result.shortfall) out.shortfall = result.shortfall
    if (result.truncated) out.truncated = true

    out.verdict =
      out.missing?.length || out.includedMissing || out.includedMissingKeys?.length ||
      out.shortfall || out.bosKayit
        ? 'şüpheli'
        : 'tamam'
    return out
  }

  const ICON = {
    tamam: '✓', boş: '○', şüpheli: '⚠', yasak: '⊘', kırık: '✗',
    atlandı: '–', durduruldu: '■',
  }

  /** Sohbete yapıştırılabilir kısa özet. Asıl teşhis buradan okunuyor. */
  function toText(report) {
    const L = []
    L.push(`Greenlight kanarya v${report.version} · ${report.at}`)
    L.push(
      `takım: ${report.team || '?'}${report.teams?.length > 1 ? ` (${report.teams.length} takım var!)` : ''} · ` +
        `${report.appCount} uygulama · yoklanan: ${report.appName} (${report.appId})`,
    )
    L.push(`${report.requests} istek · ${Math.round(report.durationMs / 1000)} sn`)
    const s = report.summary
    L.push(
      `${s.tamam} tamam · ${s.boş} boş · ${s.şüpheli} şüpheli · ${s.yasak} yasak · ` +
        `${s.kırık} kırık · ${s.atlandı} atlandı`,
    )
    L.push('')
    for (const p of report.probes) {
      const head = `${ICON[p.verdict] ?? '?'} ${p.id.padEnd(30)} ${String(p.status ?? '').padEnd(4)}`
      const bits = []
      if (p.count !== undefined) bits.push(`${p.count} kayıt${p.total !== undefined ? `/${p.total}` : ''}`)
      if (p.pages > 1) bits.push(`${p.pages} sayfa`)
      if (p.why) bits.push(p.why)
      if (p.note) bits.push(p.note)
      if (p.error) bits.push(`HATA: ${p.error}`)
      if (p.missing?.length) bits.push(`EKSİK ALAN: ${p.missing.join(', ')}`)
      if (p.includedMissing) bits.push('included BOŞ')
      if (p.includedMissingKeys?.length) bits.push(`included EKSİK: ${p.includedMissingKeys.join(', ')}`)
      if (p.shortfall) bits.push(`SAYFALAMA EKSİK: ${p.shortfall} kayıt gelmedi`)
      if (p.bosKayit) bits.push('KAYIT VAR AMA ALAN YOK — include gerekiyor')
      L.push(`${head} ${bits.join(' · ')}`)
      if (p.keys?.length) L.push(`    alanlar: ${p.keys.join(', ')}`)
      if (p.rels?.length) L.push(`    ilişkiler: ${p.rels.join(', ')}`)
      if (p.relLinkOrnegi) L.push(`    ilişki linki: ${p.relLinkOrnegi}`)
      if (p.included) {
        L.push(`    included: ${Object.entries(p.included).map(([t, n]) => `${t}×${n}`).join(', ')}`)
      }
      if (p.includedKeys?.length) L.push(`    included(${p.includedType}): ${p.includedKeys.join(', ')}`)
    }
    L.push('')
    L.push('# Örnek değerler (gizlenmiş)')
    for (const p of report.probes) {
      if (!p.sample) continue
      L.push(`## ${p.id}`)
      for (const [k, v] of Object.entries(p.sample)) L.push(`   ${k}: ${v}`)
      if (p.includedSample) {
        L.push(`   -- included ${p.includedType} --`)
        for (const [k, v] of Object.entries(p.includedSample)) L.push(`   ${k}: ${v}`)
      }
    }
    return L.join('\n')
  }

  async function run(id = `${Date.now()}`) {
    // Aynı sekmede ikinci bir tur başlatılırsa eskisi kendini durdurur.
    // Yoksa iki tur aynı anda Apple'a istek atar (belkiPatlarız R1).
    runId = id
    globalThis.__gl.currentRun = id
    const started = Date.now()
    const ctx = {}
    const list = endpoints()
    const probes = []

    for (const [i, ep] of list.entries()) {
      if (globalThis.__gl.currentRun !== id) return null // yenisi başladı
      emit({ type: 'gl:progress', i: i + 1, n: list.length, label: ep.label })
      let p
      try {
        p = await runProbe(ep, ctx)
      } catch (e) {
        // Kanaryanın kendisi çökmesin: tek uç patlarsa tur devam etsin.
        p = { id: ep.id, label: ep.label, weight: ep.weight, verdict: 'kırık', error: `kod hatası: ${e.message}` }
      }
      probes.push(p)
      emit({ type: 'gl:probe', probe: p })

      if (p.verdict === 'durduruldu') break
      // Uygulama listesi gelmediyse geri kalan her uç zaten atlanır; boşuna
      // 30 istek atma. Oturum ucunun düşmesi ise turu durdurmaz — o yalnızca
      // takım adını veriyor.
      if (ep.id === 'apps' && p.verdict !== 'tamam') break
      // 401, ya da üst üste 3 yetki hatası: oturum gerçekten gitmiş.
      if (iris().state.authFailed) break
    }

    const summary = { tamam: 0, boş: 0, şüpheli: 0, yasak: 0, kırık: 0, atlandı: 0, durduruldu: 0 }
    for (const p of probes) summary[p.verdict] = (summary[p.verdict] ?? 0) + 1

    const report = {
      version: VERSION,
      at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
      team: ctx.team ?? '',
      teams: ctx.teams ?? [],
      appCount: ctx.apps?.length ?? 0,
      appId: ctx.appId ?? '',
      appName: ctx.appName ?? '',
      requests: iris().state.requests,
      durationMs: Date.now() - started,
      halted: iris().state.halted || null,
      authFailed: iris().state.authFailed,
      summary,
      probes,
    }
    report.text = toText(report)
    emit({ type: 'gl:canary:done', report })
    return report
  }

  if (globalThis.__gl.canaryListener) {
    try {
      chrome.runtime.onMessage.removeListener(globalThis.__gl.canaryListener)
    } catch {
      /* eski bağlam çoktan geçersizleşmiş olabilir */
    }
  }
  const listener = (msg, _sender, sendResponse) => {
    if (msg?.type !== 'gl:canary:run') return
    // Uzun iş: yanıtı beklemeden başlat, sonuç mesajla döner. sendResponse'u
    // 60 saniye açık tutmak MV3'te güvenilir değil.
    sendResponse({ started: true, version: VERSION })
    run(msg.runId).catch((e) => emit({ type: 'gl:error', message: e.message }))
  }
  chrome.runtime.onMessage.addListener(listener)

  globalThis.__gl.canaryListener = listener
  globalThis.__gl.canary = { run, toText, version: VERSION }
}
