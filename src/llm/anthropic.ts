import Anthropic from '@anthropic-ai/sdk'
import type { LlmProvider, LlmRequest, LlmResponse, Block } from './types.js'

/**
 * Bulut sağlayıcı — VARSAYILAN DEĞİL.
 *
 * Case yerel modeli tercih ediyor. Bu dosya iki iş için duruyor:
 *   1. Vision: yerel görsel modelleri ekran görüntüsündeki ince yazıyı
 *      okumakta zayıf. Case "gerekirse bulut vision" diyor — hibrit için.
 *   2. Kalite tavanı: aynı eval'i buluttla bir kez koşup "yerel model ne
 *      kadar kaybettiriyor" sorusunu tahminle değil ölçümle cevaplamak için.
 *
 * Anahtar yoksa hiç devreye girmez; boru hattı yerel motorla tam çalışır.
 */
export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic'
  readonly supportsVision = true
  readonly concurrency = 4

  private client = new Anthropic()

  constructor(readonly model: string) {}

  async healthcheck(): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { ok: false, reason: 'ANTHROPIC_API_KEY tanımlı değil' }
    }
    return { ok: true }
  }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const t0 = Date.now()

    const prefix: Anthropic.ContentBlockParam[] = req.prefix.map((b) =>
      b.type === 'text'
        ? { type: 'text', text: b.text }
        : {
            type: 'image',
            source: { type: 'base64', media_type: b.mime as 'image/png', data: b.base64 },
          },
    )
    // Sabit prefix'in sonuna cache işareti: bir kez yazılır, N kural okur.
    const last = prefix[prefix.length - 1]
    if (last) (last as { cache_control?: unknown }).cache_control = { type: 'ephemeral' }

    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 4000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'high',
        format: { type: 'json_schema', schema: req.schema },
      },
      system: req.system,
      messages: [
        { role: 'user', content: prefix },
        { role: 'user', content: req.suffix },
      ],
    })

    const text = res.content.find((b) => b.type === 'text')
    const raw = text && text.type === 'text' ? text.text : ''

    return {
      json: raw ? safeParse(raw) : null,
      raw,
      usage: {
        inputTokens: res.usage.input_tokens ?? 0,
        outputTokens: res.usage.output_tokens ?? 0,
        cachedTokens: res.usage.cache_read_input_tokens ?? 0,
        ms: Date.now() - t0,
      },
    }
  }
}

function safeParse(s: string): unknown | null {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}
