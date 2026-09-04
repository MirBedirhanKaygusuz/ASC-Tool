/**
 * Kart canlılık sınaması — "bu kart HİÇ ateşleyebiliyor mu?"
 *
 * NEDEN VAR. Yalancı alarm ölçümü yalnızca ÇALIŞAN kartları görüyor: beş
 * AI uygulamasında 173 kartın ancak ~25'i seçiliyor. Kalan ~150 kart —
 * kumar, VPN, kredi, çocuk, emülatör — hiç tetiklenmedi. Bozuk olsalar
 * (soru cevaplanamaz, prefilter kartı kendi konusunda bile açmıyor, needs
 * yanlış alanı istiyor) hiçbir yerde görünmezdi. Portföyün tamamı aynı türse
 * bu boşluk başka uygulama eklenerek kapanmıyor.
 *
 * YÖNTEM. Her kartın `positiveExample` alanı zaten "bu bir ihlaldir" diye
 * yazılmış bir metin. Kartı KENDİ örneğinden kurulmuş sentetik bir listing'e
 * karşı çalıştırıyoruz.
 *
 * ═══ BU NEYİ ÖLÇER, NEYİ ÖLÇMEZ ═══
 * Ölçtüğü: kartın ateşleyebilir olması. Örneği elimizle "apaçık ihlal" diye
 * yazdık; geçmesi "recall iyi" demek DEĞİL, yalnızca "ölü değil" demek.
 * Ölçmediği: gerçek listing'lerde yakalayıp yakalamayacağı — orası gerçek
 * red kayıtlarıyla ölçülür (npm run kapsam).
 *
 * Başarısızlık ise tek anlamlıdır: kart, ihlal olarak yazdığımız cümlede bile
 * bulgu üretemiyorsa gerçek bir listing'de hiç üretmez.
 */
import type { RuleCard, Submission } from '../types.js'
import { selectRules } from '../check/select.js'

export type CanlilikDurum =
  /** Kendi örneğinden kurulan listing'de kart seçiliyor — modele sorulabilir. */
  | 'secilebilir'
  /** Kart seçilmiyor: needs / appliesWhen / prefilter kendi örneğini eliyor. */
  | 'secilemedi'
  /** Görsel gerektiriyor: sentetik metinle sınanamaz. */
  | 'sinanamaz'

export interface CanlilikSatiri {
  ruleId: string
  section: string
  durum: CanlilikDurum
  /** Seçilemediyse neden — select.ts'in verdiği eleme sebebi. */
  sebep?: string
  ornek?: string
}

const TEXT_NEEDS = new Set([
  'name', 'subtitle', 'shortDescription', 'description', 'keywords',
  'promotionalText', 'whatsNew',
])

/**
 * Kartın kendi örneğinden bir listing kur.
 *
 * Koşulları KASITLI olarak sağlıyoruz: amaç "bu uygulama bu kartı tetikler
 * mi" değil, "kart tetiklenebilir mi". Meta koşulları kartın istediği değere
 * kuruluyor, gereken artifact'ler dolduruluyor.
 */
