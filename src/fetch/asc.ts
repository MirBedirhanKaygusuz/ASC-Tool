import { readFile } from 'node:fs/promises'
import { createSign } from 'node:crypto'
import type { Submission, IapItem, MediaRef } from '../types.js'
import { priceFromRecords } from '../iap-price.js'
import {
  humanizeCategory, AGE_RATING, deviceClassOf, PERIOD, renderUrl,
  SCREENSHOT_MAX_EDGE, ICON_MAX_EDGE,
} from './apple-tables.js'

/**
 * App Store Connect API → Submission.
 *
 * KAPSAM: yalnızca listing. Red gerekçeleri bu API'de YOK (Resolution Center
 * public API'ye hiç konmadı) — onlar tarayıcı oturumundan geliyor,
 * bkz. scripts/asc-grab.js. Buradaki iş "neyi denetleyeceğiz", oradaki iş
 * "neye göre denetleyeceğiz".
 *
 * Apple veriyi üç ayrı ağaca bölmüş ve isimler yanıltıcı:
 *   appInfos            → ad, altyazı, kategori, yaş sınırı, gizlilik URL'i
 *   appStoreVersions    → açıklama, keywords, promo, yenilikler, destek URL'i
 *   subscriptionGroups  → abonelikler (fiyat ve deneme ayrı uçlarda)
 * Bu yüzden tek bir "listing" çağrısı yok; aşağısı o ağaçları birleştiriyor.
 */

const BASE = 'https://api.appstoreconnect.apple.com/v1'

export interface AscConfig {
  keyId: string
  issuerId: string
  privateKeyPath: string
}

export function ascConfigFromEnv(): AscConfig {
  const keyId = process.env.ASC_KEY_ID?.trim()
  const issuerId = process.env.ASC_ISSUER_ID?.trim()
  const privateKeyPath = process.env.ASC_PRIVATE_KEY_PATH?.trim()
  const missing = [
    !keyId && 'ASC_KEY_ID',
    !issuerId && 'ASC_ISSUER_ID',
    !privateKeyPath && 'ASC_PRIVATE_KEY_PATH',
  ].filter(Boolean)
  if (missing.length) {
    throw new Error(
      `App Store Connect kimlik bilgileri eksik: ${missing.join(', ')}. ` +
        '.env dosyasına ekle (şablon: .env.example).',
    )
  }
  return { keyId: keyId!, issuerId: issuerId!, privateKeyPath: privateKeyPath! }
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/**
 * ES256 JWT.
 *
 * İki tuzak: (1) Apple imzayı JOSE biçiminde (r||s, 64 bayt) bekler, Node'un
 * varsayılanı DER'dir — `dsaEncoding` şart. (2) exp en fazla 20 dakika olabilir;
 * daha uzunu 401 döner.
 */
async function signJwt(cfg: AscConfig): Promise<string> {
  const pem = await readFile(cfg.privateKeyPath, 'utf8')
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'ES256', kid: cfg.keyId, typ: 'JWT' }
  const payload = {
    iss: cfg.issuerId,
    iat: now,
    exp: now + 19 * 60,
    aud: 'appstoreconnect-v1',
  }
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = createSign('SHA256')
    .update(signingInput)
    .sign({ key: pem, dsaEncoding: 'ieee-p1363' })
  return `${signingInput}.${b64url(signature)}`
}

interface Resource {
  id: string
  type: string
  attributes?: Record<string, any>
  relationships?: Record<string, { data?: any }>
}
interface Payload {
  data: Resource | Resource[]
  included?: Resource[]
  links?: { next?: string }
}

export class AscClient {
  private token = ''
  private tokenExpiry = 0

  constructor(private readonly cfg: AscConfig) {}

  private async auth(): Promise<string> {
    // Token 20 dakikalık; her istekte yeniden imzalamak gereksiz maliyet.
    if (this.token && Date.now() < this.tokenExpiry) return this.token
    this.token = await signJwt(this.cfg)
    this.tokenExpiry = Date.now() + 15 * 60 * 1000
    return this.token
  }

