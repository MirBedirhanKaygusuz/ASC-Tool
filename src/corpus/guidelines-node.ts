/**
 * Yönerge metinlerini diskten oku — YALNIZCA Node tarafı.
 *
 * `guidelines.ts` ayrıştırma ve aramayı tutar ve eklenti paketine de girer;
 * oraya `node:fs` sızarsa paket tarayıcıda sessizce patlar (build-ext bu
 * sızıntıyı zaten hata sayıyor). Diskle konuşan tek yer burası.
 */
import { readFile } from 'node:fs/promises'
import { GUIDELINES_PATH, type GuidelineDoc } from './guidelines.js'

let cached: GuidelineDoc | null = null

export async function loadGuidelines(path = GUIDELINES_PATH): Promise<GuidelineDoc> {
  if (cached && path === GUIDELINES_PATH) return cached
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    throw new Error(
      `Yönerge metni yok: ${path}. "npm run guidelines" ile çek. ` +
        'Denetim onsuz da koşar ama Apple\'ın kendi madde metni modele gitmez.',
    )
  }
  const doc = JSON.parse(raw) as GuidelineDoc
  if (path === GUIDELINES_PATH) cached = doc
  return doc
}
