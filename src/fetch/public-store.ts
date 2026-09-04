/**
 * Herkese açık App Store vitrini — ANAHTARSIZ, OTURUMSUZ.
 *
 * Bu dosya projedeki tek gerçek "web scraping": Apple'ın hiçbir yetki
 * istemeyen iki genel kaynağını okuyor.
 *   1. iTunes Lookup  (JSON)  — ad, açıklama, sürüm, ekran görüntüleri, yaş
 *      sınırı, kategori, puan. Belgelenmiş ve yıllardır sabit.
 *   2. apps.apple.com ürün sayfası (HTML) — Lookup'ın VERMEDİĞİ tek şey:
 *      uygulama içi satın alma adları ve FİYATLARI.
 *
 * SINIRI NET OLSUN — bu en kritik nokta:
 * Vitrin YAYINDAKİ sürümü gösterir. Denetimin asıl konusu ise henüz
 * gönderilmemiş sürümdür. Yani burası App Store Connect'in yerine GEÇEMEZ;
 * "hazırlanan sürümün metni" buradan okunamaz. Buranın işi:
 *   - uygulama daha hiç çekilmemişken bile elde bir şey olması,
 *   - ASC'den gelen fiyatları BAĞIMSIZ bir kaynakla çapraz kontrol etmek
 *     (fiyat 0 okunduysa gerçekten bedava mı, yoksa okuyamadık mı?).
 *
 * Nazik davranıyoruz: istekler sıralı, aralarında nefes var, tarayıcı
 * başlıklarıyla gidiyoruz (bot filtresine takılmamak için — kimlik gizlemek
 * için değil). Apple bu sayfada 429 döndürebiliyor; döndürürse durup
 * söylüyoruz, ısrar etmiyoruz.
 */

export interface PublicIap {
  name: string
  /** Sayfada yazdığı gibi: "$14.99". Biçim ülkeye göre değişir. */
  priceText: string
  /** Ayrıştırılabildiyse sayı. Ayrıştıramazsak null — 0 YAZMIYORUZ. */
  price: number | null
}

