/**
 * Ham JSON:API dökümünü sade, okunabilir, denetime hazır kayda çevir.
 *
 * NEDEN VAR: Apple'ın yanıtı bir TAŞIMA biçimi, veri modeli değil. Ölçtük —
 * 704 KB'lik bir çekimin %76'sı zarf: her kaydın altında `links.self` ve
 * `links.related` çiftleri, yalnız adres taşıyan boş `relationships` blokları,
 * ve sahibinden ayrı duran `included` havuzları. Denetim bunların hiçbirini
 * okumuyor; okuduğu şey `included`'ın İÇİNDEKİ değer.
 *
 * NEREDE ÇALIŞIR: iki yerde, aynı kod.
 *   - Toplayıcıda, `put()` sınırında → depoya sade kayıt yazılır (`sema: 2`).
 *   - Görüntüleyicide, okuma anında → eski (`sema: 1`) kayıtlar yeniden çekim
 *     GEREKMEDEN aynı şekle gelir.
 * Bu yüzden idempotent olmak zorunda: `norm(norm(x)) === norm(x)`.
 *
 * SAF VE MUTASYONSUZ OLMAK ZORUNDA: toplayıcı gezinirken CANLI kayıttan
 * `relationships[x].links.related` okuyor (`relPath`). Kaydı yerinde
 * değiştirirsek yol uydurmaya döneriz — kanaryadaki 404'lerin sebebi buydu.
 *
 * NE ATILIR, NE KALIR:
 *   atılır → `links`, yalnız adres taşıyan ilişkiler, `null`/boş değerler
 *   KALIR  → `false` ve `"NONE"`. Bunlar "beyan edildi, içerik yok" demek;
 *            atarsak "beyan edilmemiş" ile ayırt edemeyiz ve yaş tutarlılık
 *            kontrolü sessizce "temiz" der. Okunabilirlik depoda değil,
 *            raporda çözülür.
 */
import { priceFromPool, priceFromSchedule, type Resource } from '../iap-price.js'

/** Depoya yazılan kayıt biçiminin sürümü. `meta.sema` olarak satıra gider. */
export const SEMA = 2

export interface NormalizeSonuc {
  data: unknown
  /** Çekim günlüğüne düşecek notlar — sessiz dönüşüm yok. */
  notlar: string[]
}

type Kayit = Record<string, any>

const nesne = (v: unknown): v is Kayit => !!v && typeof v === 'object' && !Array.isArray(v)

/**
 * Bu, Apple'dan gelen HAM bir kayıt mı?
 *
 * Idempotency kapısı: normalleştirilmiş kayıtta `attributes`/`links`/
 * `relationships` anahtarları bulunmaz. Okuma anında normalleştirme buna
 * dayanıyor — iki kez uygulanınca veri bozulmamalı.
 */
export function hamKayit(v: unknown): boolean {
  return nesne(v) && ('attributes' in v || 'links' in v || 'relationships' in v)
}

export function isNormalized(v: unknown): boolean {
  if (Array.isArray(v)) return !v.some(hamKayit)
  return !hamKayit(v)
}

/** `null`, `''`, `[]`, `{}` boştur. `false` ve `0` DEĞİLDİR. */
const bos = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  v === '' ||
  (Array.isArray(v) && v.length === 0) ||
  (nesne(v) && Object.keys(v).length === 0)

/** İlişkiden yalnız kimlik: tekilse string, çoğulsa dizi, adres yoksa yok. */
function iliskiDegeri(rel: any): string | string[] | undefined {
  const d = rel?.data
  if (!d) return undefined
  if (Array.isArray(d)) return d.map((x) => String(x?.id ?? '')).filter(Boolean)
  return d.id ? String(d.id) : undefined
}

export interface KayitSecenek {
  /**
   * Yalnız adres taşıyan ilişkilerin ADLARI da saklansın mı?
   *
   * `apps` kaydında saklıyoruz: o liste Apple'ın açtığı uçların haritası ve
   * yeni bir ad çıkması "yeni uç açıldı" demek (R2). Başka bölümlerde 70 adı
   * taşımanın bedeli kaydın kendisinden büyük — orada yalnız sayı tutuyoruz.
   */
  iliskiAdlari?: boolean
}

