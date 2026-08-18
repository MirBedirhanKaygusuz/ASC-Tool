import type { Submission, LintFinding } from '../types.js'

/**
 * Apple 2.1: giriş gerektiren uygulamada demo hesap yoksa reviewer içeri
 * giremez ve doğrudan reddedilir. En sık red sebeplerinden biri.
 */
export async function checkReviewNotes(sub: Submission): Promise<LintFinding[]> {
  const out: LintFinding[] = []

  if (sub.meta.requiresLogin && !sub.reviewNotes.demoAccount) {
    out.push({
      checkId: 'lint-demo-account-missing',
      platform: sub.platform,
      severity: 'high',
      artifact: 'reviewNotes',
      message:
        'Uygulama giriş gerektiriyor ama review notlarında demo hesap bilgisi yok.',
      suggestedFix:
        'App Review Information > Sign-In Required alanına çalışan bir test hesabı gir.',
    })
  }

  return out
}
