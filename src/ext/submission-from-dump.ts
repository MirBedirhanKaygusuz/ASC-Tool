import type { Submission, IapItem, MediaRef, Declarations } from '../types.js'
import { humanizeCategory, AGE_RATING, deviceClassOf, PERIOD } from '../fetch/apple-tables.js'
import { hamKayit } from '../dump/normalize.js'

/**
 * Tarayıcı oturumuyla çekilen ham döküm → denetlenebilir `Submission`.
 *
 * NEDEN VAR: `fetch/asc.ts` aynı işi `.p8` anahtarıyla resmi API'den yapıyor.
 * Bu dosya aynı sonucu ANAHTARSIZ üretir; hedef kullanıcının .env doldurması,
 * anahtar indirmesi, komut çalıştırması gerekmesin diye.
 *
 * SESSİZ EKSİK VERİ EN BÜYÜK TEHLİKE (belkiPatlarız R3): bir alan okunamadıysa
 * boş bırakıp geçmek, denetimin o kuralı "sorun yok" saymasına yol açar.
 * Bu yüzden her eksik `warnings`'e yazılır ve raporda görünür. Eşleyici
 * hiçbir zaman sessizce boş dönmez.
 *
 * Alan adları 2026-08-20 kanaryasıyla gerçek hesapta doğrulandı.
 */

/**
 * Toplayıcının depoya yazdığı bölümler — NORMALLEŞTİRİLMİŞ biçimde.
 *
 * Kayıtlar düz: `attributes` üste çıkmış, `links` atılmış, ilişkiler `iliski`
 * altında yalnız kimlik olarak duruyor, `included` havuzları sahibine
 * gömülmüş. Dönüşümü `src/dump/normalize.ts` yapıyor; eski çekimler de
 * görüntüleyicide OKUMA ANINDA aynı koddan geçiyor, o yüzden burada tek bir
 * şekil var — "ham mı sade mi" diye dallanmıyoruz.
 */
export interface Dump {
  app?: any
  appInfos?: { data: any[] }
  appInfoLocalizations?: any[]
  ageRating?: any
  versionAgeRating?: any
  versions?: any[]
  versionTexts?: Array<{
    versionId: string
    versionString: string
    state: string
    createdDate: string
    toplamDil: number
    locales: any[]
  }>
  screenshots?: Array<{
    locale: string
    displayType: string
    images: Array<{ id: string; order: number; fileName: string; url: string; width?: number; height?: number; state?: string }>
  }>
  reviewDetail?: any
  icon?: { id: string; url: string; iconType: string }
  builds?: any[]
  dataUsages?: Array<{ kategori: string; grup: string; amac?: string; koruma: string }>
  customProductPages?: any[]
  subscriptions?: Array<{
    id: string
    urun: string
    ad: string
    donem: string
    durum: string
    fiyat: { customerPrice?: string; currency?: string; proceeds?: string } | null
    teklifler: any[]
    diller: any[]
  }>
  iaps?: { data: any[] }
  /** Ürün başına çekilmiş fiyat: toplama anında çözülmüş hâli. */
  iapPrices?: Array<{ iapId: string; urun: string; fiyat: number | null; para?: string; not?: string; ham?: any }>
}

export interface MapOptions {
  /** Hangi dilin metinleri denetlenecek. Boşsa uygulamanın birincil dili. */
  locale?: string
  /** API'nin bilemeyeceği alanlar (ör. generatesAiContent) — elle girilir. */
  meta?: Partial<Submission['meta']>
}

export interface MapResult {
  submission: Submission
  /** Denetimi düşürmeyen ama raporda GÖRÜNMESİ gereken eksikler. */
  warnings: string[]
}

const IAP_KIND: Record<string, IapItem['kind']> = {
  CONSUMABLE: 'consumable',
  NON_CONSUMABLE: 'non_consumable',
  NON_RENEWING_SUBSCRIPTION: 'non_renewing',
}

/**
 * Normalleştirilmiş kayıtta alanlar ÜST DÜZEYDE durur. Eski `attributes`
 * sarmalına da bakıyoruz ama bu bir yedek değil, TEŞHİS: aşağıdaki `hamKayit`
 * kontrolü ham döküm geldiğinde açıkça uyarı yazar. Sessizce yarım sonuç
 * üretmektense neyin yanlış olduğunu söylemek gerekiyor.
 */
