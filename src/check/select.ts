import type { Submission, RuleCard, ElemeSebebi, ElenenKart } from '../types.js'

export type { ElemeSebebi, ElenenKart }
import { META_KEYS, metaField } from '../meta-fields.js'

/**
 * Hangi kartlar bu submission için geçerli?
 *
 * Embedding/RAG YOK — corpus küçük, düz filtreleme yeterli ve deterministik.
 *
 * TEK GEÇİŞ, TEK KOVA. Her aday kart ya çalışır ya da TEK bir eleme sebebiyle
 * düşer; hiçbir kart iki kovaya birden ya da hiçbir kovaya düşmez (test bunu
 * sınıyor). Bu yapı, eski hâlin sessiz boşluğunu kapatıyor: "beyanla elendi"
 * (kullanıcı "hayır" dedi) ve "veri yok" (kartın istediği içerik submission'da
 * yok) diye düşen kartlar HİÇBİR yerde görünmüyordu. 25 kartta önemsizdi;
 * 175 kartta raporun en büyük yalanı hâline geldi — "28 kural denetlendi"
 * satırı kapsam gibi okunuyor, oysa 147 kart çalışmamış oluyordu.
 */
export interface Secim {
  /** Modele gidecekler. */
  llm: RuleCard[]
  /** Rapora kontrol maddesi olarak düşecekler. */
  manual: RuleCard[]
  /** Çalışmayan her kart, sebebiyle. */
  elenen: ElenenKart[]
  /** Geriye dönük kolaylık: `elenen`in iki alt kümesi. */
  unknownMeta: RuleCard[]
  prefiltered: RuleCard[]
}

export function selectRules(sub: Submission, cards: RuleCard[]): Secim {
  const applicable = cards.filter((c) => c.platform === 'both' || c.platform === sub.platform)

  const llm: RuleCard[] = []
  const manual: RuleCard[] = []
  const elenen: ElenenKart[] = []
  const kartById = new Map<string, RuleCard>()

  for (const card of applicable) {
    const eleme = elemeSebebi(sub, card)
    if (!eleme) {
      ;(card.outcome === 'manual' ? manual : llm).push(card)
      continue
    }
    kartById.set(card.id, card)
    elenen.push({ id: card.id, section: card.source.section, outcome: card.outcome, ...eleme })
  }

  const kova = (...sebepler: ElemeSebebi[]) =>
    elenen.filter((e) => sebepler.includes(e.sebep)).map((e) => kartById.get(e.id)!)

  return {
    llm,
    manual,
    elenen,
    // "Bilmiyoruz" ailesi: kullanıcının doldurmadığı alan + çekilmemiş beyan.
    // Eylemleri farklı (rapor ikisini ayrı yazıyor) ama ikisi de eksik veri.
    unknownMeta: kova('meta-bilinmiyor', 'beyan-cekilmedi'),
    prefiltered: kova('konu-gecmiyor'),
  }
}

/**
 * Kart neden çalışmıyor? Sıra ÖNEMLİ.
 *
 * "Bilinmiyor" her şeyin önünde: koşulu bilmediğimiz bir kartı "koşul
 * sağlanmadı" diye raporlarsak, eksik veriyi doğru eleme gibi göstermiş
 * oluruz (belkiPatlarız R3).
 */
function elemeSebebi(sub: Submission, card: RuleCard): { sebep: ElemeSebebi; detay: string } | null {
  // Kullanıcının doldurabileceği alan önce: elindeki iş bu.
  const bilinmeyen = bilinmeyenAlanlar(sub, card)
  if (bilinmeyen.length) return { sebep: 'meta-bilinmiyor', detay: bilinmeyen.join(', ') }

  // Apple'ın kendi kaydı çekilmemişse doldurulacak bir alan YOK; ayrı sebep.
  const cekilmeyen = cekilmeyenBeyanlar(sub, card)
  if (cekilmeyen.length) return { sebep: 'beyan-cekilmedi', detay: cekilmeyen.join(', ') }

  const kosul = saglanmayanKosul(sub, card)
  if (kosul) return { sebep: 'beyanla-elendi', detay: kosul }

  // Elle kontrol kartlarının `needs`i boştur: onlar listing içeriğine değil
  // uygulamanın kendisine bakıyor. Artifact şartını yalnız modele gidenlere
  // uyguluyoruz, yoksa kontrol listesinin tamamı sessizce düşerdi.
  if (card.outcome !== 'manual' && !hasAnyNeeded(sub, card)) {
    return { sebep: 'veri-yok', detay: `kartın baktığı alan(lar) boş: ${card.needs.join(', ')}` }
  }

  if (!passesPrefilter(sub, card)) {
    const p = card.prefilter ?? []
    const ilk = p.slice(0, 5).join(', ')
    return {
      sebep: 'konu-gecmiyor',
      detay: `metinde aranan: ${ilk}${p.length > 5 ? ` (+${p.length - 5})` : ''}`,
    }
  }
  return null
}

