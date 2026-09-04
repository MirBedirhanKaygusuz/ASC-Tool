import type { ArtifactKind, RuleCard, Submission } from '../types.js'
import { selectRules } from '../check/select.js'
import { kartKapsiyorMu, normalizeSection } from './coverage.js'

/**
 * Yakalama ölçümü — "kart, GERÇEKTEN reddedilen metinde ateşliyor mu?"
 *
 * ═══ NEDEN VAR ═══
 * Elimizde iki ölçüm vardı ve ikisi de bu soruyu yanıtlamıyordu:
 *
 *   kapsam (coverage.ts)      → "bu maddede kartımız VAR MI". Bir TAVAN.
 *                               Kart varlığı yakalandığını göstermez (R22).
 *   canlılık (card-liveness)  → "kart KENDİ örneğinde ateşliyor mu". Örneği
 *                               biz "apaçık ihlal" diye yazdık; geçmesi
 *                               yalnızca "ölü değil" demek.
 *
 * Aradaki boşluk şu: kartımız var VE ölü değil, ama Apple'ın gerçekten
 * reddettiği o cümlede ateşler miydi? Bu dosya onu ölçüyor — girdi uydurma
 * değil, ders havuzundaki gerçek red vakalarının `excerpt` alanı: uygulamanın
 * kendi metninden, Apple'ın işaret ettiği parça.
 *
 * ═══ BU NEYİ ÖLÇMEZ ═══
 * Gerçek RECALL değil, ona bir adım daha yakın bir vekil.
 *
 *   Alıntı listing'in TAMAMI değil, kesilmiş bir parçası. Kart burada
 *   ateşleyip gerçek listing'de (bağlam, komşu alanlar, beyanlar farklıyken)
 *   ateşlemeyebilir; tersi de mümkün — kartın sorusu alıntıda görünmeyen
 *   başka bir alana bakıyor olabilir.
 *
 * Gerçek recall için redin ALINDIĞI ANDAKİ listing'in tamamı gerekiyor;
 * bugünkü listing çoktan düzeltilmiş oluyor. O gelene kadar buradaki
 * "ateşledi / ateşlemedi" elimizdeki en sert kanıt.
 *
 * BAŞARISIZLIK YİNE TEK ANLAMLI: kart, Apple'ın bizzat işaret ettiği metinde
 * bulgu üretemiyorsa o redi yakalamazdı. Bu sayı yukarı yuvarlanamaz.
 */

/**
 * Ölçüme giren red vakası.
 *
 * `lessons/types.ts`teki `RejectCase`ten BİLEREK ayrı: coverage.ts de aynı
 * deseni izliyor. Ölçüm modülü ders deposunun şemasına bağlanmamalı — havuz
 * değişirse burası değişmesin diye çağıran taraf çeviriyor.
 */
export interface EvalVaka {
  id: string
  lessonId: string
  appName: string
  rejectedAt: string | null
  guideline: string
  artifact: ArtifactKind | null
  /** Uygulamanın KENDİ metninden alıntı — ölçümün girdisi. */
  excerpt: string
  /** in-app vakalar listing'den ölçülemez; ölçüm dışı sayılır. */
  scope: 'listing' | 'in-app'
}

export type YakalamaDurum =
  /** Bu maddeyi kapsayan kart YOK — red kesinlikle yakalanmazdı. */
  | 'kart-yok'
  /** Kart var ve alıntıdan kurulan listing'de seçiliyor — modele sorulabilir. */
  | 'secildi'
  /** Kart var ama seçim onu eliyor: alıntı kartın konusuna girmiyor / veri yok. */
  | 'secilemedi'
  /** Ölçülemez: alıntı yok, in-app red, ya da alan metin değil (görsel vb.). */
  | 'sinanamaz'

export interface YakalamaSatiri {
  vakaId: string
  lessonId: string
  appName: string
  rejectedAt: string | null
  guideline: string
  artifact: ArtifactKind | null
  excerpt: string
  durum: YakalamaDurum
  /** Maddeyi kapsayan kartlar. `kart-yok` dışında en az bir tane var. */
  adaylar: string[]
  sebep?: string
  /** 2. aşama (model) koştuysa: kart gerçekten bulgu üretti mi. */
  atesledi?: boolean
  /** Ateşlediyse bulgunun gerekçesi — gözle doğrulanabilsin. */
  bulgu?: string
}

