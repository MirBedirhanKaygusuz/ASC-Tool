import type { Finding, RuleCard, Submission } from '../types.js'
import type { LlmProvider } from '../llm/index.js'
import { VERDICT_SCHEMA, renderFacts } from './prompt.js'

const VOTES = 3
const THRESHOLD = 2

/**
 * İkinci göz — asimetrik doğrulama.
 *
 * Doğrulayıcı ilk denetçinin GEREKÇESİNİ görmez — gerekçeyi görseydi ona
 * demirler (anchoring) ve yalancı alarmı elemek yerine onaylardı.
 *
 * Ama KURALIN KENDİSİNİ tamamen görür: soru, iki taraflı örnek ve olgular.
 * İlk sürümde bunları da kısmıştık; ölçünce doğrulayıcının gerçek ihlalleri
 * elediği görüldü — asimetri yalancı alarmı değil, doğru bulguyu kesiyordu.
 * Asimetri promptun yönünde kalmalı, kuralın eksikliğinde değil.
 *
 * YEREL MODELE ÖZEL: 3 oy ancak sıcaklık > 0 ise anlamlı. temperature 0'da
 * üç oy da birebir aynı çıkar ve oylama tamamen boşa gider — o yüzden her oy
 * farklı seed ve sıcaklık > 0 ile alınır.
 */
export async function verifyFindings(
  llm: LlmProvider,
  sub: Submission,
  findings: Finding[],
  rulesById: Map<string, RuleCard>,
): Promise<{ kept: Finding[]; dropped: Finding[] }> {
  const kept: Finding[] = []
  const dropped: Finding[] = []

  for (const f of findings) {
    const rule = rulesById.get(f.ruleId)
    if (!rule) continue

    let agree = 0
    for (let i = 0; i < VOTES; i++) {
      if (await askOne(llm, sub, f, rule, i)) agree++
    }

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

const VERIFIER_SYSTEM =
  'Sen bir politika hakemisin. Sana bir kural ve bir içerik parçası verilir; ' +
  'içeriğin o kuralı ihlal edip etmediğine karar verirsin.\n' +
  'İki örneğe de bak: içerik "ihlal sayılan" örneğe benziyorsa violates=true, ' +
  '"ihlal sayılmayan" örneğe benziyorsa violates=false.\n' +
  'Sana verilen olguları doğru kabul et; kendi hafızandan doğrulamaya çalışma.\n' +
  'Hiçbir örneğe benzemiyorsa ve kural açıkça yasaklamıyorsa violates=false.\n' +
  'Yalnızca JSON döndür.'

async function askOne(
  llm: LlmProvider,
  sub: Submission,
  f: Finding,
  rule: RuleCard,
  vote: number,
): Promise<boolean> {
  const prompt = [
    `## Kural`,
    rule.ruleText.trim(),
    ``,
    `## Bu kural neyi sorguluyor`,
    rule.question.trim(),
    ``,
    ...renderFacts(rule),
    `## İhlal SAYILAN örnek`,
    rule.positiveExample,
    ``,
    `## İhlal SAYILMAYAN örnek`,
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
  ].join('\n')

  const res = await llm.complete({
    system: VERIFIER_SYSTEM,
    // Doğrulamada ortak prefix yok — bilerek. Her bulgu dar bir pencereyle
    // tek başına yargılanır; tüm listing'i görseydi ilk turu tekrar ederdi.
    prefix: [{ type: 'text', text: prompt }],
    suffix: 'Kararını ver.',
    schema: VERDICT_SCHEMA,
    maxTokens: 512,
    temperature: 0.5,
    seed: 1000 + vote,
  })

  const parsed = res.json as { violates?: boolean } | null
  return parsed?.violates === true
}

function contextFor(sub: Submission, f: Finding): string {
  if (f.locator.type !== 'text') return '(görsel/alan bulgusu — ek bağlam yok)'
  const field = sub.text[f.locator.field]
  if (!field) return '(bağlam bulunamadı)'
  const idx = field.indexOf(f.excerpt)
  if (idx < 0) return field.slice(0, 400)
  return field.slice(Math.max(0, idx - 200), idx + f.excerpt.length + 200)
}