const attrs = (r: any): Record<string, any> => r?.attributes ?? r ?? {}

function pickLocale<T extends { attributes?: Record<string, any> }>(rows: T[], locale: string): T | undefined {
  const want = locale.toLowerCase()
  return (
    rows.find((r) => String(attrs(r).locale ?? '').toLowerCase() === want) ??
    // en-US isteyip yalnız en-GB varsa boş dönmektense dil kökü tutsun.
    rows.find((r) => String(attrs(r).locale ?? '').toLowerCase().startsWith(want.split('-')[0]!))
  )
}

export function submissionFromDump(dump: Dump, opts: MapOptions = {}): MapResult {
  const warnings: string[] = []
  const warn = (m: string) => warnings.push(m)

  // Döküm sadeleştirilmemiş geldiyse SÖYLE. Sessizce yarım eşleme yapmak,
  // "kategori okunamadı" gibi yanıltıcı uyarılar üretir ve asıl sebebi gizler.
  if (hamKayit(dump.app) || hamKayit(dump.appInfos?.data?.[0])) {
    warn(
      'Döküm ham JSON:API biçiminde geldi (sadeleştirilmemiş). Bazı alanlar ' +
        'okunamayabilir — görüntüleyiciyi güncelle ya da uygulamayı yeniden çek.',
    )
  }

  const appAttrs = attrs(dump.app)
  const appId = String(dump.app?.id ?? '')
  const primaryLocale = String(appAttrs.primaryLocale ?? 'en-US')
  const locale = opts.locale ?? primaryLocale

  // --- Ad, altyazı, gizlilik URL'i ----------------------------------------
  const infoLocs = dump.appInfoLocalizations ?? []
  const infoLoc = pickLocale(infoLocs, locale) ?? infoLocs[0]
  if (!infoLocs.length) warn('Uygulama künyesi metinleri (ad/altyazı) çekilemedi.')
  else if (!pickLocale(infoLocs, locale)) {
    warn(`${locale} için künye metni yok; ${String(attrs(infoLoc).locale ?? '?')} kullanıldı.`)
  }
  const name = String(attrs(infoLoc).name ?? appAttrs.name ?? '')
  const subtitle = String(attrs(infoLoc).subtitle ?? '')
  const privacyUrl = String(attrs(infoLoc).privacyPolicyUrl ?? '')

  // --- Kategori ve yaş sınırı ---------------------------------------------
  const info = dump.appInfos?.data?.[0]
  const categoryId = info?.iliski?.primaryCategory ?? info?.relationships?.primaryCategory?.data?.id
  const category = categoryId ? humanizeCategory(String(categoryId)) : ''
  if (!category) warn('Kategori okunamadı — kategoriye bağlı kurallar elenmiş olabilir.')

  const rawAge = String(attrs(info).appStoreAgeRating ?? '')
  const ageRating = AGE_RATING[rawAge] ?? ''
  if (!ageRating) {
    warn(
      rawAge
        ? `Yaş sınırı tanınmadı: ${rawAge}. Yaş kuralları yanılabilir.`
        : 'Yaş sınırı boş — henüz belirlenmemiş olabilir. Yaş kuralları yanılabilir.',
    )
  }

  // --- Sürüm metinleri ----------------------------------------------------
  const current = dump.versionTexts?.[0]
  const vloc = current ? (pickLocale(current.locales, locale) ?? current.locales[0]) : undefined
  if (!current) warn('Sürüm metinleri çekilemedi — açıklama, keywords ve promo denetlenemez.')
  else if (!vloc) warn(`${locale} için sürüm metni yok.`)
  const va = attrs(vloc)

  // --- Ekran görüntüleri ---------------------------------------------------
  const screenshots: MediaRef[] = []
  for (const set of dump.screenshots ?? []) {
    // Yalnız denetlenen dilin görselleri; başka dilin ekranını bu dile
    // sayarsak "ekran görüntüsü var" derken yanlış görseli denetleriz.
    if (set.locale && vloc && String(attrs(vloc).locale ?? '') && set.locale !== attrs(vloc).locale) continue
    for (const img of set.images ?? []) {
      screenshots.push({
        id: img.id,
        path: img.url,
        deviceClass: deviceClassOf(set.displayType) || undefined,
        order: img.order,
        width: img.width,
        height: img.height,
      })
    }
  }
  if (!screenshots.length) warn('Hiç ekran görüntüsü yok ya da çekilemedi — görsel kartlar çalışmayacak.')
  const cozulmemis = screenshots.filter((s) => !s.path).length
  if (cozulmemis) warn(`${cozulmemis} ekran görüntüsünün adresi çözülemedi.`)

  const icon: MediaRef | undefined = dump.icon?.url
    ? { id: dump.icon.id, path: dump.icon.url }
    : undefined
  if (!icon) warn('İkon okunamadı — "ikon eksik" bulgusu bu yüzden çıkabilir.')

  // --- Review notları ve demo hesap ---------------------------------------
  const ra = attrs(dump.reviewDetail)
  const demoRequired = ra.demoAccountRequired === true
  if (!dump.reviewDetail) warn('Review detayı çekilemedi — demo hesap ve inceleme notu denetlenemedi.')

  // --- Abonelikler ve ürünler ---------------------------------------------
  const iap: IapItem[] = []
  const fiyatsiz: string[] = []

  for (const sub of dump.subscriptions ?? []) {
    const loc = pickLocale(sub.diller ?? [], locale) ?? sub.diller?.[0]
    const price = Number(sub.fiyat?.customerPrice ?? 0)
    if (!sub.fiyat) fiyatsiz.push(sub.urun)
    // Apple deneme süresini teklif kaydında veriyor; offerMode ayırt ediyor.
    // Teklifler ülke başına tekrarlandığı için normalleştirmede tekilleşti.
    const trial = (sub.teklifler ?? []).find((o: any) => String(o?.offerMode ?? '') === 'FREE_TRIAL')
    iap.push({
      id: sub.urun,
      kind: 'subscription',
      name: String(attrs(loc).name ?? sub.ad ?? ''),
      description: String(attrs(loc).description ?? ''),
      price,
      currency: String(sub.fiyat?.currency ?? ''),
      duration: PERIOD[String(sub.donem ?? '')] ?? undefined,
      freeTrial: trial ? { duration: PERIOD[String(trial.duration ?? '')] ?? '' } : undefined,
    })
  }

  /**
   * Fiyat ARTIK BURADA ÇÖZÜLMÜYOR.
   *
   * Eskiden eşleyici ilişki zincirini (ürün → çizelge → fiyat → fiyat noktası)
   * kendisi yürütüyordu ve toplayıcı da aynı zinciri ayrı bir kopyayla
   * yürütüyordu; ikisi ayrışınca rapor her ürüne sessizce 0 yazdı. Şimdi
   * zincir tek yerde, TOPLAMA ANINDA çözülüyor (`src/dump/normalize.ts`);
   * burada yalnız çözülmüş sayıyı okuyoruz. Çözülememişse `null` gelir ve
   * "okunamadı" deriz — sıfır yazıp geçmeyiz.
   */
  const cizelge = new Map((dump.iapPrices ?? []).map((r) => [r.urun, r]))

  for (const p of dump.iaps?.data ?? []) {
    const productId = String(p.productId ?? p.id)
    const loc = pickLocale(p.diller ?? [], locale) ?? p.diller?.[0]
    const ayri = cizelge.get(productId)
    const fiyat =
      typeof ayri?.fiyat === 'number'
        ? { price: ayri.fiyat, currency: String(ayri.para ?? '') }
        : typeof p.fiyat?.tutar === 'number'
          ? { price: p.fiyat.tutar, currency: String(p.fiyat.para ?? '') }
          : null
    // Fiyat okunamadıysa 0 yazıyoruz ama BUNU SÖYLÜYORUZ: sessiz sıfır,
    // fiyata bakan kuralların "ücretsiz" sanmasına yol açar.
    if (!fiyat) fiyatsiz.push(productId)
    iap.push({
      id: productId,
      kind: IAP_KIND[String(p.inAppPurchaseType ?? '')] ?? 'non_consumable',
      name: String(attrs(loc).name ?? p.name ?? ''),
      description: String(attrs(loc).description ?? ''),
      price: fiyat?.price ?? 0,
      currency: fiyat?.currency ?? '',
    })
  }
  if (fiyatsiz.length) {
    // Uyarı kendini teşhis etsin: "neden okunamadı" sorusunu kullanıcının
    // bana sormak zorunda kalması, uyarının eksik yazıldığı anlamına gelir.
    const hicCekilmemis = dump.iapPrices === undefined
    warn(
      `${fiyatsiz.length} ürünün fiyatı okunamadı (price=0): ${fiyatsiz.slice(0, 5).join(', ')}` +
        (fiyatsiz.length > 5 ? ' …' : '') +
        '. ' +
        (hicCekilmemis
          ? 'Fiyat bölümü bu çekimde HİÇ YOK — muhtemelen eski bir çekim. ' +
            '"Her şeyi çek" ile yeniden çek.'
          : 'Fiyat çizelgesi çekildi ama bu ürünlerde okunamadı — Uygulamalar ' +
            'sekmesindeki "Okunamayan uçlar" listesine bak.') +
        ' Fiyata bakan kurallar bunlarda yanılabilir.',
    )
  }

  // --- meta: kural seçimini belirleyen alanlar ----------------------------
  // Sürüm bazlı beyan, uygulama bazlıdan güncel olduğu için önce o.
  const ugc =
    attrs(dump.versionAgeRating).userGeneratedContent ?? attrs(dump.ageRating).userGeneratedContent
  const meta: Submission['meta'] = {
    // demoAccountRequired=true kesin bilgidir. false ise KESİN DEĞİL:
    // Sign in with Apple ile giriş isteyip demo hesap vermeyen uygulamalar da
    // bu kutuyu işaretlemiyor. Bilinmiyor bırakmak yanlış "false"tan iyidir.
    requiresLogin: demoRequired ? true : undefined,
    hasUserGeneratedContent: typeof ugc === 'boolean' ? ugc : undefined,
    // generatesAiContent App Store Connect'te HİÇ YOK — yaş sınırı beyanının
    // tamamı tarandı, AI'a dair tek alan yok. Elle girilmek zorunda.
    //
    // hasThirdPartyLogin da API'de yok. `demoAccountRequired` yalnızca "giriş
    // gerekiyor" der; hangi giriş yöntemlerinin sunulduğunu söylemez. 4.8
    // (Apple ile Giriş) yalnızca üçüncü taraf giriş sunanları bağladığı için
    // bu ayrı bir sorudur.
    ...opts.meta,
  }
  if (meta.generatesAiContent === undefined) {
    warn('“AI içerik üretiyor mu?” bilinmiyor — App Store Connect bunu söylemiyor, elle işaretlenmeli.')
  }
  if (meta.hasUserGeneratedContent === undefined) {
    warn('“Kullanıcı içeriği var mı?” okunamadı — ilgili kurallar denetim dışı kalacak.')
  }
  // Yalnızca giriş gerektiren uygulamalarda sor: giriş yoksa 4.8 zaten
  // uygulanmıyor ve gereksiz bir "bilgi eksik" satırı gürültü olurdu (R20).
  if (meta.requiresLogin && meta.hasThirdPartyLogin === undefined) {
    warn('“Üçüncü taraf giriş (Google/Facebook) var mı?” bilinmiyor — Apple ile Giriş kuralı (4.8) denetim dışı kalacak.')
  }

  const beyanlar = beyanlariTopla(dump, dump.iaps?.data ?? [])
  if (!beyanlar.privacy) {
    warn('App Privacy etiketi çekilmedi — takip (5.1.2) ve gizlilik iddiası (5.1.1) denetlenemedi.')
  }
  if (!beyanlar.build) {
    warn('Build bilgisi çekilmedi — cihaz/ekran görüntüsü tutarlılığı denetlenemedi.')
  }

  const submission: Submission = {
    platform: 'apple',
    appId,
    appName: name,
    locale: String(attrs(vloc).locale ?? attrs(infoLoc).locale ?? locale),
    category,
    ageRating,
    text: {
      name,
      subtitle,
      description: String(va.description ?? ''),
      keywords: String(va.keywords ?? ''),
      promotionalText: String(va.promotionalText ?? ''),
      whatsNew: String(va.whatsNew ?? ''),
    },
    media: { icon, screenshots },
    iap,
    urls: {
      privacy: privacyUrl || undefined,
      support: String(va.supportUrl ?? '') || undefined,
      marketing: String(va.marketingUrl ?? '') || undefined,
    },
    reviewNotes: {
      notes: String(ra.notes ?? '') || undefined,
      demoAccount: demoRequired
        ? { user: String(ra.demoAccountName ?? ''), pass: String(ra.demoAccountPassword ?? '') }
        : undefined,
    },
    meta,
    declarations: beyanlar,
    source: { kind: 'app-store-connect', fetchedAt: new Date().toISOString() },
  }

  return { submission, warnings }
}


