/**
 * ASC red toplayıcı — App Store Connect sekmesinin İÇİNDE çalışır.
 *
 * Neden burada: iris/v1 uçları çerezle korunuyor ve çerez httpOnly. Kod aynı
 * origin'de koştuğu için fetch onu kendisi taşır — .env'e kopyalanacak,
 * süresi dolacak, sızacak bir sır kalmaz.
 *
 * Kullanım:
 *   npm run asc:copy          → snippet panoya
 *   appstoreconnect.apple.com → DevTools Console → yapıştır → Enter
 *   (Chrome ilk seferde "allow pasting" yazmanı ister)
 *
 * Çıktı: her GUIDELINE için ayrı bir .txt indirir — Apple tek mesajda birden
 * çok madde reddedebiliyor ve learn bir dosyayı tek red sayıyor. Sonra:
 *   mkdir -p rejects && mv ~/Downloads/asc-reject-*.txt rejects/
 *   npm run learn -- --dir rejects/
 */
;(async () => {
  const IRIS = '/iris/v1'
  const HEADERS = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  // Apple'ın resmi olmayan ucu. CLI'ın guardrail'i 1 sn; altına inme.
  const THROTTLE_MS = 800

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  let lastCall = 0

  async function get(path) {
    const wait = THROTTLE_MS - (Date.now() - lastCall)
    if (wait > 0) await sleep(wait)
    lastCall = Date.now()
    const url = path.startsWith('http') ? path : IRIS + path
    const res = await fetch(url, { headers: HEADERS, credentials: 'same-origin' })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url.slice(0, 90)}`)
    return res.json()
  }

  /** links.next'i takip ederek tüm sayfaları toplar. */
  async function getAll(path) {
    let payload = await get(path)
    const data = payload.data ?? []
    const included = payload.included ?? []
    while (payload.links?.next) {
      payload = await get(payload.links.next)
      data.push(...(payload.data ?? []))
      included.push(...(payload.included ?? []))
    }
    return { data, included }
  }

  /** Apple mesaj gövdesi HTML. Paragrafları koru — LLM'e tek satır gitmesin. */
  function toPlainText(html) {
    if (!html) return ''
    const withBreaks = html
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

  /** Red sebepleri iki farklı attribute adı altında gelebiliyor. */
  function reasonsOf(resource) {
    const attrs = resource.attributes ?? {}
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
   * Apple'ın mesaj gövdesini madde madde böler.
   *
   * Gövde şu kalıpta: "Guideline X - Başlık" → "Issue Description" → "Next Steps".
   * Tek mesajda 2-3 madde olabiliyor; hepsini tek dosyaya koyarsak learn
   * yalnız birini ders yapıp gerisini sessizce düşürüyor.
   */
  const GUIDELINE_LINE = /^[\s\d.)-]{0,6}Guideline\s+([0-9][0-9A-Za-z.()]*)[^\n]*$/gm
  // Apple her mesajın sonuna aynı kalıbı ekliyor — derse girmesin.
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

  /** "Review Device: …" gibi tek satırlık bağlamı preamble'dan çeker. */
  function fieldFrom(preamble, label) {
    const m = preamble.match(new RegExp(`^${label}:\\s*(.+)$`, 'm'))
    return m ? m[1].trim() : ''
  }

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  // --- Uygulama seçimi: URL'den, olmazsa hesaptaki tüm uygulamalar ----------
  const fromUrl = location.pathname.match(/\/apps\/(\d+)/)
  let apps
  if (fromUrl) {
    apps = [{ id: fromUrl[1], name: document.title.split('—')[0].trim() || fromUrl[1] }]
  } else {
    const { data } = await getAll('/apps?limit=200')
    apps = data.map((a) => ({ id: a.id, name: a.attributes?.name ?? a.id }))
    console.log(`%cHesapta ${apps.length} uygulama — hepsi taranacak.`, 'font-weight:bold')
  }

  const files = []

  for (const app of apps) {
    const { data: subs, included: subInc } = await getAll(
      `/apps/${app.id}/reviewSubmissions?include=appStoreVersionForReview&limit=200`,
    )
    const versionById = new Map(
      subInc.filter((r) => r.type === 'appStoreVersions').map((r) => [r.id, r.attributes ?? {}]),
    )
    console.log(`${app.name}: ${subs.length} submission`)

    for (const sub of subs) {
      const { data: threads } = await getAll(
        `/resolutionCenterThreads?filter[reviewSubmission]=${sub.id}&include=reviewSubmission`,
      )
      if (!threads.length) continue

      const versionId = sub.relationships?.appStoreVersionForReview?.data?.id
      const version = versionId ? versionById.get(versionId)?.versionString : undefined

      for (const thread of threads) {
        const { data: messages, included: msgInc } = await getAll(
          `/resolutionCenterThreads/${thread.id}/resolutionCenterMessages` +
            `?include=fromActor,rejections&limit[rejections]=200`,
        )
        const { data: rejections } = await getAll(
          `/reviewRejections?filter[resolutionCenterMessage.resolutionCenterThread]=${thread.id}` +
            `&include=rejectionAttachments&limit=200`,
        )

        // Sebepler: özel uçtan gelenler asıl kaynak, mesaj included'ı yedek.
        const allReasons = [
          ...rejections.flatMap(reasonsOf),
          ...msgInc.filter((r) => /rejection/i.test(r.type)).flatMap(reasonsOf),
        ]
        const seen = new Set()
        const reasons = allReasons.filter((r) => {
          const key = `${r.code}|${r.section}|${r.description}`
          return seen.has(key) ? false : (seen.add(key), true)
        })

        const actorById = new Map(msgInc.map((r) => [`${r.type}#${r.id}`, r.attributes ?? {}]))
        const whoOf = (m) => {
          const ref = m.relationships?.fromActor?.data
          const actor = ref ? actorById.get(`${ref.type}#${ref.id}`) : undefined
          return String(actor?.actorType ?? actor?.name ?? '').toUpperCase()
        }

        // Apple ters kronolojik döndürüyor. Eskiden yeniye çevir ki
        // "önce red, sonra yanıt" sırası metinde de doğru olsun.
        const ordered = [...messages].sort((a, b) =>
          String(a.attributes?.createdDate ?? '').localeCompare(String(b.attributes?.createdDate ?? '')))

        const appleMsgs = ordered.filter((m) => whoOf(m) === 'APPLE')
        const devMsgs = ordered.filter((m) => whoOf(m) !== 'APPLE')

        // Geliştirici yanıtları maddeye göre indekslenir — dersin `resolution`
        // alanı "neyle geçtik" bilgisini buradan alıyor.
        const devByCode = new Map()
        for (const m of devMsgs) {
          const { blocks } = splitByGuideline(toPlainText(m.attributes?.messageBody))
          for (const b of blocks) {
            const prev = devByCode.get(b.code) ?? []
            devByCode.set(b.code, [...prev, { date: m.attributes?.createdDate ?? '', body: b.body }])
          }
        }

        const slug = app.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

        for (const msg of appleMsgs.length ? appleMsgs : ordered) {
          const plain = toPlainText(msg.attributes?.messageBody)
          const { preamble, blocks } = splitByGuideline(plain)
          const rejectedAt = String(msg.attributes?.createdDate ?? '').slice(0, 10) || 'tarihsiz'
          const device = fieldFrom(preamble, 'Review Device')
          const reviewed = fieldFrom(preamble, 'Version reviewed')

          // Kalıp tutmadıysa (eski mesaj biçimi) mesajın tamamını tek dosya yap.
          const parts = blocks.length ? blocks : [{ code: '', body: plain }]

          for (const part of parts) {
            const lines = []
            lines.push(`App: ${app.name}`)
            lines.push(`Platform: ${sub.attributes?.platform ?? 'IOS'}`)
            if (part.code) lines.push(`Guideline: ${part.code}`)
            lines.push(`Reddedilme: ${rejectedAt}`)
            if (reviewed || version) lines.push(`Version: ${reviewed || version}`)
            if (device) lines.push(`Review Device: ${device}`)
            lines.push(`Submission: ${sub.id}  (${sub.attributes?.state ?? '?'})`)
            lines.push(`Thread: ${thread.id}`)

            // Yapısal etiket kaba geliyor (5.6.0 iken gövdede 5.6.3 yazıyor).
            // Bilgi olsun diye tutuyoruz ama guideline'ı gövdeden alıyoruz.
            const tag = reasons.find((r) => part.code && r.code.startsWith(part.code.split('(')[0].slice(0, 3)))
            if (tag) lines.push(`Apple etiketi: ${tag.code}${tag.description ? ` — ${tag.description}` : ''}`)
            lines.push('')

            lines.push("=== Apple'ın red gerekçesi ===")
            lines.push(part.body)
            lines.push('')

            const replies = devByCode.get(part.code) ?? []
            for (const r of replies) {
              lines.push(`=== Geliştirici yanıtı (${String(r.date).slice(0, 10)}) ===`)
              lines.push(r.body)
              lines.push('')
            }

            const codeSlug = part.code ? part.code.replace(/[^0-9a-z]+/gi, '-').replace(/-$/, '') : 'genel'
            files.push({
              name: `asc-reject-${slug}-${codeSlug}-${rejectedAt}.txt`,
              text: lines.join('\n').trim() + '\n',
            })
          }
        }
      }
    }
  }

  if (!files.length) {
    console.log('%cRed kaydı bulunamadı.', 'color:#c60')
    return
  }

  // Panoya da koy — tek red varsa `npm run learn -- --paste` yeterli.
  try {
    await navigator.clipboard.writeText(files.map((f) => f.text).join('\n\n'))
  } catch {
    /* pano izni yoksa dert değil, dosyalar zaten iniyor */
  }

  for (const f of files) {
    download(f.name, f.text)
    await sleep(250)
  }

  console.log(
    `%c${files.length} red metni indirildi.%c\n` +
      `  mkdir -p rejects && mv ~/Downloads/asc-reject-*.txt rejects/\n` +
      `  npm run learn -- --dir rejects/`,
    'font-weight:bold;color:#2a7',
    'font-family:monospace',
  )
  window.__ascRejects = files
})()
