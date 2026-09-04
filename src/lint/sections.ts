/**
 * Kesin kontroller hangi Apple maddesine dayanıyor?
 *
 * NEDEN VAR. Kartlar madde numarasına çapalı ve rapor onu yazıyor: okuyan
 * gidip Apple'ın kendi cümlesini okuyabiliyor. Lint bulgularında bu yoktu —
 * yalnızca `lint-demo-account-missing` gibi bir iç kimlik görünüyordu. Oysa
 * "gönderimi engelleyen" sorunların ÇOĞU lint'ten geliyor; itiraz etmek ya da
 * ofise göstermek için dayanağın görünmesi gerekiyor.
 *
 * Kimlikler kısmen şablonlu (`lint-limit-<alan>`, `lint-<url>-url-dead`), o
 * yüzden düz tablo değil, kalıp da çözen bir fonksiyon.
 */
const TABLO: Record<string, string> = {
  'lint-privacy-policy-missing': '5.1.1',
  'lint-demo-account-missing': '2.1',
  'lint-demo-account-placeholder': '2.1',
  'lint-iap-not-submitted': '2.1',
  'lint-icon-missing': '2.3.3',
  'lint-screenshots-too-few': '2.3.3',
  'lint-screenshots-missing-device-class': '2.3.3',
  'lint-screenshots-vs-devicefamilies': '2.3.3',
  'lint-devicefamily-without-screenshots': '2.3.3',
  'lint-custom-page-not-audited': '2.3.3',
  'lint-keywords-spaces': '2.3.7',
  'lint-keyword-brand-term': '2.3.7',
  'lint-price-mismatch': '2.3.1',
  'lint-price-store-mismatch': '2.3.1',
  'lint-price-unreadable-but-live': '2.3.1',
  'lint-trial-no-autorenew-mention': '3.1.2',
  'lint-trial-claimed-but-no-offer': '3.1.2',
  'lint-subscription-period-too-short': '3.1.2(a)',
  'lint-age-rating-ugc-mismatch': '2.3.6',
  'lint-age-declaration-ugc': '2.3.6',
  'lint-age-declaration-content': '2.3.6',
  'lint-age-declaration-gambling': '2.3.6',
  'lint-age-declaration-drift': '2.3.6',
  'lint-att-claim-contradiction': '5.1.2',
  'lint-anonymity-claim-contradiction': '5.1.1',
}

/** Şablonlu kimlikler: `lint-limit-name`, `lint-privacy-url-dead` … */
const KALIPLAR: Array<[RegExp, string]> = [
  [/^lint-limit-/, '2.3.7'],
  [/-url-(missing|dead)$/, '1.5'],
]

export function lintSection(checkId: string): string | undefined {
  if (TABLO[checkId]) return TABLO[checkId]
  for (const [re, sec] of KALIPLAR) if (re.test(checkId)) return sec
  return undefined
}

export function lintSectionUrl(checkId: string): string | undefined {
  const s = lintSection(checkId)
  return s ? `https://developer.apple.com/app-store/review/guidelines/#${s}` : undefined
}

/** Test için: tabloda ve kalıplarda tanımlı tüm kimlikler. */
export const BILINEN_LINT_KIMLIKLERI = Object.keys(TABLO)