/**
 * Tek bir JSON:API kaydını düzleştir.
 *
 * `attributes` üste çıkar: eşleyicideki `attrs(r)` sarmalayıcısı 30 kez
 * çağrılıyordu ve her çağrı bir kaçırma fırsatıydı. Ad çarpışması olursa
 * (attributes içinde `id`/`tip`/`iliski` gelirse) alan `_alanlar` altına
 * kaçar — sessizce üstüne yazmak veri kaybı olurdu.
 *
 * Bilinmeyen `attributes` alanları AYNEN korunuyor; o yüzden burada ayrıca
 * "bilinmeyen alan" takibi gerekmiyor. İlişkilerde durum farklı: orada
 * atıyoruz, o yüzden adlarını/sayısını not ediyoruz.
 */
export function normalizeRecord(r: unknown, opt: KayitSecenek = {}): unknown {
  if (!hamKayit(r)) return r
  const rec = r as Kayit
  const out: Kayit = {}
  const bosAlanlar: string[] = []
  const cakisan: Kayit = {}

  if (rec.id !== undefined) out.id = String(rec.id)
  if (rec.type) out.tip = String(rec.type)

  for (const [k, v] of Object.entries(rec.attributes ?? {})) {
    if (bos(v)) {
      // Adı tutuyoruz: `kidsAgeBand: null` "Kids kategorisinde değil" demek,
      // alanın hiç gelmemesi "Apple alanı kaldırdı" demek. İkisi ayrı haber.
      bosAlanlar.push(k)
      continue
    }
    if (k === 'id' || k === 'tip' || k === 'iliski' || k.startsWith('_')) cakisan[k] = v
    else out[k] = v
  }

  const iliski: Record<string, string | string[]> = {}
  const adressiz: string[] = []
  for (const [ad, rel] of Object.entries(rec.relationships ?? {})) {
    const deger = iliskiDegeri(rel)
    if (deger === undefined || (Array.isArray(deger) && !deger.length)) adressiz.push(ad)
    else iliski[ad] = deger
  }

  if (Object.keys(iliski).length) out.iliski = iliski
  if (adressiz.length) {
    out._iliski = opt.iliskiAdlari
      ? { sayi: adressiz.length, adlar: adressiz }
      : { sayi: adressiz.length }
  }
  if (bosAlanlar.length) out._bos = bosAlanlar
  if (Object.keys(cakisan).length) out._alanlar = cakisan

  return out
}

const dizi = (v: unknown, opt?: KayitSecenek): unknown[] =>
  Array.isArray(v) ? v.map((r) => normalizeRecord(r, opt)) : []

/** `{data, included}` sarmalını aç; included'ı kimliğe göre indeksle. */
function havuz(payload: any): Map<string, Kayit> {
  const m = new Map<string, Kayit>()
  for (const r of payload?.included ?? []) if (r?.id) m.set(String(r.id), r)
  return m
}

const attrs = (r: any): Kayit => r?.attributes ?? r ?? {}

// ---------------------------------------------------------------------------
// Bölüme özel damıtma
// ---------------------------------------------------------------------------

/**
 * Bir bölümü sadeleştir.
 *
 * Bölüme özel kuralı olmayan her şey jenerik yoldan geçer — yeni bir bölüm
 * eklendiğinde kod değiştirmeden çalışır, sadece daha az damıtılmış olur.
 */
