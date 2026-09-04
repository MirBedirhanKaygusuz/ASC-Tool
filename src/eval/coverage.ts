/**
 * Red kapsama analizi — "geçmişte yediğim redlerin kaçını bu araç bilirdi?"
 *
 * NEDEN ÖNEMLİ. Bu projenin tek gerçek sorusu şu: işe yarıyor mu? Kart sayısı
 * cevap değil, 24 kart yanlış 24 kart olabilir. Cevabın ölçülebilir yarısı
 * elimizde: eklenti Apple'ın red yazışmalarını topluyor ve her red hangi
 * maddeden geldiğini söylüyor. Kural kitabı da madde numarasına çapalı.
 * İkisini eşleştirmek elle etiketleme GEREKTİRMİYOR.
 *
 * ═══ EN ÖNEMLİ UYARI ═══
 * Bu bir YAKALAMA ORANI DEĞİL, bir TAVAN.
 *
 *   kart yok  →  o red KESİNLİKLE yakalanmazdı.
 *   kart var  →  yakalanmış OLABİLİR. Kartın sorusu o redde geçen somut
 *                soruna denk gelmiyor olabilir; üstelik pek çok red
 *                listing'den hiç görülemeyen bir şeyden gelir (çöken build,
 *                çalışmayan demo hesap, uygulama içi akış).
 *
 * "%70 kapsam" cümlesini "%70'ini yakalarız" diye okumak, bu projenin
 * engellemeye çalıştığı tam o hata (belkiPatlarız R2/R3). Rapor bunu her
 * yerde açıkça yazıyor; sen de yazmadan bu sayıyı kimseye gösterme.
 */
import type { RuleCard } from '../types.js'

export interface RejectRecord {
  id: string
  appId?: string
  appName?: string
  /** Apple'ın atıf yaptığı madde: "2.3.3", "5.2.1", "1.2" … Boş olabilir. */
  guideline?: string | null
  rejectedAt?: string | null
  text?: string
}

export interface MaddeSatiri {
  madde: string
  redSayisi: number
  uygulamalar: string[]
  kartlar: string[]
  /** Bu maddeden gelen redlerden bir örnek — kart yazacak kişi okusun diye. */
  ornek?: string
}

export interface CoverageReport {
  toplamRed: number
  /** Madde kodu taşıyan redler; yalnız bunlar hakkında konuşabiliriz. */
  kodlu: number
  /** Kod taşımayanlar. "Kapsanmıyor" DEĞİL — "bilinmiyor". */
  kodsuz: number
  kartiOlan: number
  kartiOlmayan: number
  /** Kartı olmayan maddeler, en çok red yediğinden başlayarak. Yol haritası. */
  bosluklar: MaddeSatiri[]
  /** Kartı olan maddeler — kapsam TAVANI, yakalama garantisi değil. */
  kapsananlar: MaddeSatiri[]
  uyarilar: string[]
}

/**
 * Madde kodunu sadeleştir.
 *
 * Apple aynı kuralı farklı derinlikte yazıyor: "2.3", "2.3.3", "2.3.3(a)".
 * Kart "2.3.3" derken red "2.3.3(b)" diyorsa bu aynı kuraldır. Fıkra harfini
 * atıyoruz ama derinliği KORUYORUZ: 2.3.1 ile 2.3.7 farklı kurallar ve
 * ikisini birleştirmek kapsamı olduğundan geniş gösterirdi.
 */
