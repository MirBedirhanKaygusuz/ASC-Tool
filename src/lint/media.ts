import type { Submission, LintFinding } from '../types.js'

const MIN_SCREENSHOTS = 3

export async function checkMedia(sub: Submission): Promise<LintFinding[]> {
  const out: LintFinding[] = []

  if (!sub.media.icon) {
    out.push({
      checkId: 'lint-icon-missing',
      platform: sub.platform,
      severity: 'high',
      artifact: 'icon',
      message: 'Uygulama ikonu tanımlı değil.',
      suggestedFix: 'Listing’e 1024x1024 ikon ekle.',
    })
  }

  const shots = sub.media.screenshots ?? []
  if (shots.length < MIN_SCREENSHOTS) {
    out.push({
      checkId: 'lint-screenshots-too-few',
      platform: sub.platform,
      severity: 'medium',
      artifact: 'screenshots',
      message: `Sadece ${shots.length} ekran görüntüsü var (önerilen en az ${MIN_SCREENSHOTS}).`,
      suggestedFix: 'Uygulamanın ana akışlarını gösteren ekran görüntüleri ekle.',
    })
  }

  // Apple cihaz sınıfı başına en az bir set ister.
  if (sub.platform === 'apple') {
    const classes = new Set(shots.map((s) => s.deviceClass).filter(Boolean))
    if (classes.size > 0 && !classes.has('iphone_6_9')) {
      out.push({
        checkId: 'lint-screenshots-missing-device-class',
        platform: 'apple',
        severity: 'medium',
        artifact: 'screenshots',
        message: "6.9\" iPhone ekran görüntüsü seti eksik.",
        suggestedFix: 'En güncel iPhone boyutu için ekran görüntüsü yükle.',
      })
    }
  }

  return out
}