// ---------------------------------------------------------------------------
// Beyanlar — Apple'ın kendi kayıtları
// ---------------------------------------------------------------------------

/**
 * Yaş beyanının 25 alanı iki gruba ayrılır: içerik BEYAN EDİLENLER ve
 * edilmeyenler. Rapora yalnız ilki iner ("UGC var, silah seyrek"), ama
 * ikincisinin SAYISI da tutulur.
 *
 * Neden sayı: `contests: "NONE"` "yarışma yok, beyan ettim" demek; alanın hiç
 * gelmemesi "Apple bu alanı kaldırdı ya da çekemedik" demek. İkisini aynı
 * kovaya koyarsak yaş tutarlılık kontrolü, beyan hiç okunmamışken "temiz"
 * der — bu projedeki en pahalı hata sınıfı.
 */
const YAS_ALANLARI = [
  'userGeneratedContent', 'messagingAndChat', 'socialMedia', 'unrestrictedWebAccess',
  'gambling', 'gamblingSimulated', 'lootBox', 'contests', 'horrorOrFearThemes',
  'matureOrSuggestiveThemes', 'medicalOrTreatmentInformation', 'healthOrWellnessTopics',
  'profanityOrCrudeHumor', 'sexualContentOrNudity', 'sexualContentGraphicAndNudity',
  'alcoholTobaccoOrDrugUseOrReferences', 'gunsOrOtherWeapons', 'violenceCartoonOrFantasy',
  'violenceRealistic', 'violenceRealisticProlongedGraphicOrSadistic',
] as const