export interface YakalamaOzeti {
  /** Havuzdan gelen tüm vakalar. */
  toplam: number
  /** Ölçüme girenler (listing kapsamlı + alıntısı olan + metin alanı). */
  olculen: number
  kartYok: number
  secildi: number
  secilemedi: number
  sinanamaz: number
  /** Neden ölçülemediğinin dökümü — sessiz düşürme yok. */
  disarida: Array<{ sebep: string; adet: number }>
}

/** Alıntının konabileceği serbest metin alanları. */
const METIN_ALANI: Partial<Record<ArtifactKind, keyof Submission['text']>> = {
  name: 'name',
  subtitle: 'subtitle',
  shortDescription: 'shortDescription',
  description: 'description',
  keywords: 'keywords',
  promotionalText: 'promotionalText',
  whatsNew: 'whatsNew',
}

/**
 * Metne çevrilemeyen alanlar. Bunlar için alıntı bir yere KONAMAZ:
 * "ekran görüntüsünde şu görünüyor" cümlesini description'a koymak, kartı
 * hiç bakmadığı bir alanda sınamak olurdu — sonuç ne çıkarsa çıksın anlamsız.
 */
const OLCULEMEYEN: Partial<Record<ArtifactKind, string>> = {
  icon: 'simge — görsel içeriğe bakıyor, metinle sınanamaz',
  screenshots: 'ekran görüntüsü — görsel içeriğe bakıyor, metinle sınanamaz',
  previewVideo: 'önizleme videosu — metinle sınanamaz',
  category: 'kategori — serbest metin değil',
  ageRating: 'yaş sınırı — serbest metin değil',
  privacy: 'gizlilik beyanı — serbest metin değil',
  declarations: 'beyanlar — serbest metin değil',
  urls: 'adresler — serbest metin değil',
}

/**
 * Gerçek alıntıdan sentetik listing kur.
 *
 * `card-liveness.ts`teki `sentetikSubmission`in aynası: orada girdi kartın
 * KENDİ örneği, burada Apple'ın reddettiği GERÇEK metin. İkisi ayrı fonksiyon
 * çünkü yerleştirme kuralı farklı — orada kartın `needs`i, burada vakanın
 * `artifact` alanı belirliyor.
 */
export function yakalamaSubmission(vaka: EvalVaka, platform: Submission['platform'] = 'apple'): Submission {
  const text: Submission['text'] = {}
  const alan = vaka.artifact ? METIN_ALANI[vaka.artifact] : undefined

  if (alan) {
    text[alan] = vaka.excerpt
  } else if (!vaka.artifact) {
    // Alan bilinmiyor: alıntıyı TÜM metin alanlarına koyuyoruz.
    //
    // Tek alana koymak, yanlış tahmin ettiğimizde kartı hiç bakmadığı yerde
    // sınamak olurdu ve sonuç "ateşlemedi" çıkardı — ölçümü kendi
    // tahminimizin hatasıyla kirletir. Hepsine koymak soruyu doğru biçimde
    // soruyor: "bu metin listing'de HERHANGİ bir yerde geçseydi kart görür müydü".
    for (const k of Object.keys(METIN_ALANI) as ArtifactKind[]) {
      const f = METIN_ALANI[k]!
      text[f] = vaka.excerpt
    }
  }

  const iapMi = vaka.artifact === 'iap'
  return {
    platform,
    appId: 'yakalama-olcumu',
    appName: vaka.appName || 'Ölçüm',
    locale: 'en-US',
    category: 'Photo & Video',
    ageRating: '4+',
    text: Object.keys(text).length ? text : { description: vaka.excerpt },
    // Sahte görsel KOYMUYORUZ: boru hattı görsel gördüğü an yükleyici istiyor.
    // Görsele bakan vakalar zaten "sınanamaz" olarak ayrılıyor.
    media: { screenshots: [] },
    iap: iapMi
      ? [{
          id: 'com.olcum.pro',
          kind: 'subscription',
          name: vaka.excerpt.slice(0, 60) || 'Pro',
          description: vaka.excerpt,
          price: 9.99,
          currency: 'USD',
          duration: 'P1M',
        }]
      : [],
    urls: {},
    reviewNotes: vaka.artifact === 'reviewNotes' ? { notes: vaka.excerpt } : {},
    // Beyan UYDURMUYORUZ. Vaka bunları taşımıyor ve doldurmak, kartı gerçekte
    // olmayan bir koşulda çalıştırmak olurdu. Beyana bağlı kartlar bu yüzden
    // "seçilemedi" çıkabilir; sebebi satırda yazıyor ve rapor bunu ayrı sayıyor.
    meta: {},
    source: { kind: 'manual', fetchedAt: '' },
  }
}

