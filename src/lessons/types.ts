import type { Platform, Severity, ArtifactKind } from '../types.js'

/**
 * Ders (lesson) — gerçek red'lerden damıtılmış kalıp.
 *
 * KART ile DERS farkı:
 *   Kart  = politikanın ne dediği.        Kaynağı Apple/Google dokümanı.
 *   Ders  = pratikte nasıl reddedildiği.  Kaynağı bizim gerçek red'lerimiz.
 *
 * Ders karta bağlanır (rule_id) ve o kartın çağrısına ek KANIT olarak girer.
 * Bağsız ders = "bu yüzden reddedildik ama hiçbir kartımız kapsamıyor" —
 * kapsama boşluğunun kendisi bir alarmdır.
 */
export interface Lesson {
  id: string
  /** Bağlı olduğu corpus kartı. null ise KAPSAMA BOŞLUĞU. */
  ruleId: string | null
  platform: Platform
  /** "2.3.3" — reject metninden çıkan madde. */
  guideline: string
  /**
   * Red'in NEREYE baktığı. Denetimin kapsamını bu belirler:
   *
   *   listing → mağaza kaydında görülebilir (metin, ekran görüntüsü, IAP kurulumu).
   *             Bir karta bağlanmalı; bağlanamıyorsa gerçek kapsama boşluğudur.
   *   in-app  → uygulamanın çalışma anındaki davranışı (ilk açılışta rating istemek,
   *             sandbox'ta bozuk paywall). Listing denetimi bunu YAPISAL OLARAK
   *             göremez — karta bağlanmaması boşluk değildir. Kart aramak yerine
   *             yayın öncesi elle kontrol listesine girer.
   *
   * Bu ayrım olmadan boşluk listesi hiç kapanmayacak alarmlarla doluyor.
   */
  scope: 'listing' | 'in-app'
  title: string
  /** Prompt'a giren kısa özet. Uzun gövde R2/dosyada. */
  summary: string
  /**
   * Bu kalıbı listing'de YAKALAYAN somut belirtiler.
   *
   * Özet tek başına "ne olduğunu" söylüyor; denetleyen modele asıl gereken
   * "neye bakayım". Özeti uzatmak yerine ayrı alan: prompt'a madde madde
   * girer, gövdeye karışmaz ve gömme metnini de bu besler.
   */
  signals: string[]
  /**
   * Bu kalıbın SAYILMADIĞI durum. Kartlardaki `negativeExample`in ders
   * karşılığı — onsuz ders, benzeyen ama masum listing'lerde de ateşliyor.
   */
  falsePositive: string | null
  artifact: ArtifactKind | null
  severity: Severity
  /**
   * draft  → henüz onaylanmadı, denetimi ETKİLEMEZ
   * active → denetimde kullanılır
   * retired → kural değişti/geçersiz
   */
  status: 'draft' | 'active' | 'retired'
  /** Gövdenin depodaki anahtarı: lessons/{id}.md */
  bodyKey: string
  exampleCount: number
  createdAt: string
  updatedAt: string
}

/** Bir dersin gerçek örneği — yaşanmış tek bir red vakası. */
export interface RejectCase {
  id: string
  lessonId: string
  appName: string
  platform: Platform
  rejectedAt: string | null
  guideline: string
  artifact: ArtifactKind | null
  /** Reddedilen içerikten alıntı. Rapordaki "örnek reject" bu. */
  excerpt: string
  /** Reviewer'ın yazdığının özü. */
  reviewerText: string
  /** Neyle geçti. suggestedFix'i gerçekçi yapan bilgi. */
  resolution: string | null
  /** Ham metnin depodaki anahtarı: rejects/{id}.txt */
  rawKey: string
  status: 'draft' | 'active'
  createdAt: string
}

/**
 * Ham red metninden çıkarılan alanlar — dersin ve vakanın ham maddesi.
 *
 * `Lesson`den ayrı duruyor çünkü bu bir ARA ürün: karta bağlanmadan, id
 * verilmeden, mevcut bir dersle eşleştirilmeden önceki hâl. Ayrıca ikinci
 * tur (review.ts) tam olarak bu nesneyi düzeltiyor.
 */