  /**
   * 429 ve 5xx'te yeniden dener.
   *
   * Apple bu uçlarda ara ara UNEXPECTED_ERROR (500) döndürüyor; tek seferlik
   * bir aksaklık tüm denetimi düşürmemeli. 4xx'ler (401/403/404) kalıcıdır,
   * onlarda beklemek yalnızca zaman kaybı.
   */
  async get(path: string): Promise<Payload> {
    const url = path.startsWith('http') ? path : BASE + path
    const MAX_ATTEMPTS = 4
    let lastStatus = 0
    let lastDetail = ''

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const token = await this.auth()
      let res: Response
      try {
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(60_000),
        })
      } catch (e) {
        // Zaman aşımı ve ağ hatası da geçicidir; yeniden denemenin DIŞINDA
        // kalırsa tek yavaş yanıt tüm denetimi düşürür.
        lastStatus = 0
        lastDetail = (e as Error).message
        if (attempt === MAX_ATTEMPTS) break
        await new Promise((r) => setTimeout(r, Math.min(20_000, 1000 * 2 ** attempt)))
        continue
      }
      if (res.ok) return res.json() as Promise<Payload>

      lastStatus = res.status
      lastDetail = (await res.text()).slice(0, 300)
      if (res.status === 401) {
        throw new Error(
          'App Store Connect 401 — anahtar reddedildi. Key ID / Issuer ID / .p8 ' +
            `üçlüsünün aynı anahtara ait olduğunu doğrula. ${lastDetail}`,
        )
      }
      const retriable = res.status === 429 || res.status >= 500
      if (!retriable || attempt === MAX_ATTEMPTS) break

      const header = Number(res.headers.get('retry-after')) * 1000
      const wait = Number.isFinite(header) && header > 0 ? header : 1000 * 2 ** attempt
      await new Promise((r) => setTimeout(r, Math.min(20_000, wait)))
    }

    throw new Error(`App Store Connect ${lastStatus} ${path}\n${lastDetail}`)
  }

  /** links.next'i takip ederek tüm sayfaları toplar. */
  async list(path: string): Promise<{ data: Resource[]; included: Resource[] }> {
    let payload = await this.get(path)
    const data = [...(Array.isArray(payload.data) ? payload.data : [payload.data])]
    const included = [...(payload.included ?? [])]
    while (payload.links?.next) {
      payload = await this.get(payload.links.next)
      data.push(...(Array.isArray(payload.data) ? payload.data : [payload.data]))
      included.push(...(payload.included ?? []))
    }
    return { data, included }
  }

  /** Tek kaynak; 404'te null (ör. henüz review detayı girilmemiş sürüm). */
  async one(path: string): Promise<Resource | null> {
    try {
      const payload = await this.get(path)
      return Array.isArray(payload.data) ? (payload.data[0] ?? null) : payload.data
    } catch (e) {
      if (/ 404 /.test((e as Error).message)) return null
      throw e
    }
  }
}

// ---------------------------------------------------------------------------

/**
 * Denetlenecek sürümü seç.
 *
 * Hazırlanmakta olan sürüm varsa onu alırız — denetimin amacı gönderilmeden
 * önce yakalamak. Yoksa en son sürüme düşeriz (yayındakini denetlemek de
 * anlamlı, ama bu bir geri çekilme; çağıran bilsin diye durumu döndürüyoruz.)
 */
const EDITABLE_STATES = new Set([
  'PREPARE_FOR_SUBMISSION',
  'DEVELOPER_REJECTED',
  'REJECTED',
  'METADATA_REJECTED',
  'WAITING_FOR_REVIEW',
  'IN_REVIEW',
  'PENDING_DEVELOPER_RELEASE',
  'READY_FOR_REVIEW',
])

function versionState(r: Resource): string {
  return String(r.attributes?.appVersionState ?? r.attributes?.appStoreState ?? '')
}

function pickVersion(versions: Resource[]): Resource | null {
  if (!versions.length) return null
  return versions.find((v) => EDITABLE_STATES.has(versionState(v))) ?? versions[0]!
}







/**
 * Uygulama ikonu.
 *
 * Listing'de değil, BUILD'in içinde duruyor — Apple ikonu ipa'dan çıkarıyor.
 * Bu yüzden sürüm → build → buildIcons zinciri gerekiyor. Sürüme henüz build
 * bağlanmadıysa uygulamanın en son build'ine düşüyoruz.
 */
