import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Submission } from '../types.js'
import { META_KEYS, type AppMeta } from '../meta-fields.js'

/**
 * Uygulama başına elle girilen bilgiler.
 *
 * NEDEN AYRI BİR DEPO: `meta` alanları kural seçimini belirliyor
 * (bkz. check/select.ts) ama App Store Connect API'si bunları söylemiyor —
 * "bu uygulama AI ile içerik üretiyor mu" diye bir alan yok. Bilinmediğinde
 * ilgili kartlar SESSİZCE eleniyordu: raporda "bakılmadı" bile yazmıyordu.
 *
 * Dosya biçimi kasıtlı olarak sade: ileride bunu düzenleyen bir arayüz
 * yazılacak ve aynı dosyalara yazacak. Terminal ile UI aynı depoyu paylaşsın.
 */

const DIR = 'apps'

// Alanların kendisi src/meta-fields.ts'te: tanım, sınır durumları, hangi
// kartları açtığı ve komut satırı bayrağı tek yerde dursun diye. Burası
// yalnızca onları DİSKE yazan katman.
export type { AppMeta }

export interface AppConfig {
  appId: string
  appName?: string
  meta: AppMeta
  updatedAt?: string
}

export { META_KEYS }

function pathFor(appId: string): string {
  return join(DIR, `${appId}.json`)
}

export async function loadAppConfig(appId: string): Promise<AppConfig | null> {
  try {
    return JSON.parse(await readFile(pathFor(appId), 'utf8')) as AppConfig
  } catch {
    return null
  }
}

export async function saveAppConfig(config: AppConfig): Promise<string> {
  await mkdir(DIR, { recursive: true })
  const path = pathFor(config.appId)
  const body = { ...config, updatedAt: new Date().toISOString() }
  await writeFile(path, JSON.stringify(body, null, 2) + '\n')
  return path
}

export async function listAppConfigs(): Promise<AppConfig[]> {
  try {
    const entries = await readdir(DIR, { withFileTypes: true })
    const files = entries.filter((e) => e.isFile() && e.name.endsWith('.json'))
    return Promise.all(
      files.map(async (f) => JSON.parse(await readFile(join(DIR, f.name), 'utf8')) as AppConfig),
    )
  } catch {
    return []
  }
}

/**
 * Üç kaynağı birleştirir; sonrakiler öncekini ezer:
 *   1. API'den çıkarılan (ör. demo hesap zorunluysa requiresLogin)
 *   2. apps/{id}.json
 *   3. komut satırı bayrakları
 *
 * Hangi değerin nereden geldiğini de döndürüyoruz: sessiz varsayım bu
 * boru hattında en pahalı hata türü, kaynağı raporlanabilir olsun.
 */
export function mergeMeta(
  fromApi: Submission['meta'],
  fromFile: AppMeta | undefined,
  fromFlags: AppMeta,
): { meta: Submission['meta']; sources: Record<string, 'api' | 'dosya' | 'bayrak' | 'bilinmiyor'> } {
  const meta: Submission['meta'] = { ...fromApi }
  const sources: Record<string, 'api' | 'dosya' | 'bayrak' | 'bilinmiyor'> = {}

  for (const key of META_KEYS) {
    let source: 'api' | 'dosya' | 'bayrak' | 'bilinmiyor' = 'bilinmiyor'
    if (fromApi[key] !== undefined) source = 'api'
    if (fromFile?.[key] !== undefined) {
      meta[key] = fromFile[key]
      source = 'dosya'
    }
    if (fromFlags[key] !== undefined) {
      meta[key] = fromFlags[key]
      source = 'bayrak'
    }
    sources[key] = meta[key] === undefined ? 'bilinmiyor' : source
  }
  return { meta, sources }
}
