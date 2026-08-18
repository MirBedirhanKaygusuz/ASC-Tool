import type { LlmProvider, LlmRequest, LlmResponse, Block } from './types.js'

/**
 * Ollama (yerel) sağlayıcı.
 *
 * BULUTTAN FARKLI ÜÇ ŞEY — hepsi buraya gömülü:
 *
 * 1) num_ctx. Ollama varsayılan bağlamı küçüktür ve fazlasını SESSİZCE keser.
 *    Bizim submission'ımız ~15-20K token; ayarlamazsak kuralın baktığı metnin
 *    yarısı modele hiç ulaşmaz ve bunu fark etmeyiz. En sinsi hata bu.
 *
 * 2) concurrency = 1. Paralel istek tek GPU'yu böler VE prefix KV cache'ini
 *    kırar. Sıralı gitmek yerelde daha hızlı, sezgiye aykırı ama böyle.
 *
 * 3) Maliyet artık para değil, SANİYE. İlk çağrı submission'ı prefill eder
 *    (yavaş); sonrakiler aynı prefix'i KV cache'ten okur (hızlı). Bu yüzden
 *    "submission sabit / kural değişken" tasarımı yerelde daha da kritik.
 */
export class OllamaProvider implements LlmProvider {
  readonly name = 'ollama'
  readonly concurrency = 1

  constructor(
    readonly model: string,
    private readonly host: string,
    private readonly numCtx: number,
    readonly supportsVision: boolean,
    /** Qwen3 gibi "thinking" modelleri yavaşlatır; şema kısıtlı çıktıda kapalı iyi. */
    private readonly think: boolean,
  ) {}

  async healthcheck(): Promise<{ ok: true } | { ok: false; reason: string }> {
    let tags: { models?: Array<{ name: string }> }
    try {
      const res = await fetch(`${this.host}/api/tags`, { signal: AbortSignal.timeout(5000) })
      tags = (await res.json()) as { models?: Array<{ name: string }> }
    } catch {
      return { ok: false, reason: `Ollama'ya ulaşılamıyor (${this.host}). "ollama serve" çalışıyor mu?` }
    }
    const names = (tags.models ?? []).map((m) => m.name)
    if (!names.some((n) => n === this.model || n.startsWith(this.model.split(':')[0] + ':'))) {
      return { ok: false, reason: `Model yüklü değil: ${this.model}. "ollama pull ${this.model}" çalıştır.` }
    }
    return { ok: true }
  }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const t0 = Date.now()

    const body = {
      model: this.model,
      stream: false,
      think: this.think,
      // Ollama'nın structured output'u: şema decode sırasında zorlanır.
      // Zayıf modellerde JSON'un geçerli çıkmasını garanti eden şey bu.
      format: req.schema,
      keep_alive: '30m', // model bellekte kalsın, her çağrıda yeniden yüklenmesin
      options: {
        num_ctx: this.numCtx,       // (1) — sessiz kesilmeye karşı
        // temperature 0 küçük modellerde tekrar döngüsünü BESLER. Küçük bir
        // sıcaklık + tekrar cezası döngüyü kırar; determinizmi seed sağlar.
        temperature: req.temperature ?? 0.2,
        repeat_penalty: 1.15,
        repeat_last_n: 128,
        seed: req.seed ?? 42,
        num_predict: req.maxTokens ?? 1024,
      },
      messages: [
        { role: 'system', content: req.system },
        toMessage(req.prefix),   // SABİT — KV cache prefix'i
        { role: 'user', content: req.suffix }, // DEĞİŞKEN
      ],
    }

    const res = await fetch(`${this.host}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10 * 60_000),
    })
    if (!res.ok) {
      throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 300)}`)
    }

    const data = (await res.json()) as OllamaChatResponse
    const raw = data.message?.content ?? ''

    // Çıktı bütçesi tamamen tükendiyse JSON büyük ihtimalle yarıda kesilmiştir.
    // Sessizce yutmak yerine yüzeye çıkarıyoruz — bu hata aksi halde
    // "model hiçbir şey bulamadı" gibi görünür ve teşhis edilemez.
    const budget = req.maxTokens ?? 1024
    const truncated = (data.eval_count ?? 0) >= budget

    // prompt_eval_count = GERÇEKTEN prefill edilen token.
    // Cache'ten gelenler buraya sayılmaz; farkı cachedTokens olarak raporluyoruz.
    const promptTokens = data.prompt_eval_count ?? 0

    return {
      json: safeParse(raw),
      raw,
      truncated,
      usage: {
        inputTokens: promptTokens,
        outputTokens: data.eval_count ?? 0,
        cachedTokens: 0,
        ms: Date.now() - t0,
      },
    }
  }
}

interface OllamaChatResponse {
  message?: { content?: string }
  prompt_eval_count?: number
  eval_count?: number
  prompt_eval_duration?: number
  eval_duration?: number
}

/** Ollama'da görseller mesajın `images` alanında, base64 dizisi olarak gider. */
function toMessage(blocks: Block[]): { role: 'user'; content: string; images?: string[] } {
  const text = blocks
    .filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
  const images = blocks
    .filter((b): b is Extract<Block, { type: 'image' }> => b.type === 'image')
    .map((b) => b.base64)
  return images.length ? { role: 'user', content: text, images } : { role: 'user', content: text }
}

function safeParse(s: string): unknown | null {
  try {
    return JSON.parse(s)
  } catch {
    // format kısıtı olsa da bazı modeller ```json ile sarar
    const m = s.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      return JSON.parse(m[0])
    } catch {
      return null
    }
  }
}
