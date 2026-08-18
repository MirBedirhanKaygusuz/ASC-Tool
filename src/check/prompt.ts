import { readFile } from 'node:fs/promises'
import type Anthropic from '@anthropic-ai/sdk'
import type { Submission, RuleCard } from '../types.js'

export const CHECKER_SYSTEM = `Sen bir mağaza politikası denetçisisin. App Store ve Google Play listing'lerini, sana verilen TEK bir politika kuralına karşı denetliyorsun.

Kurallar:
- SADECE sana verilen kuralı uygula. Başka bir politika ihlali görsen bile raporlama.
- Her bulgu için, içerikten BİREBİR alıntı ver. Alıntıyı yeniden yazma, özetleme, düzeltme — kopyala.
- Emin değilsen bulgu üretme. Bu araç yalancı alarm üretirse kimse kullanmaz.
- Kartın "ihlal olmayan örnek" alanı sınırı belirler. Ona benzeyen bir şey ihlal değildir.
- Pazarlama dili tek başına ihlal değildir. İhlal, kuralın açıkça yasakladığı şeydir.
- İhlal yoksa boş liste döndür. Bu normal ve beklenen bir sonuçtur.`

const FINDING_SCHEMA = {
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
          artifact: {
            type: 'string',
            description: "Bulgunun geldiği alan: description, subtitle, keywords, screenshots, iap ...",
          },
          mediaId: { type: 'string', description: 'artifact=screenshots ise ekran görüntüsü id' },
          iapId: { type: 'string', description: 'artifact=iap ise abonelik paketi id' },
          excerpt: { type: 'string', description: 'İçerikten BİREBİR alıntı' },
          rationale: { type: 'string', description: 'Neden bu kuralı ihlal ediyor — 1-2 cümle' },
          suggestedFix: { type: 'string', description: 'Somut düzeltme önerisi' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
} as const

export const OUTPUT_CONFIG = {
  effort: 'high' as const,
  format: { type: 'json_schema' as const, schema: FINDING_SCHEMA },
}

/**
 * Submission bloğu — SABİT. Her kural çağrısında aynı. Sonuna cache_control
 * koyduğumuz için bir kez yazılır, N kural çağrısında ucuza okunur.
 */
export async function submissionBlocks(
  sub: Submission,
): Promise<Anthropic.ContentBlockParam[]> {
  const blocks: Anthropic.ContentBlockParam[] = [
    { type: 'text', text: renderSubmissionText(sub) },
  ]

  for (const shot of sub.media.screenshots) {
    const img = await loadImage(shot.path)
    if (!img) continue
    blocks.push({ type: 'text', text: `[Ekran görüntüsü id=${shot.id} sıra=${shot.order}]` })
    blocks.push({ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.b64 } })
  }

  // Cache breakpoint: buraya kadar her çağrıda aynı.
  const last = blocks[blocks.length - 1]
  if (last) (last as { cache_control?: unknown }).cache_control = { type: 'ephemeral' }

  return blocks
}

export function renderSubmissionText(sub: Submission): string {
  const t = sub.text
  const lines: string[] = [
    `# DENETLENECEK LISTING`,
    `Platform: ${sub.platform}`,
    `Uygulama: ${sub.appName} (${sub.appId})`,
    `Kategori: ${sub.category} | Yaş sınıfı: ${sub.ageRating} | Dil: ${sub.locale}`,
    ``,
    `## Metin alanları`,
  ]
  for (const [k, v] of Object.entries(t)) {
    if (v) lines.push(`### ${k}\n${v}\n`)
  }

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

/** Kural bloğu — DEĞİŞKEN. Cache breakpoint'inden sonra gelir. */
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
    `Yalnızca yukarıdaki kurala göre değerlendir. İhlal yoksa boş liste döndür.`,
  ].join('\n')
}

async function loadImage(path: string): Promise<{ mime: 'image/png' | 'image/jpeg'; b64: string } | null> {
  try {
    const buf = await readFile(path)
    const mime = path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' : 'image/png'
    return { mime, b64: buf.toString('base64') }
  } catch {
    return null // görsel dosyası yoksa sessizce atla — iskelet fixture ile de çalışsın
  }
}
