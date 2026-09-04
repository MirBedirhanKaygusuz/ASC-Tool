import type { Submission, LintFinding } from '../types.js'
import type { DurumSonuc } from './iap-state.js'

/**
 * Cihaz ailesi ↔ ekran görüntüsü ve denetim KAPSAMI.
 *
 * İkisi de "ihlal" değil "tutarsızlık/eksiklik" sınıfı. Ama ikisi de bu
 * hesapta gerçekleşmiş redlerin doğrudan çevresinde:
 *   - Apple her iki reddi de `Review Device: iPad Air 11-inch` üzerinde aldı,
 *     oysa build yalnız IPHONE destekliyordu ve iPad görselleri yüklüydü.
 *   - İki reddin ikisi de ÖZEL ÜRÜN SAYFASI üzerinden geldi; o sayfaların
 *     içeriği bu denetime hiç girmiyor.
 */

const IPAD_SINIFI = /ipad/i

export function checkDeviceFamilies(sub: Submission): DurumSonuc {
  const b = sub.declarations?.build
  if (!b) {
    return {
      bulgular: [],
      denetlenmedi: [
        'Build cihaz aileleri okunamadı — ekran görüntüsü/cihaz tutarlılığı denetlenmedi.',
      ],
    }
  }
  if (!b.cihazAileleri.length) {
    return {
      bulgular: [],
      denetlenmedi: [`Build (${b.kaynak}) cihaz ailesi bilgisi taşımıyor — tutarlılık denetlenmedi.`],
    }
  }

  const sinifi = (s: { deviceClass?: string }) => s.deviceClass ?? ''
  const ipadGorsel = sub.media.screenshots.filter((s) => IPAD_SINIFI.test(sinifi(s)))
  const ipadDestek = b.cihazAileleri.some((f) => /IPAD/i.test(f))

  const bulgular: LintFinding[] = []
  if (!ipadDestek && ipadGorsel.length) {
    bulgular.push({
      checkId: 'lint-screenshots-vs-devicefamilies',
      platform: sub.platform,
      severity: 'medium',
      artifact: 'screenshots',
      message:
        `Build yalnız ${b.cihazAileleri.join('/')} destekliyor (${b.kaynak}), buna rağmen ` +
        `${ipadGorsel.length} iPad ekran görüntüsü yüklü. App Review uygulamayı iPad'de ` +
        'ölçeklenmiş modda test ediyor ve iPad görselini uygulamayla eşleştiremiyor.',
      suggestedFix:
        'iPad görsellerini kaldır ya da build\'i iPad desteğiyle yeniden yükle.',
    })
  }
  if (ipadDestek && !ipadGorsel.length && sub.media.screenshots.length) {
    bulgular.push({
      checkId: 'lint-devicefamily-without-screenshots',
      platform: sub.platform,
      severity: 'low',
      artifact: 'screenshots',
      message: `Build iPad destekliyor (${b.kaynak}) ama iPad ekran görüntüsü yok.`,
      suggestedFix: 'iPad ekran görüntüsü ekle; Apple o cihazda inceleyebiliyor.',
    })
  }
  return { bulgular, denetlenmedi: [] }
}

/**
 * Kapsam boşluğu: özel ürün sayfaları denetlenmiyor.
 *
 * İhlal değil ama SKORDA GÖRÜNMESİ gereken bir eksiklik. "Ana listing temiz"
 * demek, o sayfaların temiz olduğu anlamına gelmiyor — bu hesabın iki reddi
 * tam oradan geldi.
 */
export function checkCoverage(sub: Submission): DurumSonuc {
  const sayfalar = sub.declarations?.ozelSayfalar
  if (!sayfalar?.length) return { bulgular: [], denetlenmedi: [] }

  const denetlenmemis = sayfalar.filter((s) => !s.icerikCekildi)
  if (!denetlenmemis.length) return { bulgular: [], denetlenmedi: [] }

  return {
    bulgular: [{
      checkId: 'lint-custom-page-not-audited',
      platform: sub.platform,
      severity: 'medium',
      artifact: 'screenshots',
      message:
        `${denetlenmemis.length} özel ürün sayfası var ` +
        `(${denetlenmemis.slice(0, 4).map((s) => s.ad).join(', ')}${denetlenmemis.length > 4 ? ' …' : ''}) ` +
        've içerikleri bu denetime dahil değil. Apple bu sayfaları da inceliyor: ' +
        'bu uygulamanın 5.2.1 ve 2.3.3 redlerinin ikisi de özel ürün sayfası üzerinden geldi.',
      suggestedFix:
        'Özel ürün sayfalarının metin ve görsellerini elle gözden geçir; ana listing ' +
        'için geçerli kuralların hepsi onlar için de geçerli.',
    }],
    denetlenmedi: [],
  }
}
