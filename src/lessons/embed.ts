import { createHash } from 'node:crypto'
import type { Lesson, LessonVector, LessonStore } from './types.js'
import type { Platform } from '../types.js'

/**
 * Anlamsal aday araması — Voyage AI gömme (embedding) modeli.
 *
 * NEDEN VAR: `candidatesFor` aday havuzunu MADDE NUMARASI ile daraltıyor
 * (`guideline` birebir eşitlik). Aynı kalıp "2.3.3" yerine "2.3.1" diye
 * yazılmış bir red'den geldiğinde aday bulunamıyor, model hiç sorulmuyor ve
 * mevcut dersin örneği olacak vaka YENİ DERS açıyordu. Ders sayısı arttıkça
 * aynı kalıbın üç dört kopyası birikir; her biri ayrı ayrı onay bekler ve
 * denetime hiçbiri girmez.
 *
 * Numara eşleşmesi KALDIRILMADI — o deterministik taban. Bunun üstüne
 * anlamca yakın dersler EKLENİYOR; karar yine modelin (`matchLesson`).
 *
 * ANAHTAR YOKSA: `createEmbedder()` null döner ve boru hattı eskisi gibi
 * yalnızca numara eşleşmesiyle çalışır. Depo katmanındaki desenin aynısı —
 * bulut anahtarı olmayan kurulum bozulmaz.
 */

export interface Embedder {
  name: string
  model: string
  dim: number
  /**
   * Voyage sorgu ve dokümanı FARKLI gömüyor; ayrımı vermek doğruluğu
   * ölçülebilir biçimde artırıyor. Yeni red = query, mevcut ders = document.
   */
  embed(texts: string[], inputType: 'query' | 'document'): Promise<number[][]>
}

/** Tek istekte kaç metin. Voyage sınırı 1000; kısa özetlerde 128 fazlasıyla yeter. */
const BATCH = 128

class VoyageEmbedder implements Embedder {
  readonly name = 'voyage'

  constructor(
    readonly model: string,
    readonly dim: number,
    private readonly apiKey: string,
    private readonly baseUrl: string,
  ) {}

  async embed(texts: string[], inputType: 'query' | 'document'): Promise<number[][]> {
    const out: number[][] = []
    for (let i = 0; i < texts.length; i += BATCH) {
      out.push(...(await this.batch(texts.slice(i, i + BATCH), inputType)))
    }
    return out
  }

  private async batch(texts: string[], inputType: 'query' | 'document'): Promise<number[][]> {
    const res = await this.send({
      input: texts,
      model: this.model,
      input_type: inputType,
      output_dimension: this.dim,
      // Ders özeti 300 karakter; kırpma pratikte hiç devreye girmez ama ham
      // reject metni gömülmek istenirse 32K sınırında patlamak yerine kırpsın.
      truncation: true,
    })
    const json = (await res.json()) as { data?: Array<{ embedding: number[]; index: number }> }
    const data = json.data ?? []
    if (data.length !== texts.length) {
      throw new Error(`Voyage ${texts.length} metin için ${data.length} vektör döndürdü`)
    }
    // Sıra garantili değil; index alanı var, ona göre yerleştir.
    const sorted = new Array<number[]>(texts.length)
    for (const d of data) sorted[d.index] = d.embedding
    return sorted
  }

  /**
   * 429 ve 5xx'te yeniden dener.
   *
   * Gömme çağrısı denetimin yanında ucuz ve seyrek, o yüzden burada
   * `openai-compatible`teki vali mekanizmasına gerek yok — üstel bekleme
   * yetiyor. Ama sessizce düşmemeli: reindex sırasında tek 429, elli dersin
   * vektörünü kaybettirir ve sebebi hiç görünmezdi.
   */
  private async send(body: unknown): Promise<Response> {
    const MAX_ATTEMPTS = 5
    let lastStatus = 0
    let lastText = ''

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      })
      if (res.ok) return res

      lastStatus = res.status
      lastText = (await res.text()).slice(0, 300)
      const retriable = res.status === 429 || res.status >= 500
      if (!retriable || attempt === MAX_ATTEMPTS) break

      const hint = Number(res.headers.get('retry-after')) * 1000
      const floor = Math.min(15_000, 500 * 2 ** attempt)
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, Math.max(Number.isFinite(hint) ? hint : 0, floor) + jitter))
    }

    throw new Error(`Voyage ${lastStatus}: ${lastText}`)
  }
}

/**
 * Gömme fabrikası. Anahtar yoksa null — çağıran taraf bunu bir arıza değil,
 * "bu özellik kapalı" diye okur.
 */
