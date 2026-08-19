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
 * Çıktı: her red thread'i için bir .txt indirir. Sonra:
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
        const lines = []
        lines.push(`App: ${app.name}`)
        lines.push(`Platform: ${sub.attributes?.platform ?? 'IOS'}`)
        if (version) lines.push(`Version: ${version}`)
        lines.push(`Submission: ${sub.id}  (${sub.attributes?.state ?? '?'})`)
        lines.push(`Submitted: ${sub.attributes?.submittedDate ?? '-'}`)
        lines.push(`Thread: ${thread.id}  (${thread.attributes?.state ?? '?'})`)
        lines.push('')

        if (reasons.length) {
          lines.push('=== Red sebepleri ===')
          for (const r of reasons) {
            lines.push(`Guideline ${r.code}${r.section ? ` - ${r.section}` : ''}`)
            if (r.description) lines.push(r.description)
            lines.push('')
          }
        }

        lines.push('=== Yazışma ===')
        for (const m of messages) {
          const ref = m.relationships?.fromActor?.data
          const actor = ref ? actorById.get(`${ref.type}#${ref.id}`) : undefined
          const who = actor?.name ?? actor?.displayName ?? actor?.actorType ?? 'App Review'
          lines.push(`--- ${who} · ${m.attributes?.createdDate ?? '-'} ---`)
          lines.push(toPlainText(m.attributes?.messageBody))
          lines.push('')
        }

        const stamp = (sub.attributes?.submittedDate ?? '').slice(0, 10) || 'tarihsiz'
        const slug = app.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        files.push({
          name: `asc-reject-${slug}-${stamp}-${thread.id}.txt`,
          text: lines.join('\n').trim() + '\n',
        })
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