export function normalizeSection(section: string, data: unknown): NormalizeSonuc {
  const notlar: string[] = []
  if (data === null || data === undefined) return { data, notlar }

  switch (section) {
    // Uygulama künyesi: ilişki adları R2 için değerli (uç haritası).
    case 'app':
      return { data: normalizeRecord(data, { iliskiAdlari: true }), notlar }

    // included = kategoriler + yaş beyanı. İkisi de başka yerde duruyor
    // (kategori `iliski`de, yaş beyanı kendi bölümünde) — tekrarı atıyoruz.
    case 'appInfos':
      return { data: { data: dizi((data as any)?.data ?? data) }, notlar }

    case 'reviewDetail':
      return { data: reviewDetail(data), notlar }

    case 'stateChanges':
      return { data: stateChanges(data), notlar }

    case 'submissions':
      return { data: submissions(data), notlar }

    case 'threads':
      return { data: threads(data), notlar }

    case 'subscriptions':
      return { data: subscriptions(data, notlar), notlar }

    case 'iaps':
      return { data: iaps(data), notlar }

    case 'iapPrices':
      return { data: iapPrices(data, notlar), notlar }

    case 'dataUsages':
      return { data: dataUsages(data), notlar }

    case 'versionTexts':
      return { data: versionTexts(data), notlar }

    // Toplayıcı bunları zaten elle damıtıyor — örnek şekil bunlar.
    case 'screenshots':
    case 'icon':
      return { data, notlar }

    // Özel ürün sayfaları: yeni toplayıcı damıtılmış yazıyor, eski çekimlerde
    // ham JSON:API kaydı duruyor. İkisini de kabul ediyoruz — okuma anındaki
    // sadeleştirme eski kayıtlar için var zaten.
    case 'customProductPages':
      return {
        data: (Array.isArray(data) ? data : []).map((r: any) =>
          hamKayit(r)
            ? { ...(normalizeRecord(r) as Kayit), metinler: [], gorseller: [], icerikCekildi: false }
            : r,
        ),
        notlar,
      }

    default:
      return {
        data: Array.isArray(data) ? dizi(data) : normalizeRecord(data),
        notlar,
      }
  }
}

/**
 * Review iletişim bilgisi: DEĞER değil VARLIK.
 *
 * Lint'in tek ihtiyacı "dolu mu" (2.1). Ad/telefon/e-posta ham dökümde durup
 * indirilen dosyalara sızıyordu (R4). Demo hesap KALIYOR — placeholder
 * kontrolü ona bakıyor.
 */
function reviewDetail(data: unknown): unknown {
  const r = normalizeRecord(data) as Kayit
  if (!nesne(r)) return r
  const { contactFirstName, contactLastName, contactEmail, contactPhone, ...kalan } = r
  return {
    ...kalan,
    iletisim: {
      ad: !!(contactFirstName || contactLastName),
      eposta: !!contactEmail,
      telefon: !!contactPhone,
    },
  }
}

/**
 * Durum geçmişi — ASC'nin "Activity" tablosu, sürüm sürüm.
 *
 * `initiator` ATILIR: e-posta adresi taşıyor (R4) ve sayımda kullanılmıyor.
 * Sayım durum ADINA bakıyor, çünkü 2025 kayıtlarında Apple'ın satırlarında
 * User kolonu boş geliyor — initiator'a güvenen bir sayım onları kaçırırdı.
 *
 * İki girdi biçimini de kabul eder: toplayıcının yeni sürüm-başına biçimi ve
 * eski dökümlerdeki düz olay listesi (`sema:1`). Eski kayıtlar okuma anında
 * buradan geçtiği için ikisi de aynı çıktıyı vermeli.
 */
function stateChanges(data: unknown): unknown {
  const olay = (r: unknown) => {
    const a = attrs(r)
    return { durum: a.appVersionState ?? a.appStoreState ?? '', tarih: a.date ?? '' }
  }
  const satirlar = Array.isArray(data) ? data : []
  // Yeni biçim: [{ versionString, olaylar: [...] }]
  if (satirlar.some((r) => nesne(r) && 'olaylar' in (r as object))) {
    return satirlar.map((r) => {
      const g = r as { versionId?: unknown; versionString?: unknown; olaylar?: unknown }
      return {
        surum: String(g.versionString ?? ''),
        surumId: String(g.versionId ?? ''),
        olaylar: (Array.isArray(g.olaylar) ? g.olaylar : []).map(olay),
      }
    })
  }
  // Eski biçim: düz olay listesi, hangi sürüme ait olduğu kaydedilmemişti.
  return satirlar.length ? [{ surum: '', surumId: '', olaylar: satirlar.map(olay) }] : []
}

