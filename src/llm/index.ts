import type { LlmProvider } from './types.js'
import { OllamaProvider } from './ollama.js'

export type { LlmProvider, LlmRequest, LlmResponse, Block } from './types.js'

export interface LlmConfig {
  /** ollama (varsayılan) | anthropic */
  backend?: string
  model?: string
  host?: string
  numCtx?: number
  vision?: boolean
  think?: boolean
}

/**
 * Sağlayıcı fabrikası. Varsayılan YEREL.
 * Ortam değişkenleriyle .env'den yönetilir — kodda model adı sabitlenmiş değil.
 */
export async function createProvider(cfg: LlmConfig = {}): Promise<LlmProvider> {
  const backend = cfg.backend ?? process.env.GREENLIGHT_LLM ?? 'ollama'

  if (backend === 'anthropic') {
    // Bulut yolu sadece istendiğinde yüklenir — SDK yoksa yerel yol bozulmaz.
    const { AnthropicProvider } = await import('./anthropic.js')
    return new AnthropicProvider(cfg.model ?? process.env.GREENLIGHT_CLOUD_MODEL ?? 'claude-opus-5')
  }

  if (backend === 'ollama') {
    return new OllamaProvider(
      cfg.model ?? process.env.OLLAMA_MODEL ?? 'qwen3:8b',
      cfg.host ?? process.env.OLLAMA_HOST ?? 'http://localhost:11434',
      cfg.numCtx ?? Number(process.env.OLLAMA_NUM_CTX ?? 32768),
      cfg.vision ?? process.env.OLLAMA_VISION === '1',
      cfg.think ?? process.env.OLLAMA_THINK === '1',
    )
  }

  throw new Error(`Bilinmeyen LLM backend: ${backend} (ollama | anthropic)`)
}
