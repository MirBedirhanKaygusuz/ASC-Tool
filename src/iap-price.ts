/**
 * IAP fiyatını ilişki zincirinden çöz — TEK gerçeklik.
 *
 * NEDEN AYRI DOSYA: aynı zinciri üç yerde bilmek gerekiyor.
 *   - Toplayıcı (extension/src/collector.js, ASC sekmesinde koşar) bilmeli:
 *     "ürün listesinin include'u fiyatı GERÇEKTEN getirdi mi, yoksa ürün
 *     başına ayrı istek atmalı mıyım?"
 *   - Eşleyici (submission-from-dump.ts, görüntüleyicide koşar) bilmeli:
 *     "elimdeki dökümden bu ürünün fiyatı ne?"
 *
 * İki ayrı kopya yazsaydık en kötü hata biçimi doğardı: toplayıcı "fiyat
 * geldi" deyip istek atmaz, eşleyici aynı veriden fiyatı okuyamaz ve rapor
 * her ürüne sessizce 0 yazardı. Tam olarak bu oldu (2026-08-21). Bu yüzden
 * dosya TypeScript'te durur, esbuild ile iki paket için de derlenir.
 *
 * ZİNCİR: ürün → iapPriceSchedule → manualPrices[] → inAppPurchasePricePoint
 *         → attributes.customerPrice
 * Apple sürüme göre bazı halkaları atlayabiliyor; her halkada "burada fiyat
 * var mı?" diye bakıyoruz, ama HAVUZDAN RASTGELE fiyat almıyoruz — havuzda
 * tüm ürünlerin fiyatı karışık duruyor, "ilkini al" demek yanlış ürüne
 * yanlış fiyat yazmaktır.
 */

export interface Resource {
  id?: string
  type?: string
  attributes?: Record<string, any>
  relationships?: Record<string, { data?: any }>
}

export interface IapPrice {
  price: number
  currency: string
}

const attrs = (r: any): Record<string, any> => r?.attributes ?? {}

function asPrice(node: any): IapPrice | null {
  const raw = Number(attrs(node).customerPrice)
  if (!Number.isFinite(raw)) return null
  return { price: raw, currency: String(attrs(node).currency ?? '') }
}

/**
 * Ürünün fiyatını, ürün listesiyle birlikte gelen `included` havuzundan çöz.
 *
 * `null` dönmesi "fiyat yok" demek DEĞİL, "buradan okunamadı" demek. Çağıran
 * ya ayrı istek atar (toplayıcı) ya da "okunamadı" der (eşleyici). İkisi de
 * sessizce 0 yazmaz.
 */
export function priceFromPool(product: Resource, pool: readonly Resource[]): IapPrice | null {
  const byId = (id?: string) => (id ? pool.find((r) => r.id === id) : undefined)

  const sched = byId(product?.relationships?.iapPriceSchedule?.data?.id)
  if (!sched) return null

  const refs = (sched.relationships?.manualPrices?.data ??
    sched.relationships?.automaticPrices?.data ??
    []) as Array<{ id: string }>

  for (const ref of refs) {
    const fiyat = byId(ref?.id)
    const point = byId(fiyat?.relationships?.inAppPurchasePricePoint?.data?.id)
    const found = (point && asPrice(point)) || (fiyat && asPrice(fiyat))
    if (found) return found
  }
  return null
}

/**
 * Ürün başına ayrıca çekilmiş fiyat çizelgesinden oku.
 *
 * Burada havuzda TEK ürünün verisi var, dolayısıyla `customerPrice` taşıyan
 * ilk kaydı almak güvenli — karışacak başka ürün yok.
 */
export function priceFromSchedule(row: { data?: Resource[]; included?: Resource[] } | undefined): IapPrice | null {
  if (!row) return null
  const point = (row.included ?? []).find((r) => attrs(r).customerPrice !== undefined)
  return point ? asPrice(point) : null
}

// ---------------------------------------------------------------------------
// Hangi fiyat kaydı BUGÜN geçerli?
// ---------------------------------------------------------------------------

/**
 * Apple bir ürün için birden çok fiyat kaydı döndürüyor. "İlkini al" demek
 * yanlış fiyat yazmak demek — 2026-08-21'de tam bu oldu: Weekly Pack raporda
 * 5.99 göründü, App Store'da 14.99'du.
 *
 * İki tuzak:
 *   preserved:true → ESKİ abonelere korunan fiyat. Yeni müşteri onu ödemiyor,
 *     App Review de onu görmüyor. Denetimin konusu yeni müşterinin gördüğü
 *     fiyat olduğu için bunları eliyoruz.
 *   startDate      → ileri tarihli fiyat değişikliği olabilir. Henüz
 *     yürürlükte olmayan rakamı "şu anki fiyat" diye yazamayız.
 *
 * Uygun kayıt yoksa null döner; çağıran "okunamadı" der. Eldeki herhangi bir
 * rakamı yazmak, sessiz veri bozulmasının ta kendisi olurdu.
 */
export function pickCurrentPrice(
  records: readonly Resource[],
  bugun = new Date().toISOString().slice(0, 10),
): { record: Resource; note?: string } | null {
  const yeniMusteri = records.filter((r) => r.attributes?.preserved !== true)
  const havuz = yeniMusteri.length ? yeniMusteri : records
  const not = yeniMusteri.length
    ? undefined
    : 'yalnız korunmuş (preserved) fiyat var — yeni müşterinin göreceği fiyat bu olmayabilir'

  const tarih = (r: Resource) => String(r.attributes?.startDate ?? '')
  // startDate boş = "başından beri geçerli"; en yeni yürürlük tarihi kazanır.
  const yururlukte = havuz
    .filter((r) => !tarih(r) || tarih(r) <= bugun)
    .sort((a, b) => tarih(b).localeCompare(tarih(a)))
  if (yururlukte[0]) return { record: yururlukte[0], note: not }

  const gelecek = havuz.slice().sort((a, b) => tarih(a).localeCompare(tarih(b)))
  if (!gelecek[0]) return null
  return {
    record: gelecek[0],
    note: `bu fiyat ${tarih(gelecek[0])} tarihinde yürürlüğe giriyor — bugün geçerli fiyat kaydı yok`,
  }
}

/**
 * Fiyat kaydı listesinden müşteri fiyatını çöz.
 *
 * Fiyat noktası havuzdan RASTGELE seçilmiyor: seçilen kaydın kendi ilişkisi
 * izleniyor. Havuzda hem korunmuş hem güncel fiyatın noktası duruyor;
 * "ilkini al" demek eski fiyatı yazmak oluyordu.
 */
export function priceFromRecords(
  records: readonly Resource[],
  included: readonly Resource[],
  relName: string,
  bugun?: string,
): (IapPrice & { note?: string }) | null {
  const secim = pickCurrentPrice(records, bugun)
  if (!secim) return null
  const id = secim.record.relationships?.[relName]?.data?.id
  const point = id ? included.find((r) => r.id === id) : undefined
  const fiyat = asPrice(point)
  return fiyat ? { ...fiyat, note: secim.note } : null
}
