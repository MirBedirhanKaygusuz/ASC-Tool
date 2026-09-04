/**
 * Yalancı alarm ölçümü — "kaç tane uydurdu".
 *
 * `coverage.ts` işin bir yarısını ölçüyor: "yediğim redlerin kaçını bilirdik".
 * Bu dosya ötekini: kural kitabı 25'ten 175 karta çıkınca bulgu üretme şansı
 * yedi katına çıktı, savunma (alıntı doğrulama + ikinci göz + tekrar eleme)
 * aynı kaldı. Genişlemeden sonra gürültünün ne olduğu ÖLÇÜLMEDİ.
 *
 * ═══ ÇIKAN SAYIYI NASIL OKUMALI ═══
 * Bu bir "yalancı alarm oranı" DEĞİL, örneklemin oranı. Elde iki gerçek anlık
 * görüntü varsa ve ikisi de AI-foto uygulamasıysa çıkan sayı "AI-foto
 * uygulamalarında" geçerlidir. Rapor bunu her seferinde yazıyor; sen de
 * yazmadan bu sayıyı kimseye gösterme.
 *
 * Ayrıca eleme oranı ≠ hata oranı: elenen bulgu SAVUNMANIN ÇALIŞTIĞINI
 * gösterir. Asıl aradığımız imza, çok üretip hiç geçiremeyen KARTLAR — onlar
 * gürültü kaynağı; ve savunmayı geçip yine de yanlış olanlar, ki onları
 * yalnız insan görebilir (bu yüzden örnek alıntılar kayda giriyor).
 */
import type { AppMeta, KartHunisi, Submission } from '../types.js'
import { META_FIELDS } from '../meta-fields.js'

export interface OrneklemSatiri {
  appId: string
  appName: string
  category: string
  metinUzunlugu: number
  ekran: number
  iap: number
  kaynak: string
  /** Kural seçimini belirleyen beyanlar — örneklemin ORTAK özelliğini görmek için. */
  meta: AppMeta
  /** Örneklem için sorunlu ise sebebi. */
  uyari?: string
}

export interface KartSatiri extends KartHunisi {
  /** Bu kartın bulgu ürettiği uygulamalar. */
  uygulamalar: string[]
}

export interface YalanciAlarmKosusu {
  tarih: string
  corpusVersion: string
  model: string
  ornekler: OrneklemSatiri[]
  toplam: { ham: number; alintiDusen: number; ikinciGozDusen: number; tekrarDusen: number; kalan: number }
  kartlar: KartSatiri[]
  uyarilar: string[]
}

/**
 * Bir listing örnekleme uygun mu?
 *
 * Kırpılmış test artefaktları (fixtures/) oranı SİSTEMATİK olarak iyi
 * gösteriyor: model uyduracak metin bulamıyor. Ölçümü onunla yapmak, aracın
 * kendi testine bakıp "yalancı alarm yok" demek olur.
 */
export function ornekUyarisi(sub: Submission, kaynak: string): string | undefined {
  const uzunluk = Object.values(sub.text).filter(Boolean).join(' ').length
  if (/fixtures\//.test(kaynak)) {
    return 'birim test artefaktı (fixtures/) — kırpılmış metin oranı iyimser gösterir'
  }
  if (uzunluk < 1500) {
    return `metin yalnız ${uzunluk} karakter — gerçek bir listing'in altında, oran iyimser çıkar`
  }
  if (!sub.media.screenshots.length) return 'ekran görüntüsü yok — görsel kartlar hiç çalışmaz'
  return undefined
}

export function ornekSatiri(sub: Submission, kaynak: string): OrneklemSatiri {
  return {
    appId: sub.appId,
    appName: sub.appName,
    category: sub.category,
    metinUzunlugu: Object.values(sub.text).filter(Boolean).join(' ').length,
    ekran: sub.media.screenshots.length,
    iap: sub.iap.length,
    kaynak,
    meta: sub.meta,
    uyari: ornekUyarisi(sub, kaynak),
  }
}

/** Örneklem ne kadar dar? Sayıyı okuyanın bilmesi gereken tek şey bu. */
export function orneklemUyarilari(ornekler: OrneklemSatiri[]): string[] {
  const out: string[] = []
  for (const o of ornekler) if (o.uyari) out.push(`${o.appName}: ${o.uyari}`)

  // Kategori tek başına yetmiyor: iki uygulama "Photo & Video" ve "Lifestyle"
  // olabilir ama İKİSİ DE AI görsel üreten uygulamadır. Örneklemin gerçek
  // ortak özelliği beyanlarda görünüyor.
  const ortak = META_FIELDS.filter((f) => ornekler.every((o) => o.meta[f.key] === true))
  if (ornekler.length > 1 && ortak.length) {
    out.push(
      `Örneklemdeki uygulamaların TAMAMI şu özelliklere sahip: ${ortak.map((f) => f.label).join(', ')}. ` +
        'Çıkan sayı genel bir oran değil, bu profildeki uygulamalar için geçerlidir.',
    )
  }

  const kategoriler = [...new Set(ornekler.map((o) => o.category).filter(Boolean))]
  if (ornekler.length > 1 && kategoriler.length === 1) {
    out.push(
      `Örneklemin tamamı tek kategoriden ("${kategoriler[0]}"). Çıkan sayı genel bir ` +
        'yalancı alarm oranı DEĞİL, bu tür uygulamalarda geçerli bir orandır.',
    )
  }
  if (ornekler.length < 3) {
    out.push(`Örneklem ${ornekler.length} listing — tek bir listing'in tuhaflığı sayıyı taşır.`)
  }
  return out
}

