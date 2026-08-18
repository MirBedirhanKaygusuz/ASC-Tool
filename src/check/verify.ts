import Anthropic from '@anthropic-ai/sdk'
import type { Finding, RuleCard, Submission } from '../types.js'

const MODEL = 'claude-opus-5'
const VOTES = 3
const THRESHOLD = 2 // 3 oyun en az 2'si "ihlal" derse tut

/**
 * İkinci göz — asimetrik doğrulama turu.
 *
 * TASARIM KARARI: doğrulayıcı, ilk denetçinin GEREKÇESİNİ GÖRMEZ.
 * Sadece kuralı ve şüpheli alıntıyı görür. Gerekçeyi görseydi ona demirlerdi
 * (anchoring) ve yalancı alarmı elemek yerine onaylardı.
 *
 * Ayrıca güven skoru modelin kendi beyanı DEĞİL — oyların uyuşma oranı.
 * LLM'lerin self-reported confidence'ı kalibre değildir.
 */
export async function verifyFindings(
  sub: Submission,
  findings: Finding[],
  rulesById: Map<string, RuleCard>,
): Promise<{ kept: Finding[]; dropped: Finding[] }> {
  const client = new Anthropic()
  const kept: Finding[] = []
  const dropped: Finding[] = []

  for (const f of findings) {
    const rule = rulesById.get(f.ruleId)
    if (!rule) continue

    const votes = await Promise.all(
      Array.from({ length: VOTES }, () => askOne(client, sub, f, rule)),
    )
    const agree = votes.filter(Boolean).length
    const decorated: Finding = {
      ...f,
      confidence: agree / VOTES,
      trace: { ...f.trace, verifyVotes: { agree, total: VOTES } },
    }
    if (agree >= THRESHOLD) kept.push(decorated)
    else dropped.push(decorated)
  }

  return { kept, dropped }
}

async function askOne(
  client: Anthropic,
  sub: Submission,
  f: Finding,
  rule: RuleCard,
): Promise<boolean> {
  const prompt = [
    `## Kural`,
    rule.ruleText.trim(),
    ``,
    `## Bu kurala göre İHLAL SAYILMAYAN bir örnek`,
    rule.negativeExample,
    ``,
    `## Değerlendirilecek içerik`,
    `Alan: ${f.artifact}`,
    `İçerik: "${f.excerpt}"`,
    ``,
    `## Bağlam`,
    contextFor(sub, f),
    ``,
    `Bu içerik yukarıdaki kuralı ihlal ediyor mu?`,
    `Emin değilsen "hayır" de. Sadece kuralın açıkça yasakladığı bir şey varsa "evet" de.`,
  ].join('\n')

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'low',
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['violates', 'reason'],
          properties: {
            violates: { type: 'boolean' },
            reason: { type: 'string' },
          },
        },
      },
    },
    system:
      'Sen bir politika hakemisin. Varsayılan cevabın "ihlal değil"dir. ' +
      'Yalnızca kuralın açıkça yasakladığı bir durum varsa ihlal dersin. ' +
      'Şüphe ihlal lehine değil, aleyhine yorumlanır.',
    messages: [{ role: 'user', content: prompt }],
  })

  const text = res.content.find((b) => b.type === 'text')
  if (!text || text.type !== 'text') return false
  try {
    return JSON.parse(text.text).violates === true
  } catch {
    return false
  }
}

/** Alıntının etrafından dar bir pencere — tüm listing'i vermiyoruz, bilerek. */
function contextFor(sub: Submission, f: Finding): string {
  if (f.locator.type !== 'text') return '(görsel/alan bulgusu — ek bağlam yok)'
  const field = sub.text[f.locator.field]
  if (!field) return '(bağlam bulunamadı)'
  const idx = field.indexOf(f.excerpt)
  if (idx < 0) return field.slice(0, 400)
  return field.slice(Math.max(0, idx - 200), idx + f.excerpt.length + 200)
}