/**
 * Meta koşulları — hepsi `meta-fields.ts`ten geliyor.
 *
 * Eskiden burada elle yazılmış dört isim vardı ve alan eklemek bu listeyi
 * güncellemeyi unutmak demekti: kart koşulu yazılıyor, koşul hiç bakılmıyor,
 * kart herkese açık kalıyordu.
 */
const META_CONDITIONS = META_KEYS

/**
 * Submission'ın kendisinden TÜRETİLEN koşullar. Kimse girmiyor, veriden
 * çıkıyor — dolayısıyla "bilinmiyor" hâli yok.
 */
const DERIVED_CONDITIONS = {
  hasSubscription: (s: Submission) => s.iap.some((i) => i.kind === 'subscription'),
  hasIap: (s: Submission) => s.iap.length > 0,
  hasPreviewVideo: (s: Submission) => !!s.media.previewVideo,
} as const

/**
 * Beyandan gelen koşullar. Kullanıcı girmiyor, Apple söylüyor — ama veri
 * ÇEKİLMEMİŞ olabilir. O zaman koşul "sağlanmadı" değil "bilinmiyor"dur.
 *
 * Ayrım kritik: çekilmemiş bir gizlilik etiketi yüzünden ATT kartı sessizce
 * elenirse rapor "temiz" görünür. Oysa bakılmamıştır (R3).
 */
const DECLARATION_CONDITIONS = {
  declaresTracking: (s: Submission) => s.declarations?.privacy?.takip,
  usesThirdPartyContent: (s: Submission) =>
    s.declarations?.icerikHaklari === undefined
      ? undefined
      : s.declarations.icerikHaklari === 'USES_THIRD_PARTY_CONTENT',
  hasCustomProductPages: (s: Submission) =>
    s.declarations?.ozelSayfalar === undefined ? undefined : s.declarations.ozelSayfalar.length > 0,
  hasUnsubmittedProducts: (s: Submission) =>
    s.declarations?.urunDurumlari === undefined
      ? undefined
      : s.declarations.urunDurumlari.some((u) => gonderilmemis(u)),
} as const

/** İncelemeye gönderilmemiş ürün: 2.1(b)'nin tanımı. */
export function gonderilmemis(u: {
  durum: string
  sonrakiSurumleGonder?: boolean
  incelemede?: boolean
}): boolean {
  const bitmis = /^(APPROVED|DEVELOPER_REMOVED_FROM_SALE|REMOVED_FROM_SALE|DEVELOPER_ACTION_NEEDED_REMOVED)$/
  if (bitmis.test(u.durum)) return false
  if (u.sonrakiSurumleGonder === true) return false
  if (u.incelemede === true) return false
  return true
}

/**
 * Koşul adının insan hâli. Rapor "hasUserGeneratedContent" yazarsa kimse
 * itiraz edemez; "kullanıcı içeriği" yazarsa yanlış işaretlenmiş bir kutu
 * gözden kaçmaz.
 */
export function kosulEtiketi(key: string): string {
  // Etiketi KÜÇÜLTMÜYORUZ: Türkçe küçültme "IAP"i "ıap" yapıyor ve kısaltmalar
  // tanınmaz hâle geliyordu.
  const alan = metaField(key)
  if (alan) return alan.label
  return TURETILEN_ETIKET[key] ?? BEYAN_ETIKET[key] ?? key
}

const TURETILEN_ETIKET: Record<string, string> = {
  hasSubscription: 'abonelik ürünü',
  hasIap: 'uygulama içi satın alma',
  hasPreviewVideo: 'önizleme videosu',
}

