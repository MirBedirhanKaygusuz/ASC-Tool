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
  needs: z.array(z.string()).min(1),
  appliesWhen: z
    .object({
      categories: z.array(z.string()).optional(),
      requiresLogin: z.boolean().optional(),
      generatesAiContent: z.boolean().optional(),
      hasUserGeneratedContent: z.boolean().optional(),
      hasSubscription: z.boolean().optional(),
    })
    .optional(),
  prefilter: z.array(z.string()).optional(),
  // Kuralı uygulamak için gereken ama modelin bilmeyebileceği olgular
  // (rakip marka adları, tescilli isimler, kategori terimleri...).
  // Yerel küçük modellerde bu alan olmadan "bilgi" gerektiren kurallar çalışmaz.
  facts: z.array(z.string()).optional(),
  question: z.string().min(20),
  ruleText: z.string().min(20),
  positiveExample: z.string().min(1),
  // Yalancı alarma karşı en etkili alan — zorunlu tutuyoruz.
  negativeExample: z.string().min(1),
  outcome: z.enum(['violation', 'risk']),
  defaultSeverity: z.enum(['high', 'medium', 'low']),
  version: z.number().int().positive(),
})

export type RuleCardInput = z.infer<typeof RuleCardSchema>
