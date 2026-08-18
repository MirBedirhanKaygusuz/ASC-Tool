import type { Submission, LintFinding } from '../types.js'

/**
 * Metinde/promo'da geçen fiyatlar ile gerçek IAP fiyatlarının çelişmesi
 * yaygın ve kesin bir red sebebi. Bunu LLM'siz yakalayabiliyoruz.
 */
const PRICE_RE = /\$\s?(\d+(?:[.,]\d{1,2})?)/g

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
