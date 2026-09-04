import type { Submission, LintFinding } from '../types.js'

/**
 * Gizlilik politikası URL'i ölü olması en sık ve en aptal red sebeplerinden.
 * Tek bir HTTP isteğiyle yakalanır.
 */
export interface UrlCheckOptions {
  /**
   * Adreslerin CANLI olup olmadığı sınansın mı?
   *
   * Tarayıcı içinde (eklenti) ağ erişimi kullanıcı iznine bağlı. İzin yokken
   * sınamaya kalkarsak her fetch düşer ve ÇALIŞAN adresleri "ölü" diye
   * raporlarız — denetim aracı için mümkün olan en kötü hata. İzin yoksa
   * sınamayı atlarız ve çağıran bunu "denetlenmedi" olarak gösterir.
   */
  probe?: boolean
}

export async function checkUrls(sub: Submission, opts: UrlCheckOptions = {}): Promise<LintFinding[]> {
  const probeEnabled = opts.probe !== false
  const out: LintFinding[] = []

  const required: Array<[key: 'privacy' | 'support', label: string, sev: 'high' | 'medium']> = [
    ['privacy', 'Gizlilik politikası', 'high'],
    ['support', 'Destek', 'medium'],
  ]

  for (const [key, label, sev] of required) {
    const url = sub.urls[key]
    if (!url) {
      out.push({
        checkId: `lint-${key}-url-missing`,
        platform: sub.platform,
        severity: 'high',
        artifact: 'urls',
        message: `${label} URL'i tanımlı değil.`,
        suggestedFix: `${label} URL'ini listing'e ekle.`,
      })
      continue
    }
    if (!probeEnabled) continue
    const status = await probe(url)
    if (status === 'unreachable' || (typeof status === 'number' && status >= 400)) {
      out.push({
        checkId: `lint-${key}-url-dead`,
        platform: sub.platform,
        severity: sev,
        artifact: 'urls',
        message: `${label} URL'i erişilemiyor (${status}): ${url}`,
        suggestedFix: `${url} adresini düzelt ya da çalışan bir adresle değiştir.`,
      })
    }
  }

  return out
}

/**
 * Tek deneme yetmiyor: aynı adres arka arkaya koşuda 400 / temiz / unreachable
 * döndü. Yavaş ya da hız sınırlayan sunucuda tek istek raporu koşudan koşuya
 * değiştiriyor — denetim aracının en kötü özelliği tutarsız olmasıdır.
 * Bu yüzden iki deneme, artan bekleme ve daha uzun zaman aşımı.
 */
async function probe(url: string): Promise<number | 'unreachable'> {
  let last: number | 'unreachable' = 'unreachable'
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 1500))
    last = await probeOnce(url)
    // 2xx/3xx kesin sonuç; ağ hatası ve 5xx geçici olabilir, tekrar dene.
    if (typeof last === 'number' && last < 500) return last
  }
  return last
}

async function probeOnce(url: string): Promise<number | 'unreachable'> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  try {
    // Bazı sunucular HEAD'e 405 döner; GET ile teyit et. Bazıları da bot
    // sanıp 400 veriyor — tarayıcı gibi görünmek yanlış alarmı azaltıyor.
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,*/*',
    }
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers })
    if (res.status === 405 || res.status === 501 || res.status === 400) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers })
    }
    return res.status
  } catch {
    return 'unreachable'
  } finally {
    clearTimeout(t)
  }
}