export function normalizeSection(kod: string): string {
  return String(kod)
    .trim()
    .replace(/^guideline\s+/i, '')
    .replace(/\s*\(.*$/, '')
    .replace(/[^\d.]/g, '')
    .replace(/\.+$/, '')
}

/**
 * Bir kart bu maddeyi kapsıyor mu?
 *
 * Kart daha GENEL olabilir ve bu kabul edilir: "1.2" kartı "1.2.1" redini
 * kapsar. Tersi kabul edilmez — "2.3.3" kartı "2.3" redini kapsamaz, çünkü
 * 2.3 altında 2.3.1'den 2.3.12'ye kadar bambaşka kurallar var ve birini
 * yazmış olmak ötekini bilmek anlamına gelmiyor.
 */
export function kartKapsiyorMu(kartMadde: string, redMadde: string): boolean {
  const k = normalizeSection(kartMadde)
  const r = normalizeSection(redMadde)
  if (!k || !r) return false
  return r === k || r.startsWith(k + '.')
}

export function coverage(rejects: RejectRecord[], cards: RuleCard[]): CoverageReport {
  const uyarilar: string[] = []

  // Aynı red iki kez sayılmasın: id benzersiz ama yedekten iki kez yüklenmiş
  // olabilir. Sayı şişerse kapsam oranı da yanlış çıkar.
  const tekil = new Map<string, RejectRecord>()
  for (const r of rejects) tekil.set(r.id, r)
  if (tekil.size !== rejects.length) {
    uyarilar.push(`${rejects.length - tekil.size} mükerrer red kaydı elendi.`)
  }

  const gruplar = new Map<string, { redler: RejectRecord[]; uygulamalar: Set<string> }>()
  let kodsuz = 0

  for (const r of tekil.values()) {
    const madde = normalizeSection(r.guideline ?? '')
    if (!madde) {
      kodsuz++
      continue
    }
    const g = gruplar.get(madde) ?? { redler: [], uygulamalar: new Set<string>() }
    g.redler.push(r)
    if (r.appName) g.uygulamalar.add(r.appName)
    gruplar.set(madde, g)
  }

  const satirlar: MaddeSatiri[] = [...gruplar.entries()].map(([madde, g]) => ({
    madde,
    redSayisi: g.redler.length,
    uygulamalar: [...g.uygulamalar].sort(),
    kartlar: cards.filter((c) => kartKapsiyorMu(c.source.section, madde)).map((c) => c.id).sort(),
    // Apple'ın gerekçesinin ilk satırları: kart yazacak kişinin ihtiyacı olan
    // tek şey bu. Tam metin depoda duruyor.
    ornek: ozet(g.redler[0]?.text),
  }))

  const sirala = (a: MaddeSatiri, b: MaddeSatiri) =>
    b.redSayisi - a.redSayisi || a.madde.localeCompare(b.madde)

  const bosluklar = satirlar.filter((s) => s.kartlar.length === 0).sort(sirala)
  const kapsananlar = satirlar.filter((s) => s.kartlar.length > 0).sort(sirala)

  if (kodsuz) {
    uyarilar.push(
      `${kodsuz} red madde kodu taşımıyor — kapsanıyor mu BİLİNMİYOR. ` +
        'Oranlar yalnız kodlu redler üzerinden hesaplandı.',
    )
  }
  if (!tekil.size) {
    uyarilar.push('Hiç red kaydı yok. Önce çekim yap; red yoksa bu rapor bir şey söylemez.')
  }

  return {
    toplamRed: tekil.size,
    kodlu: tekil.size - kodsuz,
    kodsuz,
    kartiOlan: kapsananlar.reduce((n, s) => n + s.redSayisi, 0),
    kartiOlmayan: bosluklar.reduce((n, s) => n + s.redSayisi, 0),
    bosluklar,
    kapsananlar,
    uyarilar,
  }
}

/** Red metninden Apple'ın gerekçesinin ilk cümlelerini çıkar. */
function ozet(text?: string): string | undefined {
  if (!text) return undefined
  const i = text.indexOf("=== Apple'ın red gerekçesi ===")
  const govde = i >= 0 ? text.slice(i + 30) : text
  return govde.replace(/\s+/g, ' ').trim().slice(0, 220) || undefined
}

/** Kapsam oranı — payda KODLU redler. Kodsuzları paydaya koymak yalan olurdu. */
export function kapsamOrani(r: CoverageReport): number | null {
  return r.kodlu ? Math.round((r.kartiOlan / r.kodlu) * 100) : null
}