const BEYAN_ETIKET: Record<string, string> = {
  declaresTracking: 'gizlilik etiketinde takip beyanı',
  usesThirdPartyContent: 'üçüncü taraf içerik beyanı',
  hasCustomProductPages: 'özel ürün sayfası',
  hasUnsubmittedProducts: 'incelemeye gönderilmemiş ürün',
}

/** Kart bir koşul istiyor ama KULLANICI o soruyu yanıtlamamış mı? */
function bilinmeyenAlanlar(sub: Submission, card: RuleCard): string[] {
  const w = card.appliesWhen
  if (!w) return []
  return META_CONDITIONS.filter((k) => w[k] !== undefined && sub.meta[k] === undefined).map(kosulEtiketi)
}

/** Kart Apple'ın bir beyanına bakıyor ama o beyan çekilmemiş mi? */
function cekilmeyenBeyanlar(sub: Submission, card: RuleCard): string[] {
  const w = card.appliesWhen
  if (!w) return []
  return (Object.keys(BEYAN_ETIKET) as Array<keyof typeof DECLARATION_CONDITIONS>)
    .filter((k) => w[k] !== undefined && DECLARATION_CONDITIONS[k](sub) === undefined)
    .map(kosulEtiketi)
}

/** Sağlanmayan İLK koşulun insan okunur gerekçesi; hepsi sağlanıyorsa null. */
function saglanmayanKosul(sub: Submission, card: RuleCard): string | null {
  const w = card.appliesWhen
  if (!w) return null
  const bekleniyor = (v: boolean) => (v ? 'evet' : 'hayır')

  if (w.categories && !w.categories.includes(sub.category)) {
    return `kategori "${sub.category}" kartın kapsamında değil (${w.categories.join(', ')})`
  }
  for (const k of META_CONDITIONS) {
    if (w[k] !== undefined && sub.meta[k] !== w[k]) {
      return `${kosulEtiketi(k)} = ${bekleniyor(sub.meta[k] as boolean)}, kart "${bekleniyor(w[k]!)}" istiyor`
    }
  }
  for (const k of Object.keys(DERIVED_CONDITIONS) as Array<keyof typeof DERIVED_CONDITIONS>) {
    if (w[k] !== undefined && DERIVED_CONDITIONS[k](sub) !== w[k]) {
      return `${kosulEtiketi(k)} = ${bekleniyor(DERIVED_CONDITIONS[k](sub))}, kart "${bekleniyor(w[k]!)}" istiyor`
    }
  }
  for (const k of Object.keys(DECLARATION_CONDITIONS) as Array<keyof typeof DECLARATION_CONDITIONS>) {
    if (w[k] === undefined) continue
    const deger = DECLARATION_CONDITIONS[k](sub)
    // "bilinmiyor" buraya gelmez: elemeSebebi önce onu ayırıyor.
    if (deger !== w[k]) {
      return `${kosulEtiketi(k)} = ${bekleniyor(deger as boolean)}, kart "${bekleniyor(w[k]!)}" istiyor`
    }
  }
  return null
}

/**
 * Konu listing metninde hiç geçmiyorsa kartı hiç açma.
 *
 * MODELE GİDEN kartlarda yalnız salt-metin kartlarda güvenli: görsel içeren
 * bir kartta metin eşleşmemesi ihlal olmadığı anlamına gelmez.
 *
 * ELLE KONTROL kartlarında bu sınır geçerli değil — orada model yok, soru
 * "listing bu konudan söz ediyor mu". Kural kitabı yönergenin tamamını
 * kapsayınca kontrol listesi 60 maddeye çıkıyor ve herkese gösterilen bir
 * madde hiçbir bilgi taşımıyor. VPN kartı yalnız VPN'den söz eden listing'de
 * çıksın. Bu bir eleme olduğu için sessiz değil: `selectRules` düşenleri
 * `prefiltered` olarak geri döndürüyor, rapor sayısını yazıyor.
 */
function passesPrefilter(sub: Submission, card: RuleCard): boolean {
  if (!card.prefilter?.length) return true
  if (card.outcome !== 'manual' && (card.scope !== 'single' || touchesMedia(card))) return true
  const haystack = textOf(sub).toLowerCase()
  return card.prefilter.some((p) => haystack.includes(p.toLowerCase()))
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