/** Geçmişten red sayıları. Tek yer, tek kural: sayan da okuyan da burayı kullanır. */
export const RED_APPLE = /^(REJECTED|METADATA_REJECTED)$/
export function redSayilari(stateChanges: unknown): { apple: number; geriCekilen: number } {
  const olaylar = (Array.isArray(stateChanges) ? stateChanges : [])
    .flatMap((g) => (nesne(g) && Array.isArray((g as any).olaylar) ? (g as any).olaylar : []))
  const d = (o: unknown) => String((o as any)?.durum ?? '')
  return {
    apple: olaylar.filter((o) => RED_APPLE.test(d(o))).length,
    geriCekilen: olaylar.filter((o) => d(o) === 'DEVELOPER_REJECTED').length,
  }
}

/** Gönderim geçmişi: sürüm numarası included'dan kaydın içine gömülür. */
function submissions(data: unknown): unknown {
  const p = data as any
  const h = havuz(p)
  return (p?.data ?? []).map((r: any) => {
    const a = attrs(r)
    const surumId = r?.relationships?.appStoreVersionForReview?.data?.id
    return {
      id: String(r?.id ?? ''),
      durum: a.state ?? '',
      gonderildi: a.submittedDate ?? null,
      guncellendi: a.lastUpdatedDate ?? null,
      surum: surumId ? (attrs(h.get(String(surumId))).versionString ?? null) : null,
    }
  })
}

/** Yazışmalar: mesaj gövdesi HAZİNE, kalanı zarf. Kim yazdığı gömülür. */
function threads(data: unknown): unknown {
  return (Array.isArray(data) ? data : []).map((t: any) => {
    const h = havuz(t)
    const kimlik = (m: any) => {
      const id = m?.relationships?.fromActor?.data?.id
      const tur = String(attrs(h.get(String(id))).actorType ?? (String(id) === 'APPLE' ? 'APPLE' : ''))
      return tur === 'APPLE' ? 'APPLE' : 'GELISTIRICI'
    }
    return {
      id: String(t?.thread?.id ?? ''),
      tur: attrs(t?.thread).threadType ?? '',
      acilis: attrs(t?.thread).createdDate ?? '',
      mesajlar: (t?.messages ?? []).map((m: any) => ({
        id: String(m?.id ?? ''),
        kim: kimlik(m),
        tarih: attrs(m).createdDate ?? '',
        govde: attrs(m).messageBody ?? '',
      })),
      redler: (t?.rejections ?? []).flatMap((r: any) =>
        (attrs(r).reasons ?? []).map((x: any) => ({
          madde: x?.reasonSection ?? '',
          kod: x?.reasonCode ?? '',
          aciklama: x?.reasonDescription ?? '',
        })),
      ),
    }
  })
}

/**
 * Abonelikler: teklifler TEKİLLEŞTİRİLİR.
 *
 * Apple tanıtım teklifini ÜLKE BAŞINA bir satır döndürüyor: tek bir haftalık
 * teklif 175 satır olarak geldi, hepsi aynı. Sayıyı saklıyoruz çünkü "kaç
 * ülkede geçerli" bilgi; 175 kopyayı saklamak değil.
 */
function subscriptions(data: unknown, notlar: string[]): unknown {
  return (Array.isArray(data) ? data : []).map((s: any) => {
    const gruplu = new Map<string, any>()
    for (const o of s?.offers ?? []) {
      const anahtar = [o?.offerMode, o?.duration, o?.numberOfPeriods, o?.startDate].join('|')
      const v = gruplu.get(anahtar)
      if (v) v.adet++
      else gruplu.set(anahtar, { ...o, adet: 1 })
    }
    const teklifler = [...gruplu.values()]
    if ((s?.offers?.length ?? 0) > teklifler.length) {
      notlar.push(
        `${s?.productId ?? s?.id}: ${s.offers.length} teklif satırı ${teklifler.length} tekil teklife indi`,
      )
    }
    return {
      id: String(s?.id ?? ''),
      urun: s?.productId ?? '',
      ad: s?.name ?? '',
      donem: s?.period ?? '',
      durum: s?.state ?? '',
      fiyat: s?.price ?? null,
      teklifler,
      diller: dizi(s?.locales),
    }
  })
}