/** Bu maddeyi kapsayan kartlar. Eşleşme tek yönlü — coverage.ts ile aynı kural. */
export function kapsayanKartlar(guideline: string, cards: RuleCard[]): RuleCard[] {
  const madde = normalizeSection(guideline)
  if (!madde) return []
  return cards.filter(
    (c) => c.outcome !== 'manual' && kartKapsiyorMu(normalizeSection(c.source.section), madde),
  )
}

/**
 * 1. aşama — MODEL YOK.
 *
 * "Kart, gerçekten reddedilen metinden kurulan listing'de seçiliyor mu?"
 * Seçilemiyorsa modele hiç gitmez, yani o redi yakalaması imkânsızdı; bunu
 * öğrenmek için para harcamaya gerek yok.
 */
export function yakalamaTaramasi(vakalar: EvalVaka[], cards: RuleCard[]): YakalamaSatiri[] {
  return vakalar.map((v) => {
    const satir: YakalamaSatiri = {
      vakaId: v.id,
      lessonId: v.lessonId,
      appName: v.appName,
      rejectedAt: v.rejectedAt,
      guideline: v.guideline,
      artifact: v.artifact,
      excerpt: v.excerpt,
      durum: 'sinanamaz',
      adaylar: [],
    }

    if (v.scope === 'in-app') {
      satir.sebep = 'uygulama içi red — listing denetimi yapısal olarak göremez'
      return satir
    }
    if (!v.excerpt.trim()) {
      // Alıntısız vaka ölçülemez ve bu bir VERİ eksikliği, kart hatası değil.
      // İkisini karıştırmak ölçümü olduğundan kötü gösterirdi.
      satir.sebep = 'alıntı yok — reddedilen metin kaydedilmemiş'
      return satir
    }
    const engel = v.artifact ? OLCULEMEYEN[v.artifact] : undefined
    if (engel) {
      satir.sebep = engel
      return satir
    }

    const adaylar = kapsayanKartlar(v.guideline, cards)
    satir.adaylar = adaylar.map((c) => c.id)
    if (!adaylar.length) {
      satir.durum = 'kart-yok'
      satir.sebep = `${v.guideline} maddesini kapsayan kart yok — bu red kesinlikle yakalanmazdı`
      return satir
    }

    // Görsele bakan adayı ölçüme sokmuyoruz: sentetik listing'de görsel yok.
    const metinAdaylari = adaylar.filter(
      (c) => c.requiresVision !== true &&
        !c.needs.some((n) => n === 'screenshots' || n === 'icon' || n === 'previewVideo'),
    )
    if (!metinAdaylari.length) {
      satir.sebep = 'maddeyi kapsayan kartların hepsi görsele bakıyor — metinle sınanamaz'
      return satir
    }

    const sub = yakalamaSubmission(v, 'apple')
    const secim = selectRules(sub, metinAdaylari)
    if (secim.llm.length) {
      satir.durum = 'secildi'
      satir.adaylar = secim.llm.map((c) => c.id)
      return satir
    }
    satir.durum = 'secilemedi'
    const eleme = secim.elenen[0]
    satir.sebep = eleme ? `${eleme.sebep}: ${eleme.detay}` : 'seçim kartı eledi'
    return satir
  })
}

export function yakalamaOzeti(satirlar: YakalamaSatiri[]): YakalamaOzeti {
  const say = (d: YakalamaDurum) => satirlar.filter((s) => s.durum === d).length
  const disaridaHarita = new Map<string, number>()
  for (const s of satirlar) {
    if (s.durum !== 'sinanamaz') continue
    const k = s.sebep ?? 'sebep bilinmiyor'
    disaridaHarita.set(k, (disaridaHarita.get(k) ?? 0) + 1)
  }
  const sinanamaz = say('sinanamaz')
  return {
    toplam: satirlar.length,
    olculen: satirlar.length - sinanamaz,
    kartYok: say('kart-yok'),
    secildi: say('secildi'),
    secilemedi: say('secilemedi'),
    sinanamaz,
    disarida: [...disaridaHarita].map(([sebep, adet]) => ({ sebep, adet }))
      .sort((a, b) => b.adet - a.adet),
  }
}