function yasBeyani(surum: any, uygulama: any): Declarations['age'] | undefined {
  const kaynak = surum ?? uygulama
  if (!kaynak) return undefined
  const k = attrs(kaynak)

  const sinyaller: Record<string, string | true> = {}
  let noneSayisi = 0
  const beyanEdilmemis: string[] = []
  for (const alan of YAS_ALANLARI) {
    const v = k[alan]
    if (v === undefined) beyanEdilmemis.push(alan)
    else if (v === true) sinyaller[alan] = true
    else if (v === false || v === 'NONE') noneSayisi++
    else sinyaller[alan] = String(v)
  }

  // İki beyan çelişiyorsa hangi alanlarda? Eşleyici sürüm bazlıyı kullanıyor;
  // hangisinin geçerli olduğunu kullanıcı görmeli.
  let surumFarki: string[] | undefined
  if (surum && uygulama) {
    const u = attrs(uygulama)
    surumFarki = YAS_ALANLARI.filter((a) => attrs(surum)[a] !== u[a] && (attrs(surum)[a] !== undefined || u[a] !== undefined))
  }

  return {
    magazaSinifi: undefined,
    ustunKilma: k.ageRatingOverrideV2 ?? k.ageRatingOverride ?? undefined,
    kidsAgeBand: k.kidsAgeBand ?? undefined,
    sinyaller,
    noneSayisi,
    beyanEdilmemis,
    kaynak: surum ? 'surum' : 'uygulama',
    surumFarki: surumFarki?.length ? surumFarki : undefined,
  }
}

