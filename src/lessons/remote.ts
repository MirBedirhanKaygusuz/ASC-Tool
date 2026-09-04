import type { Lesson, RejectCase, LessonStore, LessonVector } from './types.js'
import type { Platform } from '../types.js'

/**
 * Ortak ders havuzu istemcisi — `havuz/server.js`in karşı tarafı.
 *
 * NEDEN İZOMORFİK (Node'a özgü hiçbir şey yok): bu sınıf İKİ YERDE koşuyor.
 * Terminalde `npm run learn`/`check` içinden, tarayıcıda da eklentinin
 * denetiminden (`extension/src/havuz.bundle.js`, esbuild ile buradan
 * derleniyor). İkisine ayrı istemci yazsaydık aynı hatayı iki kez yapar ve
 * ikisinin sözleşmesi zamanla ayrışırdı — bu depodaki bir numaralı yasak.
 *
 * Bu yüzden burada `process.env` YOK, `node:` içe aktarma YOK. Adres ve
 * belirteç yapıcıya verilir; onları nereden okuyacağını çağıran bilir
 * (terminalde .env, eklentide chrome.storage).
 *
 * TEL BİÇİMİ camelCase: snake_case çevirisi sunucuda, tek yerde. Burada
 * ikinci bir çeviri katmanı olsaydı ikisi kaçınılmaz olarak ayrışırdı.
 */
export class RemoteLessonStore implements LessonStore {
  readonly name = 'havuz'
  private readonly base: string

  constructor(
    baseUrl: string,
    private readonly token: string,
    /** Ağ yanıt vermezse denetim sonsuza kadar beklemesin. */
    private readonly timeoutMs = 30_000,
  ) {
    // '/v1' ile de girilebilsin, sonda eğik çizgi olsun olmasın: adresi
    // ayarlara yapıştıran kişi hangisini yazdığını hatırlamak zorunda kalmasın.
    this.base = baseUrl.trim().replace(/\/+$/, '').replace(/\/v1$/, '')
  }

  // --- Taşıma ----------------------------------------------------------------

  private async iste(yol: string, init?: RequestInit): Promise<Response> {
    let res: Response
    try {
      res = await fetch(`${this.base}${yol}`, {
        ...init,
        headers: {
          'x-gl-token': this.token,
          ...(init?.body ? { 'content-type': 'application/json' } : {}),
          ...(init?.headers ?? {}),
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (e) {
      // Ağ hatası ile HTTP hatası ayrı şeyler: ilki "havuza ulaşılamadı"
      // (adres yanlış, sunucu kapalı, VPN yok), ikincisi "havuz hayır dedi".
      // Aynı mesaja indirseydik yanlış yerde arardık.
      throw new Error(`havuza ulaşılamadı (${this.base}): ${(e as Error).message}`)
    }
    if (!res.ok) {
      const govde = await res.text().catch(() => '')
      let sebep = govde.slice(0, 300)
      try {
        sebep = (JSON.parse(govde) as { error?: string }).error ?? sebep
      } catch { /* JSON değilse ham metni göster */ }
      throw new Error(`havuz HTTP ${res.status}: ${sebep}`)
    }
    return res
  }

  private async al<T>(yol: string): Promise<T> {
    return (await this.iste(yol)).json() as Promise<T>
  }

  private async yolla(yontem: string, yol: string, govde: unknown): Promise<void> {
    await this.iste(yol, { method: yontem, body: JSON.stringify(govde) })
  }

  /** Anahtar `bodies/x.md` biçiminde — eğik çizgiler yol, kalanı kaçışlı. */
  private blobYolu(key: string): string {
    return `/blob/${key.split('/').map(encodeURIComponent).join('/')}`
  }

  // --- Arayüz ----------------------------------------------------------------

  async healthcheck(): Promise<{ ok: true } | { ok: false; reason: string }> {
    try {
      const h = await this.al<{ ok: boolean; db: boolean; yetki: string; error?: string }>('/health')
      if (!h.db) return { ok: false, reason: `havuzun veritabanı yanıt vermiyor: ${h.error ?? '?'}` }
      // Belirteci ŞİMDİ doğrula. Bunu atlarsak yanlış belirteci ilk gerçek
      // çağrıda öğreniriz — o da genelde bir denetimin ortasıdır.
      if (h.yetki === 'yok') return { ok: false, reason: 'belirteç geçersiz (HAVUZ_TOKEN)' }
      return { ok: true }
    } catch (e) {
      return { ok: false, reason: (e as Error).message }
    }
  }

  async activeLessons(platform: Platform): Promise<Lesson[]> {
    const r = await this.al<{ lessons: Lesson[] }>(
      `/lessons?platform=${encodeURIComponent(platform)}&status=active`,
    )
    return r.lessons
  }

  async allLessons(): Promise<Lesson[]> {
    return (await this.al<{ lessons: Lesson[] }>('/lessons')).lessons
  }

  async findLesson(id: string): Promise<Lesson | null> {
    try {
      return (await this.al<{ lesson: Lesson }>(`/lessons/${encodeURIComponent(id)}`)).lesson
    } catch (e) {
      // "Yok" bir hata değil, bir cevap: yerel depo da null döndürüyor ve
      // ingest.ts buna göre yazılmış.
      if (/HTTP 404/.test((e as Error).message)) return null
      throw e
    }
  }

  async candidatesFor(platform: Platform, guideline: string): Promise<Lesson[]> {
    const r = await this.al<{ lessons: Lesson[] }>(
      `/lessons?platform=${encodeURIComponent(platform)}` +
        `&guideline=${encodeURIComponent(guideline)}&exclude=retired`,
    )
    return r.lessons
  }

  async examplesFor(lessonId: string, limit = 3): Promise<RejectCase[]> {
    const r = await this.al<{ examples: RejectCase[] }>(
      `/lessons/${encodeURIComponent(lessonId)}/examples?limit=${limit}`,
    )
    return r.examples
  }

  async allExamples(): Promise<RejectCase[]> {
    return (await this.al<{ examples: RejectCase[] }>('/examples')).examples
  }

  async readRaw(example: RejectCase): Promise<string> {
    return this.blobOku(example.rawKey)
  }

  async readBody(lesson: Lesson): Promise<string> {
    return this.blobOku(lesson.bodyKey)
  }

  /**
   * Okunamayan gövde boş dizedir, hata değil.
   *
   * Yerel depo da böyle davranıyor. Eksik tek bir gövde yüzünden tüm denetimi
   * düşürmek orantısız olurdu — gövde prompt'a girmiyor, yalnız insanın
   * okuması için.
   */
  private async blobOku(key: string): Promise<string> {
    try {
      return await (await this.iste(this.blobYolu(key))).text()
    } catch {
      return ''
    }
  }

  async createLesson(lesson: Lesson, body: string): Promise<void> {
    await this.yolla('POST', '/lessons', { lesson, body })
  }

  async updateLessonStatus(id: string, status: Lesson['status']): Promise<void> {
    await this.yolla('PATCH', `/lessons/${encodeURIComponent(id)}`, { status })
  }

  async addExample(example: RejectCase, rawText: string): Promise<void> {
    await this.yolla('POST', '/examples', { example, raw: rawText })
  }

  async readVectors(): Promise<LessonVector[]> {
    return (await this.al<{ vectors: LessonVector[] }>('/vectors')).vectors
  }

  async writeVectors(vectors: LessonVector[]): Promise<void> {
    if (!vectors.length) return
    await this.yolla('PUT', '/vectors', { vectors })
  }
}
