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

  // freellmapi ve her OpenAI-uyumlu uç nokta (LM Studio, vLLM, ücretli API'ler)
  if (backend === 'openai' || backend === 'freellmapi') {
    const { OpenAICompatibleProvider } = await import('./openai-compatible.js')
    const isFree = backend === 'freellmapi'
    return new OpenAICompatibleProvider(
      cfg.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      process.env.OPENAI_BASE_URL ?? (isFree ? 'http://localhost:3001/v1' : 'https://api.openai.com/v1'),
      process.env.OPENAI_API_KEY ?? '',
      process.env.OPENAI_VISION === '1',
      // Uzak uçta paralellik serbest; yerel KV cache kısıtı burada yok.
      Number(process.env.OPENAI_CONCURRENCY ?? 4),
      process.env.OPENAI_STRICT_SCHEMA === '1',
      {
        label: backend,
        // Ortam okuma FABRİKANIN işi. Sağlayıcının içinde process.env
        // okumak, o dosyayı tarayıcı paketine sokulamaz hale getiriyordu.
        imageDetail: (process.env.OPENAI_IMAGE_DETAIL ?? 'low') as 'low' | 'high' | 'auto',
      },
    )
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

  throw new Error(`Bilinmeyen LLM backend: ${backend} (ollama | freellmapi | openai | anthropic)`)
}