/** Ürünler: yerelleştirmeler ürüne gömülür, fiyat ÇÖZÜLÜR. */
function iaps(data: unknown): unknown {
  const p = data as any
  if (!p?.data) return normalizeRecord(p)
  const included: Resource[] = p.included ?? []
  const yerel = new Map<string, any>()
  for (const r of included) if (r?.type === 'inAppPurchaseLocalizations' && r.id) yerel.set(String(r.id), r)

  return {
    data: (p.data ?? []).map((r: any) => {
      const kayit = normalizeRecord(r) as Kayit
      const refs = (r?.relationships?.inAppPurchaseLocalizations?.data ?? []) as Array<{ id: string }>
      const diller = refs.map((x) => yerel.get(String(x.id))).filter(Boolean).map((x) => normalizeRecord(x))
      if (diller.length) kayit.diller = diller

      // Fiyat toplama anında çözülür: eşleyici artık ilişki zinciri yürütmek
      // zorunda değil. Çözülemezse `null` — sessiz sıfır yok.
      //
      // BURADA UYARI YOK. Ürün listesinde fiyatın gelmemesi NORMAL: Apple
      // fiyatı ayrı bir çizelgede tutuyor ve toplayıcı hemen ardından onu
      // çekiyor. Buraya uyarı yazmak, ikinci aşamada çözülen fiyat için
      // "çözülemedi" diye 6 satır bırakıyordu — panelde 10 şüphelinin 6'sı
      // yalancı alarmdı. Gerçekten fiyatsız kalan ürünü toplayıcı, İKİ yol da
      // denendikten sonra tek satırda bildiriyor.
      const fiyat = priceFromPool(r, included)
      kayit.fiyat = fiyat ? { tutar: fiyat.price, para: fiyat.currency, kaynak: 'iaps.include' } : null
      return kayit
    }),
  }
}

/** Ürün başına çekilen fiyat çizelgeleri: çözülmüş fiyat, çözülemezse ham + sebep. */
function iapPrices(data: unknown, notlar: string[]): unknown {
  return (Array.isArray(data) ? data : []).map((row: any) => {
    const fiyat = priceFromSchedule(row)
    if (fiyat) {
      return {
        iapId: String(row?.iapId ?? ''),
        urun: row?.productId ?? '',
        fiyat: fiyat.price,
        para: fiyat.currency,
        kaynak: 'iapPriceSchedule',
      }
    }
    notlar.push(`${row?.productId ?? row?.iapId}: fiyat çizelgesinden okunamadı, ham kayıt saklandı`)
    return {
      iapId: String(row?.iapId ?? ''),
      urun: row?.productId ?? '',
      fiyat: null,
      not: 'fiyat noktası havuzda yok',
      ham: { data: dizi(row?.data), included: dizi(row?.included) },
    }
  })
}

/**
 * Gizlilik etiketleri: anlamın tamamı ilişki kimliklerinde.
 *
 * `included` 15 kayıt ve hepsinin tek alanı `{deleted: false}` — taşıma
 * detayı. Düz tabloya iniyor: 12.2 KB → 0.9 KB.
 */
function dataUsages(data: unknown): unknown {
  const p = data as any
  const silinmis = new Set<string>()
  for (const r of p?.included ?? []) if (r?.attributes?.deleted === true) silinmis.add(String(r.id))

  const id = (rel: any) => (rel?.data?.id ? String(rel.data.id) : '')
  return (p?.data ?? []).map((r: any) => {
    const kategori = id(r?.relationships?.category)
    const grup = id(r?.relationships?.grouping)
    const amac = id(r?.relationships?.purpose)
    const koruma = id(r?.relationships?.dataProtection)
    const satir: Kayit = { kategori, grup, koruma }
    if (amac) satir.amac = amac
    if ([kategori, grup, amac, koruma].some((x) => x && silinmis.has(x))) satir.silinmis = true
    return satir
  })
}

/** Sürüm metinleri: kabuk zaten damıtılmış, içindeki dil kayıtları ham. */
function versionTexts(data: unknown): unknown {
  return (Array.isArray(data) ? data : []).map((v: any) => ({
    ...v,
    locales: dizi(v?.locales),
  }))
}
