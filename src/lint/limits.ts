import type { Submission, LintFinding, Platform } from '../types.js'

/** Mağazaların sabit karakter limitleri. Aşımı doğrudan reddedilir/kesilir. */
const LIMITS: Record<Platform, Partial<Record<string, number>>> = {
  apple: {
    name: 30,
    subtitle: 30,
    keywords: 100,
    promotionalText: 170,
    description: 4000,
    whatsNew: 4000,
  },
  google: {
    name: 30,
    shortDescription: 80,
    description: 4000,
  },
}

export async function checkLimits(sub: Submission): Promise<LintFinding[]> {
  const out: LintFinding[] = []
  const limits = LIMITS[sub.platform]

  for (const [field, max] of Object.entries(limits)) {
    if (max === undefined) continue
    const value = sub.text[field as keyof typeof sub.text]
    if (!value) continue
    if (value.length > max) {
      out.push({
        checkId: `lint-limit-${field}`,
        platform: sub.platform,
        severity: 'high',
        artifact: field as LintFinding['artifact'],
        message: `${field} ${value.length} karakter, limit ${max}. ${value.length - max} karakter fazla.`,
        suggestedFix: `${field} alanını ${max} karaktere indir.`,
      })
    }
  }

  // Apple keyword alanı virgülle ayrılır; boşluk karakter israfıdır.
  if (sub.platform === 'apple' && sub.text.keywords?.includes(', ')) {
    out.push({
      checkId: 'lint-keywords-spaces',
      platform: 'apple',
      severity: 'low',
      artifact: 'keywords',
      message: "Keyword alanında virgülden sonra boşluk var — limitten sayılır.",
      suggestedFix: "Virgülden sonraki boşlukları kaldır: 'a,b,c'",
    })
  }

  return out
}
