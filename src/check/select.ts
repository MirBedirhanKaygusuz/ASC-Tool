import type { Submission, RuleCard } from '../types.js'

/**
 * Hangi kartlar bu submission için geçerli?
 *
 * Embedding/RAG YOK — corpus küçük (30-100 kart), düz filtreleme yeterli ve
 * deterministik. Corpus 500+ karta çıkarsa burası değişir, o zamana kadar değil.
 */
/**
 * Kartları ikiye ayırır:
 *   llm    — modele sorulacaklar
 *   manual — listing'den görülemeyen, rapora kontrol maddesi olarak düşecekler
 */
export function selectRules(
  sub: Submission,
  cards: RuleCard[],
): { llm: RuleCard[]; manual: RuleCard[] } {
  const applicable = cards.filter((c) => c.platform === 'both' || c.platform === sub.platform)
  return {
    llm: applicable.filter((c) => c.outcome !== 'manual').filter((c) => passesFilters(sub, c)),
    manual: applicable.filter((c) => c.outcome === 'manual').filter((c) => passesConditions(sub, c)),
  }
}

function passesConditions(sub: Submission, card: RuleCard): boolean {
  const w = card.appliesWhen
  if (!w) return true
  if (w.categories && !w.categories.includes(sub.category)) return false
  if (w.requiresLogin !== undefined && sub.meta.requiresLogin !== w.requiresLogin) return false
  if (w.generatesAiContent !== undefined && sub.meta.generatesAiContent !== w.generatesAiContent) return false
  if (w.hasUserGeneratedContent !== undefined && sub.meta.hasUserGeneratedContent !== w.hasUserGeneratedContent) return false
  if (w.hasSubscription !== undefined) {
    if (sub.iap.some((i) => i.kind === 'subscription') !== w.hasSubscription) return false
  }
  return true
}

function passesFilters(sub: Submission, cards_: RuleCard): boolean {
  return [cards_].filter((card) => {

    // Kartın ihtiyaç duyduğu artifact'ler gerçekten var mı?
    if (!hasAnyNeeded(sub, card)) return false

    // Uygulama koşulları
    if (!passesConditions(sub, card)) return false

    // Ucuz ön kapı — sadece salt-metin kartlarda güvenli.
    //    Görsel içeren kartlarda metin eşleşmemesi ihlal olmadığı anlamına gelmez.
    if (card.prefilter && card.scope === 'single' && !touchesMedia(card)) {
      const haystack = textOf(sub).toLowerCase()
      const hit = card.prefilter.some((p) => haystack.includes(p.toLowerCase()))
      if (!hit) return false
    }

    return true
  }).length > 0
}

function touchesMedia(card: RuleCard): boolean {
  return card.needs.some((n) => n === 'screenshots' || n === 'icon' || n === 'previewVideo')
}

function hasAnyNeeded(sub: Submission, card: RuleCard): boolean {
  return card.needs.some((need) => {
    switch (need) {
      case 'screenshots': return sub.media.screenshots.length > 0
      case 'icon': return !!sub.media.icon
      case 'previewVideo': return !!sub.media.previewVideo
      case 'iap': return sub.iap.length > 0
      case 'urls': return Object.values(sub.urls).some(Boolean)
      case 'reviewNotes': return !!sub.reviewNotes.notes || !!sub.reviewNotes.demoAccount
      case 'category': return !!sub.category
      case 'ageRating': return !!sub.ageRating
      default: {
        const v = sub.text[need as keyof typeof sub.text]
        return typeof v === 'string' && v.length > 0
      }
    }
  })
}

export function textOf(sub: Submission): string {
  return Object.values(sub.text).filter(Boolean).join('\n')
}
