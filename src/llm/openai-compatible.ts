import type { LlmProvider, LlmRequest, LlmResponse, Block } from './types.js'

/**
 * OpenAI-uyumlu HTTP sağlayıcı.
 *
 * Tek dosya üç senaryoyu birden karşılıyor — hepsi aynı protokolü konuşuyor:
 *   - freellmapi (geliştirme; ücretsiz katmanları tek uca toplar)
 *   - LM Studio / vLLM / llama.cpp server (yerel alternatif)
 *   - ücretli API'ler (üretim; sadece baseUrl + key değişir)
 *
 * Yani "sonra ücretli API'ye geçeriz" adımı bir kod değişikliği değil, bir
 * .env değişikliği.
 *
 * YAPILANDIRILMIŞ ÇIKTI NOTU: freellmapi arkada 29 farklı sağlayıcıya
 * yönlendiriyor ve hepsi katı `json_schema` desteklemiyor. O yüzden
 * varsayılan mod `json_object` + şemayı prompt'a gömmek — her sağlayıcıda
 * çalışır. Uç nokta katı şemayı destekliyorsa OPENAI_STRICT_SCHEMA=1 ile aç.
 */
export class OpenAICompatibleProvider implements LlmProvider {
  readonly name: string

  constructor(
    readonly model: string,
    private readonly baseUrl: string,
    private readonly apiKey: string,
    readonly supportsVision: boolean,
    readonly concurrency: number,
    private readonly strictSchema: boolean,
    label = 'openai',
  ) {
    this.name = label
  }

  async healthcheck(): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (!this.apiKey) {
      return { ok: false, reason: `API anahtarı yok (${this.name}). .env içinde OPENAI_API_KEY doldur.` }
    }
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return { ok: false, reason: `${this.baseUrl}/models → HTTP ${res.status}` }
      return { ok: true }
    } catch (e) {
      return { ok: false, reason: `${this.baseUrl} adresine ulaşılamıyor: ${(e as Error).message}` }
    }
  }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const t0 = Date.now()
    const maxTokens = req.maxTokens ?? 1024

    // Şemayı prompt'a gömüyoruz: katı json_schema'yı desteklemeyen
    // sağlayıcılarda tek güvence bu.
    const schemaHint = this.strictSchema
      ? ''
      : `\n\nYanıtın TAM OLARAK şu JSON şemasına uymalı:\n${JSON.stringify(req.schema)}`

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: maxTokens,
      temperature: req.temperature ?? 0.2,
      ...(req.seed !== undefined ? { seed: req.seed } : {}),
      response_format: this.strictSchema
        ? { type: 'json_schema', json_schema: { name: 'result', schema: req.schema, strict: true } }
        : { type: 'json_object' },
      messages: [
        { role: 'system', content: req.system + schemaHint },
        { role: 'user', content: toContent(req.prefix) },
        { role: 'user', content: req.suffix },
      ],
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5 * 60_000),
    })
    if (!res.ok) {
      throw new Error(`${this.name} ${res.status}: ${(await res.text()).slice(0, 300)}`)
    }

    const data = (await res.json()) as ChatCompletion
    const choice = data.choices?.[0]
    const raw = choice?.message?.content ?? ''

    return {
      json: safeParse(raw),
      raw,
      truncated: choice?.finish_reason === 'length',
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens ?? 0,
        ms: Date.now() - t0,
      },
    }
  }
}

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    prompt_tokens_details?: { cached_tokens?: number }
  }
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

function toContent(blocks: Block[]): string | ContentPart[] {
  const hasImage = blocks.some((b) => b.type === 'image')
  if (!hasImage) {
    return blocks.map((b) => (b.type === 'text' ? b.text : '')).join('\n')
  }
  return blocks.map<ContentPart>((b) =>
    b.type === 'text'
      ? { type: 'text', text: b.text }
      : { type: 'image_url', image_url: { url: `data:${b.mime};base64,${b.base64}` } },
  )
}

function safeParse(s: string): unknown | null {
  try {
    return JSON.parse(s)
  } catch {
    const m = s.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      return JSON.parse(m[0])
    } catch {
      return null
    }
  }
}
