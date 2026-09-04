import type { Submission, LintFinding } from '../types.js'

/**
 * Metinde/promo'da geçen fiyatlar ile gerçek IAP fiyatlarının çelişmesi
 * yaygın ve kesin bir red sebebi. Bunu LLM'siz yakalayabiliyoruz.
 */
const PRICE_RE = /\$\s?(\d+(?:[.,]\d{1,2})?)/g

/**
 * ISO 8601 süre → gün. Apple'ın kullandığı biçimler: P1W, P1M, P3M, P6M, P1Y
 * ve (kuralı ihlal eden) P1D, P3D gibi kısa dönemler.
 *
 * Ay ve yıl YAKLAŞIK çevriliyor — burada 7 gün eşiğinin altında mı sorusuna
 * cevap arıyoruz, gün sayısı raporlanmıyor. Tanımadığımız biçimde `null`
 * dönüyoruz: uydurma bir gün sayısıyla bulgu üretmek, hiç bulgu üretmemekten
 * kötüdür.
 */
export function donemGun(duration: string): number | null {
  const m = /^P(\d+)([DWMY])$/.exec(duration.trim().toUpperCase())
  if (!m) return null
  const n = Number(m[1])
  switch (m[2]) {
    case 'D': return n
    case 'W': return n * 7
    case 'M': return n * 30
    case 'Y': return n * 365
    default: return null
  }
}

export async function checkIap(sub: Submission): Promise<LintFinding[]> {
  const out: LintFinding[] = []
  if (sub.iap.length === 0) return out

  const realPrices = new Set(sub.iap.map((i) => i.price.toFixed(2)))

  for (const [field, value] of Object.entries(sub.text)) {
    if (!value) continue
    for (const m of value.matchAll(PRICE_RE)) {
      const raw = m[1]
      if (!raw) continue
      const normalized = Number(raw.replace(',', '.')).toFixed(2)
      if (!realPrices.has(normalized)) {
        out.push({
          checkId: 'lint-price-mismatch',
          platform: sub.platform,
          severity: 'high',
          artifact: field as LintFinding['artifact'],
          message:
            `${field} içinde "$${raw}" geçiyor ama tanımlı IAP fiyatları: ` +
            `${[...realPrices].map((p) => '$' + p).join(', ')}.`,
          suggestedFix: `Metindeki fiyatı gerçek IAP fiyatıyla eşitle veya fiyat ifadesini kaldır.`,
        })
      }
    }
  }

  // 3.1.2(a): abonelik dönemi en az YEDİ GÜN olmak zorunda.
  //
  // NEDEN LLM DEĞİL. Bu kural bir kart olarak yazılmıştı ve gpt-4o-mini
  // beş uygulamada 7 ham bulgu üretip hiçbirini savunmadan geçiremedi:
  // "Weekly Pack — dönem P1W" kaydını ihlal saydı, yani kartın kendi
  // "temizdir" örneğini. Sebep basit — model ISO 8601 süre karşılaştırması
  // yapamıyor. Oysa soru zekâ istemiyor: yapılandırılmış veri üzerinde
  // deterministik bir karşılaştırma. Karta sorulduğu sürece hem para hem
  // güven kaybıydı; burada %100 kesin ve bedava.
  for (const i of sub.iap) {
    if (i.kind !== 'subscription' || !i.duration) continue
    const gun = donemGun(i.duration)
    if (gun === null || gun >= 7) continue
    out.push({
      checkId: 'lint-subscription-period-too-short',
      platform: sub.platform,
      severity: 'high',
      artifact: 'iap',
      message:
        `"${i.name}" aboneliğinin dönemi ${i.duration} (${gun} gün) — Apple en az 7 gün istiyor.`,
      suggestedFix:
        'Abonelik dönemini en az bir haftaya çıkar (P1W). Daha kısa dönem 3.1.2(a) ihlalidir.',
    })
  }

  // Deneme süresi olan abonelik varsa, metinde otomatik yenileme ibaresi aranır.
  const hasTrial = sub.iap.some((i) => i.freeTrial)
  const allText = Object.values(sub.text).filter(Boolean).join(' ').toLowerCase()
  if (hasTrial && !/auto-?renew|otomatik yenile/.test(allText)) {
    out.push({
      checkId: 'lint-trial-no-autorenew-mention',
      platform: sub.platform,
      severity: 'high',
      artifact: 'description',
      message:
        'Ücretsiz denemeli abonelik var ama listing metinlerinde "auto-renew" ifadesi geçmiyor.',
      suggestedFix:
        'Açıklamaya deneme sonrası otomatik yenilemeyi, fiyatı ve dönemi açıkça ekle.',
    })
  }

  return out
}
