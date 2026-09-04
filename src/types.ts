/**
 * Greenlight — çekirdek veri tipleri.
 *
 * Üç ana kavram:
 *   Submission — mağazaya gönderilecek/gönderilmiş listing'in normalize edilmiş hali
 *   RuleCard   — tek bir politika kuralı ("kural kitabı"nın bir sayfası)
 *   Finding    — bir kuralın bir submission üzerinde bulduğu sorun
 */

import type { AppMeta } from './meta-fields.js'

export type { AppMeta }

export type Platform = 'apple' | 'google'
export type Severity = 'high' | 'medium' | 'low'

/** Bir bulgunun hangi tür içeriğe dayandığı. Rule card'lar bunlarla eşleşir. */
export type ArtifactKind =
  | 'name'
  | 'subtitle'
  | 'shortDescription'   // sadece Google
  | 'description'
  | 'keywords'           // sadece Apple
  | 'promotionalText'    // sadece Apple
  | 'whatsNew'
  | 'icon'
  | 'screenshots'
  | 'previewVideo'
  | 'iap'
  | 'category'
  | 'ageRating'
  | 'urls'
  | 'reviewNotes'
  | 'privacy'
  | 'declarations'

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

export interface MediaRef {
  id: string
  /** Yerel dosya yolu ya da indirilebilir URL. */
  path: string
  /** iphone_6_9, iphone_6_5, ipad_pro_12_9, phone, tablet7, ... */
  deviceClass?: string
  /** Mağazadaki gösterim sırası (1'den başlar). */
  order?: number
  width?: number
  height?: number
}

export type IapKind = 'consumable' | 'non_consumable' | 'subscription' | 'non_renewing'

export interface IapItem {
  id: string
  kind: IapKind
  name: string
  description: string
  price: number
  currency: string
  /** Abonelik dönemi: P1W | P1M | P3M | P6M | P1Y */
  duration?: string
  freeTrial?: { duration: string }
}

export interface SubmissionText {
  name?: string
  subtitle?: string
  shortDescription?: string
  description?: string
  keywords?: string
  promotionalText?: string
  whatsNew?: string
}

export interface Submission {
  platform: Platform
  appId: string
  appName: string
  locale: string
  category: string
  /** Apple: 4+ / 9+ / 12+ / 17+ — Google: Everyone / Teen / Mature 17+ ... */
  ageRating: string

  text: SubmissionText
  media: {
    icon?: MediaRef
    screenshots: MediaRef[]
    previewVideo?: MediaRef
  }
  iap: IapItem[]
  urls: {
    privacy?: string
    support?: string
    marketing?: string
  }
  reviewNotes: {
    notes?: string
    demoAccount?: { user: string; pass: string }
  }

  /**
   * Uygulama hakkında, listing'de olmayan ama denetimi etkileyen bilgiler.
   *
   * Alanların tanımı, sınır durumları ve hangi kartları açtıkları
   * `src/meta-fields.ts` içinde — tek kaynak orası, arayüz de komut satırı da
   * oradan besleniyor.
   */
  meta: AppMeta

  /**
   * App Store Connect'e BEYAN edilmiş, listing metninde görünmeyen alanlar.
   *
   * `meta`'dan farkı: orası kullanıcının elle işaretlediği üç kutu, burası
   * Apple'ın kendi kayıtları. Bu ayrım önemli — beyan çelişkisi bulgusu
   * "sen böyle söyledin" diyebilmeli.
   *
   * Opsiyonel: `fetch/asc.ts` (resmi API yolu) bunları henüz doldurmuyor ve
   * doldurmadan da çalışmaya devam etmeli. Alan `undefined` ise kural
   * "sağlanmadı" diye elenmez, "bilinmiyor" kovasına düşer (select.ts).
   */
  declarations?: Declarations

  /** Bu snapshot nereden geldi. */
  source: {
    kind: 'fixture' | 'app-store-connect' | 'play-developer-api' | 'manual'
    fetchedAt: string
  }
}

