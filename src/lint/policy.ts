import type { Submission, LintFinding } from '../types.js'

/**
 * Politika alanlarının varlık/tutarlılık kontrolleri — LLM gerektirmeyen kısım.
 */
export async function checkPolicyFields(sub: Submission): Promise<LintFinding[]> {
  const out: LintFinding[] = []

  // Red sebebi #5: gizlilik politikası olmadan gönderim kabul edilmiyor.
  // URL'in canlı olup olmadığını lint/urls.ts kontrol ediyor; burada
  // beyanın varlığına bakıyoruz.
  if (!sub.urls.privacy) {
    out.push({
      checkId: 'lint-privacy-policy-missing',
      platform: sub.platform,
      severity: 'high',
      artifact: 'urls',
      message: 'Gizlilik politikası URL alanı boş. Bu alan her gönderimde zorunlu.',
      suggestedFix: 'Gizlilik politikası sayfası yayınla ve URL alanına gir.',
    })
  }

  // Red sebebi #20 — deterministik yarısı. Kullanıcı içeriği barındıran bir
  // uygulama en düşük yaş sınırına konamaz; bu bir yargı değil, kesin bayrak.
  const LOWEST = ['4+', 'Everyone', 'Herkes']
  if (sub.meta.hasUserGeneratedContent && LOWEST.includes(sub.ageRating)) {
    out.push({
      checkId: 'lint-age-rating-ugc-mismatch',
      platform: sub.platform,
      severity: 'high',
      artifact: 'ageRating',
      message: `Uygulama kullanıcı içeriği barındırıyor ama yaş sınırı "${sub.ageRating}".`,
      suggestedFix: 'Yaş sınırını yükselt ve içerik moderasyonu/şikayet mekanizmasını belgele.',
    })
  }

  return out
}
