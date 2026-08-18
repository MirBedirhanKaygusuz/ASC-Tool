/**
 * LLM sağlayıcı arayüzü.
 *
 * Case'de model seçimi "yerel tercih, gerekirse bulut" olarak bırakılmış.
 * O yüzden model bir DETAY — boru hattı bu arayüzü konuşur, altındaki motor
 * değişebilir. Üç sebeple:
 *   1. Yerel model varsayılan (maliyet).
 *   2. Vision'da yerel modeller zayıf; case hibrit'e izin veriyor.
 *   3. Aynı eval'i iki motorla koşup "yerel ne kaybettiriyor" sorusunu
 *      veriyle cevaplayabilmek için.
 */

export type Block =
  | { type: 'text'; text: string }
  | { type: 'image'; mime: string; base64: string }

export interface LlmRequest {
  system: string
  /**
   * SABİT ön ek — her çağrıda birebir aynı olmalı.
   * Yerel motorlarda KV cache'in yeniden kullanılmasını, bulutta prompt
   * cache'i sağlayan şey bu. Değişken içerik buraya KONMAZ.
   */
  prefix: Block[]
  /** DEĞİŞKEN son ek — kural kartı buraya gelir. */
  suffix: string
  /** Çıktının uyacağı JSON schema. */
  schema: Record<string, unknown>
  maxTokens?: number
  /** Denetimde 0 (deterministik); doğrulama oylamasında >0 olmalı. */
  temperature?: number
  seed?: number
}

export interface LlmUsage {
  inputTokens: number
  outputTokens: number
  /** Prefill'den kaçınılan token — yerelde KV cache, bulutta prompt cache. */
  cachedTokens: number
  ms: number
}

export interface LlmResponse {
  json: unknown | null
  raw: string
  /** Çıktı bütçesi tükendiği için yanıt yarıda kesildi mi? */
  truncated?: boolean
  usage: LlmUsage
}

export interface LlmProvider {
  name: string
  model: string
  supportsVision: boolean
  /**
   * Kaç çağrı aynı anda yapılabilir.
   * Yerelde 1 OLMALI: paralel istekler hem tek GPU için yarışır hem de
   * KV cache prefix'ini birbirine kırdırır — yavaşlatır, hızlandırmaz.
   */
  concurrency: number
  complete(req: LlmRequest): Promise<LlmResponse>
  /** Motor ayakta ve model yüklü mü? */
  healthcheck(): Promise<{ ok: true } | { ok: false; reason: string }>
}