/**
 * En güncel, İNCELEMEYE UYGUN build.
 *
 * `builds[0]` yanlış cevap: bu hesapta ilk kayıt bir yıl önceki, süresi dolmuş
 * bir build'di. Cihaz aileleri ondan okunursa 2.3.3 kontrolü yanlış build'e
 * bakar. Bulamazsak `undefined` döneriz ve kontrol hiç çalışmaz.
 */
function buildBeyani(dump: Dump): Declarations['build'] | undefined {
  const hepsi = dump.builds ?? []
  if (!hepsi.length) return undefined
  const uygun = hepsi.filter((b: any) => b.expired !== true && b.processingState === 'VALID')
  const sirali = (uygun.length ? uygun : hepsi)
    .slice()
    .sort((a: any, b: any) => String(b.uploadedDate ?? '').localeCompare(String(a.uploadedDate ?? '')))
  const secilen: any = sirali[0]
  if (!secilen) return undefined
  return {
    surum: secilen.version ? String(secilen.version) : undefined,
    cihazAileleri: Array.isArray(secilen.deviceFamilies) ? secilen.deviceFamilies.map(String) : [],
    minOs: secilen.minOsVersion ? String(secilen.minOsVersion) : undefined,
    kaynak: uygun.length
      ? `build ${secilen.version} (${secilen.uploadedDate ?? '?'})`
      : `build ${secilen.version} — süresi dolmuş, uygun build yok`,
  }
}

