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
  title: string
  /** Prompt'a giren kısa özet. Uzun gövde R2/dosyada. */
  summary: string
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
}
