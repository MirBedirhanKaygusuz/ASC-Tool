import type { Submission, LintFinding, Platform } from '../types.js'
import { keywordTerms, markaBul } from './brands.js'

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

/**
 * 2.3.7: anahtar kelimelerde başkasının markası.
 *
 * ÖLÇÜMLE TAŞINDI. Bu iş bir LLM kartındaydı ve iki koşuda 9 ham bulgu üretip
 * hiçbirini savunmadan geçiremedi — ama sebebi kartın yanılması değildi:
 * gerçek ihlalleri (keywords içinde "tiktok", "reels") buluyor, alıntı olarak
 * virgüllü dizinin tamamını verdiği için ikinci göz "çoğu jenerik" deyip
 * eliyordu. Boru hattı DOĞRU bulguyu kaybediyordu. Liste sorgusu modele
 * sorulmaz: burada kesin, bedava ve ihlal eden terimi tek başına raporluyor.
 */
export async function checkKeywordBrands(sub: Submission): Promise<LintFinding[]> {
  const out: LintFinding[] = []
  // Yalnız anahtar kelimeler: orada marka kullanımının bağlamı yok, kural
  // katı. Açıklama ve altyazıda aynı ad meşru olabilir ("export to Instagram")
  // — orası 5.2 kartının işi, bağlamla karar veriliyor.
  for (const term of keywordTerms(sub.text.keywords ?? '')) {
    const marka = markaBul(term)
    if (!marka) continue
    out.push({
      checkId: 'lint-keyword-brand-term',
      platform: sub.platform,
      severity: 'high',
      artifact: 'keywords',
      message:
        `Anahtar kelimelerde "${term}" geçiyor — "${marka.term}" başkasına ait ` +
        `${marka.tur}. Apple 2.3.7 metadata'nın marka terimleriyle doldurulmasını yasaklıyor.`,
      suggestedFix: `"${term}" terimini anahtar kelimelerden çıkar.`,
    })
  }
  return out
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