export interface PublicListing {
  appId: string
  country: string
  url: string
  name: string
  description: string
  releaseNotes: string
  version: string
  sellerName: string
  bundleId: string
  category: string
  categories: string[]
  ageRating: string
  /** Yaş sınırı gerekçeleri ("Infrequent/Mild Mature/Suggestive Themes"). */
  advisories: string[]
  languages: string[]
  price: number | null
  currency: string
  formattedPrice: string
  ratingAverage: number | null
  ratingCount: number | null
  icon: string
  screenshots: string[]
  ipadScreenshots: string[]
  iaps: PublicIap[]
  /** Apple sayfada en çok 10 ürün gösteriyor; liste dolduysa eksik demektir. */
  iapListTruncated: boolean
  /** Hangi kaynaklar okundu — raporda "bu bilgi nereden geldi" sorusu için. */
  sources: string[]
  /** Okunamayan şeyler. Sessiz eksik yok. */
  warnings: string[]
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'

const PAGE_HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

/** Apple'ın vitrin sayfası bir ürün için en çok bu kadar satır gösteriyor. */
export const IAP_SAYFA_TAVANI = 10

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// Ayrıştırıcılar — saf fonksiyon, ağ yok (test bunları fikstürle sınıyor)
// ---------------------------------------------------------------------------

/** "$14.99" → 14.99 · "14,99 €" → 14.99 · "Free" → 0 · çözemezsek null. */
export function parsePriceText(text: string): number | null {
  const t = String(text).trim()
  if (!t) return null
  if (/^(free|ücretsiz|gratis)$/i.test(t)) return 0
  // Binlik ve ondalık ayracı ülkeye göre yer değiştiriyor. SON ayracı
  // ondalık kabul ediyoruz: "1.299,00" ve "1,299.00" ikisi de doğru çıkıyor.
  const m = t.match(/\d[\d.,\u00a0\u202f ]*/)
  if (!m) return null
  const raw = m[0].replace(/[\u00a0\u202f ]/g, '')
  const sonAyrac = Math.max(raw.lastIndexOf('.'), raw.lastIndexOf(','))
  const normal =
    sonAyrac >= 0 && raw.length - sonAyrac <= 3
      ? raw.slice(0, sonAyrac).replace(/[.,]/g, '') + '.' + raw.slice(sonAyrac + 1)
      : raw.replace(/[.,]/g, '')
  const n = Number(normal)
  return Number.isFinite(n) ? n : null
}

const stripTags = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Vitrin sayfasından uygulama içi satın alma listesi ve bilgi tablosu.
 *
 * Apple bu bölümü sunucuda üretiyor (JavaScript beklemeye gerek yok).
 * Sınıf adları derleme başına değişiyor — onlara YASLANMIYORUZ; yapıya
 * (dt/dd, span çifti) yaslanıyoruz.
 */
export function parseStorePage(html: string): {
  iaps: PublicIap[]
  info: Record<string, string>
  warnings: string[]
} {
  const warnings: string[] = []
  const iaps: PublicIap[] = []

  const blok = /<dt[^>]*>\s*In-App Purchases\s*<\/dt>([\s\S]*?)<\/dd>/i.exec(html)
  if (!blok) {
    // "Bölüm yok" ile "ürün yok" AYRI şeyler. Uygulamada IAP yoksa Apple bu
    // satırı hiç basmıyor; ayrıştırıcı bozulduğunda da aynı görünür. Ayırt
    // edemediğimiz için uyarı yazıyoruz, sessizce "ürün yok" demiyoruz.
    warnings.push('Sayfada "In-App Purchases" bölümü yok — üründe IAP olmayabilir ya da sayfa yapısı değişmiş olabilir.')
  } else {
    for (const m of blok[1]!.matchAll(/<span>([^<]{1,120})<\/span>\s*<span>([^<]{1,40})<\/span>/g)) {
      const name = stripTags(m[1]!)
      const priceText = stripTags(m[2]!)
      if (!name || !priceText) continue
      iaps.push({ name, priceText, price: parsePriceText(priceText) })
    }
    if (!iaps.length) {
      warnings.push('IAP bölümü bulundu ama satır okunamadı — sayfa yapısı değişmiş olabilir.')
    }
  }

  const info: Record<string, string> = {}
  for (const m of html.matchAll(/<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) {
    const key = stripTags(m[1]!)
    if (key === 'In-App Purchases') continue
    info[key] = stripTags(m[2]!).slice(0, 400)
  }

  return { iaps, info, warnings }
}

/** iTunes Lookup yanıtındaki tek sonucu okunur alanlara çevir. */
export function parseLookup(result: Record<string, any>): Partial<PublicListing> {
  const genres: string[] = Array.isArray(result.genres) ? result.genres.map(String) : []
  return {
    name: String(result.trackName ?? ''),
    description: String(result.description ?? ''),
    releaseNotes: String(result.releaseNotes ?? ''),
    version: String(result.version ?? ''),
    sellerName: String(result.sellerName ?? result.artistName ?? ''),
    bundleId: String(result.bundleId ?? ''),
    category: String(result.primaryGenreName ?? genres[0] ?? ''),
    categories: genres,
    ageRating: String(result.trackContentRating ?? result.contentAdvisoryRating ?? ''),
    advisories: Array.isArray(result.advisories) ? result.advisories.map(String) : [],
    languages: Array.isArray(result.languageCodesISO2A) ? result.languageCodesISO2A.map(String) : [],
    price: typeof result.price === 'number' ? result.price : null,
    currency: String(result.currency ?? ''),
    formattedPrice: String(result.formattedPrice ?? ''),
    ratingAverage: typeof result.averageUserRating === 'number' ? result.averageUserRating : null,
    ratingCount: typeof result.userRatingCount === 'number' ? result.userRatingCount : null,
    icon: String(result.artworkUrl512 ?? result.artworkUrl100 ?? ''),
    screenshots: Array.isArray(result.screenshotUrls) ? result.screenshotUrls.map(String) : [],
    ipadScreenshots: Array.isArray(result.ipadScreenshotUrls) ? result.ipadScreenshotUrls.map(String) : [],
    url: String(result.trackViewUrl ?? ''),
  }
}

// ---------------------------------------------------------------------------
// Ağ
// ---------------------------------------------------------------------------

async function getText(url: string, headers: Record<string, string>): Promise<string> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) })
  if (res.status === 429) {
    throw new Error(`${url} → 429 (hız sınırı). Birkaç dakika bekleyip tekrar dene.`)
  }
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.text()
}

export interface PublicFetchOptions {
  /** Hangi vitrin — fiyatlar ülkeye göre değişir. */
  country?: string
  /** Ürün sayfası HTML'i pahalı; yalnız fiyat gerekiyorsa açık bırak. */
  withPage?: boolean
}

/**
 * Vitrin verisini çek.
 *
 * Lookup ZORUNLU (uygulama yayında değilse orada da yok — o zaman hata).
 * Ürün sayfası isteğe bağlı ve düşmesi denetimi düşürmez: yalnız IAP
 * fiyatları eksik kalır ve bu `warnings`'e yazılır.
 */