async function fetchIcon(
  client: AscClient,
  appId: string,
  versionId: string,
  warn: (m: string) => void,
): Promise<MediaRef | undefined> {
  let build = await client.one(`/appStoreVersions/${versionId}/build`)
  if (!build) {
    const builds = await client.list(`/apps/${appId}/builds?limit=1`)
    build = builds.data[0] ?? null
  }
  if (!build) {
    warn('Sürüme bağlı build yok — ikon okunamadı. "ikon eksik" bulgusu bu yüzden çıkmış olabilir.')
    return undefined
  }
  const icons = await client.list(`/builds/${build.id}/icons`)
  // MARKETING = App Store'da görünen 1024'lük ikon; yoksa eldekinin ilki.
  const chosen =
    icons.data.find((i) => String(i.attributes?.iconType ?? '') === 'MARKETING') ?? icons.data[0]
  const asset = chosen?.attributes?.iconAsset
  if (!asset) {
    warn('Build\'de ikon kaydı yok — ikon okunamadı.')
    return undefined
  }
  return {
    id: chosen!.id,
    path: renderUrl(asset, ICON_MAX_EDGE),
    width: asset.width,
    height: asset.height,
  }
}

export interface FetchOptions {
  /** Hangi dilin metinleri denetlenecek. Boşsa uygulamanın birincil dili. */
  locale?: string
  /** Fiyatların hangi ülkeye göre okunacağı. */
  territory?: string
  /** Uyarıları buraya yazar (denetimi düşürmeyen eksikler). */
  onWarn?: (message: string) => void
}

