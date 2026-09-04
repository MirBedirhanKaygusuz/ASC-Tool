/**
 * Yönerge kapsama analizi — "Apple'ın yazdığı hangi maddede kartımız yok?"
 *
 * `coverage.ts` ile karıştırma: orası GEÇMİŞ REDLERİ kural kitabıyla
 * eşleştiriyor ("yediğim redlerin kaçını bilirdik"). Burası kural kitabını
 * YÖNERGENİN KENDİSİYLE eşleştiriyor ("Apple'ın kuralının kaçını yazdık").
 * İkisi ayrı sorular: red gelmemiş bir maddede kart olmaması da bir boşluktur.
 *
 * Sayı bir KAPSAMA TAVANI'dır, kalite ölçüsü değil: madde başına kart olması,
 * o kartın maddedeki her şeyi sorduğu anlamına gelmez.
 */
import type { RuleCard } from '../types.js'
import type { GuidelineDoc, GuidelineSection } from '../corpus/guidelines.js'
import { normalizeSection, kartKapsiyorMu } from './coverage.js'

export interface MaddeKapsama {
  id: string
  title: string
  kartlar: string[]
  /** Kendi kartı yok ama tüm alt maddeleri kapsanıyor. */
  altMaddelerdenKapsandi: boolean
}

export interface GuidelineCoverageReport {
  /** Kural taşıyan madde sayısı (bölüm başlıkları ve "intentionally omitted" hariç). */
  kuralliMadde: number
  kapsanan: MaddeKapsama[]
  bosluklar: MaddeKapsama[]
  /** Yönergede karşılığı bulunamayan kart atıfları — yazım hatası göstergesi. */
  gecersizAtiflar: Array<{ kart: string; madde: string }>
  toplamKart: number
}

const OMITTED = /intentionally omitted/i
/** Bölüm başlıkları ve süreç anlatan düzyazı: kural taşımıyorlar. */
const KURAL_DISI = new Set(['1', '2', '3', '4', '5', 'introduction', 'after-you-submit'])

/** Madde gerçekten bir kural taşıyor mu? */
export function kuralTasiyor(s: GuidelineSection): boolean {
  if (KURAL_DISI.has(s.id)) return false
  const text = (s.text ?? '').trim()
  return text.length >= 30 && !OMITTED.test(text)
}

function eslesiyor(kartMadde: string, maddeId: string): boolean {
  // Sayısal olmayan madde ("before-you-submit"): birebir eşleşme.
  if (!/^\d/.test(maddeId)) return kartMadde.trim().toLowerCase() === maddeId
  return normalizeSection(kartMadde) !== '' && kartKapsiyorMu(kartMadde, maddeId)
}

export function guidelineCoverage(
  doc: Pick<GuidelineDoc, 'sections'>,
  cards: RuleCard[],
): GuidelineCoverageReport {
  const maddeler = doc.sections.filter(kuralTasiyor)

  const satirlar: MaddeKapsama[] = maddeler.map((s) => ({
    id: s.id,
    title: s.title,
    kartlar: cards.filter((c) => eslesiyor(c.source.section, s.id)).map((c) => c.id).sort(),
    altMaddelerdenKapsandi: false,
  }))
  const byId = new Map(satirlar.map((r) => [r.id, r]))

  // Üst madde çoğu zaman yalnızca alt maddelere giriş cümlesidir ("1.4 Physical
  // Harm — For example:"). Alt maddelerinin HEPSİ kapsanıyorsa üst maddeyi
  // boşluk saymak yanlış alarm olurdu; ama bunu ayrı işaretliyoruz ki
  // "gerçekten kart var" ile karışmasın.
  for (const r of satirlar) {
    if (r.kartlar.length) continue
    const cocuklar = satirlar.filter(
      (o) => o.id !== r.id && (o.id.startsWith(r.id + '.') || o.id.startsWith(r.id + '(')),
    )
    if (cocuklar.length && cocuklar.every((c) => c.kartlar.length || c.altMaddelerdenKapsandi)) {
      r.altMaddelerdenKapsandi = true
    }
  }

  // Kartın atıf yaptığı madde yönergede yoksa: ya yazım hatası ya da Apple
  // maddeyi kaldırmış. İkisi de sessiz kalmamalı — kart o maddeye dayanıyor.
  const gecersizAtiflar: Array<{ kart: string; madde: string }> = []
  for (const c of cards) {
    if (c.platform === 'google') continue
    const sec = c.source.section
    if (satirlar.some((r) => eslesiyor(sec, r.id))) continue
    if (doc.sections.some((s) => eslesiyor(sec, s.id))) continue
    gecersizAtiflar.push({ kart: c.id, madde: sec })
  }

  return {
    kuralliMadde: satirlar.length,
    kapsanan: satirlar.filter((r) => r.kartlar.length || r.altMaddelerdenKapsandi),
    bosluklar: satirlar.filter((r) => !r.kartlar.length && !r.altMaddelerdenKapsandi),
    gecersizAtiflar,
    toplamKart: cards.length,
  }
}