export function sentetikSubmission(card: RuleCard): Submission {
  const ornek = card.positiveExample ?? ''
  const w = card.appliesWhen ?? {}

  const text: Submission['text'] = {}
  for (const need of card.needs) {
    if (TEXT_NEEDS.has(need)) text[need as keyof Submission['text']] = ornek
  }
  // Hiç metin alanı istemiyorsa da açıklamayı dolduruyoruz: prefilter metne
  // bakıyor ve boş listing'de her kart "konu geçmiyor" diye elenirdi.
  if (!Object.keys(text).length) text.description = ornek

  const meta: Submission['meta'] = {}
  for (const [k, v] of Object.entries(w)) {
    if (typeof v === 'boolean' && k !== 'hasSubscription' && k !== 'hasIap' && k !== 'hasPreviewVideo') {
      ;(meta as Record<string, boolean>)[k] = v
    }
  }

  const iapGerek = card.needs.includes('iap') || w.hasIap === true || w.hasSubscription === true
  return {
    platform: card.platform === 'google' ? 'google' : 'apple',
    appId: 'sentetik',
    appName: 'Sentetik Uygulama',
    locale: 'en-US',
    category: w.categories?.[0] ?? 'Photo & Video',
    ageRating: '4+',
    text,
    // Sahte görsel KOYMUYORUZ: boru hattı görsel gördüğü an yükleyici istiyor
    // ve uydurma bir dosya yolu ya patlar ya da modele boş kare gönderir.
    // Medyaya bakan kartlar zaten "sınanamaz" olarak ayrılıyor.
    media: {
      screenshots: [],
      previewVideo: w.hasPreviewVideo === true ? { id: 'video-1', path: '' } : undefined,
    },
    iap: iapGerek
      ? [{
          id: 'com.sentetik.pro',
          kind: w.hasSubscription === false ? 'consumable' : 'subscription',
          name: ornek.slice(0, 60) || 'Pro',
          description: ornek,
          price: 9.99,
          currency: 'USD',
          duration: 'P1M',
        }]
      : [],
    urls: card.needs.includes('urls')
      ? { privacy: 'https://example.com/privacy', support: 'https://example.com/support' }
      : {},
    reviewNotes: card.needs.includes('reviewNotes') ? { notes: ornek } : {},
    meta,
    declarations: {
      privacy: w.declaresTracking === undefined
        ? undefined
        : { satirlar: [], takip: w.declaresTracking, kimlikleBagli: false },
      icerikHaklari: w.usesThirdPartyContent === undefined
        ? undefined
        : w.usesThirdPartyContent ? 'USES_THIRD_PARTY_CONTENT' : 'DOES_NOT_USE',
      ozelSayfalar: w.hasCustomProductPages === undefined
        ? undefined
        : w.hasCustomProductPages ? [{ ad: 'x', gorunur: true, icerikCekildi: true }] : [],
      urunDurumlari: w.hasUnsubmittedProducts === undefined
        ? undefined
        : w.hasUnsubmittedProducts ? [{ id: 'p', durum: 'PREPARE_FOR_SUBMISSION' }] : [],
    },
    source: { kind: 'manual', fetchedAt: '' },
  }
}

/** Kart kendi örneğiyle kurulmuş listing'de seçilebiliyor mu? Model YOK. */
export function canlilikTaramasi(cards: RuleCard[]): CanlilikSatiri[] {
  const out: CanlilikSatiri[] = []
  for (const card of cards) {
    if (card.outcome === 'manual') continue
    const satir: CanlilikSatiri = {
      ruleId: card.id,
      section: card.source.section,
      durum: 'secilebilir',
      ornek: card.positiveExample,
    }
    // Görsele bakan kart sentetik METİNLE sınanamaz: elimizde uydurma bir
    // ekran görüntüsü yok ve olsa da kartın sorusu görselin İÇERİĞİNE bakıyor.
    // `requiresVision` yetmiyor — `needs` içinde medya olan kartlar da boru
    // hattına görsel gönderiyor. (İlk sürümde bu ayrım yoktu ve koşu
    // "görsel yükleyici verilmedi" diye patladı.)
    const medyaIster =
      card.requiresVision === true ||
      card.needs.some((n) => n === 'screenshots' || n === 'icon' || n === 'previewVideo')
    if (medyaIster) {
      satir.durum = 'sinanamaz'
      satir.sebep = card.requiresVision
        ? 'görsel gerektiriyor — sentetik metinle sınanamaz'
        : 'ekran görüntüsü/simge alanına bakıyor — sentetik metinle sınanamaz'
      out.push(satir)
      continue
    }
    const sub = sentetikSubmission(card)
    const secim = selectRules(sub, [card])
    if (!secim.llm.length) {
      const eleme = secim.elenen[0]
      satir.durum = 'secilemedi'
      satir.sebep = eleme ? `${eleme.sebep}: ${eleme.detay}` : 'bilinmeyen'
    }
    out.push(satir)
  }
  return out
}
