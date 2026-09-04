import type { Submission, LintFinding } from '../types.js'
import type { DurumSonuc } from './iap-state.js'

/**
 * Beyan ↔ metin çelişkileri.
 *
 * Bu kontrollerin ortak mantığı şu: Apple'a BEYAN ettiğin şeyle kullanıcıya
 * SÖYLEDİĞİN şey çelişiyorsa, hangisinin yalan olduğunu Apple da sorar.
 * İkisi de elimizde olduğu için bu, modele sorulacak bir şey değil —
 * kesin cevaplı bir karşılaştırma.
 */

/**
 * "Takip etmiyoruz" diyen metin + takip beyanı.
 *
 * Kalıplar bilerek DAR: açık olumsuzlama arıyoruz. "secure", "private",
 * "gizliliğinize önem veriyoruz" gibi pazarlama dili tetiklemez — o dil
 * ihlal değil ve tetiklerse bu kontrol çöp kutusuna gider.
 */
const TAKIP_INKARI =
  /\b(no tracking|we (do not|don'?t) track|not track(ed|ing)? (you|users)|zero tracking|hiçbir veri toplam[ıi]yoruz|veri(leriniz)? topla(n)?m[ıi]yor|takip etmiyoruz|sizi izlemiyoruz)\b/i

const ANONIM_IDDIASI =
  /\b(fully anonymous|completely anonymous|tamamen anonim|kimliğiniz(le)? ilişkilendirilmez|anonim olarak saklan)\b/i

export function checkPrivacyClaims(sub: Submission): DurumSonuc {
  const p = sub.declarations?.privacy
  if (!p) {
    return {
      bulgular: [],
      denetlenmedi: [
        'App Privacy etiketi çekilmedi — metindeki gizlilik iddiaları beyanla ' +
          'karşılaştırılamadı (5.1.1) ve takip beyanı okunamadı (5.1.2).',
      ],
    }
  }

  const bulgular: LintFinding[] = []
  const alanlar = Object.entries(sub.text).filter(([, v]) => v) as Array<[string, string]>

  if (p.takip) {
    const takipSatiri = p.satirlar.find((s) => s.koruma === 'DATA_USED_TO_TRACK_YOU')
    for (const [alan, metin] of alanlar) {
      const m = TAKIP_INKARI.exec(metin)
      if (!m) continue
      bulgular.push({
        checkId: 'lint-att-claim-contradiction',
        platform: sub.platform,
        severity: 'high',
        artifact: alan as LintFinding['artifact'],
        message:
          `Metin "${m[0]}" diyor, ama App Privacy beyanında ` +
          `${takipSatiri?.kategori ?? 'bir veri türü'} → DATA_USED_TO_TRACK_YOU satırı var. ` +
          'Apple beyanla metni birlikte okuyor.',
        suggestedFix:
          'Ya metindeki iddiayı düzelt, ya App Privacy beyanındaki takip satırını ' +
          'kaldır. İkisinin aynı anda doğru olması mümkün değil.',
      })
      break // Tek bulgu yeter; her alan için tekrarlamak raporu şişirir.
    }
  }

  if (p.kimlikleBagli) {
    for (const [alan, metin] of alanlar) {
      const m = ANONIM_IDDIASI.exec(metin)
      if (!m) continue
      bulgular.push({
        checkId: 'lint-anonymity-claim-contradiction',
        platform: sub.platform,
        severity: 'medium',
        artifact: alan as LintFinding['artifact'],
        message:
          `Metin "${m[0]}" diyor, ama App Privacy beyanında veriler ` +
          'DATA_LINKED_TO_YOU (kimlikle bağlı) olarak işaretlenmiş.',
        suggestedFix: 'Anonimlik iddiasını beyanla uyumlu hale getir.',
      })
      break
    }
  }

  return { bulgular, denetlenmedi: [] }
}

/**
 * Yaş beyanı ↔ mağaza sınıfı — Guideline 1.1.
 *
 * Apple'ın derecelendirme motorunu yeniden yazmıyoruz; yalnız kesin olan üç
 * çelişkiye bakıyoruz. Eşikler Apple'ın kendi alanlarından geliyor, muhakeme
 * yok — o yüzden bu lint, kart değil.
 */
const ICERIK_SINYALLERI = [
  'sexualContentOrNudity', 'sexualContentGraphicAndNudity', 'matureOrSuggestiveThemes',
  'violenceRealistic', 'violenceRealisticProlongedGraphicOrSadistic',
  'alcoholTobaccoOrDrugUseOrReferences', 'gamblingSimulated', 'horrorOrFearThemes',
  'profanityOrCrudeHumor',
]
const DUSUK_SINIF = /^(4\+|9\+)$/

export function checkAgeDeclaration(sub: Submission): DurumSonuc {
  const a = sub.declarations?.age
  if (!a) {
    return {
      bulgular: [],
      denetlenmedi: ['Yaş sınırı beyanı okunamadı — 1.1 yaş tutarlılığı denetlenmedi.'],
    }
  }

  const bulgular: LintFinding[] = []
  const sinif = sub.ageRating

  if (a.sinyaller.userGeneratedContent && DUSUK_SINIF.test(sinif)) {
    bulgular.push({
      checkId: 'lint-age-declaration-ugc',
      platform: sub.platform,
      severity: 'high',
      artifact: 'ageRating',
      message:
        `Yaş beyanında "kullanıcı içeriği var" işaretli ama mağaza sınıfı ${sinif}. ` +
        'Denetimsiz kullanıcı içeriği bu sınıfta kabul edilmiyor.',
      suggestedFix: 'Yaş sınıfını yükselt ya da içerik denetimi/şikâyet akışını beyan et.',
    })
  }

  const isaretli = ICERIK_SINYALLERI.filter((k) => a.sinyaller[k])
  if (isaretli.length && DUSUK_SINIF.test(sinif)) {
    bulgular.push({
      checkId: 'lint-age-declaration-content',
      platform: sub.platform,
      severity: 'high',
      artifact: 'ageRating',
      message:
        `Yaş beyanında içerik işaretli (${isaretli.map((k) => `${k}=${a.sinyaller[k]}`).join(', ')}) ` +
        `ama mağaza sınıfı ${sinif}.`,
      suggestedFix: 'Beyanı düzelt ya da yaş sınıfını içeriğe uygun seviyeye çıkar.',
    })
  }

  if (a.sinyaller.gambling && !/^(17\+|18\+)$/.test(sinif)) {
    bulgular.push({
      checkId: 'lint-age-declaration-gambling',
      platform: sub.platform,
      severity: 'high',
      artifact: 'ageRating',
      message: `Gerçek kumar beyan edilmiş ama mağaza sınıfı ${sinif}. Apple bunu 17+/18+ istiyor.`,
      suggestedFix: 'Yaş sınıfını yükselt; kumar ayrıca 5.3 altında ek belge isteyebilir.',
    })
  }

  // İki beyan (sürüm bazlı / uygulama bazlı) çelişiyorsa: eşleyici sürüm
  // bazlıyı kullanıyor, ama hangisinin geçerli olduğunu kullanıcı bilmeli.
  if (a.surumFarki?.length) {
    bulgular.push({
      checkId: 'lint-age-declaration-drift',
      platform: sub.platform,
      severity: 'low',
      artifact: 'ageRating',
      message:
        `Sürüm bazlı yaş beyanı uygulama bazlıdan farklı: ${a.surumFarki.join(', ')}. ` +
        'Denetim sürüm bazlıyı kullandı.',
      suggestedFix: 'App Store Connect\'te hangisinin geçerli olduğunu doğrula.',
    })
  }

  // TUZAK — bilerek tetiklemiyoruz: `ustunKilma` mağaza sınıfından DÜŞÜK
  // olabilir. Apple beyandan hesapladığı sınıfı üstün kılmadan yüksek tutuyor;
  // "beyan 16+, mağaza 17+" bir çelişki değil, normal davranış.

  return { bulgular, denetlenmedi: [] }
}