export interface Declarations {
  /** Yaş sınırı beyanı — 25 alanın yalnız sinyal taşıyanları + sayım. */
  age?: {
    /** Apple'ın hesapladığı mağaza sınıfı, ör. '17+'. */
    magazaSinifi?: string
    /** Geliştiricinin elle yükselttiği sınıf. Mağaza sınıfından DÜŞÜK olması çelişki değildir. */
    ustunKilma?: string
    kidsAgeBand?: string
    /**
     * Yalnız içerik BEYAN EDİLEN alanlar: `true` ya da 'INFREQUENT_OR_MILD'
     * gibi bir düzey. `false`/'NONE' olanlar buraya girmez ama `noneSayisi`
     * ile sayılır — "beyan edildi ve yok" ile "hiç beyan edilmedi" ayrı şey.
     */
    sinyaller: Record<string, string | true>
    noneSayisi: number
    beyanEdilmemis: string[]
    kaynak: 'surum' | 'uygulama'
    /** Sürüm bazlı beyan uygulama bazlıdan farklıysa hangi alanlarda. */
    surumFarki?: string[]
  }
  /** App Privacy etiketi — 5.1.1 ve 5.1.2'nin tek dayanağı. */
  privacy?: {
    satirlar: Array<{ kategori: string; grup: string; amac?: string; koruma: string }>
    /** DATA_USED_TO_TRACK_YOU beyan edilmiş mi. */
    takip: boolean
    kimlikleBagli: boolean
  }
  /** 5.2 — üçüncü taraf içerik beyanı. */
  icerikHaklari?: string
  /** 2.1(b) — ürünler incelemeye gönderilmiş mi. `iap[]`'ten ayrı: orası fiyat/metin. */
  urunDurumlari?: Array<{
    id: string
    durum: string
    durumGrubu?: string
    sonrakiSurumleGonder?: boolean
    incelemede?: boolean
    reviewNote?: string
  }>
  /** 2.3.3 / 2.5 — hangi cihazlar destekleniyor. */
  build?: {
    surum?: string
    cihazAileleri: string[]
    minOs?: string
    /** Hangi build'e bakıldığı: bulgu bunu yazmak zorunda. */
    kaynak: string
  }
  surum?: { durum?: string; yayinTipi?: string; usesIdfa?: boolean }
  /** 2.1 — iletişim bilgisinin DEĞERİ değil VARLIĞI (R4). */
  reviewIletisim?: { ad: boolean; eposta: boolean; telefon: boolean }
  /** 5.2.1 / 2.3.3 — özel ürün sayfaları da Apple'ın denetlediği metadata. */
  ozelSayfalar?: Array<{ ad: string; gorunur: boolean; icerikCekildi: boolean }>
  /** Geçmiş redlerin YAPISAL hâli (Apple'ın kendi taksonomisi). */
  gecmisRedler?: Array<{ madde: string; kod: string; aciklama: string }>
}

// ---------------------------------------------------------------------------
// Rule card — "kural kitabı"nın bir sayfası
// ---------------------------------------------------------------------------

export interface RuleCard {
  /** ör. apple-3.1.2-subscription-disclosure */
  id: string
  platform: Platform | 'both'

  /** Kuralın dayandığı gerçek politika maddesi. Rapor bunu gösterir. */
  source: {
    doc: string        // "Apple App Review Guidelines"
    section: string    // "3.1.2"
    url: string
    retrievedAt: string
  }

  /** subscriptions | ai-content | health | metadata | ip | ugc ... */
  tags: string[]

  /**
   * single = tek bir artifact'e bakar
   * cross  = birden fazla artifact'i BİRLİKTE değerlendirir
   *          (ör. abonelik ifşası: açıklama + IAP + ekran görüntüsü)
   */
  scope: 'single' | 'cross'

  /** Bu kural çalışırken modele hangi artifact'ler context olarak verilecek. */
  needs: ArtifactKind[]