export async function fetchPublicListing(
  appId: string,
  opts: PublicFetchOptions = {},
): Promise<PublicListing> {
  const country = (opts.country ?? 'us').toLowerCase()
  const warnings: string[] = []
  const sources: string[] = []

  const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=${country}`
  const raw = await getText(lookupUrl, { 'User-Agent': UA, Accept: 'application/json' })
  sources.push(lookupUrl)

  let payload: any
  try {
    payload = JSON.parse(raw)
  } catch {
    throw new Error('iTunes Lookup JSON değil — Apple hata sayfası döndürmüş olabilir.')
  }
  const result = payload?.results?.[0]
  if (!result) {
    throw new Error(
      `${appId} ${country.toUpperCase()} vitrininde bulunamadı. ` +
        'Uygulama henüz yayında değilse burada HİÇ görünmez — bu normaldir, ' +
        'vitrin yalnız yayındaki sürümü bilir.',
    )
  }

  const listing: PublicListing = {
    appId: String(appId),
    country,
    url: '',
    name: '', description: '', releaseNotes: '', version: '', sellerName: '', bundleId: '',
    category: '', categories: [], ageRating: '', advisories: [], languages: [],
    price: null, currency: '', formattedPrice: '',
    ratingAverage: null, ratingCount: null,
    icon: '', screenshots: [], ipadScreenshots: [],
    iaps: [], iapListTruncated: false,
    sources, warnings,
    ...parseLookup(result),
  }
  listing.sources = sources
  listing.warnings = warnings

  if (opts.withPage === false) return listing

  // Ürün sayfası: yalnız IAP fiyatları için. Lookup'tan hemen sonra art arda
  // istek atmıyoruz — aynı hosta saniyede iki istek gereksiz.
  await sleep(600)
  const pageUrl = listing.url || `https://apps.apple.com/${country}/app/id${appId}`
  try {
    const html = await getText(pageUrl, PAGE_HEADERS)
    sources.push(pageUrl)
    const { iaps, warnings: uyarilar } = parseStorePage(html)
    listing.iaps = iaps
    listing.iapListTruncated = iaps.length >= IAP_SAYFA_TAVANI
    warnings.push(...uyarilar)
    if (listing.iapListTruncated) {
      warnings.push(
        `Vitrin en çok ${IAP_SAYFA_TAVANI} ürün gösteriyor; ürün sayısı bunun üstündeyse gerisi burada YOK.`,
      )
    }
  } catch (e) {
    warnings.push(`Ürün sayfası okunamadı, IAP fiyatları alınamadı: ${(e as Error).message}`)
  }

  return listing
}

// ---------------------------------------------------------------------------
// Çapraz kontrol
// ---------------------------------------------------------------------------

export interface PriceCrossCheck {
  productName: string
  /** ASC/döküm tarafındaki fiyat. */
  ours: number
  /** Vitrindeki fiyat. */
  theirs: number
  verdict: 'uyuşuyor' | 'ÇELİŞİYOR' | 'bizde okunamadı'
}

/**
 * Bizim okuduğumuz fiyatlarla vitrindekileri karşılaştır.
 *
 * NEDEN: fiyat okunamadığında `price=0` yazıyoruz ve fiyata bakan kurallar
 * ürünü "bedava" sanabiliyor. Vitrin BAĞIMSIZ bir kaynak: 0 yazdığımız ürün
 * orada $9.99 ise, elimizdeki veri yanlış demektir ve bunu kanıtla söyleriz.
 *
 * Eşleştirme ADA göre yapılıyor — ASC'deki ürün adı ile vitrindeki ad aynı
 * alandan geliyor. Ad tutmuyorsa eşleştirmiyoruz; zorlamak yanlış ürüne
 * yanlış fiyat yazmak olurdu.
 */
export function crossCheckPrices(
  ours: Array<{ name: string; price: number }>,
  theirs: PublicIap[],
): PriceCrossCheck[] {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const map = new Map(theirs.map((t) => [norm(t.name), t]))
  const out: PriceCrossCheck[] = []
  for (const mine of ours) {
    const hit = map.get(norm(mine.name))
    if (!hit || hit.price === null) continue
    out.push({
      productName: mine.name,
      ours: mine.price,
      theirs: hit.price,
      verdict:
        mine.price === 0 && hit.price > 0
          ? 'bizde okunamadı'
          : Math.abs(mine.price - hit.price) < 0.01
            ? 'uyuşuyor'
            : 'ÇELİŞİYOR',
    })
  }
  return out
}
