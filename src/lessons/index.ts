import type { LessonStore } from './types.js'
import { LocalLessonStore } from './local.js'

export type { Lesson, RejectCase, LessonStore, LessonWithExamples } from './types.js'

/**
 * Depo fabrikası. Varsayılan YEREL — havuz ayağa kalkmadan da tüm öğrenme
 * akışı çalışır. `GREENLIGHT_STORE=havuz` ile ortak havuza geçilir.
 *
 * Yerel depo kaybolmadı ve kaybolmayacak: havuz düştüğünde ya da ağ yokken
 * denetimin tamamen durması, ortak depoya geçmenin kabul edilebilir bedeli
 * değil. Yereli tutmak aynı zamanda `--fixture` koşularını ve testleri ağdan
 * bağımsız tutuyor.
 */
export async function createLessonStore(): Promise<LessonStore> {
  const backend = process.env.GREENLIGHT_STORE ?? 'local'

  if (backend === 'havuz' || backend === 'pool' || backend === 'remote') {
    const url = process.env.HAVUZ_URL
    const token = process.env.HAVUZ_TOKEN
    const eksik = Object.entries({ HAVUZ_URL: url, HAVUZ_TOKEN: token })
      .filter(([, v]) => !v)
      .map(([k]) => k)
    if (eksik.length) {
      throw new Error(
        `Eksik ortam değişkeni: ${eksik.join(', ')}. ` +
          'Havuz kurulumu için: havuz/README.md',
      )
    }
    const { RemoteLessonStore } = await import('./remote.js')
    return new RemoteLessonStore(url!, token!)
  }

  // Supabase+R2 deposu KALDIRILDI. İki dış servise (biri Postgres barındıran
  // bir SaaS, diğeri nesne deposu) bağımlı olmak, kendi Postgres'inde tek
  // tabloyla çözülen bir sorunun bedeliydi. Geçmişi: git log sql/lessons.sql.
  if (backend === 'supabase' || backend === 'supabase+r2') {
    throw new Error(
      'GREENLIGHT_STORE=supabase artık desteklenmiyor. Ortak depo kendi ' +
        'sunucunda koşuyor: GREENLIGHT_STORE=havuz + HAVUZ_URL + HAVUZ_TOKEN. ' +
        'Kurulum: havuz/README.md · Yereldeki dersleri taşımak: npm run lessons -- push',
    )
  }

  return new LocalLessonStore(process.env.LESSONS_DIR ?? 'lessons')
}