  /**
   * Kart yalnızca bu koşullar sağlanırsa çalışır.
   * Gereksiz kuralı elemek hem maliyet hem yalancı alarm düşürür.
   */
  appliesWhen?: AppMeta & {
    categories?: string[]
    // --- Submission'dan TÜRETİLEN koşullar: kimse girmiyor, veriden çıkıyor -
    /** Abonelik ürünü var mı (3.1.2 ailesi). */
    hasSubscription?: boolean
    /** Önizleme videosu var mı (2.3.4). */
    hasPreviewVideo?: boolean
    /** Uygulama içi satın alma var mı (2.3.2, 3.1 ailesi). */
    hasIap?: boolean
    // --- Beyandan gelen koşullar: kullanıcı girmiyor, Apple söylüyor -------
    /** App Privacy etiketinde takip beyanı var mı (5.1.2). */
    declaresTracking?: boolean
    /** Üçüncü taraf içerik beyanı (5.2). */
    usesThirdPartyContent?: boolean
    /** Özel ürün sayfası var mı — bu uygulamanın iki reddi oradan geldi. */
    hasCustomProductPages?: boolean
    /** İncelemeye gönderilmemiş ürün var mı (2.1(b)). */
    hasUnsubmittedProducts?: boolean
  }

  /**
   * Ucuz ön kapı: metinde bu kalıplardan hiçbiri yoksa LLM'e hiç gitme.
   * Sadece salt-metin (scope: single) kartlarda güvenli — görsel kartlarda kullanma.
   */
  /**
   * Kart görsel GÖRMEDEN sorusuna cevap veremiyor mu?
   * true ise görsel yokken çalıştırılmaz ve raporda "denetlenmedi" olarak
   * listelenir. Çalıştırılsaydı model "paywall bulamadım" der, rapor temiz
   * görünür, konu hiç kontrol edilmemiş olurdu.
   */
  requiresVision?: boolean

  prefilter?: string[]

  /**
   * Kuralı uygulamak için gereken, modelin bilmeyebileceği olgular.
   *
   * Kurallar iki türdür:
   *   MUHAKEME kuralı — model dili yorumlar (abartılı iddia, abonelik ifşası).
   *                     Yerel 8B bunları iyi yapıyor.
   *   BİLGİ kuralı    — dünyaya dair olgu gerektirir (rakip marka adı, ünlü
   *                     kimliği, tescilli isim). Yerel model bunları BİLMEZ ve
   *                     sessizce "sorun yok" der. Olgu karta yazılmalı.
   */
  facts?: string[]

  /** Modele sorulacak TEK net soru. Kartın en önemli alanı. */
  question: string

  /** Kuralın sade dille yeniden ifadesi. */
  ruleText: string

  /** İhlal SAYILAN örnek. */
  positiveExample?: string

  /** İhlal SAYILMAYAN örnek. Yalancı alarma karşı en etkili alan — boş bırakma. */
  negativeExample?: string

  /**
   * Bulgu ÜRETİLMEYECEK durumların açık listesi.
   *
   * NEDEN AYRI ALAN. Muafiyet cümlesi `question` metninin içine gömülüyken
   * ölçümde şu görüldü: gpt-4o-mini muafiyeti okumuyor. 2.3.7 kartları beş
   * uygulamada 10 ham bulgu üretti ve hepsi kartın KENDİ "ihlal değildir"
   * tarifine giren şeylerdi ("AI Photo & Video Face Swap" gibi düz tanıtım
   * ifadeleri). Prompt'ta muafiyet artık kendi başlığı altında ve modelin
   * gördüğü SON şeylerden biri — zayıf modelde konum ve biçim işe yarıyor.
   *
   * Buraya ölçümde GÖRÜLEN yalancı alarmlar yazılır, tahmin edilenler değil.
   */
  notViolation?: string[]

  /**
   * violation = kesin ihlal, kırmızı
   * risk      = insan kararı gerekir, sarı ("kontrol et")
   * manual    = listing'den görülemez. LLM'e HİÇ gitmez; rapora kontrol
   *             maddesi olarak düşer. Kapsamı tam tutar, uydurma üretmez.
   */
  outcome: 'violation' | 'risk' | 'manual'

  defaultSeverity: Severity
  version: number
}

// ---------------------------------------------------------------------------
// Finding
// ---------------------------------------------------------------------------

/** Bulgunun metnin/görselin neresine dayandığı. Doğrulama ve UI için. */
export type Locator =
  | { type: 'text'; field: keyof SubmissionText; start?: number; end?: number }
  | { type: 'image'; mediaId: string; note?: string }
  | { type: 'iap'; iapId: string }
  | { type: 'field'; field: string }