export interface Extracted {
  platform: Platform
  guideline: string
  scope: 'listing' | 'in-app'
  title: string
  artifact: string
  excerpt: string
  reviewerText: string
  /** Kalıbı başka bir listing'de yakalayacak somut belirtiler. */
  signals: string[]
  /** Benzeyip de ihlal sayılmayan durum. */
  falsePositive: string | null
  /** Red'in ALTINDA yatan sebep. Gövdeye girer, prompt'a girmez. */
  rootCause: string | null
  resolution?: string | null
  appName?: string | null
  rejectedAt?: string | null
  severity: 'high' | 'medium' | 'low'
  summary: string
}

/**
 * Bir dersin anlamsal vektörü.
 *
 * `hash` gömülen metnin + model + boyutun özeti. Eşleşmiyorsa vektör BAYAT
 * sayılır ve yeniden gömülür; bu sayede model değiştirmek veya bir dersin
 * özetini elle düzeltmek elle temizlik gerektirmez.
 */
export interface LessonVector {
  lessonId: string
  model: string
  dim: number
  hash: string
  vec: number[]
}

export interface LessonWithExamples {
  lesson: Lesson
  examples: RejectCase[]
}

/**
 * Ders deposu.
 *
 * İki implementasyon: yerel dosya sistemi (bugün) ve Supabase+R2 (anahtarlar
 * gelince). Boru hattı yalnızca bu arayüzü konuşur — LlmProvider'daki desen.
 */
export interface LessonStore {
  name: string
  healthcheck(): Promise<{ ok: true } | { ok: false; reason: string }>

  /** Denetimde kullanılacak dersler. Yalnızca status=active döner. */
  activeLessons(platform: Platform): Promise<Lesson[]>

  /** Bir dersin örnekleri — rapora basılacak "örnek reject"ler. */
  examplesFor(lessonId: string, limit?: number): Promise<RejectCase[]>

  /**
   * TÜM red vakaları, yeniden eskiye.
   *
   * Dersler "kalıp" görünümü; bu ise ham geçmiş: hangi uygulama, ne zaman,
   * hangi maddeden reddedildi. İkisi farklı soruları yanıtlıyor ve red
   * geçmişini yalnızca derslerin içinden görmek, aynı vakayı iki kez
   * saymadan "bu uygulama kaç kez reddedildi" sorusunu yanıtlayamıyor.
   */
  allExamples(): Promise<RejectCase[]>

  /** Bir vakanın ham metni — Apple'ın yazdığının tamamı. */
  readRaw(example: RejectCase): Promise<string>

  /** Tüm dersler (durum filtresiz) — yönetim komutları için. */
  allLessons(): Promise<Lesson[]>

  findLesson(id: string): Promise<Lesson | null>

  /** Yeni reject'in eşleşebileceği aday dersler: aynı platform + aynı madde. */
  candidatesFor(platform: Platform, guideline: string): Promise<Lesson[]>

  createLesson(lesson: Lesson, body: string): Promise<void>
  updateLessonStatus(id: string, status: Lesson['status']): Promise<void>
  addExample(example: RejectCase, rawText: string): Promise<void>

  /** Ders gövdesi — uzun anlatım. Yalnızca gerektiğinde okunur. */
  readBody(lesson: Lesson): Promise<string>

  /**
   * Anlamsal aday araması için ders vektörleri.
   *
   * Dersin YANINDA değil AYRI duruyorlar: her `allLessons()` çağrısında 512
   * sayılık diziyi de taşımak, vektörü hiç kullanmayan denetim yolunu bedava
   * yavaşlatırdı. VOYAGE_API_KEY yoksa bu ikili hiç çağrılmaz.
   */
  readVectors(): Promise<LessonVector[]>

  /** lessonId'ye göre upsert. Var olanı ezer, olmayanı ekler. */
  writeVectors(vectors: LessonVector[]): Promise<void>
}
