import type { Submission, LintFinding } from '../types.js'
import { gonderilmemis } from '../check/select.js'

/**
 * Ürün durumu ve deneme vaadi — Guideline 2.1(b).
 *
 * Bu dosyadaki iki kontrol de bu hesapta GERÇEKLEŞMİŞ redlerden çıktı:
 *   - "the app includes references to yearly but the associated In-App
 *     Purchase products have not been submitted for review" (iki kez)
 *   - "the free trial was not present in the sandbox paywall" — ürün adı
 *     "Weekly Pack (Trial)" ama tanımlı 175 teklifin hiçbiri FREE_TRIAL değil
 *
 * İkisinin de verisi aylardır çekiliyordu; kimse bakmıyordu.
 */

export interface DurumSonuc {
  bulgular: LintFinding[]
  denetlenmedi: string[]
}

/** Ürün adı ya da kimliği listing metninde geçiyor mu? */
function metindeGeciyor(sub: Submission, id: string, ad: string): boolean {
  const havuz = Object.values(sub.text).filter(Boolean).join('\n').toLowerCase()
  const parcalar = [ad, id.split('.').pop() ?? ''].filter((x) => x && x.length > 3)
  return parcalar.some((p) => havuz.includes(p.toLowerCase()))
}

export function checkIapState(sub: Submission): DurumSonuc {
  const d = sub.declarations
  if (!d?.urunDurumlari) {
    return {
      bulgular: [],
      denetlenmedi: [
        'Ürünlerin gönderim durumu çekilmedi — 2.1(b) "IAP incelemeye gönderilmemiş" ' +
          'denetlenmedi. Bu, bu hesapta en son yaşanan red sebebi.',
      ],
    }
  }

  const bulgular: LintFinding[] = []
  const gecmis21 = (d.gecmisRedler ?? []).some((r) => r.madde.startsWith('2.1'))

  for (const u of d.urunDurumlari) {
    if (!gonderilmemis(u)) continue
    const ad = sub.iap.find((i) => i.id === u.id)?.name ?? u.id
    const anilan = metindeGeciyor(sub, u.id, ad)
    bulgular.push({
      checkId: 'lint-iap-not-submitted',
      platform: sub.platform,
      severity: anilan ? 'high' : 'medium',
      artifact: 'iap',
      message:
        `"${ad}" (${u.id}) ürünü ${u.durum} durumunda ve "sonraki sürümle gönder" işaretli değil.` +
        (anilan ? ' Listing metni bu üründen söz ediyor.' : '') +
        (u.reviewNote ? ' Ürünün inceleme notu dolu — gönderim adımı eksik kalmış olabilir.' : '') +
        (gecmis21 ? ' Bu uygulama daha önce tam bu sebeple 2.1 altında reddedildi.' : ''),
      suggestedFix:
        'App Store Connect > Uygulama İçi Satın Almalar > ürün > inceleme ekran görüntüsü ve ' +
        'notunu ekle, "sonraki sürümle gönder" işaretle, yeni binary yükle.',
    })
  }
  return { bulgular, denetlenmedi: [] }
}

/**
 * Deneme iddiası var ama tanımlı teklif yok.
 *
 * DİKKAT — bu, buradaki en yüksek yalancı alarm riskli kontrol:
 * promosyon kodu (Offer Code) ile verilen deneme bu veride görünmüyor.
 * Bu yüzden mesaj kendi karşı-örneğini yazıyor; kullanıcı iki saniyede
 * eleyebilsin.
 */
const DENEME_IDDIASI =
  /\b(free trial|ücretsiz deneme|try (it )?free|\d+[- ](day|gün) free|ilk (hafta|ay) ücretsiz)\b/i

export function checkTrialClaim(sub: Submission): DurumSonuc {
  const abonelikler = sub.iap.filter((i) => i.kind === 'subscription')
  if (!abonelikler.length) return { bulgular: [], denetlenmedi: [] }

  const tanimliDeneme = abonelikler.some((i) => i.freeTrial)
  if (tanimliDeneme) return { bulgular: [], denetlenmedi: [] }

  const metin = Object.entries(sub.text).filter(([, v]) => v)
  const metinIddia = metin.find(([, v]) => DENEME_IDDIASI.test(String(v)))
  const adIddia = abonelikler.find((i) => /\btrial\b|deneme/i.test(i.name))

  if (!metinIddia && !adIddia) return { bulgular: [], denetlenmedi: [] }

  const kanit = adIddia
    ? `"${adIddia.name}" ürünü adında deneme vaat ediyor`
    : `${metinIddia![0]} alanında ücretsiz deneme vaat ediliyor`

  return {
    bulgular: [{
      checkId: 'lint-trial-claimed-but-no-offer',
      platform: sub.platform,
      severity: adIddia ? 'high' : 'medium',
      artifact: 'iap',
      message:
        `${kanit} ama hiçbir abonelikte tanımlı ücretsiz deneme (FREE_TRIAL) yok. ` +
        'App Review ödeme ekranında denemeyi göremezse 2.1(b) altında reddediyor.',
      suggestedFix:
        'Abonelike tanıtım teklifi (Introductory Offer → Free Trial) tanımla ya da ' +
        'metinden/ürün adından deneme vaadini kaldır. ' +
        'Not: promosyon koduyla (Offer Code) verilen deneme bu veride görünmez — ' +
        'deneme öyle veriliyorsa bu uyarıyı yok say.',
    }],
    denetlenmedi: [],
  }
}