export interface ManualCheck {
  ruleId: string
  platform: Platform
  question: string
  ruleText: string
  source: RuleCard['source']
  why: string
}

export interface Finding {
  ruleId: string
  platform: Platform
  severity: Severity
  outcome: 'violation' | 'risk'
  artifact: ArtifactKind
  locator: Locator
  /** İçerikten BİREBİR alıntı. Metin bulgularında programatik doğrulanır. */
  excerpt: string
  rationale: string
  suggestedFix: string
  /** 0-1. Doğrulama turundaki oy uyuşmasından hesaplanır, modelin beyanı değil. */
  confidence: number
  /** Bu bulgu değerlendirilirken modele verilen dersler. Rapordaki örnekler bundan gelir. */
  lessonIds?: string[]
  /** Rapora basılacak gerçek red örnekleri. */
  examples?: FindingExample[]
  /** Bulgunun hangi aşamalardan geçtiği — debugging ve eval için. */
  trace?: {
    grounded?: boolean
    verifyVotes?: { agree: number; total: number }
  }
}

export interface FindingExample {
  lessonId: string
  lessonTitle: string
  appName: string
  rejectedAt: string | null
  guideline: string
  excerpt: string
  reviewerText: string
  resolution: string | null
}

export interface LintFinding {
  /** lint-privacy-url-dead gibi */
  checkId: string
  /** Dayandığı Apple maddesi ("2.3.7"). `lint/sections.ts` dolduruyor. */
  section?: string
  platform: Platform
  severity: Severity
  artifact: ArtifactKind
  message: string
  suggestedFix: string
}

/**
 * Bir kart neden çalışmadı?
 *
 * Rapor bunu YAZMAK ZORUNDA. "28 kural denetlendi" satırı, geri kalan 147
 * kartın sebebi söylenmediğinde kapsam gibi okunuyor. Sebepler ayrı ayrı
 * duruyor çünkü kullanıcı için anlamları farklı: "bilinmiyor" doldurulacak
 * bir boşluk, "beyanla elendi" itiraz edilebilecek bir cevap, "veri yok"
 * çekim eksiği, "konu geçmiyor" ise metin eşleşmesine dayanan bir tahmin.
 */
export type ElemeSebebi =
  /** Kullanıcının işaretleyeceği alan boş. Eylem: alanı doldur. */
  | 'meta-bilinmiyor'
  /**
   * Apple'ın kendi kaydı (gizlilik etiketi, içerik hakları beyanı) ÇEKİLMEDİ.
   *
   * `meta-bilinmiyor`dan ayrı durmak zorunda: kullanıcının doldurabileceği bir
   * alan yok, dolayısıyla "alanı doldur, kart açılır" tarifi bu kartlar için
   * yanlış. Eylem çekimi tamamlamak — ilgili uyarı zaten "Denetlenmedi"de.
   */
  | 'beyan-cekilmedi'
  | 'beyanla-elendi'
  | 'veri-yok'
  | 'konu-gecmiyor'

export interface ElenenKart {
  id: string
  section: string
  outcome: RuleCard['outcome']
  sebep: ElemeSebebi
  /** İnsanın okuyup itiraz edebileceği gerekçe: "kullanıcı içeriği = hayır". */
  detay: string
}

/**
 * Tek bir kartın bulgu hunisi: ham → alıntı doğrulama → ikinci göz → tekrar.
 *
 * Rapora giriyor çünkü aynı veri iki işe yarıyor: hata ayıklama ("bu kart
 * neden bu kadar çok şey uyduruyor") ve yalancı alarm ölçümü. İkisi için ayrı
 * boru hattı kurmuyoruz.
 */