export async function fetchSubmission(
  appId: string,
  opts: FetchOptions = {},
): Promise<Submission> {
  const client = new AscClient(ascConfigFromEnv())
  const warn = opts.onWarn ?? (() => {})
  const territory = opts.territory ?? 'USA'

  // --- Uygulama kimliği ------------------------------------------------------
  const app = await client.one(`/apps/${appId}`)
  if (!app) throw new Error(`Uygulama bulunamadı: ${appId}`)
  const primaryLocale = String(app.attributes?.primaryLocale ?? 'en-US')
  const locale = opts.locale ?? primaryLocale

  // --- appInfos: ad, altyazı, kategori, yaş sınırı, gizlilik URL'i -----------
  const infos = await client.list(
    `/apps/${appId}/appInfos?include=primaryCategory,ageRatingDeclaration`,
  )
  const info = infos.data[0]
  let name = String(app.attributes?.name ?? '')
  let subtitle = ''
  let privacyUrl = ''
  let category = ''
  let ageRating = ''
  // Yaş sınırı beyanından geliyor: geliştiricinin Apple'a "kullanıcı içeriği
  // barındırıyorum" dediği kutu. Gerçeğin kendisi değil, BEYANI — ama Apple da
  // denetimi bu beyana göre yapıyor, dolayısıyla denetlenecek doğru değer bu.
  let userGeneratedContent: boolean | undefined

  if (info) {
    ageRating = AGE_RATING[String(info.attributes?.appStoreAgeRating ?? '')] ?? ''
    const catId = info.relationships?.primaryCategory?.data?.id
    if (catId) category = humanizeCategory(String(catId))

    const declId = info.relationships?.ageRatingDeclaration?.data?.id
    const decl = infos.included.find((r) => r.type === 'ageRatingDeclarations' && r.id === declId)
    const ugc = decl?.attributes?.userGeneratedContent
    if (typeof ugc === 'boolean') userGeneratedContent = ugc

    const locs = await client.list(`/appInfos/${info.id}/appInfoLocalizations`)
    const loc = pickLocale(locs.data, locale) ?? locs.data[0]
    if (loc) {
      name = String(loc.attributes?.name ?? name)
      subtitle = String(loc.attributes?.subtitle ?? '')
      privacyUrl = String(loc.attributes?.privacyPolicyUrl ?? '')
    }
  }
  if (!ageRating) warn('Yaş sınırı okunamadı — ageRating boş, ilgili kurallar yanılabilir.')

  // --- appStoreVersions: açıklama, keywords, promo, yenilikler ---------------
  const versions = await client.list(`/apps/${appId}/appStoreVersions?limit=20`)
  const version = pickVersion(versions.data)
  if (!version) throw new Error(`Uygulamanın hiç sürümü yok: ${appId}`)
  if (!EDITABLE_STATES.has(versionState(version))) {
    warn(
      `Hazırlanan sürüm yok; yayındaki sürüm denetleniyor ` +
        `(${version.attributes?.versionString} · ${versionState(version)}).`,
    )
  }

  const vlocs = await client.list(`/appStoreVersions/${version.id}/appStoreVersionLocalizations`)
  const vloc = pickLocale(vlocs.data, locale) ?? vlocs.data[0]
  if (!vloc) warn(`${locale} için sürüm metni yok.`)
  const va = vloc?.attributes ?? {}

  // --- Ekran görüntüleri -----------------------------------------------------
  const screenshots: MediaRef[] = []
  if (vloc) {
    const sets = await client.list(
      `/appStoreVersionLocalizations/${vloc.id}/appScreenshotSets?include=appScreenshots`,
    )
    const shots = new Map(sets.included.filter((r) => r.type === 'appScreenshots').map((r) => [r.id, r]))
    for (const set of sets.data) {
      const display = deviceClassOf(String(set.attributes?.screenshotDisplayType ?? ''))
      const refs = set.relationships?.appScreenshots?.data ?? []
      for (const [i, ref] of (refs as Array<{ id: string }>).entries()) {
        const shot = shots.get(ref.id)
        if (!shot) continue
        const asset = shot.attributes?.imageAsset
        screenshots.push({
          id: shot.id,
          path: renderUrl(asset, SCREENSHOT_MAX_EDGE),
          deviceClass: display || undefined,
          order: i + 1,
          width: asset?.width,
          height: asset?.height,
        })
      }
    }
    const undelivered = screenshots.filter((s) => !s.path).length
    if (undelivered) warn(`${undelivered} ekran görüntüsünün adresi çözülemedi (yükleme sürüyor olabilir).`)
  }

  const icon = await fetchIcon(client, appId, version.id, warn)

  // --- Review detayları: notlar + demo hesap ---------------------------------
  const review = await client.one(`/appStoreVersions/${version.id}/appStoreReviewDetail`)
  const ra = review?.attributes ?? {}
  const demoRequired = ra.demoAccountRequired === true
  if (!demoRequired) {
    warn(
      'Demo hesap işaretli değil — giriş gerekliliği kesinleşemedi. ' +
        `Giriş gerekmiyorsa: npm run meta -- --app ${appId} --no-requires-login`,
    )
  }

  // --- IAP ve abonelikler ----------------------------------------------------
  const iap = await fetchIap(client, appId, locale, territory, warn)

  return {
    platform: 'apple',
    appId: String(appId),
    appName: name,
    locale,
    category,
    ageRating,
    text: {
      name,
      subtitle,
      description: String(va.description ?? ''),
      keywords: String(va.keywords ?? ''),
      promotionalText: String(va.promotionalText ?? ''),
      whatsNew: String(va.whatsNew ?? ''),
    },
    media: { icon, screenshots },
    iap,
    urls: {
      privacy: privacyUrl || undefined,
      support: String(va.supportUrl ?? '') || undefined,
      marketing: String(va.marketingUrl ?? '') || undefined,
    },
    reviewNotes: {
      notes: String(ra.notes ?? '') || undefined,
      demoAccount: demoRequired
        ? { user: String(ra.demoAccountName ?? ''), pass: String(ra.demoAccountPassword ?? '') }
        : undefined,
    },
    meta: {
      // demoAccountRequired=true kesin bilgidir. false ise KESİN DEĞİL:
      // Sign in with Apple ile giriş isteyip demo hesap vermeyen uygulamalar
      // da bu kutuyu işaretlemiyor. Yanlış "false" 4.8 kartını sessizce
      // atlatırdı; bilinmiyor bırakıp raporda göstermek daha güvenli.
      requiresLogin: demoRequired ? true : undefined,
      hasUserGeneratedContent: userGeneratedContent,
      // generatesAiContent API'de YOK — yaş sınırı beyanının tamamı tarandı,
      // AI'a dair tek alan yok. apps/{id}.json'dan gelmek zorunda.
    },
    source: { kind: 'app-store-connect', fetchedAt: new Date().toISOString() },
  }
}

