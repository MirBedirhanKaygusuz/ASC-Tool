import { readFile } from 'node:fs/promises'
import type { Submission, RuleCard } from '../types.js'
import type { Block } from '../llm/index.js'

export const CHECKER_SYSTEM = `Sen bir mağaza politikası denetçisisin. App Store ve Google Play listing'lerini, sana verilen TEK bir politika kuralına karşı denetliyorsun.

Kurallar:
- SADECE sana verilen kuralı uygula. Başka bir politika ihlali görsen bile raporlama.
- Her bulgu için, içerikten BİREBİR alıntı ver. Alıntıyı yeniden yazma, özetleme, düzeltme — kopyala.
- Emin değilsen bulgu üretme. Bu araç yalancı alarm üretirse kimse kullanmaz.
- Kartın "ihlal olmayan örnek" alanı sınırı belirler. Ona benzeyen bir şey ihlal değildir.
- Pazarlama dili tek başına ihlal değildir. İhlal, kuralın açıkça yasakladığı şeydir.
- İhlal yoksa boş liste döndür. Bu normal ve beklenen bir sonuçtur.
- Yalnızca JSON döndür. Açıklama, önsöz, markdown yok.`

export const FINDINGS_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['artifact', 'excerpt', 'rationale', 'suggestedFix', 'severity'],
        properties: {
          artifact: { type: 'string', description: 'description | subtitle | keywords | screenshots | iap ...' },
          mediaId: { type: 'string' },
          iapId: { type: 'string' },
          excerpt: { type: 'string', description: 'İçerikten BİREBİR alıntı' },
          rationale: { type: 'string' },
          suggestedFix: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
}

export const VERDICT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['violates', 'reason'],
  properties: {
    violates: { type: 'boolean' },
    reason: { type: 'string' },
  },
}

/**
 * SABİT ön ek. Her kural çağrısında birebir aynı olmalı — yerelde KV cache,
 * bulutta prompt cache buna dayanır. Buraya değişken hiçbir şey konmaz
 * (timestamp, sıra numarası, rastgele id yok).
 */
export async function submissionPrefix(
  sub: Submission,
  opts: { withImages: boolean },
): Promise<Block[]> {
  const blocks: Block[] = [{ type: 'text', text: renderSubmissionText(sub) }]

  if (opts.withImages) {
    for (const shot of sub.media.screenshots) {
      const img = await loadImage(shot.path)
      if (!img) continue
      blocks.push({ type: 'text', text: `[Ekran görüntüsü id=${shot.id} sıra=${shot.order}]` })
      blocks.push({ type: 'image', mime: img.mime, base64: img.b64 })
    }
  }

  return blocks
}

export function renderSubmissionText(sub: Submission): string {
  const lines: string[] = [
    `# DENETLENECEK LISTING`,
    `Platform: ${sub.platform}`,
    `Uygulama: ${sub.appName} (${sub.appId})`,
    `Kategori: ${sub.category} | Yaş sınıfı: ${sub.ageRating} | Dil: ${sub.locale}`,
    ``,
    `## Metin alanları`,
  ]
  for (const [k, v] of Object.entries(sub.text)) if (v) lines.push(`### ${k}\n${v}\n`)

  if (sub.iap.length) {
    lines.push(`## Uygulama içi satın alma / abonelikler`)
    for (const i of sub.iap) {
      const trial = i.freeTrial ? ` | ücretsiz deneme: ${i.freeTrial.duration}` : ''
      const dur = i.duration ? ` | dönem: ${i.duration}` : ''
      lines.push(`- id=${i.id} [${i.kind}] "${i.name}" — ${i.price} ${i.currency}${dur}${trial}`)
      if (i.description) lines.push(`  açıklama: ${i.description}`)
    }
    lines.push('')
  }

  lines.push(`## URL'ler`)
  for (const [k, v] of Object.entries(sub.urls)) if (v) lines.push(`- ${k}: ${v}`)
  lines.push('')
  lines.push(`## Review notları`)
  lines.push(sub.reviewNotes.notes ?? '(yok)')
  lines.push(`Demo hesap: ${sub.reviewNotes.demoAccount ? 'var' : 'YOK'}`)

  return lines.join('\n')
}

/** DEĞİŞKEN son ek — cache sınırından sonra gelen tek şey. */
export function renderRuleCard(card: RuleCard): string {
  return [
    `# UYGULANACAK KURAL`,
    ``,
    `Kural id: ${card.id}`,
    `Kaynak: ${card.source.doc} ${card.source.section}`,
    ``,
    `## Kural`,
    card.ruleText.trim(),
    ``,
    `## Sana sorulan`,
    card.question.trim(),
    ``,
    `## İhlal SAYILAN örnek`,
    card.positiveExample,
    ``,
    `## İhlal SAYILMAYAN örnek`,
    card.negativeExample,
    ``,
    `Yalnızca yukarıdaki kurala göre değerlendir. İhlal yoksa {"findings": []} döndür.`,
  ].join('\n')
}

async function loadImage(path: string): Promise<{ mime: string; b64: string } | null> {
  try {
    const buf = await readFile(path)
    const mime = /\.jpe?g$/i.test(path) ? 'image/jpeg' : 'image/png'
    return { mime, b64: buf.toString('base64') }
  } catch {
    return null
  }
}
