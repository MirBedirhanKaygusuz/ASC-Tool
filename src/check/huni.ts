/**
 * Kart bazında huni: ham bulgu → alıntı doğrulama → ikinci göz → tekrar eleme.
 *
 * NEDEN VAR. Kural kitabı 25'ten 175 karta çıktı; bulgu üretme şansı yedi
 * katına çıktı. `ground` + `verify` + `dedupe` savunması duruyor ama
 * genişlemeden sonra YALANCI ALARM ORANI yeniden ölçülmedi. `npm run kapsam`
 * "kaçını bilirdik" sorusunu cevaplıyor; bu dosya tersini ölçmenin verisini
 * üretiyor: "kaç tane uydurdu".
 *
 * ARADIĞIMIZ İMZA: çok ham bulgu üretip savunmadan geçemeyen kartlar. Bir kart
 * 12 bulgu üretip 11'i eleniyorsa o kart gürültü kaynağıdır — sorusu geniş,
 * örneği zayıf ya da prefilter'ı yanlış kartı açıyor demektir.
 *
 * BURADA BORU HATTI YOK. Hesap, `runAudit`in zaten ürettiği dizilerden
 * yapılıyor; eval bunu ikinci kez kurmuyor. İki ayrı kopya zamanla ayrışır ve
 * hangisinin doğru olduğu bilinmez (run.ts'in başındaki uyarının aynısı).
 */
import type { Finding, KartHunisi, RuleCard } from '../types.js'

/** Dedupe sonrası ruleId'ler "a + b" diye birleşebiliyor; ikisini de say. */
function kurallar(f: Finding): string[] {
  return f.ruleId.split('+').map((s) => s.trim()).filter(Boolean)
}

function sayIle(findings: Finding[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const f of findings) for (const r of kurallar(f)) m.set(r, (m.get(r) ?? 0) + 1)
  return m
}

function ornek(f: Finding, asama: KartHunisi['elenenOrnekler'][number]['asama']) {
  const oy = f.trace?.verifyVotes
  const yer = f.locator
  return {
    asama,
    excerpt: f.excerpt.replace(/\s+/g, ' ').trim().slice(0, 160),
    rationale: f.rationale.replace(/\s+/g, ' ').trim().slice(0, 160),
    artifact: f.artifact,
    // "text:description", "image:1234", "field:screenshots" — bulgunun neye
    // çapalandığı. Alıntı doğrulamanın neden elediğini bu ayırt ediyor.
    locator:
      yer.type === 'text' ? `text:${yer.field}`
      : yer.type === 'image' ? `image:${yer.mediaId ?? '-'}`
      : yer.type === 'iap' ? `iap:${yer.iapId ?? '-'}`
      : `field:${yer.field}`,
    ...(oy ? { oy: `${oy.agree}/${oy.total}` } : {}),
  }
}

/** Bulgunun ikinci gözde aldığı oy: "2/3". Oy verilmediyse null. */
function oyEtiketi(f: Finding): string | null {
  const v = f.trace?.verifyVotes
  return v ? `${v.agree}/${v.total}` : null
}

export interface HuniGirdisi {
  /** Modelden çıkan ham bulgular. */
  ham: Finding[]
  /** Alıntısı içerikte bulunamadığı için elenenler. */
  alintiDusen: Finding[]
  /** İkinci gözün elediği. */
  ikinciGozDusen: Finding[]
  /** Tekrar elemeden SONRA kalanlar. */
  kalan: Finding[]
  /** Modele giden kartlar — bulgu üretmeyenler de tabloda görünsün diye. */
  kartlar: RuleCard[]
}

export function hesaplaHuni(g: HuniGirdisi): KartHunisi[] {
  const ham = sayIle(g.ham)
  const alinti = sayIle(g.alintiDusen)
  const ikinci = sayIle(g.ikinciGozDusen)
  const kalan = sayIle(g.kalan)

  const bolum = new Map(g.kartlar.map((c) => [c.id, c.source.section]))
  // Bulgu üreten ama seçilenler listesinde olmayan bir kural id'si çıkarsa
  // (dedupe birleşimi ya da ders kaynaklı) onu da tabloya alıyoruz: sessizce
  // düşürmek huninin toplamını bozardı.
  const idler = new Set<string>([...bolum.keys(), ...ham.keys(), ...kalan.keys()])

  const out: KartHunisi[] = []
  for (const ruleId of idler) {
    const h = ham.get(ruleId) ?? 0
    const a = alinti.get(ruleId) ?? 0
    const i = ikinci.get(ruleId) ?? 0
    const k = kalan.get(ruleId) ?? 0
    if (h === 0 && k === 0) continue // hiç bulgu üretmemiş kart: huniye girmez
    const ornekler = [
      ...g.alintiDusen.filter((f) => kurallar(f).includes(ruleId)).slice(0, 2).map((f) => ornek(f, 'alinti')),
      ...g.ikinciGozDusen.filter((f) => kurallar(f).includes(ruleId)).slice(0, 2).map((f) => ornek(f, 'ikinci-goz')),
    ]
    // Oy dağılımı: eşik tartışması için. Hem geçenler hem düşenler sayılıyor —
    // yalnız düşenlere bakmak "eşik gevşetilse ne olurdu" sorusunu
    // cevaplayamaz.
    const oyDagilimi: Record<string, number> = {}
    for (const f of [...g.ikinciGozDusen, ...g.kalan]) {
      if (!kurallar(f).includes(ruleId)) continue
      const oy = oyEtiketi(f)
      if (oy) oyDagilimi[oy] = (oyDagilimi[oy] ?? 0) + 1
    }

    out.push({
      ruleId,
      section: bolum.get(ruleId) ?? '',
      oyDagilimi,
      ham: h,
      alintiDusen: a,
      ikinciGozDusen: i,
      // Ne alıntıdan ne ikinci gözden düşmüş ama sonuçta da yok: tekrar elemesi.
      tekrarDusen: Math.max(0, h - a - i - k),
      kalan: k,
      elenenOrnekler: ornekler,
    })
  }
  // En çok üretip en az geçiren üstte: gürültü sıralaması.
  return out.sort((x, y) => y.ham - y.kalan - (x.ham - x.kalan) || y.ham - x.ham)
}
