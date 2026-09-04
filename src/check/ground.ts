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
      const id = normId(f.locator.mediaId)
      if (!id) return false
      return sub.media.screenshots.some((s) => normId(s.id) === id) || normId(sub.media.icon?.id) === id
    }
    case 'iap': {
      const id = normId(f.locator.iapId)
      if (!id) return false
      return sub.iap.some((i) => normId(i.id) === id)
    }
    case 'field':
      return true
  }
}

/**
 * Kimlik karşılaştırması için uçlardaki noktalama ve boşluğu at.
 *
 * ÖLÇÜMDEN GELDİ (2026-09-02). 2.3.3 (ekran görüntüsü kartı) bulgularını
 * alıntı doğrulamada kaybediyordu ve sebep uydurma değildi: model medya
 * kimliğini cümle sonuna koyup NOKTA ekliyordu —
 *   modelin verdiği: "d10e4a76-…-f6873955ef74."
 *   gerçek id      : "d10e4a76-…-f6873955ef74"
 * Tam eşleşme aradığımız için gerçek bir bulgu "halüsinasyon" sayılıp
 * atılıyordu. Bu, savunmanın DOĞRU bulguyu kestiği ikinci vaka (ilki
 * anahtar kelime kartıydı).
 *
 * Gevşetme dar tutuldu: yalnız uçlardaki noktalama. Ortadaki tek harf farkı
 * hâlâ eşleşmiyor — uydurma kimlik yine eleniyor.
 */
function normId(id: string | undefined): string {
  return (id ?? '').trim().replace(/^[^\w-]+/, '').replace(/[^\w-]+$/, '')
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
