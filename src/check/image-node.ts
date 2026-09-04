import { readFile } from 'node:fs/promises'
import type { ImageLoader } from './prompt.js'

/**
 * Node tarafının görsel yükleyicisi — dosya sistemi ve disk önbelleği kullanır.
 *
 * NEDEN AYRI DOSYA: `prompt.ts` eklenti paketine de giriyor ve tarayıcıda
 * `node:fs` yok. Burada dursaydı paket derlenmezdi. Tarayıcı sürümü
 * `ext/audit.ts` içinde; ikisi de aynı `ImageLoader` sözleşmesini konuşur.
 */

/**
 * Görsel yükle — yerel dosya ya da URL.
 *
 * App Store Connect ekran görüntülerini dosya olarak değil imzalı URL olarak
 * veriyor. Yalnız readFile yapan sürüm canlı çekimde HER görseli düşürüyordu
 * ve görsel kartları sessizce çalışmıyordu — paywall kuralları dahil.
 *
 * İndirilen görsel out/media/ altına yazılıyor: aynı denetimi tekrar
 * koşturmak 25 MB'ı yeniden çekmesin, ve rapor sonradan da incelenebilsin.
 */
export const nodeImageLoader: ImageLoader = async (path) => {
  const mimeOf = (p: string) => (/\.jpe?g($|\?)/i.test(p) ? 'image/jpeg' : 'image/png')

  if (!/^https?:\/\//i.test(path)) {
    try {
      const buf = await readFile(path)
      return { mime: mimeOf(path), b64: buf.toString('base64') }
    } catch {
      return null
    }
  }

  const { createHash } = await import('node:crypto')
  const { mkdir, writeFile } = await import('node:fs/promises')
  const cacheDir = 'out/media'
  const cachePath = `${cacheDir}/${createHash('sha1').update(path).digest('hex')}.img`
  try {
    const buf = await readFile(cachePath)
    return { mime: mimeOf(path), b64: buf.toString('base64') }
  } catch {
    /* önbellekte yok, indir */
  }
  try {
    const res = await fetch(path, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    await mkdir(cacheDir, { recursive: true })
    await writeFile(cachePath, buf)
    const mime = res.headers.get('content-type')?.split(';')[0]?.trim()
    return { mime: mime?.startsWith('image/') ? mime : mimeOf(path), b64: buf.toString('base64') }
  } catch {
    return null
  }
}
