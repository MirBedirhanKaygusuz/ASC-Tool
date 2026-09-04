import type { Finding, RuleCard, Submission } from '../types.js'
import type { LlmProvider } from '../llm/index.js'
import { VERDICT_SCHEMA, renderFacts, renderNotViolation } from './prompt.js'

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
 *
 * ÜÇ OY, ÜÇ AYRI SORU — ölçümden çıkan değişiklik.
 *
 * İlk sürümde üç oy AYNI prompt'un üç örneklemesiydi. Sahada (5 listing,
 * gpt-4o-mini) savunmanın %66'sı bu adımdan geliyordu; yani yalancı alarm
 * savunmasının tamamına yakını, tek bir modelin kendisiyle anlaşmazlığa
 * düşmesine dayanıyordu. Aynı soruyu üç kez sormak korele hata üretir: model
 * bir muafiyeti kaçırıyorsa üçünde de kaçırır, bir bulguyu yanlış öldürüyorsa
 * üçünde de öldürür.
 *
 * Artık her oy FARKLI BİR MERCEKTEN bakıyor: biri kuralın yasağına, biri
 * muafiyete (tersinden), biri de "reviewer bunu red sebebi yapar mıydı"
 * testine. Model aynı model; sorular farklı olduğu için hatalar daha az
 * korele. Bu, model değiştirmeden yapılabilecek en doğrudan müdahale.
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

/**
 * Üç mercek. Hepsi aynı şemayı (violates) dolduruyor, dolayısıyla oylama
 * mantığı değişmiyor — değişen, modele hangi soruyu sorduğumuz.
 *
 * İkincisi bilerek TERSİNDEN soruyor: ölçümde modelin muafiyeti "ihlal mi?"
 * diye sorulduğunda atladığı, ama doğrudan "muafiyete giriyor mu?" diye
 * sorulduğunda görebildiği kalıbı hedefliyor.
 */
const MERCEKLER = [
  'Bu içerik yukarıdaki kuralı ihlal ediyor mu? Kuralın AÇIKÇA yasakladığı şey mi?',

  'ÖNCE MUAFİYETE BAK: bu içerik, "ihlal SAYILMAYAN örnek" ya da "BULGU ÜRETME" ' +
    'listesindeki durumlardan birine giriyor mu? Giriyorsa violates=false döndür. ' +
    'Yalnızca hiçbirine girmiyorsa ve kural açıkça yasaklıyorsa violates=true döndür.',

  'App Review bu içeriği gördüğünde bunu tek başına bir RED sebebi yapar mıydı? ' +
    'Sıradan pazarlama dili ya da uygulamanın ne yaptığını anlatan ifade red sebebi ' +
    'değildir. Emin değilsen violates=false döndür.',
]

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
    ...renderNotViolation(rule),
    `## Değerlendirilecek içerik`,
    `Alan: ${f.artifact}`,
    `İçerik: "${f.excerpt}"`,
    ``,
    `## Bağlam`,
    contextFor(sub, f),
    ``,
    MERCEKLER[vote % MERCEKLER.length]!,
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