export function createEmbedder(): Embedder | null {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) return null
  return new VoyageEmbedder(
    process.env.VOYAGE_MODEL ?? 'voyage-4-lite',
    // 512 boyut: 200 derslik bir depoda 1024 ile ölçülebilir fark yok, dosya
    // yarı boyutta. Değiştirilirse vektörler BAYAT sayılır ve yeniden gömülür
    // (hash'e model+boyut giriyor) — elle temizlik gerekmez.
    Number(process.env.VOYAGE_DIM ?? 512),
    apiKey,
    process.env.VOYAGE_BASE_URL ?? 'https://api.voyageai.com/v1',
  )
}

/**
 * Bir dersin gömülecek metni.
 *
 * MADDE NUMARASI BİLEREK YOK. Aranan şey tam olarak "numarası tutmayan ama
 * aynı olan kalıp"; numarayı metne koymak, kaçırdığımız durumu geri getirir.
 * Alan adı (screenshots / iap) içeride: aynı maddedeki iki farklı kalıbı
 * ayıran en güçlü sinyal o.
 */
export function lessonText(l: Pick<Lesson, 'title' | 'summary' | 'artifact' | 'signals'>): string {
  return [
    l.title,
    l.artifact ? `Alan: ${l.artifact}` : '',
    l.summary,
    ...(l.signals ?? []),
  ].filter(Boolean).join('\n')
}

/** Vektörün bayat olup olmadığını belirleyen anahtar: metin + model + boyut. */
export function vectorHash(text: string, model: string, dim: number): string {
  return createHash('sha1').update(`${model}:${dim}:${text}`).digest('hex').slice(0, 16)
}

/**
 * Kosinüs benzerliği.
 *
 * Voyage float vektörleri birim uzunlukta döndürür, yani nokta çarpımı
 * yeterli olurdu. Yine de bölmeyi yapıyoruz: `output_dtype` değişirse veya
 * başka bir sağlayıcı takılırsa sessizce yanlış skor üretmesin.
 */
export function cosine(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || !a.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    na += a[i]! * a[i]!
    nb += b[i]! * b[i]!
  }
  if (na === 0 || nb === 0) return 0
  return dot / Math.sqrt(na * nb)
}

/**
 * Eksik ve BAYAT vektörleri tamamla — tek toplu çağrıda.
 *
 * Kendi kendini onarır: anahtar sonradan eklendiğinde, model değiştiğinde
 * veya bir dersin özeti elle düzeltildiğinde ilk `learn` koşusunda kendini
 * toparlar. Elle `reindex` çalıştırmayı hatırlamak zorunda değilsin.
 *
 * Dönen sayı YENİDEN GÖMÜLEN ders sayısı; hepsi güncelse sıfırdır ve tek bir
 * ağ isteği bile atılmaz.
 */
export async function ensureVectors(
  store: LessonStore,
  embedder: Embedder,
  lessons: Lesson[],
): Promise<{ vectors: LessonVector[]; embedded: number }> {
  const mevcut = new Map((await store.readVectors()).map((v) => [v.lessonId, v]))

  const bayat: Array<{ lesson: Lesson; text: string; hash: string }> = []
  for (const l of lessons) {
    const text = lessonText(l)
    const hash = vectorHash(text, embedder.model, embedder.dim)
    if (mevcut.get(l.id)?.hash !== hash) bayat.push({ lesson: l, text, hash })
  }

  if (bayat.length) {
    const vecs = await embedder.embed(bayat.map((b) => b.text), 'document')
    const taze: LessonVector[] = bayat.map((b, i) => ({
      lessonId: b.lesson.id,
      model: embedder.model,
      dim: embedder.dim,
      hash: b.hash,
      vec: vecs[i]!,
    }))
    await store.writeVectors(taze)
    for (const v of taze) mevcut.set(v.lessonId, v)
  }

  return { vectors: [...mevcut.values()], embedded: bayat.length }
}

export interface NearMatch {
  lesson: Lesson
  score: number
}

/**
 * Anlamca en yakın dersler.
 *
 * Kaba kuvvet kosinüs — 200 ders × 512 boyut mikrosaniyeler sürer, indeks
 * kurmak bu ölçekte katıksız karmaşıklık olurdu. On bin dersi geçerse
 * pgvector + ANN'e geçilir; o zamana kadar değil.
 */
export async function nearestLessons(
  store: LessonStore,
  embedder: Embedder,
  queryText: string,
  opts: { platform: Platform; exclude?: ReadonlySet<string>; topK?: number; minScore?: number },
): Promise<NearMatch[]> {
  const havuz = (await store.allLessons()).filter(
    (l) => l.platform === opts.platform && l.status !== 'retired' && !opts.exclude?.has(l.id),
  )
  if (!havuz.length) return []

  const { vectors } = await ensureVectors(store, embedder, havuz)
  const byId = new Map(vectors.map((v) => [v.lessonId, v]))
  const [q] = await embedder.embed([queryText], 'query')
  if (!q) return []

  const minScore = opts.minScore ?? 0.55
  return havuz
    .map((lesson) => ({ lesson, score: cosine(q, byId.get(lesson.id)?.vec ?? []) }))
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.topK ?? 5)
}