function pickLocale(resources: Resource[], locale: string): Resource | undefined {
  const want = locale.toLowerCase()
  return (
    resources.find((r) => String(r.attributes?.locale ?? '').toLowerCase() === want) ??
    // en-US isteyip yalnız en-GB varsa boş dönmektense dil kökü tutsun.
    resources.find((r) => String(r.attributes?.locale ?? '').toLowerCase().startsWith(want.split('-')[0]!))
  )
}

/**
 * Abonelikler + tek seferlik ürünler.
 *
 * Fiyat ayrı uçta ve ülkeye bağlı; deneme süresi bir başka uçta. Bunlar
 * ürün başına ek istek demek, ama fiyat/deneme olmadan 3.1.2 kuralları
 * (abonelik ifşası, deneme koşulları) boşa çalışır.
 */
/**
 * Bir ülkenin para birimi. Fiyatın yanında hangi paranın yazacağını
 * uydurmuyoruz: Apple söylüyor, biz bir kez sorup akılda tutuyoruz.
 *
 * ESKİSİ: `territory === 'USA' ? 'USD' : ''`. ABD dışında para birimi BOŞ
 * kalıyordu; "9.99" yazan bir bulgu hangi parada olduğunu söyleyemiyordu.
 */
async function currencyOf(client: AscClient, territory: string, warn: (m: string) => void): Promise<string> {
  try {
    // Tekil uç (`/territories/USA`) 403 dönüyor — anahtarın yetkisi liste
    // ucunda var, tekilde yok. Listeyi bir kez çekip içinden buluyoruz.
    const all = await client.list('/territories?limit=200')
    const hit = all.data.find((t) => String(t.id) === territory)
    if (!hit) {
      warn(`${territory} Apple'ın ülke listesinde yok — para birimi yazılamayacak.`)
      return ''
    }
    return String(hit.attributes?.currency ?? '')
  } catch (e) {
    warn(`${territory} para birimi okunamadı: ${(e as Error).message.split('\n')[0]}`)
    return ''
  }
}

