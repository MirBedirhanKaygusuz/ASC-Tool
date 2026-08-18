/**
 * Greenlight — çekirdek veri tipleri.
 *
 * Üç ana kavram:
 *   Submission — mağazaya gönderilecek/gönderilmiş listing'in normalize edilmiş hali
 *   RuleCard   — tek bir politika kuralı ("kural kitabı"nın bir sayfası)
 *   Finding    — bir kuralın bir submission üzerinde bulduğu sorun
 */

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

  /** Uygulama hakkında, listing'de olmayan ama denetimi etkileyen bilgiler. */
  meta: {
    /** Uygulama giriş/hesap gerektiriyor mu? Demo hesap kuralı buna bağlı. */
    requiresLogin?: boolean
    /** Uygulama AI ile içerik üretiyor mu? AI ifşa kuralları buna bağlı. */
    generatesAiContent?: boolean
    /** Kullanıcı içeriği barındırıyor mu? UGC kuralları buna bağlı. */
    hasUserGeneratedContent?: boolean
  }

  /** Bu snapshot nereden geldi. */
  source: {
    kind: 'fixture' | 'app-store-connect' | 'play-developer-api' | 'manual'
    fetchedAt: string
  }
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
  appliesWhen?: {
    categories?: string[]
    requiresLogin?: boolean
    generatesAiContent?: boolean
    hasUserGeneratedContent?: boolean
    hasSubscription?: boolean
  }

  /**
   * Ucuz ön kapı: metinde bu kalıplardan hiçbiri yoksa LLM'e hiç gitme.
   * Sadece salt-metin (scope: single) kartlarda güvenli — görsel kartlarda kullanma.
   */
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
  positiveExample: string

  /** İhlal SAYILMAYAN örnek. Yalancı alarma karşı en etkili alan — boş bırakma. */
  negativeExample: string

  /**
   * violation = kesin ihlal, kırmızı
   * risk      = insan kararı gerekir, sarı ("kontrol et")
   */
  outcome: 'violation' | 'risk'

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
  /** Bulgunun hangi aşamalardan geçtiği — debugging ve eval için. */
  trace?: {
    grounded?: boolean
    verifyVotes?: { agree: number; total: number }
  }
}

export interface LintFinding {
  /** lint-privacy-url-dead gibi */
  checkId: string
  platform: Platform
  severity: Severity
  artifact: ArtifactKind
  message: string
  suggestedFix: string
}

export interface Report {
  submission: { appId: string; appName: string; platform: Platform; locale: string }
  generatedAt: string
  corpusVersion: string
  riskScore: number
  lint: LintFinding[]
  findings: Finding[]
  stats: {
    rulesSelected: number
    rulesRun: number
    rawFindings: number
    afterGrounding: number
    afterVerify: number
  }
}
