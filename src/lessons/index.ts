import type { LessonStore } from './types.js'
import { LocalLessonStore } from './local.js'

export type { Lesson, RejectCase, LessonStore, LessonWithExamples } from './types.js'

/**
 * Depo fabrikası. Varsayılan YEREL — bulut anahtarları olmadan da tüm
 * öğrenme akışı çalışır. GREENLIGHT_STORE=supabase ile buluta geçilir.
 */
export async function createLessonStore(): Promise<LessonStore> {
  const backend = process.env.GREENLIGHT_STORE ?? 'local'

  if (backend === 'supabase' || backend === 'supabase+r2') {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    const bucket = process.env.R2_BUCKET
    const endpoint = process.env.R2_ENDPOINT
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const missing = Object.entries({
      SUPABASE_URL: url, SUPABASE_SERVICE_KEY: key, R2_BUCKET: bucket,
      R2_ENDPOINT: endpoint, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey,
    }).filter(([, v]) => !v).map(([k]) => k)
    if (missing.length) {
      throw new Error(`Eksik ortam değişkeni: ${missing.join(', ')}`)
    }
    const { SupabaseR2Store } = await import('./supabase-r2.js')
    return new SupabaseR2Store(url!, key!, bucket!, {
      endpoint: endpoint!, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!,
    })
  }

  return new LocalLessonStore(process.env.LESSONS_DIR ?? 'lessons')
}