async function fetchIap(
  client: AscClient,
  appId: string,
  locale: string,
  territory: string,
  warn: (m: string) => void,
): Promise<IapItem[]> {
  const items: IapItem[] = []
  const priceless: string[] = []
  const currency = await currencyOf(client, territory, warn)

  // Abonelikler
  const groups = await client.list(`/apps/${appId}/subscriptionGroups?include=subscriptions`)
  const subs = groups.included.filter((r) => r.type === 'subscriptions')
  for (const sub of subs) {
    const productId = String(sub.attributes?.productId ?? sub.id)
    let name = String(sub.attributes?.name ?? '')
    let description = ''
    const locs = await client.list(`/subscriptions/${sub.id}/subscriptionLocalizations`)
    const loc = pickLocale(locs.data, locale) ?? locs.data[0]
    if (loc) {
      name = String(loc.attributes?.name ?? name)
      description = String(loc.attributes?.description ?? '')
    }

    // Fiyat ve deneme yan uçlarda. Apple bunlarda ara ara 500 dönüyor —
    // eksik fiyat denetimi zayıflatır ama denetimin TAMAMINI düşürmesi
    // kabul edilemez. Hatayı yutup uyarıya çeviriyoruz.
    let price = 0
    try {
      // limit=1 DEĞİL: tek kayıt istemek "hangisi?" sorusunu Apple'ın
      // sıralamasına bırakıyordu ve o sıralama korunmuş fiyatı öne koyuyor.
      const prices = await client.list(
        `/subscriptions/${sub.id}/prices?include=subscriptionPricePoint&filter[territory]=${territory}&limit=200`,
      )
      const okunan = priceFromRecords(prices.data, prices.included, 'subscriptionPricePoint')
      if (okunan) {
        price = okunan.price
        if (okunan.note) warn(`${productId}: ${okunan.note}`)
      } else {
        priceless.push(productId)
      }
    } catch (e) {
      priceless.push(productId)
      warn(`${productId} fiyatı alınamadı: ${(e as Error).message.split('\n')[0]}`)
    }

    let freeTrial: IapItem['freeTrial']
    try {
      const offers = await client.list(`/subscriptions/${sub.id}/introductoryOffers?limit=20`)
      const trial = offers.data.find((o) => String(o.attributes?.offerMode ?? '') === 'FREE_TRIAL')
      if (trial) {
        freeTrial = { duration: PERIOD[String(trial.attributes?.duration ?? '')] ?? '' }
      }
    } catch (e) {
      warn(
        `${productId} için ücretsiz deneme bilgisi alınamadı: ` +
          `${(e as Error).message.split('\n')[0]}. Deneme koşulu kuralları bu üründe yanılabilir.`,
      )
    }

    items.push({
      id: productId,
      kind: 'subscription',
      name,
      description,
      price,
      currency: price ? currency : '',
      duration: PERIOD[String(sub.attributes?.subscriptionPeriod ?? '')] ?? undefined,
      freeTrial,
    })
  }

  // Tek seferlik ürünler
  const IAP_KIND: Record<string, IapItem['kind']> = {
    CONSUMABLE: 'consumable',
    NON_CONSUMABLE: 'non_consumable',
    NON_RENEWING_SUBSCRIPTION: 'non_renewing',
  }
  const purchases = await client.list(
    `/apps/${appId}/inAppPurchasesV2?include=inAppPurchaseLocalizations&limit=200`,
  )
  const iapLocs = purchases.included.filter((r) => r.type === 'inAppPurchaseLocalizations')

  // Ürün başına bir istek. Sessiz tavan yok: sınıra dayanırsak söylüyoruz.
  const TAVAN = 25
  if (purchases.data.length > TAVAN) {
    warn(`${purchases.data.length} tek seferlik üründen yalnız ilk ${TAVAN} tanesinin fiyatı okundu.`)
  }

  for (const [i, p] of purchases.data.entries()) {
    const productId = String(p.attributes?.productId ?? p.id)
    const refs = (p.relationships?.inAppPurchaseLocalizations?.data ?? []) as Array<{ id: string }>
    const mine = iapLocs.filter((l) => refs.some((r) => r.id === l.id))
    const loc = pickLocale(mine, locale) ?? mine[0]

    // FİYAT ÇİZELGESİ.
    //
    // Eskiden burada "v2 fiyat çizelgesi ayrı bir ağaç; şimdilik okumuyoruz"
    // yazıyordu ve her tek seferlik ürüne price=0 yazılıyordu. Uyarı vardı
    // ama sonuç yine de yanlıştı: fiyata bakan kurallar bu ürünleri BEDAVA
    // sanıyordu.
    //
    // Doğru yol (2026-08-21'de gerçek hesapta doğrulandı):
    //   /v1/inAppPurchasePriceSchedules/{iapId}/manualPrices
    //     ?include=inAppPurchasePricePoint&filter[territory]=USA
    // `/inAppPurchases/{id}/iapPriceSchedule` ise 404 döndürüyor — o yolu
    // denemiyoruz, uydurma yol Apple'a çöp trafikten başka bir şey değil.
    let price = 0
    if (i < TAVAN) {
      try {
        const sched = await client.list(
          `/inAppPurchasePriceSchedules/${p.id}/manualPrices` +
            `?include=inAppPurchasePricePoint&filter[territory]=${territory}&limit=20`,
        )
        const okunan = priceFromRecords(sched.data, sched.included, 'inAppPurchasePricePoint')
        if (okunan) {
          price = okunan.price
          if (okunan.note) warn(`${productId}: ${okunan.note}`)
        } else {
          priceless.push(productId)
        }
      } catch (e) {
        priceless.push(productId)
        warn(`${productId} fiyat çizelgesi okunamadı: ${(e as Error).message.split('\n')[0]}`)
      }
    } else {
      priceless.push(productId)
    }

    items.push({
      id: productId,
      kind: IAP_KIND[String(p.attributes?.inAppPurchaseType ?? '')] ?? 'non_consumable',
      name: String(loc?.attributes?.name ?? p.attributes?.name ?? ''),
      description: String(loc?.attributes?.description ?? ''),
      price,
      currency: price ? currency : '',
    })
  }

  if (priceless.length) {
    warn(
      `${priceless.length} ürünün fiyatı okunamadı (price=0): ${priceless.slice(0, 5).join(', ')}` +
        (priceless.length > 5 ? ' …' : '') +
        '. Fiyata bakan kurallar bunlarda yanılabilir. ' +
        'Bağımsız doğrulama için: npm run vitrin -- <appId>',
    )
  }
  return items
}
