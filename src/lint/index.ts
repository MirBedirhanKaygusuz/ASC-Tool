/**
 * Lint katmanı — LLM gerektirmeyen, kesin cevaplı kontroller.
 *
 * Bunlar red sebeplerinin ciddi bir kısmını oluşturur ve %100 precision'la
 * çalışır. Aynı zamanda LLM katmanının değerini ölçerken baseline görevi görür:
 * "LLM, lint'in üstüne ne kattı?"
 */
import type { Submission, LintFinding } from '../types.js'
import { checkUrls, type UrlCheckOptions } from './urls.js'
import { checkLimits, checkKeywordBrands } from './limits.js'
import { checkMedia } from './media.js'
import { checkIap } from './iap.js'
import { checkReviewNotes } from './review-notes.js'
import { checkPolicyFields } from './policy.js'
import { checkIapState, checkTrialClaim } from './iap-state.js'
import { checkPrivacyClaims, checkAgeDeclaration } from './declarations.js'
import { checkDeviceFamilies, checkCoverage } from './device.js'

export interface LintOptions extends UrlCheckOptions {}

export interface LintResult {
  bulgular: LintFinding[]
  /**
   * Veri olmadığı için ÇALIŞAMAYAN kontroller.
   *
   * Bir kontrolün üç sonucu var: ihlal, temiz, veri yok. Üçüncüsünü ikincisi
   * gibi göstermek bu projedeki en pahalı hata — rapor "temiz" der, oysa
   * bakılmamıştır. Bu liste rapordaki "Denetlenmedi" bloğuna gider.
   */
  denetlenmedi: string[]
}

export async function runLint(sub: Submission, opts: LintOptions = {}): Promise<LintResult> {
  const [urls, limits, media, iap, notes, policy] = await Promise.all([
    checkUrls(sub, opts),
    checkLimits(sub),
    checkMedia(sub),
    checkIap(sub),
    checkKeywordBrands(sub),
    checkReviewNotes(sub),
    checkPolicyFields(sub),
  ])

  // Beyana dayanan kontroller: veri yoksa bulgu değil "denetlenmedi" üretirler.
  const beyan = [
    checkIapState(sub),
    checkTrialClaim(sub),
    checkPrivacyClaims(sub),
    checkAgeDeclaration(sub),
    checkDeviceFamilies(sub),
    checkCoverage(sub),
  ]

  return {
    bulgular: [
      ...urls, ...limits, ...media, ...iap, ...notes, ...policy,
      ...beyan.flatMap((r) => r.bulgular),
    ],
    denetlenmedi: beyan.flatMap((r) => r.denetlenmedi),
  }
}
