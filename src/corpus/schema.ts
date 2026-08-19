import { z } from 'zod'

/**
 * Rule card şeması. Corpus YAML dosyaları yüklenirken buna karşı doğrulanır —
 * bozuk bir kart sessizce atlanmak yerine hata verir.
 */
export const RuleCardSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9.]+)+$/, 'id kebab-case olmalı'),
  platform: z.enum(['apple', 'google', 'both']),
  source: z.object({
    doc: z.string(),
    section: z.string(),
    url: z.string().url(),
    retrievedAt: z.string(),
  }),
  tags: z.array(z.string()).min(1),
  scope: z.enum(['single', 'cross']),
  needs: z.array(z.string()),
  appliesWhen: z
    .object({
      categories: z.array(z.string()).optional(),
      requiresLogin: z.boolean().optional(),
      generatesAiContent: z.boolean().optional(),
      hasUserGeneratedContent: z.boolean().optional(),
      hasSubscription: z.boolean().optional(),
    })
    .optional(),
  // Kart görsel GÖRMEDEN sorusuna cevap veremiyorsa true.
  // Bu kartlar görsel yokken çalıştırılmaz — çalıştırılırsa model "bulamadım"
  // der, rapor temiz görünür ve konu hiç denetlenmemiş olur.
  requiresVision: z.boolean().optional(),
  prefilter: z.array(z.string()).optional(),
  // Kuralı uygulamak için gereken ama modelin bilmeyebileceği olgular
  // (rakip marka adları, tescilli isimler, kategori terimleri...).
  // Yerel küçük modellerde bu alan olmadan "bilgi" gerektiren kurallar çalışmaz.
  facts: z.array(z.string()).optional(),
  question: z.string().min(10),
  ruleText: z.string().min(20),
  positiveExample: z.string().min(1).optional(),
  // Yalancı alarma karşı en etkili alan — LLM kartlarında zorunlu.
  negativeExample: z.string().min(1).optional(),
  // violation = kesin ihlal (kırmızı)
  // risk      = insan kararı gerekir (sarı)
  // manual    = listing'den GÖRÜLEMEZ; LLM'e hiç gitmez, rapora kontrol
  //             maddesi olarak düşer. Uydurma bulgu üretmeden kapsama sağlar.
  outcome: z.enum(['violation', 'risk', 'manual']),
  defaultSeverity: z.enum(['high', 'medium', 'low']),
  version: z.number().int().positive(),
}).superRefine((card, ctx) => {
  // LLM'e giden kartlarda iki taraflı çapa zorunlu; manual kartlarda anlamsız.
  if (card.outcome === 'manual') return
  for (const field of ['positiveExample', 'negativeExample'] as const) {
    if (!card[field]) {
      ctx.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} zorunlu (outcome: ${card.outcome}). Yalnızca outcome: manual kartlarda boş bırakılabilir.`,
      })
    }
  }
  if (card.needs.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['needs'], message: 'needs boş olamaz (outcome: manual değilse)' })
  }
})

export type RuleCardInput = z.infer<typeof RuleCardSchema>
