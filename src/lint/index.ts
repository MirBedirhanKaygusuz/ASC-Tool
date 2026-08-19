/**
 * Lint katmanı — LLM gerektirmeyen, kesin cevaplı kontroller.
 *
 * Bunlar red sebeplerinin ciddi bir kısmını oluşturur ve %100 precision'la
 * çalışır. Aynı zamanda LLM katmanının değerini ölçerken baseline görevi görür:
 * "LLM, lint'in üstüne ne kattı?"
 */
import type { Submission, LintFinding } from '../types.js'
import { checkUrls } from './urls.js'
import { checkLimits } from './limits.js'
import { checkMedia } from './media.js'
import { checkIap } from './iap.js'
import { checkReviewNotes } from './review-notes.js'
import { checkPolicyFields } from './policy.js'

export async function runLint(sub: Submission): Promise<LintFinding[]> {
  const results = await Promise.all([
    checkUrls(sub),
    checkLimits(sub),
    checkMedia(sub),
    checkIap(sub),
    checkReviewNotes(sub),
    checkPolicyFields(sub),
  ])
  return results.flat()
}