export interface KartHunisi {
  ruleId: string
  section: string
  ham: number
  alintiDusen: number
  ikinciGozDusen: number
  tekrarDusen: number
  kalan: number
  /**
   * İkinci gözdeki oy dağılımı: {"0/3": 4, "2/3": 5, "3/3": 12}.
   *
   * NEDEN KAYITTA. Eşik 2/3 seçildi ve HİÇ ölçülmedi; mercekler farklılaşınca
   * doğru eşik değişmiş olabilir. Dağılım kayda girerse soru yeni model
   * çağrısı yapmadan cevaplanabiliyor: "eşik 1/3 olsaydı kaç bulgu daha
   * geçerdi, 3/3 olsaydı kaç tanesi düşerdi".
   */
  oyDagilimi: Record<string, number>
  elenenOrnekler: Array<{
    asama: 'alinti' | 'ikinci-goz' | 'tekrar'
    excerpt: string
    rationale: string
    /**
     * Bulgunun hangi alana yazıldığı ve nasıl çapalandığı.
     *
     * Kayda girdi çünkü ilk koşuda cevaplanamayan bir soru çıktı: 2.3.3
     * (ekran görüntüsü kartı) 7 bulgusunu alıntı doğrulamada kaybetti ve
     * alıntılar ekran görüntüsü üstündeki yazılara benziyordu. Bunun modelin
     * yanlış alan etiketlemesi mi yoksa başka bir şey mi olduğu, artifact ve
     * locator kayda girmeden ayırt edilemiyor.
     */
    artifact: string
    locator: string
    /** İkinci gözde alınan oy: "1/3". */
    oy?: string
  }>
}

export interface Report {
  submission: { appId: string; appName: string; platform: Platform; locale: string }
  generatedAt: string
  corpusVersion: string
  riskScore: number
  /**
   * Skorun neyden oluştuğu. Tek sayı "düzeldi mi" sorusunu cevaplamıyor;
   * "3 kesin ihlal → 1 kesin ihlal" cevaplıyor.
   */
  riskBreakdown: {
    ham: number
    /** Gönderimi engelleyebilecek FARKLI sorun sayısı. Raporun rengi bundan gelir. */
    engelleyici: number
    kesinIhlal: number
    risk: number
    kesinKontrol: number
    yuksek: number
    orta: number
    dusuk: number
  }
  lint: LintFinding[]
  findings: Finding[]
  manual: ManualCheck[]
  /** Görsel gerektirdiği için çalıştırılamayan kartlar — DENETLENMEDİ. */
  notChecked: string[]
  /** Denetimde kullanılan aktif ders sayısı + onay bekleyen taslaklar. */
  lessons: { active: number; draft: number; coverageGaps: string[] }

  /**
   * Elle işaretlenen alanların bu denetimdeki değeri ve NEREDEN geldiği.
   *
   * Raporda durması şart: kural seçimini bu alanlar belirliyor. Değerleri
   * göstermeyen bir rapor, "şu kart neden çalışmadı" sorusunu cevaplanamaz
   * kılıyor — üstelik arayüzdeki "hepsi hayır" düğmesi bu cevapları tek tıkla
   * verebiliyor.
   */
  beyan: Array<{ alan: string; etiket: string; deger: boolean | null; kaynak: string }>

  /**
   * Kaç kart çalıştı, kaç kart NEDEN çalışmadı.
   *
   * `stats.rulesSelected` tek başına yanıltıcıydı: seçilen kartı gösteriyor,
   * elenenleri saymıyordu. Kural kitabı 25'ten 175'e çıkınca bu fark raporun
   * en büyük sessiz boşluğu hâline geldi.
   */
  selection: {
    /** Kural kitabındaki toplam kart. */
    corpus: number
    /** Platformu tutan, yani bu denetime aday olan kart. */
    aday: number
    modele: number
    calisti: number
    elleKontrol: number
    elenen: ElenenKart[]
    /**
     * Koşu `--kartlar` ile SINIRLANDIYSA hangi kartlarla.
     *
     * Rapora yazılmak zorunda: filtreli bir koşu tam denetim DEĞİLDİR ve
     * dosyaya bakan biri bunu göremezse "temiz çıktı" diye okur.
     */
    filtre?: string[]
  }
  /**
   * Kart bazında bulgu hunisi. Model turu koşmadıysa boş.
   *
   * `stats` yalnız TOPLAMI veriyor: "12 ham → 3 kaldı". Hangi kartın gürültü
   * ürettiği toplamda görünmüyor ve kural kitabı büyüdükçe asıl soru o.
   */
  huni?: KartHunisi[]
  stats: {
    rulesSelected: number
    rulesRun: number
    rawFindings: number
    afterGrounding: number
    afterVerify: number
  }
}
