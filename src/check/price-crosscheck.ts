/**
 * Okunamayan fiyatları BAĞIMSIZ bir kaynaktan doğrula.
 *
 * NEDEN VAR: fiyat okunamadığında `price=0` yazıyoruz. Sıfır, "bedava" ile
 * "bilmiyoruz"un aynı kovaya düşmesi demek — fiyata bakan kurallar (3.1.2
 * fiyat görünürlüğü, `lint-price-mismatch`) o üründe sessizce yanılır.
 * Uyarı yazmak yetmiyor: kullanıcı "gerçekten bedava mı, yoksa mı?" sorusuyla
 * baş başa kalıyor.
 *
 * Herkese açık App Store vitrini bu soruyu kapatıyor: aynı ürünün fiyatını
 * hiçbir yetki olmadan söylüyor. İki kaynak aynı sayıyı söylüyorsa veri
 * doğrudur; söylemiyorsa hangi tarafın yanıldığını KANITLA yazarız.
 *
 * AĞA YALNIZ GEREKİRSE ÇIKAR: fiyatı okunamayan ürün yoksa tek istek atılmaz.
 * Vitrin yalnız YAYINDAKİ sürümü bilir; hazırlanan sürümün yeni ürünü orada
 * görünmez ve bu bir arıza değildir (aşağıda "eşleşmedi" diye raporlanır).
 */
import type { Submission, LintFinding } from '../types.js'

export interface PriceCrossCheckOptions {
  /**
   * Vitrine bakılsın mı? Tarayıcıda ağ erişimi kullanıcı iznine bağlı; izin
   * yoksa sınama atlanır ve "denetlenmedi" diye raporlanır — çalışan veriyi
   * "doğrulanamadı" diye göstermek, hiç bakmamaktan iyidir ama sessizce
   * "doğrulandı" demek en kötüsüdür.
   */
  enabled?: boolean
  /** Hangi vitrin — fiyatlar ülkeye göre değişir. */
  country?: string
}

export interface PriceCrossCheckResult {
  findings: LintFinding[]
  /** Rapordaki "Denetlenmedi" listesine eklenecek satırlar. */
  notChecked: string[]
}

const okunamadi = (p: { price: number }) => !Number.isFinite(p.price) || p.price === 0

export async function crossCheckMissingPrices(
  sub: Submission,
  opts: PriceCrossCheckOptions = {},
): Promise<PriceCrossCheckResult> {
  const fiyatsiz = sub.iap.filter(okunamadi)
  if (!fiyatsiz.length) return { findings: [], notChecked: [] }

  const etiket = fiyatsiz.map((p) => p.name || p.id).slice(0, 5).join(', ')
  const kuyruk = fiyatsiz.length > 5 ? ' …' : ''

  if (opts.enabled === false) {
    return {
      findings: [],
      notChecked: [
        `${fiyatsiz.length} ürünün fiyatı okunamadı (${etiket}${kuyruk}) ve vitrin doğrulaması ` +
          'kapalı — bu ürünlerde fiyata bakan kurallar yanılabilir.',
      ],
    }
  }

  // ASC ülke kodu (USA) ile vitrin kodu (us) aynı şey değil. Eşlenemeyen kodda
  // varsayılana düşüyoruz ama bunu SÖYLÜYORUZ: yanlış ülkenin fiyatını doğru
  // sanmak, hiç bakmamaktan kötü.
  const { storefrontOf } = await import('../fetch/apple-tables.js')
  const vitrinKodu = storefrontOf(opts.country)
  const uyari: string[] = []
  if (opts.country && !vitrinKodu) {
    uyari.push(`"${opts.country}" vitrin koduna çevrilemedi; ABD vitrini kullanıldı.`)
  }

  let listing: Awaited<ReturnType<typeof import('../fetch/public-store.js')['fetchPublicListing']>>
  try {
    const { fetchPublicListing } = await import('../fetch/public-store.js')
    listing = await fetchPublicListing(sub.appId, { country: vitrinKodu })
  } catch (e) {
    return {
      findings: [],
      notChecked: [
        `${fiyatsiz.length} ürünün fiyatı okunamadı ve vitrinden doğrulanamadı: ` +
          `${(e as Error).message}`,
      ],
    }
  }

  const { crossCheckPrices } = await import('../fetch/public-store.js')
  const kontrol = crossCheckPrices(
    sub.iap.map((p) => ({ name: p.name, price: p.price })),
    listing.iaps,
  )

  const findings: LintFinding[] = []
  const notChecked: string[] = [...uyari]
  const eslesen = new Set(kontrol.map((k) => k.productName))

  for (const k of kontrol) {
    if (k.verdict === 'uyuşuyor') continue

    if (k.verdict === 'bizde okunamadı') {
      findings.push({
        checkId: 'lint-price-unreadable-but-live',
        platform: sub.platform,
        severity: 'medium',
        artifact: 'iap',
        message:
          `"${k.productName}" fiyatı App Store Connect'ten okunamadı (0 yazıldı) ama ` +
          `App Store vitrininde ${k.theirs} ${listing.currency} görünüyor. ` +
          'Fiyata bakan kurallar bu üründe "bedava" sanarak yanılır.',
        suggestedFix:
          'Çekimi yenile; sorun sürerse fiyat çizelgesi ucunun yanıtına bak ' +
          '(çekim günlüğü → "Okunamayan uçlar").',
      })
      continue
    }

    // ÇELİŞİYOR: iki kaynak da bir sayı söylüyor ama farklı. Bu, sıfırdan daha
    // sinsi bir hata — sayı dolu olduğu için kimse şüphelenmiyor. Sahada
    // görüldü: korunmuş (preserved) abonelik fiyatı güncel fiyat sanılmıştı.
    findings.push({
      checkId: 'lint-price-store-mismatch',
      platform: sub.platform,
      severity: 'medium',
      artifact: 'iap',
      message:
        `"${k.productName}" için App Store Connect ${k.ours} diyor, App Store vitrini ` +
        `${k.theirs} ${listing.currency} gösteriyor. Yeni müşterinin gördüğü fiyat vitrindeki.`,
      suggestedFix:
        'Ürünün fiyat çizelgesini kontrol et: eski müşterilere korunan (preserved) ' +
        'fiyat ile güncel fiyat karışmış olabilir.',
    })
  }

  const eslesmeyen = fiyatsiz.filter((p) => !eslesen.has(p.name))
  if (eslesmeyen.length) {
    notChecked.push(
      `${eslesmeyen.length} ürünün fiyatı okunamadı ve vitrinde eşleşmedi ` +
        `(${eslesmeyen.map((p) => p.name || p.id).slice(0, 5).join(', ')}): ` +
        'ürün henüz yayında olmayabilir. Ad zorla eşleştirilmedi.',
    )
  }
  if (listing.iapListTruncated) {
    notChecked.push(
      'Vitrin en fazla 10 ürün gösteriyor; listedeki eksik ürünler doğrulanamadı.',
    )
  }

  return { findings, notChecked }
}
