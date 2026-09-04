/**
 * Apple'ın sabit sözlükleri — saf veri, Node'a dokunmaz.
 *
 * NEDEN AYRI DOSYA: aynı tablolar iki yerde lazım. `fetch/asc.ts` (.p8 ile
 * resmi API) ve `ext/submission-from-dump.ts` (tarayıcı oturumuyla çekilen
 * döküm). İki kopya tutulursa biri güncellenir öteki unutulur ve iki yol
 * farklı sonuç üretir — sessiz sapma.
 *
 * Ayrıca bu dosya Node built-in'i import etmez; eklenti paketine girebilmesi
 * için şart.
 */

/** Apple kategori id'si PHOTO_AND_VIDEO gibi; rapora okunabilir hali girsin. */
export function humanizeCategory(id: string): string {
  return id
    .toLowerCase()
    .split('_')
    .map((w) => (w === 'and' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

export const AGE_RATING: Record<string, string> = {
  FOUR_PLUS: '4+',
  NINE_PLUS: '9+',
  TWELVE_PLUS: '12+',
  THIRTEEN_PLUS: '13+',
  SIXTEEN_PLUS: '16+',
  SEVENTEEN_PLUS: '17+',
  EIGHTEEN_PLUS: '18+',
}

/**
 * Apple'ın screenshotDisplayType değerleri ile bizim cihaz sınıfı sözlüğümüz.
 *
 * Tablo elle yazıldı çünkü türetme kuralı belirsiz: APP_IPHONE_65 "6.5 inç"
 * demek, APP_IPAD_11 ise "11 inç" — ikisi de iki basamak. Otomatik ayırırsak
 * iPad 11'i 1.1 inç sanar ve cihaz sınıfı kuralları sessizce yanlış çalışır.
 */
export const SCREENSHOT_CLASS: Record<string, string> = {
  APP_IPHONE_69: 'iphone_6_9',
  APP_IPHONE_67: 'iphone_6_7',
  APP_IPHONE_65: 'iphone_6_5',
  APP_IPHONE_61: 'iphone_6_1',
  APP_IPHONE_58: 'iphone_5_8',
  APP_IPHONE_55: 'iphone_5_5',
  APP_IPHONE_47: 'iphone_4_7',
  APP_IPHONE_40: 'iphone_4_0',
  APP_IPHONE_35: 'iphone_3_5',
  APP_IPAD_PRO_3GEN_129: 'ipad_pro_12_9',
  APP_IPAD_PRO_129: 'ipad_pro_12_9',
  APP_IPAD_PRO_3GEN_11: 'ipad_pro_11',
  APP_IPAD_11: 'ipad_11',
  APP_IPAD_105: 'ipad_10_5',
  APP_IPAD_97: 'ipad_9_7',
  APP_DESKTOP: 'desktop',
  APP_APPLE_VISION_PRO: 'vision_pro',
  APP_APPLE_TV: 'apple_tv',
}

export function deviceClassOf(displayType: string): string {
  // Bilinmeyen tip: küçük harfe indir, kaybetme. Kural eşleşmez ama
  // ekran görüntüsünün kendisi sayımda ve görsel denetimde durur.
  return SCREENSHOT_CLASS[displayType] ?? displayType.toLowerCase().replace(/^app_/, '')
}

/** ISO 8601 süre: Apple "ONE_WEEK" gibi yazar, bizim tipimiz "P1W" bekler. */
export const PERIOD: Record<string, string> = {
  ONE_DAY: 'P1D',
  THREE_DAYS: 'P3D',
  ONE_WEEK: 'P1W',
  TWO_WEEKS: 'P2W',
  ONE_MONTH: 'P1M',
  TWO_MONTHS: 'P2M',
  THREE_MONTHS: 'P3M',
  SIX_MONTHS: 'P6M',
  ONE_YEAR: 'P1Y',
}

/**
 * ASC ülke kodu (3 harf) → App Store vitrin kodu (2 harf).
 *
 * İki ayrı sistem: fiyatlar `filter[territory]=USA` ile isteniyor ama vitrin
 * adresi `apps.apple.com/us/...`. `'USA'.toLowerCase()` yapmak 'usa' üretir ve
 * sessizce 404'e gider — o yüzden tablo.
 *
 * Liste kısa ve BİLEREK kısa: ofisin fiilen baktığı vitrinler. Bilinmeyen kod
 * `undefined` döner, çağıran da varsayılana (ABD) düşüp bunu SÖYLER — uydurma
 * iki harf üretip yanlış ülkenin fiyatını doğru sanmaktan iyidir.
 */
const STOREFRONT: Record<string, string> = {
  USA: 'us', TUR: 'tr', GBR: 'gb', DEU: 'de', FRA: 'fr', ITA: 'it', ESP: 'es',
  NLD: 'nl', CAN: 'ca', AUS: 'au', JPN: 'jp', KOR: 'kr', BRA: 'br', MEX: 'mx',
  IND: 'in', RUS: 'ru', CHN: 'cn', SAU: 'sa', ARE: 'ae', POL: 'pl', SWE: 'se',
}

export function storefrontOf(territory: string | undefined): string | undefined {
  if (!territory) return undefined
  const kod = territory.trim()
  if (kod.length === 2) return kod.toLowerCase()
  return STOREFRONT[kod.toUpperCase()]
}

/**
 * imageAsset şablonu: ".../{w}x{h}{c}.{f}". Boyutu biz seçiyoruz.
 *
 * Tam çözünürlük İSTEMİYORUZ: 1284x2778 bir ekran görüntüsü ~1.4 MB, base64'e
 * çevrilince ~1.9 MB. 18 tanesi tek istekte modele gitmeye çalışınca çağrı
 * komple düşüyor. Apple zaten istediğimiz ölçüde render ediyor.
 */
export function renderUrl(asset: Record<string, any> | undefined, maxEdge: number): string {
  const tpl = asset?.templateUrl
  if (!asset || typeof tpl !== 'string') return ''
  const w = Number(asset.width) || 1290
  const h = Number(asset.height) || 2796
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  return tpl
    .replace('{w}', String(Math.round(w * scale)))
    .replace('{h}', String(Math.round(h * scale)))
    .replace('{c}', 'bb')
    .replace('{f}', 'png')
}

export const SCREENSHOT_MAX_EDGE = 900
export const ICON_MAX_EDGE = 512
