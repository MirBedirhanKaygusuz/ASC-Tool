import type { Submission, Finding } from '../types.js'

/**
 * Uydurma alıntı temizliği.
 *
 * Model "açıklamada şu cümle var" dediğinde, o cümle gerçekten orada mı?
 * Değilse bulguyu at. Sıfır maliyetle halüsinasyon eler — boru hattındaki
 * en yüksek getirili tek kontrol.
 */
export function groundFindings(sub: Submission, findings: Finding[]): {
  kept: Finding[]
  dropped: Finding[]
} {
  const kept: Finding[] = []
  const dropped: Finding[] = []

  for (const f of findings) {
    if (isGrounded(sub, f)) {
      kept.push({ ...f, trace: { ...f.trace, grounded: true } })
    } else {
      dropped.push({ ...f, trace: { ...f.trace, grounded: false } })
    }
  }

  return { kept, dropped }
}

function isGrounded(sub: Submission, f: Finding): boolean {
  switch (f.locator.type) {
    case 'text': {
      const field = sub.text[f.locator.field]
      if (!field) return false
      return norm(field).includes(norm(f.excerpt))
    }
    case 'image': {
      // Görselde birebir alıntı doğrulayamayız; media id geçerli mi ona bakarız.
      const id = f.locator.mediaId
      return sub.media.screenshots.some((s) => s.id === id) || sub.media.icon?.id === id
    }
    case 'iap': {
      const id = f.locator.iapId
      return sub.iap.some((i) => i.id === id)
    }
    case 'field':
      return true
  }
}

/** Boşluk/tırnak farklarını tolere et — model bazen normalize eder. */
function norm(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
