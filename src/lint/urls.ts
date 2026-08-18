import type { Submission, LintFinding } from '../types.js'

/**
 * Gizlilik politikası URL'i ölü olması en sık ve en aptal red sebeplerinden.
 * Tek bir HTTP isteğiyle yakalanır.
 */
export async function checkUrls(sub: Submission): Promise<LintFinding[]> {
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

async function probe(url: string): Promise<number | 'unreachable'> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    // Bazı sunucular HEAD'e 405 döner; GET ile teyit et.
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal })
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal })
    }
    clearTimeout(t)
    return res.status
  } catch {
    return 'unreachable'
  }
}
