import type { Submission, LintFinding } from '../types.js'

/**
 * Apple 2.1: giriş gerektiren uygulamada demo hesap yoksa reviewer içeri
 * giremez ve doğrudan reddedilir. En sık red sebeplerinden biri.
 */
export async function checkReviewNotes(sub: Submission): Promise<LintFinding[]> {
  const out: LintFinding[] = []

  const demo = sub.reviewNotes.demoAccount

  // Red sebebi #3: demo hesap VAR ama kullanılamaz. Gerçek doğrulama giriş
  // uç noktası ister; placeholder/eksik olanı kod ile yakalayabiliyoruz.
  if (demo) {
    const PLACEHOLDERS = ['test', 'demo', 'todo', 'xxx', 'user', 'pass', 'password', '1234', 'changeme', 'admin']
    const suspicious: string[] = []
    if (!demo.user?.trim()) suspicious.push('kullanıcı adı boş')
    if (!demo.pass?.trim()) suspicious.push('şifre boş')
    if (demo.user && PLACEHOLDERS.includes(demo.user.trim().toLowerCase())) suspicious.push(`kullanıcı adı yer tutucu ("${demo.user}")`)
    if (demo.pass && PLACEHOLDERS.includes(demo.pass.trim().toLowerCase())) suspicious.push(`şifre yer tutucu ("${demo.pass}")`)
    if (suspicious.length) {
      out.push({
        checkId: 'lint-demo-account-placeholder',
        platform: sub.platform,
        severity: 'high',
        artifact: 'reviewNotes',
        message: `Demo hesap kullanılamaz görünüyor: ${suspicious.join(', ')}.`,
        suggestedFix: 'Gerçekten giriş yapılabilen bir test hesabı gir ve gönderim öncesi kendin dene.',
      })
    }
  }

  if (sub.meta.requiresLogin && !demo) {
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