/** Aynı kartın birden çok listing'deki hunisini topla. */
export function birlestirHuni(
  kosular: Array<{ app: string; huni: KartHunisi[] }>,
): KartSatiri[] {
  const m = new Map<string, KartSatiri>()
  for (const { app, huni } of kosular) {
    for (const h of huni) {
      const v = m.get(h.ruleId) ?? {
        ...h, ham: 0, alintiDusen: 0, ikinciGozDusen: 0, tekrarDusen: 0, kalan: 0,
        elenenOrnekler: [], uygulamalar: [], oyDagilimi: {},
      }
      v.ham += h.ham
      v.alintiDusen += h.alintiDusen
      v.ikinciGozDusen += h.ikinciGozDusen
      v.tekrarDusen += h.tekrarDusen
      v.kalan += h.kalan
      // Örnekleri kart başına ikiyle sınırlıyoruz: kayıt dosyası okunabilir
      // kalsın, tam liste zaten out/report-<app>.json içinde.
      v.elenenOrnekler = [...v.elenenOrnekler, ...h.elenenOrnekler].slice(0, 4)
      for (const [oy, n] of Object.entries(h.oyDagilimi ?? {})) {
        v.oyDagilimi[oy] = (v.oyDagilimi[oy] ?? 0) + n
      }
      if (!v.uygulamalar.includes(app)) v.uygulamalar.push(app)
      m.set(h.ruleId, v)
    }
  }
  // Gürültü sıralaması: en çok üretip en az geçiren üstte.
  return [...m.values()].sort((a, b) => b.ham - b.kalan - (a.ham - a.kalan) || b.ham - a.ham)
}

export function toplamHuni(kartlar: KartSatiri[]): YalanciAlarmKosusu['toplam'] {
  return kartlar.reduce(
    (t, k) => ({
      ham: t.ham + k.ham,
      alintiDusen: t.alintiDusen + k.alintiDusen,
      ikinciGozDusen: t.ikinciGozDusen + k.ikinciGozDusen,
      tekrarDusen: t.tekrarDusen + k.tekrarDusen,
      kalan: t.kalan + k.kalan,
    }),
    { ham: 0, alintiDusen: 0, ikinciGozDusen: 0, tekrarDusen: 0, kalan: 0 },
  )
}

/**
 * Savunmadan hiç geçemeyen kartlar. Aradığımız imza bu: soru geniş, örnek
 * zayıf ya da prefilter kartı yanlış yerde açıyor demektir.
 */
/**
 * "Eşik farklı olsaydı ne olurdu" — yeni model çağrısı yapmadan.
 *
 * Eşik 2/3 seçildi ve hiç ölçülmedi. Mercekler farklılaştıktan sonra doğru
 * eşiğin değişmiş olması muhtemel; bu fonksiyon kayıttaki oy dağılımından
 * cevabı çıkarıyor.
 */
export function esikSenaryolari(kartlar: KartSatiri[]): Array<{ esik: number; gecen: number }> {
  const dagilim: Record<string, number> = {}
  for (const k of kartlar) {
    for (const [oy, n] of Object.entries(k.oyDagilimi ?? {})) dagilim[oy] = (dagilim[oy] ?? 0) + n
  }
  const kayitlar = Object.entries(dagilim).map(([oy, n]) => {
    const [a, t] = oy.split('/').map(Number)
    return { agree: a ?? 0, total: t ?? 3, n }
  })
  const toplam = kayitlar.reduce((s, k) => s + k.n, 0)
  if (!toplam) return []
  const maks = Math.max(...kayitlar.map((k) => k.total))
  return Array.from({ length: maks }, (_, i) => i + 1).map((esik) => ({
    esik,
    gecen: kayitlar.filter((k) => k.agree >= esik).reduce((s, k) => s + k.n, 0),
  }))
}

export function gurultuAdaylari(kartlar: KartSatiri[], esik = 2): KartSatiri[] {
  return kartlar.filter((k) => k.ham >= esik && k.kalan === 0)
}

export interface Fark {
  ruleId: string
  oncekiHam: number
  simdikiHam: number
  oncekiKalan: number
  simdikiKalan: number
  /** 'yeni' | 'kayboldu' | 'arttı' | 'azaldı' */
  yon: 'yeni' | 'kayboldu' | 'artti' | 'azaldi'
}

/**
 * İki koşuyu karşılaştır. Tek seferlik sayı bir şey söylemiyor; kart
 * eklendikçe gürültünün nereye gittiği söylüyor.
 */
export function karsilastir(onceki: YalanciAlarmKosusu, simdiki: YalanciAlarmKosusu): Fark[] {
  const eski = new Map(onceki.kartlar.map((k) => [k.ruleId, k]))
  const yeni = new Map(simdiki.kartlar.map((k) => [k.ruleId, k]))
  const out: Fark[] = []
  for (const id of new Set([...eski.keys(), ...yeni.keys()])) {
    const a = eski.get(id)
    const b = yeni.get(id)
    const oncekiHam = a?.ham ?? 0
    const simdikiHam = b?.ham ?? 0
    if (oncekiHam === simdikiHam && (a?.kalan ?? 0) === (b?.kalan ?? 0)) continue
    out.push({
      ruleId: id,
      oncekiHam,
      simdikiHam,
      oncekiKalan: a?.kalan ?? 0,
      simdikiKalan: b?.kalan ?? 0,
      yon: !a ? 'yeni' : !b ? 'kayboldu' : simdikiHam > oncekiHam ? 'artti' : 'azaldi',
    })
  }
  return out.sort((x, y) => Math.abs(y.simdikiHam - y.oncekiHam) - Math.abs(x.simdikiHam - x.oncekiHam))
}