function beyanlariTopla(dump: Dump, urunler: any[]): Declarations {
  const d: Declarations = {}

  const yas = yasBeyani(dump.versionAgeRating, dump.ageRating)
  if (yas) {
    yas.magazaSinifi = AGE_RATING[String(attrs(dump.appInfos?.data?.[0]).appStoreAgeRating ?? '')] ?? undefined
    if (yas.ustunKilma) yas.ustunKilma = AGE_RATING[yas.ustunKilma] ?? yas.ustunKilma
    d.age = yas
  }

  if (dump.dataUsages) {
    const satirlar = dump.dataUsages
    d.privacy = {
      satirlar,
      takip: satirlar.some((r) => r.koruma === 'DATA_USED_TO_TRACK_YOU'),
      kimlikleBagli: satirlar.some((r) => r.koruma === 'DATA_LINKED_TO_YOU'),
    }
  }

  const haklar = attrs(dump.app).contentRightsDeclaration
  if (haklar) d.icerikHaklari = String(haklar)

  if (dump.iaps?.data) {
    d.urunDurumlari = urunler.map((p: any) => ({
      id: String(p.productId ?? p.id),
      durum: String(p.state ?? ''),
      durumGrubu: p.stateGroup ? String(p.stateGroup) : undefined,
      sonrakiSurumleGonder: typeof p.submitWithNextAppStoreVersion === 'boolean' ? p.submitWithNextAppStoreVersion : undefined,
      incelemede: typeof p.isAppStoreReviewInProgress === 'boolean' ? p.isAppStoreReviewInProgress : undefined,
      reviewNote: p.reviewNote ? String(p.reviewNote) : undefined,
    }))
  }

  const build = buildBeyani(dump)
  if (build) d.build = build

  const surum = dump.versions?.[0]
  if (surum) {
    d.surum = {
      durum: surum.appVersionState ?? surum.appStoreState ?? undefined,
      yayinTipi: surum.releaseType ?? undefined,
      usesIdfa: typeof surum.usesIdfa === 'boolean' ? surum.usesIdfa : undefined,
    }
  }

  const rd = attrs(dump.reviewDetail)
  if (rd.iletisim) d.reviewIletisim = rd.iletisim

  if (dump.customProductPages) {
    d.ozelSayfalar = dump.customProductPages.map((s: any) => ({
      ad: String(s.name ?? ''),
      gorunur: s.visible !== false,
      // Kabuk mu, içerik mi? Eski çekimlerde yalnız ad/adres var; kapsam
      // uyarısı (lint-custom-page-not-audited) tam olarak bu ayrıma dayanıyor.
      icerikCekildi: s.icerikCekildi === true,
    }))
  }

  return d
}
