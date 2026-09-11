"use strict";
var GLAudit = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/fetch/apple-tables.ts
  var apple_tables_exports = {};
  __export(apple_tables_exports, {
    AGE_RATING: () => AGE_RATING,
    ICON_MAX_EDGE: () => ICON_MAX_EDGE,
    PERIOD: () => PERIOD,
    SCREENSHOT_CLASS: () => SCREENSHOT_CLASS,
    SCREENSHOT_MAX_EDGE: () => SCREENSHOT_MAX_EDGE,
    deviceClassOf: () => deviceClassOf,
    humanizeCategory: () => humanizeCategory,
    renderUrl: () => renderUrl,
    storefrontOf: () => storefrontOf
  });
  function humanizeCategory(id) {
    return id.toLowerCase().split("_").map((w) => w === "and" ? "&" : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  function deviceClassOf(displayType) {
    return SCREENSHOT_CLASS[displayType] ?? displayType.toLowerCase().replace(/^app_/, "");
  }
  function storefrontOf(territory) {
    if (!territory) return void 0;
    const kod = territory.trim();
    if (kod.length === 2) return kod.toLowerCase();
    return STOREFRONT[kod.toUpperCase()];
  }
  function renderUrl(asset, maxEdge) {
    const tpl = asset?.templateUrl;
    if (!asset || typeof tpl !== "string") return "";
    const w = Number(asset.width) || 1290;
    const h = Number(asset.height) || 2796;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    return tpl.replace("{w}", String(Math.round(w * scale))).replace("{h}", String(Math.round(h * scale))).replace("{c}", "bb").replace("{f}", "png");
  }
  var AGE_RATING, SCREENSHOT_CLASS, PERIOD, STOREFRONT, SCREENSHOT_MAX_EDGE, ICON_MAX_EDGE;
  var init_apple_tables = __esm({
    "src/fetch/apple-tables.ts"() {
      "use strict";
      AGE_RATING = {
        FOUR_PLUS: "4+",
        NINE_PLUS: "9+",
        TWELVE_PLUS: "12+",
        THIRTEEN_PLUS: "13+",
        SIXTEEN_PLUS: "16+",
        SEVENTEEN_PLUS: "17+",
        EIGHTEEN_PLUS: "18+"
      };
      SCREENSHOT_CLASS = {
        APP_IPHONE_69: "iphone_6_9",
        APP_IPHONE_67: "iphone_6_7",
        APP_IPHONE_65: "iphone_6_5",
        APP_IPHONE_61: "iphone_6_1",
        APP_IPHONE_58: "iphone_5_8",
        APP_IPHONE_55: "iphone_5_5",
        APP_IPHONE_47: "iphone_4_7",
        APP_IPHONE_40: "iphone_4_0",
        APP_IPHONE_35: "iphone_3_5",
        APP_IPAD_PRO_3GEN_129: "ipad_pro_12_9",
        APP_IPAD_PRO_129: "ipad_pro_12_9",
        APP_IPAD_PRO_3GEN_11: "ipad_pro_11",
        APP_IPAD_11: "ipad_11",
        APP_IPAD_105: "ipad_10_5",
        APP_IPAD_97: "ipad_9_7",
        APP_DESKTOP: "desktop",
        APP_APPLE_VISION_PRO: "vision_pro",
        APP_APPLE_TV: "apple_tv"
      };
      PERIOD = {
        ONE_DAY: "P1D",
        THREE_DAYS: "P3D",
        ONE_WEEK: "P1W",
        TWO_WEEKS: "P2W",
        ONE_MONTH: "P1M",
        TWO_MONTHS: "P2M",
        THREE_MONTHS: "P3M",
        SIX_MONTHS: "P6M",
        ONE_YEAR: "P1Y"
      };
      STOREFRONT = {
        USA: "us",
        TUR: "tr",
        GBR: "gb",
        DEU: "de",
        FRA: "fr",
        ITA: "it",
        ESP: "es",
        NLD: "nl",
        CAN: "ca",
        AUS: "au",
        JPN: "jp",
        KOR: "kr",
        BRA: "br",
        MEX: "mx",
        IND: "in",
        RUS: "ru",
        CHN: "cn",
        SAU: "sa",
        ARE: "ae",
        POL: "pl",
        SWE: "se"
      };
      SCREENSHOT_MAX_EDGE = 900;
      ICON_MAX_EDGE = 512;
    }
  });

  // src/fetch/public-store.ts
  var public_store_exports = {};
  __export(public_store_exports, {
    IAP_SAYFA_TAVANI: () => IAP_SAYFA_TAVANI,
    crossCheckPrices: () => crossCheckPrices,
    fetchPublicListing: () => fetchPublicListing,
    parseLookup: () => parseLookup,
    parsePriceText: () => parsePriceText,
    parseStorePage: () => parseStorePage
  });
  function parsePriceText(text) {
    const t = String(text).trim();
    if (!t) return null;
    if (/^(free|ücretsiz|gratis)$/i.test(t)) return 0;
    const m = t.match(/\d[\d.,\u00a0\u202f ]*/);
    if (!m) return null;
    const raw = m[0].replace(/[\u00a0\u202f ]/g, "");
    const sonAyrac = Math.max(raw.lastIndexOf("."), raw.lastIndexOf(","));
    const normal = sonAyrac >= 0 && raw.length - sonAyrac <= 3 ? raw.slice(0, sonAyrac).replace(/[.,]/g, "") + "." + raw.slice(sonAyrac + 1) : raw.replace(/[.,]/g, "");
    const n = Number(normal);
    return Number.isFinite(n) ? n : null;
  }
  function parseStorePage(html) {
    const warnings = [];
    const iaps = [];
    const blok = /<dt[^>]*>\s*In-App Purchases\s*<\/dt>([\s\S]*?)<\/dd>/i.exec(html);
    if (!blok) {
      warnings.push('Sayfada "In-App Purchases" b\xF6l\xFCm\xFC yok \u2014 \xFCr\xFCnde IAP olmayabilir ya da sayfa yap\u0131s\u0131 de\u011Fi\u015Fmi\u015F olabilir.');
    } else {
      for (const m of blok[1].matchAll(/<span>([^<]{1,120})<\/span>\s*<span>([^<]{1,40})<\/span>/g)) {
        const name = stripTags(m[1]);
        const priceText = stripTags(m[2]);
        if (!name || !priceText) continue;
        iaps.push({ name, priceText, price: parsePriceText(priceText) });
      }
      if (!iaps.length) {
        warnings.push("IAP b\xF6l\xFCm\xFC bulundu ama sat\u0131r okunamad\u0131 \u2014 sayfa yap\u0131s\u0131 de\u011Fi\u015Fmi\u015F olabilir.");
      }
    }
    const info = {};
    for (const m of html.matchAll(/<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) {
      const key = stripTags(m[1]);
      if (key === "In-App Purchases") continue;
      info[key] = stripTags(m[2]).slice(0, 400);
    }
    return { iaps, info, warnings };
  }
  function parseLookup(result) {
    const genres = Array.isArray(result.genres) ? result.genres.map(String) : [];
    return {
      name: String(result.trackName ?? ""),
      description: String(result.description ?? ""),
      releaseNotes: String(result.releaseNotes ?? ""),
      version: String(result.version ?? ""),
      sellerName: String(result.sellerName ?? result.artistName ?? ""),
      bundleId: String(result.bundleId ?? ""),
      category: String(result.primaryGenreName ?? genres[0] ?? ""),
      categories: genres,
      ageRating: String(result.trackContentRating ?? result.contentAdvisoryRating ?? ""),
      advisories: Array.isArray(result.advisories) ? result.advisories.map(String) : [],
      languages: Array.isArray(result.languageCodesISO2A) ? result.languageCodesISO2A.map(String) : [],
      price: typeof result.price === "number" ? result.price : null,
      currency: String(result.currency ?? ""),
      formattedPrice: String(result.formattedPrice ?? ""),
      ratingAverage: typeof result.averageUserRating === "number" ? result.averageUserRating : null,
      ratingCount: typeof result.userRatingCount === "number" ? result.userRatingCount : null,
      icon: String(result.artworkUrl512 ?? result.artworkUrl100 ?? ""),
      screenshots: Array.isArray(result.screenshotUrls) ? result.screenshotUrls.map(String) : [],
      ipadScreenshots: Array.isArray(result.ipadScreenshotUrls) ? result.ipadScreenshotUrls.map(String) : [],
      url: String(result.trackViewUrl ?? "")
    };
  }
  async function getText(url, headers) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(3e4) });
    if (res.status === 429) {
      throw new Error(`${url} \u2192 429 (h\u0131z s\u0131n\u0131r\u0131). Birka\xE7 dakika bekleyip tekrar dene.`);
    }
    if (!res.ok) throw new Error(`${url} \u2192 ${res.status}`);
    return res.text();
  }
  async function fetchPublicListing(appId, opts = {}) {
    const country = (opts.country ?? "us").toLowerCase();
    const warnings = [];
    const sources = [];
    const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=${country}`;
    const raw = await getText(lookupUrl, { "User-Agent": UA, Accept: "application/json" });
    sources.push(lookupUrl);
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new Error("iTunes Lookup JSON de\u011Fil \u2014 Apple hata sayfas\u0131 d\xF6nd\xFCrm\xFC\u015F olabilir.");
    }
    const result = payload?.results?.[0];
    if (!result) {
      throw new Error(
        `${appId} ${country.toUpperCase()} vitrininde bulunamad\u0131. Uygulama hen\xFCz yay\u0131nda de\u011Filse burada H\u0130\xC7 g\xF6r\xFCnmez \u2014 bu normaldir, vitrin yaln\u0131z yay\u0131ndaki s\xFCr\xFCm\xFC bilir.`
      );
    }
    const listing = {
      appId: String(appId),
      country,
      url: "",
      name: "",
      description: "",
      releaseNotes: "",
      version: "",
      sellerName: "",
      bundleId: "",
      category: "",
      categories: [],
      ageRating: "",
      advisories: [],
      languages: [],
      price: null,
      currency: "",
      formattedPrice: "",
      ratingAverage: null,
      ratingCount: null,
      icon: "",
      screenshots: [],
      ipadScreenshots: [],
      iaps: [],
      iapListTruncated: false,
      sources,
      warnings,
      ...parseLookup(result)
    };
    listing.sources = sources;
    listing.warnings = warnings;
    if (opts.withPage === false) return listing;
    await sleep(600);
    const pageUrl = listing.url || `https://apps.apple.com/${country}/app/id${appId}`;
    try {
      const html = await getText(pageUrl, PAGE_HEADERS);
      sources.push(pageUrl);
      const { iaps, warnings: uyarilar } = parseStorePage(html);
      listing.iaps = iaps;
      listing.iapListTruncated = iaps.length >= IAP_SAYFA_TAVANI;
      warnings.push(...uyarilar);
      if (listing.iapListTruncated) {
        warnings.push(
          `Vitrin en \xE7ok ${IAP_SAYFA_TAVANI} \xFCr\xFCn g\xF6steriyor; \xFCr\xFCn say\u0131s\u0131 bunun \xFCst\xFCndeyse gerisi burada YOK.`
        );
      }
    } catch (e) {
      warnings.push(`\xDCr\xFCn sayfas\u0131 okunamad\u0131, IAP fiyatlar\u0131 al\u0131namad\u0131: ${e.message}`);
    }
    return listing;
  }
  function crossCheckPrices(ours, theirs) {
    const norm2 = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const map = new Map(theirs.map((t) => [norm2(t.name), t]));
    const out = [];
    for (const mine of ours) {
      const hit = map.get(norm2(mine.name));
      if (!hit || hit.price === null) continue;
      out.push({
        productName: mine.name,
        ours: mine.price,
        theirs: hit.price,
        verdict: mine.price === 0 && hit.price > 0 ? "bizde okunamad\u0131" : Math.abs(mine.price - hit.price) < 0.01 ? "uyu\u015Fuyor" : "\xC7EL\u0130\u015E\u0130YOR"
      });
    }
    return out;
  }
  var UA, PAGE_HEADERS, IAP_SAYFA_TAVANI, sleep, stripTags;
  var init_public_store = __esm({
    "src/fetch/public-store.ts"() {
      "use strict";
      UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
      PAGE_HEADERS = {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      };
      IAP_SAYFA_TAVANI = 10;
      sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      stripTags = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/\s+/g, " ").trim();
    }
  });

  // src/check/price-crosscheck.ts
  var price_crosscheck_exports = {};
  __export(price_crosscheck_exports, {
    crossCheckMissingPrices: () => crossCheckMissingPrices
  });
  async function crossCheckMissingPrices(sub, opts = {}) {
    const fiyatsiz = sub.iap.filter(okunamadi);
    if (!fiyatsiz.length) return { findings: [], notChecked: [] };
    const etiket = fiyatsiz.map((p) => p.name || p.id).slice(0, 5).join(", ");
    const kuyruk = fiyatsiz.length > 5 ? " \u2026" : "";
    if (opts.enabled === false) {
      return {
        findings: [],
        notChecked: [
          `${fiyatsiz.length} \xFCr\xFCn\xFCn fiyat\u0131 okunamad\u0131 (${etiket}${kuyruk}) ve vitrin do\u011Frulamas\u0131 kapal\u0131 \u2014 bu \xFCr\xFCnlerde fiyata bakan kurallar yan\u0131labilir.`
        ]
      };
    }
    const { storefrontOf: storefrontOf2 } = await Promise.resolve().then(() => (init_apple_tables(), apple_tables_exports));
    const vitrinKodu = storefrontOf2(opts.country);
    const uyari = [];
    if (opts.country && !vitrinKodu) {
      uyari.push(`"${opts.country}" vitrin koduna \xE7evrilemedi; ABD vitrini kullan\u0131ld\u0131.`);
    }
    let listing;
    try {
      const { fetchPublicListing: fetchPublicListing2 } = await Promise.resolve().then(() => (init_public_store(), public_store_exports));
      listing = await fetchPublicListing2(sub.appId, { country: vitrinKodu });
    } catch (e) {
      return {
        findings: [],
        notChecked: [
          `${fiyatsiz.length} \xFCr\xFCn\xFCn fiyat\u0131 okunamad\u0131 ve vitrinden do\u011Frulanamad\u0131: ${e.message}`
        ]
      };
    }
    const { crossCheckPrices: crossCheckPrices2 } = await Promise.resolve().then(() => (init_public_store(), public_store_exports));
    const kontrol = crossCheckPrices2(
      sub.iap.map((p) => ({ name: p.name, price: p.price })),
      listing.iaps
    );
    const findings = [];
    const notChecked = [...uyari];
    const eslesen = new Set(kontrol.map((k) => k.productName));
    for (const k of kontrol) {
      if (k.verdict === "uyu\u015Fuyor") continue;
      if (k.verdict === "bizde okunamad\u0131") {
        findings.push({
          checkId: "lint-price-unreadable-but-live",
          platform: sub.platform,
          severity: "medium",
          artifact: "iap",
          message: `"${k.productName}" fiyat\u0131 App Store Connect'ten okunamad\u0131 (0 yaz\u0131ld\u0131) ama App Store vitrininde ${k.theirs} ${listing.currency} g\xF6r\xFCn\xFCyor. Fiyata bakan kurallar bu \xFCr\xFCnde "bedava" sanarak yan\u0131l\u0131r.`,
          suggestedFix: '\xC7ekimi yenile; sorun s\xFCrerse fiyat \xE7izelgesi ucunun yan\u0131t\u0131na bak (\xE7ekim g\xFCnl\xFC\u011F\xFC \u2192 "Okunamayan u\xE7lar").'
        });
        continue;
      }
      findings.push({
        checkId: "lint-price-store-mismatch",
        platform: sub.platform,
        severity: "medium",
        artifact: "iap",
        message: `"${k.productName}" i\xE7in App Store Connect ${k.ours} diyor, App Store vitrini ${k.theirs} ${listing.currency} g\xF6steriyor. Yeni m\xFC\u015Fterinin g\xF6rd\xFC\u011F\xFC fiyat vitrindeki.`,
        suggestedFix: "\xDCr\xFCn\xFCn fiyat \xE7izelgesini kontrol et: eski m\xFC\u015Fterilere korunan (preserved) fiyat ile g\xFCncel fiyat kar\u0131\u015Fm\u0131\u015F olabilir."
      });
    }
    const eslesmeyen = fiyatsiz.filter((p) => !eslesen.has(p.name));
    if (eslesmeyen.length) {
      notChecked.push(
        `${eslesmeyen.length} \xFCr\xFCn\xFCn fiyat\u0131 okunamad\u0131 ve vitrinde e\u015Fle\u015Fmedi (${eslesmeyen.map((p) => p.name || p.id).slice(0, 5).join(", ")}): \xFCr\xFCn hen\xFCz yay\u0131nda olmayabilir. Ad zorla e\u015Fle\u015Ftirilmedi.`
      );
    }
    if (listing.iapListTruncated) {
      notChecked.push(
        "Vitrin en fazla 10 \xFCr\xFCn g\xF6steriyor; listedeki eksik \xFCr\xFCnler do\u011Frulanamad\u0131."
      );
    }
    return { findings, notChecked };
  }
  var okunamadi;
  var init_price_crosscheck = __esm({
    "src/check/price-crosscheck.ts"() {
      "use strict";
      okunamadi = (p) => !Number.isFinite(p.price) || p.price === 0;
    }
  });

  // src/check/prompt.ts
  function renderSubmissionText(sub) {
    const lines = [
      `# DENETLENECEK LISTING`,
      `Platform: ${sub.platform}`,
      `Uygulama: ${sub.appName} (${sub.appId})`,
      `Kategori: ${sub.category} | Ya\u015F s\u0131n\u0131f\u0131: ${sub.ageRating} | Dil: ${sub.locale}`,
      ``,
      `## Metin alanlar\u0131`
    ];
    for (const [k, v] of Object.entries(sub.text)) if (v) lines.push(`### ${k}
${v}
`);
    if (sub.iap.length) {
      lines.push(`## Uygulama i\xE7i sat\u0131n alma / abonelikler`);
      for (const i of sub.iap) {
        const trial = i.freeTrial ? ` | \xFCcretsiz deneme: ${i.freeTrial.duration}` : "";
        const dur = i.duration ? ` | d\xF6nem: ${i.duration}` : "";
        lines.push(`- id=${i.id} [${i.kind}] "${i.name}" \u2014 ${i.price} ${i.currency}${dur}${trial}`);
        if (i.description) lines.push(`  a\xE7\u0131klama: ${i.description}`);
      }
      lines.push("");
    }
    lines.push(`## URL'ler`);
    for (const [k, v] of Object.entries(sub.urls)) if (v) lines.push(`- ${k}: ${v}`);
    lines.push("");
    lines.push(`## Review notlar\u0131`);
    lines.push(sub.reviewNotes.notes ?? "(yok)");
    lines.push(`Demo hesap: ${sub.reviewNotes.demoAccount ? "var" : "YOK"}`);
    lines.push(...renderDeclarations(sub));
    return lines.join("\n");
  }
  function renderDeclarations(sub) {
    const d = sub.declarations;
    if (!d) return [];
    const out = ["", `## App Store Connect beyanlar\u0131`];
    if (d.age) {
      const sinyal = Object.entries(d.age.sinyaller).map(([k, v]) => v === true ? k : `${k}=${v}`).join(", ");
      out.push(
        `Ya\u015F beyan\u0131 (${d.age.kaynak === "surum" ? "s\xFCr\xFCm bazl\u0131" : "uygulama bazl\u0131"}): ` + (sinyal || "i\xE7erik i\u015Fareti yok") + ` \xB7 ${d.age.noneSayisi} alan NONE` + (d.age.beyanEdilmemis.length ? ` \xB7 ${d.age.beyanEdilmemis.length} alan beyan edilmemi\u015F` : "") + (d.age.ustunKilma ? ` \xB7 \xFCst\xFCn k\u0131lma ${d.age.ustunKilma}` : "")
      );
    } else {
      out.push("Ya\u015F beyan\u0131: \xC7EK\u0130LMED\u0130 \u2014 bu konuda h\xFCk\xFCm kurma.");
    }
    if (d.privacy) {
      out.push(
        `Gizlilik etiketi: ${d.privacy.satirlar.length} sat\u0131r` + (d.privacy.takip ? " \xB7 KULLANICIYI TAK\u0130P ETT\u0130\u011E\u0130N\u0130 BEYAN ETM\u0130\u015E" : " \xB7 takip beyan\u0131 yok") + (d.privacy.kimlikleBagli ? " \xB7 veriler kimlikle ba\u011Fl\u0131" : "")
      );
    } else {
      out.push("Gizlilik etiketi: \xC7EK\u0130LMED\u0130 \u2014 bu konuda h\xFCk\xFCm kurma.");
    }
    if (d.icerikHaklari) {
      out.push(
        `\xDC\xE7\xFCnc\xFC taraf i\xE7erik: ${d.icerikHaklari === "USES_THIRD_PARTY_CONTENT" ? "KULLANIYOR beyan\u0131" : "kullanm\u0131yor beyan\u0131"}`
      );
    }
    if (d.ozelSayfalar?.length) {
      out.push(
        `\xD6zel \xFCr\xFCn sayfas\u0131: ${d.ozelSayfalar.length} adet (${d.ozelSayfalar.slice(0, 5).map((s) => s.ad).join(", ")}) \u2014 bu sayfalar\u0131n metin ve g\xF6rselleri bu denetime DAH\u0130L DE\u011E\u0130L.`
      );
    }
    return out;
  }
  function renderRuleCard(card, lessons = [], officialText = "") {
    return [
      `# UYGULANACAK KURAL`,
      ``,
      `Kural id: ${card.id}`,
      `Kaynak: ${card.source.doc} ${card.source.section}`,
      ``,
      `## Kural`,
      card.ruleText.trim(),
      ``,
      ...renderOfficialText(card, officialText),
      ...renderFacts(card),
      `## Sana sorulan`,
      card.question.trim(),
      ``,
      `## \u0130hlal SAYILAN \xF6rnek`,
      card.positiveExample,
      ``,
      `## \u0130hlal SAYILMAYAN \xF6rnek`,
      card.negativeExample,
      ``,
      ...renderLessons(lessons),
      ...renderNotViolation(card),
      `Yaln\u0131zca yukar\u0131daki kurala g\xF6re de\u011Ferlendir. \u0130hlal yoksa {"findings": []} d\xF6nd\xFCr.`
    ].join("\n");
  }
  function renderOfficialText(card, officialText) {
    const metin = officialText.trim();
    if (!metin) return [];
    const kirpildi = metin.length > OFFICIAL_TEXT_LIMIT;
    return [
      `## Apple'\u0131n kendi metni (${card.source.section})`,
      `(Do\u011Frudan App Review Guidelines'tan. Terimleri bununla yorumla;`,
      ` sana sorulan soru yine a\u015Fa\u011F\u0131daki "Sana sorulan" b\xF6l\xFCm\xFCd\xFCr.)`,
      ``,
      kirpildi ? metin.slice(0, OFFICIAL_TEXT_LIMIT) : metin,
      ...kirpildi ? [``, `[Madde metni burada k\u0131rp\u0131ld\u0131. Tamam\u0131: ${card.source.url}]`] : [],
      ``
    ];
  }
  function renderLessons(lessons) {
    if (!lessons.length) return [];
    return [
      `## Bu kuralda ge\xE7mi\u015Fte ya\u015Fanm\u0131\u015F red'ler`,
      `(Ger\xE7ek reviewer kararlar\u0131ndan \xE7\u0131kar\u0131ld\u0131. Kural\u0131n pratikte nas\u0131l`,
      ` uyguland\u0131\u011F\u0131n\u0131 g\xF6sterir; kural\u0131n YER\u0130NE GE\xC7MEZ. Bir ders kural\u0131n`,
      ` kapsamad\u0131\u011F\u0131 bir \u015Feyi yasakl\u0131yorsa kural kazan\u0131r.)`,
      ``,
      ...lessons.flatMap((l) => [
        `- **${l.title}** \u2014 ${l.summary}`,
        // Özet "ne olduğunu" söylüyor, belirtiler "neye bakacağını". İkincisi
        // olmadan model dersi okuyor ama uygulayamıyordu.
        ...l.signals?.length ? [`  Belirtiler: ${l.signals.join(" \xB7 ")}`] : [],
        // Kartın negativeExample'ının ders karşılığı. Onsuz ders, benzeyen ama
        // masum listing'lerde de ateşliyor — ve yalancı alarm, dersin
        // getirdiği isabetten daha pahalı.
        ...l.falsePositive ? [`  SAYILMAZ: ${l.falsePositive}`] : []
      ]),
      ``
    ];
  }
  function renderNotViolation(card) {
    if (!card.notViolation?.length) return [];
    return [
      `## BULGU \xDCRETME \u2014 bunlar ihlal DE\u011E\u0130LD\u0130R`,
      `A\u015Fa\u011F\u0131dakilerden birine giren bir i\xE7erik i\xE7in bulgu \xFCretme, teredd\xFCt etme:`,
      ...card.notViolation.map((n) => `- ${n}`),
      ``
    ];
  }
  function renderFacts(card) {
    if (!card.facts?.length) return [];
    return [`## Bu kural\u0131 uygularken do\u011Fru kabul et`, ...card.facts.map((f) => `- ${f}`), ``];
  }
  async function submissionPrefix(sub, opts) {
    const blocks = [{ type: "text", text: renderSubmissionText(sub) }];
    const gorselVar = sub.media.screenshots.length > 0 || !!sub.media.icon;
    if (opts.withImages && gorselVar) {
      if (!opts.loadImage) {
        throw new Error("submissionPrefix: withImages true ama g\xF6rsel y\xFCkleyici verilmedi");
      }
      const byClass = /* @__PURE__ */ new Map();
      for (const shot of sub.media.screenshots) {
        const key = shot.deviceClass ?? "-";
        byClass.set(key, [...byClass.get(key) ?? [], shot]);
      }
      const isPhone = (k) => /phone/i.test(k);
      const ranked = [...byClass.entries()].sort(
        (a, b) => Number(isPhone(b[0])) - Number(isPhone(a[0])) || b[1].length - a[1].length
      );
      const [mainClass, mainShots] = ranked[0] ?? ["-", []];
      const chosen = mainShots.slice(0, MAX_IMAGES);
      if (chosen.length) {
        const others = ranked.slice(1).map(([k, v]) => `${k}: ${v.length}`);
        blocks.push({
          type: "text",
          text: `[G\xF6sterilen: ${mainClass} cihaz s\u0131n\u0131f\u0131n\u0131n ${chosen.length}/${mainShots.length} ekran g\xF6r\xFCnt\xFCs\xFC. ` + (others.length ? `G\xF6sterilmeyen s\u0131n\u0131flar \u2014 ${others.join(", ")}. ` : "") + 'H\xFCkm\xFCn\xFC YALNIZCA g\xF6sterilenlere dayand\u0131r; g\xF6sterilmeyenler hakk\u0131nda ne olumlu ne olumsuz h\xFCk\xFCm kurma. "\xC7o\u011Funluk" de\u011Ferlendirmesi g\xF6sterilen k\xFCme i\xE7indir.]'
        });
      }
      for (const shot of chosen) {
        const img = await opts.loadImage(shot.path);
        if (!img) continue;
        blocks.push({ type: "text", text: `[Ekran g\xF6r\xFCnt\xFCs\xFC id=${shot.id} s\u0131ra=${shot.order}]` });
        blocks.push({ type: "image", mime: img.mime, base64: img.b64 });
      }
    }
    return blocks;
  }
  var CHECKER_SYSTEM, FINDINGS_SCHEMA, VERDICT_SCHEMA, OFFICIAL_TEXT_LIMIT, MAX_IMAGES;
  var init_prompt = __esm({
    "src/check/prompt.ts"() {
      "use strict";
      CHECKER_SYSTEM = `Sen bir ma\u011Faza politikas\u0131 denet\xE7isisin. App Store ve Google Play listing'lerini, sana verilen TEK bir politika kural\u0131na kar\u015F\u0131 denetliyorsun.

Kurallar:
- SADECE sana verilen kural\u0131 uygula. Ba\u015Fka bir politika ihlali g\xF6rsen bile raporlama.
- Her bulgu i\xE7in, i\xE7erikten B\u0130REB\u0130R al\u0131nt\u0131 ver. Al\u0131nt\u0131y\u0131 yeniden yazma, \xF6zetleme, d\xFCzeltme \u2014 kopyala.
- Emin de\u011Filsen bulgu \xFCretme. Bu ara\xE7 yalanc\u0131 alarm \xFCretirse kimse kullanmaz.
- Kart\u0131n "ihlal olmayan \xF6rnek" alan\u0131 s\u0131n\u0131r\u0131 belirler. Ona benzeyen bir \u015Fey ihlal de\u011Fildir.
- Pazarlama dili tek ba\u015F\u0131na ihlal de\u011Fildir. \u0130hlal, kural\u0131n a\xE7\u0131k\xE7a yasaklad\u0131\u011F\u0131 \u015Feydir.
- \u0130hlal yoksa bo\u015F liste d\xF6nd\xFCr. Bu normal ve beklenen bir sonu\xE7tur.
- Yaln\u0131zca JSON d\xF6nd\xFCr. A\xE7\u0131klama, \xF6ns\xF6z, markdown yok.
- rationale ve suggestedFix EN FAZLA 2 k\u0131sa c\xFCmle olsun. Tekrar etme, uzatma.`;
      FINDINGS_SCHEMA = {
        type: "object",
        additionalProperties: false,
        required: ["findings"],
        properties: {
          findings: {
            type: "array",
            // ALAN SIRASI ÖNEMLİ: şema grameri alanları bu sırayla ürettirir.
            // Kritik alanlar önce gelsin ki bir kesilme olursa en değerli kısım elde kalsın.
            //
            // maxLength ZORUNLU: sınırsız bir metin alanında küçük modeller tekrar
            // döngüsüne girip tüm çıktı bütçesini yakıyor ve JSON yarıda kesiliyor.
            // Bu, yerel modelde gözlemlenen 1 numaralı hata.
            items: {
              type: "object",
              additionalProperties: false,
              // OpenAI katı şema modu properties'teki HER anahtarın required'da
              // olmasını ister; opsiyonellik nullable tiple ifade edilir.
              // Ollama da bu biçimi kabul ediyor — tek şema iki motoru da besliyor.
              required: ["artifact", "excerpt", "severity", "suggestedFix", "rationale", "mediaId", "iapId"],
              properties: {
                artifact: { type: "string", maxLength: 40, description: "description | subtitle | keywords | screenshots | iap ..." },
                excerpt: { type: "string", maxLength: 300, description: "\u0130\xE7erikten B\u0130REB\u0130R al\u0131nt\u0131" },
                severity: { type: "string", enum: ["high", "medium", "low"] },
                suggestedFix: { type: "string", maxLength: 200 },
                rationale: { type: "string", maxLength: 300, description: "En fazla 2 c\xFCmle" },
                mediaId: { type: ["string", "null"], maxLength: 60, description: "artifact=screenshots ise ekran g\xF6r\xFCnt\xFCs\xFC id, de\u011Filse null" },
                iapId: { type: ["string", "null"], maxLength: 80, description: "artifact=iap ise paket id, de\u011Filse null" }
              }
            }
          }
        }
      };
      VERDICT_SCHEMA = {
        type: "object",
        additionalProperties: false,
        required: ["violates", "reason"],
        properties: {
          violates: { type: "boolean" },
          reason: { type: "string", maxLength: 200 }
        }
      };
      OFFICIAL_TEXT_LIMIT = 6e3;
      MAX_IMAGES = 10;
    }
  });

  // src/check/check.ts
  var check_exports = {};
  __export(check_exports, {
    runCheck: () => runCheck
  });
  async function runCheck(llm, sub, rules, lessonsByRule = /* @__PURE__ */ new Map(), onProgress, opts = {}) {
    const textPrefix = await submissionPrefix(sub, { withImages: false, loadImage: opts.loadImage });
    const visionPrefix = llm.supportsVision ? await submissionPrefix(sub, { withImages: true, loadImage: opts.loadImage }) : textPrefix;
    const imagesInPrefix = visionPrefix.filter((b) => b.type === "image").length;
    const prefixFor = (r) => needsVision(r) ? visionPrefix : textPrefix;
    const stats = {
      rulesRun: 0,
      truncated: 0,
      unparsable: 0,
      skippedNoVision: [],
      basarisiz: [],
      imagesUsed: imagesInPrefix,
      imagesTotal: sub.media.screenshots.length,
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      ms: 0,
      firstCallMs: 0,
      avgCallMs: 0
    };
    const findings = [];
    const t0 = Date.now();
    const kisaHata = (e) => {
      const m = String(e?.message ?? e);
      if (/429/.test(m)) {
        const lim = /Limit (\d+)/.exec(m)?.[1];
        return `oran s\u0131n\u0131r\u0131 (429)${lim ? ` \u2014 hesab\u0131n dakikal\u0131k token s\u0131n\u0131r\u0131 ${lim}` : ""}`;
      }
      if (/timeout|aborted/i.test(m)) return "zaman a\u015F\u0131m\u0131";
      return m.slice(0, 160);
    };
    const runnable = [];
    for (const r of rules) {
      if (needsVision(r) && imagesInPrefix === 0) stats.skippedNoVision.push(r.id);
      else runnable.push(r);
    }
    const queue = [...runnable];
    const workers = Math.max(1, llm.concurrency);
    await Promise.all(
      Array.from({ length: workers }, async () => {
        for (; ; ) {
          const rule = queue.shift();
          if (!rule) return;
          try {
            const got = await one(
              llm,
              sub,
              prefixFor(rule),
              rule,
              lessonsByRule.get(rule.id) ?? [],
              opts.guidelineText?.(rule.source.section) ?? "",
              stats
            );
            findings.push(...got);
          } catch (e) {
            stats.basarisiz.push({ id: rule.id, sebep: kisaHata(e) });
          }
          onProgress?.(stats.rulesRun, runnable.length, rule.id, stats.ms);
        }
      })
    );
    stats.ms = Date.now() - t0;
    stats.avgCallMs = stats.rulesRun ? Math.round(stats.ms / stats.rulesRun) : 0;
    return { findings, stats };
  }
  async function one(llm, sub, prefix, rule, lessons, officialText, stats) {
    const res = await llm.complete({
      system: CHECKER_SYSTEM,
      prefix,
      suffix: renderRuleCard(rule, lessons, officialText),
      schema: FINDINGS_SCHEMA,
      maxTokens: 2048,
      temperature: 0
      // denetim deterministik olsun
    });
    if (stats.rulesRun === 0) stats.firstCallMs = res.usage.ms;
    stats.rulesRun++;
    stats.inputTokens += res.usage.inputTokens;
    stats.outputTokens += res.usage.outputTokens;
    stats.cachedTokens += res.usage.cachedTokens;
    if (res.truncated) stats.truncated++;
    const parsed = res.json;
    if (!parsed?.findings) {
      if (res.raw.trim().length > 0) stats.unparsable++;
      return [];
    }
    return parsed.findings.map((f) => ({
      ...toFinding(sub, rule, f),
      lessonIds: lessons.map((l) => l.id)
    }));
  }
  function needsVision(card) {
    if (card.requiresVision) return true;
    const visual = ["screenshots", "icon", "previewVideo"];
    return card.needs.some((n) => visual.includes(n));
  }
  function toFinding(sub, rule, raw) {
    return {
      ruleId: rule.id,
      platform: sub.platform,
      // ŞİDDET KARTIN, MODELİN DEĞİL.
      //
      // Eskiden `raw.severity ?? rule.defaultSeverity` idi, yani modelin dediği
      // kazanıyordu. Sahada model 15 bulgunun 15'ine de "high" dedi — kartların
      // yarısı "medium" olarak kalibre edilmiş olmasına rağmen. O sinyal bilgi
      // taşımıyor, yalnızca skoru şişiriyordu.
      //
      // Kavramsal olarak da doğrusu bu: şiddet KURALA dair bir politika kararı,
      // örneğe dair değil. Onu maddeyi okuyup kartı yazan kişi belirler. Modelin
      // işi "bu kural çiğnenmiş mi", "bu kural ne kadar ciddi" değil.
      severity: rule.defaultSeverity,
      outcome: rule.outcome === "manual" ? "risk" : rule.outcome,
      // manual kart buraya hiç gelmez
      artifact: raw.artifact,
      locator: toLocator(raw),
      excerpt: raw.excerpt ?? "",
      rationale: raw.rationale ?? "",
      suggestedFix: raw.suggestedFix ?? "",
      confidence: 0
    };
  }
  function toLocator(raw) {
    if (raw.mediaId) return { type: "image", mediaId: raw.mediaId };
    if (raw.iapId) return { type: "iap", iapId: raw.iapId };
    const field = TEXT_FIELDS.find((f) => f === raw.artifact);
    if (field) return { type: "text", field };
    return { type: "field", field: raw.artifact };
  }
  var TEXT_FIELDS;
  var init_check = __esm({
    "src/check/check.ts"() {
      "use strict";
      init_prompt();
      TEXT_FIELDS = [
        "name",
        "subtitle",
        "shortDescription",
        "description",
        "keywords",
        "promotionalText",
        "whatsNew"
      ];
    }
  });

  // src/check/verify.ts
  var verify_exports = {};
  __export(verify_exports, {
    verifyFindings: () => verifyFindings
  });
  async function verifyFindings(llm, sub, findings, rulesById) {
    const kept = [];
    const dropped = [];
    for (const f of findings) {
      const rule = rulesById.get(f.ruleId);
      if (!rule) continue;
      let agree = 0;
      for (let i = 0; i < VOTES; i++) {
        if (await askOne(llm, sub, f, rule, i)) agree++;
      }
      const decorated = {
        ...f,
        confidence: agree / VOTES,
        trace: { ...f.trace, verifyVotes: { agree, total: VOTES } }
      };
      if (agree >= THRESHOLD) kept.push(decorated);
      else dropped.push(decorated);
    }
    return { kept, dropped };
  }
  async function askOne(llm, sub, f, rule, vote) {
    const prompt = [
      `## Kural`,
      rule.ruleText.trim(),
      ``,
      `## Bu kural neyi sorguluyor`,
      rule.question.trim(),
      ``,
      ...renderFacts(rule),
      `## \u0130hlal SAYILAN \xF6rnek`,
      rule.positiveExample,
      ``,
      `## \u0130hlal SAYILMAYAN \xF6rnek`,
      rule.negativeExample,
      ``,
      ...renderNotViolation(rule),
      `## De\u011Ferlendirilecek i\xE7erik`,
      `Alan: ${f.artifact}`,
      `\u0130\xE7erik: "${f.excerpt}"`,
      ``,
      `## Ba\u011Flam`,
      contextFor(sub, f),
      ``,
      MERCEKLER[vote % MERCEKLER.length]
    ].join("\n");
    const res = await llm.complete({
      system: VERIFIER_SYSTEM,
      // Doğrulamada ortak prefix yok — bilerek. Her bulgu dar bir pencereyle
      // tek başına yargılanır; tüm listing'i görseydi ilk turu tekrar ederdi.
      prefix: [{ type: "text", text: prompt }],
      suffix: "Karar\u0131n\u0131 ver.",
      schema: VERDICT_SCHEMA,
      maxTokens: 512,
      temperature: 0.5,
      seed: 1e3 + vote
    });
    const parsed = res.json;
    return parsed?.violates === true;
  }
  function contextFor(sub, f) {
    if (f.locator.type !== "text") return "(g\xF6rsel/alan bulgusu \u2014 ek ba\u011Flam yok)";
    const field = sub.text[f.locator.field];
    if (!field) return "(ba\u011Flam bulunamad\u0131)";
    const idx = field.indexOf(f.excerpt);
    if (idx < 0) return field.slice(0, 400);
    return field.slice(Math.max(0, idx - 200), idx + f.excerpt.length + 200);
  }
  var VOTES, THRESHOLD, MERCEKLER, VERIFIER_SYSTEM;
  var init_verify = __esm({
    "src/check/verify.ts"() {
      "use strict";
      init_prompt();
      VOTES = 3;
      THRESHOLD = 2;
      MERCEKLER = [
        "Bu i\xE7erik yukar\u0131daki kural\u0131 ihlal ediyor mu? Kural\u0131n A\xC7IK\xC7A yasaklad\u0131\u011F\u0131 \u015Fey mi?",
        '\xD6NCE MUAF\u0130YETE BAK: bu i\xE7erik, "ihlal SAYILMAYAN \xF6rnek" ya da "BULGU \xDCRETME" listesindeki durumlardan birine giriyor mu? Giriyorsa violates=false d\xF6nd\xFCr. Yaln\u0131zca hi\xE7birine girmiyorsa ve kural a\xE7\u0131k\xE7a yasakl\u0131yorsa violates=true d\xF6nd\xFCr.',
        "App Review bu i\xE7eri\u011Fi g\xF6rd\xFC\u011F\xFCnde bunu tek ba\u015F\u0131na bir RED sebebi yapar m\u0131yd\u0131? S\u0131radan pazarlama dili ya da uygulaman\u0131n ne yapt\u0131\u011F\u0131n\u0131 anlatan ifade red sebebi de\u011Fildir. Emin de\u011Filsen violates=false d\xF6nd\xFCr."
      ];
      VERIFIER_SYSTEM = 'Sen bir politika hakemisin. Sana bir kural ve bir i\xE7erik par\xE7as\u0131 verilir; i\xE7eri\u011Fin o kural\u0131 ihlal edip etmedi\u011Fine karar verirsin.\n\u0130ki \xF6rne\u011Fe de bak: i\xE7erik "ihlal say\u0131lan" \xF6rne\u011Fe benziyorsa violates=true, "ihlal say\u0131lmayan" \xF6rne\u011Fe benziyorsa violates=false.\nSana verilen olgular\u0131 do\u011Fru kabul et; kendi haf\u0131zandan do\u011Frulamaya \xE7al\u0131\u015Fma.\nHi\xE7bir \xF6rne\u011Fe benzemiyorsa ve kural a\xE7\u0131k\xE7a yasaklam\u0131yorsa violates=false.\nYaln\u0131zca JSON d\xF6nd\xFCr.';
    }
  });

  // src/ext/audit.ts
  var audit_exports = {};
  __export(audit_exports, {
    CORPUS_VERSION: () => CORPUS_VERSION,
    META_FIELDS: () => META_FIELDS,
    META_GROUPS: () => META_GROUPS,
    META_KEYS: () => META_KEYS,
    audit: () => audit,
    coverageReport: () => coverageReport,
    fullAudit: () => fullAudit,
    kapsamOrani: () => kapsamOrani,
    kartKapsiyorMu: () => kartKapsiyorMu,
    lintSection: () => lintSection,
    normalizeGuideline: () => normalizeSection,
    submissionFromDump: () => submissionFromDump,
    surumDurumu: () => surumDurumu
  });

  // src/meta-fields.ts
  var META_GROUPS = [
    {
      id: "icerik",
      title: "Kullan\u0131c\u0131lar ve i\xE7erik",
      hint: "Uygulaman\u0131n kimden ne ald\u0131\u011F\u0131 ve kime ne g\xF6sterdi\u011Fi."
    },
    {
      id: "is-modeli",
      title: "\u0130\u015F modeli ve para",
      hint: "\xD6deme kurallar\u0131n\u0131n hangi dal\u0131na d\xFC\u015Ft\xFC\u011F\xFCn. \xC7o\u011Fu uygulamada \xFC\xE7\xFC de \u201Chay\u0131r\u201D."
    },
    {
      id: "tur",
      title: "Uygulama t\xFCr\xFC",
      hint: "Apple\u2019\u0131n ayr\u0131 kural seti yazd\u0131\u011F\u0131 \xF6zel t\xFCrler. \xC7o\u011Fu uygulamada \xFC\xE7\xFC de \u201Chay\u0131r\u201D."
    }
  ];
  var META_FIELDS = [
    // ---------------------------------------------------------------------
    // Kullanıcılar ve içerik
    // ---------------------------------------------------------------------
    {
      key: "requiresLogin",
      label: "Giri\u015F gerekiyor",
      group: "icerik",
      flag: "requires-login",
      tldr: "Ana i\u015Flevi g\xF6rmek i\xE7in hesap \u015Fart m\u0131?",
      what: "Reviewer uygulamay\u0131 ilk a\xE7t\u0131\u011F\u0131nda, ana i\u015Fleve ula\u015Fmak i\xE7in hesap a\xE7mak ya da giri\u015F yapmak zorunda m\u0131? \xD6l\xE7\xFC \u201Cgiri\u015F ekran\u0131 var m\u0131\u201D de\u011Fil \u2014 \xF6l\xE7\xFC, giri\u015F yapmadan uygulaman\u0131n i\u015Fini g\xF6r\xFCp g\xF6remedi\u011Fi.",
      yes: [
        "A\xE7\u0131l\u0131\u015Fta atlanamayan kay\u0131t/giri\u015F duvar\u0131 var",
        "Ana \xF6zellik yaln\u0131zca hesapla \xE7al\u0131\u015F\u0131yor (\xFCretim, kaydetme, ge\xE7mi\u015F)",
        "Yaln\u0131zca sosyal giri\u015Fle giriliyor (Google, Facebook, X, Meta)",
        "SMS/OTP, davet kodu ya da kurumsal SSO gerekiyor"
      ],
      no: [
        "Giri\u015F iste\u011Fe ba\u011Fl\u0131; misafir olarak t\xFCm ana i\u015Flev kullan\u0131labiliyor",
        "Hesap yaln\u0131zca ikincil bir \u015Fey i\xE7in (bulut yede\u011Fi, cihazlar aras\u0131 e\u015Fitleme)",
        "Sadece sat\u0131n alma s\u0131ras\u0131nda Apple hesab\u0131 isteniyor \u2014 o senin giri\u015F duvar\u0131n de\u011Fil"
      ],
      effect: "Review notlar\u0131nda \xE7al\u0131\u015Fan bir demo hesap aran\u0131r; yoksa y\xFCksek \xF6nemli bulgu \xFCretilir (Apple 2.1 \u2014 en s\u0131k red sebeplerinden). 5.1.1(v) \u201C\xF6nemli hesap \xF6zelli\u011Fi yoksa giri\u015Fsiz kulland\u0131r\u201D kart\u0131 da bu alana bakar.",
      source: "API ipucu: App Review Information\u2019daki \u201CSign-In Required\u201D kutusu. \u0130\u015Faretli de\u011Filse ASC bir \u015Fey s\xF6ylemez, alan \u201C?\u201D kal\u0131r."
    },
    {
      key: "hasThirdPartyLogin",
      label: "\xDC\xE7\xFCnc\xFC taraf giri\u015F",
      group: "icerik",
      flag: "third-party-login",
      tldr: "Google/Facebook/X gibi bir servisle giri\u015F sunuluyor mu?",
      what: "Kullan\u0131c\u0131 uygulamadaki ANA hesab\u0131n\u0131 \xFC\xE7\xFCnc\xFC taraf ya da sosyal bir servisle mi kuruyor? \u201CGiri\u015F gerekiyor\u201Ddan ayr\u0131 bir soru: 4.8 yaln\u0131zca sosyal/\xFC\xE7\xFCnc\xFC taraf giri\u015F sunanlar\u0131 ba\u011Flar, yaln\u0131z e-posta+\u015Fifre ile giri\u015F yapt\u0131ran uygulama muaft\u0131r.",
      yes: [
        "Giri\u015F ekran\u0131nda \u201CContinue with Google / Facebook / X / LinkedIn / Amazon / WeChat\u201D var",
        "Kay\u0131t yaln\u0131zca sosyal hesapla yap\u0131labiliyor"
      ],
      no: [
        "Yaln\u0131z e-posta+\u015Fifre ya da telefon+OTP",
        "Yaln\u0131z kendi kurumsal hesap sistemin (okul/\u015Firket SSO)",
        "Devlet ya da end\xFCstri destekli kimlik sistemi",
        "Uygulama zaten belirli bir servisin istemcisi ve kullan\u0131c\u0131 do\u011Frudan o servise giriyor (\xF6r. e-posta istemcisi)"
      ],
      effect: "Apple 4.8 kart\u0131 a\xE7\u0131l\u0131r: sosyal giri\u015F sunan uygulama, veri toplamay\u0131 ad+e-postayla s\u0131n\u0131rlayan, e-postay\u0131 gizli tutmaya izin veren ve r\u0131za olmadan reklam i\xE7in etkile\u015Fim toplamayan e\u015Fde\u011Fer bir se\xE7enek de sunmak zorunda (pratikte Apple ile Giri\u015F).",
      source: "ASC\u2019de yok: \u201CSign-In Required\u201D yaln\u0131zca giri\u015F gerekti\u011Fini s\xF6yler, hangi y\xF6ntemlerin sunuldu\u011Funu de\u011Fil."
    },
    {
      key: "allowsAccountCreation",
      label: "Hesap a\xE7\u0131labiliyor",
      group: "icerik",
      flag: "account-creation",
      tldr: "Kullan\u0131c\u0131 uygulama i\xE7inde kendine hesap a\xE7abiliyor mu?",
      what: "\u201CGiri\u015F gerekiyor\u201Ddan ayr\u0131 bir soru: giri\u015F ZORUNLU olmasa bile kullan\u0131c\u0131 hesap A\xC7AB\u0130L\u0130YORSA 5.1.1(v) devreye giriyor. \xD6l\xE7\xFC, uygulaman\u0131n bir hesap olu\u015Fturma ak\u0131\u015F\u0131 sunmas\u0131.",
      yes: [
        "Kay\u0131t ol / Sign up ekran\u0131 var",
        "Sosyal giri\u015Fle ilk giri\u015Fte arka planda hesap olu\u015Fuyor",
        "Misafir kullan\u0131m var ama istenirse kal\u0131c\u0131 hesaba d\xF6n\xFC\u015Ft\xFCr\xFClebiliyor"
      ],
      no: [
        "Hi\xE7 hesap kavram\u0131 yok; her \u015Fey cihazda duruyor",
        "Hesaplar yaln\u0131zca kurum taraf\u0131ndan a\xE7\u0131l\u0131yor, kullan\u0131c\u0131 kendi hesab\u0131n\u0131 a\xE7am\u0131yor"
      ],
      effect: "5.1.1(v) hesap S\u0130LME kart\u0131 a\xE7\u0131l\u0131r: hesap a\xE7t\u0131rabilen uygulama, hesab\u0131n uygulama \u0130\xC7\u0130NDEN silinmesini de sa\u011Flamak zorunda \u2014 bu tek ba\u015F\u0131na \xE7ok s\u0131k red sebebi. 1.6 (veri g\xFCvenli\u011Fi) kart\u0131 da buna ba\u011Fl\u0131.",
      source: "ASC\u2019de yok \u2014 elle i\u015Faretlenir."
    },
    {
      key: "hasUserGeneratedContent",
      label: "Kullan\u0131c\u0131 i\xE7eri\u011Fi",
      group: "icerik",
      flag: "ugc",
      tldr: "Kullan\u0131c\u0131lar\u0131n \xFCretti\u011Fi i\xE7erik, uygulama i\xE7inde ba\u015Fka kullan\u0131c\u0131lara ula\u015F\u0131yor mu?",
      what: "Apple\u2019\u0131n \u201Cuser-generated content\u201D dedi\u011Fi \u015Fey dar bir tan\u0131m: kullan\u0131c\u0131lar\u0131n yazd\u0131\u011F\u0131 ya da y\xFCkledi\u011Fi i\xE7eri\u011Fin UYGULAMANIN \u0130\xC7\u0130NDE ba\u015Fka kullan\u0131c\u0131lara g\xF6r\xFCnmesi. \xD6l\xE7\xFC \u201Ckullan\u0131c\u0131 i\xE7erik \xFCretiyor mu\u201D de\u011Fil, \u201Ci\xE7erik ba\u015Fka bir kullan\u0131c\u0131ya ula\u015F\u0131yor mu\u201D. \xDC\xE7\xFCnc\xFC taraflarla veri payla\u015F\u0131m\u0131 bu alan\u0131n konusu de\u011Fil \u2014 o gizlilik/veri toplama taraf\u0131 ve ayr\u0131 kurallarla denetleniyor.",
      yes: [
        "Yorum, de\u011Ferlendirme, forum, sohbet/DM, grup",
        "Herkese a\xE7\u0131k profil; serbest yaz\u0131lan kullan\u0131c\u0131 ad\u0131, biyografi, avatar",
        "Ak\u0131\u015F/ke\u015Ffet: kullan\u0131c\u0131lar\u0131n y\xFCkledi\u011Fi foto, video ya da sesi ba\u015Fkalar\u0131 g\xF6r\xFCyor",
        "Ortak galeri, \u015Fablon/preset payla\u015F\u0131m\u0131 \u2014 ba\u015Fkalar\u0131n\u0131n \xFCretimini g\xF6rebildi\u011Fin her yer"
      ],
      no: [
        "\u0130\xE7erik yaln\u0131zca \xFCreten ki\u015Fiye g\xF6r\xFCn\xFCyor (yerel not, kendi galerisi, kendi d\xFCzenlemesi)",
        "\xC7\u0131kt\u0131 yaln\u0131zca \u201CPayla\u015F\u201D ile Instagram/WhatsApp\u2019a d\u0131\u015Fa aktar\u0131l\u0131yor \u2014 bu d\u0131\u015Fa aktarma, uygulama i\xE7i UGC de\u011Fil",
        "Yaln\u0131zca sana ula\u015Fan destek formu ya da geri bildirim metni",
        "Sunucuna y\xFCklenen ama hi\xE7bir kullan\u0131c\u0131ya g\xF6r\xFCnmeyen bulut yede\u011Fi"
      ],
      note: "S\u0131n\u0131rda kalanlar: i\xE7erik varsay\u0131lan olarak gizli ama uygulama i\xE7inde payla\u015F\u0131labiliyorsa evet say \u2014 Apple \xF6zelli\u011Fin varl\u0131\u011F\u0131na bak\u0131yor, ka\xE7 ki\u015Finin kulland\u0131\u011F\u0131na de\u011Fil.",
      effect: "Ya\u015F s\u0131n\u0131r\u0131 4+/Everyone ise do\u011Frudan y\xFCksek \xF6nemli bulgu \xFCretilir ve ya\u015F s\u0131n\u0131r\u0131 tutarl\u0131l\u0131k kart\u0131 s\u0131k\u0131la\u015F\u0131r. Apple 1.2 gere\u011Fi ayr\u0131ca beklenenler: i\xE7erik filtreleme, \u015Fikayet/bildir mekanizmas\u0131, kullan\u0131c\u0131 engelleme ve yay\u0131nlanm\u0131\u015F bir ileti\u015Fim adresi. 1.2.1 (creator i\xE7eri\u011Fi) kart\u0131 da buna ba\u011Fl\u0131.",
      source: "API\u2019den okunuyor: ya\u015F s\u0131n\u0131r\u0131 beyan\u0131ndaki \u201Cuser-generated content\u201D kutusu. Bu ger\xE7e\u011Fin kendisi de\u011Fil BEYANI \u2014 Apple da denetimi bu beyana g\xF6re yapt\u0131\u011F\u0131 i\xE7in denetlenecek do\u011Fru de\u011Fer bu."
    },
    {
      key: "generatesAiContent",
      label: "AI i\xE7erik \xFCretiyor",
      group: "icerik",
      flag: "ai-content",
      tldr: "\xDCretken bir model kullan\u0131c\u0131 i\xE7in yeni i\xE7erik mi \xFCretiyor?",
      what: "Uygulama, kullan\u0131c\u0131n\u0131n iste\u011Fiyle \xFCretken bir modelle YEN\u0130 i\xE7erik (g\xF6rsel, video, metin, ses) \xFCretiyor mu? Modelin cihazda m\u0131, senin sunucunda m\u0131, yoksa bir API\u2019de mi (OpenAI, Gemini, Replicate) oldu\u011Fu fark etmez: kullan\u0131c\u0131n\u0131n g\xF6rd\xFC\u011F\xFC \xE7\u0131kt\u0131 modelden \xE7\u0131k\u0131yorsa evet.",
      yes: [
        "AI ile g\xF6rsel/avatar/arka plan \xFCretimi, nesne ekleme-silme (\u201Cgenerative fill\u201D)",
        "Y\xFCz veya v\xFCcut de\u011Fi\u015Ftirme, ya\u015Fland\u0131rma, stil transferi",
        "Sohbet botu; metin yazma, \xF6zetleme, \xE7eviri asistan\u0131",
        "AI ses klonlama, m\xFCzik/\u015Fark\u0131 \xFCretimi"
      ],
      no: [
        "Deterministik filtre, k\u0131rpma, renk d\xFCzeltme, haz\u0131r \u015Fablon",
        "S\u0131n\u0131fland\u0131ran veya etiketleyen ama i\xE7erik \xFCretmeyen model (nesne tan\u0131ma, OCR)",
        "Yaln\u0131zca \xF6neri s\u0131ralayan model",
        "AI\u2019dan sadece pazarlama metninde s\xF6z ediliyor \u2014 o zaman da 2.3.1 \u201Cabart\u0131l\u0131 iddia\u201D riski ayr\u0131ca do\u011Far"
      ],
      effect: "AI if\u015Fa kartlar\u0131, \xFCretilen i\xE7eri\u011Fin kullan\u0131c\u0131 i\xE7eri\u011Fi say\u0131lmas\u0131 (1.2) ve ya\u015F s\u0131n\u0131r\u0131 tutarl\u0131l\u0131k kart\u0131 devreye girer: ger\xE7ek\xE7i insan g\xF6r\xFCnt\xFCs\xFC ya da v\xFCcut de\u011Fi\u015Ftirme \xFCreten bir uygulama 4+ olamaz, \xFCretilen i\xE7erik i\xE7in moderasyon ve \u015Fikayet yolu beklenir. Review notlar\u0131nda AI\u2019\u0131n anlat\u0131lmas\u0131 da (2.3.1) buna ba\u011Fl\u0131.",
      source: "App Store Connect\u2019te b\xF6yle bir alan yok \u2014 ya\u015F beyan\u0131n\u0131n tamam\u0131 tarand\u0131, AI\u2019a dair tek alan yok. Yaln\u0131zca senden gelir."
    },
    {
      key: "usesCameraOrMicrophone",
      label: "Kamera / mikrofon",
      group: "icerik",
      flag: "camera-mic",
      tldr: "Uygulama kay\u0131t al\u0131yor mu (kamera, mikrofon, ekran)?",
      what: "Uygulama cihaz\u0131n kameras\u0131na, mikrofonuna, ekran kayd\u0131na ya da kullan\u0131c\u0131 etkinli\u011Fini kaydeden ba\u015Fka bir yola eri\u015Fiyor mu? Galeriden haz\u0131r dosya se\xE7mek tek ba\u015F\u0131na bunu tetiklemez; \xF6l\xE7\xFC, CANLI kay\u0131t al\u0131nmas\u0131.",
      yes: [
        "Foto\u011Fraf/video \xE7ekimi, belge ya da QR tarama, y\xFCz takibi",
        "Ses kayd\u0131, sesli mesaj, sesli arama, sesli komut",
        "Ekran kayd\u0131 ya da kullan\u0131c\u0131 davran\u0131\u015F\u0131n\u0131 kaydeden oturum kayd\u0131"
      ],
      no: [
        "Yaln\u0131z galeriden haz\u0131r foto\u011Fraf se\xE7iliyor",
        "Yaln\u0131z cihazdaki dosyalar okunuyor",
        "Ses \xC7ALIYOR ama kaydetmiyor"
      ],
      effect: "2.5.14 (kay\u0131t i\xE7in a\xE7\u0131k r\u0131za + g\xF6r\xFCn\xFCr/duyulur g\xF6sterge) ve 5.1.1(ii)-(iv) (izin metinleri, veri asgarili\u011Fi, izin vermeyene alternatif) kartlar\u0131 a\xE7\u0131l\u0131r.",
      source: "ASC listing verisinde yok; izin metinleri binary\u2019de duruyor, biz binary okumuyoruz."
    },
    {
      key: "usesLocation",
      label: "Konum kullan\u0131m\u0131",
      group: "icerik",
      flag: "location",
      tldr: "Uygulama konum servislerini kullan\u0131yor mu?",
      what: "Uygulama cihaz\u0131n konumunu istiyor mu? Arka planda m\u0131 yoksa yaln\u0131z kullan\u0131l\u0131rken mi oldu\u011Fu fark etmez; \xF6l\xE7\xFC, konum izninin istenmesi.",
      yes: [
        "Harita, navigasyon, \u201Cyak\u0131n\u0131mdakiler\u201D",
        "Konuma g\xF6re i\xE7erik, fiyat ya da kullan\u0131labilirlik",
        "Arka planda konum takibi, co\u011Frafi \xE7it (geofence)"
      ],
      no: [
        "Kullan\u0131c\u0131 \u015Fehri/adresi elle yaz\u0131yor",
        "IP\u2019den kaba \xFClke tahmini yap\u0131l\u0131yor, konum izni istenmiyor"
      ],
      effect: "5.1.5 kart\u0131 a\xE7\u0131l\u0131r: konum yaln\u0131zca i\u015Flevle do\u011Frudan ilgiliyse kullan\u0131labilir, amac\u0131 uygulama i\xE7inde a\xE7\u0131klanmal\u0131, acil servis ya da ara\xE7/hava arac\u0131 kontrol\xFC i\xE7in kullan\u0131lamaz.",
      source: "ASC\u2019de yok."
    },
    {
      key: "hasHealthFeatures",
      label: "Sa\u011Fl\u0131k / t\u0131bbi i\u015Flev",
      group: "icerik",
      flag: "health",
      tldr: "Sa\u011Fl\u0131k, fitness ya da t\u0131bbi veriyle mi \xE7al\u0131\u015F\u0131yor?",
      what: "Uygulama sa\u011Fl\u0131k, fitness ya da t\u0131bbi veri topluyor, \xF6l\xE7\xFCyor ya da yorumluyor mu? HealthKit kullanmak \u015Fart de\u011Fil: ad\u0131m, uyku, kalp at\u0131\u015F\u0131, kilo, adet d\xF6ng\xFCs\xFC, ila\xE7 ya da semptom takibi de bu kapsamda.",
      yes: [
        "HealthKit, Motion & Fitness, Clinical Health Records kullan\u0131m\u0131",
        "Kalp at\u0131\u015F\u0131, tansiyon, uyku, kilo, d\xF6ng\xFC takibi",
        "Semptom, ila\xE7, diyet ya da terapi takibi",
        "Sa\u011Fl\u0131kla ilgili insan ara\u015Ft\u0131rmas\u0131 (\xE7al\u0131\u015Fma, anket)"
      ],
      no: [
        "Genel ama\xE7l\u0131 not/al\u0131\u015Fkanl\u0131k uygulamas\u0131, sa\u011Fl\u0131k \xF6l\xE7\xFCm\xFC yok",
        "Yaln\u0131zca sa\u011Fl\u0131k haberi/i\xE7eri\u011Fi okutuyor, veri toplam\u0131yor"
      ],
      effect: "1.4.1 (do\u011Fruluk iddias\u0131 ve y\xF6ntemin a\xE7\u0131klanmas\u0131; cihaz sens\xF6r\xFCyle tansiyon/\u015Feker \xF6l\xE7me iddias\u0131 yasak), 5.1.3 (sa\u011Fl\u0131k verisi reklam/pazarlama i\xE7in kullan\u0131lamaz, iCloud\u2019da tutulamaz) ve 5.1.2(vi) kartlar\u0131 a\xE7\u0131l\u0131r.",
      source: "ASC\u2019de yok."
    },
    {
      key: "targetsKids",
      label: "\xC7ocuklara y\xF6nelik",
      group: "icerik",
      flag: "kids",
      tldr: "Kids Category\u2019de mi, ya da ana kitlesi \xE7ocuklar m\u0131?",
      what: "Uygulama App Store\u2019un Kids Category\u2019sinde mi? Ya da kategoride olmasa bile ana kitlesi \xE7ocuklar m\u0131? \u0130kisi de ayn\u0131 y\xFCk\xFCml\xFCl\xFCkleri getiriyor: 1.3 kategoriyi, 5.1.4 \u201C\xE7ocuklara y\xF6nelik\u201D olmay\u0131 ba\u011Fl\u0131yor.",
      yes: [
        "Kids Category se\xE7ili ya da ya\u015F band\u0131 (5 ve alt\u0131 / 6-8 / 9-11) girilmi\u015F",
        "\u0130\xE7erik, dil ve g\xF6rseller a\xE7\u0131k\xE7a \xE7ocu\u011Fa g\xF6re: boyama, \xE7ocuk oyunu, okul \xF6ncesi e\u011Fitim"
      ],
      no: [
        "Kullan\u0131c\u0131s\u0131 ebeveyn olan \xE7ocuk takip/geli\u015Fim uygulamas\u0131",
        "Genel kitle: \xE7ocuklar da kullanabilir ama hedef kitle de\u011Fil"
      ],
      effect: "1.3 (ebeveyn kap\u0131s\u0131 olmadan d\u0131\u015Fa link ve sat\u0131n alma yok; \xFC\xE7\xFCnc\xFC taraf analitik/reklam yasa\u011F\u0131) ve 5.1.4 (\xE7ocuk verisi, gizlilik politikas\u0131, COPPA/GDPR) kartlar\u0131 a\xE7\u0131l\u0131r. 2.3.8\u2019in \u201CFor Kids/For Children\u201D ifadesi kural\u0131 da bu alana bakar: kategoride de\u011Filsen bu ifadeleri kullanamazs\u0131n.",
      source: "Ya\u015F beyan\u0131ndaki kidsAgeBand ipucu verir ama beyan \xE7ekilmemi\u015F olabilir; burada kesinle\u015Fir."
    },
    {
      key: "showsAds",
      label: "Reklam g\xF6steriyor",
      group: "icerik",
      flag: "ads",
      tldr: "Uygulama i\xE7inde reklam g\xF6steriliyor mu?",
      what: "Uygulamada reklam birimi g\xF6steriliyor mu? \xDC\xE7\xFCnc\xFC taraf a\u011F (AdMob, AppLovin, Unity Ads) ya da kendi \xE7apraz tan\u0131t\u0131m\u0131n olmas\u0131 fark etmez; \xF6l\xE7\xFC, kullan\u0131c\u0131ya reklam\u0131n g\xF6sterilmesi.",
      yes: [
        "Banner, ge\xE7i\u015F reklam\u0131 (interstitial), \xF6d\xFCll\xFC video",
        "Sponsorlu/yerle\u015Fik i\xE7erik reklam\u0131",
        "Kendi di\u011Fer uygulamalar\u0131n\u0131 tan\u0131tan reklam birimleri"
      ],
      no: [
        "Yaln\u0131zca uygulama i\xE7i sat\u0131n alma var, reklam yok",
        "Yaln\u0131zca kendi \xF6zelliklerini tan\u0131tan uygulama i\xE7i bilgilendirme (reklam birimi de\u011Fil)"
      ],
      effect: "2.5.18 (reklam ya\u015F s\u0131n\u0131r\u0131na uygun olmal\u0131; kolay kapat\u0131labilir olmal\u0131; hassas veriye g\xF6re hedefleme yasak; uygunsuz reklam\u0131 \u015Fikayet yolu \u015Fart), 3.2.2(iii) (a\u011F\u0131rl\u0131kl\u0131 olarak reklam g\xF6stermek i\xE7in tasarlanm\u0131\u015F uygulama) ve uzant\u0131/App Clip\u2019te reklam yasa\u011F\u0131 kartlar\u0131 a\xE7\u0131l\u0131r. \xC7ocuk uygulamas\u0131ysa 1.3 ile birle\u015Fir.",
      source: "ASC\u2019de yok."
    },
    // ---------------------------------------------------------------------
    // İş modeli ve para
    // ---------------------------------------------------------------------
    {
      key: "sellsPhysicalGoodsOrServices",
      label: "Fiziksel mal / hizmet",
      group: "is-modeli",
      flag: "physical-goods",
      tldr: "Uygulama d\u0131\u015F\u0131nda t\xFCketilen mal ya da hizmet sat\u0131yor mu?",
      what: "Uygulama, kullan\u0131c\u0131n\u0131n uygulama DI\u015EINDA t\xFCketece\u011Fi fiziksel bir mal ya da ger\xE7ek d\xFCnya hizmeti sat\u0131yor mu? Y\xF6n\xFC kar\u0131\u015Ft\u0131rma: burada \u201Cevet\u201D demek IAP kullanman gerekti\u011Fi de\u011Fil, KULLANMAMAN gerekti\u011Fi anlam\u0131na gelir (3.1.3(e)).",
      yes: [
        "E-ticaret, yemek sipari\u015Fi, market, kargo",
        "Bilet, rezervasyon, kiralama",
        "Ger\xE7ek d\xFCnyada verilen hizmet (kurye, temizlik, tamir, ders \u2014 birebir hizmetler 3.1.3(d))",
        "Postayla g\xF6nderilen fiziksel hediye kart\u0131"
      ],
      no: [
        "Yaln\u0131zca dijital i\xE7erik/i\u015Flev sat\u0131l\u0131yor \u2014 o IAP ile olmak zorunda",
        "Dijital hediye kart\u0131, kupon ya da kredi (IAP zorunlu)"
      ],
      effect: "3.1.3(e) kart\u0131 a\xE7\u0131l\u0131r ve IAP kartlar\u0131 bu g\xF6zle okunur: fiziksel mal/hizmeti IAP ile satmak da ihlaldir.",
      source: "IAP listesinden \xE7\u0131kar\u0131lamaz: IAP\u2019\u0131n olmamas\u0131 \u201Cfiziksel mal sat\u0131yor\u201D demek de\u011Fil."
    },
    {
      key: "hasExternalPurchaseLink",
      label: "D\u0131\u015Far\u0131ya sat\u0131n alma linki",
      group: "is-modeli",
      flag: "external-purchase-link",
      tldr: "Uygulamada IAP d\u0131\u015F\u0131 sat\u0131n almaya y\xF6nlendiren ba\u011Flant\u0131 var m\u0131?",
      what: "Uygulama, dijital i\xE7erik ya da hizmet sat\u0131n almak i\xE7in kullan\u0131c\u0131y\u0131 kendi sitene veya ba\u015Fka bir \xF6deme yoluna y\xF6nlendiren bir ba\u011Flant\u0131, d\xFC\u011Fme ya da \xE7a\u011Fr\u0131 i\xE7eriyor mu? ABD vitrini d\u0131\u015F\u0131nda bu yaln\u0131zca Apple\u2019\u0131n verdi\u011Fi entitlement ile yap\u0131labilir (StoreKit External Purchase Link, Music Streaming Services, External Link Account).",
      yes: [
        "\u201CWeb sitemizden daha uygun fiyata al\u201D ba\u011Flant\u0131s\u0131",
        "Abonelik sat\u0131n almak i\xE7in siteye g\xF6t\xFCren d\xFC\u011Fme",
        "Reader uygulamas\u0131nda hesap a\xE7ma/y\xF6netme ba\u011Flant\u0131s\u0131"
      ],
      no: [
        "Yaln\u0131zca IAP var, d\u0131\u015Far\u0131ya sat\u0131n alma ba\u011Flant\u0131s\u0131 yok",
        "Destek, gizlilik, hakk\u0131nda gibi sat\u0131n almayla ilgisiz ba\u011Flant\u0131lar"
      ],
      effect: "3.1.1(a) kart\u0131 a\xE7\u0131l\u0131r: entitlement var m\u0131, hangi vitrinlerde a\xE7\u0131k, ba\u011Flant\u0131 metni izin verilen kal\u0131ba uyuyor mu. 3.1.1 (IAP d\u0131\u015F\u0131na y\xF6nlendirme) kart\u0131 da bu bilgiyle okunur.",
      source: "ASC\u2019de yok \u2014 entitlement bilgisi listing verisinde g\xF6r\xFCnm\xFCyor."
    },
    {
      key: "unlocksContentWithoutIap",
      label: "IAP d\u0131\u015F\u0131 kilit a\xE7ma",
      group: "is-modeli",
      flag: "unlock-outside-iap",
      tldr: "\u0130\xE7erik/i\u015Flev IAP olmadan a\xE7\u0131l\u0131yor mu (kod, donan\u0131m, kripto)?",
      what: "Uygulamadaki bir i\xE7eri\u011Fi ya da i\u015Flevi, uygulama i\xE7i sat\u0131n alma DI\u015EINDA bir y\xF6ntemle a\xE7\u0131yor musun? Apple 3.1.1\u2019de say\u0131yor: lisans anahtar\u0131, QR kod, AR i\u015Fareti, kripto para ve c\xFCzdanlar. Donan\u0131ma ba\u011Fl\u0131 a\xE7\u0131lan i\u015Flev 3.1.4\u2019\xFCn ayr\u0131 istisnas\u0131 \u2014 orada da bir IAP se\xE7ene\u011Fi sunulmas\u0131 gerekiyor.",
      yes: [
        "Lisans/aktivasyon anahtar\u0131 ya da promosyon kodu tam s\xFCr\xFCm\xFC a\xE7\u0131yor",
        "QR kod veya AR i\u015Fareti okutunca i\xE7erik a\xE7\u0131l\u0131yor",
        "Kripto c\xFCzdan ya da NFT sahipli\u011Fi i\u015Flev a\xE7\u0131yor",
        "E\u015Fle\u015Fen bir donan\u0131m (oyuncak, teleskop, cihaz) i\u015Flev a\xE7\u0131yor"
      ],
      no: [
        "T\xFCm \xFCcretli i\xE7erik IAP ile a\xE7\u0131l\u0131yor",
        "Kurumsal/okul hesab\u0131yla giri\u015F yapana i\xE7erik a\xE7\u0131l\u0131yor (3.1.3(c) istisnas\u0131)",
        "Reader uygulamas\u0131nda daha \xF6nce ba\u015Fka yerde sat\u0131n al\u0131nm\u0131\u015F i\xE7eri\u011Fe eri\u015Filiyor (3.1.3(a))"
      ],
      effect: "3.1.1 (kilidi IAP d\u0131\u015F\u0131nda a\xE7ma yasa\u011F\u0131) ve 3.1.4 (donan\u0131ma ba\u011Fl\u0131 i\xE7erik: IAP se\xE7ene\u011Fi de sunulmal\u0131, ilgisiz \xFCr\xFCn alma/pazarlama etkinli\u011Fi \u015Fart ko\u015Fulamaz) kartlar\u0131 a\xE7\u0131l\u0131r.",
      source: "ASC\u2019de yok."
    },
    // ---------------------------------------------------------------------
    // Uygulama türü
    // ---------------------------------------------------------------------
    {
      key: "isWebViewWrapper",
      label: "Web sitesi sarmalay\u0131c\u0131",
      group: "tur",
      flag: "web-wrapper",
      tldr: "Uygulama esas olarak bir web sitesini mi g\xF6steriyor?",
      what: "Uygulaman\u0131n ana i\xE7eri\u011Fi WebView i\xE7inde a\xE7\u0131lan bir web sitesi mi? \xD6l\xE7\xFC \u201Cweb teknolojisi kullan\u0131yor mu\u201D de\u011Fil \u2014 \xF6l\xE7\xFC, uygulaman\u0131n sitenin \xF6tesine ge\xE7en bir de\u011Fer kat\u0131p katmad\u0131\u011F\u0131 (4.2).",
      yes: [
        "Ana ekran do\u011Frudan siteyi a\xE7an bir WebView",
        "\u0130\xE7eri\u011Fin tamam\u0131 uzaktan geliyor, yerel \xF6zellik yok",
        "Hibrit \xE7er\xE7eveyle yaz\u0131lm\u0131\u015F ama sitenin birebir kopyas\u0131"
      ],
      no: [
        "React Native/Flutter ile yaz\u0131lm\u0131\u015F ama yerel i\u015Flevi olan uygulama",
        "Yaln\u0131zca yard\u0131m, \u015Fartlar gibi ikincil sayfalar WebView\u2019da a\xE7\u0131l\u0131yor"
      ],
      effect: "4.2 (asgari i\u015Flevsellik), 4.2.2 (yaln\u0131zca pazarlama/link derlemesi olmama) ve 2.5.6 (web tarayan uygulamalar WebKit kullanmal\u0131) kartlar\u0131 a\xE7\u0131l\u0131r.",
      source: "ASC\u2019de yok."
    },
    {
      key: "hostsThirdPartySoftware",
      label: "\xDC\xE7\xFCnc\xFC taraf yaz\u0131l\u0131m bar\u0131nd\u0131r\u0131yor",
      group: "tur",
      flag: "third-party-software",
      tldr: "Mini uygulama, mini oyun, chatbot, eklenti ya da em\xFClat\xF6r oyunu sunuyor mu?",
      what: "Uygulaman, binary\u2019nin i\xE7ine g\xF6m\xFCl\xFC OLMAYAN yaz\u0131l\u0131m sunuyor mu: HTML5/JavaScript mini uygulama ve mini oyunlar, ak\u0131\u015F (streaming) oyunlar\u0131, chatbotlar, eklentiler ya da retro konsol/PC em\xFClat\xF6r\xFCyle indirilen oyunlar. Apple bu yaz\u0131l\u0131mlar\u0131n tamam\u0131ndan SEN\u0130 sorumlu tutuyor (4.7).",
      yes: [
        "Mini uygulama / mini oyun platformu",
        "\xDC\xE7\xFCnc\xFC taraflar\u0131n yazd\u0131\u011F\u0131 chatbot ya da asistan koleksiyonu",
        "Bulut \xFCzerinden akan oyunlar",
        "Eklenti (plug-in) y\xFCklenebilen uygulama",
        "Em\xFClat\xF6r: kullan\u0131c\u0131 oyun indirebiliyor"
      ],
      no: [
        "T\xFCm i\xE7erik binary\u2019nin i\xE7inde",
        "Yaln\u0131zca senin \xFCretti\u011Fin i\xE7erik uzaktan g\xFCncelleniyor (metin, g\xF6rsel, yap\u0131land\u0131rma)"
      ],
      effect: "4.7 ve 4.7.1\u20134.7.5 kartlar\u0131 a\xE7\u0131l\u0131r: bar\u0131nd\u0131r\u0131lan yaz\u0131l\u0131m i\xE7in gizlilik kurallar\u0131, moderasyon (s\xFCzme/\u015Fikayet/engelleme), IAP zorunlulu\u011Fu, yerel API\u2019lerin izinsiz a\xE7\u0131lmamas\u0131, izinlerin r\u0131zas\u0131z payla\u015F\u0131lmamas\u0131, evrensel ba\u011Flant\u0131l\u0131 yaz\u0131l\u0131m dizini ve ya\u015F k\u0131s\u0131tlama mekanizmas\u0131.",
      source: "ASC\u2019de yok."
    },
    {
      key: "hasAppExtensions",
      label: "Uzant\u0131 / widget",
      group: "tur",
      flag: "extensions",
      tldr: "Pakette ana uygulama d\u0131\u015F\u0131nda \xE7al\u0131\u015Fan bir bile\u015Fen var m\u0131?",
      what: "Uygulama paketinde ana binary d\u0131\u015F\u0131nda \xE7al\u0131\u015Fan bir bile\u015Fen var m\u0131: uzant\u0131, \xFC\xE7\xFCnc\xFC taraf klavye, Safari uzant\u0131s\u0131, widget, bildirim uzant\u0131s\u0131, watchOS uygulamas\u0131, sticker paketi ya da App Clip.",
      yes: [
        "Klavye uzant\u0131s\u0131, Safari uzant\u0131s\u0131, payla\u015F\u0131m/aksiyon uzant\u0131s\u0131",
        "Widget, canl\u0131 aktivite, bildirim i\xE7eri\u011Fi uzant\u0131s\u0131",
        "App Clip, watchOS uygulamas\u0131, sticker paketi"
      ],
      no: ["Tek bir ana uygulama; uzant\u0131, widget ya da App Clip yok"],
      effect: "4.4 (uzant\u0131lar pazarlama metninde do\u011Fru anlat\u0131lmal\u0131; uzant\u0131da pazarlama, reklam ya da IAP olamaz), 4.4.1 (klavye), 4.4.2 (Safari), 2.5.16 (widget/uzant\u0131 uygulamayla ilgili olmal\u0131; App Clip\u2019te reklam yok) ve 2.5.18 (reklam yaln\u0131zca ana binary\u2019de) kartlar\u0131 a\xE7\u0131l\u0131r.",
      source: "ASC\u2019de yok \u2014 \xE7ekilen build bilgisi uzant\u0131lar\u0131 listelemiyor."
    }
  ];
  var META_KEYS = META_FIELDS.map((f) => f.key);
  function metaField(key) {
    return META_FIELDS.find((f) => f.key === key);
  }

  // src/ext/submission-from-dump.ts
  init_apple_tables();

  // src/dump/normalize.ts
  var nesne = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  function hamKayit(v) {
    return nesne(v) && ("attributes" in v || "links" in v || "relationships" in v);
  }

  // src/ext/submission-from-dump.ts
  var IAP_KIND = {
    CONSUMABLE: "consumable",
    NON_CONSUMABLE: "non_consumable",
    NON_RENEWING_SUBSCRIPTION: "non_renewing"
  };
  var attrs = (r) => r?.attributes ?? r ?? {};
  function pickLocale(rows, locale) {
    const want = locale.toLowerCase();
    return rows.find((r) => String(attrs(r).locale ?? "").toLowerCase() === want) ?? // en-US isteyip yalnız en-GB varsa boş dönmektense dil kökü tutsun.
    rows.find((r) => String(attrs(r).locale ?? "").toLowerCase().startsWith(want.split("-")[0]));
  }
  function submissionFromDump(dump, opts = {}) {
    const warnings = [];
    const warn = (m) => warnings.push(m);
    if (hamKayit(dump.app) || hamKayit(dump.appInfos?.data?.[0])) {
      warn(
        "D\xF6k\xFCm ham JSON:API bi\xE7iminde geldi (sadele\u015Ftirilmemi\u015F). Baz\u0131 alanlar okunamayabilir \u2014 g\xF6r\xFCnt\xFCleyiciyi g\xFCncelle ya da uygulamay\u0131 yeniden \xE7ek."
      );
    }
    const appAttrs = attrs(dump.app);
    const appId = String(dump.app?.id ?? "");
    const primaryLocale = String(appAttrs.primaryLocale ?? "en-US");
    const locale = opts.locale ?? primaryLocale;
    const infoLocs = dump.appInfoLocalizations ?? [];
    const infoLoc = pickLocale(infoLocs, locale) ?? infoLocs[0];
    if (!infoLocs.length) warn("Uygulama k\xFCnyesi metinleri (ad/altyaz\u0131) \xE7ekilemedi.");
    else if (!pickLocale(infoLocs, locale)) {
      warn(`${locale} i\xE7in k\xFCnye metni yok; ${String(attrs(infoLoc).locale ?? "?")} kullan\u0131ld\u0131.`);
    }
    const name = String(attrs(infoLoc).name ?? appAttrs.name ?? "");
    const subtitle = String(attrs(infoLoc).subtitle ?? "");
    const privacyUrl = String(attrs(infoLoc).privacyPolicyUrl ?? "");
    const info = dump.appInfos?.data?.[0];
    const categoryId = info?.iliski?.primaryCategory ?? info?.relationships?.primaryCategory?.data?.id;
    const category = categoryId ? humanizeCategory(String(categoryId)) : "";
    if (!category) warn("Kategori okunamad\u0131 \u2014 kategoriye ba\u011Fl\u0131 kurallar elenmi\u015F olabilir.");
    const rawAge = String(attrs(info).appStoreAgeRating ?? "");
    const ageRating = AGE_RATING[rawAge] ?? "";
    if (!ageRating) {
      warn(
        rawAge ? `Ya\u015F s\u0131n\u0131r\u0131 tan\u0131nmad\u0131: ${rawAge}. Ya\u015F kurallar\u0131 yan\u0131labilir.` : "Ya\u015F s\u0131n\u0131r\u0131 bo\u015F \u2014 hen\xFCz belirlenmemi\u015F olabilir. Ya\u015F kurallar\u0131 yan\u0131labilir."
      );
    }
    const current = dump.versionTexts?.[0];
    const vloc = current ? pickLocale(current.locales, locale) ?? current.locales[0] : void 0;
    if (!current) warn("S\xFCr\xFCm metinleri \xE7ekilemedi \u2014 a\xE7\u0131klama, keywords ve promo denetlenemez.");
    else if (!vloc) warn(`${locale} i\xE7in s\xFCr\xFCm metni yok.`);
    const va = attrs(vloc);
    const screenshots = [];
    for (const set of dump.screenshots ?? []) {
      if (set.locale && vloc && String(attrs(vloc).locale ?? "") && set.locale !== attrs(vloc).locale) continue;
      for (const img of set.images ?? []) {
        screenshots.push({
          id: img.id,
          path: img.url,
          deviceClass: deviceClassOf(set.displayType) || void 0,
          order: img.order,
          width: img.width,
          height: img.height
        });
      }
    }
    if (!screenshots.length) warn("Hi\xE7 ekran g\xF6r\xFCnt\xFCs\xFC yok ya da \xE7ekilemedi \u2014 g\xF6rsel kartlar \xE7al\u0131\u015Fmayacak.");
    const cozulmemis = screenshots.filter((s) => !s.path).length;
    if (cozulmemis) warn(`${cozulmemis} ekran g\xF6r\xFCnt\xFCs\xFCn\xFCn adresi \xE7\xF6z\xFClemedi.`);
    const icon = dump.icon?.url ? { id: dump.icon.id, path: dump.icon.url } : void 0;
    if (!icon) warn('\u0130kon okunamad\u0131 \u2014 "ikon eksik" bulgusu bu y\xFCzden \xE7\u0131kabilir.');
    const ra = attrs(dump.reviewDetail);
    const demoRequired = ra.demoAccountRequired === true;
    if (!dump.reviewDetail) warn("Review detay\u0131 \xE7ekilemedi \u2014 demo hesap ve inceleme notu denetlenemedi.");
    const iap = [];
    const fiyatsiz = [];
    for (const sub of dump.subscriptions ?? []) {
      const loc = pickLocale(sub.diller ?? [], locale) ?? sub.diller?.[0];
      const price = Number(sub.fiyat?.customerPrice ?? 0);
      if (!sub.fiyat) fiyatsiz.push(sub.urun);
      const trial = (sub.teklifler ?? []).find((o) => String(o?.offerMode ?? "") === "FREE_TRIAL");
      iap.push({
        id: sub.urun,
        kind: "subscription",
        name: String(attrs(loc).name ?? sub.ad ?? ""),
        description: String(attrs(loc).description ?? ""),
        price,
        currency: String(sub.fiyat?.currency ?? ""),
        duration: PERIOD[String(sub.donem ?? "")] ?? void 0,
        freeTrial: trial ? { duration: PERIOD[String(trial.duration ?? "")] ?? "" } : void 0
      });
    }
    const cizelge = new Map((dump.iapPrices ?? []).map((r) => [r.urun, r]));
    for (const p of dump.iaps?.data ?? []) {
      const productId = String(p.productId ?? p.id);
      const loc = pickLocale(p.diller ?? [], locale) ?? p.diller?.[0];
      const ayri = cizelge.get(productId);
      const fiyat = typeof ayri?.fiyat === "number" ? { price: ayri.fiyat, currency: String(ayri.para ?? "") } : typeof p.fiyat?.tutar === "number" ? { price: p.fiyat.tutar, currency: String(p.fiyat.para ?? "") } : null;
      if (!fiyat) fiyatsiz.push(productId);
      iap.push({
        id: productId,
        kind: IAP_KIND[String(p.inAppPurchaseType ?? "")] ?? "non_consumable",
        name: String(attrs(loc).name ?? p.name ?? ""),
        description: String(attrs(loc).description ?? ""),
        price: fiyat?.price ?? 0,
        currency: fiyat?.currency ?? ""
      });
    }
    if (fiyatsiz.length) {
      const hicCekilmemis = dump.iapPrices === void 0;
      warn(
        `${fiyatsiz.length} \xFCr\xFCn\xFCn fiyat\u0131 okunamad\u0131 (price=0): ${fiyatsiz.slice(0, 5).join(", ")}` + (fiyatsiz.length > 5 ? " \u2026" : "") + ". " + (hicCekilmemis ? 'Fiyat b\xF6l\xFCm\xFC bu \xE7ekimde H\u0130\xC7 YOK \u2014 muhtemelen eski bir \xE7ekim. "Her \u015Feyi \xE7ek" ile yeniden \xE7ek.' : 'Fiyat \xE7izelgesi \xE7ekildi ama bu \xFCr\xFCnlerde okunamad\u0131 \u2014 Uygulamalar sekmesindeki "Okunamayan u\xE7lar" listesine bak.') + " Fiyata bakan kurallar bunlarda yan\u0131labilir."
      );
    }
    const ugc = attrs(dump.versionAgeRating).userGeneratedContent ?? attrs(dump.ageRating).userGeneratedContent;
    const meta = {
      // demoAccountRequired=true kesin bilgidir. false ise KESİN DEĞİL:
      // Sign in with Apple ile giriş isteyip demo hesap vermeyen uygulamalar da
      // bu kutuyu işaretlemiyor. Bilinmiyor bırakmak yanlış "false"tan iyidir.
      requiresLogin: demoRequired ? true : void 0,
      hasUserGeneratedContent: typeof ugc === "boolean" ? ugc : void 0,
      // generatesAiContent App Store Connect'te HİÇ YOK — yaş sınırı beyanının
      // tamamı tarandı, AI'a dair tek alan yok. Elle girilmek zorunda.
      //
      // hasThirdPartyLogin da API'de yok. `demoAccountRequired` yalnızca "giriş
      // gerekiyor" der; hangi giriş yöntemlerinin sunulduğunu söylemez. 4.8
      // (Apple ile Giriş) yalnızca üçüncü taraf giriş sunanları bağladığı için
      // bu ayrı bir sorudur.
      ...opts.meta
    };
    if (meta.generatesAiContent === void 0) {
      warn("\u201CAI i\xE7erik \xFCretiyor mu?\u201D bilinmiyor \u2014 App Store Connect bunu s\xF6ylemiyor, elle i\u015Faretlenmeli.");
    }
    if (meta.hasUserGeneratedContent === void 0) {
      warn("\u201CKullan\u0131c\u0131 i\xE7eri\u011Fi var m\u0131?\u201D okunamad\u0131 \u2014 ilgili kurallar denetim d\u0131\u015F\u0131 kalacak.");
    }
    if (meta.requiresLogin && meta.hasThirdPartyLogin === void 0) {
      warn("\u201C\xDC\xE7\xFCnc\xFC taraf giri\u015F (Google/Facebook) var m\u0131?\u201D bilinmiyor \u2014 Apple ile Giri\u015F kural\u0131 (4.8) denetim d\u0131\u015F\u0131 kalacak.");
    }
    const beyanlar = beyanlariTopla(dump, dump.iaps?.data ?? []);
    if (!beyanlar.privacy) {
      warn("App Privacy etiketi \xE7ekilmedi \u2014 takip (5.1.2) ve gizlilik iddias\u0131 (5.1.1) denetlenemedi.");
    }
    if (!beyanlar.build) {
      warn("Build bilgisi \xE7ekilmedi \u2014 cihaz/ekran g\xF6r\xFCnt\xFCs\xFC tutarl\u0131l\u0131\u011F\u0131 denetlenemedi.");
    }
    const submission = {
      platform: "apple",
      appId,
      appName: name,
      locale: String(attrs(vloc).locale ?? attrs(infoLoc).locale ?? locale),
      category,
      ageRating,
      text: {
        name,
        subtitle,
        description: String(va.description ?? ""),
        keywords: String(va.keywords ?? ""),
        promotionalText: String(va.promotionalText ?? ""),
        whatsNew: String(va.whatsNew ?? "")
      },
      media: { icon, screenshots },
      iap,
      urls: {
        privacy: privacyUrl || void 0,
        support: String(va.supportUrl ?? "") || void 0,
        marketing: String(va.marketingUrl ?? "") || void 0
      },
      reviewNotes: {
        notes: String(ra.notes ?? "") || void 0,
        demoAccount: demoRequired ? { user: String(ra.demoAccountName ?? ""), pass: String(ra.demoAccountPassword ?? "") } : void 0
      },
      meta,
      declarations: beyanlar,
      source: { kind: "app-store-connect", fetchedAt: (/* @__PURE__ */ new Date()).toISOString() }
    };
    return { submission, warnings };
  }
  var YAS_ALANLARI = [
    "userGeneratedContent",
    "messagingAndChat",
    "socialMedia",
    "unrestrictedWebAccess",
    "gambling",
    "gamblingSimulated",
    "lootBox",
    "contests",
    "horrorOrFearThemes",
    "matureOrSuggestiveThemes",
    "medicalOrTreatmentInformation",
    "healthOrWellnessTopics",
    "profanityOrCrudeHumor",
    "sexualContentOrNudity",
    "sexualContentGraphicAndNudity",
    "alcoholTobaccoOrDrugUseOrReferences",
    "gunsOrOtherWeapons",
    "violenceCartoonOrFantasy",
    "violenceRealistic",
    "violenceRealisticProlongedGraphicOrSadistic"
  ];
  function yasBeyani(surum, uygulama) {
    const kaynak = surum ?? uygulama;
    if (!kaynak) return void 0;
    const k = attrs(kaynak);
    const sinyaller = {};
    let noneSayisi = 0;
    const beyanEdilmemis = [];
    for (const alan of YAS_ALANLARI) {
      const v = k[alan];
      if (v === void 0) beyanEdilmemis.push(alan);
      else if (v === true) sinyaller[alan] = true;
      else if (v === false || v === "NONE") noneSayisi++;
      else sinyaller[alan] = String(v);
    }
    let surumFarki;
    if (surum && uygulama) {
      const u = attrs(uygulama);
      surumFarki = YAS_ALANLARI.filter((a) => attrs(surum)[a] !== u[a] && (attrs(surum)[a] !== void 0 || u[a] !== void 0));
    }
    return {
      magazaSinifi: void 0,
      ustunKilma: k.ageRatingOverrideV2 ?? k.ageRatingOverride ?? void 0,
      kidsAgeBand: k.kidsAgeBand ?? void 0,
      sinyaller,
      noneSayisi,
      beyanEdilmemis,
      kaynak: surum ? "surum" : "uygulama",
      surumFarki: surumFarki?.length ? surumFarki : void 0
    };
  }
  function buildBeyani(dump) {
    const hepsi = dump.builds ?? [];
    if (!hepsi.length) return void 0;
    const uygun = hepsi.filter((b) => b.expired !== true && b.processingState === "VALID");
    const sirali = (uygun.length ? uygun : hepsi).slice().sort((a, b) => String(b.uploadedDate ?? "").localeCompare(String(a.uploadedDate ?? "")));
    const secilen = sirali[0];
    if (!secilen) return void 0;
    return {
      surum: secilen.version ? String(secilen.version) : void 0,
      cihazAileleri: Array.isArray(secilen.deviceFamilies) ? secilen.deviceFamilies.map(String) : [],
      minOs: secilen.minOsVersion ? String(secilen.minOsVersion) : void 0,
      kaynak: uygun.length ? `build ${secilen.version} (${secilen.uploadedDate ?? "?"})` : `build ${secilen.version} \u2014 s\xFCresi dolmu\u015F, uygun build yok`
    };
  }
  function beyanlariTopla(dump, urunler) {
    const d = {};
    const yas = yasBeyani(dump.versionAgeRating, dump.ageRating);
    if (yas) {
      yas.magazaSinifi = AGE_RATING[String(attrs(dump.appInfos?.data?.[0]).appStoreAgeRating ?? "")] ?? void 0;
      if (yas.ustunKilma) yas.ustunKilma = AGE_RATING[yas.ustunKilma] ?? yas.ustunKilma;
      d.age = yas;
    }
    if (dump.dataUsages) {
      const satirlar = dump.dataUsages;
      d.privacy = {
        satirlar,
        takip: satirlar.some((r) => r.koruma === "DATA_USED_TO_TRACK_YOU"),
        kimlikleBagli: satirlar.some((r) => r.koruma === "DATA_LINKED_TO_YOU")
      };
    }
    const haklar = attrs(dump.app).contentRightsDeclaration;
    if (haklar) d.icerikHaklari = String(haklar);
    if (dump.iaps?.data) {
      d.urunDurumlari = urunler.map((p) => ({
        id: String(p.productId ?? p.id),
        durum: String(p.state ?? ""),
        durumGrubu: p.stateGroup ? String(p.stateGroup) : void 0,
        sonrakiSurumleGonder: typeof p.submitWithNextAppStoreVersion === "boolean" ? p.submitWithNextAppStoreVersion : void 0,
        incelemede: typeof p.isAppStoreReviewInProgress === "boolean" ? p.isAppStoreReviewInProgress : void 0,
        reviewNote: p.reviewNote ? String(p.reviewNote) : void 0
      }));
    }
    const build = buildBeyani(dump);
    if (build) d.build = build;
    const surum = dump.versions?.[0];
    if (surum) {
      d.surum = {
        durum: surum.appVersionState ?? surum.appStoreState ?? void 0,
        yayinTipi: surum.releaseType ?? void 0,
        usesIdfa: typeof surum.usesIdfa === "boolean" ? surum.usesIdfa : void 0
      };
    }
    const rd = attrs(dump.reviewDetail);
    if (rd.iletisim) d.reviewIletisim = rd.iletisim;
    if (dump.customProductPages) {
      d.ozelSayfalar = dump.customProductPages.map((s) => ({
        ad: String(s.name ?? ""),
        gorunur: s.visible !== false,
        // Kabuk mu, içerik mi? Eski çekimlerde yalnız ad/adres var; kapsam
        // uyarısı (lint-custom-page-not-audited) tam olarak bu ayrıma dayanıyor.
        icerikCekildi: s.icerikCekildi === true
      }));
    }
    return d;
  }

  // src/lint/urls.ts
  async function checkUrls(sub, opts = {}) {
    const probeEnabled = opts.probe !== false;
    const out = [];
    const required = [
      ["privacy", "Gizlilik politikas\u0131", "high"],
      ["support", "Destek", "medium"]
    ];
    for (const [key, label, sev] of required) {
      const url = sub.urls[key];
      if (!url) {
        out.push({
          checkId: `lint-${key}-url-missing`,
          platform: sub.platform,
          severity: "high",
          artifact: "urls",
          message: `${label} URL'i tan\u0131ml\u0131 de\u011Fil.`,
          suggestedFix: `${label} URL'ini listing'e ekle.`
        });
        continue;
      }
      if (!probeEnabled) continue;
      const status = await probe(url);
      if (status === "unreachable" || typeof status === "number" && status >= 400) {
        out.push({
          checkId: `lint-${key}-url-dead`,
          platform: sub.platform,
          severity: sev,
          artifact: "urls",
          message: `${label} URL'i eri\u015Filemiyor (${status}): ${url}`,
          suggestedFix: `${url} adresini d\xFCzelt ya da \xE7al\u0131\u015Fan bir adresle de\u011Fi\u015Ftir.`
        });
      }
    }
    return out;
  }
  async function probe(url) {
    let last = "unreachable";
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 1500));
      last = await probeOnce(url);
      if (typeof last === "number" && last < 500) return last;
    }
    return last;
  }
  async function probeOnce(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15e3);
    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*"
      };
      let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers });
      if (res.status === 405 || res.status === 501 || res.status === 400) {
        res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers });
      }
      return res.status;
    } catch {
      return "unreachable";
    } finally {
      clearTimeout(t);
    }
  }

  // src/lint/brands.ts
  var BRANDS = [
    // Rakip fotoğraf/video uygulamaları
    { term: "facetune", tur: "uygulama markas\u0131" },
    { term: "remini", tur: "uygulama markas\u0131" },
    { term: "faceapp", tur: "uygulama markas\u0131" },
    { term: "lensa", tur: "uygulama markas\u0131" },
    { term: "picsart", tur: "uygulama markas\u0131" },
    { term: "snapseed", tur: "uygulama markas\u0131" },
    { term: "vsco", tur: "uygulama markas\u0131" },
    { term: "youcam", tur: "uygulama markas\u0131" },
    { term: "meitu", tur: "uygulama markas\u0131" },
    { term: "beautyplus", tur: "uygulama markas\u0131" },
    { term: "airbrush", tur: "uygulama markas\u0131" },
    { term: "retrica", tur: "uygulama markas\u0131" },
    { term: "photoroom", tur: "uygulama markas\u0131" },
    { term: "canva", tur: "uygulama markas\u0131" },
    { term: "photoshop", tur: "uygulama markas\u0131" },
    { term: "lightroom", tur: "uygulama markas\u0131" },
    { term: "capcut", tur: "uygulama markas\u0131" },
    // Platformlar ve onların içerik formatı adları
    { term: "instagram", tur: "platform markas\u0131" },
    { term: "tiktok", tur: "platform markas\u0131" },
    { term: "snapchat", tur: "platform markas\u0131" },
    { term: "whatsapp", tur: "platform markas\u0131" },
    { term: "youtube", tur: "platform markas\u0131" },
    { term: "facebook", tur: "platform markas\u0131" },
    { term: "reels", tur: "platform format\u0131 (Meta)" },
    { term: "shorts", tur: "platform format\u0131 (YouTube)" },
    // Tescilli ürünler
    { term: "botox", tur: "tescilli \xFCr\xFCn" },
    { term: "restylane", tur: "tescilli \xFCr\xFCn" },
    { term: "juvederm", tur: "tescilli \xFCr\xFCn" }
  ];
  function keywordTerms(keywords) {
    return keywords.split(",").map((k) => k.trim()).filter(Boolean);
  }
  function markaBul(term) {
    const t = term.toLocaleLowerCase("en");
    for (const b of BRANDS) {
      if (new RegExp(`(^|[^a-z0-9])${b.term}($|[^a-z0-9])`).test(t)) return b;
    }
    return null;
  }

  // src/lint/limits.ts
  var LIMITS = {
    apple: {
      name: 30,
      subtitle: 30,
      keywords: 100,
      promotionalText: 170,
      description: 4e3,
      whatsNew: 4e3
    },
    google: {
      name: 30,
      shortDescription: 80,
      description: 4e3
    }
  };
  async function checkKeywordBrands(sub) {
    const out = [];
    for (const term of keywordTerms(sub.text.keywords ?? "")) {
      const marka = markaBul(term);
      if (!marka) continue;
      out.push({
        checkId: "lint-keyword-brand-term",
        platform: sub.platform,
        severity: "high",
        artifact: "keywords",
        message: `Anahtar kelimelerde "${term}" ge\xE7iyor \u2014 "${marka.term}" ba\u015Fkas\u0131na ait ${marka.tur}. Apple 2.3.7 metadata'n\u0131n marka terimleriyle doldurulmas\u0131n\u0131 yasakl\u0131yor.`,
        suggestedFix: `"${term}" terimini anahtar kelimelerden \xE7\u0131kar.`
      });
    }
    return out;
  }
  async function checkLimits(sub) {
    const out = [];
    const limits = LIMITS[sub.platform];
    for (const [field, max] of Object.entries(limits)) {
      if (max === void 0) continue;
      const value = sub.text[field];
      if (!value) continue;
      if (value.length > max) {
        out.push({
          checkId: `lint-limit-${field}`,
          platform: sub.platform,
          severity: "high",
          artifact: field,
          message: `${field} ${value.length} karakter, limit ${max}. ${value.length - max} karakter fazla.`,
          suggestedFix: `${field} alan\u0131n\u0131 ${max} karaktere indir.`
        });
      }
    }
    if (sub.platform === "apple" && sub.text.keywords?.includes(", ")) {
      out.push({
        checkId: "lint-keywords-spaces",
        platform: "apple",
        severity: "low",
        artifact: "keywords",
        message: "Keyword alan\u0131nda virg\xFClden sonra bo\u015Fluk var \u2014 limitten say\u0131l\u0131r.",
        suggestedFix: "Virg\xFClden sonraki bo\u015Fluklar\u0131 kald\u0131r: 'a,b,c'"
      });
    }
    return out;
  }

  // src/lint/media.ts
  var MIN_SCREENSHOTS = 3;
  async function checkMedia(sub) {
    const out = [];
    if (!sub.media.icon) {
      out.push({
        checkId: "lint-icon-missing",
        platform: sub.platform,
        severity: "high",
        artifact: "icon",
        message: "Uygulama ikonu tan\u0131ml\u0131 de\u011Fil.",
        suggestedFix: "Listing\u2019e 1024x1024 ikon ekle."
      });
    }
    const shots = sub.media.screenshots ?? [];
    if (shots.length < MIN_SCREENSHOTS) {
      out.push({
        checkId: "lint-screenshots-too-few",
        platform: sub.platform,
        severity: "medium",
        artifact: "screenshots",
        message: `Sadece ${shots.length} ekran g\xF6r\xFCnt\xFCs\xFC var (\xF6nerilen en az ${MIN_SCREENSHOTS}).`,
        suggestedFix: "Uygulaman\u0131n ana ak\u0131\u015Flar\u0131n\u0131 g\xF6steren ekran g\xF6r\xFCnt\xFCleri ekle."
      });
    }
    if (sub.platform === "apple") {
      const classes = new Set(shots.map((s) => s.deviceClass).filter(Boolean));
      if (classes.size > 0 && !classes.has("iphone_6_9")) {
        out.push({
          checkId: "lint-screenshots-missing-device-class",
          platform: "apple",
          severity: "medium",
          artifact: "screenshots",
          message: '6.9" iPhone ekran g\xF6r\xFCnt\xFCs\xFC seti eksik.',
          suggestedFix: "En g\xFCncel iPhone boyutu i\xE7in ekran g\xF6r\xFCnt\xFCs\xFC y\xFCkle."
        });
      }
    }
    return out;
  }

  // src/lint/iap.ts
  var PRICE_RE = /\$\s?(\d+(?:[.,]\d{1,2})?)/g;
  function donemGun(duration) {
    const m = /^P(\d+)([DWMY])$/.exec(duration.trim().toUpperCase());
    if (!m) return null;
    const n = Number(m[1]);
    switch (m[2]) {
      case "D":
        return n;
      case "W":
        return n * 7;
      case "M":
        return n * 30;
      case "Y":
        return n * 365;
      default:
        return null;
    }
  }
  async function checkIap(sub) {
    const out = [];
    if (sub.iap.length === 0) return out;
    const realPrices = new Set(sub.iap.map((i) => i.price.toFixed(2)));
    for (const [field, value] of Object.entries(sub.text)) {
      if (!value) continue;
      for (const m of value.matchAll(PRICE_RE)) {
        const raw = m[1];
        if (!raw) continue;
        const normalized = Number(raw.replace(",", ".")).toFixed(2);
        if (!realPrices.has(normalized)) {
          out.push({
            checkId: "lint-price-mismatch",
            platform: sub.platform,
            severity: "high",
            artifact: field,
            message: `${field} i\xE7inde "$${raw}" ge\xE7iyor ama tan\u0131ml\u0131 IAP fiyatlar\u0131: ${[...realPrices].map((p) => "$" + p).join(", ")}.`,
            suggestedFix: `Metindeki fiyat\u0131 ger\xE7ek IAP fiyat\u0131yla e\u015Fitle veya fiyat ifadesini kald\u0131r.`
          });
        }
      }
    }
    for (const i of sub.iap) {
      if (i.kind !== "subscription" || !i.duration) continue;
      const gun = donemGun(i.duration);
      if (gun === null || gun >= 7) continue;
      out.push({
        checkId: "lint-subscription-period-too-short",
        platform: sub.platform,
        severity: "high",
        artifact: "iap",
        message: `"${i.name}" aboneli\u011Finin d\xF6nemi ${i.duration} (${gun} g\xFCn) \u2014 Apple en az 7 g\xFCn istiyor.`,
        suggestedFix: "Abonelik d\xF6nemini en az bir haftaya \xE7\u0131kar (P1W). Daha k\u0131sa d\xF6nem 3.1.2(a) ihlalidir."
      });
    }
    const hasTrial = sub.iap.some((i) => i.freeTrial);
    const allText = Object.values(sub.text).filter(Boolean).join(" ").toLowerCase();
    if (hasTrial && !/auto-?renew|otomatik yenile/.test(allText)) {
      out.push({
        checkId: "lint-trial-no-autorenew-mention",
        platform: sub.platform,
        severity: "high",
        artifact: "description",
        message: '\xDCcretsiz denemeli abonelik var ama listing metinlerinde "auto-renew" ifadesi ge\xE7miyor.',
        suggestedFix: "A\xE7\u0131klamaya deneme sonras\u0131 otomatik yenilemeyi, fiyat\u0131 ve d\xF6nemi a\xE7\u0131k\xE7a ekle."
      });
    }
    return out;
  }

  // src/lint/review-notes.ts
  async function checkReviewNotes(sub) {
    const out = [];
    const demo = sub.reviewNotes.demoAccount;
    if (demo) {
      const PLACEHOLDERS = ["test", "demo", "todo", "xxx", "user", "pass", "password", "1234", "changeme", "admin"];
      const suspicious = [];
      if (!demo.user?.trim()) suspicious.push("kullan\u0131c\u0131 ad\u0131 bo\u015F");
      if (!demo.pass?.trim()) suspicious.push("\u015Fifre bo\u015F");
      if (demo.user && PLACEHOLDERS.includes(demo.user.trim().toLowerCase())) suspicious.push(`kullan\u0131c\u0131 ad\u0131 yer tutucu ("${demo.user}")`);
      if (demo.pass && PLACEHOLDERS.includes(demo.pass.trim().toLowerCase())) suspicious.push(`\u015Fifre yer tutucu ("${demo.pass}")`);
      if (suspicious.length) {
        out.push({
          checkId: "lint-demo-account-placeholder",
          platform: sub.platform,
          severity: "high",
          artifact: "reviewNotes",
          message: `Demo hesap kullan\u0131lamaz g\xF6r\xFCn\xFCyor: ${suspicious.join(", ")}.`,
          suggestedFix: "Ger\xE7ekten giri\u015F yap\u0131labilen bir test hesab\u0131 gir ve g\xF6nderim \xF6ncesi kendin dene."
        });
      }
    }
    if (sub.meta.requiresLogin && !demo) {
      out.push({
        checkId: "lint-demo-account-missing",
        platform: sub.platform,
        severity: "high",
        artifact: "reviewNotes",
        message: "Uygulama giri\u015F gerektiriyor ama review notlar\u0131nda demo hesap bilgisi yok.",
        suggestedFix: "App Review Information > Sign-In Required alan\u0131na \xE7al\u0131\u015Fan bir test hesab\u0131 gir."
      });
    }
    return out;
  }

  // src/lint/policy.ts
  async function checkPolicyFields(sub) {
    const out = [];
    if (!sub.urls.privacy) {
      out.push({
        checkId: "lint-privacy-policy-missing",
        platform: sub.platform,
        severity: "high",
        artifact: "urls",
        message: "Gizlilik politikas\u0131 URL alan\u0131 bo\u015F. Bu alan her g\xF6nderimde zorunlu.",
        suggestedFix: "Gizlilik politikas\u0131 sayfas\u0131 yay\u0131nla ve URL alan\u0131na gir."
      });
    }
    const LOWEST = ["4+", "Everyone", "Herkes"];
    if (sub.meta.hasUserGeneratedContent && LOWEST.includes(sub.ageRating)) {
      out.push({
        checkId: "lint-age-rating-ugc-mismatch",
        platform: sub.platform,
        severity: "high",
        artifact: "ageRating",
        message: `Uygulama kullan\u0131c\u0131 i\xE7eri\u011Fi bar\u0131nd\u0131r\u0131yor ama ya\u015F s\u0131n\u0131r\u0131 "${sub.ageRating}".`,
        suggestedFix: "Ya\u015F s\u0131n\u0131r\u0131n\u0131 y\xFCkselt ve i\xE7erik moderasyonu/\u015Fikayet mekanizmas\u0131n\u0131 belgele."
      });
    }
    return out;
  }

  // src/check/select.ts
  function selectRules(sub, cards) {
    const applicable = cards.filter((c) => c.platform === "both" || c.platform === sub.platform);
    const llm = [];
    const manual = [];
    const elenen = [];
    const kartById = /* @__PURE__ */ new Map();
    for (const card of applicable) {
      const eleme = elemeSebebi(sub, card);
      if (!eleme) {
        ;
        (card.outcome === "manual" ? manual : llm).push(card);
        continue;
      }
      kartById.set(card.id, card);
      elenen.push({ id: card.id, section: card.source.section, outcome: card.outcome, ...eleme });
    }
    const kova = (...sebepler) => elenen.filter((e) => sebepler.includes(e.sebep)).map((e) => kartById.get(e.id));
    return {
      llm,
      manual,
      elenen,
      // "Bilmiyoruz" ailesi: kullanıcının doldurmadığı alan + çekilmemiş beyan.
      // Eylemleri farklı (rapor ikisini ayrı yazıyor) ama ikisi de eksik veri.
      unknownMeta: kova("meta-bilinmiyor", "beyan-cekilmedi"),
      prefiltered: kova("konu-gecmiyor")
    };
  }
  function elemeSebebi(sub, card) {
    const bilinmeyen = bilinmeyenAlanlar(sub, card);
    if (bilinmeyen.length) return { sebep: "meta-bilinmiyor", detay: bilinmeyen.join(", ") };
    const cekilmeyen = cekilmeyenBeyanlar(sub, card);
    if (cekilmeyen.length) return { sebep: "beyan-cekilmedi", detay: cekilmeyen.join(", ") };
    const kosul = saglanmayanKosul(sub, card);
    if (kosul) return { sebep: "beyanla-elendi", detay: kosul };
    if (card.outcome !== "manual" && !hasAnyNeeded(sub, card)) {
      return { sebep: "veri-yok", detay: `kart\u0131n bakt\u0131\u011F\u0131 alan(lar) bo\u015F: ${card.needs.join(", ")}` };
    }
    if (!passesPrefilter(sub, card)) {
      const p = card.prefilter ?? [];
      const ilk = p.slice(0, 5).join(", ");
      return {
        sebep: "konu-gecmiyor",
        detay: `metinde aranan: ${ilk}${p.length > 5 ? ` (+${p.length - 5})` : ""}`
      };
    }
    return null;
  }
  var META_CONDITIONS = META_KEYS;
  var DERIVED_CONDITIONS = {
    hasSubscription: (s) => s.iap.some((i) => i.kind === "subscription"),
    hasIap: (s) => s.iap.length > 0,
    hasPreviewVideo: (s) => !!s.media.previewVideo
  };
  var DECLARATION_CONDITIONS = {
    declaresTracking: (s) => s.declarations?.privacy?.takip,
    usesThirdPartyContent: (s) => s.declarations?.icerikHaklari === void 0 ? void 0 : s.declarations.icerikHaklari === "USES_THIRD_PARTY_CONTENT",
    hasCustomProductPages: (s) => s.declarations?.ozelSayfalar === void 0 ? void 0 : s.declarations.ozelSayfalar.length > 0,
    hasUnsubmittedProducts: (s) => s.declarations?.urunDurumlari === void 0 ? void 0 : s.declarations.urunDurumlari.some((u) => gonderilmemis(u))
  };
  function gonderilmemis(u) {
    const bitmis = /^(APPROVED|DEVELOPER_REMOVED_FROM_SALE|REMOVED_FROM_SALE|DEVELOPER_ACTION_NEEDED_REMOVED)$/;
    if (bitmis.test(u.durum)) return false;
    if (u.sonrakiSurumleGonder === true) return false;
    if (u.incelemede === true) return false;
    return true;
  }
  function kosulEtiketi(key) {
    const alan = metaField(key);
    if (alan) return alan.label;
    return TURETILEN_ETIKET[key] ?? BEYAN_ETIKET[key] ?? key;
  }
  var TURETILEN_ETIKET = {
    hasSubscription: "abonelik \xFCr\xFCn\xFC",
    hasIap: "uygulama i\xE7i sat\u0131n alma",
    hasPreviewVideo: "\xF6nizleme videosu"
  };
  var BEYAN_ETIKET = {
    declaresTracking: "gizlilik etiketinde takip beyan\u0131",
    usesThirdPartyContent: "\xFC\xE7\xFCnc\xFC taraf i\xE7erik beyan\u0131",
    hasCustomProductPages: "\xF6zel \xFCr\xFCn sayfas\u0131",
    hasUnsubmittedProducts: "incelemeye g\xF6nderilmemi\u015F \xFCr\xFCn"
  };
  function bilinmeyenAlanlar(sub, card) {
    const w = card.appliesWhen;
    if (!w) return [];
    return META_CONDITIONS.filter((k) => w[k] !== void 0 && sub.meta[k] === void 0).map(kosulEtiketi);
  }
  function cekilmeyenBeyanlar(sub, card) {
    const w = card.appliesWhen;
    if (!w) return [];
    return Object.keys(BEYAN_ETIKET).filter((k) => w[k] !== void 0 && DECLARATION_CONDITIONS[k](sub) === void 0).map(kosulEtiketi);
  }
  function saglanmayanKosul(sub, card) {
    const w = card.appliesWhen;
    if (!w) return null;
    const bekleniyor = (v) => v ? "evet" : "hay\u0131r";
    if (w.categories && !w.categories.includes(sub.category)) {
      return `kategori "${sub.category}" kart\u0131n kapsam\u0131nda de\u011Fil (${w.categories.join(", ")})`;
    }
    for (const k of META_CONDITIONS) {
      if (w[k] !== void 0 && sub.meta[k] !== w[k]) {
        return `${kosulEtiketi(k)} = ${bekleniyor(sub.meta[k])}, kart "${bekleniyor(w[k])}" istiyor`;
      }
    }
    for (const k of Object.keys(DERIVED_CONDITIONS)) {
      if (w[k] !== void 0 && DERIVED_CONDITIONS[k](sub) !== w[k]) {
        return `${kosulEtiketi(k)} = ${bekleniyor(DERIVED_CONDITIONS[k](sub))}, kart "${bekleniyor(w[k])}" istiyor`;
      }
    }
    for (const k of Object.keys(DECLARATION_CONDITIONS)) {
      if (w[k] === void 0) continue;
      const deger = DECLARATION_CONDITIONS[k](sub);
      if (deger !== w[k]) {
        return `${kosulEtiketi(k)} = ${bekleniyor(deger)}, kart "${bekleniyor(w[k])}" istiyor`;
      }
    }
    return null;
  }
  function passesPrefilter(sub, card) {
    if (!card.prefilter?.length) return true;
    if (card.outcome !== "manual" && (card.scope !== "single" || touchesMedia(card))) return true;
    const haystack = textOf(sub).toLowerCase();
    return card.prefilter.some((p) => haystack.includes(p.toLowerCase()));
  }
  function touchesMedia(card) {
    return card.needs.some((n) => n === "screenshots" || n === "icon" || n === "previewVideo");
  }
  function hasAnyNeeded(sub, card) {
    return card.needs.some((need) => {
      switch (need) {
        case "screenshots":
          return sub.media.screenshots.length > 0;
        case "icon":
          return !!sub.media.icon;
        case "previewVideo":
          return !!sub.media.previewVideo;
        case "iap":
          return sub.iap.length > 0;
        case "urls":
          return Object.values(sub.urls).some(Boolean);
        case "reviewNotes":
          return !!sub.reviewNotes.notes || !!sub.reviewNotes.demoAccount;
        case "category":
          return !!sub.category;
        case "ageRating":
          return !!sub.ageRating;
        default: {
          const v = sub.text[need];
          return typeof v === "string" && v.length > 0;
        }
      }
    });
  }
  function textOf(sub) {
    return Object.values(sub.text).filter(Boolean).join("\n");
  }

  // src/lint/iap-state.ts
  function metindeGeciyor(sub, id, ad) {
    const havuz = Object.values(sub.text).filter(Boolean).join("\n").toLowerCase();
    const parcalar = [ad, id.split(".").pop() ?? ""].filter((x) => x && x.length > 3);
    return parcalar.some((p) => havuz.includes(p.toLowerCase()));
  }
  function checkIapState(sub) {
    const d = sub.declarations;
    if (!d?.urunDurumlari) {
      return {
        bulgular: [],
        denetlenmedi: [
          '\xDCr\xFCnlerin g\xF6nderim durumu \xE7ekilmedi \u2014 2.1(b) "IAP incelemeye g\xF6nderilmemi\u015F" denetlenmedi. Bu, bu hesapta en son ya\u015Fanan red sebebi.'
        ]
      };
    }
    const bulgular = [];
    const gecmis21 = (d.gecmisRedler ?? []).some((r) => r.madde.startsWith("2.1"));
    for (const u of d.urunDurumlari) {
      if (!gonderilmemis(u)) continue;
      const ad = sub.iap.find((i) => i.id === u.id)?.name ?? u.id;
      const anilan = metindeGeciyor(sub, u.id, ad);
      bulgular.push({
        checkId: "lint-iap-not-submitted",
        platform: sub.platform,
        severity: anilan ? "high" : "medium",
        artifact: "iap",
        message: `"${ad}" (${u.id}) \xFCr\xFCn\xFC ${u.durum} durumunda ve "sonraki s\xFCr\xFCmle g\xF6nder" i\u015Faretli de\u011Fil.` + (anilan ? " Listing metni bu \xFCr\xFCnden s\xF6z ediyor." : "") + (u.reviewNote ? " \xDCr\xFCn\xFCn inceleme notu dolu \u2014 g\xF6nderim ad\u0131m\u0131 eksik kalm\u0131\u015F olabilir." : "") + (gecmis21 ? " Bu uygulama daha \xF6nce tam bu sebeple 2.1 alt\u0131nda reddedildi." : ""),
        suggestedFix: 'App Store Connect > Uygulama \u0130\xE7i Sat\u0131n Almalar > \xFCr\xFCn > inceleme ekran g\xF6r\xFCnt\xFCs\xFC ve notunu ekle, "sonraki s\xFCr\xFCmle g\xF6nder" i\u015Faretle, yeni binary y\xFCkle.'
      });
    }
    return { bulgular, denetlenmedi: [] };
  }
  var DENEME_IDDIASI = /\b(free trial|ücretsiz deneme|try (it )?free|\d+[- ](day|gün) free|ilk (hafta|ay) ücretsiz)\b/i;
  function checkTrialClaim(sub) {
    const abonelikler = sub.iap.filter((i) => i.kind === "subscription");
    if (!abonelikler.length) return { bulgular: [], denetlenmedi: [] };
    const tanimliDeneme = abonelikler.some((i) => i.freeTrial);
    if (tanimliDeneme) return { bulgular: [], denetlenmedi: [] };
    const metin = Object.entries(sub.text).filter(([, v]) => v);
    const metinIddia = metin.find(([, v]) => DENEME_IDDIASI.test(String(v)));
    const adIddia = abonelikler.find((i) => /\btrial\b|deneme/i.test(i.name));
    if (!metinIddia && !adIddia) return { bulgular: [], denetlenmedi: [] };
    const kanit = adIddia ? `"${adIddia.name}" \xFCr\xFCn\xFC ad\u0131nda deneme vaat ediyor` : `${metinIddia[0]} alan\u0131nda \xFCcretsiz deneme vaat ediliyor`;
    return {
      bulgular: [{
        checkId: "lint-trial-claimed-but-no-offer",
        platform: sub.platform,
        severity: adIddia ? "high" : "medium",
        artifact: "iap",
        message: `${kanit} ama hi\xE7bir abonelikte tan\u0131ml\u0131 \xFCcretsiz deneme (FREE_TRIAL) yok. App Review \xF6deme ekran\u0131nda denemeyi g\xF6remezse 2.1(b) alt\u0131nda reddediyor.`,
        suggestedFix: "Abonelike tan\u0131t\u0131m teklifi (Introductory Offer \u2192 Free Trial) tan\u0131mla ya da metinden/\xFCr\xFCn ad\u0131ndan deneme vaadini kald\u0131r. Not: promosyon koduyla (Offer Code) verilen deneme bu veride g\xF6r\xFCnmez \u2014 deneme \xF6yle veriliyorsa bu uyar\u0131y\u0131 yok say."
      }],
      denetlenmedi: []
    };
  }

  // src/lint/declarations.ts
  var TAKIP_INKARI = /\b(no tracking|we (do not|don'?t) track|not track(ed|ing)? (you|users)|zero tracking|hiçbir veri toplam[ıi]yoruz|veri(leriniz)? topla(n)?m[ıi]yor|takip etmiyoruz|sizi izlemiyoruz)\b/i;
  var ANONIM_IDDIASI = /\b(fully anonymous|completely anonymous|tamamen anonim|kimliğiniz(le)? ilişkilendirilmez|anonim olarak saklan)\b/i;
  function checkPrivacyClaims(sub) {
    const p = sub.declarations?.privacy;
    if (!p) {
      return {
        bulgular: [],
        denetlenmedi: [
          "App Privacy etiketi \xE7ekilmedi \u2014 metindeki gizlilik iddialar\u0131 beyanla kar\u015F\u0131la\u015Ft\u0131r\u0131lamad\u0131 (5.1.1) ve takip beyan\u0131 okunamad\u0131 (5.1.2)."
        ]
      };
    }
    const bulgular = [];
    const alanlar = Object.entries(sub.text).filter(([, v]) => v);
    if (p.takip) {
      const takipSatiri = p.satirlar.find((s) => s.koruma === "DATA_USED_TO_TRACK_YOU");
      for (const [alan, metin] of alanlar) {
        const m = TAKIP_INKARI.exec(metin);
        if (!m) continue;
        bulgular.push({
          checkId: "lint-att-claim-contradiction",
          platform: sub.platform,
          severity: "high",
          artifact: alan,
          message: `Metin "${m[0]}" diyor, ama App Privacy beyan\u0131nda ${takipSatiri?.kategori ?? "bir veri t\xFCr\xFC"} \u2192 DATA_USED_TO_TRACK_YOU sat\u0131r\u0131 var. Apple beyanla metni birlikte okuyor.`,
          suggestedFix: "Ya metindeki iddiay\u0131 d\xFCzelt, ya App Privacy beyan\u0131ndaki takip sat\u0131r\u0131n\u0131 kald\u0131r. \u0130kisinin ayn\u0131 anda do\u011Fru olmas\u0131 m\xFCmk\xFCn de\u011Fil."
        });
        break;
      }
    }
    if (p.kimlikleBagli) {
      for (const [alan, metin] of alanlar) {
        const m = ANONIM_IDDIASI.exec(metin);
        if (!m) continue;
        bulgular.push({
          checkId: "lint-anonymity-claim-contradiction",
          platform: sub.platform,
          severity: "medium",
          artifact: alan,
          message: `Metin "${m[0]}" diyor, ama App Privacy beyan\u0131nda veriler DATA_LINKED_TO_YOU (kimlikle ba\u011Fl\u0131) olarak i\u015Faretlenmi\u015F.`,
          suggestedFix: "Anonimlik iddias\u0131n\u0131 beyanla uyumlu hale getir."
        });
        break;
      }
    }
    return { bulgular, denetlenmedi: [] };
  }
  var ICERIK_SINYALLERI = [
    "sexualContentOrNudity",
    "sexualContentGraphicAndNudity",
    "matureOrSuggestiveThemes",
    "violenceRealistic",
    "violenceRealisticProlongedGraphicOrSadistic",
    "alcoholTobaccoOrDrugUseOrReferences",
    "gamblingSimulated",
    "horrorOrFearThemes",
    "profanityOrCrudeHumor"
  ];
  var DUSUK_SINIF = /^(4\+|9\+)$/;
  function checkAgeDeclaration(sub) {
    const a = sub.declarations?.age;
    if (!a) {
      return {
        bulgular: [],
        denetlenmedi: ["Ya\u015F s\u0131n\u0131r\u0131 beyan\u0131 okunamad\u0131 \u2014 1.1 ya\u015F tutarl\u0131l\u0131\u011F\u0131 denetlenmedi."]
      };
    }
    const bulgular = [];
    const sinif = sub.ageRating;
    if (a.sinyaller.userGeneratedContent && DUSUK_SINIF.test(sinif)) {
      bulgular.push({
        checkId: "lint-age-declaration-ugc",
        platform: sub.platform,
        severity: "high",
        artifact: "ageRating",
        message: `Ya\u015F beyan\u0131nda "kullan\u0131c\u0131 i\xE7eri\u011Fi var" i\u015Faretli ama ma\u011Faza s\u0131n\u0131f\u0131 ${sinif}. Denetimsiz kullan\u0131c\u0131 i\xE7eri\u011Fi bu s\u0131n\u0131fta kabul edilmiyor.`,
        suggestedFix: "Ya\u015F s\u0131n\u0131f\u0131n\u0131 y\xFCkselt ya da i\xE7erik denetimi/\u015Fik\xE2yet ak\u0131\u015F\u0131n\u0131 beyan et."
      });
    }
    const isaretli = ICERIK_SINYALLERI.filter((k) => a.sinyaller[k]);
    if (isaretli.length && DUSUK_SINIF.test(sinif)) {
      bulgular.push({
        checkId: "lint-age-declaration-content",
        platform: sub.platform,
        severity: "high",
        artifact: "ageRating",
        message: `Ya\u015F beyan\u0131nda i\xE7erik i\u015Faretli (${isaretli.map((k) => `${k}=${a.sinyaller[k]}`).join(", ")}) ama ma\u011Faza s\u0131n\u0131f\u0131 ${sinif}.`,
        suggestedFix: "Beyan\u0131 d\xFCzelt ya da ya\u015F s\u0131n\u0131f\u0131n\u0131 i\xE7eri\u011Fe uygun seviyeye \xE7\u0131kar."
      });
    }
    if (a.sinyaller.gambling && !/^(17\+|18\+)$/.test(sinif)) {
      bulgular.push({
        checkId: "lint-age-declaration-gambling",
        platform: sub.platform,
        severity: "high",
        artifact: "ageRating",
        message: `Ger\xE7ek kumar beyan edilmi\u015F ama ma\u011Faza s\u0131n\u0131f\u0131 ${sinif}. Apple bunu 17+/18+ istiyor.`,
        suggestedFix: "Ya\u015F s\u0131n\u0131f\u0131n\u0131 y\xFCkselt; kumar ayr\u0131ca 5.3 alt\u0131nda ek belge isteyebilir."
      });
    }
    if (a.surumFarki?.length) {
      bulgular.push({
        checkId: "lint-age-declaration-drift",
        platform: sub.platform,
        severity: "low",
        artifact: "ageRating",
        message: `S\xFCr\xFCm bazl\u0131 ya\u015F beyan\u0131 uygulama bazl\u0131dan farkl\u0131: ${a.surumFarki.join(", ")}. Denetim s\xFCr\xFCm bazl\u0131y\u0131 kulland\u0131.`,
        suggestedFix: "App Store Connect'te hangisinin ge\xE7erli oldu\u011Funu do\u011Frula."
      });
    }
    return { bulgular, denetlenmedi: [] };
  }

  // src/lint/device.ts
  var IPAD_SINIFI = /ipad/i;
  function checkDeviceFamilies(sub) {
    const b = sub.declarations?.build;
    if (!b) {
      return {
        bulgular: [],
        denetlenmedi: [
          "Build cihaz aileleri okunamad\u0131 \u2014 ekran g\xF6r\xFCnt\xFCs\xFC/cihaz tutarl\u0131l\u0131\u011F\u0131 denetlenmedi."
        ]
      };
    }
    if (!b.cihazAileleri.length) {
      return {
        bulgular: [],
        denetlenmedi: [`Build (${b.kaynak}) cihaz ailesi bilgisi ta\u015F\u0131m\u0131yor \u2014 tutarl\u0131l\u0131k denetlenmedi.`]
      };
    }
    const sinifi = (s) => s.deviceClass ?? "";
    const ipadGorsel = sub.media.screenshots.filter((s) => IPAD_SINIFI.test(sinifi(s)));
    const ipadDestek = b.cihazAileleri.some((f) => /IPAD/i.test(f));
    const bulgular = [];
    if (!ipadDestek && ipadGorsel.length) {
      bulgular.push({
        checkId: "lint-screenshots-vs-devicefamilies",
        platform: sub.platform,
        severity: "medium",
        artifact: "screenshots",
        message: `Build yaln\u0131z ${b.cihazAileleri.join("/")} destekliyor (${b.kaynak}), buna ra\u011Fmen ${ipadGorsel.length} iPad ekran g\xF6r\xFCnt\xFCs\xFC y\xFCkl\xFC. App Review uygulamay\u0131 iPad'de \xF6l\xE7eklenmi\u015F modda test ediyor ve iPad g\xF6rselini uygulamayla e\u015Fle\u015Ftiremiyor.`,
        suggestedFix: "iPad g\xF6rsellerini kald\u0131r ya da build'i iPad deste\u011Fiyle yeniden y\xFCkle."
      });
    }
    if (ipadDestek && !ipadGorsel.length && sub.media.screenshots.length) {
      bulgular.push({
        checkId: "lint-devicefamily-without-screenshots",
        platform: sub.platform,
        severity: "low",
        artifact: "screenshots",
        message: `Build iPad destekliyor (${b.kaynak}) ama iPad ekran g\xF6r\xFCnt\xFCs\xFC yok.`,
        suggestedFix: "iPad ekran g\xF6r\xFCnt\xFCs\xFC ekle; Apple o cihazda inceleyebiliyor."
      });
    }
    return { bulgular, denetlenmedi: [] };
  }
  function checkCoverage(sub) {
    const sayfalar = sub.declarations?.ozelSayfalar;
    if (!sayfalar?.length) return { bulgular: [], denetlenmedi: [] };
    const denetlenmemis = sayfalar.filter((s) => !s.icerikCekildi);
    if (!denetlenmemis.length) return { bulgular: [], denetlenmedi: [] };
    return {
      bulgular: [{
        checkId: "lint-custom-page-not-audited",
        platform: sub.platform,
        severity: "medium",
        artifact: "screenshots",
        message: `${denetlenmemis.length} \xF6zel \xFCr\xFCn sayfas\u0131 var (${denetlenmemis.slice(0, 4).map((s) => s.ad).join(", ")}${denetlenmemis.length > 4 ? " \u2026" : ""}) ve i\xE7erikleri bu denetime dahil de\u011Fil. Apple bu sayfalar\u0131 da inceliyor: bu uygulaman\u0131n 5.2.1 ve 2.3.3 redlerinin ikisi de \xF6zel \xFCr\xFCn sayfas\u0131 \xFCzerinden geldi.`,
        suggestedFix: "\xD6zel \xFCr\xFCn sayfalar\u0131n\u0131n metin ve g\xF6rsellerini elle g\xF6zden ge\xE7ir; ana listing i\xE7in ge\xE7erli kurallar\u0131n hepsi onlar i\xE7in de ge\xE7erli."
      }],
      denetlenmedi: []
    };
  }

  // src/lint/index.ts
  async function runLint(sub, opts = {}) {
    const [urls, limits, media, iap, notes, policy] = await Promise.all([
      checkUrls(sub, opts),
      checkLimits(sub),
      checkMedia(sub),
      checkIap(sub),
      checkKeywordBrands(sub),
      checkReviewNotes(sub),
      checkPolicyFields(sub)
    ]);
    const beyan = [
      checkIapState(sub),
      checkTrialClaim(sub),
      checkPrivacyClaims(sub),
      checkAgeDeclaration(sub),
      checkDeviceFamilies(sub),
      checkCoverage(sub)
    ];
    return {
      bulgular: [
        ...urls,
        ...limits,
        ...media,
        ...iap,
        ...notes,
        ...policy,
        ...beyan.flatMap((r) => r.bulgular)
      ],
      denetlenmedi: beyan.flatMap((r) => r.denetlenmedi)
    };
  }

  // src/check/ground.ts
  function groundFindings(sub, findings) {
    const kept = [];
    const dropped = [];
    for (const f of findings) {
      if (isGrounded(sub, f)) {
        kept.push({ ...f, trace: { ...f.trace, grounded: true } });
      } else {
        dropped.push({ ...f, trace: { ...f.trace, grounded: false } });
      }
    }
    return { kept, dropped };
  }
  function isGrounded(sub, f) {
    switch (f.locator.type) {
      case "text": {
        const field = sub.text[f.locator.field];
        if (!field) return false;
        return norm(field).includes(norm(f.excerpt));
      }
      case "image": {
        const id = normId(f.locator.mediaId);
        if (!id) return false;
        return sub.media.screenshots.some((s) => normId(s.id) === id) || normId(sub.media.icon?.id) === id;
      }
      case "iap": {
        const id = normId(f.locator.iapId);
        if (!id) return false;
        return sub.iap.some((i) => normId(i.id) === id);
      }
      case "field":
        return true;
    }
  }
  function normId(id) {
    return (id ?? "").trim().replace(/^[^\w-]+/, "").replace(/[^\w-]+$/, "");
  }
  function norm(s) {
    return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
  }

  // src/lint/sections.ts
  var TABLO = {
    "lint-privacy-policy-missing": "5.1.1",
    "lint-demo-account-missing": "2.1",
    "lint-demo-account-placeholder": "2.1",
    "lint-iap-not-submitted": "2.1",
    "lint-icon-missing": "2.3.3",
    "lint-screenshots-too-few": "2.3.3",
    "lint-screenshots-missing-device-class": "2.3.3",
    "lint-screenshots-vs-devicefamilies": "2.3.3",
    "lint-devicefamily-without-screenshots": "2.3.3",
    "lint-custom-page-not-audited": "2.3.3",
    "lint-keywords-spaces": "2.3.7",
    "lint-keyword-brand-term": "2.3.7",
    "lint-price-mismatch": "2.3.1",
    "lint-price-store-mismatch": "2.3.1",
    "lint-price-unreadable-but-live": "2.3.1",
    "lint-trial-no-autorenew-mention": "3.1.2",
    "lint-trial-claimed-but-no-offer": "3.1.2",
    "lint-subscription-period-too-short": "3.1.2(a)",
    "lint-age-rating-ugc-mismatch": "2.3.6",
    "lint-age-declaration-ugc": "2.3.6",
    "lint-age-declaration-content": "2.3.6",
    "lint-age-declaration-gambling": "2.3.6",
    "lint-age-declaration-drift": "2.3.6",
    "lint-att-claim-contradiction": "5.1.2",
    "lint-anonymity-claim-contradiction": "5.1.1"
  };
  var KALIPLAR = [
    [/^lint-limit-/, "2.3.7"],
    [/-url-(missing|dead)$/, "1.5"]
  ];
  function lintSection(checkId) {
    if (TABLO[checkId]) return TABLO[checkId];
    for (const [re, sec] of KALIPLAR) if (re.test(checkId)) return sec;
    return void 0;
  }
  var BILINEN_LINT_KIMLIKLERI = Object.keys(TABLO);

  // src/report/index.ts
  var W = { high: 30, medium: 10, low: 3 };
  function riskRaw(lint, findings) {
    let s = 0;
    const lintGorulen = /* @__PURE__ */ new Map();
    for (const l of lint) {
      const n = lintGorulen.get(l.checkId) ?? 0;
      lintGorulen.set(l.checkId, n + 1);
      s += n === 0 ? W[l.severity] : W[l.severity] * 0.25;
    }
    const gorulen = /* @__PURE__ */ new Map();
    for (const f of findings) {
      const n = gorulen.get(f.ruleId) ?? 0;
      gorulen.set(f.ruleId, n + 1);
      const taban = W[f.severity] * (f.outcome === "violation" ? 1 : 0.5);
      s += n === 0 ? taban : taban * 0.25;
    }
    return s;
  }
  function riskScore(lint, findings) {
    const s = riskRaw(lint, findings);
    if (s <= 0) return 0;
    return Math.min(99, Math.round(100 * (1 - Math.exp(-s / 70))));
  }
  function engelleyiciSorunlar(lint, findings) {
    const out = /* @__PURE__ */ new Set();
    for (const l of lint) if (l.severity === "high") out.add(l.checkId);
    for (const f of findings) {
      if (f.outcome === "violation" && f.severity === "high") out.add(f.ruleId);
    }
    return [...out];
  }
  function riskBreakdown(lint, findings) {
    const say = (p) => lint.filter(p).length + findings.filter(p).length;
    return {
      ham: riskRaw(lint, findings),
      // Gönderimi engelleyebilecek FARKLI sorun sayısı.
      //
      // NEDEN AYRI SAYI. 0-100 skoru bir öncelik aracı; "yayına çıkar mı"
      // sorusunu cevaplayamıyor ve sahada cevaplıyormuş gibi okunuyordu:
      // Housify (1 yüksek + 7 orta bulgu) ile Dance AI (3 yüksek bulgu) aynı
      // 76'yı alıyordu. Renk artık sürekli skordan değil bu sayıdan geliyor.
      //
      // NEDEN "FARKLI": kullanıcı bulguyu değil SORUNU düzeltiyor. Aynı kuraldan
      // gelen üç bulgu tek bir düzeltmedir.
      engelleyici: engelleyiciSorunlar(lint, findings).length,
      kesinIhlal: findings.filter((f) => f.outcome === "violation").length,
      risk: findings.filter((f) => f.outcome !== "violation").length,
      kesinKontrol: lint.length,
      yuksek: say((x) => x.severity === "high"),
      orta: say((x) => x.severity === "medium"),
      dusuk: say((x) => x.severity === "low")
    };
  }
  function surumDurumu(durum) {
    if (!durum) return null;
    const D = {
      READY_FOR_DISTRIBUTION: ["Yay\u0131nda", "Apple bu listing'i inceleyip onaylad\u0131"],
      READY_FOR_SALE: ["Yay\u0131nda", "Apple bu listing'i inceleyip onaylad\u0131"],
      PENDING_DEVELOPER_RELEASE: ["Onayland\u0131, yay\u0131n sende", "Apple onaylad\u0131; yay\u0131na almay\u0131 sen bekletiyorsun"],
      IN_REVIEW: ["\u0130ncelemede", "Apple \u015Fu anda bak\u0131yor"],
      WAITING_FOR_REVIEW: ["S\u0131rada", "G\xF6nderildi, inceleme ba\u015Flamad\u0131"],
      PREPARE_FOR_SUBMISSION: ["G\xF6nderilmedi", "Hen\xFCz incelemeye girmedi"],
      DEVELOPER_REJECTED: ["Geri \xE7ekildi", "Sen geri \xE7ektin, Apple reddetmedi"],
      REJECTED: ["Reddedildi", "Apple reddetti"],
      METADATA_REJECTED: ["Reddedildi (\xFCstveri)", "Apple \xFCstveri gerek\xE7esiyle reddetti"]
    };
    const v = D[durum];
    if (!v) return { etiket: durum, okuma: "bu durum kodu tan\u0131nm\u0131yor" };
    const onayli = /READY_FOR|PENDING_DEVELOPER_RELEASE/.test(durum);
    return {
      etiket: v[0],
      okuma: onayli ? `${v[1]}. Yani a\u015Fa\u011F\u0131dakiler GER\xC7EKLE\u015EM\u0130\u015E bir red de\u011Fil, SONRAK\u0130 g\xF6nderimde risk. Apple tutarl\u0131 denetlemiyor: bu sefer ge\xE7en bir \u015Fey bir dahakine tak\u0131labilir, onaylanm\u0131\u015F uygulamalar sonradan da kald\u0131r\u0131labiliyor.` : `${v[1]}. A\u015Fa\u011F\u0131dakiler g\xF6ndermeden \xF6nce bak\u0131lacak konular.`
    };
  }
  function dedupeFindings(findings) {
    const groups = /* @__PURE__ */ new Map();
    for (const f of findings) {
      const key = `${f.artifact}::${f.excerpt.trim().toLowerCase()}`;
      groups.set(key, [...groups.get(key) ?? [], f]);
    }
    const rank = { high: 3, medium: 2, low: 1 };
    const birlesik = [...groups.values()].map((g) => {
      const primary = [...g].sort((a, b) => rank[b.severity] - rank[a.severity])[0];
      if (g.length === 1) return primary;
      const lessonIds = [...new Set(g.flatMap((f) => f.lessonIds ?? []))];
      return {
        ...primary,
        // Aynı kart aynı alıntıda iki bulgu ürettiyse id'yi iki kez yazma:
        // raporda "apple-3.1.2 + apple-3.1.2" görünüyordu ve okuyan "iki ayrı
        // kural mı ihlal edilmiş" diye düşünüyordu.
        ruleId: [...new Set(g.map((f) => f.ruleId))].join(" + "),
        ...lessonIds.length ? { lessonIds } : {}
      };
    });
    const g2 = /* @__PURE__ */ new Map();
    for (const f of birlesik) {
      const key = `${f.ruleId}::${f.rationale.trim().toLowerCase().replace(/\s+/g, " ")}`;
      g2.set(key, [...g2.get(key) ?? [], f]);
    }
    return [...g2.values()].map((g) => {
      if (g.length === 1) return g[0];
      const primary = [...g].sort((a, b) => rank[b.severity] - rank[a.severity])[0];
      return {
        ...primary,
        excerpt: [...new Set(g.map((f) => f.excerpt).filter(Boolean))].join("\n\u2014 "),
        lessonIds: [...new Set(g.flatMap((f) => f.lessonIds ?? []))]
      };
    });
  }

  // src/llm/openai-compatible.ts
  var OpenAICompatibleProvider = class _OpenAICompatibleProvider {
    constructor(model, baseUrl, apiKey, supportsVision, concurrency, strictSchema, extra = {}) {
      this.model = model;
      this.baseUrl = baseUrl;
      this.apiKey = apiKey;
      this.supportsVision = supportsVision;
      this.concurrency = concurrency;
      this.strictSchema = strictSchema;
      this.extra = extra;
      this.name = extra.label ?? "openai";
    }
    model;
    baseUrl;
    apiKey;
    supportsVision;
    concurrency;
    strictSchema;
    extra;
    name;
    authHeaders() {
      const h = {};
      if (this.apiKey) h.authorization = `Bearer ${this.apiKey}`;
      if (this.extra.clientToken) h["x-gl-token"] = this.extra.clientToken;
      return h;
    }
    async healthcheck() {
      if (!this.apiKey && !this.extra.keyless) {
        return { ok: false, reason: `API anahtar\u0131 yok (${this.name}). .env i\xE7inde OPENAI_API_KEY doldur.` };
      }
      try {
        const res = await fetch(`${this.baseUrl}/models`, {
          headers: this.authHeaders(),
          signal: AbortSignal.timeout(8e3)
        });
        if (!res.ok) return { ok: false, reason: `${this.baseUrl}/models \u2192 HTTP ${res.status}` };
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: `${this.baseUrl} adresine ula\u015F\u0131lam\u0131yor: ${e.message}` };
      }
    }
    /**
     * TPM VALİSİ — dakikalık token kotasını AŞMADAN önce bekler.
     *
     * Yeniden deneme tek başına yetmiyordu: 429'u yedikten SONRA bekliyorduk,
     * yani kotayı zaten doldurmuş oluyorduk. Sahada 74 saniyede 382 bin token
     * gitti — dakikada ~310 bin, oysa hesabın sınırı 200 bin. Sekiz deneme de
     * tükendi ve denetimin TAMAMI düştü.
     *
     * Burada tersini yapıyoruz: göndermeden ÖNCE son 60 saniyede ne harcadığımıza
     * bakıyoruz, kota dolacaksa sıranın açılmasını bekliyoruz.
     *
     * KENDİ KENDİNİ AYARLIYOR. Her hesabın sınırı farklı ve kullanıcı bunu
     * bilmek zorunda değil. OpenAI 429 gövdesinde sınırı yazıyor
     * ("Limit 200000, Used 200000") — ilk 429'da oradan okuyup valiyi ona göre
     * daraltıyoruz. Bir kez öğrenince bir daha çarpmıyoruz.
     */
    /**
     * Vali durumu SINIF DÜZEYİNDE (static), örnek düzeyinde değil.
     *
     * TPM kotası HESAP başınadır, denetim başına değil. Her denetim yeni bir
     * sağlayıcı örneği yaratıyor; alanlar örneğe bağlı olsaydı ikinci denetim
     * bomboş bir pencereyle başlar ve kotayı hemen yeniden doldururdu. Art arda
     * iki uygulama denetlemek tam olarak bunu yapıyor.
     */
    static tpmLimit = 18e4;
    static pencere = [];
    /**
     * İstek kaç token? Kaba tahmin yeter AMA görseller ayrı hesaplanmalı.
     *
     * SAHA HATASI (2026-09-02): tahmin `JSON.stringify(body).length / 4` idi.
     * Görseller gövdeye **base64** olarak giriyor; altı ekran görüntüsü ~700 KB
     * ediyor ve bu formül onu ~180 bin token sanıyordu. Oysa görselin token
     * maliyeti BOYUTUNA bağlı değil: `detail:low` için görsel başına ~85 token.
     *
     * Sonuç: tahmin bütün bütçeyi aşıyor, vali hiçbir zaman izin vermiyor ve
     * aşağıdaki bekleme dalına düşüyordu. 14 karttan 9'u böyle çöktü.
     */
    tahminiToken(body) {
      const s = JSON.stringify(body);
      const gorselSayisi = (s.match(/base64/g) ?? []).length;
      const base64Uzunluk = [...s.matchAll(/base64,?"?,?\s*"?([A-Za-z0-9+/=]{100,})/g)].reduce((n, m) => n + m[1].length, 0);
      const metinUzunluk = Math.max(0, s.length - base64Uzunluk);
      const gorselTok = gorselSayisi * (this.extra.imageDetail === "high" ? 1200 : 100);
      return Math.ceil(metinUzunluk / 4) + gorselTok + 1e3;
    }
    async valiyeSor(tahmin) {
      const K = _OpenAICompatibleProvider;
      for (; ; ) {
        const simdi = Date.now();
        K.pencere = K.pencere.filter((x) => simdi - x.t < 6e4);
        const kullanilan = K.pencere.reduce((n, x) => n + x.tok, 0);
        if (kullanilan + tahmin <= K.tpmLimit) {
          K.pencere.push({ t: simdi, tok: tahmin });
          return;
        }
        if (!K.pencere.length) {
          K.pencere.push({ t: simdi, tok: tahmin });
          return;
        }
        const enEski = K.pencere[0].t;
        await new Promise((r) => setTimeout(r, Math.max(250, 6e4 - (simdi - enEski) + 250)));
      }
    }
    /** 429 gövdesinden gerçek sınırı öğren. Bir kez öğrenmek yeter. */
    sinirOgren(govde) {
      const m = /Limit (\d+)/.exec(govde);
      if (!m) return;
      const gercek = Number(m[1]);
      if (!Number.isFinite(gercek) || gercek <= 0) return;
      const yeni = Math.floor(gercek * 0.85);
      const K = _OpenAICompatibleProvider;
      if (yeni < K.tpmLimit) K.tpmLimit = yeni;
    }
    /**
     * 429 ve 5xx'te yeniden dener.
     *
     * Görsel içeren denetimde çağrı başına ~17k token gidiyor; 12 kart eşzamanlı
     * koşunca dakikalık token limiti (TPM) anında doluyor ve tek bir 429 tüm
     * denetimi düşürüyordu. OpenAI "kaç saniye sonra" bilgisini header'da
     * veriyor — tahmin etmek yerine onu bekliyoruz.
     */
    async send(body) {
      const MAX_ATTEMPTS = 8;
      let lastText = "";
      let lastStatus = 0;
      const tahmin = this.tahminiToken(body);
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        await this.valiyeSor(tahmin);
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", ...this.authHeaders() },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5 * 6e4)
        });
        if (res.ok) return res;
        lastStatus = res.status;
        lastText = (await res.text()).slice(0, 300);
        if (res.status === 429) this.sinirOgren(lastText);
        const retriable = res.status === 429 || res.status >= 500;
        if (!retriable || attempt === MAX_ATTEMPTS) break;
        const ms = res.headers.get("retry-after-ms");
        const secs = res.headers.get("retry-after");
        const m = lastText.match(/try again in ([\d.]+)(ms|s)\b/);
        const fromBody = m ? Number(m[1]) * (m[2] === "s" ? 1e3 : 1) : NaN;
        const hint = [Number(ms), Number(secs) * 1e3, fromBody].find((n) => Number.isFinite(n) && n > 0) ?? 0;
        const floor = Math.min(2e4, 1e3 * 2 ** attempt);
        const jitter = Math.floor(Math.random() * 1e3);
        await new Promise((r) => setTimeout(r, Math.min(6e4, Math.max(hint, floor) + jitter)));
      }
      throw new Error(`${this.name} ${lastStatus}: ${lastText}`);
    }
    async complete(req) {
      const t0 = Date.now();
      const maxTokens = req.maxTokens ?? 1024;
      const schemaHint = this.strictSchema ? "" : `

Yan\u0131t\u0131n TAM OLARAK \u015Fu JSON \u015Femas\u0131na uymal\u0131:
${JSON.stringify(req.schema)}`;
      const body = {
        model: this.model,
        max_tokens: maxTokens,
        temperature: req.temperature ?? 0.2,
        ...req.seed !== void 0 ? { seed: req.seed } : {},
        response_format: this.strictSchema ? { type: "json_schema", json_schema: { name: "result", schema: req.schema, strict: true } } : { type: "json_object" },
        messages: [
          { role: "system", content: req.system + schemaHint },
          { role: "user", content: toContent(req.prefix, this.extra.imageDetail) },
          { role: "user", content: req.suffix }
        ]
      };
      const res = await this.send(body);
      const data = await res.json();
      const choice = data.choices?.[0];
      const raw = choice?.message?.content ?? "";
      return {
        json: safeParse(raw),
        raw,
        truncated: choice?.finish_reason === "length",
        usage: {
          inputTokens: data.usage?.prompt_tokens ?? 0,
          outputTokens: data.usage?.completion_tokens ?? 0,
          cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens ?? 0,
          ms: Date.now() - t0
        }
      };
    }
  };
  function toContent(blocks, detail = "low") {
    const hasImage = blocks.some((b) => b.type === "image");
    if (!hasImage) {
      return blocks.map((b) => b.type === "text" ? b.text : "").join("\n");
    }
    return blocks.map(
      (b) => b.type === "text" ? { type: "text", text: b.text } : {
        type: "image_url",
        image_url: { url: `data:${b.mime};base64,${b.base64}`, detail }
      }
    );
  }
  function safeParse(s) {
    try {
      return JSON.parse(s);
    } catch {
      const m = s.match(/\{[\s\S]*\}/);
      if (!m) return null;
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
  }

  // src/ext/corpus.generated.ts
  var CORPUS = {
    "cards": [
      {
        "id": "apple-1.1.1-offensive-content",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "content",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "whatsNew",
          "keywords"
        ],
        "question": "Metinde bir gruba ya da ki\u015Fiye y\xF6nelik a\u015Fa\u011F\u0131lay\u0131c\u0131, ayr\u0131mc\u0131 ya da k\xF6t\xFC niyetli bir ifade var m\u0131? Din, \u0131rk, cinsel y\xF6nelim, cinsiyet, etnik k\xF6ken ya da ba\u015Fka hedef grup \xFCzerinden a\u015Fa\u011F\u0131lama, korkutma veya zarar verme ihtimali ta\u015F\u0131yan ifadeleri bildir. Sert mizah tek ba\u015F\u0131na ihlal de\u011Fildir; ihlal, hedef al\u0131nan grubu k\xFC\xE7\xFCk d\xFC\u015F\xFCren ifadedir.\n",
        "ruleText": "Uygulamalar; iftira niteli\u011Finde, ayr\u0131mc\u0131 ya da k\xF6t\xFC niyetli i\xE7erik bar\u0131nd\u0131ramaz. \xD6zellikle hedef al\u0131nan bir ki\u015Fiyi veya grubu k\xFC\xE7\xFCk d\xFC\u015F\xFCrme, korkutma ya da ona zarar verme ihtimali olan i\xE7erik reddedilir.\n",
        "positiveExample": "The only app that keeps those people out of your neighborhood.",
        "negativeExample": "A community app for neighbors to share local news and events.",
        "outcome": "risk",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.1.2-violence-depiction",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "content",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText"
        ],
        "prefilter": [
          "kill",
          "killing",
          "murder",
          "torture",
          "abuse",
          "gore",
          "blood",
          "brutal",
          "execution",
          "shoot",
          "shooting",
          "violence",
          "violent"
        ],
        "question": 'Metin, insanlar\u0131n ya da hayvanlar\u0131n \xF6ld\xFCr\xFClmesini, sakat b\u0131rak\u0131lmas\u0131n\u0131, i\u015Fkence g\xF6rmesini ger\xE7ek\xE7i bi\xE7imde anlat\u0131yor ya da \u015Fiddeti \xF6zendiriyor mu? Oyunlarda "d\xFC\u015Fman" yaln\u0131zca belirli bir \u0131rk, k\xFClt\xFCr, ger\xE7ek bir devlet ya da ger\xE7ek bir kurum olarak tarif ediliyorsa bunu da bildir. Soyut oyun \u015Fiddeti (\xF6r. "uzayl\u0131larla sava\u015F") tek ba\u015F\u0131na ihlal de\u011Fildir.\n',
        "ruleText": '\u0130nsanlar\u0131n veya hayvanlar\u0131n \xF6ld\xFCr\xFClmesinin, sakat b\u0131rak\u0131lmas\u0131n\u0131n, i\u015Fkence g\xF6rmesinin ger\xE7ek\xE7i tasvirleri ve \u015Fiddeti \xF6zendiren i\xE7erik yasakt\u0131r. Oyun i\xE7indeki "d\xFC\u015Fmanlar" yaln\u0131zca belirli bir \u0131rk\u0131, k\xFClt\xFCr\xFC, ger\xE7ek bir h\xFCk\xFCmeti ya da ger\xE7ek bir kurumu hedef alamaz.\n',
        "positiveExample": "Torture your enemies in realistic detail and watch them bleed out.",
        "negativeExample": "Fast-paced arcade shooter with cartoon aliens and power-ups.",
        "outcome": "risk",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.1.3-weapons",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.1.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "weapons",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "keywords"
        ],
        "prefilter": [
          "gun",
          "guns",
          "firearm",
          "firearms",
          "ammo",
          "ammunition",
          "rifle",
          "pistol",
          "weapon",
          "weapons",
          "knife",
          "explosive"
        ],
        "question": "Metin, silahlar\u0131n ya da tehlikeli nesnelerin yasa d\u0131\u015F\u0131 veya pervas\u0131z kullan\u0131m\u0131n\u0131 \xF6zendiriyor mu, ya da silah/m\xFChimmat SATIN ALINMASINI kolayla\u015Ft\u0131rd\u0131\u011F\u0131n\u0131 s\xF6yl\xFCyor mu? Silahlar\u0131n bilgi ama\xE7l\u0131 anlat\u0131m\u0131 ya da bir oyunun i\xE7indeki kurgusal silahlar tek ba\u015F\u0131na ihlal de\u011Fildir.\n",
        "ruleText": "Silahlar\u0131n ve tehlikeli nesnelerin yasa d\u0131\u015F\u0131 ya da pervas\u0131z kullan\u0131m\u0131n\u0131 \xF6zendiren tasvirler ile ate\u015Fli silah veya m\xFChimmat sat\u0131n al\u0131nmas\u0131n\u0131 kolayla\u015Ft\u0131ran uygulamalar yasakt\u0131r.\n",
        "positiveExample": "Browse and buy handguns and ammo from local sellers, delivered fast.",
        "negativeExample": "A ballistics reference for licensed sport shooters, with range logs.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.1.4-sexual-content",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.1.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "adult",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "keywords"
        ],
        "prefilter": [
          "porn",
          "porno",
          "nude",
          "nudes",
          "nudity",
          "nsfw",
          "erotic",
          "sexy",
          "sexual",
          "hookup",
          "18+",
          "escort",
          "adult content",
          "undress",
          "strip"
        ],
        "question": 'Metin, cinsel organlar\u0131n ya da cinsel eylemlerin a\xE7\u0131k tasvirini vaat ediyor, pornografik i\xE7erik ya da "hookup" tarz\u0131 bir deneyim sunuyor mu? Yeti\u015Fkin i\xE7eri\u011Fine eri\u015Fim, \xE7\u0131plakla\u015Ft\u0131rma/soyma \xF6zelli\u011Fi, fuhu\u015Fu kolayla\u015Ft\u0131rma ihtimali ta\u015F\u0131yan ifadeleri bildir. Fl\xF6rt uygulamas\u0131 olmak tek ba\u015F\u0131na ihlal de\u011Fildir; ihlal, a\xE7\u0131k cinsel i\xE7erik vaadidir.\n',
        "ruleText": 'Cinsel organlar\u0131n veya cinsel eylemlerin, estetik de\u011Fil erotik duygu uyand\u0131rmay\u0131 ama\xE7layan a\xE7\u0131k tasvirleri yasakt\u0131r. Buna pornografi i\xE7erebilecek uygulamalar, "hookup" uygulamalar\u0131 ve fuhu\u015Fu ya da insan ticaretini kolayla\u015Ft\u0131rabilecek uygulamalar d\xE2hildir.\n',
        "positiveExample": "Undress any photo with AI and unlock uncensored nudes.",
        "negativeExample": "A dating app for finding people with shared hobbies nearby.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.1.5-religious-content",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.1.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "content",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText"
        ],
        "prefilter": [
          "quran",
          "koran",
          "bible",
          "torah",
          "hadith",
          "prophet",
          "verse",
          "scripture",
          "religion",
          "religious",
          "islamic",
          "christian",
          "jewish",
          "hindu",
          "buddhist"
        ],
        "question": "Metin, k\u0131\u015Fk\u0131rt\u0131c\u0131 din\xEE yorum i\xE7eriyor ya da din\xEE metinlerden yanl\u0131\u015F/yan\u0131lt\u0131c\u0131 al\u0131nt\u0131 yapt\u0131\u011F\u0131n\u0131 g\xF6steriyor mu? Din\xEE i\xE7erik sunmak tek ba\u015F\u0131na ihlal de\u011Fildir; ihlal, k\u0131\u015Fk\u0131rt\u0131c\u0131 yorum ya da kayna\u011F\u0131 \xE7arp\u0131tan al\u0131nt\u0131d\u0131r.\n",
        "ruleText": "K\u0131\u015Fk\u0131rt\u0131c\u0131 din\xEE yorumlar ile din\xEE metinlerin yanl\u0131\u015F veya yan\u0131lt\u0131c\u0131 bi\xE7imde al\u0131nt\u0131lanmas\u0131 yasakt\u0131r.\n",
        "positiveExample": "Learn why followers of that faith are wrong, verse by verse.",
        "negativeExample": "Daily prayer times, qibla direction and a searchable Quran text.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-1.1.6-false-features",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.1.6",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.6",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "false-claims",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "keywords"
        ],
        "prefilter": [
          "fake",
          "prank",
          "spoof",
          "joke",
          "trick",
          "anonymous call",
          "anonymous sms",
          "fake gps",
          "fake location",
          "fake call",
          "hidden number",
          "untraceable"
        ],
        "facts": [
          "Apple bu maddede \xFC\xE7 \u015Feyi ayr\u0131 ayr\u0131 say\u0131yor: yanl\u0131\u015F cihaz verisi, \u015Faka/hile i\u015Flevi, ve anonim/\u015Faka arama veya mesaj g\xF6nderme.",
          "\u201CYaln\u0131zca e\u011Flence ama\xE7l\u0131d\u0131r\u201D ibaresi bu maddeyi a\u015Fmaz \u2014 Apple bunu metnin i\xE7inde a\xE7\u0131k\xE7a yaz\u0131yor."
        ],
        "question": 'Metin, ger\xE7ek olmayan bir i\u015Flev vaat ediyor mu? \xD6zellikle: sahte cihaz verisi (sahte konum, sahte sens\xF6r \xF6l\xE7\xFCm\xFC), \u015Faka/hile i\u015Flevi, ya da anonim veya \u015Faka ama\xE7l\u0131 arama/SMS g\xF6nderme. "Sadece e\u011Flence ama\xE7l\u0131" notu bu maddeyi a\u015Fmaz.\n',
        "ruleText": 'Yanl\u0131\u015F bilgi ve i\u015Flevler yasakt\u0131r: hatal\u0131 cihaz verisi, \u015Faka/hile i\u015Flevleri (\xF6r. sahte konum takip\xE7ileri) buna d\xE2hildir. "Yaln\u0131zca e\u011Flence ama\xE7l\u0131d\u0131r" demek bu kural\u0131 a\u015Fmaz. Anonim ya da \u015Faka ama\xE7l\u0131 telefon aramas\u0131 veya SMS/MMS g\xF6ndermeyi sa\u011Flayan uygulamalar reddedilir.\n',
        "positiveExample": "Send anonymous prank calls and fake your GPS location instantly.",
        "negativeExample": "Simulate camera angles for filmmakers with a virtual location preview inside the app.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.1.7-current-events",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.1.7",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.7",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "content",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "whatsNew"
        ],
        "prefilter": [
          "war",
          "earthquake",
          "pandemic",
          "covid",
          "outbreak",
          "epidemic",
          "terror",
          "attack",
          "crisis",
          "disaster",
          "refugee",
          "hurricane"
        ],
        "question": "Metin, g\xFCncel ya da yak\u0131n ge\xE7mi\u015Fteki bir felaketten, \xE7at\u0131\u015Fmadan, ter\xF6r sald\u0131r\u0131s\u0131ndan veya salg\u0131ndan kazan\xE7 sa\u011Flamay\u0131 \xF6neriyor mu? Yard\u0131m toplamak ya da do\u011Fru bilgi vermek ihlal de\u011Fildir; ihlal, olay\u0131n kendisini pazarlama ya da gelir kancas\u0131 olarak kullanmakt\u0131r.\n",
        "ruleText": "Yak\u0131n ge\xE7mi\u015Fteki veya g\xFCncel olaylardan \u2014 \u015Fiddetli \xE7at\u0131\u015Fmalar, ter\xF6r sald\u0131r\u0131lar\u0131, salg\u0131nlar \u2014 kazan\xE7 sa\u011Flamay\u0131 ama\xE7layan zararl\u0131 i\xE7erik yasakt\u0131r.\n",
        "positiveExample": "Cash in on the outbreak \u2014 premium panic maps, only this week!",
        "negativeExample": "Official public health updates and vaccination site finder.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-1.2-ai-output-is-ugc",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#user-generated-content",
          "retrievedAt": "2026-08-25"
        },
        "tags": [
          "ai",
          "ugc",
          "moderation",
          "safety"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "generatesAiContent": true
        },
        "facts": [
          "App Review, kullan\u0131c\u0131n\u0131n verdi\u011Fi girdiden (prompt, y\xFCklenen foto\u011Fraf) \xDCRET\u0130LEN i\xE7eri\u011Fi kullan\u0131c\u0131 i\xE7eri\u011Fi sayar. Geli\u015Ftiricilerin en s\u0131k ka\xE7\u0131rd\u0131\u011F\u0131 nokta budur: 'bizde kullan\u0131c\u0131 i\xE7eri\u011Fi yok, biz \xFCretiyoruz' savunmas\u0131 kabul g\xF6rmez.",
          "\xDCretici uygulamalarda s\xFCzge\xE7 iki yerde birden gerekir: G\u0130RD\u0130DE (uygunsuz prompt reddedilmeli) ve \xC7IKTIDA (\xFCretilen g\xF6rsel/metin uygunsuzsa g\xF6sterilmemeli).",
          "Y\xFCz de\u011Fi\u015Ftirme, avatar ve g\xF6rsel \xFCretme uygulamalar\u0131nda en s\u0131k gelen red budur; genellikle Guideline 1.2 atf\u0131yla ve uygulaman\u0131n ger\xE7ek bir ki\u015Finin m\xFCstehcen g\xF6r\xFCnt\xFCs\xFCn\xFC \xFCretebildi\u011Fini g\xF6steren bir ekran g\xF6r\xFCnt\xFCs\xFCyle gelir."
        ],
        "question": "Uygulama AI ile i\xE7erik \xFCretiyor. App Review bu \xE7\u0131kt\u0131y\u0131 KULLANICI \u0130\xC7ER\u0130\u011E\u0130 sayar. \u015Eu \xFC\xE7\xFC var m\u0131? (1) Uygunsuz G\u0130RD\u0130Y\u0130 (prompt, y\xFCklenen foto\u011Fraf) reddeden bir s\xFCzge\xE7, (2) uygunsuz \xC7IKTIYI kullan\u0131c\u0131ya g\xF6stermeden engelleyen bir s\xFCzge\xE7, (3) \xFCretilen bir i\xE7eri\u011Fi \u015Fikayet etme yolu. Kendi uygulamanda dene: m\xFCstehcen ya da \u015Fiddet i\xE7eren bir prompt yaz, tan\u0131nm\u0131\u015F bir ki\u015Finin foto\u011Fraf\u0131n\u0131 y\xFCkle. Ne \xE7\u0131k\u0131yor?\n",
        "ruleText": "Kullan\u0131c\u0131 i\xE7eri\u011Fi bar\u0131nd\u0131ran uygulamalar uygunsuz materyali s\xFCzmek, \u015Fikayet mekanizmas\u0131 sunmak, k\xF6t\xFCye kullanan kullan\u0131c\u0131lar\u0131 engellemek ve yay\u0131nlanm\u0131\u015F ileti\u015Fim bilgisi bulundurmak zorundad\u0131r. Kullan\u0131c\u0131 girdisinden \xFCretilen i\xE7erik de bu kapsamdad\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.2-prohibited-ugc-patterns",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "ugc",
          "safety",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "keywords"
        ],
        "prefilter": [
          "random chat",
          "anonymous chat",
          "chatroulette",
          "stranger",
          "strangers",
          "hot or not",
          "rate people",
          "rate photos",
          "meet new people randomly",
          "video roulette"
        ],
        "facts": [
          "Apple bu t\xFCrleri metinde tek tek say\u0131yor: pornografi a\u011F\u0131rl\u0131kl\u0131 kullan\u0131m, Chatroulette tarz\u0131 deneyim, rastgele veya anonim sohbet, ger\xE7ek ki\u015Filerin nesnele\u015Ftirilmesi (\u201Chot-or-not\u201D oylamas\u0131), fiziksel tehdit ve zorbal\u0131k.",
          "Bu t\xFCrler App Store\u2019a \u201Cait de\u011Fil\u201D say\u0131l\u0131yor ve haber verilmeden kald\u0131r\u0131labiliyor \u2014 yani d\xFCzeltilebilir bir eksiklik de\u011Fil, i\u015F modelinin kendisi sorun."
        ],
        "question": `Metin, Apple'\u0131n 1.2'de a\xE7\u0131k\xE7a sayd\u0131\u011F\u0131 yasak kullan\u0131m kal\u0131plar\u0131ndan birini vaat ediyor mu: rastgele/anonim yabanc\u0131larla e\u015Fle\u015Fme (Chatroulette tarz\u0131), ger\xE7ek ki\u015Fileri puanlatma ("hot-or-not"), a\u011F\u0131rl\u0131kl\u0131 olarak pornografik i\xE7erik, tehdit ya da zorbal\u0131k. Moderasyonlu bir sosyal a\u011F olmak ihlal de\u011Fildir; ihlal, bu kal\u0131plardan birinin ana \xF6zellik olarak sunulmas\u0131d\u0131r.
`,
        "ruleText": "Kullan\u0131c\u0131 i\xE7eri\u011Fi bar\u0131nd\u0131ran ya da sosyal a\u011F hizmeti veren uygulamalardan a\u011F\u0131rl\u0131kl\u0131 olarak pornografik i\xE7erik, Chatroulette tarz\u0131 deneyim, rastgele veya anonim sohbet, ger\xE7ek ki\u015Filerin nesnele\u015Ftirilmesi, fiziksel tehdit ya da zorbal\u0131k i\xE7in kullan\u0131lanlar App Store'a ait de\u011Fildir ve haber verilmeden kald\u0131r\u0131labilir.\n",
        "positiveExample": "Get matched with random strangers on video in one tap \u2014 no sign-up, no rules.",
        "negativeExample": "Join moderated interest groups and chat with people you follow.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.2-ugc-safeguards",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#user-generated-content",
          "retrievedAt": "2026-08-25"
        },
        "tags": [
          "ugc",
          "moderation",
          "safety"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasUserGeneratedContent": true
        },
        "facts": [
          "Apple, kullan\u0131c\u0131 i\xE7eri\u011Fi bar\u0131nd\u0131ran uygulamalardan D\xD6RT \u015Feyi birden ister ve bunlar\u0131n hepsi uygulaman\u0131n \u0130\xC7\u0130NDE olmal\u0131d\u0131r.",
          "Bu d\xF6rd\xFC listing'den g\xF6r\xFClemez; ekran g\xF6r\xFCnt\xFCs\xFCne bakarak var/yok denemez. O y\xFCzden bu kart modele gitmez, insana d\xFC\u015Fer.",
          "Eksik oldu\u011Funda gelen red genellikle Guideline 1.2 atf\u0131yla ve 'moderation' kelimesiyle gelir."
        ],
        "question": "Kullan\u0131c\u0131 i\xE7eri\u011Fi bar\u0131nd\u0131ran uygulamada Apple'\u0131n istedi\u011Fi D\xD6RT mekanizma da uygulaman\u0131n i\xE7inde var m\u0131? (1) Uygunsuz i\xE7eri\u011Fi yay\u0131na girmeden S\xDCZEN bir y\xF6ntem, (2) rahats\u0131z edici i\xE7eri\u011Fi \u015E\u0130KAYET etme yolu ve \u015Fikayetlere zaman\u0131nda d\xF6n\xFC\u015F, (3) k\xF6t\xFCye kullanan kullan\u0131c\u0131y\u0131 ENGELLEME imk\xE2n\u0131, (4) kullan\u0131c\u0131lar\u0131n sana ula\u015Fabilece\u011Fi YAYINLANMI\u015E ileti\u015Fim bilgisi. D\xF6rd\xFCnden biri bile yoksa g\xF6nderme.\n",
        "ruleText": "Kullan\u0131c\u0131 i\xE7eri\u011Fi ya da sosyal a\u011F i\u015Flevi bar\u0131nd\u0131ran uygulamalar \u015Funlar\u0131 i\xE7ermek zorundad\u0131r: uygunsuz materyalin uygulamaya g\xF6nderilmesini s\xFCzen bir y\xF6ntem, rahats\u0131z edici i\xE7eri\u011Fi bildirme mekanizmas\u0131 ve bildirimlere zaman\u0131nda yan\u0131t, k\xF6t\xFCye kullanan kullan\u0131c\u0131lar\u0131 hizmetten engelleme imk\xE2n\u0131, ve kullan\u0131c\u0131lar\u0131n size kolayca ula\u015Fabilmesi i\xE7in yay\u0131nlanm\u0131\u015F ileti\u015Fim bilgisi.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.2.1-creator-content-age-gate",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.2.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "ugc",
          "creator",
          "age-rating",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasUserGeneratedContent": true
        },
        "question": `Uygulamada "creator" (i\xE7erik \xFCretici) toplulu\u011Funun \xFCretti\u011Fi i\xE7erik varsa: (1) kullan\u0131c\u0131, uygulaman\u0131n ya\u015F s\u0131n\u0131r\u0131n\u0131 A\u015EAN i\xE7eri\u011Fi ay\u0131rt edebiliyor mu, (2) do\u011Frulanm\u0131\u015F ya da beyan edilmi\u015F ya\u015Fa dayanan bir ya\u015F k\u0131s\u0131tlama mekanizmas\u0131 var m\u0131, (3) hangi i\xE7eri\u011Fin ek sat\u0131n alma gerektirdi\u011Fi kullan\u0131c\u0131ya s\xF6yleniyor mu? Creator i\xE7eri\u011Fi App Review taraf\u0131ndan kullan\u0131c\u0131 i\xE7eri\u011Fi say\u0131l\u0131yor: 1.2'nin moderasyon \u015Fartlar\u0131 da aynen ge\xE7erli.
`,
        "ruleText": "Creator i\xE7eri\u011Fi sunan uygulamalar, uygulaman\u0131n ya\u015F s\u0131n\u0131r\u0131n\u0131 a\u015Fan i\xE7eri\u011Fin tan\u0131nmas\u0131n\u0131 sa\u011Flamal\u0131 ve do\u011Frulanm\u0131\u015F ya da beyan edilmi\u015F ya\u015Fa dayal\u0131 bir ya\u015F k\u0131s\u0131tlama mekanizmas\u0131yla k\xFC\xE7\xFCklerin eri\u015Fimini s\u0131n\u0131rlamal\u0131d\u0131r. Bu i\xE7erik kullan\u0131c\u0131 i\xE7eri\u011Fi say\u0131l\u0131r; 1.2 (moderasyon) ve 3.1.1 (sat\u0131n alma) kurallar\u0131 ge\xE7erlidir. Hangi i\xE7eri\u011Fin ek sat\u0131n alma gerektirdi\u011Fi kullan\u0131c\u0131ya bildirilmelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.3-kids-category",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "kids",
          "safety",
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "targetsKids": true
        },
        "facts": [
          "Ebeveyn kap\u0131s\u0131 (parental gate) \u015Fart\u0131 \xFC\xE7 \u015Feyi birden kaps\u0131yor: uygulamadan \xE7\u0131kan ba\u011Flant\u0131lar, sat\u0131n alma imk\xE2nlar\u0131 ve \xE7ocu\u011Fun dikkatini da\u011F\u0131tan di\u011Fer y\xF6nlendirmeler.",
          "Kids Category i\u015Faretini sonradan kald\u0131rsan bile kullan\u0131c\u0131lar uygulaman\u0131n bu kurallara uymas\u0131n\u0131 bekledi\u011Fi i\xE7in y\xFCk\xFCml\xFCl\xFCk sonraki s\xFCr\xFCmlerde de s\xFCr\xFCyor."
        ],
        "question": "\xC7ocuklara y\xF6nelik uygulamada: (1) d\u0131\u015Fa a\xE7\u0131lan ba\u011Flant\u0131lar, sat\u0131n alma imk\xE2nlar\u0131 ve dikkat da\u011F\u0131t\u0131c\u0131 y\xF6nlendirmelerin tamam\u0131 ebeveyn kap\u0131s\u0131n\u0131n arkas\u0131nda m\u0131, (2) \xFC\xE7\xFCnc\xFC taraf analitik ve reklam kald\u0131r\u0131ld\u0131 m\u0131 (izin verilen s\u0131n\u0131rl\u0131 durumlarda IDFA ve \xE7ocu\u011Fa dair hi\xE7bir tan\u0131mlay\u0131c\u0131 bilgi g\xF6nderilmiyor, ba\u011Flamsal reklamda insan incelemesi var m\u0131), (3) \xE7ocuklardan veri toplanmas\u0131na dair yerel yasalara (COPPA, GDPR) uyum sa\u011Fland\u0131 m\u0131?\n",
        "ruleText": "Kids Category uygulamalar\u0131, ebeveyn kap\u0131s\u0131 arkas\u0131nda olmad\u0131k\xE7a uygulamadan \xE7\u0131kan ba\u011Flant\u0131, sat\u0131n alma imk\xE2n\u0131 veya dikkat da\u011F\u0131t\u0131c\u0131 y\xF6nlendirme i\xE7eremez. Ki\u015Fisel bilgi ya da cihaz bilgisi \xFC\xE7\xFCnc\xFC taraflara g\xF6nderilemez; \xFC\xE7\xFCnc\xFC taraf analitik ve reklam kullan\u0131lmamal\u0131d\u0131r. S\u0131n\u0131rl\u0131 durumlarda IDFA veya \xE7ocu\u011Fu tan\u0131mlayan bilgi toplamayan analitik ile insan incelemesi yapan ba\u011Flamsal reklam kabul edilebilir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.4.1-health-measurement-claims",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.4.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "health",
          "false-claims",
          "metadata",
          "safety"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "keywords"
        ],
        "prefilter": [
          "blood pressure",
          "blood oxygen",
          "spo2",
          "glucose",
          "blood sugar",
          "x-ray",
          "xray",
          "body temperature",
          "heart rate",
          "bpm",
          "ecg",
          "ekg",
          "diagnose",
          "diagnosis",
          "treat"
        ],
        "facts": [
          "Apple bu maddede d\xF6rt \xF6l\xE7\xFCm\xFC ADIYLA yasakl\u0131yor: yaln\u0131zca cihaz sens\xF6rleriyle r\xF6ntgen \xE7ekmek, tansiyon, v\xFCcut s\u0131cakl\u0131\u011F\u0131, kan \u015Fekeri veya kan oksijeni \xF6l\xE7mek.",
          "Do\u011Fruluk iddias\u0131 varsa veri ve y\xF6ntemin a\xE7\u0131k\xE7a anlat\u0131lmas\u0131 gerekiyor; do\u011Frulanam\u0131yorsa uygulama reddediliyor."
        ],
        "question": "Metin, yaln\u0131zca telefonun sens\xF6rleriyle t\u0131bbi bir \xF6l\xE7\xFCm yapt\u0131\u011F\u0131n\u0131 iddia ediyor mu (tansiyon, kan \u015Fekeri, kan oksijeni, v\xFCcut s\u0131cakl\u0131\u011F\u0131, r\xF6ntgen)? Ya da te\u015Fhis/tedavi iddias\u0131 var m\u0131? B\xF6yle bir iddia varsa \xF6l\xE7\xFCm\xFCn dayand\u0131\u011F\u0131 veri ve y\xF6ntem metinde a\xE7\u0131klan\u0131yor mu? Harici bir t\u0131bbi cihazdan veri okumak ihlal de\u011Fildir; ihlal, \xF6l\xE7\xFCm\xFC cihaz\u0131n kendi sens\xF6rlerine dayand\u0131rmakt\u0131r.\n",
        "ruleText": "Sa\u011Fl\u0131k \xF6l\xE7\xFCmlerine ili\u015Fkin do\u011Fruluk iddialar\u0131 veri ve y\xF6ntemle desteklenmelidir. Yaln\u0131zca cihaz sens\xF6rlerini kullanarak r\xF6ntgen \xE7ekti\u011Fini, tansiyon, v\xFCcut s\u0131cakl\u0131\u011F\u0131, kan \u015Fekeri ya da kan oksijeni \xF6l\xE7t\xFC\u011F\xFCn\xFC iddia eden uygulamalara izin verilmez.\n",
        "positiveExample": "Measure your blood pressure and blood oxygen using just your iPhone camera.",
        "negativeExample": "Log readings from your Bluetooth blood pressure cuff and see weekly trends.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.4.1-medical-app-duties",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.4.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "health",
          "safety",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasHealthFeatures": true
        },
        "question": "Sa\u011Fl\u0131k/t\u0131bbi i\u015Flev sunan uygulamada: (1) kullan\u0131c\u0131ya, uygulamay\u0131 kullanman\u0131n yan\u0131 s\u0131ra ve t\u0131bbi karar vermeden \xD6NCE doktoruna dan\u0131\u015Fmas\u0131 hat\u0131rlat\u0131l\u0131yor mu, (2) do\u011Fruluk iddias\u0131 varsa dayand\u0131\u011F\u0131 veri ve y\xF6ntem uygulamada a\xE7\u0131klan\u0131yor mu, (3) d\xFCzenleyici onay\u0131n (FDA vb.) varsa belgesinin ba\u011Flant\u0131s\u0131 g\xF6nderime eklendi mi?\n",
        "ruleText": "Yanl\u0131\u015F veri veya bilgi verebilecek, ya da te\u015Fhis/tedavi i\xE7in kullan\u0131labilecek t\u0131bbi uygulamalar daha s\u0131k\u0131 incelenir. Uygulamalar kullan\u0131c\u0131ya doktoruna dan\u0131\u015Fmay\u0131 hat\u0131rlatmal\u0131d\u0131r. D\xFCzenleyici onay al\u0131nm\u0131\u015Fsa belgenin ba\u011Flant\u0131s\u0131 g\xF6nderimle birlikte iletilmelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.4.2-drug-dosage",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.4.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "health",
          "safety",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText"
        ],
        "prefilter": [
          "dosage",
          "dose",
          "dosing",
          "mg/kg",
          "posology",
          "drug calculator",
          "medication calculator",
          "insulin"
        ],
        "question": "Metin, ila\xE7 dozu hesaplayan bir i\u015Flev sundu\u011Funu s\xF6yl\xFCyor mu? S\xF6yl\xFCyorsa, uygulaman\u0131n ila\xE7 \xFCreticisi, hastane, \xFCniversite, sigorta \u015Firketi, eczane ya da onayl\u0131 bir kurum taraf\u0131ndan sunuldu\u011Fu veya d\xFCzenleyici onay ald\u0131\u011F\u0131 metinde belli oluyor mu? Yaln\u0131zca ila\xE7 hat\u0131rlat\u0131c\u0131s\u0131 olmak ihlal de\u011Fildir; ihlal, doz HESAPLAYAN bir i\u015Flevin dayana\u011F\u0131n\u0131n belirsiz olmas\u0131d\u0131r.\n",
        "ruleText": "\u0130la\xE7 dozu hesaplay\u0131c\u0131lar\u0131; ila\xE7 \xFCreticisinden, bir hastaneden, \xFCniversiteden, sa\u011Fl\u0131k sigortas\u0131 \u015Firketinden, eczaneden veya onayl\u0131 ba\u015Fka bir kurumdan gelmeli, ya da FDA veya muadili bir kurumun onay\u0131n\u0131 almal\u0131d\u0131r.\n",
        "positiveExample": "Instantly calculate pediatric drug dosages for any medication.",
        "negativeExample": "Set reminders for the medications your doctor prescribed.",
        "outcome": "risk",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.4.3-substances",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.4.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "substances",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "keywords"
        ],
        "prefilter": [
          "tobacco",
          "cigarette",
          "vape",
          "vaping",
          "nicotine",
          "cannabis",
          "weed",
          "marijuana",
          "dispensary",
          "alcohol",
          "drinking",
          "shots",
          "drug",
          "drugs"
        ],
        "question": "Metin, t\xFCt\xFCn/elektronik sigara, yasa d\u0131\u015F\u0131 uyu\u015Fturucu ya da a\u015F\u0131r\u0131 alkol t\xFCketimini \xF6zendiriyor mu? Ya da kontroll\xFC madde veya t\xFCt\xFCn sat\u0131\u015F\u0131n\u0131 kolayla\u015Ft\u0131rd\u0131\u011F\u0131n\u0131 s\xF6yl\xFCyor mu (lisansl\u0131 eczane ve yasal esrar dispensary istisnas\u0131 d\u0131\u015F\u0131nda)? B\u0131rakma/azaltma yard\u0131m\u0131 ihlal de\u011Fildir.\n",
        "ruleText": "T\xFCt\xFCn ve vape \xFCr\xFCnleri, yasa d\u0131\u015F\u0131 uyu\u015Fturucular ya da a\u015F\u0131r\u0131 alkol t\xFCketimini \xF6zendiren uygulamalara izin verilmez; k\xFC\xE7\xFCkleri bu maddeleri t\xFCketmeye \xF6zendirenler reddedilir. Kontroll\xFC maddelerin veya t\xFCt\xFCn\xFCn sat\u0131\u015F\u0131n\u0131 kolayla\u015Ft\u0131rmak yasakt\u0131r (lisansl\u0131 eczaneler ile lisansl\u0131 ya da yasal esrar dispensary'leri hari\xE7).\n",
        "positiveExample": "Find the cheapest vapes and get them delivered to your door tonight.",
        "negativeExample": "A quit-smoking tracker with craving logs and milestone rewards.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.4.4-dui-checkpoints",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.4.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText"
        ],
        "prefilter": [
          "dui",
          "checkpoint",
          "checkpoints",
          "speed trap",
          "police trap",
          "radar",
          "alkol kontrol",
          "drunk driving"
        ],
        "question": "Metin, alkol/h\u0131z denetim noktalar\u0131n\u0131 g\xF6sterdi\u011Fini s\xF6yl\xFCyor mu? S\xF6yl\xFCyorsa bu verinin kolluk kuvvetlerince YAYIMLANMI\u015E oldu\u011Fu belirtiliyor mu? Ayr\u0131ca alkoll\xFC ara\xE7 kullanmay\u0131 ya da a\u015F\u0131r\u0131 h\u0131z gibi pervas\u0131z davran\u0131\u015Flar\u0131 \xF6zendiren ifadeler var m\u0131?\n",
        "ruleText": "Uygulamalar yaln\u0131zca kolluk kuvvetleri taraf\u0131ndan yay\u0131mlanm\u0131\u015F alkol denetim noktalar\u0131n\u0131 g\xF6sterebilir ve alkoll\xFC ara\xE7 kullanmay\u0131 ya da a\u015F\u0131r\u0131 h\u0131z gibi pervas\u0131z davran\u0131\u015Flar\u0131 asla \xF6zendirmemelidir.\n",
        "positiveExample": "Crowd-sourced DUI checkpoints so you can drive home after a few drinks.",
        "negativeExample": "Official traffic advisories published by the highway authority.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-1.4.5-risky-activities",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.4.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText"
        ],
        "prefilter": [
          "challenge",
          "dare",
          "stunt",
          "bet",
          "prank",
          "extreme",
          "risk your"
        ],
        "question": "Metin, kullan\u0131c\u0131y\u0131 kendisine ya da ba\u015Fkas\u0131na fiziksel zarar verebilecek bir etkinli\u011Fe (bahis, meydan okuma, tehlikeli hareket) ya da cihaz\u0131 riskli bi\xE7imde kullanmaya \xE7a\u011F\u0131r\u0131yor mu? Spor/antrenman i\xE7eri\u011Fi tek ba\u015F\u0131na ihlal de\u011Fildir.\n",
        "ruleText": "Uygulamalar kullan\u0131c\u0131lar\u0131 kendilerine ya da ba\u015Fkalar\u0131na fiziksel zarar riski ta\u015F\u0131yan etkinliklere (bahisler, meydan okumalar vb.) ya da cihazlar\u0131n\u0131 riskli bi\xE7imde kullanmaya te\u015Fvik etmemelidir.\n",
        "positiveExample": "Take the 24-hour no-water challenge and dare your friends to beat it.",
        "negativeExample": "Guided interval running plans with heart-rate zones.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-1.5-developer-contact",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "support",
          "contact",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Kullan\u0131c\u0131 sana nas\u0131l ula\u015Facak? (1) Uygulaman\u0131n \u0130\xC7\u0130NDE kolay bir ileti\u015Fim yolu var m\u0131, (2) Support URL ger\xE7ekten ileti\u015Fim imk\xE2n\u0131 sunan bir sayfaya m\u0131 gidiyor (yaln\u0131zca pazarlama ana sayfas\u0131 yeterli de\u011Fil), (3) bilgiler g\xFCncel mi? Wallet pass \xFCretiyorsan ge\xE7erli ileti\u015Fim bilgisi ve markaya atanm\u0131\u015F sertifika ile imza \u015Fart\u0131 da ge\xE7erli.\n",
        "ruleText": "Uygulaman\u0131n kendisi ve Support URL'i sana ula\u015Fman\u0131n kolay bir yolunu i\xE7ermelidir; bu \xF6zellikle s\u0131n\u0131fta kullan\u0131labilecek uygulamalar i\xE7in \xF6nemlidir. G\xFCncel ve do\u011Fru ileti\u015Fim bilgisi vermemek kullan\u0131c\u0131y\u0131 ma\u011Fdur eder ve baz\u0131 \xFClkelerde yasaya ayk\u0131r\u0131 olabilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-1.6-data-security",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.6",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.6",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "security",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "allowsAccountCreation": true
        },
        "question": "Kullan\u0131c\u0131 verisi uygun g\xFCvenlik \xF6nlemleriyle mi i\u015Fleniyor: aktar\u0131m ve depolamada \u015Fifreleme, yetkisiz eri\u015Fime kar\u015F\u0131 koruma, \xFC\xE7\xFCnc\xFC taraf eri\u015Fimlerinin s\u0131n\u0131rlanmas\u0131? Hesap a\xE7t\u0131r\u0131p veri saklayan bir uygulamada bu Apple'\u0131n ayr\u0131 bir maddesi.\n",
        "ruleText": "Uygulamalar, toplad\u0131klar\u0131 kullan\u0131c\u0131 bilgisinin do\u011Fru i\u015Flenmesini sa\u011Flamak ve yetkisiz kullan\u0131m\u0131n\u0131, if\u015Fas\u0131n\u0131 ya da \xFC\xE7\xFCnc\xFC taraflarca eri\u015Filmesini \xF6nlemek i\xE7in uygun g\xFCvenlik \xF6nlemleri uygulamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-1.7-criminal-reporting",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "1.7",
          "url": "https://developer.apple.com/app-store/review/guidelines/#1.7",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "safety",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "report crime",
          "criminal activity",
          "law enforcement",
          "police",
          "emergency report",
          "su\xE7 ihbar",
          "ihbar"
        ],
        "question": "Uygulama su\xE7 ihbar\u0131 almay\u0131 sa\u011Fl\u0131yorsa: yerel kolluk kuvvetleri s\xFCrece ger\xE7ekten d\xE2hil mi ve uygulama yaln\u0131zca bu i\u015F birli\u011Finin aktif oldu\u011Fu \xFClke/b\xF6lgelerde mi sunuluyor?\n",
        "ruleText": "\u0130ddia edilen su\xE7 faaliyetini bildirmeye yarayan uygulamalar yerel kolluk kuvvetlerini s\xFCrece d\xE2hil etmek zorundad\u0131r ve yaln\u0131zca bu kat\u0131l\u0131m\u0131n aktif oldu\u011Fu \xFClke veya b\xF6lgelerde sunulabilir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.1-coming-soon-placeholder",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#app-completeness",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "completeness",
          "vision",
          "metadata"
        ],
        "scope": "cross",
        "needs": [
          "screenshots",
          "description",
          "whatsNew",
          "promotionalText"
        ],
        "question": 'Ekran g\xF6r\xFCnt\xFClerinde veya metinlerde hen\xFCz haz\u0131r olmayan bir i\u015Flev i\u015Fareti var m\u0131? \xD6rnekler: ekranda "Coming soon", "Yak\u0131nda", "Beta", "Under construction", bo\u015F/placeholder i\xE7erik, "Lorem ipsum", gri kutu yer tutucular. Metinde "yak\u0131nda eklenecek" bi\xE7iminde vaat edilen \xF6zellikler de bu kapsamdad\u0131r. Gelecek s\xFCr\xFCm plan\u0131ndan genel bahsetmek ihlal DE\u011E\u0130LD\u0130R.\n',
        "ruleText": 'Uygulama ve metadata g\xF6nderim an\u0131nda tamamlanm\u0131\u015F olmal\u0131d\u0131r. "Yak\u0131nda" i\xE7erikleri, yer tutucular ve tamamlanmam\u0131\u015F ekranlar reddedilir.\n',
        "positiveExample": "Ekran g\xF6r\xFCnt\xFCs\xFCnde 'AI Video \u2014 Coming Soon' yazan gri bir kart var.",
        "negativeExample": "We ship new filters every month \u2014 follow us for updates.",
        "outcome": "violation",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.1-demo-access",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "review-notes",
          "login",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "requiresLogin": true
        },
        "facts": [
          "Demo hesab\u0131n VAR olmas\u0131 yetmiyor: Apple \u201Carka u\xE7 servisini a\xE7\u0131k tut\u201D diyor \u2014 reviewer denedi\u011Finde giri\u015F ger\xE7ekten \xE7al\u0131\u015Fmal\u0131.",
          "Hesap veremiyorsan alternatif, Apple\u2019\u0131n \xD6NCEDEN onaylad\u0131\u011F\u0131 g\xF6m\xFCl\xFC bir demo modudur ve uygulaman\u0131n t\xFCm \xF6zelliklerini g\xF6stermek zorundad\u0131r."
        ],
        "question": "Giri\u015F gerektiren uygulamada: (1) verilen demo hesapla \u015EU AN giri\u015F yap\u0131labiliyor mu (kendin dene), (2) arka u\xE7 servisleri inceleme boyunca a\xE7\u0131k ve eri\u015Filebilir mi, (3) hesap veremiyorsan Apple'\u0131n \xF6nceden onaylad\u0131\u011F\u0131, t\xFCm \xF6zellikleri g\xF6steren bir demo modu var m\u0131, (4) inceleme i\xE7in gereken di\u011Fer kaynaklar (donan\u0131m, \xF6rnek QR kod, davet kodu) notlara eklendi mi?\n",
        "ruleText": "Uygulaman giri\u015F i\xE7eriyorsa demo hesap bilgisi ver ve arka u\xE7 servisini a\xE7\u0131k tut. Yasal ya da g\xFCvenlik y\xFCk\xFCml\xFCl\xFCkleri nedeniyle demo hesap veremiyorsan, Apple'\u0131n \xF6nceden onay\u0131yla demo hesap yerine g\xF6m\xFCl\xFC bir demo modu sunabilirsin; bu modun uygulaman\u0131n t\xFCm \xF6zelliklerini ve i\u015Flevselli\u011Fini g\xF6stermesi gerekir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.1-launch-crash",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#app-completeness",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "checklist",
          "completeness"
        ],
        "scope": "single",
        "needs": [],
        "question": "G\xF6nderilecek build temiz bir cihazda a\xE7\u0131l\u0131yor mu? Uygulamay\u0131 sil, App Store s\xFCr\xFCm\xFCn\xFC kur, u\xE7ak modunda ve normal a\u011Fda a\xE7. Reviewer'\u0131n kulland\u0131\u011F\u0131 iOS s\xFCr\xFCm\xFCnde test edildi mi?\n",
        "ruleText": "Uygulama a\xE7\u0131l\u0131\u015Fta \xE7\xF6kmemeli ve g\xF6nderilen build tamamlanm\u0131\u015F olmal\u0131d\u0131r. Bu listing icerigi disinda; cihazda dogrulanmali.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.1b-iap-reviewable",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "iap",
          "review-notes",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasIap": true
        },
        "question": "Uygulama i\xE7i sat\u0131n almalar reviewer i\xE7in: (1) uygulamada BULUNAB\u0130L\u0130R mi (hangi ekranda, ka\xE7 t\u0131kla), (2) g\xFCncel ve \xE7al\u0131\u015F\u0131r durumda m\u0131, (3) uygulamada bulunamayan bir \xFCr\xFCn varsa sebebi review notlar\u0131nda yaz\u0131yor mu?\n",
        "ruleText": "Uygulama i\xE7i sat\u0131n alma sunuyorsan, \xFCr\xFCnlerin eksiksiz, g\xFCncel, reviewer taraf\u0131ndan g\xF6r\xFClebilir ve \xE7al\u0131\u015F\u0131r oldu\u011Fundan emin ol. Yap\u0131land\u0131r\u0131lm\u0131\u015F bir \xFCr\xFCn uygulamada bulunam\u0131yor ya da incelenemiyorsa sebebini review notlar\u0131nda a\xE7\u0131kla.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.2-beta-language",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "completeness"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "whatsNew",
          "keywords"
        ],
        "prefilter": [
          "beta",
          "alpha",
          "demo version",
          "trial version",
          "preview version",
          "early access",
          "prototype",
          "test version",
          "work in progress",
          "wip"
        ],
        "facts": [
          "Apple\u2019\u0131n kural\u0131 s\xFCr\xFCm\xFCn KEND\u0130S\u0130 hakk\u0131nda: demo, beta ve deneme s\xFCr\xFCmleri App Store\u2019a de\u011Fil TestFlight\u2019a ait.",
          "\u201CFree trial\u201D bir abonelik teklifidir ve bu maddenin konusu de\u011Fildir \u2014 kar\u0131\u015Ft\u0131rma."
        ],
        "question": 'Metin, bu s\xFCr\xFCm\xFCn kendisinin bir beta, demo, \xF6nizleme ya da deneme s\xFCr\xFCm\xFC oldu\u011Funu s\xF6yl\xFCyor mu? B\xF6yle bir ifade varsa bildir. Abonelikteki \xFCcretsiz deneme ("free trial") ya da "erken eri\u015Fim i\xE7erik paketi" gibi \xFCr\xFCn adlar\u0131 bu maddenin konusu de\u011Fildir.\n',
        "ruleText": "Uygulaman\u0131n demo, beta ve deneme s\xFCr\xFCmleri App Store'a ait de\u011Fildir; bunun i\xE7in TestFlight kullan\u0131lmal\u0131d\u0131r.\n",
        "positiveExample": "This is an early beta \u2014 expect bugs while we test new features.",
        "negativeExample": "Try Premium free for 7 days, then $4.99/month.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.3.1-ai-not-in-review-notes",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
          "retrievedAt": "2026-08-25"
        },
        "tags": [
          "ai",
          "review-notes",
          "disclosure"
        ],
        "scope": "single",
        "needs": [
          "reviewNotes"
        ],
        "appliesWhen": {
          "generatesAiContent": true
        },
        "facts": [
          "Apple, her yeni i\u015Flevin \u0130nceleme Notlar\u0131 alan\u0131nda AYRINTILI anlat\u0131lmas\u0131n\u0131 istiyor ve 'genel a\xE7\u0131klamalar reddedilecektir' diye yaz\u0131yor.",
          "AI \xFCretimi, reviewer'\u0131n ekrandan anlayamayaca\u011F\u0131 bir i\u015Flevdir: hangi modelin kullan\u0131ld\u0131\u011F\u0131, \xE7\u0131kt\u0131n\u0131n nas\u0131l s\xFCz\xFCld\xFC\u011F\xFC, i\xE7eri\u011Fin nereden geldi\u011Fi notta yazm\u0131yorsa reviewer varsay\u0131m yapmak zorunda kal\u0131r ve genellikle en k\xF6t\xFC varsay\u0131m\u0131 yapar.",
          "Yeterli not \u015Funlar\u0131 s\xF6yler: \xFCretimin nerede \xE7al\u0131\u015Ft\u0131\u011F\u0131 (cihazda/sunucuda), hangi sa\u011Flay\u0131c\u0131/model kullan\u0131ld\u0131\u011F\u0131, uygunsuz girdi ve \xE7\u0131kt\u0131n\u0131n nas\u0131l engellendi\u011Fi, \xFCretilen i\xE7eri\u011Fin saklan\u0131p saklanmad\u0131\u011F\u0131.",
          "Notlar\u0131n bo\u015F olmas\u0131 ya da yaln\u0131zca demo hesap bilgisi i\xE7ermesi bu kart\u0131n konusudur."
        ],
        "question": "Uygulama AI ile i\xE7erik \xFCretiyor. A\u015Fa\u011F\u0131daki \u0130nceleme Notlar\u0131 metni bu i\u015Flevi reviewer'\u0131n anlayaca\u011F\u0131 AYRINTIDA anlat\u0131yor mu? Aranan asgari bilgi: \xFCretimin nerede \xE7al\u0131\u015Ft\u0131\u011F\u0131, hangi model/sa\u011Flay\u0131c\u0131n\u0131n kullan\u0131ld\u0131\u011F\u0131, uygunsuz girdi ve \xE7\u0131kt\u0131n\u0131n nas\u0131l engellendi\u011Fi. Notlar bo\u015Fsa, yaln\u0131zca demo hesap/\u015Fifre i\xE7eriyorsa, ya da AI'dan hi\xE7 s\xF6z etmiyorsa bildir. Not bu \xFC\xE7\xFCnden en az ikisini somut olarak anlat\u0131yorsa bulgu \xFCretme.\n",
        "ruleText": "B\xFCt\xFCn yeni \xF6zellikler, i\u015Flevler ve \xFCr\xFCn de\u011Fi\u015Fiklikleri App Store Connect'in \u0130nceleme Notlar\u0131 b\xF6l\xFCm\xFCnde AYRINTILI olarak anlat\u0131lmal\u0131 ve incelemeye eri\u015Filebilir olmal\u0131d\u0131r; genel a\xE7\u0131klamalar reddedilir.\n",
        "positiveExample": "Notes for Review: test@demo.com / 123456",
        "negativeExample": "Notes for Review: G\xF6rsel \xFCretimi Replicate \xFCzerinde SDXL ile sunucuda \xE7al\u0131\u015F\u0131yor. Prompt'lar g\xF6nderilmeden \xF6nce OpenAI moderation API'sinden ge\xE7iyor, uygunsuz istekler reddediliyor. \xDCretilen g\xF6rseller 24 saat sonra siliniyor. Demo: test@demo.com / 123456",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.3.1-exaggerated-claims",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
          "retrievedAt": "2026-08-18"
        },
        "tags": [
          "metadata",
          "claims"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText"
        ],
        "prefilter": [
          "guarantee",
          "guaranteed",
          "clinically",
          "medical",
          "proven",
          "100%",
          "#1",
          "best in the world",
          "instantly cure"
        ],
        "question": `A\u015Fa\u011F\u0131daki metinde, uygulaman\u0131n ger\xE7ekten sa\u011Flayamayaca\u011F\u0131 veya kan\u0131tlanamaz bir sonu\xE7 garantisi var m\u0131? \xD6zellikle \u015Funlara bak: kesin sonu\xE7 vaadi ("guaranteed", "%100"), do\u011Frulanmam\u0131\u015F bilimsel/klinik iddia ("clinically proven", "medical-grade"), kan\u0131tlanamayan \xFCst\xFCnl\xFCk iddias\u0131 ("#1 app", "world's best"). Pazarlama dili tek ba\u015F\u0131na ihlal de\u011Fildir \u2014 ihlal, \xF6l\xE7\xFClebilir ama kan\u0131tlanmam\u0131\u015F bir iddiad\u0131r.
`,
        "ruleText": "App Store metadata do\u011Fru olmal\u0131d\u0131r. Uygulaman\u0131n yapabileceklerini abartan, garanti eden veya kan\u0131tlanamayan bilimsel/klinik iddialar i\xE7eren metinler reddedilir.\n",
        "positiveExample": "Our clinically proven engine gives you guaranteed medical-grade results.",
        "negativeExample": "Helps you enhance your photos with AI-powered retouching tools.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.3.1-review-notes-specificity",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "review-notes",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "reviewNotes"
        ],
        "facts": [
          "Apple bu maddede \u201Cgeneric descriptions will be rejected\u201D diyor: yeni \xF6zellik ve de\u011Fi\u015Fiklikler review notlar\u0131nda A\xC7IK\xC7A anlat\u0131lmak zorunda."
        ],
        "question": 'Review notlar\u0131, bu s\xFCr\xFCmdeki yeni \xF6zellikleri ve de\u011Fi\u015Fiklikleri SOMUT olarak anlat\u0131yor mu? "Bug fixes and improvements", "minor updates", "yeni \xF6zellikler eklendi" gibi genel ifadeler tek ba\u015F\u0131na yeterli de\u011Fildir. Notlarda yaln\u0131zca genel ifade varken uygulamada anlat\u0131lmam\u0131\u015F yeni bir i\u015Flev oldu\u011Funu d\xFC\u015F\xFCnd\xFCren bir durum varsa bildir. Yaln\u0131zca hata d\xFCzeltmesi i\xE7eren bir s\xFCr\xFCmde genel ifade kabul edilebilir.\n',
        "ruleText": "Gizli, uykuda ya da belgelenmemi\u015F \xF6zellik bulunamaz; uygulaman\u0131n i\u015Flevi hem son kullan\u0131c\u0131 hem App Review i\xE7in a\xE7\u0131k olmal\u0131d\u0131r. T\xFCm yeni \xF6zellikler, i\u015Flevler ve \xFCr\xFCn de\u011Fi\u015Fiklikleri App Store Connect'in Notes for Review alan\u0131nda SPES\u0130F\u0130K olarak anlat\u0131lmal\u0131 ve incelemeye a\xE7\u0131k olmal\u0131d\u0131r; genel a\xE7\u0131klamalar reddedilir.\n",
        "positiveExample": "Bug fixes and performance improvements.",
        "negativeExample": "Adds an AI photo editor (Home > Edit > Enhance). Test account: demo@x.com / 1234. The editor calls our server; no login needed to try it.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.3.10-other-platforms",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.10",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.10",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "platform"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "keywords",
          "promotionalText",
          "whatsNew"
        ],
        "prefilter": [
          "android",
          "google play",
          "play store",
          "huawei",
          "appgallery",
          "galaxy store",
          "samsung store",
          "windows phone",
          "amazon appstore",
          "apk"
        ],
        "facts": [
          "Yasak yaln\u0131zca ADLARDA de\u011Fil: ba\u015Fka mobil platformlar\u0131n ya da alternatif uygulama pazarlar\u0131n\u0131n ad\u0131, simgesi ve g\xF6rselleri uygulamada ve metadata\u2019da ge\xE7emez.",
          "Ayn\u0131 madde metadata\u2019n\u0131n konu d\u0131\u015F\u0131 bilgi i\xE7ermemesini de istiyor."
        ],
        "question": "Metinde ba\u015Fka bir mobil platformun ya da alternatif uygulama pazar\u0131n\u0131n ad\u0131 ge\xE7iyor mu (Android, Google Play, Huawei AppGallery, Galaxy Store, APK)? Onaylanm\u0131\u015F \xF6zel bir etkile\u015Fimli i\u015Flev yoksa bu ihlaldir. Ayr\u0131ca metadata uygulamayla ilgisiz bilgi i\xE7eriyorsa bildir.\n",
        "ruleText": "Uygulaman, destekledi\u011Fi Apple platformlar\u0131ndaki deneyime odaklanmal\u0131d\u0131r; onaylanm\u0131\u015F \xF6zel bir etkile\u015Fimli i\u015Flev yoksa uygulamada ya da metadata'da ba\u015Fka mobil platformlar\u0131n veya alternatif uygulama pazarlar\u0131n\u0131n adlar\u0131, simgeleri ya da g\xF6rselleri yer alamaz. Metadata konu d\u0131\u015F\u0131 bilgi i\xE7ermemelidir.\n",
        "positiveExample": "Also available on Android \u2014 download the APK from our site.",
        "negativeExample": "Syncs across your iPhone, iPad and Mac.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.3.11-preorder",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.11",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.11",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "preorder",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "pre-order",
          "preorder",
          "coming soon",
          "launching soon",
          "\xF6n sipari\u015F"
        ],
        "question": "\xD6n sipari\u015Fe a\xE7t\u0131\u011F\u0131n uygulama, g\xF6nderdi\u011Fin h\xE2liyle eksiksiz ve teslim edilebilir mi? Yay\u0131nlanan s\xFCr\xFCm, \xF6n sipari\u015F s\u0131ras\u0131nda tan\u0131t\u0131landan esasl\u0131 bi\xE7imde farkl\u0131 olacak m\u0131 (\xF6zellikle i\u015F modeli de\u011Fi\u015Fikli\u011Fi)? Esasl\u0131 de\u011Fi\u015Fiklik varsa \xF6n sipari\u015F sat\u0131\u015F\u0131n\u0131 yeniden ba\u015Flatman gerekir.\n",
        "ruleText": "\xD6n sipari\u015F i\xE7in g\xF6nderilen uygulamalar g\xF6nderildi\u011Fi h\xE2liyle eksiksiz ve teslim edilebilir olmal\u0131d\u0131r. Yay\u0131mlad\u0131\u011F\u0131n uygulama, \xF6n sipari\u015F s\u0131ras\u0131nda tan\u0131tt\u0131\u011F\u0131ndan esasl\u0131 bi\xE7imde farkl\u0131 olmamal\u0131d\u0131r; esasl\u0131 de\u011Fi\u015Fiklik (\xF6r. i\u015F modeli de\u011Fi\u015Fikli\u011Fi) yaparsan \xF6n sipari\u015F sat\u0131\u015F\u0131n\u0131 yeniden ba\u015Flatmal\u0131s\u0131n.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.3.12-whats-new",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.12",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.12",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "whats-new"
        ],
        "scope": "single",
        "needs": [
          "whatsNew"
        ],
        "facts": [
          "Basit hata d\xFCzeltmeleri, g\xFCvenlik g\xFCncellemeleri ve performans iyile\u015Ftirmeleri i\xE7in genel ifade SERBEST; kural yaln\u0131zca daha \xF6nemli de\u011Fi\u015Fiklikler i\xE7in."
        ],
        "question": `"What's New" metni bu s\xFCr\xFCmdeki yeni \xF6zellikleri ve \xFCr\xFCn de\u011Fi\u015Fikliklerini anlat\u0131yor mu? Metin yaln\u0131zca genel bir ifadeden ibaretse ("bug fixes and improvements") ama ayn\u0131 metin yeni bir \xF6zellikten s\xF6z ediyorsa ya da a\xE7\u0131klama/ekran g\xF6r\xFCnt\xFCleri yeni bir \xF6zelli\u011Fi i\u015Faret ediyorsa bildir. Yaln\u0131zca hata d\xFCzeltmesi i\xE7eren s\xFCr\xFCmde genel ifade kabul edilir.
`,
        "ruleText": `Uygulamalar yeni \xF6zellikleri ve \xFCr\xFCn de\u011Fi\u015Fikliklerini "What's New" metninde a\xE7\u0131k\xE7a anlatmal\u0131d\u0131r. Basit hata d\xFCzeltmeleri, g\xFCvenlik g\xFCncellemeleri ve performans iyile\u015Ftirmeleri genel bir a\xE7\u0131klamaya dayanabilir; daha \xF6nemli de\u011Fi\u015Fiklikler notlarda listelenmelidir.
`,
        "positiveExample": "Various improvements. Also adds AI background removal and a new subscription tier.",
        "negativeExample": "Fixes a crash when opening large photos.",
        "outcome": "risk",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-2.3.13-in-app-events",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.13",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.13",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "events",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "in-app event",
          "live event",
          "tournament",
          "premiere",
          "season",
          "competition",
          "challenge",
          "etkinlik"
        ],
        "question": "App Store'da \xF6ne \xE7\u0131kard\u0131\u011F\u0131n bir uygulama i\xE7i etkinlik varsa: (1) App Store Connect'teki etkinlik t\xFCrlerinden birine giriyor mu, (2) etkinlik metadata's\u0131n\u0131n tamam\u0131 do\u011Fru ve etkinli\u011Fin KEND\u0130S\u0130YLE mi ilgili (uygulaman\u0131n geneliyle de\u011Fil), (3) etkinlik se\xE7ti\u011Fin tarih ve saatlerde t\xFCm vitrinlerde ger\xE7ekten oluyor mu, (4) derin ba\u011Flant\u0131 uygulamada do\u011Fru yere gidiyor mu?\n",
        "ruleText": "Uygulama i\xE7i etkinlikler App Store Connect'teki etkinlik t\xFCrlerinden birine girmeli; t\xFCm etkinlik metadata's\u0131 do\u011Fru olmal\u0131 ve uygulaman\u0131n geneliyle de\u011Fil etkinli\u011Fin kendisiyle ilgili olmal\u0131d\u0131r. Etkinlikler, birden \xE7ok vitrin d\xE2hil, se\xE7ti\u011Fin tarih ve saatlerde ger\xE7ekle\u015Fmelidir. Etkinlik derin ba\u011Flant\u0131s\u0131 kullan\u0131c\u0131y\u0131 uygulamadaki do\u011Fru hedefe g\xF6t\xFCrmelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.3.2-iap-purchase-disclosure",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "iap",
          "metadata",
          "disclosure"
        ],
        "scope": "cross",
        "needs": [
          "description",
          "screenshots",
          "iap"
        ],
        "appliesWhen": {
          "hasIap": true
        },
        "requiresVision": true,
        "question": "A\xE7\u0131klama ve ekran g\xF6r\xFCnt\xFClerinde \xF6ne \xE7\u0131kar\u0131lan \xF6zellik, seviye, i\xE7erik ya da abonelik EK SATIN ALMA gerektiriyorsa bu a\xE7\u0131k\xE7a s\xF6yleniyor mu? \xDCcretsiz gibi sunulup asl\u0131nda sat\u0131n alma gerektiren \xF6zellikleri bildir. Ayr\u0131ca App Store'da tan\u0131t\u0131lan IAP'lar\u0131n ad\u0131 ve a\xE7\u0131klamas\u0131 genel kitleye uygun mu?\n",
        "ruleText": "Uygulama i\xE7i sat\u0131n alma varsa; a\xE7\u0131klama, ekran g\xF6r\xFCnt\xFCleri ve \xF6nizlemeler, \xF6ne \xE7\u0131kar\u0131lan \xF6\u011Felerin, seviyelerin veya aboneliklerin ek sat\u0131n alma gerektirip gerektirmedi\u011Fini a\xE7\u0131k\xE7a belirtmelidir. App Store'da tan\u0131t\u0131lan uygulama i\xE7i sat\u0131n almalar\u0131n g\xF6r\xFCnen ad\u0131, ekran g\xF6r\xFCnt\xFCs\xFC ve a\xE7\u0131klamas\u0131 genel bir kitleye uygun olmal\u0131d\u0131r.\n",
        "positiveExample": "Unlimited AI portraits, unlimited exports, all filters \u2014 everything included. (T\xFCm bu \xF6zellikler yaln\u0131zca abonelikte a\xE7\u0131l\u0131yor ama metin bunu s\xF6ylemiyor.)",
        "negativeExample": "Includes 3 free edits per day. Unlimited edits require a Premium subscription.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.3.3-feature-not-evidenced",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "metadata",
          "claims",
          "screenshots"
        ],
        "scope": "cross",
        "needs": [
          "description",
          "subtitle",
          "promotionalText",
          "screenshots"
        ],
        "facts": [
          "Uygulaman\u0131n KEND\u0130 ADI, alt ba\u015Fl\u0131\u011F\u0131, kategorisi ve uygulama i\xE7i \xFCr\xFCnleri o \xF6zellik i\xE7in KANITTIR. 'AI Video, Face Swap: Editor' adl\u0131 bir uygulamada y\xFCz de\u011Fi\u015Ftirme kan\u0131tlanm\u0131\u015Ft\u0131r; ayr\u0131ca ekran g\xF6r\xFCnt\xFCs\xFCnde g\xF6stermesi gerekmez.",
          "Ekran g\xF6r\xFCnt\xFClerinin uygulama aray\xFCz\xFCn\xFC g\xF6stermemesi AYRI bir sorundur ve AYRI bir kart onu denetliyor (apple-2.3.3-screenshots-reflect-app). Bu kart o konuya girmez.",
          "Bu kart\u0131n hedefi, uygulaman\u0131n ger\xE7ekten yapamayaca\u011F\u0131 bir i\u015Fi vaat etmesidir \u2014 bir foto\u011Fraf filtresi uygulamas\u0131n\u0131n 'dermatologla canl\u0131 g\xF6r\xFC\u015Fme' vaat etmesi gibi."
        ],
        "question": 'A\xE7\u0131klama veya alt ba\u015Fl\u0131k, uygulaman\u0131n YAPAMAYACA\u011EI somut bir i\u015F vaat ediyor mu? Yani vaat, uygulaman\u0131n ad\u0131, alt ba\u015Fl\u0131\u011F\u0131, kategorisi ve uygulama i\xE7i \xFCr\xFCnleriyle BA\u011EDA\u015EMIYOR mu?\nBULGU \xDCRETME \u015Fu durumlarda: - Vaat, uygulaman\u0131n ad\u0131/alt ba\u015Fl\u0131\u011F\u0131/kategorisiyle uyumluysa (bir y\xFCz\n  de\u011Fi\u015Ftirme uygulamas\u0131n\u0131n y\xFCz de\u011Fi\u015Ftirme vaat etmesi gibi).\n- Yaln\u0131zca "ekran g\xF6r\xFCnt\xFClerinde g\xF6remiyorum" diyeceksen. G\xF6rsellerin\n  aray\xFCz\xFC g\xF6stermemesi BA\u015EKA bir kart\u0131n konusu; burada bulgu de\u011Fildir.\n- Genel pazarlama ifadeleri i\xE7in ("kolay kullan\u0131m", "h\u0131zl\u0131", "en iyi").\nBULGU \xDCRET yaln\u0131zca: vaat edilen i\u015F uygulaman\u0131n tarif etti\u011Fi i\u015Fle \xE7eli\u015Fiyorsa ya da o kategoride teknik olarak m\xFCmk\xFCn g\xF6r\xFCnm\xFCyorsa. Emin de\u011Filsen bulgu \xFCretme.\n',
        "ruleText": "Metadata'da tan\u0131t\u0131lan \xF6zellikler uygulamada ger\xE7ekten bulunmal\u0131d\u0131r. Reviewer tan\u0131t\u0131lan bir \xF6zelli\u011Fi bulamazsa g\xF6nderim reddedilir.\n",
        "positiveExample": "Bir foto\u011Fraf filtresi uygulamas\u0131n\u0131n a\xE7\u0131klamas\u0131nda: 'Includes live 24/7 video consultation with certified dermatologists.'",
        "negativeExample": "'AI Video, Face Swap: Editor' adl\u0131 uygulaman\u0131n a\xE7\u0131klamas\u0131nda 'Put your face into any scene' \u2014 ad ve kategoriyle ba\u011Fda\u015F\u0131yor, bulgu de\u011Fil.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 2
      },
      {
        "id": "apple-2.3.3-screenshots-reflect-app",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "metadata",
          "screenshots",
          "vision"
        ],
        "scope": "single",
        "needs": [
          "screenshots"
        ],
        "requiresVision": true,
        "question": 'Bu ekran g\xF6r\xFCnt\xFCs\xFCnde ger\xE7ek bir uygulama ARAY\xDCZ\xDC g\xF6r\xFCn\xFCyor mu (d\xFC\u011Fmeler, sekmeler, ara\xE7 \xE7ubuklar\u0131, durum \xE7ubu\u011Fu, men\xFCler)? Yoksa g\xF6rsel tamamen bir pazarlama kompozisyonu mu \u2014 sadece bir foto\u011Fraf, sonu\xE7 kolaj\u0131, model foto\u011Fraf\u0131, ya da aray\xFCzs\xFCz "before/after" g\xF6rseli? Aray\xFCz\xFCn etraf\u0131na eklenmi\u015F \xE7er\xE7eve/ba\u015Fl\u0131k metni sorun DE\u011E\u0130LD\u0130R; sorun aray\xFCz\xFCn H\u0130\xC7 olmamas\u0131.\n',
        "ruleText": "Ekran g\xF6r\xFCnt\xFCleri uygulaman\u0131n ger\xE7ek kullan\u0131m\u0131n\u0131 yans\u0131tmal\u0131d\u0131r. Yaln\u0131zca pazarlama g\xF6rselinden olu\u015Fan ekran g\xF6r\xFCnt\xFCleri reddedilir.\n",
        "positiveExample": "G\xF6rsel sadece bir kad\u0131n y\xFCz\xFCn\xFCn \xF6ncesi/sonras\u0131 foto\u011Fraf\u0131; hi\xE7bir aray\xFCz \xF6\u011Fesi yok.",
        "negativeExample": "G\xF6rselde uygulama aray\xFCz\xFC, alt sekme \xE7ubu\u011Fu ve d\xFCzenleme ara\xE7lar\u0131 g\xF6r\xFCn\xFCyor; \xFCstte tan\u0131t\u0131m ba\u015Fl\u0131\u011F\u0131 var.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.3.4-preview-video",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "media",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasPreviewVideo": true
        },
        "facts": [
          "\xD6nizleme videosu bu boru hatt\u0131nda \u0130ZLENEM\u0130YOR: elimizde yaln\u0131zca dosya adresi var. Bu y\xFCzden kart modele de\u011Fil insana gidiyor."
        ],
        "question": "\xD6nizleme videosu yaln\u0131zca uygulaman\u0131n KEND\u0130 ekran kayd\u0131ndan m\u0131 olu\u015Fuyor? D\u0131\u015Far\u0131dan \xE7ekilmi\u015F sahneler, animasyon, render, stok g\xF6r\xFCnt\xFC ya da kamerayla \xE7ekilmi\u015F kullan\u0131m videosu varsa bu ihlaldir. Anlat\u0131m (voice-over), altyaz\u0131 ve metin/g\xF6rsel bindirmeleri serbesttir. Sticker ve iMessage uzant\u0131lar\u0131 deneyimi Mesajlar uygulamas\u0131nda g\xF6sterebilir.\n",
        "ruleText": "\xD6nizlemeler yaln\u0131zca uygulaman\u0131n kendi ekran kay\u0131tlar\u0131n\u0131 kullanabilir. Sticker ve iMessage uzant\u0131lar\u0131 kullan\u0131c\u0131 deneyimini Mesajlar uygulamas\u0131nda g\xF6sterebilir. Videodan anla\u015F\u0131lmayan noktalar\u0131 a\xE7\u0131klamak i\xE7in anlat\u0131m, video ya da metin bindirmesi eklenebilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.3.5-category-fit",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "category"
        ],
        "scope": "cross",
        "needs": [
          "category",
          "description",
          "name",
          "subtitle"
        ],
        "question": 'Uygulaman\u0131n se\xE7ili kategorisi, a\xE7\u0131klamadaki i\u015Flevle uyu\u015Fuyor mu? Belirgin bir uyu\u015Fmazl\u0131k varsa bildir (\xF6r. kategori "E\u011Fitim" ama uygulama bir foto\u011Fraf d\xFCzenleyici). Kategori makul se\xE7eneklerden biriyse \u2014 birden \xE7ok kategoriye girebilecek uygulamalarda s\u0131k olur \u2014 bulgu \xFCretme.\n',
        "ruleText": "Uygulaman i\xE7in en uygun kategoriyi se\xE7. Kategori tamamen alakas\u0131zsa Apple kategoriyi de\u011Fi\u015Ftirebilir.\n",
        "positiveExample": "Kategori Education, a\xE7\u0131klama ise \u201CBlur faces in your photos and add stickers before sharing.\u201D diyor.",
        "negativeExample": "Kategori Photo & Video, a\xE7\u0131klama ise \u201CBlur faces in your photos and add stickers before sharing.\u201D diyor.",
        "outcome": "risk",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-2.3.6-age-rating-answers",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.6",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.6",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "age-rating",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "(1) App Store Connect'teki ya\u015F s\u0131n\u0131r\u0131 sorular\u0131 d\xFCr\xFCst\xE7e yan\u0131tland\u0131 m\u0131 \u2014 uygulaman\u0131n ger\xE7ekte i\xE7erdi\u011Fi \u015Fiddet, korku, cinsellik, kumar, madde kullan\u0131m\u0131 ve kullan\u0131c\u0131 i\xE7eri\u011Fi beyanlar\u0131 do\u011Fru mu? (2) Uygulama, i\xE7erik derecelendirmesi ya da uyar\u0131 g\xF6sterilmesi gereken medya i\xE7eriyorsa (film, m\xFCzik, oyun), uygulaman\u0131n sunuldu\u011Fu her \xFClkenin yerel gerekliliklerine uyuluyor mu? Yanl\u0131\u015F derecelendirme hem kullan\u0131c\u0131y\u0131 \u015Fa\u015F\u0131rt\u0131r hem d\xFCzenleyici incelemesi tetikleyebilir.\n",
        "ruleText": "App Store Connect'teki ya\u015F s\u0131n\u0131r\u0131 sorular\u0131n\u0131 d\xFCr\xFCst\xE7e yan\u0131tla ki uygulaman ebeveyn denetimleriyle do\u011Fru bi\xE7imde hizalans\u0131n. Uygulaman yanl\u0131\u015F derecelendirilirse m\xFC\u015Fteriler beklemedikleri i\xE7erikle kar\u015F\u0131la\u015Fabilir ya da bu durum devlet d\xFCzenleyicilerinin incelemesini tetikleyebilir. Uygulaman i\xE7erik derecelendirmesi veya uyar\u0131s\u0131 g\xF6sterilmesi gereken medya (film, m\xFCzik, oyun vb.) i\xE7eriyorsa, sunuldu\u011Fu her \xFClke ve b\xF6lgedeki yerel gerekliliklere uymaktan sen sorumlusun.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.3.7-subtitle-rules",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.7",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.7",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "subtitle"
        ],
        "scope": "single",
        "needs": [
          "subtitle",
          "name"
        ],
        "facts": [
          "Apple metadata\u2019n\u0131n T\xDCR\xDCNE \xF6zg\xFC olmayan bilgiyi yasakl\u0131yor: fiyat, kampanya ko\u015Fulu ve \u015Fart ifadeleri ada, altyaz\u0131ya, ekran g\xF6r\xFCnt\xFClerine ve \xF6nizlemelere giremez.",
          "Altyaz\u0131 ayr\u0131ca: uygunsuz i\xE7erik bar\u0131nd\u0131ramaz, BA\u015EKA uygulamalara at\u0131f yapamaz ve do\u011Frulanamaz \xFCr\xFCn iddias\u0131 i\xE7eremez."
        ],
        "question": `Uygulama ad\u0131 ve altyaz\u0131s\u0131n\u0131 YALNIZCA \u015Fu d\xF6rt \u015Fey i\xE7in tara. Ba\u015Fka hi\xE7bir \u015Fey i\xE7in bulgu \xFCretme: (1) fiyat ya da kampanya bilgisi \u2014 rakam, para birimi, "% indirim", "free", "\xFCcretsiz", "sale"; (2) \u015Fart/ko\u015Ful ifadesi \u2014 "abonelik gerekir", "3 g\xFCn deneme", "iptal et"; (3) BA\u015EKA bir uygulaman\u0131n ad\u0131 (kendi uygulaman\u0131n ad\u0131 de\u011Fil); (4) do\u011Frulanamaz \xFCst\xFCnl\xFCk iddias\u0131 \u2014 "#1", "best", "en iyi", "no.1", "world's". Bu d\xF6rd\xFCnden hi\xE7biri yoksa {"findings": []} d\xF6nd\xFCr. Uygulaman\u0131n ne yapt\u0131\u011F\u0131n\u0131 sayan ifadeler \u2014 \xF6zellik listeleri d\xE2hil \u2014 bu maddenin konusu de\u011Fildir.
`,
        "ruleText": "Uygulama ad\u0131, altyaz\u0131, ekran g\xF6r\xFCnt\xFCleri ve \xF6nizlemeler gibi metadata, metadata t\xFCr\xFCne \xF6zg\xFC olmayan fiyat, \u015Fart ya da a\xE7\u0131klama i\xE7ermemelidir. Altyaz\u0131lar standart metadata kurallar\u0131na uymal\u0131; uygunsuz i\xE7erik, ba\u015Fka uygulamalara at\u0131f veya do\u011Frulanamaz \xFCr\xFCn iddias\u0131 i\xE7ermemelidir.\n",
        "positiveExample": "50% OFF \u2014 better than the #1 photo app",
        "negativeExample": "Blur faces and objects in photos",
        "notViolation": [
          "Uygulaman\u0131n \xF6zelliklerini sayan altyaz\u0131lar: 'AI Photo & Video Face Swap', 'Virtual Makeup & Nail Looks' gibi i\u015Flev listeleri.",
          "Kategori ve teknoloji adlar\u0131: 'AI', 'photo', 'video', 'editor', 'camera', 'filter'.",
          "'&' ya da virg\xFClle birle\u015Ftirilmi\u015F \xF6zellik dizileri \u2014 uzunluk tek ba\u015F\u0131na ihlal de\u011Fildir.",
          "Uygulaman\u0131n KEND\u0130 ad\u0131n\u0131n altyaz\u0131da ge\xE7mesi."
        ],
        "outcome": "violation",
        "defaultSeverity": "medium",
        "version": 2
      },
      {
        "id": "apple-2.3.8-for-kids-terms",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.8",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.8",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "kids"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "keywords",
          "promotionalText"
        ],
        "appliesWhen": {
          "targetsKids": false
        },
        "prefilter": [
          "for kids",
          "for children",
          "kids",
          "children",
          "toddler",
          "preschool",
          "\xE7ocuklar i\xE7in",
          "\xE7ocuk"
        ],
        "facts": [
          "\u201CFor Kids\u201D ve \u201CFor Children\u201D ifadeleri App Store\u2019da yaln\u0131zca Kids Category i\xE7in ayr\u0131lm\u0131\u015F.",
          "5.1.4 bunu geni\u015Fletiyor: Kids Category\u2019de olmayan uygulama, ana kitlesinin \xE7ocuklar oldu\u011Funu ima eden hi\xE7bir ifadeyi ad, altyaz\u0131, simge, ekran g\xF6r\xFCnt\xFCs\xFC ya da a\xE7\u0131klamada kullanamaz."
        ],
        "question": `Uygulama Kids Category'de DE\u011E\u0130L. Metinde ana kitlenin \xE7ocuklar oldu\u011Funu ima eden bir ifade var m\u0131 ("for kids", "for children", "toddler", "preschool", "\xE7ocuklar i\xE7in")? \xC7ocuklara UYGUN oldu\u011Funu s\xF6ylemek ile \xE7ocuklar \u0130\xC7\u0130N oldu\u011Funu s\xF6ylemek farkl\u0131d\u0131r; ikincisi bu kategoride yasakt\u0131r.
`,
        "ruleText": `"For Kids" ve "For Children" gibi terimlerin uygulama metadata's\u0131nda kullan\u0131m\u0131 App Store'da Kids Category i\xE7in ayr\u0131lm\u0131\u015Ft\u0131r. Kids Category'de olmayan uygulamalar; ad, altyaz\u0131, simge, ekran g\xF6r\xFCnt\xFCs\xFC veya a\xE7\u0131klamada ana kitlenin \xE7ocuklar oldu\u011Funu ima eden ifade kullanamaz.
`,
        "positiveExample": "Fun math games for kids ages 4-8",
        "negativeExample": "A family-friendly puzzle game everyone can enjoy",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.3.8-metadata-4plus",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.8",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.8",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "age-rating",
          "media",
          "vision"
        ],
        "scope": "cross",
        "needs": [
          "screenshots",
          "icon"
        ],
        "requiresVision": true,
        "facts": [
          "Kural ya\u015F s\u0131n\u0131r\u0131ndan BA\u011EIMSIZ: uygulama 17+ olsa bile metadata 4+ \xF6l\xE7\xFCs\xFCne uymak zorunda.",
          "Apple\u2019\u0131n verdi\u011Fi \xF6rnek: \u015Fiddet i\xE7eren bir oyunda korkun\xE7 bir \xF6l\xFCm sahnesi ya da belirli bir karaktere do\u011Frultulmu\u015F silah g\xF6steren g\xF6rsel se\xE7ilmemeli."
        ],
        "question": "Ekran g\xF6r\xFCnt\xFCleri ve simge, uygulaman\u0131n ya\u015F s\u0131n\u0131r\u0131ndan ba\u011F\u0131ms\u0131z olarak 4+ \xF6l\xE7\xFCs\xFCne uyuyor mu? Kanl\u0131/vah\u015Fi sahne, birine do\u011Frultulmu\u015F silah, cinsel i\xE7erik, k\xFCf\xFCr ya da uyu\u015Fturucu/alkol kullan\u0131m\u0131 g\xF6steren g\xF6rselleri bildir. Ayr\u0131ca simge ile ekran g\xF6r\xFCnt\xFClerindeki uygulama g\xF6rsel olarak ayn\u0131 uygulama gibi mi duruyor?\n",
        "ruleText": "Metadata t\xFCm kitlelere uygun olmal\u0131d\u0131r: uygulama daha y\xFCksek ya\u015F s\u0131n\u0131r\u0131na sahip olsa bile uygulama ve uygulama i\xE7i sat\u0131n alma simgeleri, ekran g\xF6r\xFCnt\xFCleri ve \xF6nizlemeler 4+ ya\u015F s\u0131n\u0131r\u0131na uymal\u0131d\u0131r. Metadata'n\u0131n \u2014 uygulama ad\u0131 ve simgeleri d\xE2hil \u2014 kafa kar\u0131\u015F\u0131kl\u0131\u011F\u0131 yaratmayacak bi\xE7imde birbirine benzemesi gerekir.\n",
        "positiveExample": "Ekran g\xF6r\xFCnt\xFCs\xFCnde bir karaktere do\u011Frultulmu\u015F tabanca ve kanl\u0131 bir sahne var.",
        "negativeExample": "Ekran g\xF6r\xFCnt\xFClerinde oyunun aray\xFCz\xFC, seviye haritas\u0131 ve puan tablosu g\xF6r\xFCn\xFCyor.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.3.9-screenshot-rights",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.3.9",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.9",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "metadata",
          "ip",
          "privacy",
          "vision"
        ],
        "scope": "cross",
        "needs": [
          "screenshots",
          "icon"
        ],
        "requiresVision": true,
        "question": "Ekran g\xF6r\xFCnt\xFClerinde ya da simgede GER\xC7EK bir ki\u015Fiye ait g\xF6r\xFCnen veri var m\u0131 (ger\xE7ek isim, telefon, e-posta, adres, ger\xE7ek bir ki\u015Finin foto\u011Fraf\u0131, ger\xE7ek sohbet i\xE7eri\u011Fi)? Apple kurgusal hesap bilgisi kullan\u0131lmas\u0131n\u0131 istiyor. Ayr\u0131ca \xFC\xE7\xFCnc\xFC tarafa ait oldu\u011Fu belli materyal (marka logosu, film karesi, tan\u0131nm\u0131\u015F ki\u015Fi g\xF6rseli) izinsiz kullan\u0131lm\u0131\u015F g\xF6r\xFCn\xFCyorsa bildir.\n",
        "ruleText": "Uygulama simgelerinde, ekran g\xF6r\xFCnt\xFClerinde ve \xF6nizlemelerde kullan\u0131lan t\xFCm materyallerin haklar\u0131n\u0131 alm\u0131\u015F olmal\u0131s\u0131n ve ger\xE7ek bir ki\u015Fiye ait veri yerine kurgusal hesap bilgisi g\xF6stermelisin.\n",
        "positiveExample": "Ekran g\xF6r\xFCnt\xFCs\xFCnde ger\xE7ek bir kullan\u0131c\u0131n\u0131n ad\u0131, e-postas\u0131 ve profil foto\u011Fraf\u0131 g\xF6r\xFCn\xFCyor.",
        "negativeExample": "Ekran g\xF6r\xFCnt\xFCs\xFCnde \u201CJane Appleseed\u201D adl\u0131 \xF6rnek profil ve \xF6rnek veriler var.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.4.1-ipad-support",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.4.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hardware",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": `iPhone uygulamas\u0131 iPad'de de \xE7al\u0131\u015F\u0131yor mu? Apple bunu "m\xFCmk\xFCn oldu\u011Funda" bekliyor. \xC7al\u0131\u015Fm\u0131yorsa sebebi (\xF6r. yaln\u0131zca iPhone'da olan bir donan\u0131m) savunulabilir mi ve ekran g\xF6r\xFCnt\xFCs\xFC/cihaz aileleri buna uygun mu?
`,
        "ruleText": "\u0130nsanlar\u0131n uygulamandan en iyi \u015Fekilde yararlanabilmesi i\xE7in iPhone uygulamalar\u0131 m\xFCmk\xFCn oldu\u011Funda iPad'de de \xE7al\u0131\u015Fmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-2.4.2-power-and-background",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.4.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hardware",
          "performance",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "mining",
          "miner",
          "crypto",
          "battery",
          "charging",
          "background"
        ],
        "question": "Uygulama pili h\u0131zla t\xFCketiyor, a\u015F\u0131r\u0131 \u0131s\u0131t\u0131yor ya da cihaz kaynaklar\u0131n\u0131 gereksiz zorluyor mu? Cihaz\u0131n yast\u0131k/yorgan alt\u0131nda \u015Farj edilmesini \xF6neren bir y\xF6nlendirme var m\u0131? Uygulama ya da i\xE7indeki \xFC\xE7\xFCnc\xFC taraf reklamlar, kripto madencili\u011Fi gibi ilgisiz arka plan i\u015Flemleri \xE7al\u0131\u015Ft\u0131r\u0131yor mu?\n",
        "ruleText": "Uygulamalar g\xFCc\xFC verimli kullanmal\u0131 ve cihaza zarar riski ta\u015F\u0131mamal\u0131d\u0131r: pili h\u0131zla t\xFCketmemeli, a\u015F\u0131r\u0131 \u0131s\u0131 \xFCretmemeli, kaynaklar\u0131 gereksiz zorlamamal\u0131d\u0131r. Uygulamalar ve i\xE7lerinde g\xF6sterilen \xFC\xE7\xFCnc\xFC taraf reklamlar, kripto madencili\u011Fi gibi ilgisiz arka plan i\u015Flemleri \xE7al\u0131\u015Ft\u0131ramaz.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.4.3-tv-and-controllers",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.4.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hardware",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "apple tv",
          "tvos",
          "game controller",
          "gamepad",
          "controller"
        ],
        "question": "Apple TV uygulamas\u0131 Siri Remote ya da \xFC\xE7\xFCnc\xFC taraf oyun kumandas\u0131 d\u0131\u015F\u0131nda bir donan\u0131m gerektirmeden kullan\u0131labiliyor mu? Oyun kumandas\u0131 ZORUNLU ise bu, kullan\u0131c\u0131 sat\u0131n almadan \xF6nce metadata'da a\xE7\u0131k\xE7a yaz\u0131yor mu?\n",
        "ruleText": "\u0130nsanlar Apple TV uygulaman\u0131 Siri Remote ya da \xFC\xE7\xFCnc\xFC taraf oyun kumandalar\u0131 d\u0131\u015F\u0131nda bir donan\u0131m giri\u015Fine ihtiya\xE7 duymadan kullanabilmelidir. Oyun kumandas\u0131 \u015Fart ko\u015Fuyorsan bunu metadata'da a\xE7\u0131k\xE7a anlat.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.4.4-system-settings",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.4.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hardware",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "restart",
          "reboot",
          "turn off wi-fi",
          "airplane mode",
          "disable",
          "settings"
        ],
        "question": "Uygulama, kullan\u0131c\u0131dan cihaz\u0131 yeniden ba\u015Flatmas\u0131n\u0131 ya da uygulaman\u0131n ana i\u015Fleviyle ilgisiz sistem ayarlar\u0131n\u0131 de\u011Fi\u015Ftirmesini istiyor mu (Wi-Fi'\u0131 kapat, g\xFCvenlik \xF6zelli\u011Fini devre d\u0131\u015F\u0131 b\u0131rak gibi)?\n",
        "ruleText": "Uygulamalar, ana i\u015Flevleriyle ilgisiz bi\xE7imde cihaz\u0131n yeniden ba\u015Flat\u0131lmas\u0131n\u0131 ya da sistem ayarlar\u0131n\u0131n de\u011Fi\u015Ftirilmesini asla \xF6nermemeli ve \u015Fart ko\u015Fmamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.4.5-mac-app-store",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.4.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "mac",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "mac",
          "macos",
          "mac app store",
          "desktop"
        ],
        "question": "Mac App Store'a g\xF6nderiyorsan dokuz \u015Fart\u0131n hepsi sa\u011Flan\u0131yor mu: (i) uygun sandbox ve dosya sistemi kurallar\u0131, (ii) Xcode ile paketleme, \xFC\xE7\xFCnc\xFC taraf y\xFCkleyici yok, tek ve kendi kendine yeten paket, (iii) r\u0131zas\u0131z otomatik ba\u015Flatma yok, Dock'a kendini eklemiyor, (iv) ba\u011F\u0131ms\u0131z uygulama/kext/ek kod indirmiyor, (v) root yetkisi istemiyor, (vi) a\xE7\u0131l\u0131\u015Fta lisans ekran\u0131 yok, kendi kopya korumas\u0131n\u0131 uygulam\u0131yor, (vii) g\xFCncellemeler Mac App Store \xFCzerinden, (viii) g\xFCncel i\u015Fletim sisteminde \xE7al\u0131\u015F\u0131yor ve kullan\u0131mdan kald\u0131r\u0131lm\u0131\u015F teknoloji kullanm\u0131yor, (ix) t\xFCm dil deste\u011Fi tek pakette.\n",
        "ruleText": "Mac App Store \xFCzerinden da\u011F\u0131t\u0131lan uygulamalar i\xE7in ek \u015Fartlar ge\xE7erlidir: sandbox, Xcode ile paketleme, r\u0131zas\u0131z otomatik ba\u015Flatmama, ek kod indirmeme, root yetkisi istememe, lisans ekran\u0131 ve kendi kopya korumas\u0131 koymama, g\xFCncellemeleri Mac App Store'dan da\u011F\u0131tma, g\xFCncel i\u015Fletim sisteminde \xE7al\u0131\u015Fma ve t\xFCm yerelle\u015Ftirmeyi tek pakette ta\u015F\u0131ma.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.5.1-public-apis",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Uygulama yaln\u0131zca genel (public) API'leri mi kullan\u0131yor ve g\xFCncel i\u015Fletim sisteminde mi \xE7al\u0131\u015F\u0131yor? Kullan\u0131mdan kald\u0131r\u0131lan \xE7er\xE7eveler ay\u0131kland\u0131 m\u0131? Kullan\u0131lan \xE7er\xE7eveler AMACINA uygun mu (HealthKit sa\u011Fl\u0131k/fitness i\xE7in, HomeKit ev otomasyonu i\xE7in) ve bu entegrasyon uygulama a\xE7\u0131klamas\u0131nda belirtiliyor mu?\n",
        "ruleText": "Uygulamalar yaln\u0131zca genel API'leri kullanabilir ve g\xFCncel i\u015Fletim sisteminde \xE7al\u0131\u015Fmal\u0131d\u0131r. Kullan\u0131mdan kald\u0131r\u0131lan \xF6zellik, \xE7er\xE7eve ve teknolojiler a\u015Famal\u0131 olarak b\u0131rak\u0131lmal\u0131d\u0131r. API ve \xE7er\xE7eveler ama\xE7lar\u0131na uygun kullan\u0131lmal\u0131 ve bu entegrasyon uygulama a\xE7\u0131klamas\u0131nda belirtilmelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.5.11-sirikit",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.11",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.11",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "siri",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "siri",
          "shortcut",
          "shortcuts",
          "voice command"
        ],
        "question": "SiriKit ve K\u0131sayollar entegrasyonunda: (i) yaln\u0131zca ba\u015Fka bir uygulamaya gerek olmadan ger\xE7ekle\u015Ftirebilece\u011Fin ve uygulaman\u0131n i\u015Flevinden beklenecek intent'lere kaydoldun mu, (ii) plist'teki kelime ve ifadeler uygulamana ve kaydoldu\u011Fun intent'lere ait mi (takma adlar uygulama/\u015Firket ad\u0131nla ilgili olmal\u0131, genel terim ya da \xFC\xE7\xFCnc\xFC taraf uygulama ad\u0131 olamaz), (iii) istek en do\u011Frudan bi\xE7imde kar\u015F\u0131lan\u0131yor ve araya reklam/pazarlama girmiyor mu?\n",
        "ruleText": "SiriKit ve K\u0131sayollar entegre eden uygulamalar yaln\u0131zca ek bir uygulamaya ihtiya\xE7 duymadan kar\u015F\u0131layabilecekleri ve belirtilen i\u015Flevden beklenecek intent'lere kaydolmal\u0131d\u0131r. plist'teki kelime da\u011Farc\u0131\u011F\u0131 uygulamaya ait olmal\u0131, takma adlar genel terim veya \xFC\xE7\xFCnc\xFC taraf ad\u0131 i\xE7ermemelidir. Siri iste\u011Fi ya da K\u0131sayol en do\u011Frudan bi\xE7imde \xE7\xF6z\xFClmeli, istek ile yerine getirilmesi aras\u0131na reklam ya da pazarlama sokulmamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.5.12-call-sms-blocking",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.12",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.12",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "spam",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "description",
          "name",
          "subtitle",
          "promotionalText"
        ],
        "prefilter": [
          "spam call",
          "call block",
          "call blocking",
          "sms block",
          "robocall",
          "spam sms",
          "caller id",
          "spam identification",
          "unknown caller"
        ],
        "facts": [
          "Apple iki \u015Feyi birden istiyor: bu \xF6zelliklerin PAZARLAMA METN\u0130NDE a\xE7\u0131k\xE7a belirtilmesi ve engelleme/spam listelerinin \xF6l\xE7\xFCt\xFCn\xFCn a\xE7\u0131klanmas\u0131."
        ],
        "question": "Uygulama arama/SMS/MMS engelleme ya da spam tan\u0131mlama sunuyorsa, pazarlama metni (1) bu \xF6zellikleri a\xE7\u0131k\xE7a tan\u0131t\u0131yor mu ve (2) engellenen/spam say\u0131lan numaralar\u0131n hangi \xF6l\xE7\xFCte g\xF6re belirlendi\u011Fini a\xE7\u0131kl\u0131yor mu? \xD6zellik var ama \xF6l\xE7\xFCt anlat\u0131lmam\u0131\u015Fsa bildir.\n",
        "ruleText": "CallKit kullanan ya da SMS Fraud Extension i\xE7eren uygulamalar yaln\u0131zca do\u011Frulanm\u0131\u015F spam numaralar\u0131 engellemelidir. Arama, SMS ve MMS engelleme ya da spam tan\u0131mlama i\u015Flevi i\xE7eren uygulamalar bu \xF6zellikleri pazarlama metinlerinde a\xE7\u0131k\xE7a belirtmeli ve engelleme/spam listelerinin \xF6l\xE7\xFCt\xFCn\xFC a\xE7\u0131klamal\u0131d\u0131r. Bu ara\xE7larla eri\u015Filen veri, uygulaman\u0131n i\u015Fletilmesi veya iyile\u015Ftirilmesiyle do\u011Frudan ilgili olmayan hi\xE7bir ama\xE7la kullan\u0131lamaz.\n",
        "positiveExample": "Blocks thousands of spam callers automatically.",
        "negativeExample": "Blocks numbers reported as spam by at least 50 users and verified against the public FTC complaint list; you can review and unblock any number.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.5.13-facial-recognition",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.13",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.13",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "face id",
          "facial recognition",
          "face unlock",
          "face login",
          "face scan",
          "biometric"
        ],
        "question": "Hesap do\u011Frulamas\u0131 i\xE7in y\xFCz tan\u0131ma kullan\u0131l\u0131yorsa: m\xFCmk\xFCn olan her yerde LocalAuthentication m\u0131 kullan\u0131l\u0131yor (ARKit ya da ba\u015Fka bir y\xFCz tan\u0131ma teknolojisi de\u011Fil)? 13 ya\u015F\u0131ndan k\xFC\xE7\xFCk kullan\u0131c\u0131lar i\xE7in alternatif bir do\u011Frulama y\xF6ntemi var m\u0131?\n",
        "ruleText": "Hesap kimlik do\u011Frulamas\u0131 i\xE7in y\xFCz tan\u0131ma kullanan uygulamalar m\xFCmk\xFCn olan yerlerde LocalAuthentication kullanmal\u0131 (ARKit ya da di\u011Fer y\xFCz tan\u0131ma teknolojileri de\u011Fil) ve 13 ya\u015F\u0131ndan k\xFC\xE7\xFCk kullan\u0131c\u0131lar i\xE7in alternatif bir kimlik do\u011Frulama y\xF6ntemi sunmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.5.14-recording-consent",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.14",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.14",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "recording",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "usesCameraOrMicrophone": true
        },
        "question": "Kay\u0131t yapan uygulamada: kullan\u0131c\u0131dan A\xC7IK r\u0131za al\u0131n\u0131yor mu ve kay\u0131t s\u0131ras\u0131nda g\xF6r\xFCn\xFCr ve/veya duyulur bir g\xF6sterge var m\u0131? Bu kural kamera, mikrofon, ekran kayd\u0131 ve di\u011Fer kullan\u0131c\u0131 girdilerinin tamam\u0131n\u0131 kaps\u0131yor.\n",
        "ruleText": "Uygulamalar kullan\u0131c\u0131 etkinli\u011Fini kaydederken, g\xFCnl\xFCklerken ya da ba\u015Fka bi\xE7imde kayda ge\xE7irirken a\xE7\u0131k kullan\u0131c\u0131 r\u0131zas\u0131 istemeli ve net bir g\xF6rsel ve/veya i\u015Fitsel g\xF6sterge sunmal\u0131d\u0131r. Buna cihaz kameras\u0131, mikrofon, ekran kay\u0131tlar\u0131 ve di\u011Fer kullan\u0131c\u0131 girdileri d\xE2hildir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.5.15-files-app",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.15",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.15",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "file",
          "files",
          "document",
          "documents",
          "pdf",
          "import",
          "storage"
        ],
        "question": "Kullan\u0131c\u0131ya dosya g\xF6r\xFCnt\xFCletip se\xE7tiren uygulama, Files uygulamas\u0131ndaki \xF6\u011Feleri ve kullan\u0131c\u0131n\u0131n iCloud belgelerini de listeliyor mu?\n",
        "ruleText": "Kullan\u0131c\u0131lar\u0131n dosyalar\u0131 g\xF6r\xFCnt\xFClemesini ve se\xE7mesini sa\u011Flayan uygulamalar Files uygulamas\u0131ndaki \xF6\u011Feleri ve kullan\u0131c\u0131n\u0131n iCloud belgelerini de i\xE7ermelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-2.5.16-extensions-relevance",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.16",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.16",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "extensions",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasAppExtensions": true
        },
        "question": "Widget'lar, uzant\u0131lar ve bildirimler uygulaman\u0131n i\xE7eri\u011Fi ve i\u015Fleviyle ilgili mi? App Clip kullan\u0131yorsan: t\xFCm App Clip \xF6zellikleri ana uygulama binary'sinde de var m\u0131 ve App Clip reklam i\xE7ermiyor mu?\n",
        "ruleText": "Widget'lar, uzant\u0131lar ve bildirimler uygulaman\u0131n i\xE7eri\u011Fi ve i\u015Fleviyle ilgili olmal\u0131d\u0131r. Ayr\u0131ca t\xFCm App Clip \xF6zellikleri ve i\u015Flevleri ana uygulama binary'sinde yer almal\u0131d\u0131r; App Clip'ler reklam i\xE7eremez.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.5.17-matter",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.17",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.17",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hardware",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "matter",
          "thread",
          "homekit",
          "smart home",
          "iot"
        ],
        "question": "Matter destekliyorsan: e\u015Fle\u015Ftirmeyi ba\u015Flatmak i\xE7in Apple'\u0131n Matter destek \xE7er\xE7evesini kullan\u0131yor musun? Apple'\u0131n verdi\u011Fi Matter SDK d\u0131\u015F\u0131nda bir Matter bile\u015Feni kullan\u0131yorsan, o bile\u015Fen \xE7al\u0131\u015Ft\u0131\u011F\u0131 platform i\xE7in Connectivity Standards Alliance taraf\u0131ndan sertifikaland\u0131r\u0131lm\u0131\u015F m\u0131?\n",
        "ruleText": "Matter destekleyen uygulamalar e\u015Fle\u015Ftirmeyi ba\u015Flatmak i\xE7in Apple'\u0131n Matter destek \xE7er\xE7evesini kullanmal\u0131d\u0131r. Apple'\u0131n sa\u011Flad\u0131\u011F\u0131 Matter SDK d\u0131\u015F\u0131nda bir Matter yaz\u0131l\u0131m bile\u015Feni kullan\u0131l\u0131yorsa, bu bile\u015Fen \xE7al\u0131\u015Ft\u0131\u011F\u0131 platform i\xE7in Connectivity Standards Alliance taraf\u0131ndan sertifikaland\u0131r\u0131lm\u0131\u015F olmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-2.5.18-advertising-rules",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.18",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.18",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "ads",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "showsAds": true
        },
        "question": "Reklam g\xF6steren uygulamada: (1) reklamlar yaln\u0131zca ana binary'de mi (uzant\u0131, App Clip, widget, bildirim, klavye, watchOS uygulamas\u0131nda reklam yok), (2) reklamlar uygulaman\u0131n ya\u015F s\u0131n\u0131r\u0131na uygun mu, (3) kullan\u0131c\u0131, kendisini hedeflemek i\xE7in kullan\u0131lan bilgilerin tamam\u0131n\u0131 uygulamadan \xC7IKMADAN g\xF6rebiliyor mu, (4) sa\u011Fl\u0131k/HealthKit, okul/ClassKit ya da \xE7ocuk verisi gibi hassas veriyle hedefleme yap\u0131lm\u0131yor, de\u011Fil mi, (5) ge\xE7i\u015F reklamlar\u0131 reklam oldu\u011Funu a\xE7\u0131k\xE7a belli ediyor, kolayca kapat\u0131labiliyor ve kullan\u0131c\u0131y\u0131 t\u0131klamaya kand\u0131rm\u0131yor mu, (6) uygunsuz veya ya\u015Fa uygun olmayan reklam\u0131 \u015Fikayet etme yolu var m\u0131?\n",
        "ruleText": "Reklam g\xF6sterimi ana uygulama binary'siyle s\u0131n\u0131rl\u0131 olmal\u0131d\u0131r; uzant\u0131, App Clip, widget, bildirim, klavye ve watchOS uygulamalar\u0131nda reklam g\xF6sterilemez. Reklamlar uygulaman\u0131n ya\u015F s\u0131n\u0131r\u0131na uygun olmal\u0131, kullan\u0131c\u0131n\u0131n hedefleme i\xE7in kullan\u0131lan t\xFCm bilgileri uygulamadan \xE7\u0131kmadan g\xF6rmesine izin vermeli ve sa\u011Fl\u0131k/t\u0131bbi veri, okul verisi ya da \xE7ocuklardan elde edilen veri gibi hassas verilere dayal\u0131 hedefli veya davran\u0131\u015Fsal reklamc\u0131l\u0131k yapmamal\u0131d\u0131r. Kullan\u0131c\u0131 deneyimini kesen ya da engelleyen reklamlar reklam olduklar\u0131n\u0131 a\xE7\u0131k\xE7a belirtmeli, kullan\u0131c\u0131y\u0131 kand\u0131rmamal\u0131 ve kolayca g\xF6r\xFClebilen, yeterince b\xFCy\xFCk bir kapatma d\xFC\u011Fmesi sunmal\u0131d\u0131r. Reklam i\xE7eren uygulamalar, kullan\u0131c\u0131lar\u0131n uygunsuz ya da ya\u015Fa uygun olmayan reklamlar\u0131 bildirebilmesini de sa\u011Flamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.5.2-self-contained",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Uygulama kendi paketinde kendine yeten bir b\xFCt\xFCn m\xFC? Ayr\u0131lm\u0131\u015F konteyner alan\u0131n\u0131n d\u0131\u015F\u0131na veri yaz\u0131yor ya da oradan okuyor mu? Uygulaman\u0131n (ya da ba\u015Fka uygulamalar\u0131n) \xF6zelliklerini de\u011Fi\u015Ftiren veya ekleyen kod indiriyor, kuruyor veya \xE7al\u0131\u015Ft\u0131r\u0131yor mu? E\u011Fitim ama\xE7l\u0131 kod \xE7al\u0131\u015Ft\u0131ran uygulamalarda kaynak kod kullan\u0131c\u0131 taraf\u0131ndan g\xF6r\xFClebilir ve d\xFCzenlenebilir mi?\n",
        "ruleText": "Uygulamalar kendi paketlerinde kendine yeten olmal\u0131, ayr\u0131lm\u0131\u015F konteyner alan\u0131n\u0131n d\u0131\u015F\u0131na veri okuyup yazmamal\u0131 ve uygulaman\u0131n (ya da di\u011Fer uygulamalar\u0131n) \xF6zelliklerini ve i\u015Flevlerini de\u011Fi\u015Ftiren kod indirmemeli, kurmamal\u0131 veya \xE7al\u0131\u015Ft\u0131rmamal\u0131d\u0131r. \xD6\u011Frencilerin kod yaz\u0131p denemesini sa\u011Flayan e\u011Fitim uygulamalar\u0131 s\u0131n\u0131rl\u0131 durumlarda kod indirebilir; bu kod ba\u015Fka ama\xE7la kullan\u0131lmamal\u0131 ve kaynak kod kullan\u0131c\u0131ya tamamen g\xF6r\xFCn\xFCr ve d\xFCzenlenebilir olmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.5.3-harmful-code",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "security",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "virus",
          "malware",
          "antivirus",
          "scanner",
          "security scan",
          "clean your"
        ],
        "question": 'Uygulama, i\u015Fletim sisteminin ya da donan\u0131m \xF6zelliklerinin normal \xE7al\u0131\u015Fmas\u0131n\u0131 bozabilecek dosya, kod veya program iletiyor mu? Push Notifications ve Game Center \xFCzerinden yap\u0131lan k\xF6t\xFCye kullan\u0131mlar da bu maddeye giriyor. Kendini "vir\xFCs/malware taray\u0131c\u0131" olarak tan\u0131tan iOS uygulamalar\u0131 ayr\u0131ca 2.3.1 (yan\u0131lt\u0131c\u0131 pazarlama) kapsam\u0131nda reddediliyor.\n',
        "ruleText": "\u0130\u015Fletim sisteminin ve/veya donan\u0131m \xF6zelliklerinin normal \xE7al\u0131\u015Fmas\u0131na zarar verebilecek ya da bunu bozabilecek vir\xFCs, dosya, kod veya program ileten uygulamalar reddedilir. A\u011F\u0131r ihlaller ve tekrar eden davran\u0131\u015F Apple Developer Program'dan \xE7\u0131kar\u0131lmayla sonu\xE7lan\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.5.4-background-services",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "background",
          "voip",
          "location",
          "audio",
          "always on",
          "arka plan"
        ],
        "question": "Uygulama arka plan servislerini yaln\u0131zca amac\u0131na uygun kullan\u0131yor mu (VoIP, ses \xE7alma, konum, g\xF6rev tamamlama, yerel bildirim)? Beyan edilen arka plan modu ger\xE7ekten kullan\u0131l\u0131yor mu, yoksa yaln\u0131zca uygulamay\u0131 canl\u0131 tutmak i\xE7in mi a\xE7\u0131lm\u0131\u015F?\n",
        "ruleText": "\xC7oklu g\xF6rev yapan uygulamalar arka plan servislerini yaln\u0131zca ama\xE7lar\u0131na uygun kullanabilir: VoIP, ses \xE7alma, konum, g\xF6rev tamamlama, yerel bildirimler vb.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.5.5-ipv6",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Uygulama yaln\u0131zca IPv6 olan bir a\u011Fda tam olarak \xE7al\u0131\u015F\u0131yor mu? Apple incelemesi bu a\u011Fda yap\u0131l\u0131yor; IPv4 varsay\u0131m\u0131 yapan bir istemci ya da sabit IP kullan\u0131m\u0131 burada patlar.\n",
        "ruleText": "Uygulamalar yaln\u0131zca IPv6 olan a\u011Flarda tam i\u015Flevsel olmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-2.5.6-webkit",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.6",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.6",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "webview",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "isWebViewWrapper": true
        },
        "question": "Web tarayan uygulama uygun WebKit \xE7er\xE7evesini ve WebKit JavaScript'ini mi kullan\u0131yor? Alternatif bir taray\u0131c\u0131 motoru kullan\u0131yorsan (yaln\u0131z AB ve Japonya) buna dair entitlement ba\u015Fvurun onayland\u0131 m\u0131?\n",
        "ruleText": "Web tarayan uygulamalar uygun WebKit \xE7er\xE7evesini ve WebKit JavaScript'i kullanmak zorundad\u0131r. Alternatif bir web taray\u0131c\u0131 motoru kullanmak i\xE7in entitlement ba\u015Fvurusu yap\u0131labilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.5.8-alternate-home-screen",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.8",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.8",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "launcher",
          "home screen",
          "desktop",
          "springboard",
          "app drawer"
        ],
        "question": "Uygulama alternatif bir masa\xFCst\xFC ya da ana ekran ortam\u0131 olu\u015Fturuyor mu? Bu do\u011Frudan ret sebebi.\n",
        "ruleText": "Alternatif masa\xFCst\xFC/ana ekran ortamlar\u0131 olu\u015Fturan uygulamalar reddedilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-2.5.9-system-controls",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "2.5.9",
          "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.9",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "volume button",
          "silent switch",
          "mute switch",
          "lock screen",
          "system button"
        ],
        "question": "Uygulama standart anahtarlar\u0131n (ses a\xE7ma/k\u0131sma, sessize alma) ya da yerle\u015Fik aray\xFCz \xF6\u011Felerinin davran\u0131\u015F\u0131n\u0131 de\u011Fi\u015Ftiriyor veya devre d\u0131\u015F\u0131 b\u0131rak\u0131yor mu? Kullan\u0131c\u0131n\u0131n belirli bi\xE7imde \xE7al\u0131\u015Fmas\u0131n\u0131 bekledi\u011Fi ba\u011Flant\u0131 ve \xF6zellikleri engelliyor mu?\n",
        "ruleText": "Ses a\xE7ma/k\u0131sma ve zil/sessiz anahtar\u0131 gibi standart anahtarlar\u0131n ya da yerle\u015Fik aray\xFCz \xF6\u011Felerinin ve davran\u0131\u015Flar\u0131n\u0131n i\u015Flevini de\u011Fi\u015Ftiren veya devre d\u0131\u015F\u0131 b\u0131rakan uygulamalar reddedilir. \xD6rne\u011Fin uygulamalar, kullan\u0131c\u0131n\u0131n \xE7al\u0131\u015Fmas\u0131n\u0131 bekledi\u011Fi di\u011Fer uygulamalara giden ba\u011Flant\u0131lar\u0131 engellememelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3-business-model-clarity",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "metadata"
        ],
        "scope": "cross",
        "needs": [
          "description",
          "reviewNotes",
          "iap"
        ],
        "question": `Uygulaman\u0131n nas\u0131l para kazand\u0131\u011F\u0131 listing'den ve review notlar\u0131ndan anla\u015F\u0131l\u0131yor mu? \xDCcretli bir i\u015Flev, abonelik ya da al\u0131\u015F\u0131lmad\u0131k bir i\u015F modeli varken metinde bundan hi\xE7 s\xF6z edilmiyorsa bildir. Apple bunu "anla\u015F\u0131lm\u0131yorsa inceleme gecikir ve ret tetiklenebilir" diye yaz\u0131yor.
`,
        "ruleText": "\u0130\u015F modelin a\xE7\u0131k de\u011Filse metadata'da ve App Review notlar\u0131nda a\xE7\u0131kla. Uygulaman\u0131n nas\u0131l \xE7al\u0131\u015Ft\u0131\u011F\u0131 ya da uygulama i\xE7i sat\u0131n almalar\u0131n ne oldu\u011Fu anla\u015F\u0131lm\u0131yorsa inceleme gecikir ve ret tetiklenebilir. Fiyatland\u0131rma sana aittir ama kullan\u0131c\u0131y\u0131 ak\u0131l d\u0131\u015F\u0131 y\xFCksek fiyatlarla kand\u0131ran uygulamalar da\u011F\u0131t\u0131lmaz.\n",
        "positiveExample": "Uygulamada 5 adet abonelik var, a\xE7\u0131klama ve review notlar\u0131nda ne sat\u0131ld\u0131\u011F\u0131na dair tek kelime yok.",
        "negativeExample": "A\xE7\u0131klama: \u201C\xDCcretsiz s\xFCr\xFCmde g\xFCnde 3 d\xFCzenleme; s\u0131n\u0131rs\u0131z d\xFCzenleme i\xE7in ayl\u0131k abonelik.\u201D",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.1-credits-and-gifts",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "iap",
          "payments",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasIap": true
        },
        "question": "Uygulama i\xE7i sat\u0131n almalarda: (1) sat\u0131n al\u0131nan kredi ya da oyun i\xE7i para birimi zaman a\u015F\u0131m\u0131na u\u011Fruyor mu (u\u011Framamal\u0131), (2) geri y\xFCklenebilir sat\u0131n almalar i\xE7in bir geri y\xFCkleme mekanizmas\u0131 var m\u0131, (3) hediye edilebilen \xF6\u011Feler yaln\u0131zca ilk sat\u0131n alana iade ediliyor ve takas edilemiyor mu?\n",
        "ruleText": "Uygulama i\xE7i sat\u0131n almayla al\u0131nan krediler ve oyun i\xE7i para birimleri zaman a\u015F\u0131m\u0131na u\u011Frayamaz; geri y\xFCklenebilir sat\u0131n almalar i\xE7in bir geri y\xFCkleme mekanizmas\u0131 bulunmal\u0131d\u0131r. Uygulamalar, uygulama i\xE7i sat\u0131n almaya uygun \xF6\u011Felerin ba\u015Fkalar\u0131na hediye edilmesine izin verebilir; bu hediyeler yaln\u0131zca ilk sat\u0131n alana iade edilebilir ve takas edilemez.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.1-digital-gift-cards",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "iap",
          "payments"
        ],
        "scope": "single",
        "needs": [
          "description",
          "iap",
          "promotionalText"
        ],
        "prefilter": [
          "gift card",
          "giftcard",
          "voucher",
          "coupon",
          "certificate",
          "hediye kart"
        ],
        "question": "Uygulama dijital hediye kart\u0131, sertifika, kupon ya da bilet sat\u0131yor mu? Dijital mal veya hizmete \xE7evrilebilen bunlar YALNIZCA uygulama i\xE7i sat\u0131n alma ile sat\u0131labilir. Fiziksel olarak postalanan hediye kartlar\u0131 ba\u015Fka \xF6deme y\xF6ntemleri kullanabilir \u2014 metinden hangisi oldu\u011Fu anla\u015F\u0131l\u0131yor mu?\n",
        "ruleText": "Dijital mal veya hizmetlere \xE7evrilebilen dijital hediye kartlar\u0131, sertifikalar, kuponlar ve indirim kuponlar\u0131 uygulamanda yaln\u0131zca uygulama i\xE7i sat\u0131n alma ile sat\u0131labilir. Uygulama i\xE7inde sat\u0131l\u0131p m\xFC\u015Fterilere posta ile g\xF6nderilen fiziksel hediye kartlar\u0131 uygulama i\xE7i sat\u0131n alma d\u0131\u015F\u0131ndaki \xF6deme y\xF6ntemlerini kullanabilir.\n",
        "positiveExample": "Buy a digital gift card with your credit card and send it instantly.",
        "negativeExample": "Order a physical gift card; we mail it to any address.",
        "outcome": "risk",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.1-external-purchase-steering",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#in-app-purchase",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "monetization",
          "steering"
        ],
        "scope": "cross",
        "needs": [
          "description",
          "promotionalText",
          "subtitle",
          "whatsNew",
          "screenshots",
          "urls"
        ],
        "facts": [
          "Apple, dijital i\xE7erik i\xE7in kullan\u0131c\u0131y\u0131 uygulama d\u0131\u015F\u0131 bir \xF6deme y\xF6ntemine y\xF6nlendirmeyi yasaklar.",
          "Fiziksel \xFCr\xFCn/hizmet sat\u0131\u015F\u0131 (kargo gerektiren mal, ger\xE7ek d\xFCnyada verilen hizmet) bu yasa\u011F\u0131n d\u0131\u015F\u0131ndad\u0131r."
        ],
        "question": 'Metin veya ekran g\xF6r\xFCnt\xFCleri, kullan\u0131c\u0131y\u0131 dijital i\xE7erik/abonelik i\xE7in uygulama DI\u015EINDA bir \xF6deme yoluna y\xF6nlendiriyor mu? \xD6rnek i\u015Faretler: "web sitemizden daha ucuz", "sitemizden abone ol", "buradan sat\u0131n al" + harici ba\u011Flant\u0131, indirim kodu ile site y\xF6nlendirmesi. Sadece genel bir web sitesi ba\u011Flant\u0131s\u0131 y\xF6nlendirme DE\u011E\u0130LD\u0130R.\n',
        "ruleText": "Uygulama i\xE7i dijital i\xE7erik yaln\u0131zca Apple'\u0131n sat\u0131n alma sistemiyle sat\u0131labilir; kullan\u0131c\u0131y\u0131 harici \xF6deme y\xF6ntemlerine y\xF6nlendirmek yasakt\u0131r.\n",
        "positiveExample": "Subscribe on our website for 50% less \u2014 glamio.com/pro",
        "negativeExample": "Learn more about Glamio at glamio.com",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.1-loot-box-odds",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "iap",
          "payments",
          "disclosure"
        ],
        "scope": "single",
        "needs": [
          "description",
          "iap",
          "promotionalText"
        ],
        "prefilter": [
          "loot box",
          "lootbox",
          "gacha",
          "mystery box",
          "random item",
          "chest",
          "crate",
          "summon",
          "draw"
        ],
        "question": "Uygulama, sat\u0131n al\u0131nabilen rastgele sanal \xF6\u011Feler sunuyor mu (loot box, gacha, s\xFCrpriz kutu, sand\u0131k)? Sunuyorsa her \xF6\u011Fe t\xFCr\xFCn\xFCn \xE7\u0131kma OLASILI\u011EI sat\u0131n almadan \xF6nce a\xE7\u0131klan\u0131yor mu? Rastgele \xF6d\xFCl vaadi var ama olas\u0131l\u0131k bilgisi yoksa bildir. \xDCcretsiz g\xFCnl\xFCk \xF6d\xFCl \xE7ark\u0131 bu maddenin konusu de\u011Fildir.\n",
        "ruleText": '"Loot box" ya da sat\u0131n alma kar\u015F\u0131l\u0131\u011F\u0131nda rastgele sanal \xF6\u011Fe veren di\u011Fer mekanizmalar\u0131 sunan uygulamalar, her \xF6\u011Fe t\xFCr\xFCn\xFCn elde edilme olas\u0131l\u0131\u011F\u0131n\u0131 sat\u0131n alma \xF6ncesinde m\xFC\u015Fterilere a\xE7\u0131klamak zorundad\u0131r.\n',
        "positiveExample": "Buy a Mystery Chest and get a random legendary skin!",
        "negativeExample": "Mystery Chest odds: legendary 2%, epic 8%, rare 30%, common 60%.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.1-nft",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "iap",
          "payments",
          "crypto",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "nft",
          "mint",
          "opensea",
          "web3",
          "blockchain",
          "token"
        ],
        "question": "NFT ile ilgili i\u015Flev varsa: (1) NFT sat\u0131\u015F\u0131, listeleme, transfer gibi hizmetler uygulama i\xE7i sat\u0131n alma ile mi yap\u0131l\u0131yor, (2) NFT SAH\u0130PL\u0130\u011E\u0130 uygulamada bir \xF6zellik ya da i\u015Flev a\xE7\u0131yor mu (a\xE7mamal\u0131), (3) ba\u015Fkalar\u0131n\u0131n koleksiyonlar\u0131na g\xF6z att\u0131ran ekranlarda \u2014 ABD vitrini d\u0131\u015F\u0131nda \u2014 IAP d\u0131\u015F\u0131 sat\u0131n almaya y\xF6nlendiren d\xFC\u011Fme, ba\u011Flant\u0131 ya da \xE7a\u011Fr\u0131 var m\u0131?\n",
        "ruleText": "Uygulamalar NFT'lerle ilgili hizmetleri (basma, listeleme, transfer) satmak i\xE7in uygulama i\xE7i sat\u0131n alma kullanabilir. Kullan\u0131c\u0131lar\u0131n kendi NFT'lerini g\xF6r\xFCnt\xFClemesine izin verilebilir, ancak NFT sahipli\u011Fi uygulamada \xF6zellik ya da i\u015Flev a\xE7amaz. Ba\u015Fkalar\u0131n\u0131n NFT koleksiyonlar\u0131na g\xF6z at\u0131lmas\u0131na izin verilebilir; ancak ABD vitrini d\u0131\u015F\u0131ndaki uygulamalarda, m\xFC\u015Fterileri uygulama i\xE7i sat\u0131n alma d\u0131\u015F\u0131ndaki sat\u0131n alma mekanizmalar\u0131na y\xF6nlendiren d\xFC\u011Fme, d\u0131\u015F ba\u011Flant\u0131 ya da \xE7a\u011Fr\u0131 bulunamaz.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.1-restore-purchases",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#in-app-purchase",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "subscriptions",
          "paywall",
          "vision"
        ],
        "scope": "cross",
        "needs": [
          "screenshots",
          "iap"
        ],
        "appliesWhen": {
          "hasSubscription": true
        },
        "requiresVision": true,
        "facts": [
          "Apple, kullan\u0131c\u0131n\u0131n daha \xF6nce sat\u0131n ald\u0131\u011F\u0131 i\xE7eri\u011Fi geri y\xFCkleyebilmesi i\xE7in sat\u0131n alma ekran\u0131nda bir 'Restore Purchases' mekanizmas\u0131 ister.",
          "D\xFC\u011Fme metni 'Restore', 'Restore Purchases' veya 'Already subscribed?' \u015Feklinde olabilir."
        ],
        "question": 'Paywall / sat\u0131n alma ekran g\xF6r\xFCnt\xFCs\xFCnde sat\u0131n almalar\u0131 geri y\xFCkleme se\xE7ene\u011Fi g\xF6r\xFCn\xFCyor mu ("Restore", "Restore Purchases", "Already subscribed?")? G\xF6r\xFCnm\xFCyorsa bildir. Ekran g\xF6r\xFCnt\xFCleri aras\u0131nda paywall yoksa bulgu \xFCretme.\n',
        "ruleText": "Sat\u0131n al\u0131nabilir i\xE7erik sunan uygulamalar, kullan\u0131c\u0131n\u0131n \xF6nceki sat\u0131n al\u0131mlar\u0131n\u0131 geri y\xFCkleyebilece\u011Fi bir mekanizma sunmal\u0131d\u0131r.\n",
        "positiveExample": "Paywall'da sadece 'Subscribe' ve 'Close' var; geri y\xFCkleme se\xE7ene\u011Fi yok.",
        "negativeExample": "Paywall'\u0131n alt\u0131nda 'Restore Purchases' ba\u011Flant\u0131s\u0131 g\xF6r\xFCn\xFCyor.",
        "outcome": "violation",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.1-trial-naming",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "iap",
          "payments",
          "trial"
        ],
        "scope": "single",
        "needs": [
          "iap"
        ],
        "appliesWhen": {
          "hasIap": true
        },
        "question": `Abonelik olmayan bir deneme s\xFCresi sunuluyorsa, bunun i\xE7in kullan\u0131lan t\xFCketilemez (non-consumable) \xFCr\xFCn\xFCn ad\u0131 Apple'\u0131n istedi\u011Fi kal\u0131ba uyuyor mu: "XX-day Trial" (\xF6r. "14-day Trial") ve fiyat\u0131 0 m\u0131? \xDCr\xFCn ad\u0131 deneme oldu\u011Funu s\xF6yl\xFCyor ama kal\u0131ba uymuyorsa ya da fiyat\u0131 s\u0131f\u0131r de\u011Filse bildir. Abonelik \xFCr\xFCnlerindeki \xFCcretsiz deneme bu maddenin konusu de\u011Fildir.
`,
        "ruleText": 'Abonelik olmayan uygulamalar, tam s\xFCr\xFCm kilidini a\xE7madan \xF6nce zamana dayal\u0131 \xFCcretsiz deneme sunabilir; bunun i\xE7in Fiyat Katman\u0131 0 olan ve "XX-day Trial" adland\u0131rma kural\u0131na uyan bir t\xFCketilemez uygulama i\xE7i sat\u0131n alma \xF6\u011Fesi tan\u0131mlanmal\u0131d\u0131r. Deneme ba\u015Flamadan \xF6nce uygulaman s\xFCresini, deneme bitti\u011Finde eri\u015Filemeyecek i\xE7erik veya hizmetleri ve tam i\u015Flevsellik i\xE7in \xF6denecek \xFCcretleri a\xE7\u0131k\xE7a belirtmelidir.\n',
        "positiveExample": "IAP: id=trial_pack [non_consumable] \u201CFree Trial Unlock\u201D \u2014 4.99 USD",
        "negativeExample": "IAP: id=trial_14 [non_consumable] \u201C14-day Trial\u201D \u2014 0 USD",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.1-unlock-outside-iap",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "iap",
          "payments",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "unlocksContentWithoutIap": true
        },
        "question": "\u0130\xE7erik ya da i\u015Flev, uygulama i\xE7i sat\u0131n alma DI\u015EINDA bir mekanizmayla a\xE7\u0131l\u0131yor mu: lisans anahtar\u0131, promosyon kodu, QR kod, AR i\u015Fareti, kripto para ya da kripto c\xFCzdan? B\xF6yle bir yol varsa Apple bunu do\u011Frudan yasakl\u0131yor. (Donan\u0131ma ba\u011Fl\u0131 a\xE7\u0131lan i\u015Flevler 3.1.4'\xFCn ayr\u0131 istisnas\u0131; kurumsal ve reader istisnalar\u0131 3.1.3'te.)\n",
        "ruleText": "Uygulama i\xE7indeki \xF6zellikleri ya da i\u015Flevleri a\xE7mak istiyorsan uygulama i\xE7i sat\u0131n alma kullanmak zorundas\u0131n. Uygulamalar i\xE7erik ya da i\u015Flev a\xE7mak i\xE7in lisans anahtar\u0131, art\u0131r\u0131lm\u0131\u015F ger\xE7eklik i\u015Fareti, QR kod, kripto paralar ve kripto c\xFCzdanlar\u0131 gibi kendi mekanizmalar\u0131n\u0131 kullanamaz.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.1a-external-purchase-link",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.1(a)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1(a)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "iap",
          "payments",
          "entitlement",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasExternalPurchaseLink": true
        },
        "question": "Uygulamada IAP d\u0131\u015F\u0131 sat\u0131n almaya y\xF6nlendiren ba\u011Flant\u0131 varsa: (1) uygun entitlement'a (StoreKit External Purchase Link, Music Streaming Services ya da External Link Account) sahip misin, (2) ba\u011Flant\u0131 yaln\u0131zca entitlement'\u0131n kapsad\u0131\u011F\u0131 vitrinlerde mi g\xF6steriliyor, (3) ba\u011Flant\u0131 metni yaln\u0131zca izin verilen bilgiyi mi veriyor (nerede ve nas\u0131l sat\u0131n al\u0131naca\u011F\u0131, \xF6\u011Felerin daha ucuz olabilece\u011Fi), (4) yan\u0131lt\u0131c\u0131 pazarlama ya da doland\u0131r\u0131c\u0131l\u0131k imas\u0131 yok, de\u011Fil mi? ABD vitrininde bu yasak uygulanm\u0131yor.\n",
        "ruleText": "Geli\u015Ftiriciler, dijital i\xE7erik veya hizmet sat\u0131n almak \xFCzere kendi sitelerine ba\u011Flant\u0131 vermek i\xE7in entitlement ba\u015Fvurusu yapabilir. Bu entitlement'lar yaln\u0131zca belirli vitrinlerde iOS/iPadOS App Store'da kullan\u0131labilir. ABD vitrini d\u0131\u015F\u0131ndaki t\xFCm vitrinlerde, uygulamalar ve metadata'lar\u0131 m\xFC\u015Fterileri uygulama i\xE7i sat\u0131n alma d\u0131\u015F\u0131ndaki sat\u0131n alma mekanizmalar\u0131na y\xF6nlendiren d\xFC\u011Fme, d\u0131\u015F ba\u011Flant\u0131 ya da \xE7a\u011Fr\u0131 i\xE7eremez. Entitlement ile ilgili yan\u0131lt\u0131c\u0131 pazarlama, doland\u0131r\u0131c\u0131l\u0131k ya da sahtek\xE2rl\u0131k uygulaman\u0131n kald\u0131r\u0131lmas\u0131yla sonu\xE7lan\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.2-paywall-price-visibility",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#subscriptions",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "subscriptions",
          "paywall",
          "pricing",
          "vision"
        ],
        "scope": "cross",
        "needs": [
          "screenshots",
          "iap"
        ],
        "appliesWhen": {
          "hasSubscription": true
        },
        "requiresVision": true,
        "question": "Paywall ekran g\xF6r\xFCnt\xFCs\xFCnde abonelik F\u0130YATI ve D\xD6NEM\u0130 (haftal\u0131k/ayl\u0131k/y\u0131ll\u0131k) birlikte, okunabilir bi\xE7imde g\xF6r\xFCn\xFCyor mu? Ayr\u0131ca ekranda g\xF6r\xFCnen fiyat, sana verilen abonelik paketlerinin fiyatlar\u0131yla uyu\u015Fuyor mu? Fiyat hi\xE7 g\xF6r\xFCnm\xFCyorsa ya da d\xF6nem belirtilmemi\u015Fse bildir. Ekranda g\xF6r\xFCnen fiyat tan\u0131ml\u0131 paketlerden farkl\u0131ysa ayr\u0131ca bildir.\n",
        "ruleText": "Abonelik sat\u0131n alma ekran\u0131nda fiyat ve abonelik d\xF6nemi kullan\u0131c\u0131ya a\xE7\u0131k\xE7a g\xF6sterilmelidir; g\xF6sterilen fiyat ger\xE7ek fiyatla ayn\u0131 olmal\u0131d\u0131r.\n",
        "positiveExample": "Paywall'da yaln\u0131zca 'Start Free Trial' yaz\u0131yor, fiyat ve d\xF6nem hi\xE7 g\xF6r\xFCnm\xFCyor.",
        "negativeExample": "Paywall'da '$9.99 / week, auto-renews' a\xE7\u0131k\xE7a yaz\u0131yor.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.2-paywall-terms-links",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#subscriptions",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "subscriptions",
          "paywall",
          "vision"
        ],
        "scope": "cross",
        "needs": [
          "screenshots",
          "iap"
        ],
        "appliesWhen": {
          "hasSubscription": true
        },
        "requiresVision": true,
        "facts": [
          "Apple, abonelik sat\u0131n alma ekran\u0131nda Kullan\u0131m \u015Eartlar\u0131 (EULA/Terms of Use) ve Gizlilik Politikas\u0131 ba\u011Flant\u0131lar\u0131n\u0131n G\xD6R\xDCN\xDCR olmas\u0131n\u0131 \u015Fart ko\u015Far.",
          "Bu ba\u011Flant\u0131lar ekran\u0131n alt\u0131nda k\xFC\xE7\xFCk punto ile yer alabilir; varl\u0131klar\u0131 yeterlidir."
        ],
        "question": 'Ekran g\xF6r\xFCnt\xFCleri aras\u0131nda bir abonelik/sat\u0131n alma (paywall) ekran\u0131 var m\u0131? Varsa, o ekranda "Terms of Use", "Terms", "EULA" veya "Privacy Policy" ba\u011Flant\u0131lar\u0131 g\xF6r\xFCn\xFCyor mu? Hi\xE7biri g\xF6r\xFCnm\xFCyorsa bunu bildir. Paywall ekran\u0131 hi\xE7 yoksa bulgu \xFCretme.\n',
        "ruleText": "Otomatik yenilenen abonelik sat\u0131n alma ekran\u0131nda Kullan\u0131m \u015Eartlar\u0131 ve Gizlilik Politikas\u0131 ba\u011Flant\u0131lar\u0131 kullan\u0131c\u0131ya g\xF6r\xFCn\xFCr olmal\u0131d\u0131r.\n",
        "positiveExample": "Paywall ekran\u0131nda yaln\u0131zca 'Continue' d\xFC\u011Fmesi ve fiyat var; \u015Fart/gizlilik ba\u011Flant\u0131s\u0131 yok.",
        "negativeExample": "Paywall ekran\u0131n\u0131n alt\u0131nda 'Terms of Use \xB7 Privacy Policy \xB7 Restore' sat\u0131r\u0131 g\xF6r\xFCn\xFCyor.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.2-subscription-disclosure",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#subscriptions",
          "retrievedAt": "2026-08-18"
        },
        "tags": [
          "subscriptions",
          "monetization"
        ],
        "scope": "cross",
        "needs": [
          "description",
          "promotionalText",
          "subtitle",
          "iap",
          "screenshots"
        ],
        "appliesWhen": {
          "hasSubscription": true
        },
        "question": 'Listing (metin + ekran g\xF6r\xFCnt\xFCleri) otomatik yenilenen bir abonelik ima ediyor mu? Ediyorsa \u015Fu d\xF6rd\xFC de a\xE7\u0131k\xE7a belirtilmi\u015F mi: (1) abonelik d\xF6nemi (haftal\u0131k/ayl\u0131k/y\u0131ll\u0131k), (2) o d\xF6nemin fiyat\u0131, (3) otomatik yenilenece\u011Fi, (4) kullan\u0131m \u015Fartlar\u0131 ve gizlilik politikas\u0131 eri\u015Fimi.\nTEK BULGU \xDCRET. Eksik olan maddeleri o tek bulgunun gerek\xE7esinde say ("d\xF6nem ve fiyat yaz\u0131lmam\u0131\u015F, otomatik yenileme belirtilmemi\u015F"). \xDCR\xDCN BA\u015EINA AYRI BULGU \xDCRETME: eksiklik listing metnindedir, \xFCr\xFCnlerde de\u011Fil. Sekiz abonelik i\xE7in sekiz bulgu yazmak tek sorunu sekiz kez sayd\u0131r\u0131r, raporu okunmaz yapar ve d\xFCzeltilecek \u015Fey yine tek bir metindir.\nAyr\u0131 bir bulgu YALNIZCA \u015Funun i\xE7in \xFCretilir: metinde/g\xF6rselde ge\xE7en bir fiyat, verilen abonelik paketlerinin fiyat\u0131yla \xC7EL\u0130\u015E\u0130YORSA.\n',
        "ruleText": "Otomatik yenilenen abonelik satan uygulamalar; abonelik s\xFCresini, d\xF6nem ba\u015F\u0131na fiyat\u0131 ve otomatik yenileme ko\u015Fulunu kullan\u0131c\u0131ya sat\u0131n alma \xF6ncesi net bi\xE7imde g\xF6stermelidir. Kullan\u0131m \u015Fartlar\u0131 ve gizlilik politikas\u0131 eri\u015Filebilir olmal\u0131d\u0131r.\n",
        "positiveExample": "Start your 3-day free trial today. Only $9.99.",
        "negativeExample": "Glamio Pro \u2014 $9.99/week, auto-renews weekly. Cancel anytime in Settings. Terms: glamio.com/terms",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 2
      },
      {
        "id": "apple-3.1.2a-subscription-value",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.2(a)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.2(a)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "subscriptions",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasSubscription": true
        },
        "question": "Abonelikte: (1) kullan\u0131c\u0131ya S\xDCREKL\u0130 de\u011Fer sunuluyor mu (tek seferlik bir kilidi a\xE7\u0131p bitmiyor), (2) abonelik kullan\u0131c\u0131n\u0131n uygulaman\u0131n bulundu\u011Fu t\xFCm cihazlar\u0131nda \xE7al\u0131\u015F\u0131yor mu, (3) kullan\u0131c\u0131 \xF6dedi\u011Fi \u015Feye ula\u015Fmak i\xE7in ek g\xF6rev yapmak zorunda m\u0131 (sosyal medyada payla\u015Fma, ki\u015Fi listesi y\xFCkleme, g\xFCnl\xFCk giri\u015F gibi \u2014 bunlar yasak), (4) mevcut kullan\u0131c\u0131lar\u0131n daha \xF6nce sat\u0131n ald\u0131\u011F\u0131 temel i\u015Flev abonelik modeline ge\xE7erken elinden al\u0131n\u0131yor mu?\n",
        "ruleText": "Otomatik yenilenen abonelik s\xFCrekli de\u011Fer sunmal\u0131 ve kullan\u0131c\u0131n\u0131n t\xFCm cihazlar\u0131nda \xE7al\u0131\u015Fmal\u0131d\u0131r. Abonelik sunan uygulamalar, kullan\u0131c\u0131n\u0131n \xF6dedi\u011Fi \u015Feye sosyal medyada payla\u015F\u0131m yapmak, ki\u015Fi y\xFCklemek ya da uygulamaya belirli say\u0131da giri\u015F yapmak gibi ek g\xF6revler olmadan ula\u015Fmas\u0131na izin vermelidir. Mevcut uygulaman\u0131 abonelik modeline \xE7eviriyorsan, kullan\u0131c\u0131lar\u0131n halihaz\u0131rda sat\u0131n ald\u0131\u011F\u0131 temel i\u015Flevi ellerinden almamal\u0131s\u0131n.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.2b-upgrade-downgrade",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.2(b)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.2(b)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "subscriptions",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasSubscription": true
        },
        "question": "Kullan\u0131c\u0131 abonelik y\xFCkseltme ve d\xFC\u015F\xFCrme i\u015Flemini sorunsuz yapabiliyor mu? Ayn\u0131 \u015Feyin farkl\u0131 varyasyonlar\u0131na yanl\u0131\u015Fl\u0131kla ayn\u0131 anda abone olmak m\xFCmk\xFCn m\xFC (\xF6r. hem ayl\u0131k hem y\u0131ll\u0131k plana birden)?\n",
        "ruleText": "Kullan\u0131c\u0131lar sorunsuz bir y\xFCkseltme/d\xFC\u015F\xFCrme deneyimi ya\u015Famal\u0131 ve ayn\u0131 \u015Feyin birden fazla varyasyonuna yanl\u0131\u015Fl\u0131kla abone olamamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.2c-subscription-information",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.2(c)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.2(c)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "subscriptions",
          "disclosure",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasSubscription": true
        },
        "question": "Abone olmay\u0131 istemeden \xD6NCE kullan\u0131c\u0131 ne ald\u0131\u011F\u0131n\u0131 net olarak biliyor mu: fiyat kar\u015F\u0131l\u0131\u011F\u0131nda tam olarak ne verildi\u011Fi (ayda ka\xE7 say\u0131, ne kadar bulut alan\u0131, hizmete nas\u0131l bir eri\u015Fim)? Bu bilgi paywall ekran\u0131nda m\u0131, yoksa yaln\u0131z ma\u011Faza a\xE7\u0131klamas\u0131nda m\u0131 duruyor?\n",
        "ruleText": "Bir m\xFC\u015Fteriden abone olmas\u0131n\u0131 istemeden \xF6nce, \xF6deyece\u011Fi fiyat kar\u015F\u0131l\u0131\u011F\u0131nda ne alaca\u011F\u0131n\u0131 a\xE7\u0131k\xE7a anlatmal\u0131s\u0131n: ayda ka\xE7 say\u0131, ne kadar bulut depolama, hizmetine ne t\xFCr bir eri\u015Fim. Apple Developer Program Lisans S\xF6zle\u015Fmesi Ek 2'deki gereklilikleri de a\xE7\u0131k\xE7a iletti\u011Finden emin ol.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.3a-reader-apps",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.3(a)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(a)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "reader",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "magazine",
          "newspaper",
          "books",
          "audiobook",
          "music",
          "video",
          "streaming",
          "reader",
          "subscription content"
        ],
        "question": `Uygulama bir "reader" uygulamas\u0131 m\u0131 (dergi, gazete, kitap, ses, m\xFCzik, video i\xE7eri\u011Fine eri\u015Fim)? \xD6yleyse: (1) yaln\u0131zca daha \xF6nce sat\u0131n al\u0131nm\u0131\u015F i\xE7eri\u011Fe ya da i\xE7erik aboneli\u011Fine eri\u015Fim mi sunuluyor, (2) \xFCcretsiz katman i\xE7in hesap olu\u015Fturma ve mevcut m\xFC\u015Fteriler i\xE7in hesap y\xF6netimi d\u0131\u015F\u0131nda uygulama i\xE7inde sat\u0131n alma yap\u0131l\u0131yor mu, (3) hesap olu\u015Fturma/y\xF6netme ba\u011Flant\u0131s\u0131 veriyorsan External Link Account Entitlement'\u0131n var m\u0131? (ABD vitrininde bu entitlement gerekmiyor.)
`,
        "ruleText": "Reader uygulamalar\u0131 kullan\u0131c\u0131n\u0131n daha \xF6nce sat\u0131n ald\u0131\u011F\u0131 i\xE7eri\u011Fe ya da i\xE7erik aboneliklerine (dergi, gazete, kitap, ses, m\xFCzik, video) eri\u015Fmesine izin verebilir. \xDCcretsiz katmanlar i\xE7in hesap olu\u015Fturma ve mevcut m\xFC\u015Fteriler i\xE7in hesap y\xF6netimi sunulabilir. Geli\u015Ftiriciler, hesap olu\u015Fturmak veya y\xF6netmek \xFCzere kendi sitelerine bilgilendirici bir ba\u011Flant\u0131 vermek i\xE7in External Link Account Entitlement ba\u015Fvurusu yapabilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.3b-multiplatform",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.3(b)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(b)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "web version",
          "desktop",
          "cross-platform",
          "multiplatform",
          "pc",
          "console",
          "also on the web"
        ],
        "question": "Kullan\u0131c\u0131 ba\u015Fka platformda (web, PC, konsol) edindi\u011Fi i\xE7eri\u011Fe, aboneli\u011Fe ya da \xF6zelli\u011Fe uygulamada eri\u015Febiliyor mu? Eri\u015Febiliyorsa, ayn\u0131 \xF6\u011Feler uygulama \u0130\xC7\u0130NDE de uygulama i\xE7i sat\u0131n alma olarak sunuluyor mu? \xC7ok platformlu oyunlardaki t\xFCketilebilir \xF6\u011Feler de bu \u015Farta tabi.\n",
        "ruleText": "Birden fazla platformda \xE7al\u0131\u015Fan uygulamalar, kullan\u0131c\u0131lar\u0131n ba\u015Fka platformlarda ya da web sitende edindikleri i\xE7eri\u011Fe, aboneliklere veya \xF6zelliklere \u2014 \xE7ok platformlu oyunlardaki t\xFCketilebilir \xF6\u011Feler d\xE2hil \u2014 eri\u015Fmesine izin verebilir; yeter ki bu \xF6\u011Feler uygulama i\xE7inde de uygulama i\xE7i sat\u0131n alma olarak sunuluyor olsun.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.3c-enterprise-services",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.3(c)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(c)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "enterprise",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "enterprise",
          "organization",
          "organizations",
          "school",
          "classroom",
          "employees",
          "students",
          "b2b",
          "teams"
        ],
        "question": "Uygulama yaln\u0131zca kurumlara/gruplara (\xE7al\u0131\u015Fanlar\u0131 ya da \xF6\u011Frencileri i\xE7in) do\u011Frudan senin taraf\u0131ndan m\u0131 sat\u0131l\u0131yor? \xD6yleyse kurumsal kullan\u0131c\u0131lar\u0131n daha \xF6nce sat\u0131n al\u0131nm\u0131\u015F i\xE7eri\u011Fe eri\u015Fmesine izin verilebilir. Bireysel, tek kullan\u0131c\u0131l\u0131 ya da aile sat\u0131\u015Flar\u0131 uygulama i\xE7i sat\u0131n alma kullanmak zorunda \u2014 uygulamada b\xF6yle bir sat\u0131\u015F var m\u0131?\n",
        "ruleText": "Uygulaman yaln\u0131zca kurumlara ya da gruplara, \xE7al\u0131\u015Fanlar\u0131 veya \xF6\u011Frencileri i\xE7in do\u011Frudan senin taraf\u0131ndan sat\u0131l\u0131yorsa (\xF6r. profesyonel veritabanlar\u0131, s\u0131n\u0131f y\xF6netim ara\xE7lar\u0131), kurumsal kullan\u0131c\u0131lar\u0131n daha \xF6nce sat\u0131n al\u0131nm\u0131\u015F i\xE7eri\u011Fe veya aboneliklere eri\u015Fmesine izin verebilirsin. T\xFCketiciye, tek kullan\u0131c\u0131ya ya da aileye yap\u0131lan sat\u0131\u015Flar uygulama i\xE7i sat\u0131n alma kullanmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.3d-person-to-person",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.3(d)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(d)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "tutor",
          "tutoring",
          "consultation",
          "coaching",
          "lesson",
          "training",
          "session",
          "appointment",
          "booking",
          "therapist"
        ],
        "question": "Uygulama iki ki\u015Fi aras\u0131nda GER\xC7EK ZAMANLI birebir hizmet sat\u0131\u015F\u0131 sa\u011Fl\u0131yorsa (\xF6zel ders, t\u0131bbi dan\u0131\u015Fma, emlak turu, ki\u015Fisel antrenman) uygulama i\xE7i sat\u0131n alma d\u0131\u015F\u0131nda \xF6deme alabilirsin. Ancak bire-birka\xE7 ya da bire-\xE7ok ger\xE7ek zamanl\u0131 hizmetler (grup dersi, webinar) uygulama i\xE7i sat\u0131n alma kullanmak zorunda \u2014 uygulamadaki hizmet hangisi?\n",
        "ruleText": "Uygulaman iki birey aras\u0131nda ger\xE7ek zamanl\u0131, ki\u015Fiden ki\u015Fiye hizmet sat\u0131n al\u0131nmas\u0131n\u0131 sa\u011Fl\u0131yorsa (\xF6\u011Frenciye \xF6zel ders, t\u0131bbi dan\u0131\u015Fma, emlak turu, ki\u015Fisel antrenman) bu \xF6demeleri toplamak i\xE7in uygulama i\xE7i sat\u0131n alma d\u0131\u015F\u0131ndaki \xF6deme y\xF6ntemlerini kullanabilirsin. Bire-birka\xE7 ve bire-\xE7ok ger\xE7ek zamanl\u0131 hizmetler uygulama i\xE7i sat\u0131n alma kullanmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.3e-physical-goods",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.3(e)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(e)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "sellsPhysicalGoodsOrServices": true
        },
        "question": "Fiziksel mal ya da uygulama d\u0131\u015F\u0131nda t\xFCketilen hizmet satan uygulamada \xF6deme uygulama i\xE7i sat\u0131n alma DI\u015EINDA m\u0131 toplan\u0131yor (Apple Pay ya da kredi kart\u0131)? Bu sat\u0131\u015Flar i\xE7in IAP kullanmak da ihlaldir \u2014 kullan\u0131l\u0131yorsa bildir.\n",
        "ruleText": "Uygulaman insanlar\u0131n uygulama d\u0131\u015F\u0131nda t\xFCketilecek fiziksel mal veya hizmet sat\u0131n almas\u0131n\u0131 sa\u011Fl\u0131yorsa, bu \xF6demeleri toplamak i\xE7in Apple Pay ya da geleneksel kredi kart\u0131 giri\u015Fi gibi uygulama i\xE7i sat\u0131n alma d\u0131\u015F\u0131ndaki y\xF6ntemleri kullanmak ZORUNDASIN.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.1.3f-free-companion",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.3(f)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(f)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "companion",
          "cloud storage",
          "voip",
          "hosting",
          "web app",
          "existing account"
        ],
        "question": "Uygulama, \xFCcretli bir web tabanl\u0131 arac\u0131n (VoIP, bulut depolama, e-posta, web hosting) \xFCcretsiz yard\u0131mc\u0131 uygulamas\u0131 m\u0131? \xD6yleyse uygulaman\u0131n \u0130\xC7\u0130NDE hi\xE7bir sat\u0131n alma ve d\u0131\u015Far\u0131da sat\u0131n almaya y\xF6nelik hi\xE7bir \xE7a\u011Fr\u0131 bulunmamal\u0131 \u2014 var m\u0131?\n",
        "ruleText": "\xDCcretli, web tabanl\u0131 bir arac\u0131n (VoIP, bulut depolama, e-posta hizmetleri, web hosting) ba\u011F\u0131ms\u0131z yard\u0131mc\u0131s\u0131 olan \xFCcretsiz uygulamalar, uygulama i\xE7inde hi\xE7bir sat\u0131n alma ve uygulama d\u0131\u015F\u0131nda sat\u0131n almaya y\xF6nelik hi\xE7bir \xE7a\u011Fr\u0131 bulunmamas\u0131 ko\u015Fuluyla uygulama i\xE7i sat\u0131n alma kullanmak zorunda de\u011Fildir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.3g-advertising-management",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.3(g)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(g)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "ads",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "advertiser",
          "advertisers",
          "campaign",
          "ad manager",
          "boost",
          "promote your post"
        ],
        "question": 'Uygulama yaln\u0131zca reklam verenlerin kampanya sat\u0131n al\u0131p y\xF6netmesi i\xE7in mi? \xD6yleyse uygulama i\xE7i sat\u0131n alma gerekmez \u2014 ama uygulama reklamlar\u0131n KEND\u0130S\u0130N\u0130 g\xF6stermemeli. Ayn\u0131 uygulama i\xE7inde t\xFCketilecek dijital sat\u0131n almalar (\xF6r. sosyal uygulamada g\xF6nderi "boost"u) uygulama i\xE7i sat\u0131n alma kullanmak zorunda.\n',
        "ruleText": 'Yaln\u0131zca reklam verenlerin \xE7e\u015Fitli mecralarda reklam kampanyas\u0131 sat\u0131n al\u0131p y\xF6netmesini sa\u011Flayan uygulamalar uygulama i\xE7i sat\u0131n alma kullanmak zorunda de\u011Fildir. Bu uygulamalar kampanya y\xF6netimi i\xE7indir ve reklamlar\u0131n kendisini g\xF6stermez. Bir uygulamada deneyimlenen ya da t\xFCketilen i\xE7erik i\xE7in yap\u0131lan dijital sat\u0131n almalar \u2014 ayn\u0131 uygulamada g\xF6sterilecek reklam sat\u0131n almak, \xF6r. g\xF6nderi "boost"lar\u0131 d\xE2hil \u2014 uygulama i\xE7i sat\u0131n alma kullanmal\u0131d\u0131r.\n',
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.4-hardware-specific-content",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "hardware",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "unlocksContentWithoutIap": true
        },
        "question": "\u0130\u015Flev bir donan\u0131ma ba\u011Fl\u0131 olarak a\xE7\u0131l\u0131yorsa: (1) bu ger\xE7ekten donan\u0131ma ba\u011Fl\u0131 bir \xF6zellik mi (\xF6r. teleskopla e\u015Fle\u015Fince a\xE7\u0131lan g\xF6kbilim \xF6zellikleri), (2) onayl\u0131 bir fiziksel \xFCr\xFCnle iste\u011Fe ba\u011Fl\u0131 \xE7al\u0131\u015Fan \xF6zellikler i\xE7in AYRICA bir uygulama i\xE7i sat\u0131n alma se\xE7ene\u011Fi de sunuluyor mu, (3) i\u015Flevi a\xE7mak i\xE7in kullan\u0131c\u0131dan ilgisiz \xFCr\xFCn sat\u0131n almas\u0131 ya da pazarlama etkinli\u011Fine kat\u0131lmas\u0131 isteniyor mu (yasak)?\n",
        "ruleText": "S\u0131n\u0131rl\u0131 durumlarda, \xF6zellikler \xE7al\u0131\u015Fmak i\xE7in belirli bir donan\u0131ma ba\u011Fl\u0131ysa uygulama o i\u015Flevi uygulama i\xE7i sat\u0131n alma kullanmadan a\xE7abilir. Onayl\u0131 bir fiziksel \xFCr\xFCnle (\xF6r. oyuncak) iste\u011Fe ba\u011Fl\u0131 olarak \xE7al\u0131\u015Fan \xF6zellikler, bir uygulama i\xE7i sat\u0131n alma se\xE7ene\u011Fi de sunulmas\u0131 ko\u015Fuluyla a\xE7\u0131labilir. Ancak uygulama i\u015Flevini a\xE7mak i\xE7in kullan\u0131c\u0131lardan ilgisiz \xFCr\xFCnler sat\u0131n almas\u0131n\u0131 ya da reklam/pazarlama etkinliklerine kat\u0131lmas\u0131n\u0131 isteyemezsin.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.1.5-cryptocurrencies",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.1.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "crypto",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "crypto",
          "cryptocurrency",
          "bitcoin",
          "ethereum",
          "wallet",
          "exchange",
          "mining",
          "ico",
          "blockchain",
          "token",
          "airdrop"
        ],
        "question": "Kripto para i\u015Flevi varsa Apple'\u0131n be\u015F alt kural\u0131: (i) c\xFCzdan sunuyorsan geli\u015Ftirici hesab\u0131n ORGAN\u0130ZASYON olarak kay\u0131tl\u0131 m\u0131, (ii) cihazda madencilik yap\u0131lm\u0131yor (yaln\u0131z cihaz d\u0131\u015F\u0131/bulut madencilik serbest), (iii) al\u0131m sat\u0131m yaln\u0131zca onayl\u0131 bir borsada ve yaln\u0131zca lisans/izinlerin oldu\u011Fu \xFClkelerde mi sunuluyor, (iv) ICO, kripto vadeli i\u015Flem ya da kripto menkul k\u0131ymet i\u015Flemi varsa uygulama bir banka, arac\u0131 kurum ya da onayl\u0131 finansal kurumdan m\u0131 geliyor, (v) uygulama indirme, davet, sosyal payla\u015F\u0131m gibi g\xF6revler kar\u015F\u0131l\u0131\u011F\u0131nda kripto para VER\u0130YOR mu (yasak)?\n",
        "ruleText": "(i) C\xFCzdanlar: uygulamalar sanal para depolamay\u0131 kolayla\u015Ft\u0131rabilir, yeter ki organizasyon olarak kay\u0131tl\u0131 geli\u015Ftiriciler taraf\u0131ndan sunulsun. (ii) Madencilik: i\u015Flem cihaz d\u0131\u015F\u0131nda yap\u0131lmad\u0131k\xE7a kripto madencili\u011Fi yap\u0131lamaz. (iii) Borsalar: onayl\u0131 bir borsada kripto i\u015Flemleri yaln\u0131zca uygun lisans ve izinlerin oldu\u011Fu \xFClke veya b\xF6lgelerde kolayla\u015Ft\u0131r\u0131labilir. (iv) ICO'lar, kripto vadeli i\u015Flemler ve di\u011Fer kripto menkul k\u0131ymet i\u015Flemleri yerle\u015Fik bankalardan, menkul k\u0131ymet firmalar\u0131ndan, FCM'lerden ya da onayl\u0131 finansal kurumlardan gelmeli ve t\xFCm ilgili yasalara uymal\u0131d\u0131r. (v) Kripto para uygulamalar\u0131, ba\u015Fka uygulamalar\u0131 indirmek, ba\u015Fkalar\u0131n\u0131 indirmeye te\u015Fvik etmek ya da sosyal a\u011Flarda payla\u015F\u0131m yapmak gibi g\xF6revlerin kar\u015F\u0131l\u0131\u011F\u0131nda para birimi teklif edemez.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.2.1vi-nonprofit-fundraising",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "donations",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "donate",
          "donation",
          "donations",
          "charity",
          "fundraise",
          "fundraising",
          "nonprofit",
          "ba\u011F\u0131\u015F"
        ],
        "question": "Uygulama i\xE7inde ba\u011F\u0131\u015F topluyorsan: (1) Apple'\u0131n onaylad\u0131\u011F\u0131 bir k\xE2r amac\u0131 g\xFCtmeyen kurulu\u015F musun, (2) Apple Pay deste\u011Fi var m\u0131, (3) toplanan paran\u0131n nas\u0131l kullan\u0131laca\u011F\u0131 a\xE7\u0131klan\u0131yor mu, (4) ba\u011F\u0131\u015F\xE7\u0131lara uygun vergi makbuzu sa\u011Flan\u0131yor mu, (5) ba\u015Fka kurulu\u015Flara ba\u011F\u0131\u015F aktaran bir platformsan listelenen her kurulu\u015F da onay s\xFCrecinden ge\xE7ti mi? Onayl\u0131 kurulu\u015F DE\u011E\u0130LSEN uygulama i\xE7inde ba\u011F\u0131\u015F toplayamazs\u0131n: uygulama \xFCcretsiz olmal\u0131 ve ba\u011F\u0131\u015F yaln\u0131zca uygulama d\u0131\u015F\u0131nda (Safari, SMS) toplanmal\u0131.\n",
        "ruleText": "Onayl\u0131 k\xE2r amac\u0131 g\xFCtmeyen kurulu\u015Flar kendi uygulamalar\u0131nda ya da \xFC\xE7\xFCnc\xFC taraf uygulamalarda do\u011Frudan ba\u011F\u0131\u015F toplayabilir; bu kampanyalar t\xFCm App Review kurallar\u0131na uymal\u0131 ve Apple Pay desteklemelidir. Bu uygulamalar fonlar\u0131n nas\u0131l kullan\u0131laca\u011F\u0131n\u0131 a\xE7\u0131klamal\u0131, t\xFCm yerel ve federal yasalara uymal\u0131 ve ba\u011F\u0131\u015F\xE7\u0131lara uygun vergi makbuzlar\u0131n\u0131n sunulmas\u0131n\u0131 sa\u011Flamal\u0131d\u0131r. Onayl\u0131 k\xE2r amac\u0131 g\xFCtmeyen kurulu\u015F de\u011Filsen, uygulama i\xE7inde hay\u0131r kurumlar\u0131 ve ba\u011F\u0131\u015F kampanyalar\u0131 i\xE7in fon toplayamazs\u0131n; bu t\xFCr uygulamalar App Store'da \xFCcretsiz olmal\u0131 ve fonlar\u0131 yaln\u0131zca Safari veya SMS gibi uygulama d\u0131\u015F\u0131 yollarla toplayabilir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.2.1vii-personal-gifts",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "payments",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "tip",
          "tips",
          "tipping",
          "gift",
          "send money",
          "support the creator",
          "bah\u015Fi\u015F"
        ],
        "question": "Kullan\u0131c\u0131lar\u0131n birbirine para hediye etmesi ya da bah\u015Fi\u015F g\xF6ndermesi varsa: (1) hediye tamamen g\xF6nderenin iste\u011Fine mi ba\u011Fl\u0131, (2) paran\u0131n %100'\xFC al\u0131c\u0131ya m\u0131 gidiyor? Hediye herhangi bir anda dijital i\xE7erik veya hizmet almaya ba\u011Flan\u0131yorsa uygulama i\xE7i sat\u0131n alma kullanmak ZORUNLU.\n",
        "ruleText": "Uygulamalar, bireysel kullan\u0131c\u0131lar\u0131n ba\u015Fka bir bireye uygulama i\xE7i sat\u0131n alma kullanmadan parasal hediye vermesini sa\u011Flayabilir; yeter ki (a) hediye tamamen verenin iste\u011Fine ba\u011Fl\u0131 bir se\xE7im olsun ve (b) fonlar\u0131n %100'\xFC hediyenin al\u0131c\u0131s\u0131na gitsin. Ancak herhangi bir anda dijital i\xE7erik veya hizmet almaya ba\u011Flanan bir hediye uygulama i\xE7i sat\u0131n alma kullanmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.2.1viii-financial-services",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "finance",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "trading",
          "invest",
          "investment",
          "broker",
          "stocks",
          "forex",
          "portfolio",
          "banking",
          "wealth",
          "money management"
        ],
        "question": "Finansal i\u015Flem, yat\u0131r\u0131m ya da para y\xF6netimi hizmeti sunan uygulama, bu hizmeti VEREN finansal kurum taraf\u0131ndan m\u0131 g\xF6nderiliyor? Uygulaman\u0131n sunuldu\u011Fu t\xFCm \xFClkelerde gerekli lisans ve izinler var m\u0131? (5.1.1(ix) ayr\u0131ca bu t\xFCr d\xFCzenlemeye tabi hizmetlerin bireysel geli\u015Ftirici hesab\u0131yla g\xF6nderilmemesini istiyor.)\n",
        "ruleText": "Finansal i\u015Flem, yat\u0131r\u0131m veya para y\xF6netimi i\xE7in kullan\u0131lan uygulamalar, bu hizmetleri veren finansal kurum taraf\u0131ndan g\xF6nderilmeli ve uygulamay\u0131 sundu\u011Fun yerlerde gerekli lisans ve izinlere sahip olmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.2.2i-app-catalog",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "app store",
          "best apps",
          "app collection",
          "app directory",
          "top apps",
          "app catalog"
        ],
        "question": "Uygulama, \xFC\xE7\xFCnc\xFC taraf uygulamalar\u0131, uzant\u0131lar\u0131 ya da eklentileri App Store benzeri bir aray\xFCzde veya genel ama\xE7l\u0131 bir koleksiyon olarak g\xF6steriyor mu? Bu yasak. Belirli ve onayl\u0131 bir ihtiyaca y\xF6nelik (sa\u011Fl\u0131k y\xF6netimi, havac\u0131l\u0131k, eri\u015Filebilirlik) ve g\xFC\xE7l\xFC editoryal i\xE7erik sunan derlemeler 3.2.1(ii) kapsam\u0131nda kabul edilebilir \u2014 uygulama hangisi?\n",
        "ruleText": "\xDC\xE7\xFCnc\xFC taraf uygulamalar\u0131, uzant\u0131lar\u0131 ya da eklentileri App Store'a benzer bi\xE7imde veya genel ama\xE7l\u0131 bir koleksiyon olarak g\xF6steren bir aray\xFCz olu\u015Fturmak kabul edilemez. Belirli ve onayl\u0131 bir ihtiyaca y\xF6nelik \xFC\xE7\xFCnc\xFC taraf uygulama derlemeleri, uygulaman s\u0131rf bir vitrin gibi g\xF6r\xFCnmeyecek kadar g\xFC\xE7l\xFC editoryal i\xE7erik sunuyorsa kabul edilebilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.2.2iii-ad-heavy-app",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "ads",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "showsAds": true
        },
        "question": "Uygulama a\u011F\u0131rl\u0131kl\u0131 olarak reklam g\xF6stermek i\xE7in mi tasarlanm\u0131\u015F? Reklam g\xF6sterimi ya da t\u0131klamas\u0131 yapay olarak art\u0131r\u0131l\u0131yor mu (otomatik t\u0131klama, kullan\u0131c\u0131y\u0131 kand\u0131ran yerle\u015Fim, reklam\u0131 i\xE7erik gibi g\xF6sterme)? Reklam yo\u011Funlu\u011Fu uygulaman\u0131n kendi i\u015Flevini g\xF6lgeliyorsa bu maddeye girer.\n",
        "ruleText": "Reklam g\xF6sterimlerinin ya da t\u0131klamalar\u0131n\u0131n yapay olarak art\u0131r\u0131lmas\u0131 ve a\u011F\u0131rl\u0131kl\u0131 olarak reklam g\xF6stermek i\xE7in tasarlanm\u0131\u015F uygulamalar kabul edilemez.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-3.2.2ix-loan-terms",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "finance",
          "disclosure"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText"
        ],
        "prefilter": [
          "loan",
          "loans",
          "lending",
          "credit",
          "apr",
          "borrow",
          "borrowing",
          "installment",
          "cash advance",
          "payday",
          "cash in minutes",
          "repay",
          "repayment",
          "interest rate",
          "instant cash",
          "get cash",
          "finance",
          "financing"
        ],
        "question": "Uygulama ki\u015Fisel kredi sunuyorsa metin, kredi ko\u015Fullar\u0131n\u0131 a\xE7\u0131k ve g\xF6ze \xE7arpar bi\xE7imde veriyor mu: e\u015Fde\u011Fer azami y\u0131ll\u0131k maliyet oran\u0131 (APR) ve \xF6deme tarihi? Ayr\u0131ca azami APR %36'y\u0131 a\u015F\u0131yor mu ya da geri \xF6deme 60 g\xFCn veya daha k\u0131sa s\xFCrede tam olarak isteniyor mu? Bunlardan biri varsa bildir.\n",
        "ruleText": "Ki\u015Fisel kredi sunan uygulamalar, e\u015Fde\u011Fer azami y\u0131ll\u0131k maliyet oran\u0131 (APR) ve \xF6deme tarihi d\xE2hil t\xFCm kredi ko\u015Fullar\u0131n\u0131 a\xE7\u0131k ve g\xF6ze \xE7arpar bi\xE7imde a\xE7\u0131klamal\u0131d\u0131r. Kredi uygulamalar\u0131, maliyet ve \xFCcretler d\xE2hil %36'dan y\xFCksek bir azami APR uygulayamaz ve 60 g\xFCn ya da daha k\u0131sa s\xFCrede tam geri \xF6deme talep edemez.\n",
        "positiveExample": "Get cash in minutes. Repay within 30 days. Fees apply.",
        "negativeExample": "Personal loans from 12 to 60 months. Max APR 29.9% including fees; see the schedule before you sign.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 2
      },
      {
        "id": "apple-3.2.2v-arbitrary-restrictions",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "only available in",
          "carrier",
          "operator",
          "region locked",
          "only for users in"
        ],
        "question": "Uygulamay\u0131 kimin kullanabilece\u011Fi keyf\xEE olarak k\u0131s\u0131tlan\u0131yor mu (konuma ya da operat\xF6re g\xF6re)? Yasal zorunluluk ya da lisans kaynakl\u0131 co\u011Frafi k\u0131s\u0131t bu maddenin konusu de\u011Fildir \u2014 5.3.4 ve 5.1.1(ix) baz\u0131 durumlarda co\u011Frafi k\u0131s\u0131t ZORUNLU k\u0131l\u0131yor.\n",
        "ruleText": "Uygulamay\u0131 kimin kullanabilece\u011Finin keyf\xEE bi\xE7imde k\u0131s\u0131tlanmas\u0131 \u2014 \xF6r. konuma ya da operat\xF6re g\xF6re \u2014 kabul edilemez.\n",
        "outcome": "manual",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-3.2.2vii-rank-manipulation",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "fraud"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "keywords"
        ],
        "prefilter": [
          "followers",
          "likes",
          "views",
          "subscribers",
          "boost your",
          "grow your account",
          "rank higher",
          "engagement"
        ],
        "question": "Uygulama, ba\u015Fka bir serviste kullan\u0131c\u0131n\u0131n g\xF6r\xFCn\xFCrl\xFC\u011F\xFCn\xFC, stat\xFCs\xFCn\xFC ya da s\u0131ralamas\u0131n\u0131 yapay olarak y\xFCkseltmeyi vaat ediyor mu (takip\xE7i, be\u011Feni, izlenme, abone sat\u0131n alma; s\u0131ralama y\xFCkseltme)? Bu, o servisin \u015Fartlar\u0131 a\xE7\u0131k\xE7a izin vermedi\u011Fi s\xFCrece yasak. Kendi i\xE7eri\u011Fini planlay\u0131p yay\u0131nlamaya yarayan ara\xE7lar ihlal de\u011Fildir.\n",
        "ruleText": "Bir kullan\u0131c\u0131n\u0131n ba\u015Fka servislerdeki g\xF6r\xFCn\xFCrl\xFC\u011F\xFCn\xFC, stat\xFCs\xFCn\xFC ya da s\u0131ralamas\u0131n\u0131 yapay olarak manip\xFCle etmek, o servisin \u015Fartlar\u0131 izin vermedi\u011Fi s\xFCrece kabul edilemez.\n",
        "positiveExample": "Buy real Instagram followers and likes \u2014 boost your rank overnight.",
        "negativeExample": "Schedule and publish your own posts to Instagram and X from one place.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.2.2viii-binary-options",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "finance"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText"
        ],
        "prefilter": [
          "binary option",
          "binary options",
          "cfd",
          "forex",
          "derivative",
          "leverage",
          "expiry",
          "trading signals"
        ],
        "question": "Uygulama ikili opsiyon (binary options) i\u015Flemi sunuyor mu? Bu App Store'da tamamen yasak. CFD ya da FOREX gibi t\xFCrev i\u015Flemleri sunuyorsa, hizmetin verildi\u011Fi t\xFCm yarg\u0131 alanlar\u0131nda lisansl\u0131 oldu\u011Funu g\xF6steren bir ifade var m\u0131?\n",
        "ruleText": "\u0130kili opsiyon i\u015Flemlerini kolayla\u015Ft\u0131ran uygulamalara App Store'da izin verilmez. Fark s\xF6zle\u015Fmeleri (CFD) ya da FOREX gibi di\u011Fer t\xFCrevlerde i\u015Flem yap\u0131lmas\u0131n\u0131 sa\u011Flayan uygulamalar, hizmetin sunuldu\u011Fu t\xFCm yarg\u0131 alanlar\u0131nda uygun lisansa sahip olmal\u0131d\u0131r.\n",
        "positiveExample": "Trade binary options with 60-second expiry and earn up to 90% profit.",
        "negativeExample": "Track your stock portfolio and set price alerts. No trading in the app.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-3.2.2x-forced-actions",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "3.2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "dark-patterns",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "rate us",
          "rate the app",
          "review us",
          "share to unlock",
          "invite friends to unlock",
          "watch an ad to unlock",
          "download to continue"
        ],
        "question": "Uygulama, i\u015Fleve ya da i\xE7eri\u011Fe eri\u015Fmek i\xE7in kullan\u0131c\u0131y\u0131 zorluyor mu: puan/yorum vermek, ba\u015Fka uygulama indirmek, ma\u011Fazayla ilgili ba\u015Fka bir eylem yapmak? Bunlar yasak. Uygulama i\xE7i eylemleri (seviye tamamlamak, reklam izlemek) TE\u015EV\u0130K etmek serbest \u2014 zorunlu k\u0131lmak de\u011Fil.\n",
        "ruleText": "Uygulamalar, i\u015Fleve, i\xE7eri\u011Fe ya da uygulaman\u0131n kullan\u0131m\u0131na eri\u015Fmek i\xE7in kullan\u0131c\u0131lar\u0131 uygulamay\u0131 puanlamaya, yorum yapmaya, ba\u015Fka uygulamalar indirmeye ya da ma\u011Fazayla ilgili ba\u015Fka eylemlere zorlayamaz. Uygulamalar kullan\u0131c\u0131lar\u0131 uygulama i\xE7indeki belirli eylemleri (bir seviyeyi tamamlamak, reklam izlemek) yapmaya ba\u015Fka bi\xE7imlerde te\u015Fvik edebilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.1-copycat",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "design",
          "ip",
          "metadata"
        ],
        "scope": "cross",
        "needs": [
          "name",
          "subtitle",
          "description",
          "keywords"
        ],
        "question": `Metin, ba\u015Fka bir uygulamay\u0131 ya da servisi taklit etti\u011Fini g\xF6steriyor mu: pop\xFCler bir uygulaman\u0131n ad\u0131n\u0131n k\xFC\xE7\xFCk bir varyasyonu, "X uygulamas\u0131n\u0131n alternatifi/klonu" ifadesi, ya da ba\u015Fka bir geli\u015Ftiricinin marka/\xFCr\xFCn ad\u0131n\u0131n uygulama ad\u0131nda kullan\u0131lmas\u0131? Kar\u015F\u0131la\u015Ft\u0131rma yapmak ("X'ten daha h\u0131zl\u0131") tek ba\u015F\u0131na ihlal de\u011Fildir; ihlal, kimli\u011Fi \xF6d\xFCn\xE7 almakt\u0131r.
`,
        "ruleText": "Ba\u015Fka bir uygulaman\u0131n ad\u0131nda ya da aray\xFCz\xFCnde k\xFC\xE7\xFCk de\u011Fi\u015Fiklikler yap\u0131p onu kendi uygulamanm\u0131\u015F gibi sunma. Ba\u015Fka uygulamalar\u0131 veya servisleri taklit eden uygulamalar Developer Code of Conduct ihlali say\u0131l\u0131r. Ba\u015Fka bir geli\u015Ftiricinin simgesini, markas\u0131n\u0131 ya da \xFCr\xFCn ad\u0131n\u0131, o geli\u015Ftiricinin onay\u0131 olmadan kendi uygulaman\u0131n simgesinde veya ad\u0131nda kullanamazs\u0131n.\n",
        "positiveExample": "WhatsApp Pro \u2014 the better WhatsApp, same look and feel.",
        "negativeExample": "A private messenger with end-to-end encryption and disappearing messages.",
        "outcome": "risk",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-4.10-monetizing-built-in-capabilities",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.10",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.10",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "business",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "icloud",
          "screen time",
          "push notification",
          "apple music",
          "camera access",
          "gyroscope"
        ],
        "question": "Uygulama, donan\u0131m\u0131n ya da i\u015Fletim sisteminin YERLE\u015E\u0130K yeteneklerini paraya \xE7eviriyor mu (push bildirimleri, kamera, jiroskop) ya da Apple servislerini ve teknolojilerini (Apple Music eri\u015Fimi, iCloud depolama, Screen Time API'leri) sat\u0131yor mu? Bunlar\u0131n kendisini \xFCcretlendirmek yasak.\n",
        "ruleText": "Donan\u0131m\u0131n veya i\u015Fletim sisteminin sa\u011Flad\u0131\u011F\u0131 yerle\u015Fik yetenekleri (Push Notifications, kamera, jiroskop gibi) ya da Apple servis ve teknolojilerini (Apple Music eri\u015Fimi, iCloud depolama, Screen Time API'leri gibi) paraya \xE7eviremezsin.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.2-minimum-functionality",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#design",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "checklist",
          "completeness"
        ],
        "scope": "single",
        "needs": [],
        "question": "Uygulama esasen web sitesinin bir sarmalay\u0131c\u0131s\u0131 m\u0131? Yerel i\u015Flev sunuyor mu (bildirim, \xE7evrimd\u0131\u015F\u0131, cihaz \xF6zellikleri)? Bir taray\u0131c\u0131da a\xE7maktan fark\u0131 ne? Bu, listing icerigine bakarak guvenilir sekilde yargilanamaz.\n",
        "ruleText": "Uygulamalar bir web sitesini paketlemekten fazlasini sunmali, yeterli yerel islevsellige sahip olmalidir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-4.2-webview-wrapper",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "design",
          "minimum-functionality",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "isWebViewWrapper": true
        },
        "question": `Uygulama esas olarak bir web sitesini g\xF6steriyorsa: sitenin \xF6tesine ge\xE7en hangi yerel de\u011Feri sunuyor (\xE7evrimd\u0131\u015F\u0131 \xE7al\u0131\u015Fma, bildirim, kamera/konum entegrasyonu, cihaz \xF6zellikleri, yerel aray\xFCz)? "Yeniden paketlenmi\u015F web sitesi"nin \xF6tesine ge\xE7ti\u011Fini g\xF6steren somut bir \xF6zellik yoksa bu g\xF6nderim 4.2'den reddedilir.
`,
        "ruleText": `Uygulaman, onu yeniden paketlenmi\u015F bir web sitesinin \xF6tesine ta\u015F\u0131yan \xF6zellikler, i\xE7erik ve aray\xFCz sunmal\u0131d\u0131r. Uygulaman \xF6zellikle yararl\u0131, \xF6zg\xFCn ya da "uygulama gibi" de\u011Filse App Store'a ait de\u011Fildir.
`,
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-4.2.1-arkit",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "design",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "ar ",
          "augmented reality",
          "arkit",
          "3d model",
          "ar view"
        ],
        "question": "ARKit kullan\u0131l\u0131yorsa deneyim zengin ve b\xFCt\xFCnle\u015Fik mi? Bir modeli AR g\xF6r\xFCn\xFCm\xFCne b\u0131rakmak ya da bir animasyonu oynatmak tek ba\u015F\u0131na yeterli de\u011Fil.\n",
        "ruleText": "ARKit kullanan uygulamalar zengin ve b\xFCt\xFCnle\u015Fik art\u0131r\u0131lm\u0131\u015F ger\xE7eklik deneyimleri sunmal\u0131d\u0131r; bir modeli AR g\xF6r\xFCn\xFCm\xFCne b\u0131rakmak veya animasyon oynatmak yeterli de\u011Fildir.\n",
        "outcome": "manual",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-4.2.2-not-marketing-material",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "design",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "links",
          "directory",
          "catalog",
          "aggregator",
          "rss",
          "feed",
          "news reader",
          "bookmark"
        ],
        "question": "Uygulama esasen pazarlama materyali, reklam, web k\u0131rp\u0131nt\u0131s\u0131, i\xE7erik toplay\u0131c\u0131 ya da ba\u011Flant\u0131 derlemesi mi? Katalog uygulamalar\u0131 istisna; di\u011Ferleri bu maddeden reddedilir.\n",
        "ruleText": "Kataloglar d\u0131\u015F\u0131nda uygulamalar esas olarak pazarlama materyali, reklam, web k\u0131rp\u0131nt\u0131s\u0131, i\xE7erik toplay\u0131c\u0131 ya da ba\u011Flant\u0131 koleksiyonu olmamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.2.3-standalone-and-downloads",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.2.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "design",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "(i) Uygulama ba\u015Fka bir uygulaman\u0131n kurulmas\u0131n\u0131 gerektirmeden kendi ba\u015F\u0131na \xE7al\u0131\u015F\u0131yor mu? (ii) \u0130lk a\xE7\u0131l\u0131\u015Fta \xE7al\u0131\u015Fabilmek i\xE7in ek kaynak indirmesi gerekiyorsa, indirmenin boyutu kullan\u0131c\u0131ya s\xF6yleniyor ve onay\u0131 al\u0131n\u0131yor mu?\n",
        "ruleText": "Uygulaman ba\u015Fka bir uygulaman\u0131n kurulmas\u0131n\u0131 gerektirmeden kendi ba\u015F\u0131na \xE7al\u0131\u015Fmal\u0131d\u0131r. \u0130lk a\xE7\u0131l\u0131\u015Fta \xE7al\u0131\u015Fmak i\xE7in ek kaynak indirmesi gerekiyorsa, indirmenin boyutunu a\xE7\u0131kla ve indirmeden \xF6nce kullan\u0131c\u0131ya sor.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.2.6-template-apps",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.2.6",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.6",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "design",
          "spam",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "template",
          "white label",
          "app builder",
          "app generator",
          "no-code",
          "for your business"
        ],
        "question": `Uygulama ticari bir \u015Fablondan ya da uygulama \xFCretme hizmetinden mi olu\u015Fturuldu? \xD6yleyse g\xF6nderimi, uygulaman\u0131n \u0130\xC7ER\u0130\u011E\u0130N\u0130N sahibi yapmak zorunda \u2014 \u015Fablon sa\u011Flay\u0131c\u0131s\u0131 m\xFC\u015Fterisi ad\u0131na g\xF6nderemez. \u015Eablon sa\u011Flay\u0131c\u0131s\u0131ysan, t\xFCm m\xFC\u015Fteri i\xE7eri\u011Fini tek bir binary'de toplayan bir "se\xE7ici" model kabul edilir.
`,
        "ruleText": 'Ticari bir \u015Fablondan ya da uygulama \xFCretme hizmetinden olu\u015Fturulan uygulamalar, do\u011Frudan uygulaman\u0131n i\xE7erik sa\u011Flay\u0131c\u0131s\u0131 taraf\u0131ndan g\xF6nderilmedik\xE7e reddedilir. Bu hizmetler m\xFC\u015Fterileri ad\u0131na uygulama g\xF6ndermemeli; m\xFC\u015Fterilerinin \xF6zelle\u015Ftirilmi\u015F, yenilik\xE7i ve \xF6zg\xFCn deneyimler \xFCretmesine izin veren ara\xE7lar sunmal\u0131d\u0131r. \u015Eablon sa\u011Flay\u0131c\u0131lar\u0131 i\xE7in kabul edilebilir bir se\xE7enek de t\xFCm m\xFC\u015Fteri i\xE7eri\u011Fini toplu ya da "se\xE7ici" bir modelde bar\u0131nd\u0131ran tek bir binary olu\u015Fturmakt\u0131r.\n',
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-4.2.7-remote-desktop",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.2.7",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.7",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "design",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "remote desktop",
          "rdp",
          "vnc",
          "stream your pc",
          "mirror your",
          "remote access",
          "cloud gaming"
        ],
        "question": "Uzak masa\xFCst\xFC uygulamas\u0131 belirli bir yaz\u0131l\u0131m\u0131n/servisin aynas\u0131 gibi davran\u0131yorsa be\u015F \u015Fart: (a) yaln\u0131zca kullan\u0131c\u0131n\u0131n sahip oldu\u011Fu ki\u015Fisel bilgisayara ya da oyun konsoluna, ayn\u0131 yerel a\u011F \xFCzerinden ba\u011Flan\u0131yor mu, (b) yaz\u0131l\u0131m tamamen ana cihazda m\u0131 \xE7al\u0131\u015F\u0131p orada m\u0131 i\u015Fleniyor, (c) hesap olu\u015Fturma ve y\xF6netimi ana cihazdan m\u0131 ba\u015Flat\u0131l\u0131yor, (d) istemcideki aray\xFCz iOS/App Store g\xF6r\xFCn\xFCm\xFCne benzemiyor, ma\u011Faza gibi davranm\u0131yor ve kullan\u0131c\u0131n\u0131n sahip olmad\u0131\u011F\u0131 yaz\u0131l\u0131m\u0131 g\xF6z atma/se\xE7me/sat\u0131n alma imk\xE2n\u0131 vermiyor, de\u011Fil mi, (e) uygulama bulut tabanl\u0131 uygulamalar i\xE7in ince istemci de\u011Fil, de\u011Fil mi?\n",
        "ruleText": "Uzak masa\xFCst\xFC uygulamas\u0131, ana cihaz\u0131n genel bir aynas\u0131 yerine belirli bir yaz\u0131l\u0131m\u0131n ya da servisin aynas\u0131 gibi davran\u0131yorsa: yaln\u0131zca kullan\u0131c\u0131n\u0131n sahip oldu\u011Fu ki\u015Fisel bilgisayara ya da \xF6zel oyun konsoluna ve yerel a\u011F \xFCzerinden ba\u011Flanmal\u0131; yaz\u0131l\u0131m tamamen ana cihazda \xE7al\u0131\u015F\u0131p orada i\u015Flenmeli; hesap olu\u015Fturma ve y\xF6netimi ana cihazdan ba\u015Flat\u0131lmal\u0131; istemcideki aray\xFCz iOS ya da App Store g\xF6r\xFCn\xFCm\xFCne benzememeli, ma\u011Faza benzeri bir aray\xFCz sunmamal\u0131 ve kullan\u0131c\u0131n\u0131n sahip olmad\u0131\u011F\u0131 yaz\u0131l\u0131m\u0131 g\xF6z atma, se\xE7me veya sat\u0131n alma imk\xE2n\u0131 vermemelidir. Bulut tabanl\u0131 uygulamalar i\xE7in ince istemciler App Store'a uygun de\u011Fildir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.3-duplicate-bundles",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "design",
          "spam",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Ayn\u0131 uygulaman\u0131n birden \xE7ok Bundle ID ile farkl\u0131 s\xFCr\xFCmleri App Store'da m\u0131 (her \u015Fehir, tak\u0131m, \xFCniversite ya da m\xFC\u015Fteri i\xE7in ayr\u0131 uygulama)? Apple bunun yerine tek bir uygulama ve varyasyonlar\u0131n uygulama i\xE7i sat\u0131n alma ile sunulmas\u0131n\u0131 istiyor.\n",
        "ruleText": "Ayn\u0131 uygulaman\u0131n birden fazla Bundle ID'sini olu\u015Fturma (\xF6r. d\xFCnyadaki her \u015Fehir i\xE7in ayr\u0131 harita uygulamas\u0131 yerine her \u015Fehri aratabilen tek bir uygulama). Uygulaman\u0131n belirli konumlar, spor tak\u0131mlar\u0131, \xFCniversiteler vb. i\xE7in farkl\u0131 s\xFCr\xFCmleri varsa tek bir uygulama g\xF6nderip varyasyonlar\u0131 uygulama i\xE7i sat\u0131n almayla sunmay\u0131 d\xFC\u015F\xFCn.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.3-spam-template",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#design",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "checklist",
          "spam"
        ],
        "scope": "single",
        "needs": [],
        "question": "Uygulama bir \u015Fablondan/jenerat\xF6rden \xFCretilmi\u015F ya da ma\u011Fazadaki benzerlerinden ay\u0131rt edilemez mi? Ay\u0131rt edici bir i\u015Flevi var m\u0131? Bu, listing icerigine bakarak guvenilir sekilde yargilanamaz.\n",
        "ruleText": "Sablondan uretilmis, ayirt edici islevi olmayan veya mevcut uygulamalarin kopyasi olan gonderimler spam olarak reddedilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.3b-commodity-genres",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "design",
          "spam",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "category",
          "keywords"
        ],
        "prefilter": [
          "flashlight",
          "wallpaper",
          "wallpapers",
          "fortune",
          "horoscope",
          "dating",
          "sound effects",
          "timer",
          "fart",
          "drinking game",
          "kama sutra",
          "soundboard"
        ],
        "question": "Uygulama, Apple'\u0131n ad\u0131yla sayd\u0131\u011F\u0131 doygun t\xFCrlerden birine mi giriyor (fl\xF6rt, fener, ses efektleri, duvar k\xE2\u011F\u0131d\u0131, basit zamanlay\u0131c\u0131, falc\u0131l\u0131k) ya da d\xFC\u015F\xFCk kaliteli sayd\u0131\u011F\u0131 t\xFCrlerden biri mi (i\xE7ki oyunlar\u0131, Kama Sutra, osuruk, ge\u011Firme)? \xD6yleyse metin, anlaml\u0131 bi\xE7imde FARKLI ya da GEL\u0130\u015EM\u0130\u015E bir deneyim sundu\u011Funu g\xF6steriyor mu? Ay\u0131rt edici bir \u015Fey vaat etmiyorsa bildir.\n",
        "ruleText": "Halihaz\u0131rda yayg\u0131n olarak bulunanlardan ay\u0131rt edilemeyen uygulamalar g\xF6nderme. Fl\xF6rt, fener, ses efektleri, duvar k\xE2\u011F\u0131d\u0131, basit zamanlay\u0131c\u0131 ve falc\u0131l\u0131k gibi belirli uygulama t\xFCrleri App Store'da yerle\u015Fiktir ve anlaml\u0131 bi\xE7imde farkl\u0131 ya da geli\u015Ftirilmi\u015F bir deneyim sunmad\u0131k\xE7a yeni g\xF6nderimler kabul edilmez. \u0130\xE7ki oyunlar\u0131, Kama Sutra, osuruk ve ge\u011Firme uygulamalar\u0131 gibi t\xFCrler ise vasat, d\xFC\u015F\xFCk kaliteli ya da d\xFC\u015F\xFCk \xE7abal\u0131d\u0131r ve App Store'a de\u011Fer katmaz.\n",
        "positiveExample": "Simple flashlight \u2014 turn your screen white and tap to toggle brightness.",
        "negativeExample": "A flashlight for divers: depth-aware red-light mode and a strobe for signalling, tested to 40m.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.4-extensions-disclosure",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "extensions",
          "metadata",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasAppExtensions": true
        },
        "question": "Uygulama uzant\u0131 bar\u0131nd\u0131r\u0131yorsa: (1) uzant\u0131lar pazarlama metninde a\xE7\u0131k ve do\u011Fru bi\xE7imde anlat\u0131l\u0131yor mu, (2) uzant\u0131lar\u0131n i\xE7inde pazarlama, reklam ya da uygulama i\xE7i sat\u0131n alma var m\u0131 (olmamal\u0131), (3) yard\u0131m ekran\u0131/ayarlar gibi bir i\u015Flevsellik sunuluyor mu?\n",
        "ruleText": "Uzant\u0131 bar\u0131nd\u0131ran ya da i\xE7eren uygulamalar ilgili programlama k\u0131lavuzlar\u0131na uymal\u0131 ve m\xFCmk\xFCn oldu\u011Funda yard\u0131m ekranlar\u0131 ve ayar aray\xFCzleri gibi bir i\u015Flevsellik i\xE7ermelidir. Uygulamada hangi uzant\u0131lar\u0131n sunuldu\u011Funu pazarlama metninde a\xE7\u0131k ve do\u011Fru bi\xE7imde belirtmelisin; uzant\u0131lar pazarlama, reklam ya da uygulama i\xE7i sat\u0131n alma i\xE7eremez.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.4.1-keyboard-extensions",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.4.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.4.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "extensions",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasAppExtensions": true
        },
        "prefilter": [
          "keyboard",
          "klavye",
          "sticker",
          "emoji"
        ],
        "question": 'Klavye uzant\u0131s\u0131: (1) ger\xE7ekten karakter giri\u015Fi sa\u011Fl\u0131yor mu, (2) g\xF6rsel/emoji i\xE7eriyorsa Sticker kurallar\u0131na uyuyor mu, (3) sonraki klavyeye ge\xE7i\u015F yolu var m\u0131, (4) tam a\u011F eri\u015Fimi ve "full access" olmadan \xE7al\u0131\u015F\u0131yor mu, (5) kullan\u0131c\u0131 etkinli\u011Fini yaln\u0131zca klavye uzant\u0131s\u0131n\u0131n i\u015Flevini geli\u015Ftirmek i\xE7in mi topluyor, (6) Ayarlar d\u0131\u015F\u0131nda ba\u015Fka uygulama a\xE7m\u0131yor ve klavye tu\u015Flar\u0131n\u0131 ba\u015Fka davran\u0131\u015Flara yeniden atam\u0131yor, de\u011Fil mi?\n',
        "ruleText": "Klavye uzant\u0131lar\u0131: karakter giri\u015Fi sa\u011Flamal\u0131; g\xF6rsel veya emoji i\xE7eriyorsa Sticker kurallar\u0131na uymal\u0131; sonraki klavyeye ge\xE7i\u015F y\xF6ntemi sunmal\u0131; tam a\u011F eri\u015Fimi olmadan ve tam eri\u015Fim gerektirmeden \xE7al\u0131\u015Fmaya devam etmeli; kullan\u0131c\u0131 etkinli\u011Fini yaln\u0131zca cihazdaki klavye uzant\u0131s\u0131n\u0131n i\u015Flevini geli\u015Ftirmek i\xE7in toplamal\u0131d\u0131r. Ayarlar d\u0131\u015F\u0131nda ba\u015Fka uygulama ba\u015Flatamaz ve klavye tu\u015Flar\u0131n\u0131 ba\u015Fka davran\u0131\u015Flar i\xE7in yeniden kullanamaz.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.4.2-safari-extensions",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.4.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.4.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "extensions",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasAppExtensions": true
        },
        "prefilter": [
          "safari",
          "browser extension",
          "web extension",
          "content blocker",
          "ad blocker"
        ],
        "question": "Safari uzant\u0131s\u0131 ilgili i\u015Fletim sisteminin g\xFCncel Safari s\xFCr\xFCm\xFCnde \xE7al\u0131\u015F\u0131yor mu? Sistem ya da Safari aray\xFCz \xF6\u011Felerine m\xFCdahale ediyor mu? K\xF6t\xFC niyetli veya yan\u0131lt\u0131c\u0131 i\xE7erik/kod i\xE7eriyor mu? \xC7al\u0131\u015Fmak i\xE7in ger\xE7ekten gerekli olandan daha fazla siteye eri\u015Fim talep ediyor mu?\n",
        "ruleText": "Safari uzant\u0131lar\u0131 ilgili Apple i\u015Fletim sistemindeki g\xFCncel Safari s\xFCr\xFCm\xFCnde \xE7al\u0131\u015Fmal\u0131d\u0131r. Sistem ya da Safari aray\xFCz \xF6\u011Felerine m\xFCdahale edemez ve asla k\xF6t\xFC niyetli veya yan\u0131lt\u0131c\u0131 i\xE7erik ya da kod i\xE7eremez. Safari uzant\u0131lar\u0131 \xE7al\u0131\u015Fmak i\xE7in kesinlikle gerekli olandan daha fazla web sitesine eri\u015Fim talep etmemelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.5.1-apple-data",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.5.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "apple-services",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "app store",
          "itunes",
          "ranking",
          "rankings",
          "chart",
          "charts",
          "top apps",
          "aso",
          "app analytics"
        ],
        "question": "Uygulama Apple sitelerinden (apple.com, iTunes Store, App Store, App Store Connect, developer portal\u0131) veri kaz\u0131yor ya da bu bilgilerle s\u0131ralama \xFCretiyor mu? Onayl\u0131 Apple RSS ak\u0131\u015Flar\u0131n\u0131 kullanmak serbest.\n",
        "ruleText": "Uygulamalar iTunes Store RSS ak\u0131\u015F\u0131 gibi onayl\u0131 Apple RSS ak\u0131\u015Flar\u0131n\u0131 kullanabilir ancak Apple sitelerinden (apple.com, iTunes Store, App Store, App Store Connect, developer portal\u0131 vb.) bilgi kaz\u0131yamaz ve bu bilgilerle s\u0131ralama olu\u015Fturamaz.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.5.2-apple-music",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.5.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "apple-services",
          "media",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "apple music",
          "musickit",
          "itunes",
          "playlist",
          "music library",
          "spotify"
        ],
        "question": "Apple Music/MusicKit kullan\u0131l\u0131yorsa: (i) \xE7almay\u0131 kullan\u0131c\u0131 m\u0131 ba\u015Flat\u0131yor ve standart medya kontrolleri (oynat/duraklat/atla) var m\u0131; eri\u015Fim \xFCcretli ya da dolayl\u0131 olarak paraya \xE7evrilmi\u015F mi (IAP, reklam, kullan\u0131c\u0131 bilgisi isteme); MusicKit kaynakl\u0131 m\xFCzik dosyalar\u0131 indiriliyor, y\xFCkleniyor ya da payla\u015F\u0131l\u0131yor mu, (ii) daha derin entegrasyon i\xE7in gereken lisanslar (senkronizasyon, uyarlama) al\u0131nd\u0131 m\u0131; kapak g\xF6rselleri ve metadata yaln\u0131zca \xE7alma/\xE7alma listeleriyle ba\u011Flant\u0131l\u0131 m\u0131 kullan\u0131l\u0131yor, (iii) Apple Music kullan\u0131c\u0131 verisine (\xE7alma listeleri, favoriler) eri\u015Filiyorsa bu izin metninde a\xE7\u0131k\xE7a belirtiliyor ve veri \xFC\xE7\xFCnc\xFC taraflarla payla\u015F\u0131lm\u0131yor, kullan\u0131c\u0131/cihaz tan\u0131mlamak ya da reklam hedeflemek i\xE7in kullan\u0131lm\u0131yor mu?\n",
        "ruleText": "MusicKit ile kullan\u0131c\u0131lar Apple Music'i ve yerel m\xFCzik k\xFCt\xFCphanelerini uygulamandan \xE7alabilir. Ak\u0131\u015F\u0131 kullan\u0131c\u0131 ba\u015Flatmal\u0131 ve standart medya kontrolleriyle gezinebilmelidir. Uygulaman Apple Music servisine eri\u015Fimi \xFCcretlendiremez ya da dolayl\u0131 olarak paraya \xE7eviremez. MusicKit API'lerinden gelen m\xFCzik dosyalar\u0131 indirilemez, y\xFCklenemez ve payla\u015F\u0131lamaz. MusicKit kullanmak, daha derin bir m\xFCzik entegrasyonu i\xE7in gereken lisanslar\u0131n yerine ge\xE7mez. Kapak g\xF6rselleri ve di\u011Fer metadata yaln\u0131zca m\xFCzik \xE7alma ya da \xE7alma listeleriyle ba\u011Flant\u0131l\u0131 kullan\u0131labilir. Apple Music kullan\u0131c\u0131 verisine eri\u015Fen uygulamalar bunu izin metninde a\xE7\u0131k\xE7a belirtmeli; toplanan veri uygulamay\u0131 desteklemek veya iyile\u015Ftirmek d\u0131\u015F\u0131nda \xFC\xE7\xFCnc\xFC taraflarla payla\u015F\u0131lamaz, kullan\u0131c\u0131/cihaz tan\u0131mlamak ya da reklam hedeflemek i\xE7in kullan\u0131lamaz.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.5.3-apple-services-spam",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.5.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "apple-services",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "push",
          "notification",
          "notifications",
          "game center",
          "leaderboard",
          "live activity"
        ],
        "question": "Apple servisleri (Game Center, Push Notifications, Live Activities) \xFCzerinden istenmeyen mesaj, spam ya da oltalama g\xF6nderiliyor mu? Game Center'dan elde edilen Player ID, takma ad ve di\u011Fer bilgiler ters arama, izleme, ili\u015Fkilendirme, madencilik ya da ba\u015Fka bi\xE7imde kullan\u0131l\u0131yor mu?\n",
        "ruleText": "Apple servislerini \u2014 Game Center, Push Notifications, Live Activities vb. d\xE2hil \u2014 m\xFC\u015Fterilere spam g\xF6ndermek, oltalama yapmak ya da istenmeyen mesaj iletmek i\xE7in kullanma. Game Center \xFCzerinden elde edilen Player ID'leri, takma adlar\u0131 ya da di\u011Fer bilgileri ters arama, izleme, ili\u015Fkilendirme, madencilik, hasat ya da ba\u015Fka bi\xE7imde istismar etmeye \xE7al\u0131\u015Fma.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.5.4-push-notifications",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.5.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "apple-services",
          "marketing",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "push",
          "notification",
          "notifications",
          "alerts",
          "reminder",
          "reminders",
          "bildirim"
        ],
        "question": "Push bildirimleri: (1) uygulaman\u0131n \xE7al\u0131\u015Fmas\u0131 i\xE7in ZORUNLU mu (olmamal\u0131), (2) hassas ya da gizli ki\u015Fisel bilgi g\xF6nderiliyor mu (g\xF6nderilmemeli), (3) promosyon veya do\u011Frudan pazarlama ama\xE7l\u0131 bildirim g\xF6nderiliyorsa kullan\u0131c\u0131 uygulaman\u0131n ARAY\xDCZ\xDCNDE g\xF6sterilen bir r\u0131za metniyle a\xE7\u0131k\xE7a onay verdi mi, (4) kullan\u0131c\u0131 bu mesajlardan \xE7\u0131kmak i\xE7in uygulaman\u0131n i\xE7inde bir yol bulabiliyor mu?\n",
        "ruleText": "Push bildirimleri uygulaman\u0131n \xE7al\u0131\u015Fmas\u0131 i\xE7in zorunlu olmamal\u0131 ve hassas ya da gizli ki\u015Fisel bilgi g\xF6ndermek i\xE7in kullan\u0131lmamal\u0131d\u0131r. Push bildirimleri, m\xFC\u015Fteriler uygulaman\u0131n aray\xFCz\xFCnde g\xF6sterilen r\u0131za metniyle a\xE7\u0131k\xE7a kabul etmedik\xE7e promosyon ya da do\u011Frudan pazarlama amac\u0131yla kullan\u0131lamaz; ayr\u0131ca uygulamanda kullan\u0131c\u0131n\u0131n bu mesajlardan \xE7\u0131kabilece\u011Fi bir y\xF6ntem sunmal\u0131s\u0131n.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-4.5.5-game-center-ids",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.5.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "apple-services",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "game center",
          "player id",
          "leaderboard",
          "achievements",
          "multiplayer"
        ],
        "question": "Game Center Player ID'leri yaln\u0131zca Game Center \u015Fartlar\u0131n\u0131n onaylad\u0131\u011F\u0131 bi\xE7imde mi kullan\u0131l\u0131yor? Uygulamada ya da \xFC\xE7\xFCnc\xFC taraflara g\xF6steriliyor mu (g\xF6sterilmemeli)?\n",
        "ruleText": "Game Center Player ID'lerini yaln\u0131zca Game Center \u015Fartlar\u0131n\u0131n onaylad\u0131\u011F\u0131 bi\xE7imde kullan ve bunlar\u0131 uygulamada ya da herhangi bir \xFC\xE7\xFCnc\xFC tarafa g\xF6sterme.\n",
        "outcome": "manual",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-4.5.6-apple-emoji",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.5.6",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.6",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "apple-services",
          "ip",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasAppExtensions": true
        },
        "prefilter": [
          "emoji",
          "emojis",
          "sticker",
          "stickers"
        ],
        "question": "Apple emojileri yaln\u0131zca Apple platformlar\u0131nda ve Unicode karakter olarak m\u0131 kullan\u0131l\u0131yor? Apple emojileri ba\u015Fka platformlarda kullan\u0131lamaz ve do\u011Frudan uygulama binary'sine g\xF6m\xFClemez; \xFC\xE7\xFCnc\xFC taraf klavyeler ve Sticker paketleri Apple emojisi i\xE7eremez (5.2.5).\n",
        "ruleText": "Uygulamalar, uygulamalar\u0131nda ve uygulama metadata's\u0131nda Apple emojisi olarak g\xF6r\xFCnt\xFClenen Unicode karakterlerini kullanabilir. Apple emojileri ba\u015Fka platformlarda kullan\u0131lamaz ve do\u011Frudan uygulama binary'sine g\xF6m\xFClemez.\n",
        "outcome": "manual",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-4.7-hosted-software",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.7",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.7",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hosted-software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hostsThirdPartySoftware": true
        },
        "question": "Uygulama binary'ye g\xF6m\xFCl\xFC olmayan yaz\u0131l\u0131m sunuyorsa (mini uygulama, mini oyun, ak\u0131\u015F oyunu, chatbot, eklenti, em\xFClat\xF6r oyunu): bu yaz\u0131l\u0131mlar\u0131n kurallara ve yasalara uymas\u0131ndan SEN sorumlusun. Sunulan yaz\u0131l\u0131mlar\u0131n tamam\u0131n\u0131 g\xF6zden ge\xE7irdin mi ve 4.7.1-4.7.5 \u015Fartlar\u0131n\u0131 kar\u015F\u0131lad\u0131klar\u0131ndan emin misin?\n",
        "ruleText": "Uygulamalar binary'ye g\xF6m\xFCl\xFC olmayan belirli yaz\u0131l\u0131mlar\u0131 sunabilir: HTML5 ve JavaScript mini uygulamalar ve mini oyunlar, ak\u0131\u015F oyunlar\u0131, chatbotlar ve eklentiler; ayr\u0131ca retro oyun konsolu ve PC em\xFClat\xF6r\xFC uygulamalar\u0131 oyun indirmeyi sunabilir. Uygulamanda sunulan t\xFCm bu yaz\u0131l\u0131mlardan \u2014 bu kurallara ve t\xFCm ge\xE7erli yasalara uymalar\u0131 d\xE2hil \u2014 sen sorumlusun. Bir kurala uymayan yaz\u0131l\u0131m uygulaman\u0131n reddedilmesine yol a\xE7ar.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-4.7.1-hosted-software-duties",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.7.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hosted-software",
          "ugc",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hostsThirdPartySoftware": true
        },
        "question": "Bar\u0131nd\u0131r\u0131lan yaz\u0131l\u0131mlar i\xE7in \xFC\xE7 \u015Fart: (1) gizlilik kurallar\u0131 (5.1) \u2014 veri toplama, kullan\u0131m ve payla\u015F\u0131m ile \xE7ocuklardan gelen sa\u011Fl\u0131k ve ki\u015Fisel veri d\xE2hil, (2) uygunsuz materyali s\xFCzme y\xF6ntemi, i\xE7eri\u011Fi \u015Fikayet etme mekanizmas\u0131, \u015Fikayetlere zaman\u0131nda yan\u0131t ve k\xF6t\xFCye kullanan kullan\u0131c\u0131lar\u0131 engelleme imk\xE2n\u0131, (3) dijital mal ve hizmetler i\xE7in 3.1 (uygulama i\xE7i sat\u0131n alma) kurallar\u0131. \xDC\xE7\xFC de sa\u011Flan\u0131yor mu?\n",
        "ruleText": "Bu kural kapsam\u0131nda sunulan yaz\u0131l\u0131mlar: veri toplama, kullan\u0131m ve payla\u015F\u0131m ile hassas veriler (\xE7ocuklardan gelen sa\u011Fl\u0131k ve ki\u015Fisel veriler gibi) d\xE2hil 5.1'deki gizlilik kurallar\u0131na uymal\u0131; uygunsuz materyali s\xFCzen bir y\xF6ntem, i\xE7eri\u011Fi bildirme mekanizmas\u0131 ve \u015Fikayetlere zaman\u0131nda yan\u0131t ile k\xF6t\xFCye kullanan kullan\u0131c\u0131lar\u0131 engelleme imk\xE2n\u0131 i\xE7ermeli; son kullan\u0131c\u0131lara dijital mal veya hizmet sunmak i\xE7in 3.1'e uymal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-4.7.2-native-api-exposure",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.7.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hosted-software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hostsThirdPartySoftware": true
        },
        "question": "Uygulama, bar\u0131nd\u0131rd\u0131\u011F\u0131 yaz\u0131l\u0131mlara yerel platform API'lerini ya da teknolojilerini a\xE7\u0131yor veya geni\u015Fletiyor mu? Bu, Apple'\u0131n \xF6nceden izni olmadan yasak.\n",
        "ruleText": "Uygulaman, Apple'\u0131n \xF6nceden izni olmadan yerel platform API'lerini ya da teknolojilerini bar\u0131nd\u0131rd\u0131\u011F\u0131 yaz\u0131l\u0131mlara a\xE7amaz veya geni\u015Fletemez.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.7.3-permission-sharing",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.7.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hosted-software",
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hostsThirdPartySoftware": true
        },
        "question": "Uygulama, bar\u0131nd\u0131rd\u0131\u011F\u0131 yaz\u0131l\u0131mlarla veri ya da gizlilik izinlerini payla\u015F\u0131yor mu? Bu yaln\u0131zca HER SEFER\u0130NDE al\u0131nan a\xE7\u0131k kullan\u0131c\u0131 r\u0131zas\u0131yla yap\u0131labilir.\n",
        "ruleText": "Uygulaman, her durumda a\xE7\u0131k kullan\u0131c\u0131 r\u0131zas\u0131 olmadan, bar\u0131nd\u0131rd\u0131\u011F\u0131 hi\xE7bir yaz\u0131l\u0131mla veri ya da gizlilik izinlerini payla\u015Famaz.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.7.4-software-index",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.7.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hosted-software",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hostsThirdPartySoftware": true
        },
        "question": "Uygulamada sunulan yaz\u0131l\u0131mlar\u0131n ve metadata'lar\u0131n\u0131n bir dizini var m\u0131? Bu dizin, sunulan t\xFCm yaz\u0131l\u0131mlara giden evrensel ba\u011Flant\u0131lar\u0131 (universal links) i\xE7ermek zorunda.\n",
        "ruleText": "Uygulamanda sunulan yaz\u0131l\u0131mlar\u0131n ve metadata'n\u0131n bir dizinini sa\u011Flamal\u0131s\u0131n. Bu dizin, uygulamanda sunulan t\xFCm yaz\u0131l\u0131mlara giden evrensel ba\u011Flant\u0131lar\u0131 i\xE7ermelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-4.7.5-hosted-age-restriction",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.7.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "hosted-software",
          "age-rating",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hostsThirdPartySoftware": true
        },
        "question": "Kullan\u0131c\u0131, uygulaman\u0131n ya\u015F s\u0131n\u0131r\u0131n\u0131 A\u015EAN yaz\u0131l\u0131m\u0131 ay\u0131rt edebiliyor mu? Do\u011Frulanm\u0131\u015F ya da beyan edilmi\u015F ya\u015Fa dayal\u0131 bir ya\u015F k\u0131s\u0131tlama mekanizmas\u0131yla k\xFC\xE7\xFCklerin eri\u015Fimi s\u0131n\u0131rlan\u0131yor mu?\n",
        "ruleText": "Uygulaman, kullan\u0131c\u0131lar\u0131n uygulaman\u0131n ya\u015F s\u0131n\u0131r\u0131n\u0131 a\u015Fan yaz\u0131l\u0131m\u0131 ay\u0131rt etmesini sa\u011Flamal\u0131 ve do\u011Frulanm\u0131\u015F ya da beyan edilmi\u015F ya\u015Fa dayal\u0131 bir ya\u015F k\u0131s\u0131tlama mekanizmas\u0131yla k\xFC\xE7\xFCklerin eri\u015Fimini s\u0131n\u0131rlamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-4.8-sign-in-with-apple",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.8",
          "url": "https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "login",
          "vision"
        ],
        "scope": "cross",
        "needs": [
          "screenshots",
          "reviewNotes"
        ],
        "appliesWhen": {
          "hasThirdPartyLogin": true
        },
        "requiresVision": true,
        "facts": [
          "Bir uygulama \xFC\xE7\xFCnc\xFC taraf veya sosyal giri\u015F (Google, Facebook, X/Twitter, Meta) sunuyorsa, Apple ile Giri\u015F'i de e\u015Fde\u011Fer bir se\xE7enek olarak sunmak zorundad\u0131r.",
          "Yaln\u0131zca e-posta/\u015Fifre ile giri\u015F sunan uygulamalar bu \u015Farttan muaft\u0131r."
        ],
        "question": 'Giri\u015F/kay\u0131t ekran g\xF6r\xFCnt\xFCs\xFCnde \xFC\xE7\xFCnc\xFC taraf giri\u015F d\xFC\u011Fmeleri (Google, Facebook, X, Meta) g\xF6r\xFCn\xFCyor mu? G\xF6r\xFCn\xFCyorsa, ayn\u0131 ekranda "Sign in with Apple" d\xFC\u011Fmesi de var m\u0131? Sosyal giri\u015F var ve Apple ile Giri\u015F yoksa bildir. Giri\u015F ekran\u0131 g\xF6r\xFCnt\xFClerde yoksa bulgu \xFCretme.\n',
        "ruleText": "\xDC\xE7\xFCnc\xFC taraf/sosyal giri\u015F sunan uygulamalar, Apple ile Giri\u015F'i de e\u015Fde\u011Fer bir se\xE7enek olarak sunmal\u0131d\u0131r.\n",
        "positiveExample": "Giri\u015F ekran\u0131nda 'Continue with Google' ve 'Continue with Facebook' var, Apple yok.",
        "negativeExample": "Giri\u015F ekran\u0131nda 'Sign in with Apple', 'Continue with Google' ve e-posta se\xE7ene\u011Fi birlikte var.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 2
      },
      {
        "id": "apple-4.9-apple-pay",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "4.9",
          "url": "https://developer.apple.com/app-store/review/guidelines/#4.9",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "payments",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "apple pay",
          "recurring",
          "subscription",
          "auto-renew",
          "membership"
        ],
        "question": "Apple Pay kullan\u0131l\u0131yorsa: (1) sat\u0131\u015Ftan \xF6nce t\xFCm \xF6nemli sat\u0131n alma bilgisi kullan\u0131c\u0131ya veriliyor mu, (2) Apple Pay markas\u0131 ve aray\xFCz \xF6\u011Feleri kurallara uygun kullan\u0131l\u0131yor mu, (3) yinelenen \xF6deme varsa \u015Funlar a\xE7\u0131klan\u0131yor mu: yenileme d\xF6nemi ve iptal edilene kadar s\xFCrece\u011Fi, her d\xF6nemde ne verilece\u011Fi, m\xFC\u015Fteriden tahsil edilecek ger\xE7ek tutar ve nas\u0131l iptal edilece\u011Fi?\n",
        "ruleText": "Apple Pay kullanan uygulamalar, herhangi bir mal veya hizmetin sat\u0131\u015F\u0131ndan \xF6nce t\xFCm \xF6nemli sat\u0131n alma bilgilerini kullan\u0131c\u0131ya sunmal\u0131 ve Apple Pay markas\u0131yla aray\xFCz \xF6\u011Felerini do\u011Fru kullanmal\u0131d\u0131r. Apple Pay ile yinelenen \xF6deme sunan uygulamalar en az\u0131ndan \u015Funlar\u0131 a\xE7\u0131klamal\u0131d\u0131r: yenileme d\xF6neminin uzunlu\u011Fu ve iptal edilene kadar devam edece\u011Fi, her d\xF6nemde ne sa\u011Flanaca\u011F\u0131, m\xFC\u015Fteriden tahsil edilecek ger\xE7ek \xFCcretler ve nas\u0131l iptal edilece\u011Fi.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5-legal-compliance",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "legal",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Uygulaman\u0131n sunuldu\u011Fu HER \xFClkede ge\xE7erli yasalara uydu\u011Fu kontrol edildi mi? Apple bunu geli\u015Ftiricinin sorumlulu\u011Funa b\u0131rak\u0131yor: yaln\u0131z bu kurallara uymak yetmiyor. Su\xE7 ya da a\xE7\u0131k\xE7a pervas\u0131z davran\u0131\u015F\u0131 te\u015Fvik eden hi\xE7bir i\u015Flev yok, de\u011Fil mi?\n",
        "ruleText": "Uygulamalar, sunulduklar\u0131 her yerde t\xFCm yasal gerekliliklere uymal\u0131d\u0131r. Yerel yasalar\u0131 anlamak ve uygulaman\u0131n bunlara uygun olmas\u0131n\u0131 sa\u011Flamak senin sorumlulu\u011Fundur. Su\xE7 i\u015Flemeyi ya da a\xE7\u0131k\xE7a pervas\u0131z davran\u0131\u015F\u0131 talep eden, te\u015Fvik eden veya \xF6zendiren uygulamalar reddedilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.1.1-privacy-claim-contradiction",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "privacy",
          "claims"
        ],
        "scope": "cross",
        "needs": [
          "description",
          "promotionalText",
          "subtitle"
        ],
        "question": 'Metin, veri toplama konusunda mutlak bir iddia i\xE7eriyor mu \u2014 "hi\xE7bir veri toplam\u0131yoruz", "verileriniz asla sunucuya gitmez", "%100 \xE7evrimd\u0131\u015F\u0131", "hi\xE7 takip yok"? B\xF6yle bir iddia varken uygulaman\u0131n hesap/giri\u015F gerektirmesi, bulut i\u015Fleme yapmas\u0131 ya da analitik/reklam i\xE7ermesi bu iddiayla \xE7eli\u015Fir. Yaln\u0131zca MUTLAK ifadeleri bildir; "gizlili\u011Finize \xF6nem veriyoruz" gibi genel c\xFCmleler ihlal de\u011Fildir.\n',
        "ruleText": "Gizlilik beyanlar\u0131 uygulaman\u0131n ger\xE7ek veri davran\u0131\u015F\u0131yla ve App Privacy etiketiyle tutarl\u0131 olmal\u0131d\u0131r. \xC7eli\u015Fkili mutlak iddialar reddedilir.\n",
        "positiveExample": "We never collect any data. 100% offline, zero tracking.",
        "negativeExample": "Your privacy matters to us. Read our privacy policy for details.",
        "outcome": "risk",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.1-purpose-strings",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "checklist",
          "privacy"
        ],
        "scope": "single",
        "needs": [],
        "question": "Kamera, foto\u011Fraf, konum, mikrofon gibi her izin i\xE7in Info.plist'teki a\xE7\u0131klama metni, iznin NEDEN gerekti\u011Fini somut olarak anlat\u0131yor mu? 'Uygulama kameray\u0131 kullan\u0131r' gibi genel metinler reddedilir.\n",
        "ruleText": "Her izin istegi icin, verinin ne icin kullanilacagini acikca anlatan bir amac metni bulunmalidir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.1i-privacy-policy-content",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "policy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Gizlilik politikas\u0131 METN\u0130 \xFC\xE7 \u015Feyi a\xE7\u0131k\xE7a s\xF6yl\xFCyor mu: (1) hangi verinin topland\u0131\u011F\u0131, nas\u0131l topland\u0131\u011F\u0131 ve t\xFCm kullan\u0131m ama\xE7lar\u0131, (2) veri payla\u015F\u0131lan her \xFC\xE7\xFCnc\xFC taraf\u0131n (analitik, reklam a\u011F\u0131, SDK, ba\u011Fl\u0131 \u015Firketler) ayn\u0131 ya da e\u015Fde\u011Fer koruma sa\u011Flad\u0131\u011F\u0131n\u0131n teyidi, (3) saklama/silme politikas\u0131 ile kullan\u0131c\u0131n\u0131n r\u0131zas\u0131n\u0131 nas\u0131l geri alaca\u011F\u0131 ve verisinin silinmesini nas\u0131l isteyece\u011Fi. Ayr\u0131ca politikaya ba\u011Flant\u0131 hem App Store Connect alan\u0131nda hem UYGULAMANIN \u0130\xC7\u0130NDE kolayca eri\u015Filebilir yerde var m\u0131?\n",
        "ruleText": "T\xFCm uygulamalar gizlilik politikas\u0131na App Store Connect metadata alan\u0131nda ve uygulama i\xE7inde kolayca eri\u015Filebilir bi\xE7imde ba\u011Flant\u0131 vermelidir. Gizlilik politikas\u0131 a\xE7\u0131k\xE7a: uygulaman\u0131n/servisin hangi veriyi toplad\u0131\u011F\u0131n\u0131, nas\u0131l toplad\u0131\u011F\u0131n\u0131 ve t\xFCm kullan\u0131m ama\xE7lar\u0131n\u0131 belirtmeli; veri payla\u015F\u0131lan her \xFC\xE7\xFCnc\xFC taraf\u0131n ayn\u0131 veya e\u015Fde\u011Fer korumay\u0131 sa\u011Flayaca\u011F\u0131n\u0131 teyit etmeli; saklama/silme politikalar\u0131n\u0131 ve kullan\u0131c\u0131n\u0131n r\u0131zas\u0131n\u0131 nas\u0131l geri alabilece\u011Fini ya da verisinin silinmesini nas\u0131l talep edebilece\u011Fini a\xE7\u0131klamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.1ii-consent",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "consent",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Veri toplayan uygulamada: (1) toplama i\xE7in kullan\u0131c\u0131 r\u0131zas\u0131 al\u0131n\u0131yor mu (topland\u0131\u011F\u0131 anda anonim say\u0131lsa bile), (2) \xFCcretli i\u015Flev bu veriye eri\u015Fim iznine BA\u011ELI m\u0131 (olmamal\u0131), (3) kullan\u0131c\u0131 r\u0131zas\u0131n\u0131 kolayca ve anla\u015F\u0131l\u0131r bi\xE7imde geri alabiliyor mu, (4) izin metinleri (purpose strings) verinin kullan\u0131m\u0131n\u0131 eksiksiz anlat\u0131yor mu, (5) GDPR'\u0131n me\u015Fru menfaat istisnas\u0131na dayan\u0131yorsan yasan\u0131n t\xFCm \u015Fartlar\u0131na uyuluyor mu?\n",
        "ruleText": "Kullan\u0131c\u0131 ya da kullan\u0131m verisi toplayan uygulamalar, veri topland\u0131\u011F\u0131 anda anonim say\u0131lsa bile toplama i\xE7in kullan\u0131c\u0131 r\u0131zas\u0131 almal\u0131d\u0131r. \xDCcretli i\u015Flev, bu veriye eri\u015Fim iznine ba\u011Fl\u0131 olamaz ya da bunu gerektiremez. Uygulamalar kullan\u0131c\u0131ya r\u0131zas\u0131n\u0131 geri almak i\xE7in kolay ve anla\u015F\u0131l\u0131r bir yol sunmal\u0131d\u0131r. \u0130zin metinlerin verinin kullan\u0131m\u0131n\u0131 a\xE7\u0131k ve eksiksiz anlatmal\u0131d\u0131r. GDPR ya da benzeri bir yasan\u0131n me\u015Fru menfaat h\xFCkm\xFCne dayanarak r\u0131zas\u0131z veri toplayan uygulamalar o yasan\u0131n t\xFCm \u015Fartlar\u0131na uymal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.1iii-data-minimization",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Uygulama yaln\u0131zca ana i\u015Fleviyle \u0130LG\u0130L\u0130 veriye mi eri\u015Fim istiyor ve yaln\u0131zca i\u015Fi yapmak i\xE7in gerekli olan\u0131 m\u0131 topluyor? Foto\u011Fraflar ve Ki\u015Filer gibi korumal\u0131 kaynaklarda tam eri\u015Fim istemek yerine, m\xFCmk\xFCn oldu\u011Funda s\xFCre\xE7 d\u0131\u015F\u0131 se\xE7ici (picker) ya da payla\u015F\u0131m sayfas\u0131 kullan\u0131l\u0131yor mu?\n",
        "ruleText": "Uygulamalar yaln\u0131zca uygulaman\u0131n ana i\u015Fleviyle ilgili veriye eri\u015Fim istemeli ve yaln\u0131zca ilgili g\xF6revi yerine getirmek i\xE7in gereken veriyi toplay\u0131p kullanmal\u0131d\u0131r. M\xFCmk\xFCn oldu\u011Funda Foto\u011Fraflar veya Ki\u015Filer gibi korumal\u0131 kaynaklara tam eri\u015Fim istemek yerine s\xFCre\xE7 d\u0131\u015F\u0131 se\xE7ici ya da payla\u015F\u0131m sayfas\u0131 kullan\u0131lmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.1.1iv-permission-respect",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Uygulama kullan\u0131c\u0131n\u0131n izin ayarlar\u0131na sayg\u0131 g\xF6steriyor mu? Gereksiz veri eri\u015Fimine r\u0131za vermeye y\xF6nlendirme, kand\u0131rma ya da zorlama var m\u0131 (Apple'\u0131n \xF6rne\u011Fi: sosyal a\u011Fa foto\u011Fraf y\xFCklemek i\xE7in mikrofon izni \u015Fart ko\u015Fmak)? \u0130zin vermeyen kullan\u0131c\u0131 i\xE7in alternatif sunuluyor mu (konum vermeyene adresi elle yazma imk\xE2n\u0131 gibi)?\n",
        "ruleText": "Uygulamalar kullan\u0131c\u0131n\u0131n izin ayarlar\u0131na sayg\u0131 g\xF6stermeli ve insanlar\u0131 gereksiz veri eri\u015Fimine r\u0131za vermeye y\xF6nlendirmeye, kand\u0131rmaya ya da zorlamaya \xE7al\u0131\u015Fmamal\u0131d\u0131r. M\xFCmk\xFCn oldu\u011Funda r\u0131za vermeyen kullan\u0131c\u0131lar i\xE7in alternatif \xE7\xF6z\xFCmler sun.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.1.1ix-regulated-entity",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "legal",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "bank",
          "banking",
          "loan",
          "health",
          "medical",
          "gambling",
          "betting",
          "casino",
          "cannabis",
          "crypto",
          "exchange",
          "insurance",
          "airline",
          "flight"
        ],
        "question": "Uygulama s\u0131k\u0131 d\xFCzenlemeye tabi bir alanda m\u0131 hizmet veriyor (bankac\u0131l\u0131k ve finans, sa\u011Fl\u0131k, kumar, yasal esrar, hava yolu, kripto borsas\u0131) ya da hassas kullan\u0131c\u0131 bilgisi mi istiyor? \xD6yleyse g\xF6nderim, hizmeti VEREN t\xFCzel ki\u015Filik taraf\u0131ndan m\u0131 yap\u0131l\u0131yor (bireysel geli\u015Ftirici hesab\u0131 de\u011Fil)? Yasal esrar sat\u0131\u015F\u0131n\u0131 kolayla\u015Ft\u0131r\u0131yorsan uygulama ilgili yasal yarg\u0131 alan\u0131yla co\u011Frafi olarak s\u0131n\u0131rland\u0131r\u0131ld\u0131 m\u0131?\n",
        "ruleText": "S\u0131k\u0131 d\xFCzenlemeye tabi alanlarda (bankac\u0131l\u0131k ve finansal hizmetler, sa\u011Fl\u0131k, kumar, yasal esrar kullan\u0131m\u0131, hava yolculu\u011Fu ve kripto borsalar\u0131 gibi) hizmet veren ya da hassas kullan\u0131c\u0131 bilgisi gerektiren uygulamalar, bireysel bir geli\u015Ftirici taraf\u0131ndan de\u011Fil, bu hizmetleri sa\u011Flayan t\xFCzel ki\u015Filik taraf\u0131ndan g\xF6nderilmelidir. Yasal esrar sat\u0131\u015F\u0131n\u0131 kolayla\u015Ft\u0131ran uygulamalar ilgili yasal yarg\u0131 alan\u0131yla co\u011Frafi olarak s\u0131n\u0131rland\u0131r\u0131lmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.1v-account-deletion",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1(v)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "checklist",
          "privacy"
        ],
        "scope": "single",
        "needs": [],
        "question": "Uygulama hesap olu\u015Fturmaya izin veriyorsa, uygulama \u0130\xC7\u0130NDEN hesab\u0131 kal\u0131c\u0131 silme yolu var m\u0131? Yaln\u0131zca e-posta ile talep etmek yetmez; ak\u0131\u015F uygulama i\xE7inde bulunabilir olmal\u0131.\n",
        "ruleText": "Hesap olusturmaya izin veren uygulamalar, hesabin uygulama icinden silinmesine de izin vermelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.1v-account-signin",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1(v)",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1(v)",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "login",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "requiresLogin": true
        },
        "question": "(1) Uygulaman\u0131n ger\xE7ekten \xF6nemli hesap tabanl\u0131 \xF6zellikleri var m\u0131? Yoksa insanlar giri\u015Fsiz kullanabilmeli. (2) Kullan\u0131c\u0131dan ki\u015Fisel bilgi girmesi, ana i\u015Flevle do\u011Frudan ilgili ya da yasa gere\u011Fi olmad\u0131k\xE7a isteniyor mu? (3) Ana i\u015Flevin belirli bir sosyal a\u011Fla ilgili DE\u011E\u0130LSE, giri\u015Fsiz ya da ba\u015Fka bir mekanizmayla eri\u015Fim sunuluyor mu? (Profil bilgisi \xE7ekmek, sosyal a\u011Fda payla\u015Fmak ya da arkada\u015F davet etmek ana i\u015Flev say\u0131lmaz.) (4) Sosyal a\u011F kimlik bilgilerini iptal etme ve veri eri\u015Fimini kesme yolu uygulaman\u0131n i\xE7inde var m\u0131? (5) Sosyal a\u011F token'lar\u0131 cihaz d\u0131\u015F\u0131nda saklan\u0131yor mu (saklanmamal\u0131)?\n",
        "ruleText": "Uygulaman\u0131n \xF6nemli hesap tabanl\u0131 \xF6zellikleri yoksa insanlar\u0131n giri\u015Fsiz kullanmas\u0131na izin ver. Uygulaman hesap olu\u015Fturmay\u0131 destekliyorsa uygulama i\xE7inde hesap silmeyi de sunmal\u0131s\u0131n. Uygulamalar, ana i\u015Flevle do\u011Frudan ilgili olmad\u0131k\xE7a ya da yasa gerektirmedik\xE7e \xE7al\u0131\u015Fmak i\xE7in ki\u015Fisel bilgi girilmesini zorunlu k\u0131lamaz. Ana i\u015Flevin belirli bir sosyal a\u011Fla ilgili de\u011Filse giri\u015Fsiz ya da ba\u015Fka bir mekanizmayla eri\u015Fim sa\u011Flamal\u0131s\u0131n; temel profil bilgisi \xE7ekmek, sosyal a\u011Fda payla\u015Fmak veya arkada\u015F davet etmek ana i\u015Flev say\u0131lmaz. Uygulama ayr\u0131ca sosyal a\u011F kimlik bilgilerini iptal etmek ve veri eri\u015Fimini kesmek i\xE7in uygulama i\xE7inde bir mekanizma i\xE7ermelidir. Kimlik bilgileri ya da token'lar cihaz d\u0131\u015F\u0131nda saklanamaz.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.1vi-credential-harvesting",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "security",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "password",
          "passwords",
          "credential",
          "vault",
          "password manager",
          "login saver"
        ],
        "question": "Uygulama, kullan\u0131c\u0131n\u0131n \u015Fifrelerini ya da \xF6zel verilerini gizlice ele ge\xE7iren bir davran\u0131\u015F i\xE7eriyor mu? \u015Eifre y\xF6neticisi ya da kasa uygulamalar\u0131nda verinin nerede sakland\u0131\u011F\u0131 ve kimin eri\u015Fti\u011Fi a\xE7\u0131k\xE7a anlat\u0131l\u0131yor mu?\n",
        "ruleText": "Uygulamalar\u0131n\u0131 \u015Fifreleri ya da di\u011Fer \xF6zel verileri gizlice ele ge\xE7irmek i\xE7in kullanan geli\u015Ftiriciler Apple Developer Program'dan \xE7\u0131kar\u0131l\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.1vii-safari-view-controller",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "browser",
          "in-app browser",
          "safari",
          "web view",
          "open links"
        ],
        "question": "SafariViewController kullan\u0131l\u0131yorsa: kullan\u0131c\u0131ya G\xD6R\xDCN\xDCR bi\xE7imde mi sunuluyor (ba\u015Fka g\xF6r\xFCn\xFCm veya katmanlarla gizlenmiyor ya da \xF6rt\xFClm\xFCyor)? Kullan\u0131c\u0131n\u0131n bilgisi ve r\u0131zas\u0131 olmadan izleme i\xE7in kullan\u0131l\u0131yor mu?\n",
        "ruleText": "SafariViewController, bilgiyi kullan\u0131c\u0131lara g\xF6r\xFCn\xFCr bi\xE7imde sunmak i\xE7in kullan\u0131lmal\u0131d\u0131r; denetleyici ba\u015Fka g\xF6r\xFCn\xFCmler ya da katmanlarla gizlenemez veya \xF6rt\xFClemez. Ayr\u0131ca uygulama, SafariViewController'\u0131 kullan\u0131c\u0131lar\u0131n bilgisi ve r\u0131zas\u0131 olmadan onlar\u0131 izlemek i\xE7in kullanamaz.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.1.1viii-data-compilation",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "people search",
          "public records",
          "lookup",
          "reverse phone",
          "find people",
          "background check",
          "directory"
        ],
        "question": 'Uygulama, ki\u015Fisel bilgiyi do\u011Frudan kullan\u0131c\u0131dan almadan ya da a\xE7\u0131k r\u0131zas\u0131 olmadan derliyor mu? Kamuya a\xE7\u0131k veritabanlar\u0131 da buna d\xE2hil \u2014 "insan arama", telefon rehberi, kay\u0131t taramas\u0131 gibi i\u015Flevler bu maddeden reddediliyor.\n',
        "ruleText": "Do\u011Frudan kullan\u0131c\u0131dan olmayan hi\xE7bir kaynaktan, kullan\u0131c\u0131n\u0131n a\xE7\u0131k r\u0131zas\u0131 olmadan ki\u015Fisel bilgi derleyen uygulamalara \u2014 kamuya a\xE7\u0131k veritabanlar\u0131 d\xE2hil \u2014 App Store'da veya alternatif da\u011F\u0131t\u0131mda izin verilmez.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.1x-optional-contact-info",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "allowsAccountCreation": true
        },
        "question": "Uygulama ad ve e-posta gibi temel ileti\u015Fim bilgisi istiyorsa: (1) bu istek kullan\u0131c\u0131 i\xE7in \u0130STE\u011EE BA\u011ELI m\u0131, (2) \xF6zellik ve hizmetler bu bilgiyi vermeye ba\u011Fl\u0131 m\u0131 (olmamal\u0131), (3) \xE7ocuklardan bilgi toplama s\u0131n\u0131rlar\u0131 d\xE2hil di\u011Fer kurallara uyuluyor mu?\n",
        "ruleText": "Uygulamalar temel ileti\u015Fim bilgisi (ad ve e-posta adresi gibi) isteyebilir; yeter ki bu istek kullan\u0131c\u0131 i\xE7in iste\u011Fe ba\u011Fl\u0131 olsun, \xF6zellik ve hizmetler bu bilginin verilmesine ba\u011Fl\u0131 olmas\u0131n ve \xE7ocuklardan bilgi toplamaya ili\u015Fkin s\u0131n\u0131rlamalar d\xE2hil bu kurallar\u0131n di\u011Fer h\xFCk\xFCmlerine uyulsun.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.1.2-att",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "checklist",
          "privacy"
        ],
        "scope": "single",
        "needs": [],
        "appliesWhen": {
          "declaresTracking": true
        },
        "question": "Uygulama reklam/analitik i\xE7in cihazlar aras\u0131 takip yap\u0131yorsa AppTrackingTransparency izni isteniyor mu? \u0130zin verilmedi\u011Finde takip ger\xE7ekten duruyor mu? App Privacy etiketindeki beyanla tutarl\u0131 m\u0131?\n",
        "ruleText": "Kullaniciyi diger uygulama/sitelerde takip eden uygulamalar AppTrackingTransparency izni istemek zorundadir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.2i-forced-system-permissions",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "consent",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "(1) Ki\u015Fisel veri, izin al\u0131nmadan kullan\u0131l\u0131yor, iletiliyor ya da payla\u015F\u0131l\u0131yor mu? (2) Verinin nerede ve nas\u0131l kullan\u0131laca\u011F\u0131 bilgisi kullan\u0131c\u0131ya sunuluyor mu? (3) \xDC\xE7\xFCnc\xFC taraflarla \u2014 \xFC\xE7\xFCnc\xFC taraf YAPAY ZEK\xC2 d\xE2hil \u2014 payla\u015F\u0131m a\xE7\u0131k\xE7a bildirilip a\xE7\u0131k izin al\u0131n\u0131yor mu? (4) \u0130zleme i\xE7in ATT izni al\u0131n\u0131yor mu? (5) Uygulama, i\u015Fleve ya da i\xE7eri\u011Fe eri\u015Fmek i\xE7in kullan\u0131c\u0131y\u0131 sistem \xF6zelliklerini (push, konum, izleme) a\xE7maya ZORLUYOR mu \u2014 ya da bunun kar\u015F\u0131l\u0131\u011F\u0131nda hediye kart\u0131/kod gibi bir bedel mi sunuyor? Bu yasak.\n",
        "ruleText": "Yasa izin vermedik\xE7e, birinin ki\u015Fisel verisini \xF6nce izin almadan kullanamaz, iletemez veya payla\u015Famazs\u0131n. Verinin nas\u0131l ve nerede kullan\u0131laca\u011F\u0131na dair bilgiye eri\u015Fim sa\u011Flamal\u0131s\u0131n. Ki\u015Fisel verinin \xFC\xE7\xFCnc\xFC taraflarla \u2014 \xFC\xE7\xFCnc\xFC taraf yapay zek\xE2 d\xE2hil \u2014 nerede payla\u015F\u0131laca\u011F\u0131n\u0131 a\xE7\u0131k\xE7a bildirmeli ve \xF6ncesinde a\xE7\u0131k izin almal\u0131s\u0131n. Uygulamalardan toplanan veri, yaln\u0131zca uygulamay\u0131 iyile\u015Ftirmek ya da reklam sunmak i\xE7in \xFC\xE7\xFCnc\xFC taraflarla payla\u015F\u0131labilir. Kullan\u0131c\u0131lar\u0131n etkinli\u011Fini izlemek i\xE7in App Tracking Transparency API'leriyle a\xE7\u0131k izin almal\u0131s\u0131n. Uygulaman, i\u015Fleve, i\xE7eri\u011Fe ya da kullan\u0131ma eri\u015Fmek veya parasal ya da ba\u015Fka bir kar\u015F\u0131l\u0131k (hediye kartlar\u0131 ve kodlar d\xE2hil) almak i\xE7in kullan\u0131c\u0131lardan sistem i\u015Flevlerini (push bildirimleri, konum servisleri, izleme gibi) etkinle\u015Ftirmesini isteyemez.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.2ii-purpose-limitation",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Bir ama\xE7 i\xE7in toplanan veri, yeni bir r\u0131za al\u0131nmadan ba\u015Fka bir ama\xE7la kullan\u0131l\u0131yor mu? (\xD6r. \xFCr\xFCn teslimi i\xE7in al\u0131nan adresin reklam hedeflemede kullan\u0131lmas\u0131.)\n",
        "ruleText": "Bir ama\xE7 i\xE7in toplanan veri, yasa a\xE7\u0131k\xE7a izin vermedik\xE7e, ek r\u0131za olmadan ba\u015Fka bir ama\xE7la yeniden kullan\u0131lamaz.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.1.2iii-anonymous-profiling",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": 'Uygulama, toplanan veriye dayanarak gizlice kullan\u0131c\u0131 profili olu\u015Fturuyor mu? Anonim kullan\u0131c\u0131lar\u0131 tan\u0131mlamaya ya da "anonimle\u015Ftirilmi\u015F", "toplula\u015Ft\u0131r\u0131lm\u0131\u015F" denilen veriden profil yeniden kurmaya \xE7al\u0131\u015F\u0131yor, bunu kolayla\u015Ft\u0131r\u0131yor ya da ba\u015Fkalar\u0131n\u0131 buna te\u015Fvik ediyor mu?\n',
        "ruleText": `Uygulamalar toplanan veriye dayanarak gizlice kullan\u0131c\u0131 profili olu\u015Fturmaya \xE7al\u0131\u015Fmamal\u0131d\u0131r; Apple'\u0131n sa\u011Flad\u0131\u011F\u0131 API'lerden ya da "anonimle\u015Ftirilmi\u015F", "toplula\u015Ft\u0131r\u0131lm\u0131\u015F" veya ba\u015Fka bi\xE7imde tan\u0131mlanamaz oldu\u011Fu s\xF6ylenen verilerden anonim kullan\u0131c\u0131lar\u0131 tan\u0131mlamaya veya kullan\u0131c\u0131 profillerini yeniden kurmaya \xE7al\u0131\u015Famaz, bunu kolayla\u015Ft\u0131ramaz veya ba\u015Fkalar\u0131n\u0131 buna te\u015Fvik edemez.
`,
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.1.2iv-contacts-database",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "contacts",
          "address book",
          "phonebook",
          "invite friends",
          "find friends",
          "sync contacts"
        ],
        "question": "Ki\u015Filer, Foto\u011Fraflar ya da benzer API'lerden al\u0131nan bilgiyle kendi kullan\u0131m\u0131n i\xE7in veya \xFC\xE7\xFCnc\xFC taraflara satmak/da\u011F\u0131tmak \xFCzere bir ileti\u015Fim veritaban\u0131 olu\u015Fturuluyor mu? Cihazda ba\u015Fka hangi uygulamalar\u0131n kurulu oldu\u011Fu analitik ya da reklam/pazarlama amac\u0131yla toplan\u0131yor mu?\n",
        "ruleText": "Ki\u015Filer, Foto\u011Fraflar ya da kullan\u0131c\u0131 verisine eri\u015Fen di\u011Fer API'lerden gelen bilgiyi kendi kullan\u0131m\u0131n i\xE7in veya \xFC\xE7\xFCnc\xFC taraflara satmak/da\u011F\u0131tmak \xFCzere bir ileti\u015Fim veritaban\u0131 olu\u015Fturmak amac\u0131yla kullanma; kullan\u0131c\u0131n\u0131n cihaz\u0131nda hangi uygulamalar\u0131n kurulu oldu\u011Funu analitik ya da reklam/pazarlama amac\u0131yla toplama.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.2v-contact-messaging",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "invite friends",
          "invite your contacts",
          "share with friends",
          "sms invite",
          "refer a friend"
        ],
        "question": 'Kullan\u0131c\u0131n\u0131n Ki\u015Filer ya da Foto\u011Fraflar bilgisiyle \xFC\xE7\xFCnc\xFC ki\u015Filere mesaj g\xF6nderiliyorsa: (1) yaln\u0131zca kullan\u0131c\u0131n\u0131n a\xE7\u0131k ve ki\u015Fi baz\u0131nda giri\u015Fimiyle mi g\xF6nderiliyor, (2) "T\xFCm\xFCn\xFC Se\xE7" se\xE7ene\u011Fi ya da varsay\u0131lan olarak se\xE7ili t\xFCm ki\u015Filer var m\u0131 (olmamal\u0131), (3) mesaj\u0131n al\u0131c\u0131ya nas\u0131l g\xF6r\xFCnece\u011Fi \u2014 metni ve g\xF6nderen kim g\xF6r\xFCnecek \u2014 kullan\u0131c\u0131ya \xF6nceden a\xE7\u0131k\xE7a anlat\u0131l\u0131yor mu?\n',
        "ruleText": 'Bir kullan\u0131c\u0131n\u0131n Ki\u015Filer ya da Foto\u011Fraflar bilgisi \xFCzerinden toplanan bilgiyle insanlara ula\u015Fma; buna yaln\u0131zca o kullan\u0131c\u0131n\u0131n a\xE7\u0131k giri\u015Fimiyle ve ki\u015Fi baz\u0131nda izin verilir. "T\xFCm\xFCn\xFC Se\xE7" se\xE7ene\u011Fi koyma ve t\xFCm ki\u015Fileri varsay\u0131lan olarak se\xE7ili h\xE2le getirme. Mesaj\u0131n al\u0131c\u0131ya nas\u0131l g\xF6r\xFCnece\u011Fine dair kullan\u0131c\u0131ya net bir a\xE7\u0131klama sunmal\u0131s\u0131n: mesajda ne yazacak, g\xF6nderen kim g\xF6r\xFCnecek?\n',
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.1.2vi-sensitive-api-data",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "health",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasHealthFeatures": true
        },
        "question": "HomeKit, HealthKit, Clinical Health Records, MovementDisorder, ClassKit ya da derinlik/y\xFCz haritalama ara\xE7lar\u0131ndan (ARKit, kamera, foto\u011Fraf API'leri) toplanan veri pazarlama, reklam ya da kullan\u0131m tabanl\u0131 veri madencili\u011Fi i\xE7in kullan\u0131l\u0131yor mu? \xDC\xE7\xFCnc\xFC taraflar arac\u0131l\u0131\u011F\u0131yla da olsa bu yasak.\n",
        "ruleText": "HomeKit API, HealthKit, Clinical Health Records API, MovementDisorder API'leri, ClassKit ya da derinlik ve/veya y\xFCz haritalama ara\xE7lar\u0131ndan (ARKit, kamera API'leri, foto\u011Fraf API'leri) toplanan veri, \xFC\xE7\xFCnc\xFC taraflar d\xE2hil, pazarlama, reklam ya da kullan\u0131m tabanl\u0131 veri madencili\u011Fi i\xE7in kullan\u0131lamaz.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.2vii-apple-pay-data",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "payments",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "apple pay"
        ],
        "question": "Apple Pay ile elde edilen kullan\u0131c\u0131 verisi \xFC\xE7\xFCnc\xFC taraflarla yaln\u0131zca mal ve hizmetlerin teslimini kolayla\u015Ft\u0131rmak ya da iyile\u015Ftirmek i\xE7in mi payla\u015F\u0131l\u0131yor?\n",
        "ruleText": "Apple Pay kullanan uygulamalar, Apple Pay arac\u0131l\u0131\u011F\u0131yla elde edilen kullan\u0131c\u0131 verisini \xFC\xE7\xFCnc\xFC taraflarla yaln\u0131zca mal ve hizmetlerin tesliminin kolayla\u015Ft\u0131r\u0131lmas\u0131 ya da iyile\u015Ftirilmesi amac\u0131yla payla\u015Fabilir.\n",
        "outcome": "manual",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-5.1.3-health-research",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "health",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "hasHealthFeatures": true
        },
        "question": "Sa\u011Fl\u0131k/fitness/t\u0131bbi veri i\u015Fleyen uygulamada: (i) bu veri reklam, pazarlama ya da kullan\u0131m tabanl\u0131 veri madencili\u011Fi i\xE7in kullan\u0131l\u0131yor mu (yasak; sa\u011Fl\u0131k y\xF6netimini iyile\u015Ftirmek ya da izinli sa\u011Fl\u0131k ara\u015Ft\u0131rmas\u0131 istisna); toplad\u0131\u011F\u0131n spesifik sa\u011Fl\u0131k verisini a\xE7\u0131klad\u0131n m\u0131, (ii) HealthKit'e ya da ba\u015Fka bir sa\u011Fl\u0131k uygulamas\u0131na yanl\u0131\u015F veri yaz\u0131l\u0131yor mu; ki\u015Fisel sa\u011Fl\u0131k bilgisi iCloud'da m\u0131 tutuluyor (tutulmamal\u0131), (iii) insan ara\u015Ft\u0131rmas\u0131 yap\u0131l\u0131yorsa kat\u0131l\u0131mc\u0131dan (k\xFC\xE7\xFCklerde ebeveyn/vasiden) ara\u015Ft\u0131rman\u0131n niteli\u011Fi, amac\u0131 ve s\xFCresi; prosed\xFCrler, riskler ve faydalar; gizlilik ve veri payla\u015F\u0131m\u0131; soru i\xE7in ileti\u015Fim noktas\u0131; \xE7ekilme s\xFCreci anlat\u0131larak r\u0131za al\u0131n\u0131yor mu, (iv) ba\u011F\u0131ms\u0131z bir etik kurul onay\u0131 al\u0131nd\u0131 m\u0131?\n",
        "ruleText": "Sa\u011Fl\u0131k, fitness ve t\u0131bbi ara\u015Ft\u0131rma ba\u011Flam\u0131nda toplanan veri \u2014 Clinical Health Records API, HealthKit, Motion and Fitness, MovementDisorder API'leri ya da sa\u011Fl\u0131kla ilgili insan ara\u015Ft\u0131rmalar\u0131 d\xE2hil \u2014 sa\u011Fl\u0131k y\xF6netimini iyile\u015Ftirmek ya da izinli sa\u011Fl\u0131k ara\u015Ft\u0131rmas\u0131 d\u0131\u015F\u0131nda reklam, pazarlama veya kullan\u0131m tabanl\u0131 veri madencili\u011Fi i\xE7in kullan\u0131lamaz ve \xFC\xE7\xFCnc\xFC taraflara a\xE7\u0131klanamaz. Cihazdan toplad\u0131\u011F\u0131n spesifik sa\u011Fl\u0131k verisini a\xE7\u0131klamal\u0131s\u0131n. Uygulamalar HealthKit'e ya da ba\u015Fka bir t\u0131bbi ara\u015Ft\u0131rma/sa\u011Fl\u0131k y\xF6netimi uygulamas\u0131na yanl\u0131\u015F veya hatal\u0131 veri yazamaz ve ki\u015Fisel sa\u011Fl\u0131k bilgisini iCloud'da saklayamaz. Sa\u011Fl\u0131kla ilgili insan ara\u015Ft\u0131rmas\u0131 yapan uygulamalar kat\u0131l\u0131mc\u0131lardan (k\xFC\xE7\xFCklerde ebeveyn veya vasiden) r\u0131za almal\u0131 ve ba\u011F\u0131ms\u0131z bir etik inceleme kurulundan onay sa\u011Flamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.4-kids-privacy",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "kids",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "targetsKids": true
        },
        "question": "\xC7ocuklara y\xF6nelik uygulamada: (1) do\u011Fum tarihi ve ebeveyn ileti\u015Fim bilgisi yaln\u0131zca COPPA/GDPR gibi yasalara uymak i\xE7in mi isteniyor ve uygulama ya\u015Ftan ba\u011F\u0131ms\u0131z olarak yararl\u0131 bir i\u015Flev ya da e\u011Flence sunuyor mu, (2) \xFC\xE7\xFCnc\xFC taraf analitik ve reklam kald\u0131r\u0131ld\u0131 m\u0131 (s\u0131n\u0131rl\u0131 istisnalar 1.3'teki \u015Fartlara tabi), (3) \xE7ocuktan ki\u015Fisel bilgi (ad, adres, e-posta, konum, foto\u011Fraf, video, \xE7izim, sohbet imk\xE2n\u0131, kal\u0131c\u0131 tan\u0131mlay\u0131c\u0131lar) toplayan ya da payla\u015Fabilen uygulamada gizlilik politikas\u0131 var ve \xE7ocuk gizlili\u011Fi yasalar\u0131na uyuluyor mu? Ebeveyn kap\u0131s\u0131, veri toplama i\xE7in ebeveyn r\u0131zas\u0131 ALMAK anlam\u0131na GELMEZ; ikisi ayr\u0131 \u015Feydir.\n",
        "ruleText": "\xC7ocuklardan ki\u015Fisel veri toplarken COPPA, GDPR ve di\u011Fer ge\xE7erli yasalara uyulmal\u0131d\u0131r. Uygulamalar do\u011Fum tarihi ve ebeveyn ileti\u015Fim bilgisini yaln\u0131zca bu yasalara uymak i\xE7in isteyebilir ve ki\u015Finin ya\u015F\u0131ndan ba\u011F\u0131ms\u0131z olarak yararl\u0131 bir i\u015Flev veya e\u011Flence de\u011Feri i\xE7ermelidir. \xD6ncelikli olarak \xE7ocuklara y\xF6nelik uygulamalar \xFC\xE7\xFCnc\xFC taraf analitik ve \xFC\xE7\xFCnc\xFC taraf reklam i\xE7ermemelidir. Kids Category'deki ya da bir k\xFC\xE7\xFCkten ki\u015Fisel bilgi toplayan, ileten veya payla\u015Fma kapasitesi olan uygulamalar gizlilik politikas\u0131 i\xE7ermeli ve ge\xE7erli \xE7ocuk gizlili\u011Fi yasalar\u0131na uymal\u0131d\u0131r. Kids Category i\xE7in ebeveyn kap\u0131s\u0131 \u015Fart\u0131, ki\u015Fisel veri toplamak i\xE7in ebeveyn r\u0131zas\u0131 almakla genellikle ayn\u0131 \u015Fey de\u011Fildir.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.1.5-location-services",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.1.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "privacy",
          "location",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "usesLocation": true
        },
        "question": "Konum kullanan uygulamada: (1) konum, uygulaman\u0131n sundu\u011Fu \xF6zellik ve hizmetlerle DO\u011ERUDAN ilgili mi, (2) konum verisi toplanmadan, iletilmeden ya da kullan\u0131lmadan \xF6nce kullan\u0131c\u0131 bilgilendirilip r\u0131zas\u0131 al\u0131n\u0131yor mu, (3) konumun ne i\xE7in kullan\u0131ld\u0131\u011F\u0131 uygulaman\u0131n i\xE7inde a\xE7\u0131klan\u0131yor mu, (4) konum API'leri acil servis sa\u011Flamak ya da ara\xE7/hava arac\u0131 gibi cihazlar\u0131n otonom kontrol\xFC i\xE7in kullan\u0131l\u0131yor mu (hafif drone, oyuncak ve uzaktan ara\xE7 alarm\u0131 gibi k\xFC\xE7\xFCk cihazlar istisna)?\n",
        "ruleText": "Konum Servislerini uygulamanda yaln\u0131zca sundu\u011Fun \xF6zellik ve hizmetlerle do\u011Frudan ilgili oldu\u011Funda kullan. Konum tabanl\u0131 API'ler acil servis sa\u011Flamak ya da ara\xE7lar\u0131n, hava ara\xE7lar\u0131n\u0131n ve di\u011Fer cihazlar\u0131n otonom kontrol\xFC i\xE7in kullan\u0131lmamal\u0131d\u0131r; hafif drone ve oyuncaklar ya da uzaktan ara\xE7 alarm sistemleri gibi k\xFC\xE7\xFCk cihazlar bunun d\u0131\u015F\u0131ndad\u0131r. Konum verisi toplamadan, iletmeden veya kullanmadan \xF6nce bildirimde bulun ve r\u0131za al. Konum Servisleri kullan\u0131yorsan amac\u0131n\u0131 uygulamanda a\xE7\u0131kla.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.2-third-party-brand-in-text",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#intellectual-property",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "ip",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "whatsNew"
        ],
        "facts": [
          "Facetune, Remini, FaceApp, Lensa, Picsart, Snapseed, VSCO, YouCam, Meitu, BeautyPlus, AirBrush, Retrica, PhotoRoom, Canva ve Photoshop ba\u015Fka \u015Firketlere ait uygulama/yaz\u0131l\u0131m markalar\u0131d\u0131r.",
          "Instagram, TikTok, Snapchat, WhatsApp, YouTube ve Facebook ba\u015Fka \u015Firketlere ait platform markalar\u0131d\u0131r.",
          "Botox, Restylane, Juvederm tescilli t\u0131bbi/kozmetik \xFCr\xFCn markalar\u0131d\u0131r.",
          "Bir markadan yaln\u0131zca ger\xE7ek bir entegrasyonu tarif etmek i\xE7in bahsedilebilir ('export to Instagram'). Kar\u015F\u0131la\u015Ft\u0131rma, \xFCst\xFCnl\xFCk iddias\u0131 veya \xE7a\u011Fr\u0131\u015F\u0131m ('better than X', 'X alternative') ihlaldir.",
          "Reels, TikTok(s), Shorts ve Stories birer \u0130\xC7ER\u0130K FORMATI ad\u0131 olarak da kullan\u0131l\u0131yor ('create Reels'). Bu kullan\u0131m gri aland\u0131r: format adlar\u0131 da o platformlar\u0131n markas\u0131d\u0131r ve bu ifade y\xFCz\xFCnden gelmi\u015F ger\xE7ek redler var. Karar kural\u0131: uygulama o platforma ger\xE7ekten aktar\u0131m yapm\u0131yorsa, format ad\u0131n\u0131 \xE7\u0131kt\u0131 vaadi olarak kullanmak B\u0130LD\u0130R\u0130L\u0130R."
        ],
        "question": 'Metinde ba\u015Fka bir \u015Firkete ait bir marka ad\u0131 ge\xE7iyor mu? Ge\xE7iyorsa hangi kullan\u0131m oldu\u011Funa karar ver: (a) ger\xE7ek bir entegrasyonun tarifi ("share to Instagram") \u2014 \u0130HLAL DE\u011E\u0130L, bildirme; (b) kar\u015F\u0131la\u015Ft\u0131rma, \xFCst\xFCnl\xFCk ya da alternatif olma iddias\u0131 ("better than X", "X alternative") \u2014 B\u0130LD\u0130R; (c) platform markas\u0131n\u0131n i\xE7erik format\u0131 olarak kullan\u0131m\u0131 ("create Reels, TikToks and Shorts") ve uygulama o platforma aktar\u0131m yapm\u0131yor \u2014 B\u0130LD\u0130R. Marka ad\u0131 olgu listesinde ge\xE7miyorsa bulgu \xFCretme.\n',
        "ruleText": "Sahibi olmad\u0131\u011F\u0131n\u0131z markalar\u0131, uygulaman\u0131zla ili\u015Fkilendirecek veya kar\u015F\u0131la\u015Ft\u0131racak bi\xE7imde metadata'da kullanamazs\u0131n\u0131z.\n",
        "positiveExample": "The best free alternative to Facetune and Remini.",
        "negativeExample": "Share your edits directly to Instagram and TikTok.",
        "notViolation": [
          "Kendi marka ve \xFCr\xFCn adlar\u0131n.",
          "Jenerik teknoloji ya da format s\xF6zc\xFCkleri: 'video', 'story', 'clip', 'post', 'filter'.",
          "Olgu listesinde ge\xE7meyen bir ad. Marka olup olmad\u0131\u011F\u0131n\u0131 tahmin etme."
        ],
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 2
      },
      {
        "id": "apple-5.2.1-ai-likeness-claims",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.2.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#intellectual-property",
          "retrievedAt": "2026-08-25"
        },
        "tags": [
          "ai",
          "ip",
          "likeness",
          "metadata"
        ],
        "scope": "cross",
        "needs": [
          "description",
          "subtitle",
          "keywords",
          "promotionalText"
        ],
        "appliesWhen": {
          "generatesAiContent": true
        },
        "facts": [
          "Korunan \xFC\xE7\xFCnc\xFC taraf materyali (marka, telif eser, tan\u0131nm\u0131\u015F ki\u015Fi benzerli\u011Fi) izinsiz kullan\u0131lamaz. Bu, uygulaman\u0131n \xDCRETT\u0130\u011E\u0130 i\xE7erik i\xE7in de ge\xE7erlidir.",
          "Listing metninin kendisi delil say\u0131l\u0131r: uygulama tan\u0131nm\u0131\u015F bir ki\u015Fiye ya da telifli bir karaktere d\xF6n\xFC\u015Ft\xFCrme vaat ediyorsa, App Review bunu izinsiz kullan\u0131m beyan\u0131 olarak okur ve denemeye bile gerek duymaz.",
          "S\u0131k g\xF6r\xFClen kal\u0131plar: '\xFCnl\xFC olarak g\xF6r', '\xE7izgi film karakterine d\xF6n\xFC\u015F', st\xFCdyo/marka ad\u0131yla stil vaadi (Disney, Pixar, Ghibli, Marvel), 'X ile y\xFCz\xFCn\xFC de\u011Fi\u015Ftir' (X ger\xE7ek bir ki\u015Fi).",
          "Genel ve marka i\xE7ermeyen stil adlar\u0131 (anime, 3D, ya\u011Fl\u0131 boya, piksel sanat, vintage) bu kural\u0131n konusu DE\u011E\u0130LD\u0130R \u2014 bunlar bulgu \xFCretmemeli."
        ],
        "question": 'A\u015Fa\u011F\u0131daki metin, uygulaman\u0131n GER\xC7EK B\u0130R K\u0130\u015E\u0130YE benzerlik ya da TEL\u0130FL\u0130 bir karakter/marka stiline d\xF6n\xFC\u015Ft\xFCrme yapt\u0131\u011F\u0131n\u0131 vaat ediyor mu? \u0130hlal say\u0131lacaklar: ad\u0131 ge\xE7en veya a\xE7\u0131k\xE7a kastedilen \xFCnl\xFC/kamuya mal olmu\u015F ki\u015Filer; telifli karakterler ve st\xFCdyo adlar\u0131 (Disney, Pixar, Ghibli, Marvel, Barbie gibi); "\xFCnl\xFClerle y\xFCz de\u011Fi\u015Ftir" t\xFCr\xFC vaatler. \u0130hlal SAYILMAYACAKLAR: marka i\xE7ermeyen genel stiller (anime, 3D, karikat\xFCr, ya\u011Fl\u0131 boya, vintage, piksel); kullan\u0131c\u0131n\u0131n KEND\u0130 foto\u011Fraf\u0131n\u0131 d\xFCzenlemesi; kullan\u0131c\u0131n\u0131n kendi y\xFCkledi\u011Fi i\xE7eri\u011Fi d\xF6n\xFC\u015Ft\xFCrmesi. Emin de\u011Filsen bulgu \xFCretme.\n',
        "ruleText": "Marka, telifli eser veya patentli fikir gibi korunan \xFC\xE7\xFCnc\xFC taraf materyalini izin almadan uygulamanda kullanma; uygulama paketinde veya geli\u015Ftirici ad\u0131nda yan\u0131lt\u0131c\u0131, yanl\u0131\u015F ya da taklit temsiller, isimler veya \xFCstveri bulundurma.\n",
        "positiveExample": "Turn yourself into a Disney princess or swap faces with your favorite celebrity!",
        "negativeExample": "Foto\u011Fraf\u0131n\u0131 anime, 3D karikat\xFCr veya ya\u011Fl\u0131 boya stiline d\xF6n\xFC\u015Ft\xFCr.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.2.2-third-party-services",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.2.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.2.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "ip",
          "legal",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "appliesWhen": {
          "usesThirdPartyContent": true
        },
        "question": "Uygulama \xFC\xE7\xFCnc\xFC taraf bir servisin i\xE7eri\u011Fini kullan\u0131yor, ona eri\u015Fiyor, eri\u015Fimi paraya \xE7eviriyor ya da i\xE7eri\u011Fini g\xF6steriyorsa: o servisin kullan\u0131m \u015Fartlar\u0131 buna A\xC7IK\xC7A izin veriyor mu? Apple istedi\u011Finde yetkiyi belgeleyebilir misin?\n",
        "ruleText": "Uygulaman \xFC\xE7\xFCnc\xFC taraf bir servisin i\xE7eri\u011Fini kullan\u0131yor, ona eri\u015Fiyor, eri\u015Fimini paraya \xE7eviriyor ya da i\xE7eri\u011Fini g\xF6steriyorsa, bunu yapmana o servisin kullan\u0131m \u015Fartlar\u0131 uyar\u0131nca \xF6zel olarak izin verildi\u011Finden emin ol. Yetki, talep edildi\u011Finde sunulmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.2.3-media-downloading",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.2.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.2.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "ip",
          "legal",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "keywords"
        ],
        "prefilter": [
          "download video",
          "youtube",
          "mp3",
          "converter",
          "save video",
          "downloader",
          "offline download",
          "ripper",
          "soundcloud",
          "vimeo"
        ],
        "question": "Metin, \xFC\xE7\xFCnc\xFC taraf kaynaklardan (YouTube, Apple Music, SoundCloud, Vimeo, Instagram vb.) medya kaydetme, d\xF6n\xFC\u015Ft\xFCrme ya da indirme yetene\u011Fi sunuyor mu? Ya da yasa d\u0131\u015F\u0131 dosya payla\u015F\u0131m\u0131n\u0131 kolayla\u015Ft\u0131rd\u0131\u011F\u0131n\u0131 g\xF6steriyor mu? Kayna\u011F\u0131n a\xE7\u0131k yetkisi oldu\u011Fu belirtilmedik\xE7e bu ihlaldir. Kendi i\xE7eri\u011Fini indirtmek ya da \xE7evrimd\u0131\u015F\u0131 kullan\u0131ma almak ihlal de\u011Fildir.\n",
        "ruleText": "Uygulamalar yasa d\u0131\u015F\u0131 dosya payla\u015F\u0131m\u0131n\u0131 kolayla\u015Ft\u0131rmamal\u0131; \xFC\xE7\xFCnc\xFC taraf kaynaklardan (Apple Music, YouTube, SoundCloud, Vimeo vb.) medyay\u0131, o kaynaklar\u0131n a\xE7\u0131k yetkisi olmadan kaydetme, d\xF6n\xFC\u015Ft\xFCrme veya indirme imk\xE2n\u0131 i\xE7ermemelidir. Ses/video i\xE7eri\u011Finin ak\u0131\u015Fa al\u0131nmas\u0131 da kullan\u0131m \u015Fartlar\u0131n\u0131 ihlal edebilir; eri\u015Fmeden \xF6nce kontrol et. Yetki, talep edildi\u011Finde sunulmal\u0131d\u0131r.\n",
        "positiveExample": "Download any YouTube video as MP3 and save it to your library.",
        "negativeExample": "Download the episodes you subscribed to for offline listening.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.2.4-apple-endorsement",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.2.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.2.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "ip",
          "metadata"
        ],
        "scope": "single",
        "needs": [
          "name",
          "subtitle",
          "description",
          "promotionalText",
          "keywords"
        ],
        "prefilter": [
          "apple",
          "editor's choice",
          "editors choice",
          "featured by",
          "approved by apple",
          "apple onayl\u0131"
        ],
        "question": `Metin, Apple'\u0131n uygulaman\u0131n kayna\u011F\u0131/sa\u011Flay\u0131c\u0131s\u0131 oldu\u011Funu ya da uygulaman\u0131n kalitesini onaylad\u0131\u011F\u0131n\u0131 ima ediyor mu ("Apple onayl\u0131", "Apple taraf\u0131ndan se\xE7ildi", "Editor's Choice", "Apple'\u0131n \xF6nerdi\u011Fi")? Editor's Choice rozetini Apple kendisi ekler; metinde iddia edilemez. Apple'\u0131n teknolojilerinden s\xF6z etmek (\xF6r. "HealthKit ile \xE7al\u0131\u015F\u0131r") ihlal de\u011Fildir.
`,
        "ruleText": `Apple'\u0131n uygulaman\u0131n kayna\u011F\u0131 ya da sa\u011Flay\u0131c\u0131s\u0131 oldu\u011Funu, veya kalite ya da i\u015Flevsellikle ilgili herhangi bir beyan\u0131 onaylad\u0131\u011F\u0131n\u0131 \xF6ne s\xFCrme ya da ima etme. Uygulaman "Editor's Choice" se\xE7ilirse rozeti Apple otomatik olarak uygular.
`,
        "positiveExample": "Apple-approved and featured as Editors Choice on the App Store.",
        "negativeExample": "Works with Apple Health and Siri Shortcuts.",
        "outcome": "violation",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.2.5-apple-lookalike",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.2.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.2.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "ip",
          "design",
          "vision"
        ],
        "scope": "cross",
        "needs": [
          "icon",
          "screenshots",
          "name"
        ],
        "requiresVision": true,
        "question": "Simge, ekran g\xF6r\xFCnt\xFCleri ya da ad, mevcut bir Apple \xFCr\xFCn\xFCne, aray\xFCz\xFCne (Finder gibi), uygulamas\u0131na (App Store, iTunes Store, Mesajlar gibi) ya da reklam temas\u0131na kafa kar\u0131\u015Ft\u0131racak kadar benziyor mu? Ayr\u0131ca Activity halkalar\u0131na benzeyen bir g\xF6rselle\u015Ftirme varsa bildir.\n",
        "ruleText": "Mevcut bir Apple \xFCr\xFCn\xFCne, aray\xFCz\xFCne (\xF6r. Finder), uygulamas\u0131na (App Store, iTunes Store ya da Mesajlar gibi) veya reklam temas\u0131na kafa kar\u0131\u015Ft\u0131racak kadar benzeyen bir uygulama olu\u015Fturma. Uygulaman Activity halkalar\u0131n\u0131 g\xF6steriyorsa, Move, Exercise veya Stand verisini Activity kontrol\xFCne benzeyen bi\xE7imde g\xF6rselle\u015Ftirmemelidir.\n",
        "positiveExample": "Simge, App Store logosunun renkleri ve \u015Fekliyle neredeyse ayn\u0131.",
        "negativeExample": "Simge, uygulaman\u0131n kendi markas\u0131na ait \xF6zg\xFCn bir sembol.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.3.1-sweepstakes-sponsor",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.3.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.3.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "gambling",
          "contests",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "sweepstake",
          "sweepstakes",
          "contest",
          "raffle",
          "giveaway",
          "prize",
          "\xE7ekili\u015F",
          "yar\u0131\u015Fma"
        ],
        "question": "Uygulamada \xE7ekili\u015F ya da yar\u0131\u015Fma varsa, sponsoru uygulaman\u0131n GEL\u0130\u015ET\u0130R\u0130C\u0130S\u0130 mi? \xDC\xE7\xFCnc\xFC bir taraf\u0131n sponsor oldu\u011Fu \xE7ekili\u015Fler bu maddeye tak\u0131l\u0131r.\n",
        "ruleText": "\xC7ekili\u015Fler ve yar\u0131\u015Fmalar uygulaman\u0131n geli\u015Ftiricisi taraf\u0131ndan sponsor edilmelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.3.2-official-rules",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.3.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.3.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "gambling",
          "contests",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "sweepstake",
          "sweepstakes",
          "contest",
          "raffle",
          "giveaway",
          "prize",
          "lottery",
          "\xE7ekili\u015F"
        ],
        "question": "\xC7ekili\u015F, yar\u0131\u015Fma ya da piyangonun resm\xEE kurallar\u0131 uygulaman\u0131n \u0130\xC7\u0130NDE sunuluyor mu? Bu kurallar Apple'\u0131n sponsor OLMADI\u011EINI ve etkinli\u011Fe hi\xE7bir bi\xE7imde d\xE2hil olmad\u0131\u011F\u0131n\u0131 a\xE7\u0131k\xE7a belirtiyor mu?\n",
        "ruleText": "\xC7ekili\u015Flerin, yar\u0131\u015Fmalar\u0131n ve piyangolar\u0131n resm\xEE kurallar\u0131 uygulamada sunulmal\u0131 ve Apple'\u0131n sponsor olmad\u0131\u011F\u0131n\u0131, etkinli\u011Fe hi\xE7bir bi\xE7imde d\xE2hil olmad\u0131\u011F\u0131n\u0131 a\xE7\u0131k\xE7a belirtmelidir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.3.3-iap-real-money-gaming",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.3.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.3.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "gambling",
          "iap"
        ],
        "scope": "single",
        "needs": [
          "description",
          "iap",
          "promotionalText"
        ],
        "prefilter": [
          "casino",
          "betting",
          "bet",
          "poker",
          "real money",
          "wager",
          "sportsbook",
          "bahis",
          "slots"
        ],
        "question": "Uygulama ger\xE7ek para ile oynanan bir oyun (spor bahsi, poker, casino, at yar\u0131\u015F\u0131) sunuyorsa, uygulama i\xE7i sat\u0131n alma ile bu oyunlarda kullan\u0131lacak kredi ya da para birimi sat\u0131n al\u0131n\u0131yor mu? Bu do\u011Frudan yasak. Ger\xE7ek para kazand\u0131rmayan sosyal casino oyunlar\u0131nda IAP serbesttir.\n",
        "ruleText": "Uygulamalar, her t\xFCrden ger\xE7ek para oyunuyla birlikte kullan\u0131lacak kredi ya da para birimi sat\u0131n almak i\xE7in uygulama i\xE7i sat\u0131n alma kullanamaz.\n",
        "positiveExample": "Buy chips with in-app purchase and use them at our real money poker tables.",
        "negativeExample": "Buy coins to play our free-to-play social slots. Coins have no cash value and cannot be withdrawn.",
        "outcome": "violation",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.3.4-real-money-gaming",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.3.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.3.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "gambling",
          "legal",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "casino",
          "betting",
          "bet",
          "poker",
          "lottery",
          "sports betting",
          "horse racing",
          "gambling",
          "bahis",
          "kumar"
        ],
        "question": "Ger\xE7ek para oyunu (spor bahsi, poker, casino, at yar\u0131\u015F\u0131) ya da piyango sunan uygulamada: (1) kullan\u0131ld\u0131\u011F\u0131 her yerde gerekli lisans ve izinler var m\u0131, (2) uygulama bu yerlere co\u011Frafi olarak s\u0131n\u0131rland\u0131r\u0131ld\u0131 m\u0131, (3) App Store'da \xDCCRETS\u0130Z mi, (4) kart sayac\u0131 gibi yasa d\u0131\u015F\u0131 kumar yard\u0131mc\u0131lar\u0131 yok, de\u011Fil mi, (5) piyango ise bedel, \u015Fans ve \xF6d\xFCl \xFC\xE7\xFC birden var m\u0131?\n",
        "ruleText": "Ger\xE7ek para oyunu (spor bahsi, poker, casino oyunlar\u0131, at yar\u0131\u015F\u0131) ya da piyango sunan uygulamalar, kullan\u0131ld\u0131klar\u0131 yerlerde gerekli lisans ve izinlere sahip olmal\u0131, bu yerlerle co\u011Frafi olarak s\u0131n\u0131rland\u0131r\u0131lmal\u0131 ve App Store'da \xFCcretsiz olmal\u0131d\u0131r. Kart saya\xE7lar\u0131 d\xE2hil yasa d\u0131\u015F\u0131 kumar yard\u0131mc\u0131lar\u0131na izin verilmez. Piyango uygulamalar\u0131nda bedel, \u015Fans ve \xF6d\xFCl bulunmal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.4-vpn-apps",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "vpn",
          "privacy",
          "legal",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "vpn",
          "proxy",
          "tunnel",
          "private network",
          "hide your ip"
        ],
        "question": "VPN hizmeti sunuyorsan: (1) NEVPNManager API kullan\u0131l\u0131yor mu, (2) geli\u015Ftirici hesab\u0131n ORGAN\u0130ZASYON olarak m\u0131 kay\u0131tl\u0131, (3) hangi kullan\u0131c\u0131 verisinin toplanaca\u011F\u0131 ve nas\u0131l kullan\u0131laca\u011F\u0131, kullan\u0131c\u0131 sat\u0131n alma ya da kullanma eylemine ge\xE7meden \xD6NCE bir uygulama ekran\u0131nda a\xE7\u0131k\xE7a beyan ediliyor mu, (4) veri \xFC\xE7\xFCnc\xFC taraflara sat\u0131lm\u0131yor/a\xE7\u0131klanm\u0131yor ve bu taahh\xFCt gizlilik politikas\u0131nda yaz\u0131l\u0131 m\u0131, (5) VPN lisans\u0131 gereken bir \xFClkede sunuyorsan lisans bilgisi App Review Notes alan\u0131na yaz\u0131ld\u0131 m\u0131?\n",
        "ruleText": "VPN hizmeti sunan uygulamalar NEVPNManager API'sini kullanmal\u0131 ve yaln\u0131zca organizasyon olarak kay\u0131tl\u0131 geli\u015Ftiriciler taraf\u0131ndan sunulmal\u0131d\u0131r. Kullan\u0131c\u0131, sat\u0131n alma ya da hizmeti kullanma eylemine ge\xE7meden \xF6nce hangi verinin toplanaca\u011F\u0131 ve nas\u0131l kullan\u0131laca\u011F\u0131 bir uygulama ekran\u0131nda a\xE7\u0131k\xE7a beyan edilmelidir. VPN uygulamalar\u0131 hi\xE7bir veriyi hi\xE7bir ama\xE7la \xFC\xE7\xFCnc\xFC taraflara satamaz, kullanamaz veya a\xE7\u0131klayamaz ve buna gizlilik politikalar\u0131nda taahh\xFCt etmelidir. Yerel yasalar ihlal edilemez; VPN lisans\u0131 gerektiren bir b\xF6lgede sunuyorsan lisans bilgini App Review Notes alan\u0131nda vermelisin.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.5-mdm-apps",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.5",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.5",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "mdm",
          "privacy",
          "legal",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "prefilter": [
          "mdm",
          "device management",
          "parental control",
          "kiosk",
          "supervision",
          "configuration profile",
          "screen time"
        ],
        "question": "MDM (mobil cihaz y\xF6netimi) ya da yap\u0131land\u0131rma profili sunuyorsan: (1) Apple'dan bu yetkiyi talep ettin mi, (2) sunan taraf ticari i\u015Fletme, e\u011Fitim kurumu, kamu kurumu ya da s\u0131n\u0131rl\u0131 durumlarda ebeveyn kontrol\xFC/cihaz g\xFCvenli\u011Fi i\xE7in MDM kullanan bir \u015Firket mi, (3) toplanacak veri ve kullan\u0131m\u0131, kullan\u0131c\u0131 sat\u0131n alma/kullanma eylemine ge\xE7meden \xF6nce bir uygulama ekran\u0131nda beyan ediliyor mu, (4) veri \xFC\xE7\xFCnc\xFC taraflara sat\u0131lm\u0131yor/a\xE7\u0131klanm\u0131yor ve bu gizlilik politikas\u0131nda yaz\u0131l\u0131 m\u0131, (5) \xFC\xE7\xFCnc\xFC taraf analitik varsa yaln\u0131zca kendi MDM uygulaman\u0131n performans\u0131na dair veri mi topluyor?\n",
        "ruleText": "MDM hizmeti sunan uygulamalar bu yetene\u011Fi Apple'dan talep etmelidir. Bu uygulamalar yaln\u0131zca ticari i\u015Fletmeler, e\u011Fitim kurumlar\u0131 ya da kamu kurumlar\u0131 taraf\u0131ndan ve s\u0131n\u0131rl\u0131 durumlarda ebeveyn kontrol\xFC veya cihaz g\xFCvenli\u011Fi i\xE7in MDM kullanan \u015Firketler taraf\u0131ndan sunulabilir. Hangi kullan\u0131c\u0131 verisinin toplanaca\u011F\u0131 ve nas\u0131l kullan\u0131laca\u011F\u0131, kullan\u0131c\u0131 sat\u0131n alma ya da kullanma eylemine ge\xE7meden \xF6nce bir uygulama ekran\u0131nda a\xE7\u0131k\xE7a beyan edilmelidir. MDM uygulamalar\u0131 hi\xE7bir veriyi \xFC\xE7\xFCnc\xFC taraflara satamaz, kullanamaz veya a\xE7\u0131klayamaz ve buna gizlilik politikalar\u0131nda taahh\xFCt etmelidir. S\u0131n\u0131rl\u0131 durumlarda, yaln\u0131zca geli\u015Ftiricinin MDM uygulamas\u0131n\u0131n performans\u0131na dair veri toplayan \xFC\xE7\xFCnc\xFC taraf analitiklere izin verilebilir. Yap\u0131land\u0131rma profili sunan uygulamalar da bu \u015Fartlara uymal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.6-code-of-conduct",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.6",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.6",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "conduct",
          "dark-patterns",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Uygulama kullan\u0131c\u0131y\u0131 s\xF6m\xFCren ya da kand\u0131ran bir kal\u0131p i\xE7eriyor mu: istemedi\u011Fi sat\u0131n almaya y\xF6nlendirme, gereksiz veri payla\u015F\u0131m\u0131na zorlama, fiyat\u0131 hileli bi\xE7imde art\u0131rma, teslim edilmeyen \xF6zellik ya da i\xE7erik i\xE7in \xFCcret alma, iptali zorla\u015Ft\u0131rma? Ayr\u0131ca App Store yorumlar\u0131na, destek taleplerine ve Apple ile yaz\u0131\u015Fmalara verilen yan\u0131tlar sayg\u0131l\u0131 m\u0131?\n",
        "ruleText": "Herkese sayg\u0131l\u0131 davran; App Store yorumlar\u0131na verdi\u011Fin yan\u0131tlarda, m\xFC\u015Fteri destek taleplerinde ve Apple ile ileti\u015Fimde taciz, ayr\u0131mc\u0131 uygulama, g\xF6zda\u011F\u0131 ve zorbal\u0131k yapma. M\xFC\u015Fteri g\xFCveni uygulama ekosisteminin temel ta\u015F\u0131d\u0131r: uygulamalar kullan\u0131c\u0131lar\u0131 asla avlamamal\u0131, kand\u0131rmamal\u0131, istemedikleri sat\u0131n almalara y\xF6nlendirmemeli, gereksiz veri payla\u015F\u0131m\u0131na zorlamamal\u0131, fiyatlar\u0131 hileli bi\xE7imde art\u0131rmamal\u0131, teslim edilmeyen \xF6zellik veya i\xE7erik i\xE7in \xFCcret almamal\u0131 ya da ba\u015Fka manip\xFClatif uygulamalara ba\u015Fvurmamal\u0131d\u0131r.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.6.1-review-prompts",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.6.1",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.6.1",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "conduct",
          "reviews",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "(1) Uygulama puanlama istemi i\xE7in Apple'\u0131n sa\u011Flad\u0131\u011F\u0131 API'yi mi kullan\u0131yor? \xD6zel/kendi yazd\u0131\u011F\u0131n yorum istemleri kabul edilmiyor. (2) App Store yorumlar\u0131na verdi\u011Fin yan\u0131tlar kullan\u0131c\u0131n\u0131n yorumuna odakl\u0131 m\u0131; ki\u015Fisel bilgi, spam ya da pazarlama i\xE7eriyor mu?\n",
        "ruleText": "App Store m\xFC\u015Fteri yorumlar\u0131 uygulama deneyiminin ayr\u0131lmaz bir par\xE7as\u0131 olabilir; yorumlara yan\u0131t verirken m\xFC\u015Fterilere sayg\u0131l\u0131 davran. Yan\u0131tlar\u0131n kullan\u0131c\u0131n\u0131n yorumuna odakl\u0131 olsun ve ki\u015Fisel bilgi, spam ya da pazarlama i\xE7ermesin. Kullan\u0131c\u0131lardan uygulaman\u0131 de\u011Ferlendirmelerini istemek i\xE7in sa\u011Flanan API'yi kullan; \xF6zel yorum istemlerine izin verilmez.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.6.2-developer-identity",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.6.2",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.6.2",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "conduct",
          "identity",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "App Store'da g\xF6r\xFCnen kimlik bilgileri do\u011Fru mu: sat\u0131c\u0131 ad\u0131, geli\u015Ftirici ad\u0131, ileti\u015Fim bilgisi ve uygulaman\u0131n sundu\u011Fu \u015Feye dair beyanlar? Bilgiler g\xFCncel mi ve Apple ile m\xFC\u015Fteriler kiminle muhatap olduklar\u0131n\u0131 anlayabiliyor mu?\n",
        "ruleText": "Apple'a ve m\xFC\u015Fterilere do\u011Frulanabilir bilgi sunmak m\xFC\u015Fteri g\xFCveni i\xE7in kritiktir. Kendini, i\u015Fletmeni ve sunduklar\u0131n\u0131 App Store'da ya da alternatif da\u011F\u0131t\u0131mda do\u011Fru temsil etmelisin. Verdi\u011Fin bilgi do\u011Fru, ilgili ve g\xFCncel olmal\u0131d\u0131r; b\xF6ylece Apple ve m\xFC\u015Fteriler kiminle muhatap olduklar\u0131n\u0131 anlar ve sorun h\xE2linde sana ula\u015Fabilir.\n",
        "outcome": "manual",
        "defaultSeverity": "medium",
        "version": 1
      },
      {
        "id": "apple-5.6.3-discovery-fraud",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.6.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.6.3",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "conduct",
          "fraud",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "App Store m\xFC\u015Fteri deneyiminin herhangi bir \xF6\u011Fesi manip\xFCle ediliyor mu: listeler/s\u0131ralamalar, arama sonu\xE7lar\u0131, yorumlar ya da uygulamaya gelen y\xF6nlendirmeler? \xDCcretli, te\u015Fvikli, filtrelenmi\u015F veya sahte geri bildirim ile s\u0131ralama \u015Fi\u015Firme, \xFC\xE7\xFCnc\xFC taraf hizmetler arac\u0131l\u0131\u011F\u0131yla yap\u0131lsa bile Developer Program'dan \xE7\u0131kar\u0131lma sebebi.\n",
        "ruleText": "App Store'da yer almak d\xFCr\xFCstl\xFCk ve m\xFC\u015Fteri g\xFCvenini koruma taahh\xFCd\xFC gerektirir. App Store m\xFC\u015Fteri deneyiminin herhangi bir \xF6\u011Fesinin \u2014 listeler, arama, yorumlar ya da uygulamana gelen y\xF6nlendirmeler gibi \u2014 manip\xFCle edilmesi m\xFC\u015Fteri g\xFCvenini zedeler ve buna izin verilmez.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.6.3-rating-prompt-timing",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.6.3",
          "url": "https://developer.apple.com/app-store/review/guidelines/#developer-code-of-conduct",
          "retrievedAt": "2026-08-26"
        },
        "tags": [
          "rating",
          "onboarding",
          "code-of-conduct"
        ],
        "scope": "single",
        "needs": [],
        "facts": [
          "Apple, App Store m\xFC\u015Fteri deneyiminin herhangi bir \xF6\u011Fesini \u2014 s\u0131ralama, arama, YORUM/PUAN veya y\xF6nlendirme \u2014 manip\xFCle etmeyi yasakl\u0131yor.",
          "Somut ihlal bi\xE7imi: kullan\u0131c\u0131 uygulaman\u0131n de\u011Ferini anlamaya f\u0131rsat bulmadan, ilk a\xE7\u0131l\u0131\u015Fta ya da onboarding s\u0131ras\u0131nda puan istemek.",
          "Do\u011Fru yol `SKStoreReviewController.requestReview` ve do\u011Fru AN: kullan\u0131c\u0131 anlaml\u0131 bir i\u015Fi TAMAMLADIKTAN sonra. Apple \xE7a\u011Fr\u0131 say\u0131s\u0131n\u0131 zaten y\u0131lda \xFC\xE7le s\u0131n\u0131rl\u0131yor; sorun s\u0131kl\u0131k de\u011Fil ZAMANLAMA.",
          "Kendi yazd\u0131\u011F\u0131n \xF6zel bir 'bize 5 y\u0131ld\u0131z ver' penceresi, kullan\u0131c\u0131y\u0131 App Store'a y\xF6nlendiren d\xFC\u011Fme, ya da puan kar\u015F\u0131l\u0131\u011F\u0131 \xF6d\xFCl/kredi vermek de ayn\u0131 maddeye giriyor.",
          "Bu davran\u0131\u015F listing'den G\xD6R\xDCLEMEZ \u2014 build'in i\xE7inde. O y\xFCzden kart modele gitmez, insana d\xFC\u015Fer."
        ],
        "question": 'Uygulama puan/yorum isteme penceresini NE ZAMAN g\xF6steriyor? Temiz kur: uygulamay\u0131 sil, yeniden kur ve ilk a\xE7\u0131l\u0131\u015F\u0131 izle. \u0130hlal say\u0131lacaklar: ilk a\xE7\u0131l\u0131\u015Fta veya onboarding s\u0131ras\u0131nda puan istemek; kullan\u0131c\u0131 hen\xFCz anlaml\u0131 bir i\u015F tamamlamadan istemek; kendi yazd\u0131\u011F\u0131n "5 y\u0131ld\u0131z ver" penceresi; puan kar\u015F\u0131l\u0131\u011F\u0131 \xF6d\xFCl/kredi/\xF6zellik a\xE7mak; kullan\u0131c\u0131y\u0131 do\u011Frudan App Store yorum sayfas\u0131na atmak. Temiz say\u0131lan: `SKStoreReviewController.requestReview`, kullan\u0131c\u0131 ger\xE7ek bir i\u015Fi tamamlad\u0131ktan sonra (\xF6r. ilk tasar\u0131m\u0131n\u0131 kaydetti, ilk videosunu \xFCretti).\n',
        "ruleText": "App Store'da yer almak d\xFCr\xFCstl\xFCk ve m\xFC\u015Fteri g\xFCvenini korumaya ba\u011Fl\u0131l\u0131k gerektirir. App Store m\xFC\u015Fteri deneyiminin herhangi bir \xF6\u011Fesini \u2014 s\u0131ralamalar, arama, yorumlar veya y\xF6nlendirmeler \u2014 manip\xFCle etmek m\xFC\u015Fteri g\xFCvenini a\u015F\u0131nd\u0131r\u0131r ve buna izin verilmez.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "apple-5.6.4-app-quality",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "5.6.4",
          "url": "https://developer.apple.com/app-store/review/guidelines/#5.6.4",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "conduct",
          "quality",
          "checklist"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Uygulama hakk\u0131nda a\u015F\u0131r\u0131 m\xFC\u015Fteri \u015Fik\xE2yeti, olumsuz yorum ya da a\u015F\u0131r\u0131 iade talebi var m\u0131? Apple bunlar\u0131 kalite beklentisinin kar\u015F\u0131lanmad\u0131\u011F\u0131n\u0131n g\xF6stergesi say\u0131yor ve Developer Code of Conduct de\u011Ferlendirmesinde kullan\u0131yor.\n",
        "ruleText": "M\xFC\u015Fteriler App Store'dan en y\xFCksek kaliteyi bekler. Uygulaman hakk\u0131nda a\u015F\u0131r\u0131 m\xFC\u015Fteri \u015Fik\xE2yeti \u2014 olumsuz m\xFC\u015Fteri yorumlar\u0131 gibi \u2014 ve a\u015F\u0131r\u0131 iade talepleri bu beklentinin kar\u015F\u0131lanmad\u0131\u011F\u0131n\u0131n g\xF6stergeleridir. Y\xFCksek kaliteyi s\xFCrd\xFCrememek, geli\u015Ftiricinin Developer Code of Conduct'a uyup uymad\u0131\u011F\u0131na karar verirken bir etken olabilir.\n",
        "outcome": "manual",
        "defaultSeverity": "low",
        "version": 1
      },
      {
        "id": "apple-before-you-submit-checklist",
        "platform": "apple",
        "source": {
          "doc": "Apple App Review Guidelines",
          "section": "before-you-submit",
          "url": "https://developer.apple.com/app-store/review/guidelines/#before-you-submit",
          "retrievedAt": "2026-08-21"
        },
        "tags": [
          "checklist",
          "completeness"
        ],
        "scope": "cross",
        "needs": [],
        "question": "Apple'\u0131n g\xF6nderim \xF6ncesi listesi: (1) uygulama \xE7\xF6kme ve hatalara kar\u015F\u0131 test edildi mi, (2) t\xFCm uygulama bilgisi ve metadata eksiksiz ve do\u011Fru mu, (3) App Review sana ula\u015Fabilsin diye ileti\u015Fim bilgin g\xFCncel mi, (4) hesap tabanl\u0131 \xF6zellikler varsa aktif bir demo hesap ya da tam i\u015Flevli demo modu ile incelemeye gereken di\u011Fer kaynaklar (giri\u015F bilgisi, \xF6rnek QR kod, donan\u0131m) verildi mi, (5) arka u\xE7 servisleri inceleme boyunca a\xE7\u0131k m\u0131, (6) apa\xE7\u0131k olmayan \xF6zellikler ve uygulama i\xE7i sat\u0131n almalar App Review notlar\u0131nda \u2014 gerekiyorsa destekleyici belgeyle \u2014 ayr\u0131nt\u0131l\u0131 anlat\u0131ld\u0131 m\u0131?\n",
        "ruleText": "G\xF6nderim \xF6ncesinde: uygulaman\u0131 \xE7\xF6kme ve hatalara kar\u015F\u0131 test et; t\xFCm uygulama bilgisinin ve metadata'n\u0131n eksiksiz ve do\u011Fru oldu\u011Fundan emin ol; App Review'un sana ula\u015Fmas\u0131 gerekirse diye ileti\u015Fim bilgini g\xFCncelle; App Review'a uygulamana tam eri\u015Fim ver (hesap tabanl\u0131 \xF6zellikler varsa aktif bir demo hesap ya da tam i\u015Flevli demo modu ile incelemeye gerekebilecek di\u011Fer donan\u0131m ve kaynaklar); arka u\xE7 servislerini inceleme s\u0131ras\u0131nda canl\u0131 ve eri\u015Filebilir tut; apa\xE7\u0131k olmayan \xF6zellikleri ve uygulama i\xE7i sat\u0131n almalar\u0131 \u2014 uygun oldu\u011Funda destekleyici belgelerle birlikte \u2014 App Review notlar\u0131nda ayr\u0131nt\u0131l\u0131 anlat.\n",
        "outcome": "manual",
        "defaultSeverity": "high",
        "version": 1
      },
      {
        "id": "shared-age-rating-consistency",
        "platform": "both",
        "source": {
          "doc": "Apple App Review Guidelines / Google Play Developer Policy",
          "section": "1.1 / Content Ratings",
          "url": "https://developer.apple.com/app-store/review/guidelines/#safety",
          "retrievedAt": "2026-08-19"
        },
        "tags": [
          "age-rating",
          "safety",
          "vision"
        ],
        "scope": "cross",
        "needs": [
          "ageRating",
          "description",
          "screenshots",
          "category"
        ],
        "facts": [
          "Apple'\u0131n ya\u015F s\u0131n\u0131r\u0131 merdiveni SADECE \u015Fudur, a\u015Fa\u011F\u0131dan yukar\u0131ya: 4+, 9+, 12+, 17+. Google Play'de: Everyone, Everyone 10+, Teen, Mature 17+, Adults only 18+.",
          "17+ Apple'\u0131n EN Y\xDCKSEK derecesidir. Bir uygulama zaten 17+ ise daha yukar\u0131 \xE7\u0131kar\u0131lamaz ve bu kart o uygulama i\xE7in bulgu \xDCRETMEMEL\u0130D\u0130R.",
          "Kullan\u0131c\u0131 i\xE7eri\u011Fi bar\u0131nd\u0131ran, sosyal etkile\u015Fim sunan veya AI ile ger\xE7ek\xE7i insan g\xF6r\xFCnt\xFCs\xFC \xFCreten uygulamalar genellikle 4+ / Everyone derecesine uygun de\u011Fildir.",
          "Kozmetik/v\xFCcut de\u011Fi\u015Ftirme, fl\xF6rt, \u015Fiddet veya m\xFCstehcenli\u011Fe yak\u0131n i\xE7erik daha y\xFCksek ya\u015F s\u0131n\u0131r\u0131 gerektirir."
        ],
        "question": `\xD6NCE BUNA BAK: uygulaman\u0131n beyan edilen ya\u015F s\u0131n\u0131r\u0131 nedir? 17+ (ya da Google'da "Mature 17+"/"Adults only") ise BULGU \xDCRETME ve dur \u2014 zaten en y\xFCksek derecede, y\xFCkseltilecek yer yok. Daha d\xFC\u015F\xFCkse devam et: metin veya ekran g\xF6r\xFCnt\xFCleri m\xFCstehcenli\u011Fe yak\u0131n, v\xFCcut/y\xFCz de\u011Fi\u015Ftirme, fl\xF6rt, \u015Fiddet ya da kullan\u0131c\u0131 i\xE7eri\u011Fi bar\u0131nd\u0131rma i\u015Fareti veriyor mu? Veriyorsa bildir ve \xF6nerinde MEVCUT DERECEDEN DAHA Y\xDCKSEK bir basamak yaz (4+ \u2192 9+ \u2192 12+ \u2192 17+). Mevcut dereceye e\u015Fit ya da ondan d\xFC\u015F\xFCk bir \xF6neri yazma. Emin de\u011Filsen bildirme.
`,
        "ruleText": "Beyan edilen ya\u015F s\u0131n\u0131r\u0131/i\xE7erik derecelendirmesi uygulaman\u0131n ger\xE7ek i\xE7eri\u011Fiyle tutarl\u0131 olmal\u0131d\u0131r.\n",
        "positiveExample": "Ya\u015F s\u0131n\u0131r\u0131 4+ ama a\xE7\u0131klamada 'AI ile v\xFCcudunu yeniden \u015Fekillendir' ve kullan\u0131c\u0131 galerisi var.",
        "negativeExample": "Ya\u015F s\u0131n\u0131r\u0131 zaten 17+ ve uygulama AI ile y\xFCz de\u011Fi\u015Ftirme sunuyor \u2014 en y\xFCksek derecede oldu\u011Fu i\xE7in bulgu yok.",
        "outcome": "risk",
        "defaultSeverity": "medium",
        "version": 2
      }
    ],
    "version": "4cfd320aa974"
  };

  // src/ext/guidelines.generated.ts
  var GUIDELINES = {
    "lastUpdated": "June 8, 2026",
    "retrievedAt": "2026-08-21",
    "digest": "e48b6eb7af1a20f2",
    "sections": [
      {
        "id": "introduction",
        "title": "Introduction",
        "text": "The guiding principle of the App Store is simple\u2014we want to provide a safe experience for users to get apps and a great opportunity for all developers to be successful. We do this by offering a highly curated App Store where every app is reviewed by experts and an editorial team helps users discover new apps every day. We also scan each app for malware and other software that may impact user safety, security, and privacy. These efforts have made Apple\u2019s platforms the safest for consumers around the world.\n\nIn some markets and on certain platforms, developers can also distribute notarized apps from alternative app marketplaces and directly from their website. Learn more about alternative app marketplaces, Web Distribution, and Notarization for iOS and iPadOS apps. You can see which guidelines apply to Notarization for iOS and iPadOS apps by clicking on \u201CHighlight Notarization Review Guidelines Only\u201D in the menu to the left.\n\nFor everything else there is always the open Internet. If the App Store model and guidelines or alternative distribution and Notarization for iOS and iPadOS apps are not best for your app or business idea that\u2019s okay, we provide Safari for a great web experience too.\n\nOn the following pages you will find our latest guidelines arranged into five clear sections: Safety, Performance, Business, Design, and Legal. The App Store is always changing and improving to keep up with the needs of our customers and our products. Your apps should change and improve as well in order to stay on the App Store.\n\nA few other points to keep in mind about distributing your app on our platforms:\n\nWe have lots of kids and teens downloading apps to stay in touch, explore creativity, learn, and grow their independence. Keeping them safe is something we take seriously. Parental controls give parents a powerful way to manage what their child can access and when \u2014 but you have to do your part too. Make sure kids are getting age-appropriate experiences inside your app.\n\nThe App Store is a great way to reach hundreds of millions of people around the world. If you build an app that you just want to show to family and friends, the App Store isn\u2019t the best way to do that. Consider using Xcode to install your app on a device for free or use Ad Hoc distribution available to Apple Developer Program members. If you\u2019re just getting started, learn more about the Apple Developer Program.\n\nWe strongly support all points of view being represented on the App Store, as long as the apps are respectful to users with differing opinions and the quality of the app experience is great. We will reject apps for any content or behavior that we believe is over the line. What line, you ask? Well, as a Supreme Court Justice once said, \u201CI\u2019ll know it when I see it\u201D. And we think that you will also know it when you cross it.\n\nIf you attempt to cheat the system (for example, by trying to trick the review process, steal user data, copy another developer\u2019s work, manipulate ratings or App Store discovery) your apps will be removed from the store and you will be expelled from the Apple Developer Program.\n\nYou are responsible for making sure everything in your app complies with these guidelines, including ad networks, analytics services, and third-party SDKs, so review and choose them carefully.\n\nSome features and technologies that are not generally available to developers may be offered as an entitlement for limited use cases. For example, we offer entitlements for CarPlay Audio, HyperVisor, and Privileged File Operations.\n\nWe hope these guidelines help you sail through the review process, and that approvals and rejections remain consistent across the board. This is a living document; new apps presenting new questions may result in new rules at any time. Perhaps your app will trigger this. We love this stuff too, and honor what you do. We\u2019re really trying our best to create the best platform in the world for you to express your talents and make a living, too."
      },
      {
        "id": "before-you-submit",
        "title": "Before You Submit",
        "text": "To help your app approval go as smoothly as possible, review the common missteps listed below that can slow down the review process or trigger a rejection. This doesn\u2019t replace the guidelines or guarantee approval, but making sure you can check every item on the list is a good start. If your app no longer functions as intended or you\u2019re no longer actively supporting it, it will be removed from the App Store. Learn more about App Store Improvements.\n\nMake sure you:\n\nTest your app for crashes and bugs\n\nEnsure that all app information and metadata is complete and accurate\n\nUpdate your contact information in case App Review needs to reach you\n\nProvide App Review with full access to your app. If your app includes account-based features, provide either an active demo account or fully-featured demo mode, plus any other hardware or resources that might be needed to review your app (e.g. login credentials or a sample QR code)\n\nEnable backend services so that they\u2019re live and accessible during review\n\nInclude detailed explanations of non-obvious features and in-app purchases in the App Review notes, including supporting documentation where appropriate\n\nCheck whether your app follows guidance in other documentation, such as:\n\nDeveloper Documentation\n\nSwiftUI\n\nUIKit\n\nAppKit\n\nApp extensions\n\nOptimizing Your App\u2019s Data for iCloud Backup\n\nApple File System\n\nApp Store Connect Help\n\nDeveloper Account Help\n\nDesign Guidelines\n\nHuman Interface Guidelines\n\nBrand and Marketing Guidelines\n\nMarketing Resources and Identity Guidelines\n\nApple Pay Marketing Guidelines\n\nAdd to Apple Wallet Guidelines\n\nGuidelines for Using Apple Trademarks and Copyrights\n\nGuidelines that include apply to Notarization for iOS and iPadOS apps."
      },
      {
        "id": "1",
        "title": "Safety",
        "text": "When people install an app from the App Store, they want to feel confident that it\u2019s safe to do so\u2014that the app doesn\u2019t contain upsetting or offensive content, won\u2019t damage their device, and isn\u2019t likely to cause physical harm from its use. We\u2019ve outlined the major pitfalls below, but if you\u2019re looking to shock and offend people, the App Store isn\u2019t the right place for your app. Some of these rules are also included in Notarization for iOS and iPadOS apps."
      },
      {
        "id": "1.1",
        "title": "Objectionable Content",
        "text": "Apps should not include content that is offensive, insensitive, upsetting, intended to disgust, in exceptionally poor taste, or just plain creepy. Examples of such content include:"
      },
      {
        "id": "1.1.1",
        "title": "",
        "text": "Defamatory, discriminatory, or mean-spirited content, including references or commentary about religion, race, sexual orientation, gender, national/ethnic origin, or other targeted groups, particularly if the app is likely to humiliate, intimidate, or harm a targeted individual or group. Professional political satirists and humorists are generally exempt from this requirement."
      },
      {
        "id": "1.1.2",
        "title": "",
        "text": "Realistic portrayals of people or animals being killed, maimed, tortured, or abused, or content that encourages violence. \u201CEnemies\u201D within the context of a game cannot solely target a specific race, culture, real government, corporation, or any other real entity."
      },
      {
        "id": "1.1.3",
        "title": "",
        "text": "Depictions that encourage illegal or reckless use of weapons and dangerous objects, or facilitate the purchase of firearms or ammunition."
      },
      {
        "id": "1.1.4",
        "title": "",
        "text": "Overtly sexual or pornographic material, defined as \u201Cexplicit descriptions or displays of sexual organs or activities intended to stimulate erotic rather than aesthetic or emotional feelings.\u201D This includes \u201Chookup\u201D apps and other apps that may include pornography or be used to facilitate prostitution, or human trafficking and exploitation."
      },
      {
        "id": "1.1.5",
        "title": "",
        "text": "Inflammatory religious commentary or inaccurate or misleading quotations of religious texts."
      },
      {
        "id": "1.1.6",
        "title": "",
        "text": "False information and features, including inaccurate device data or trick/joke functionality, such as fake location trackers. Stating that the app is \u201Cfor entertainment purposes\u201D won\u2019t overcome this guideline. Apps that enable anonymous or prank phone calls or SMS/MMS messaging will be rejected."
      },
      {
        "id": "1.1.7",
        "title": "",
        "text": "Harmful concepts which capitalize or seek to profit on recent or current events, such as violent conflicts, terrorist attacks, and epidemics."
      },
      {
        "id": "1.2",
        "title": "User-Generated Content",
        "text": "Apps with user-generated content present particular challenges, ranging from intellectual property infringement to anonymous bullying. To prevent abuse, apps with user-generated content or social networking services must include:\n\nA method for filtering objectionable material from being posted to the app\n\nA mechanism to report offensive content and timely responses to concerns\n\nThe ability to block abusive users from the service\n\nPublished contact information so users can easily reach you\n\nApps with user-generated content or services that end up being used primarily for pornographic content, Chatroulette-style experiences, random or anonymous chat, objectification of real people (e.g. \u201Chot-or-not\u201D voting), making physical threats, or bullying do not belong on the App Store and may be removed without notice. If your app includes user-generated content from a web-based service, it may display incidental mature \u201CNSFW\u201D content, provided that the content is hidden by default and only displayed when the user turns it on via your website.\n\nIt is your responsibility to remove content that violates this guideline, your terms of service, or your community standards. If we find such content, we will ask you to remove it, and provide a plan to improve your compliance with this guideline. Based on your response, your app may be removed from the App Store until you can demonstrate improvements that bring your app into compliance. Egregious or repeated behavior is grounds for immediate removal of your app from the App Store, and from the Apple Developer Program."
      },
      {
        "id": "1.2.1",
        "title": "Creator Content",
        "text": "Apps which feature content from a specific community of users called \u201Ccreators\u201D are a great opportunity if properly moderated. These apps present a singular, unified experience for customers to interact with various kinds of creator content. They offer tools and programs to help this community of non-developer creators to author, share, and monetize user-generated experiences. These experiences must not change the core features and functionality of the native app\u2014rather, they add content to those structured experiences. These experiences are not native \u201Capps\u201D coded by developers\u2014they are content within the app itself and are treated as user-generated content by App Review. Such creator content may include video, articles, audio, and even casual games. The App Store supports apps offering such user-generated content so long as they follow all Guidelines, including Guideline 1.2 for moderating user-generated content and Guideline 3.1.1 for payments and in-app purchases. You should communicate to users which content requires additional purchases.\n\n(a) Creator apps must provide a way for users to identify content that exceeds the app\u2019s age rating, and use an age restriction mechanism based on verified or declared age to limit access by underage users."
      },
      {
        "id": "1.3",
        "title": "Kids Category",
        "text": "The Kids Category is a great way for people to easily find apps that are designed for children. If you want to participate in the Kids Category, you should focus on creating a great experience specifically for younger users. These apps must not include links out of the app, purchasing opportunities, or other distractions to kids unless reserved for a designated area behind a parental gate. Keep in mind that once customers expect your app to follow the Kids Category requirements, it will need to continue to meet these guidelines in subsequent updates, even if you decide to deselect the category. Learn more about parental gates.\n\nYou must comply with applicable privacy laws around the world relating to the collection of data from children online. Be sure to review the Privacy section of these guidelines for more information. In addition, Kids Category apps may not send personally identifiable information or device information to third parties. Apps in the Kids Category should not include third-party analytics or third-party advertising. This provides a safer experience for kids. In limited cases, third-party analytics may be permitted provided that the services do not collect or transmit the IDFA or any identifiable information about children (such as name, date of birth, email address), their location, or their devices. This includes any device, network, or other information that could be used directly or combined with other information to identify users and their devices. Third-party contextual advertising may also be permitted in limited cases provided that the services have publicly documented practices and policies for Kids Category apps that include human review of ad creatives for age appropriateness."
      },
      {
        "id": "1.4",
        "title": "Physical Harm",
        "text": "If your app behaves in a way that risks physical harm, we may reject it. For example:"
      },
      {
        "id": "1.4.1",
        "title": "",
        "text": "Medical apps that could provide inaccurate data or information, or that could be used for diagnosing or treating patients may be reviewed with greater scrutiny.\n\nApps must clearly disclose data and methodology to support accuracy claims relating to health measurements, and if the level of accuracy or methodology cannot be validated, we will reject your app. For example, apps that claim to take x-rays, measure blood pressure, body temperature, blood glucose levels, or blood oxygen levels using only the sensors on the device are not permitted.\n\nApps should remind users to check with a doctor in addition to using the app and before making medical decisions.\n\nIf your medical app has received regulatory clearance, please submit a link to that documentation with your app."
      },
      {
        "id": "1.4.2",
        "title": "",
        "text": "Drug dosage calculators must come from the drug manufacturer, a hospital, university, health insurance company, pharmacy or other approved entity, or receive approval by the FDA or one of its international counterparts. Given the potential harm to patients, we need to be sure that the app will be supported and updated over the long term."
      },
      {
        "id": "1.4.3",
        "title": "",
        "text": "Apps that encourage consumption of tobacco and vape products, illegal drugs, or excessive amounts of alcohol are not permitted. Apps that encourage minors to consume any of these substances will be rejected. Facilitating the sale of controlled substances (except for licensed pharmacies and licensed or otherwise legal cannabis dispensaries), or tobacco is not allowed."
      },
      {
        "id": "1.4.4",
        "title": "",
        "text": "Apps may only display DUI checkpoints that are published by law enforcement agencies, and should never encourage drunk driving or other reckless behavior such as excessive speed."
      },
      {
        "id": "1.4.5",
        "title": "",
        "text": "Apps should not urge customers to participate in activities (like bets, challenges, etc.) or use their devices in a way that risks physical harm to themselves or others."
      },
      {
        "id": "1.5",
        "title": "Developer Information",
        "text": "People need to know how to reach you with questions and support issues. Make sure your app and its Support URL include an easy way to contact you; this is particularly important for apps that may be used in the classroom. Failure to include accurate and up-to-date contact information not only frustrates customers, but may violate the law in some countries or regions. Also ensure that Wallet passes include valid contact information from the issuer and are signed with a dedicated certificate assigned to the brand or trademark owner of the pass."
      },
      {
        "id": "1.6",
        "title": "Data Security",
        "text": "Apps should implement appropriate security measures to ensure proper handling of user information collected pursuant to the Apple Developer Program License Agreement and these Guidelines (see Guideline 5.1 for more information) and prevent its unauthorized use, disclosure, or access by third parties."
      },
      {
        "id": "1.7",
        "title": "Reporting Criminal Activity",
        "text": "Apps for reporting alleged criminal activity must involve local law enforcement, and can only be offered in countries or regions where such involvement is active."
      },
      {
        "id": "2",
        "title": "Performance",
        "text": ""
      },
      {
        "id": "2.1",
        "title": "App Completeness",
        "text": "(a) Submissions to App Review, including apps you make available for pre-order, should be final versions with all necessary metadata and fully functional URLs included; placeholder text, empty websites, and other temporary content should be scrubbed before submission. Make sure your app has been tested on-device for bugs and stability before you submit it, and include demo account info (and turn on your back-end service!) if your app includes a login. If you are unable to provide a demo account due to legal or security obligations, you may include a built-in demo mode in lieu of a demo account with prior approval by Apple. Ensure the demo mode exhibits your app\u2019s full features and functionality. We will reject incomplete app bundles and binaries that crash or exhibit obvious technical problems.\n\n(b) If you offer in-app purchases in your app, make sure they are complete, up-to-date, visible to the reviewer and functional. If any configured in-app purchase items cannot be found or reviewed in your app, explain the reason in your review notes."
      },
      {
        "id": "2.2",
        "title": "Beta Testing",
        "text": "Demos, betas, and trial versions of your app don\u2019t belong on the App Store \u2013 use TestFlight instead. Any app submitted for beta distribution via TestFlight should be intended for public distribution and should comply with the App Review Guidelines. Note, however, that apps using TestFlight cannot be distributed to testers in exchange for compensation of any kind, including as a reward for crowd-sourced funding. Significant updates to your beta build should be submitted to TestFlight App Review before being distributed to your testers. To learn more, visit the TestFlight Beta Testing page."
      },
      {
        "id": "2.3",
        "title": "Accurate Metadata",
        "text": "Customers should know what they\u2019re getting when they download or buy your app, so make sure all your app metadata, including privacy information, your app description, screenshots, and previews accurately reflect the app\u2019s core experience and remember to keep them up-to-date with new versions."
      },
      {
        "id": "2.3.1",
        "title": "",
        "text": "(a) Don\u2019t include any hidden, dormant, or undocumented features in your app; your app\u2019s functionality should be clear to end users and App Review. All new features, functionality, and product changes must be described with specificity in the Notes for Review section of App Store Connect (generic descriptions will be rejected) and accessible for review. Similarly, marketing your app in a misleading way, such as by promoting content or services that it does not actually offer (e.g. iOS-based virus and malware scanners) or promoting a false price, whether within or outside of the App Store, is grounds for removal of your app from the App Store or a block from installing via alternative distribution and termination of your developer account.\n\n(b) Egregious or repeated behavior is grounds for removal from the Apple Developer Program. We work hard to make the App Store a trustworthy ecosystem and expect our app developers to follow suit; if you\u2019re dishonest, we don\u2019t want to do business with you."
      },
      {
        "id": "2.3.2",
        "title": "",
        "text": "If your app includes in-app purchases, make sure your app description, screenshots, and previews clearly indicate whether any featured items, levels, subscriptions, etc. require additional purchases. If you decide to promote in-app purchases on the App Store, ensure that the in-app purchase Display Name, Screenshot and Description are appropriate for a public audience, that you follow the guidance found in Promoting Your In-App Purchases, and that your app properly handles the SKPaymentTransactionObserver method so that customers can seamlessly complete the purchase when your app launches."
      },
      {
        "id": "2.3.3",
        "title": "",
        "text": "Screenshots should show the app in use, and not merely the title art, login page, or splash screen. They may also include text and image overlays (e.g. to demonstrate input mechanisms, such as an animated touch point or Apple Pencil) and show extended functionality on device, such as Touch Bar."
      },
      {
        "id": "2.3.4",
        "title": "",
        "text": "Previews are a great way for customers to see what your app looks like and what it does. To ensure people understand what they\u2019ll be getting with your app, previews may only use video screen captures of the app itself. Stickers and iMessage extensions may show the user experience in the Messages app. You can add narration and video or textual overlays to help explain anything that isn\u2019t clear from the video alone."
      },
      {
        "id": "2.3.5",
        "title": "",
        "text": "Select the most appropriate category for your app, and check out the App Store Category Definitions if you need help. If you\u2019re way off base, we may change the category for you."
      },
      {
        "id": "2.3.6",
        "title": "",
        "text": "Answer the age rating questions in App Store Connect honestly so that your app aligns properly with parental controls. If your app is mis-rated, customers might be surprised by what they get, or it could trigger an inquiry from government regulators. If your app includes media that requires the display of content ratings or warnings (e.g. films, music, games, etc.), you are responsible for complying with local requirements in each territory where your app is available."
      },
      {
        "id": "2.3.7",
        "title": "",
        "text": "Choose a unique app name, assign keywords that accurately describe your app, and don\u2019t try to pack any of your metadata with trademarked terms, popular app names, pricing information, or other irrelevant phrases just to game the system. App names must be limited to 30 characters. Metadata such as app names, subtitles, screenshots, and previews should not include prices, terms, or descriptions that are not specific to the metadata type. App subtitles are a great way to provide additional context for your app; they must follow our standard metadata rules and should not include inappropriate content, reference other apps, or make unverifiable product claims. Apple may modify inappropriate keywords at any time or take other appropriate steps to prevent abuse."
      },
      {
        "id": "2.3.8",
        "title": "",
        "text": "Metadata should be appropriate for all audiences, so make sure your app and in-app purchase icons, screenshots, and previews adhere to a 4+ age rating even if your app is rated higher. For example, if your app is a game that includes violence, select images that don\u2019t depict a gruesome death or a gun pointed at a specific character. Use of terms like \u201CFor Kids\u201D and \u201CFor Children\u201D in app metadata is reserved in the App Store for the Kids Category. Remember to ensure your metadata, including app name and icons (small, large, Apple Watch app, alternate icons, etc.), are similar to avoid creating confusion."
      },
      {
        "id": "2.3.9",
        "title": "",
        "text": "You are responsible for securing the rights to use all materials in your app icons, screenshots, and previews, and you should display fictional account information instead of data from a real person."
      },
      {
        "id": "2.3.10",
        "title": "",
        "text": "Make sure your app is focused on the experience of the Apple platforms it supports, and don\u2019t include names, icons, or imagery of other mobile platforms or alternative app marketplaces in your app or metadata, unless there is specific, approved interactive functionality. Make sure your app metadata is focused on the app itself and its experience. Don\u2019t include irrelevant information."
      },
      {
        "id": "2.3.11",
        "title": "",
        "text": "Apps you submit for pre-order on the App Store must be complete and deliverable as submitted. Ensure that the app you ultimately release is not materially different from what you advertise while the app is in a pre-order state. If you make material changes to the app (e.g. change business models), you should restart your pre-order sales."
      },
      {
        "id": "2.3.12",
        "title": "",
        "text": "Apps must clearly describe new features and product changes in their \u201CWhat\u2019s New\u201D text. Simple bug fixes, security updates, and performance improvements may rely on a generic description, but more significant changes must be listed in the notes."
      },
      {
        "id": "2.3.13",
        "title": "",
        "text": "In-app events are timely events that happen within your app. To feature your event on the App Store, it must fall within an event type provided in App Store Connect. All event metadata must be accurate and pertain to the event itself, rather than the app more generally. Events must happen at the times and dates you select in App Store Connect, including across multiple storefronts. You may monetize your event so long as you follow the rules set forth in Section 3 on Business. And your event deep link must direct users to the proper destination within your app. Read In-App Events for detailed guidance on acceptable event metadata and event deep links."
      },
      {
        "id": "2.4",
        "title": "Hardware Compatibility",
        "text": ""
      },
      {
        "id": "2.4.1",
        "title": "",
        "text": "To ensure people get the most out of your app, iPhone apps should run on iPad whenever possible. We encourage you to consider building apps so customers can use them on all of their devices."
      },
      {
        "id": "2.4.2",
        "title": "",
        "text": "Design your app to use power efficiently and be used in a way that does not risk damage to the device. Apps should not rapidly drain battery, generate excessive heat, or put unnecessary strain on device resources. For example, apps should not encourage placing the device under a mattress or pillow while charging or perform excessive write cycles to the solid state drive. Apps, including any third-party advertisements displayed within them, may not run unrelated background processes, such as cryptocurrency mining."
      },
      {
        "id": "2.4.3",
        "title": "",
        "text": "People should be able to use your Apple TV app without the need for hardware inputs beyond the Siri remote or third-party game controllers, but feel free to provide enhanced functionality when other peripherals are connected. If you require a game controller, make sure you clearly explain that in your metadata so customers know they need additional equipment to play."
      },
      {
        "id": "2.4.4",
        "title": "",
        "text": "Apps should never suggest or require a restart of the device or modifications to system settings unrelated to the core functionality of the app. For example, don\u2019t encourage users to turn off Wi-Fi, disable security features, etc."
      },
      {
        "id": "2.4.5",
        "title": "",
        "text": "Apps distributed via the Mac App Store have some additional requirements to keep in mind:\n\n(i) They must be appropriately sandboxed, and follow macOS File System Documentation. They should also only use the appropriate macOS APIs for modifying user data stored by other apps (e.g. bookmarks, Address Book, or Calendar entries).\n\n(ii) They must be packaged and submitted using technologies provided in Xcode; no third-party installers allowed. They must also be self-contained, single app installation bundles and cannot install code or resources in shared locations.\n\n(iii) They may not auto-launch or have other code run automatically at startup or login without consent nor spawn processes that continue to run without consent after a user has quit the app. They should not automatically add their icons to the Dock or leave shortcuts on the user desktop.\n\n(iv) They may not download or install standalone apps, kexts, additional code, or resources to add functionality or significantly change the app from what we see during the review process.\n\n(v) They may not request escalation to root privileges or use setuid attributes.\n\n(vi) They may not present a license screen at launch, require license keys, or implement their own copy protection.\n\n(vii) They must use the Mac App Store to distribute updates; other update mechanisms are not allowed.\n\n(viii) Apps should run on the currently shipping OS and may not use deprecated or optionally installed technologies (e.g. Java)\n\n(ix) Apps must contain all language and localization support in a single app bundle."
      },
      {
        "id": "2.5",
        "title": "Software Requirements",
        "text": ""
      },
      {
        "id": "2.5.1",
        "title": "",
        "text": "Apps may only use public APIs and must run on the currently shipping OS. Learn more about public APIs. Keep your apps up-to-date and make sure you phase out any deprecated features, frameworks or technologies that will no longer be supported in future versions of an OS. Apps should use APIs and frameworks for their intended purposes and indicate that integration in their app description. For example, the HomeKit framework should provide home automation services; and HealthKit should be used for health and fitness purposes and integrate with the Health app."
      },
      {
        "id": "2.5.2",
        "title": "",
        "text": "Apps should be self-contained in their bundles, and may not read or write data outside the designated container area, nor may they download, install, or execute code which introduces or changes features or functionality of the app, including other apps. Educational apps designed to teach, develop, or allow students to test executable code may, in limited circumstances, download code provided that such code is not used for other purposes. Such apps must make the source code provided by the app completely viewable and editable by the user."
      },
      {
        "id": "2.5.3",
        "title": "",
        "text": "Apps that transmit viruses, files, computer code, or programs that may harm or disrupt the normal operation of the operating system and/or hardware features, including Push Notifications and Game Center, will be rejected. Egregious violations and repeat behavior will result in removal from the Apple Developer Program."
      },
      {
        "id": "2.5.4",
        "title": "",
        "text": "Multitasking apps may only use background services for their intended purposes: VoIP, audio playback, location, task completion, local notifications, etc."
      },
      {
        "id": "2.5.5",
        "title": "",
        "text": "Apps must be fully functional on IPv6-only networks."
      },
      {
        "id": "2.5.6",
        "title": "",
        "text": "Apps that browse the web must use the appropriate WebKit framework and WebKit JavaScript. You may apply for an entitlement to use an alternative web browser engine in your app. Learn more about these entitlements for the EU and Japan."
      },
      {
        "id": "2.5.7",
        "title": "",
        "text": "Intentionally omitted."
      },
      {
        "id": "2.5.8",
        "title": "",
        "text": "Apps that create alternate desktop/home screen environments will be rejected."
      },
      {
        "id": "2.5.9",
        "title": "",
        "text": "Apps that alter or disable the functions of standard switches, such as the Volume Up/Down and Ring/Silent switches, or other native user interface elements or behaviors will be rejected. For example, apps should not block links out to other apps or other features that users would expect to work a certain way."
      },
      {
        "id": "2.5.10",
        "title": "",
        "text": "Intentionally omitted."
      },
      {
        "id": "2.5.11",
        "title": "",
        "text": "SiriKit and Shortcuts\n\n(i) Apps integrating SiriKit and Shortcuts should only sign up for intents they can handle without the support of an additional app and that users would expect from the stated functionality. For example, if your app is a meal planning app, you should not incorporate an intent to start a workout, even if the app shares integration with a fitness app.\n\n(ii) Ensure that the vocabulary and phrases in your plist pertains to your app and the Siri functionality of the intents the app has registered for. Aliases must relate directly to your app or company name and should not be generic terms or include third-party app names or services.\n\n(iii) Resolve the Siri request or Shortcut in the most direct way possible and do not insert ads or other marketing between the request and its fulfillment. Only request a disambiguation when required to complete the task (e.g. asking the user to specify a particular type of workout)."
      },
      {
        "id": "2.5.12",
        "title": "",
        "text": "Apps using CallKit or including an SMS Fraud Extension should only block phone numbers that are confirmed spam. Apps that include call-, SMS-, and MMS- blocking functionality or spam identification must clearly identify these features in their marketing text and explain the criteria for their blocked and spam lists. You may not use the data accessed via these tools for any purpose not directly related to operating or improving your app or extension (e.g. you may not use, share, or sell it for tracking purposes, creating user profiles, etc.)."
      },
      {
        "id": "2.5.13",
        "title": "",
        "text": "Apps using facial recognition for account authentication must use LocalAuthentication (and not ARKit or other facial recognition technology) where possible, and must use an alternate authentication method for users under 13 years old."
      },
      {
        "id": "2.5.14",
        "title": "",
        "text": "Apps must request explicit user consent and provide a clear visual and/or audible indication when recording, logging, or otherwise making a record of user activity. This includes any use of the device camera, microphone, screen recordings, or other user inputs."
      },
      {
        "id": "2.5.15",
        "title": "",
        "text": "Apps that enable users to view and select files should include items from the Files app and the user\u2019s iCloud documents."
      },
      {
        "id": "2.5.16",
        "title": "",
        "text": "Widgets, extensions, and notifications should be related to the content and functionality of your app.\n\n(a) Additionally, all App Clip features and functionality must be included in the main app binary. App Clips cannot contain advertising."
      },
      {
        "id": "2.5.17",
        "title": "",
        "text": "Apps that support Matter must use Apple\u2019s support framework for Matter to initiate pairing. In addition, if you choose to use any Matter software component in your app other than the Matter SDK provided by Apple, the software component must be certified by the Connectivity Standards Alliance for the platform it runs on."
      },
      {
        "id": "2.5.18",
        "title": "",
        "text": "Display advertising should be limited to your main app binary, and should not be included in extensions, App Clips, widgets, notifications, keyboards, watchOS apps, etc. Ads displayed in an app must be appropriate for the app\u2019s age rating, allow the user to see all information used to target them for that ad (without requiring the user to leave the app), and may not engage in targeted or behavioral advertising based on sensitive user data such as health/medical data (e.g. from the HealthKit APIs), school and classroom data (e.g. from ClassKit), or from kids (e.g. from apps in the App Store\u2019s Kids Category), etc. Interstitial ads or ads that interrupt or block the user experience must clearly indicate that they are an ad, must not manipulate or trick users into tapping into them, and must provide easily accessible and visible close/skip buttons large enough for people to easily dismiss the ad. Apps that contain ads must also include the ability for users to report any inappropriate or age-inappropriate ads."
      },
      {
        "id": "3",
        "title": "Business",
        "text": "There are many ways to monetize your app on the App Store. If your business model isn\u2019t obvious, make sure to explain in its metadata and App Review notes. If we can\u2019t understand how your app works or your in-app purchases aren\u2019t immediately obvious, it will delay your review and may trigger a rejection. And while pricing is up to you, we won\u2019t distribute apps and in-app purchase items that are clear rip-offs. We\u2019ll reject expensive apps that try to cheat users with irrationally high prices.\n\nIf we find that you have attempted to manipulate reviews, inflate your chart rankings with paid, incentivized, filtered, or fake feedback, or engage with third-party services to do so on your behalf, we will take steps to preserve the integrity of the App Store, which may include expelling you from the Apple Developer Program."
      },
      {
        "id": "3.1",
        "title": "Payments",
        "text": ""
      },
      {
        "id": "3.1.1",
        "title": "In-App Purchase",
        "text": "If you want to unlock features or functionality within your app, (by way of example: subscriptions, in-game currencies, game levels, access to premium content, or unlocking a full version), you must use in-app purchase. Apps may not use their own mechanisms to unlock content or functionality, such as license keys, augmented reality markers, QR codes, cryptocurrencies and cryptocurrency wallets, etc.\n\nApps may use in-app purchase currencies to enable customers to \u201Ctip\u201D the developer or digital content providers in the app.\n\nAny credits or in-game currencies purchased via in-app purchase may not expire, and you should make sure you have a restore mechanism for any restorable in-app purchases.\n\nApps may enable gifting of items that are eligible for in-app purchase to others. Such gifts may only be refunded to the original purchaser and may not be exchanged.\n\nApps distributed via the Mac App Store may host plug-ins or extensions that are enabled with mechanisms other than the App Store.\n\nApps offering \u201Cloot boxes\u201D or other mechanisms that provide randomized virtual items for purchase must disclose the odds of receiving each type of item to customers prior to purchase.\n\nDigital gift cards, certificates, vouchers, and coupons which can be redeemed for digital goods or services can only be sold in your app using in-app purchase. Physical gift cards that are sold within an app and then mailed to customers may use payment methods other than in-app purchase.\n\nNon-subscription apps may offer a free time-based trial period before presenting a full unlock option by setting up a Non-Consumable IAP item at Price Tier 0 that follows the naming convention: \u201CXX-day Trial.\u201D Prior to the start of the trial, your app must clearly identify its duration, the content or services that will no longer be accessible when the trial ends, and any downstream charges the user would need to pay for full functionality. Learn more about managing content access and the duration of the trial period using Receipts and DeviceCheck.\n\nApps may use in-app purchase to sell and sell services related to non-fungible tokens (NFTs), such as minting, listing, and transferring. Apps may allow users to view their own NFTs, provided that NFT ownership does not unlock features or functionality within the app. Apps may allow users to browse NFT collections owned by others, provided that, except for apps on the United States storefront, the apps may not include buttons, external links, or other calls to action that direct customers to purchasing mechanisms other than in-app purchase."
      },
      {
        "id": "3.1.1(a)",
        "title": "Link to Other Purchase Methods",
        "text": "Developers may apply for entitlements to provide a link in their app to a website the developer owns or maintains responsibility for in order to purchase digital content or services. These entitlements are not required for developers to include buttons, external links, or other calls to action in their United States storefront apps. Please see additional details below.\n\nStoreKit External Purchase Link Entitlements: apps on the App Store in specific regions may offer in-app purchases and also use a StoreKit External Purchase Link Entitlement to include a link to the developer\u2019s website that informs users of other ways to purchase digital goods or services. Learn more about these entitlements. In accordance with the entitlement agreements, the link may inform users about where and how to purchase those in-app purchase items, and the fact that such items may be available for a comparatively lower price. The entitlements are limited to use only in the iOS or iPadOS App Store in specific storefronts. In all other storefronts, except for the United States storefront, where this prohibition does not apply, apps and their metadata may not include buttons, external links, or other calls to action that direct customers to purchasing mechanisms other than in-app purchase.\n\nMusic Streaming Services Entitlements: music streaming apps in specific regions can use Music Streaming Services Entitlements to include a link (which may take the form of a buy button) to the developer\u2019s website that informs users of other ways to purchase digital music content or services. These entitlements also permit music streaming app developers to invite users to provide their email address for the express purpose of sending them a link to the developer\u2019s website to purchase digital music content or services. Learn more about these entitlements. In accordance with the entitlement agreements, the link may inform users about where and how to purchase those in-app purchase items, and the price of such items. The entitlements are limited to use only in the iOS or iPadOS App Store in specific storefronts. In all other storefronts, streaming music apps and their metadata may not include buttons, external links, or other calls to action that direct customers to purchasing mechanisms other than in-app purchase.\n\nIf your app engages in misleading marketing practices, scams, or fraud in relation to the entitlement, your app will be removed from the App Store and you may be removed from the Apple Developer Program."
      },
      {
        "id": "3.1.2",
        "title": "Subscriptions",
        "text": "Apps may offer auto-renewable in-app purchase subscriptions, regardless of category on the App Store. When incorporating auto-renewable subscriptions into your app, be sure to follow the guidelines below."
      },
      {
        "id": "3.1.2(a)",
        "title": "Permissible uses",
        "text": "If you offer an auto-renewable subscription, you must provide ongoing value to the customer, and the subscription period must last at least seven days and be available across all of the user\u2019s devices. While the following list is not exhaustive, examples of appropriate subscriptions include: new game levels; episodic content; multiplayer support; apps that offer consistent, substantive updates; access to large collections of, or continually updated, media content; software as a service (\u201CSAAS\u201D); and cloud support. In addition:\n\nSubscriptions may be offered alongside \xE0 la carte offerings (e.g. you may offer a subscription to an entire library of films as well the purchase or rental of a single movie).\n\nGames offered in a streaming game service subscription may offer a single subscription that is shared across third-party apps and services; however, they must be downloaded directly from the App Store, must be designed to avoid duplicate payment by a subscriber, and should not disadvantage non-subscriber customers.\n\nSubscriptions must work on all of the user\u2019s devices where the app is available. Learn more about sharing a subscription across your apps.\n\nAs with all apps, those offering subscriptions should allow a user to get what they\u2019ve paid for without performing additional tasks, such as posting on social media, uploading contacts, checking in to the app a certain number of times, etc.\n\nSubscriptions may include consumable credits, gems, in-game currencies, etc., and you may offer subscriptions that include access to discounted consumable goods (e.g. a platinum membership that exposes gem-packs for a reduced price).\n\nIf you are changing your existing app to a subscription-based business model, you should not take away the primary functionality existing users have already paid for. For example, let customers who have already purchased a \u201Cfull game unlock\u201D continue to access the full game after you introduce a subscription model for new customers.\n\nAuto-renewable subscription apps may offer a free trial period to customers by providing the relevant information set forth in App Store Connect. Learn more about providing subscription offers.\n\nApps that attempt to scam users will be removed from the App Store. This includes apps that attempt to trick users into purchasing a subscription under false pretenses or engage in bait-and-switch and scam practices; these will be removed from the App Store and you may be removed from the Apple Developer Program.\n\nCellular carrier apps may include auto-renewable music and video subscriptions when purchased in bundles with new cellular data plans, with prior approval by Apple. Other auto-renewable subscriptions may also be included in bundles when purchased with new cellular data plans, with prior approval by Apple, if the cellular carrier apps support in-app purchase for users. Such subscriptions cannot include access to or discounts on consumable items, and the subscriptions must terminate coincident with the cellular data plan."
      },
      {
        "id": "3.1.2(b)",
        "title": "Upgrades and Downgrades",
        "text": "Users should have a seamless upgrade/downgrade experience and should not be able to inadvertently subscribe to multiple variations of the same thing. Review best practices on managing your subscription upgrade and downgrade options."
      },
      {
        "id": "3.1.2(c)",
        "title": "Subscription Information",
        "text": "Before asking a customer to subscribe, you should clearly describe what the user will get for the price. How many issues per month? How much cloud storage? What kind of access to your service? Ensure you clearly communicate the requirements described in Schedule 2 of the Apple Developer Program License Agreement."
      },
      {
        "id": "3.1.3",
        "title": "Other Purchase Methods",
        "text": "The following apps may use purchase methods other than in-app purchase. Apps in this section cannot, within the app, encourage users to use a purchasing method other than in-app purchase, except for apps on the United States storefront and as set forth in 3.1.1(a) and 3.1.3(a). Developers can send communications outside of the app to their user base about purchasing methods other than in-app purchase."
      },
      {
        "id": "3.1.3(a)",
        "title": "\u201CReader\u201D Apps",
        "text": "Apps may allow a user to access previously purchased content or content subscriptions (specifically: magazines, newspapers, books, audio, music, and video). Reader apps may offer account creation for free tiers, and account management functionality for existing customers. Reader app developers may apply for the External Link Account Entitlement to provide an informational link in their app to a web site the developer owns or maintains responsibility for in order to create or manage an account. This entitlement is not required for developers to include buttons, external links, or other calls to action in their United States storefront apps. Learn more about the External Link Account Entitlement."
      },
      {
        "id": "3.1.3(b)",
        "title": "Multiplatform Services",
        "text": "Apps that operate across multiple platforms may allow users to access content, subscriptions, or features they have acquired in your app on other platforms or your web site, including consumable items in multi-platform games, provided those items are also available as in-app purchases within the app."
      },
      {
        "id": "3.1.3(c)",
        "title": "Enterprise Services",
        "text": "If your app is only sold directly by you to organizations or groups for their employees or students (for example professional databases and classroom management tools), you may allow enterprise users to access previously-purchased content or subscriptions. Consumer, single user, or family sales must use in-app purchase."
      },
      {
        "id": "3.1.3(d)",
        "title": "Person-to-Person Services",
        "text": "If your app enables the purchase of real-time person-to-person services between two individuals (for example tutoring students, medical consultations, real estate tours, or fitness training), you may use purchase methods other than in-app purchase to collect those payments. One-to-few and one-to-many real-time services must use in-app purchase."
      },
      {
        "id": "3.1.3(e)",
        "title": "Goods and Services Outside of the App",
        "text": "If your app enables people to purchase physical goods or services that will be consumed outside of the app, you must use purchase methods other than in-app purchase to collect those payments, such as Apple Pay or traditional credit card entry."
      },
      {
        "id": "3.1.3(f)",
        "title": "Free Stand-alone Apps",
        "text": "Free apps acting as a stand-alone companion to a paid web based tool (i.e. VoIP, Cloud Storage, Email Services, Web Hosting) do not need to use in-app purchase, provided there is no purchasing inside the app, or calls to action for purchase outside of the app."
      },
      {
        "id": "3.1.3(g)",
        "title": "Advertising Management Apps",
        "text": "Apps for the sole purpose of allowing advertisers (persons or companies that advertise a product, service, or event) to purchase and manage advertising campaigns across media types (television, outdoor, websites, apps, etc.) do not need to use in-app purchase. These apps are intended for campaign management purposes and do not display the advertisements themselves. Digital purchases for content that is experienced or consumed in an app, including buying advertisements to display in the same app (such as sales of \u201Cboosts\u201D for posts in a social media app) must use in-app purchase."
      },
      {
        "id": "3.1.4",
        "title": "Hardware-Specific Content",
        "text": "In limited circumstances, such as when features are dependent upon specific hardware to function, the app may unlock that functionality without using in-app purchase (e.g. an astronomy app that adds features when synced with a telescope). App features that work in combination with an approved physical product (such as a toy) on an optional basis may unlock functionality without using in-app purchase, provided that an in-app purchase option is available as well. You may not, however, require users to purchase unrelated products or engage in advertising or marketing activities to unlock app functionality."
      },
      {
        "id": "3.1.5",
        "title": "Cryptocurrencies",
        "text": "(i) Wallets: Apps may facilitate virtual currency storage, provided they are offered by developers enrolled as an organization.\n\n(ii) Mining: Apps may not mine for cryptocurrencies unless the processing is performed off device (e.g. cloud-based mining).\n\n(iii) Exchanges: Apps may facilitate transactions or transmissions of cryptocurrency on an approved exchange, provided they are offered only in countries or regions where the app has appropriate licensing and permissions to provide a cryptocurrency exchange.\n\n(iv) Initial Coin Offerings: Apps facilitating Initial Coin Offerings (\u201CICOs\u201D), cryptocurrency futures trading, and other crypto-securities or quasi-securities trading must come from established banks, securities firms, futures commission merchants (\u201CFCM\u201D), or other approved financial institutions and must comply with all applicable law.\n\n(v) Cryptocurrency apps may not offer currency for completing tasks, such as downloading other apps, encouraging other users to download, posting to social networks, etc."
      },
      {
        "id": "3.2",
        "title": "Other Business Model Issues",
        "text": "The lists below are not exhaustive, and your submission may trigger a change or update to our policies, but here are some additional dos and don\u2019ts to keep in mind:"
      },
      {
        "id": "3.2.1",
        "title": "Acceptable",
        "text": "(i) Displaying your own apps for purchase or promotion within your app, provided the app is not merely a catalog of your apps.\n\n(ii) Displaying or recommending a collection of third-party apps that are designed for a specific approved need (e.g. health management, aviation, accessibility). Your app should provide robust editorial content so that it doesn\u2019t seem like a mere storefront.\n\n(iii) Disabling access to specific approved rental content (e.g. films, television programs, music, books) after the rental period has expired; all other items and services may not expire.\n\n(iv) Wallet passes can be used to make or receive payments, transmit offers, or offer identification (such as movie tickets, coupons, and VIP credentials). Other uses may result in the rejection of the app and the revocation of Wallet credentials.\n\n(v) Insurance apps must be free, in legal compliance in the regions distributed, and cannot use in-app purchase.\n\n(vi) Approved nonprofits may fundraise directly within their own apps or third-party apps, provided those fundraising campaigns adhere to all App Review Guidelines and offer Apple Pay support. These apps must disclose how the funds will be used, abide by all required local and federal laws, and ensure appropriate tax receipts are available to donors. Additional information shall be provided to App Review upon request. Nonprofit platforms that connect donors to other nonprofits must ensure that every nonprofit listed in the app has also gone through the nonprofit approval process. Learn more about becoming an approved nonprofit.\n\n(vii) Apps may enable individual users to give a monetary gift to another individual without using in-app purchase, provided that (a) the gift is a completely optional choice by the giver, and (b) 100% of the funds go to the receiver of the gift. However, a gift that is connected to or associated at any point in time with receiving digital content or services must use in-app purchase.\n\n(viii) Apps used for financial trading, investing, or money management should be submitted by the financial institution performing such services and must have necessary licensing and permissions in the locations where you make them available."
      },
      {
        "id": "3.2.2",
        "title": "Unacceptable",
        "text": "(i) Creating an interface for displaying third-party apps, extensions, or plug-ins similar to the App Store or as a general-interest collection.\n\n(ii) Intentionally omitted.\n\n(iii) Artificially increasing the number of impressions or click-throughs of ads, as well as apps that are designed predominantly for the display of ads.\n\n(iv) Unless you are an approved nonprofit or otherwise permitted under Section 3.2.1 (vi) above, collecting funds within the app for charities and fundraisers. Apps that seek to raise money for such causes must be free on the App Store and may only collect funds outside of the app, such as via Safari or SMS.\n\n(v) Arbitrarily restricting who may use the app, such as by location or carrier.\n\n(vi) Intentionally omitted.\n\n(vii) Artificially manipulating a user\u2019s visibility, status, or rank on other services unless permitted by that service\u2019s Terms and Conditions.\n\n(viii) Apps that facilitate binary options trading are not permitted on the App Store. Consider a web app instead. Apps that facilitate trading in contracts for difference (\u201CCFDs\u201D) or other derivatives (e.g. FOREX) must be properly licensed in all jurisdictions where the service is available.\n\n(ix) Apps offering personal loans must clearly and conspicuously disclose all loan terms, including but not limited to equivalent maximum Annual Percentage Rate (APR) and payment due date. Loan apps may not charge a maximum APR higher than 36%, including costs and fees, and may not require repayment in full in 60 days or less.\n\n(x) Apps must not force users to rate the app, review the app, download other apps, or other store-related actions in order to access functionality, content, or use of the app. Apps may otherwise incentivize users to take specific actions within apps (e.g. completing a level, watching an ad)."
      },
      {
        "id": "4",
        "title": "Design",
        "text": "Apple customers place a high value on products that are simple, refined, innovative, and easy to use, and that\u2019s what we want to see on the App Store. Coming up with a great design is up to you, but the following are minimum standards for approval to the App Store. And remember that even after your app has been approved, you should update your app to ensure it remains functional and engaging to new and existing customers. Apps that stop working or offer a degraded experience may be removed from the App Store at any time."
      },
      {
        "id": "4.1",
        "title": "Copycats",
        "text": "(a) Come up with your own ideas. We know you have them, so make yours come to life. Don\u2019t simply copy the latest popular app on the App Store, or make some minor changes to another app\u2019s name or UI and pass it off as your own. In addition to risking an intellectual property infringement claim, it makes the App Store harder to navigate and just isn\u2019t fair to your fellow developers.\n\n(b) Submitting apps which impersonate other apps or services is considered a violation of the Developer Code of Conduct and may result in removal from the Apple Developer Program.\n\n(c) You cannot use another developer\u2019s icon, brand, or product name in your app\u2019s icon or name, without approval from the developer."
      },
      {
        "id": "4.2",
        "title": "Minimum Functionality",
        "text": "Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or \u201Capp-like,\u201D it doesn\u2019t belong on the App Store. If your App doesn\u2019t provide some sort of lasting entertainment value or adequate utility, it may not be accepted. Apps that are simply a song or movie should be submitted to the iTunes Store. Apps that are simply a book or game guide should be submitted to the Apple Books Store."
      },
      {
        "id": "4.2.1",
        "title": "",
        "text": "Apps using ARKit should provide rich and integrated augmented reality experiences; merely dropping a model into an AR view or replaying animation is not enough."
      },
      {
        "id": "4.2.2",
        "title": "",
        "text": "Other than catalogs, apps shouldn\u2019t primarily be marketing materials, advertisements, web clippings, content aggregators, or a collection of links."
      },
      {
        "id": "4.2.3",
        "title": "",
        "text": "(i) Your app should work on its own without requiring installation of another app to function.\n\n(ii) If your app needs to download additional resources in order to function on initial launch, disclose the size of the download and prompt users before doing so."
      },
      {
        "id": "4.2.4",
        "title": "",
        "text": "Intentionally omitted."
      },
      {
        "id": "4.2.5",
        "title": "",
        "text": "Intentionally omitted."
      },
      {
        "id": "4.2.6",
        "title": "",
        "text": "Apps created from a commercialized template or app generation service will be rejected unless they are submitted directly by the provider of the app\u2019s content. These services should not submit apps on behalf of their clients and should offer tools that let their clients create customized, innovative apps that provide unique customer experiences. Another acceptable option for template providers is to create a single binary to host all client content in an aggregated or \u201Cpicker\u201D model, for example as a restaurant finder app with separate customized entries or pages for each client restaurant, or as an event app with separate entries for each client event."
      },
      {
        "id": "4.2.7",
        "title": "Remote Desktop Clients",
        "text": "If your remote desktop app acts as a mirror of specific software or services rather than a generic mirror of the host device, it must comply with the following:\n\n(a) The app must only connect to a user-owned host device that is a personal computer or dedicated game console owned by the user, and both the host device and client must be connected on a local and LAN-based network.\n\n(b) Any software or services appearing in the client are fully executed on the host device, rendered on the screen of the host device, and may not use APIs or platform features beyond what is required to stream the Remote Desktop.\n\n(c) All account creation and management must be initiated from the host device.\n\n(d) The UI appearing on the client does not resemble an iOS or App Store view, does not provide a store-like interface, or include the ability to browse, select, or purchase software not already owned or licensed by the user. For the sake of clarity, transactions taking place within mirrored software do not need to use in-app purchase, provided the transactions are processed on the host device.\n\n(e) Thin clients for cloud-based apps are not appropriate for the App Store."
      },
      {
        "id": "4.3",
        "title": "Spam",
        "text": "(a) Don\u2019t create multiple Bundle IDs of the same app (for example, submitting a separate map app for every city in the world instead of a single worldwide map that allows users to search any city). This practice results in unnecessary apps, which makes it hard for users to find the apps they want. If your app has different versions for specific locations, sports teams, universities, etc., consider submitting a single app and providing the variations using in-app purchase.\n\n(b) Don\u2019t submit apps that are indistinguishable from what's already widely available. Opportunistically creating variants of existing app categories or popular apps degrades App Store discovery, reduces overall app quality, and harms both users and developers. Certain kinds of apps, such as dating, flashlight, sound effects, wallpaper, simple timers, and fortune telling, are well established on the App Store and we will not accept new submissions unless they offer a meaningfully different or improved experience. We may remove these apps from the App Store going forward if they are not updated, improved, or do not attract customers. Other kinds of apps, such as drinking games, Kama Sutra, fart, and burp apps, are mediocre, low-quality, or low-effort and do not add value to the App Store. Repeated submissions of this kind may lead to removal from the Apple Developer Program."
      },
      {
        "id": "4.4",
        "title": "Extensions",
        "text": "Apps hosting or containing extensions must comply with the App Extension Programming Guide, the Safari app extensions documentation, or the Safari web extensions documentation and should include some functionality, such as help screens and settings interfaces where possible. You should clearly and accurately disclose what extensions are made available in the app\u2019s marketing text, and the extensions may not include marketing, advertising, or in-app purchases."
      },
      {
        "id": "4.4.1",
        "title": "",
        "text": "Keyboard extensions have some additional rules.\n\nThey must:\n\nProvide keyboard input functionality (e.g. typed characters);\n\nFollow Sticker guidelines if the keyboard includes images or emoji;\n\nProvide a method for progressing to the next keyboard;\n\nRemain functional without full network access and without requiring full access;\n\nCollect user activity only to enhance the functionality of the user\u2019s keyboard extension on the iOS device.\n\nThey must not:\n\nLaunch other apps besides Settings; or\n\nRepurpose keyboard buttons for other behaviors (e.g. holding down the \u201Creturn\u201D key to launch the camera)."
      },
      {
        "id": "4.4.2",
        "title": "",
        "text": "Safari extensions must run on the current version of Safari on the relevant Apple operating system. They may not interfere with System or Safari UI elements and must never include malicious or misleading content or code. Violating this rule will lead to removal from the Apple Developer Program. Safari extensions should not claim access to more websites than strictly necessary to function."
      },
      {
        "id": "4.4.3",
        "title": "",
        "text": "Intentionally omitted."
      },
      {
        "id": "4.5",
        "title": "Apple Sites and Services",
        "text": ""
      },
      {
        "id": "4.5.1",
        "title": "",
        "text": "Apps may use approved Apple RSS feeds such as the iTunes Store RSS feed, but may not scrape any information from Apple sites (e.g. apple.com, the iTunes Store, App Store, App Store Connect, developer portal, etc.) or create rankings using this information."
      },
      {
        "id": "4.5.2",
        "title": "",
        "text": "Apple Music\n\n(i) MusicKit on iOS lets users play Apple Music and their local music library natively from your apps and games. When a user provides permission to their Apple Music account, your app can create playlists, add songs to their library, and play any of the millions of songs in the Apple Music catalog. Users must initiate the playback of an Apple Music stream and be able to navigate using standard media controls such as \u201Cplay,\u201D \u201Cpause,\u201D and \u201Cskip.\u201D Moreover, your app may not require payment or indirectly monetize access to the Apple Music service (e.g. in-app purchase, advertising, requesting user info, etc.). Do not download, upload, or enable sharing of music files sourced from the MusicKit APIs, except as explicitly permitted in MusicKit documentation.\n\n(ii) Using the MusicKit APIs is not a replacement for securing the licenses you might need for a deeper or more complex music integration. For example, if you want your app to play a specific song at a particular moment, or to create audio or video files that can be shared to social media, you\u2019ll need to contact rights-holders directly to get their permission (e.g. synchronization or adaptation rights) and assets. Cover art and other metadata may only be used in connection with music playback or playlists (including screenshots displaying your app\u2019s functionality), and should not be used in any marketing or advertising without getting specific authorization from rights-holders. Make sure to follow the Apple Music Identity Guidelines when integrating Apple Music services in your app.\n\n(iii) Apps that access Apple Music user data, such as playlists and favorites, must clearly disclose this access in the purpose string. Any data collected may not be shared with third parties for any purpose other than supporting or improving the app experience. This data may not be used to identify users or devices, or to target advertising."
      },
      {
        "id": "4.5.3",
        "title": "",
        "text": "Do not use Apple Services to spam, phish, or send unsolicited messages to customers, including Game Center, Push Notifications, Live Activities, etc. Do not attempt to reverse lookup, trace, relate, associate, mine, harvest, or otherwise exploit Player IDs, aliases, or other information obtained through Game Center, or you will be removed from the Apple Developer Program."
      },
      {
        "id": "4.5.4",
        "title": "",
        "text": "Push Notifications must not be required for the app to function, and should not be used to send sensitive personal or confidential information. Push Notifications should not be used for promotions or direct marketing purposes unless customers have explicitly opted in to receive them via consent language displayed in your app\u2019s UI, and you provide a method in your app for a user to opt out from receiving such messages. Abuse of these services may result in revocation of your privileges."
      },
      {
        "id": "4.5.5",
        "title": "",
        "text": "Only use Game Center Player IDs in a manner approved by the Game Center terms and do not display them in the app or to any third party."
      },
      {
        "id": "4.5.6",
        "title": "",
        "text": "Apps may use Unicode characters that render as Apple emoji in their app and app metadata. Apple emoji may not be used on other platforms or embedded directly in your app binary."
      },
      {
        "id": "4.6",
        "title": "",
        "text": "Intentionally omitted."
      },
      {
        "id": "4.7",
        "title": "Mini apps, mini games, streaming games, chatbots, plug-ins, and game emulators",
        "text": "Apps may offer certain software that is not embedded in the binary, specifically HTML5 and JavaScript mini apps and mini games, streaming games, chatbots, and plug-ins. Additionally, retro game console and PC emulator apps can offer to download games. You are responsible for all such software offered in your app, including ensuring that such software complies with these Guidelines and all applicable laws. Software that does not comply with one or more guidelines will lead to the rejection of your app. You must also ensure that the software adheres to the additional rules that follow in 4.7.1 through 4.7.5. These additional rules are important to preserve the experience that App Store customers expect, and to help ensure user safety."
      },
      {
        "id": "4.7.1",
        "title": "",
        "text": "Software offered in apps under this rule must:\nfollow all privacy guidelines, including but not limited to the rules set forth in Guideline 5.1 concerning collection, use, and sharing of data, and sensitive data (such as health and personal data from kids);\n\ninclude a method for filtering objectionable material, a mechanism to report content and timely responses to concerns, and the ability to block abusive users; and\n\nfollow Guideline 3.1 in order to offer digital goods or services to end users."
      },
      {
        "id": "4.7.2",
        "title": "",
        "text": "Your app may not extend or expose native platform APIs or technologies to the software without prior permission from Apple."
      },
      {
        "id": "4.7.3",
        "title": "",
        "text": "Your app may not share data or privacy permissions to any individual software offered in your app without explicit user consent in each instance."
      },
      {
        "id": "4.7.4",
        "title": "",
        "text": "You must provide an index of software and metadata available in your app. It must include universal links that lead to all of the software offered in your app."
      },
      {
        "id": "4.7.5",
        "title": "",
        "text": "Your app must provide a way for users to identify software that exceeds the app\u2019s age rating, and use an age restriction mechanism based on verified or declared age to limit access by underage users."
      },
      {
        "id": "4.8",
        "title": "Login Services",
        "text": "Apps that use a third-party or social login service (such as Facebook Login, Google Sign-In, Log in with X, Sign In with LinkedIn, Login with Amazon, or WeChat Login) to set up or authenticate the user\u2019s primary account with the app must also offer as an equivalent option another login service with the following features:\n\nthe login service limits data collection to the user\u2019s name and email address;\n\nthe login service allows users to keep their email address private as part of setting up their account; and\n\nthe login service does not collect interactions with your app for advertising purposes without consent.\n\nA user\u2019s primary account is the account they establish with your app for the purposes of identifying themselves, signing in, and accessing your features and associated services.\n\nAnother login service is not required if:\n\nYour app exclusively uses your company\u2019s own account setup and sign-in systems.\n\nYour app is an alternative app marketplace, or an app distributed from an alternative app marketplace, that uses a marketplace-specific login for account, download, and commerce features.\n\nYour app is an education, enterprise, or business app that requires the user to sign in with an existing education or enterprise account.\n\nYour app uses a government or industry-backed citizen identification system or electronic ID to authenticate users.\n\nYour app is a client for a specific third-party service and users are required to sign in to their mail, social media, or other third-party account directly to access their content."
      },
      {
        "id": "4.9",
        "title": "Apple Pay",
        "text": "Apps using Apple Pay must provide all material purchase information to the user prior to sale of any good or service and must use Apple Pay branding and user interface elements correctly, as described in the Apple Pay Marketing Guidelines and Human Interface Guidelines. Apps using Apple Pay to offer recurring payments must, at a minimum, disclose the following information:\n\nThe length of the renewal term and the fact that it will continue until canceled\n\nWhat will be provided during each period\n\nThe actual charges that will be billed to the customer\n\nHow to cancel"
      },
      {
        "id": "4.10",
        "title": "Monetizing Built-In Capabilities",
        "text": "You may not monetize built-in capabilities provided by the hardware or operating system, such as Push Notifications, the camera, or the gyroscope; or Apple services and technologies, such as Apple Music access, iCloud storage, or Screen Time APIs."
      },
      {
        "id": "5",
        "title": "Legal",
        "text": "5. Legal\n\nApps must comply with all legal requirements in any location where you make them available (if you\u2019re not sure, check with a lawyer). We know this stuff is complicated, but it is your responsibility to understand and make sure your app conforms with all local laws, not just the guidelines below. And of course, apps that solicit, promote, or encourage criminal or clearly reckless behavior will be rejected. In extreme cases, such as apps that are found to facilitate human trafficking and/or the exploitation of children, appropriate authorities will be notified."
      },
      {
        "id": "5.1",
        "title": "Privacy",
        "text": "Protecting user privacy is paramount in the Apple ecosystem, and you should use care when handling personal data to ensure you\u2019ve complied with privacy best practices, applicable laws, and the terms of the Apple Developer Program License Agreement, not to mention customer expectations. More particularly:"
      },
      {
        "id": "5.1.1",
        "title": "Data Collection and Storage",
        "text": "(i) Privacy Policies: All apps must include a link to their privacy policy in the App Store Connect metadata field and within the app in an easily accessible manner. The privacy policy must clearly and explicitly:\n\nIdentify what data, if any, the app/service collects, how it collects that data, and all uses of that data.\n\nConfirm that any third party with whom an app shares user data (in compliance with these Guidelines)\u2014such as analytics tools, advertising networks and third-party SDKs, as well as any parent, subsidiary or other related entities that will have access to user data\u2014will provide the same or equal protection of user data as stated in the app\u2019s privacy policy and required by these Guidelines.\n\nExplain its data retention/deletion policies and describe how a user can revoke consent and/or request deletion of the user\u2019s data.\n\n(ii) Permission: Apps that collect user or usage data must secure user consent for the collection, even if such data is considered to be anonymous at the time of or immediately following collection. Paid functionality must not be dependent on or require a user to grant access to this data. Apps must also provide the customer with an easily accessible and understandable way to withdraw consent. Ensure your purpose strings clearly and completely describe your use of the data. Apps that collect data for a legitimate interest without consent by relying on the terms of the European Union\u2019s General Data Protection Regulation (\u201CGDPR\u201D) or similar statute must comply with all terms of that law. Learn more about Requesting Permission.\n\n(iii) Data Minimization: Apps should only request access to data relevant to the core functionality of the app and should only collect and use data that is required to accomplish the relevant task. Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos or Contacts.\n\n(iv) Access: Apps must respect the user\u2019s permission settings and not attempt to manipulate, trick, or force people to consent to unnecessary data access. For example, apps that include the ability to post photos to a social network must not also require microphone access before allowing the user to upload photos. Where possible, provide alternative solutions for users who don\u2019t grant consent. For example, if a user declines to share Location, offer the ability to manually enter an address."
      },
      {
        "id": "5.1.1(v)",
        "title": "Account Sign-In",
        "text": "If your app doesn\u2019t include significant account-based features, let people use it without a login. If your app supports account creation, you must also offer account deletion within the app. Apps may not require users to enter personal information to function, except when directly relevant to the core functionality of the app or required by law. If your core app functionality is not related to a specific social network (e.g. Facebook, WeChat, Weibo, X, etc.), you must provide access without a login or via another mechanism. Pulling basic profile information, sharing to the social network, or inviting friends to use the app are not considered core app functionality. The app must also include a mechanism to revoke social network credentials and disable data access between the app and social network from within the app. An app may not store credentials or tokens to social networks off of the device and may only use such credentials or tokens to directly connect to the social network from the app itself while the app is in use.\n\n(vi) Developers that use their apps to surreptitiously discover passwords or other private data will be removed from the Apple Developer Program.\n\n(vii) SafariViewController must be used to visibly present information to users; the controller may not be hidden or obscured by other views or layers. Additionally, an app may not use SafariViewController to track users without their knowledge and consent.\n\n(viii) Apps that compile personal information from any source that is not directly from the user or without the user\u2019s explicit consent, even public databases, are not permitted on the App Store or alternative distribution.\n\n(ix) Apps that provide services in highly regulated fields (such as banking and financial services, healthcare, gambling, legal cannabis use, air travel and crypto exchanges) or that require sensitive user information should be submitted by a legal entity that provides the services, and not by an individual developer. Apps that facilitate the legal sale of cannabis must be geo-restricted to the corresponding legal jurisdiction.\n\n(x) Apps may request basic contact information (such as name and email address) so long as the request is optional for the user, features and services are not conditional on providing the information, and it complies with all other provisions of these guidelines, including limitations on collecting information from kids."
      },
      {
        "id": "5.1.2",
        "title": "Data Use and Sharing",
        "text": "(i) Unless otherwise permitted by law, you may not use, transmit, or share someone\u2019s personal data without first obtaining their permission. You must provide access to information about how and where the data will be used. You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so. Data collected from apps may only be shared with third parties to improve the app or serve advertising (in compliance with the Apple Developer Program License Agreement). You must receive explicit permission from users via the App Tracking Transparency APIs to track their activity. Learn more about tracking. Your app may not require users to enable system functionalities (e.g. push notifications, location services, tracking) in order to access functionality, content, use the app, or receive monetary or other compensation, including but not limited to gift cards and codes. Apps that share user data without user consent or otherwise complying with data privacy laws may be removed from sale and may result in your removal from the Apple Developer Program.\n\n(ii) Data collected for one purpose may not be repurposed without further consent unless otherwise explicitly permitted by law.\n\n(iii) Apps should not attempt to surreptitiously build a user profile based on collected data and may not attempt, facilitate, or encourage others to identify anonymous users or reconstruct user profiles based on data collected from Apple-provided APIs or any data that you say has been collected in an \u201Canonymized,\u201D \u201Caggregated,\u201D or otherwise non-identifiable way.\n\n(iv) Do not use information from Contacts, Photos, or other APIs that access user data to build a contact database for your own use or for sale/distribution to third parties, and don\u2019t collect information about which other apps are installed on a user\u2019s device for the purposes of analytics or advertising/marketing.\n\n(v) Do not contact people using information collected via a user\u2019s Contacts or Photos, except at the explicit initiative of that user on an individualized basis; do not include a Select All option or default the selection of all contacts. You must provide the user with a clear description of how the message will appear to the recipient before sending it (e.g. What will the message say? Who will appear to be the sender?).\n\n(vi) Data gathered from the HomeKit API, HealthKit, Clinical Health Records API, MovementDisorder APIs, ClassKit or from depth and/or facial mapping tools (e.g. ARKit, Camera APIs, or Photo APIs) may not be used for marketing, advertising or use-based data mining, including by third parties. Learn more about best practices for implementing CallKit, HealthKit, ClassKit, and ARKit.\n\n(vii) Apps using Apple Pay may only share user data acquired via Apple Pay with third parties to facilitate or improve delivery of goods and services."
      },
      {
        "id": "5.1.3",
        "title": "Health and Health Research",
        "text": "Health, fitness, and medical data are especially sensitive and apps in this space have some additional rules to make sure customer privacy is protected:\n\n(i) Apps may not use or disclose to third parties data gathered in the health, fitness, and medical research context\u2014including from the Clinical Health Records API, HealthKit API, Motion and Fitness, MovementDisorder APIs, or health-related human subject research\u2014for advertising, marketing, or other use-based data mining purposes other than improving health management, or for the purpose of health research, and then only with permission. Apps may, however, use a user\u2019s health or fitness data to provide a benefit directly to that user (such as a reduced insurance premium), provided that the app is submitted by the entity providing the benefit, and the data is not shared with a third party. You must disclose the specific health data that you are collecting from the device.\n\n(ii) Apps must not write false or inaccurate data into HealthKit or any other medical research or health management apps, and may not store personal health information in iCloud.\n\n(iii) Apps conducting health-related human subject research must obtain consent from participants or, in the case of minors, their parent or guardian. Such consent must include the (a) nature, purpose, and duration of the research; (b) procedures, risks, and benefits to the participant; (c) information about confidentiality and handling of data (including any sharing with third parties); (d) a point of contact for participant questions; and (e) the withdrawal process.\n\n(iv) Apps conducting health-related human subject research must secure approval from an independent ethics review board. Proof of such approval must be provided upon request."
      },
      {
        "id": "5.1.4",
        "title": "Kids",
        "text": "(a) For many reasons, it is critical to use care when dealing with personal data from kids, and we encourage you to carefully review all the requirements for complying with laws like the Children\u2019s Online Privacy Protection Act (\u201CCOPPA\u201D), the European Union\u2019s General Data Protection Regulation (\u201CGDPR\u201D), and any other applicable regulations or laws.\n\nApps may ask for birthdate and parental contact information only for the purpose of complying with these statutes, but must include some useful functionality or entertainment value regardless of a person\u2019s age.\n\nApps intended primarily for kids should not include third-party analytics or third-party advertising. This provides a safer experience for kids.\n\n(b) In limited cases, third-party analytics and third-party advertising may be permitted provided that the services adhere to the same terms set forth in Guideline 1.3.\n\nMoreover, apps in the Kids Category or those that collect, transmit, or have the capability to share personal information (e.g. name, address, email, location, photos, videos, drawings, the ability to chat, other personal data, or persistent identifiers used in combination with any of the above) from a minor must include a privacy policy and must comply with all applicable children\u2019s privacy statutes. For the sake of clarity, the parental gate requirement for the Kid\u2019s Category is generally not the same as securing parental consent to collect personal data under these privacy statutes.\n\nAs a reminder, Guideline 2.3.8 requires that use of terms like \u201CFor Kids\u201D and \u201CFor Children\u201D in app metadata is reserved for the Kids Category. Apps not in the Kids Category cannot include any terms in app name, subtitle, icon, screenshots or description that imply the main audience for the app is children."
      },
      {
        "id": "5.1.5",
        "title": "Location Services",
        "text": "Use Location Services in your app only when it is directly relevant to the features and services provided by the app. Location-based APIs shouldn\u2019t be used to provide emergency services or autonomous control over vehicles, aircraft, and other devices, except for small devices such as lightweight drones and toys, or remote control car alarm systems, etc. Ensure that you notify and obtain consent before collecting, transmitting, or using location data. If your app uses Location Services, be sure to explain the purpose in your app; refer to the Human Interface Guidelines for best practices for doing so."
      },
      {
        "id": "5.2",
        "title": "Intellectual Property",
        "text": "Make sure your app only includes content that you created or that you have a license to use. Your app may be removed if you\u2019ve stepped over the line and used content without permission. Of course, this also means someone else\u2019s app may be removed if they\u2019ve \u201Cborrowed\u201D from your work. If you believe your intellectual property has been infringed by another developer on the App Store, submit a claim via our web form. Laws differ in different countries and regions, but at the very least, make sure to avoid the following common errors:"
      },
      {
        "id": "5.2.1",
        "title": "Generally",
        "text": "Don\u2019t use protected third-party material such as trademarks, copyrighted works, or patented ideas in your app without permission, and don\u2019t include misleading, false, or copycat representations, names, or metadata in your app bundle or developer name. Apps should be submitted by the person or legal entity that owns or has licensed the intellectual property and other relevant rights."
      },
      {
        "id": "5.2.2",
        "title": "Third-Party Sites/Services",
        "text": "If your app uses, accesses, monetizes access to, or displays content from a third-party service, ensure that you are specifically permitted to do so under the service\u2019s terms of use. Authorization must be provided upon request."
      },
      {
        "id": "5.2.3",
        "title": "Audio/Video Downloading",
        "text": "Apps should not facilitate illegal file sharing or include the ability to save, convert, or download media from third-party sources (e.g. Apple Music, YouTube, SoundCloud, Vimeo, etc.) without explicit authorization from those sources. Streaming of audio/video content may also violate Terms of Use, so be sure to check before your app accesses those services. Authorization must be provided upon request."
      },
      {
        "id": "5.2.4",
        "title": "Apple Endorsements",
        "text": "(a) Don\u2019t suggest or imply that Apple is a source or supplier of the App, or that Apple endorses any particular representation regarding quality or functionality.\n\n(b) If your app is selected as an \u201CEditor\u2019s Choice,\u201D Apple will apply the badge automatically."
      },
      {
        "id": "5.2.5",
        "title": "Apple Products",
        "text": "Don\u2019t create an app that appears confusingly similar to an existing Apple product, interface (e.g. Finder), app (such as the App Store, iTunes Store, or Messages) or advertising theme. Apps and extensions, including third-party keyboards and Sticker packs, may not include Apple emoji. Music from iTunes and Apple Music previews may not be used for their entertainment value (e.g. as the background music to a photo collage or the soundtrack to a game) or in any other unauthorized manner. If you provide music previews from iTunes or Apple Music, you must display a link to the corresponding music in iTunes or Apple Music. If your app displays Activity rings, they should not visualize Move, Exercise, or Stand data in a way that resembles the Activity control. The Human Interface Guidelines have more information on how to use Activity rings. If your app displays Apple Weather data, it should follow the attribution requirements provided in the WeatherKit documentation."
      },
      {
        "id": "5.3",
        "title": "Gaming, Gambling, and Lotteries",
        "text": "Gaming, gambling, and lotteries can be tricky to manage and tend to be one of the most regulated offerings on the App Store. Only include this functionality if you\u2019ve fully vetted your legal obligations everywhere you make your app available and are prepared for extra time during the review process. Some things to keep in mind:"
      },
      {
        "id": "5.3.1",
        "title": "",
        "text": "Sweepstakes and contests must be sponsored by the developer of the app."
      },
      {
        "id": "5.3.2",
        "title": "",
        "text": "Official rules for sweepstakes, contests, and raffles must be presented in the app and make clear that Apple is not a sponsor or involved in the activity in any manner."
      },
      {
        "id": "5.3.3",
        "title": "",
        "text": "Apps may not use in-app purchase to purchase credit or currency for use in conjunction with real money gaming of any kind."
      },
      {
        "id": "5.3.4",
        "title": "",
        "text": "Apps that offer real money gaming (e.g. sports betting, poker, casino games, horse racing) or lotteries must have necessary licensing and permissions in the locations where the app is used, must be geo-restricted to those locations, and must be free on the App Store. Illegal gambling aids, including card counters, are not permitted on the App Store. Lottery apps must have consideration, chance, and a prize."
      },
      {
        "id": "5.4",
        "title": "VPN Apps",
        "text": "Apps offering VPN services must utilize the NEVPNManager API and may only be offered by developers enrolled as an organization. You must make a clear declaration of what user data will be collected and how it will be used on an app screen prior to any user action to purchase or otherwise use the service. Apps offering VPN services may not sell, use, or disclose to third parties any data for any purpose, and must commit to this in their privacy policy. VPN apps must not violate local laws, and if you choose to make your VPN app available in a territory that requires a VPN license, you must provide your license information in the App Review Notes field. Parental control, content blocking, and security apps, among others, from approved providers may also use the NEVPNManager API. Apps that do not comply with this guideline will be removed from the App Store and blocked from installing via alternative distribution and you may be removed from the Apple Developer Program."
      },
      {
        "id": "5.5",
        "title": "Mobile Device Management",
        "text": "Mobile Device Management Apps that offer Mobile Device Management (MDM) services must request this capability from Apple. Such apps may only be offered by commercial enterprises, educational institutions, or government agencies, and in limited cases, companies using MDM for parental control services or device security. You must make a clear declaration of what user data will be collected and how it will be used on an app screen prior to any user action to purchase or otherwise use the service. MDM apps must not violate any applicable laws. Apps offering MDM services may not sell, use, or disclose to third parties any data for any purpose, and must commit to this in their privacy policy. In limited cases, third-party analytics may be permitted provided that the services only collect or transmit data about the performance of the developer\u2019s MDM app, and not any data about the user, the user\u2019s device, or other apps used on that device. Apps offering configuration profiles must also adhere to these requirements. Apps that do not comply with this guideline will be removed from the App Store and blocked from installing via alternative distribution and you may be removed from the Apple Developer Program."
      },
      {
        "id": "5.6",
        "title": "Developer Code of Conduct",
        "text": "Please treat everyone with respect, whether in your responses to App Store reviews, customer support requests, or when communicating with Apple, including your responses in App Store Connect. Do not engage in harassment of any kind, discriminatory practices, intimidation, bullying, and don\u2019t encourage others to engage in any of the above. Repeated manipulative or misleading behavior or other fraudulent conduct will lead to your removal from the Apple Developer Program.\n\nCustomer trust is a cornerstone of the App ecosystem. Apps should never prey on users or attempt to rip off customers, trick them into making unwanted purchases, force them to share unnecessary data, raise prices in a tricky manner, charge for features or content that are not delivered, or engage in any other manipulative practices within or outside of the app.\n\nYour Developer Program account will be terminated if you engage in activities or actions that are not in accordance with the Developer Code of Conduct. To restore your account, you may provide a written statement detailing the improvements you plan to make. If your plan is approved by Apple and we confirm the changes have been made, your account may be restored."
      },
      {
        "id": "5.6.1",
        "title": "App Store Reviews",
        "text": "App Store customer reviews can be an integral part of the app experience, so you should treat customers with respect when responding to their comments. Keep your responses targeted to the user\u2019s comments and do not include personal information, spam, or marketing in your response.\n\nUse the provided API to prompt users to review your app; this functionality allows customers to provide an App Store rating and review without the inconvenience of leaving your app, and we will disallow custom review prompts."
      },
      {
        "id": "5.6.2",
        "title": "Developer Identity",
        "text": "Providing verifiable information to Apple and customers is critical to customer trust. Your representation of yourself, your business, and your offerings on the App Store or alternative distribution must be accurate. The information you provide must be truthful, relevant, and up-to-date so that Apple and customers understand who they are engaging with and can contact you regarding any issues."
      },
      {
        "id": "5.6.3",
        "title": "Discovery Fraud",
        "text": "Participating in the App Store requires integrity and a commitment to building and maintaining customer trust. Manipulating any element of the App Store customer experience such as charts, search, reviews, or referrals to your app erodes customer trust and is not permitted."
      },
      {
        "id": "5.6.4",
        "title": "App Quality",
        "text": "Customers expect the highest quality from the App Store, and maintaining high quality content, services, and experiences promotes customer trust. Indications that this expectation is not being met include excessive customer reports about concerns with your app, such as negative customer reviews, and excessive refund requests. Inability to maintain high quality may be a factor in deciding whether a developer is abiding by the Developer Code of Conduct."
      },
      {
        "id": "after-you-submit",
        "title": "After You Submit",
        "text": "Once you\u2019ve submitted your app and metadata in App Store Connect and you\u2019re in the review process, here are some things to keep in mind:\n\nTiming: App Review will examine your app as soon as we can. However, if your app is complex or presents new issues, it may require greater scrutiny and consideration. And remember that if your app is repeatedly rejected for the same guideline violation or you\u2019ve attempted to manipulate the review process, review of your app will take longer to complete. Learn more about App Review.\n\nStatus Updates: The current status of your app will be reflected in App Store Connect, so you can keep an eye on things from there.\n\nExpedite Requests: If you have a critical timing issue, you can request an expedited review. Please respect your fellow developers by seeking expedited review only when you truly need it. If we find you\u2019re abusing this system, we may reject your requests going forward.\n\nRelease Date: If your release date is set for the future, the app will not appear on the App Store until that date, even if it is approved by App Review. And remember that it can take up to 24-hours for your app to appear on all selected storefronts.\n\nRejections: Our goal is to apply these guidelines fairly and consistently, but nobody\u2019s perfect. If your app has been rejected and you have questions or would like to provide additional information, please use App Store Connect to communicate directly with the App Review team. This may help get your app on the store, and it can help us improve the App Review process or identify a need for clarity in our policies.\n\nAppeals: If you disagree with the outcome of your review, please submit an appeal. This may help get your app on the store. You may also suggest changes to the guidelines themselves to help us improve the App Review process or identify a need for clarity in our policies.\n\nBug Fix Submissions: For apps that are already on the App Store or alternative distribution, bug fixes will not be delayed over guideline violations except for those related to legal or safety issues. If your app has been rejected, and qualifies for this process, please use App Store Connect to communicate directly with the App Review team indicating that you would like to take advantage of this process and plan to address the issue in your next submission.\n\nWe\u2019re excited to see what you come up with next!\n\nLast Updated: June 8, 2026"
      }
    ]
  };

  // src/corpus/guidelines.ts
  function findSection(doc, ref) {
    const byId = new Map(doc.sections.map((s) => [s.id, s]));
    const tam = String(ref).trim().replace(/^guideline\s+/i, "").replace(/[^\d.()a-z]/gi, "").replace(/\.+$/, "");
    if (byId.has(tam)) return byId.get(tam);
    const clean = tam.replace(/\(.*$/, "").replace(/[^\d.]/g, "").replace(/\.+$/, "");
    if (!clean) return null;
    let id = clean;
    while (id) {
      const hit = byId.get(id);
      if (hit) return hit;
      if (!id.includes(".")) return null;
      id = id.split(".").slice(0, -1).join(".");
    }
    return null;
  }
  function sectionWithChildren(doc, ref) {
    const root = findSection(doc, ref);
    if (!root) return "";
    const kids = doc.sections.filter(
      (s) => s.id !== root.id && (s.id.startsWith(root.id + ".") || s.id.startsWith(root.id + "("))
    );
    const head = `${root.id}${root.title ? " " + root.title : ""}`;
    const body = [root.text, ...kids.map((k) => `${k.id}${k.title ? " " + k.title : ""} ${k.text}`.trim())].filter(Boolean).join("\n\n");
    return `${head}
${body}`.trim();
  }

  // src/eval/coverage.ts
  function normalizeSection(kod) {
    return String(kod).trim().replace(/^guideline\s+/i, "").replace(/\s*\(.*$/, "").replace(/[^\d.]/g, "").replace(/\.+$/, "");
  }
  function kartKapsiyorMu(kartMadde, redMadde) {
    const k = normalizeSection(kartMadde);
    const r = normalizeSection(redMadde);
    if (!k || !r) return false;
    return r === k || r.startsWith(k + ".");
  }
  function coverage(rejects, cards) {
    const uyarilar = [];
    const tekil = /* @__PURE__ */ new Map();
    for (const r of rejects) tekil.set(r.id, r);
    if (tekil.size !== rejects.length) {
      uyarilar.push(`${rejects.length - tekil.size} m\xFCkerrer red kayd\u0131 elendi.`);
    }
    const gruplar = /* @__PURE__ */ new Map();
    let kodsuz = 0;
    for (const r of tekil.values()) {
      const madde = normalizeSection(r.guideline ?? "");
      if (!madde) {
        kodsuz++;
        continue;
      }
      const g = gruplar.get(madde) ?? { redler: [], uygulamalar: /* @__PURE__ */ new Set() };
      g.redler.push(r);
      if (r.appName) g.uygulamalar.add(r.appName);
      gruplar.set(madde, g);
    }
    const satirlar = [...gruplar.entries()].map(([madde, g]) => ({
      madde,
      redSayisi: g.redler.length,
      uygulamalar: [...g.uygulamalar].sort(),
      kartlar: cards.filter((c) => kartKapsiyorMu(c.source.section, madde)).map((c) => c.id).sort(),
      // Apple'ın gerekçesinin ilk satırları: kart yazacak kişinin ihtiyacı olan
      // tek şey bu. Tam metin depoda duruyor.
      ornek: ozet(g.redler[0]?.text)
    }));
    const sirala = (a, b) => b.redSayisi - a.redSayisi || a.madde.localeCompare(b.madde);
    const bosluklar = satirlar.filter((s) => s.kartlar.length === 0).sort(sirala);
    const kapsananlar = satirlar.filter((s) => s.kartlar.length > 0).sort(sirala);
    if (kodsuz) {
      uyarilar.push(
        `${kodsuz} red madde kodu ta\u015F\u0131m\u0131yor \u2014 kapsan\u0131yor mu B\u0130L\u0130NM\u0130YOR. Oranlar yaln\u0131z kodlu redler \xFCzerinden hesapland\u0131.`
      );
    }
    if (!tekil.size) {
      uyarilar.push("Hi\xE7 red kayd\u0131 yok. \xD6nce \xE7ekim yap; red yoksa bu rapor bir \u015Fey s\xF6ylemez.");
    }
    return {
      toplamRed: tekil.size,
      kodlu: tekil.size - kodsuz,
      kodsuz,
      kartiOlan: kapsananlar.reduce((n, s) => n + s.redSayisi, 0),
      kartiOlmayan: bosluklar.reduce((n, s) => n + s.redSayisi, 0),
      bosluklar,
      kapsananlar,
      uyarilar
    };
  }
  function ozet(text) {
    if (!text) return void 0;
    const i = text.indexOf("=== Apple'\u0131n red gerek\xE7esi ===");
    const govde = i >= 0 ? text.slice(i + 30) : text;
    return govde.replace(/\s+/g, " ").trim().slice(0, 220) || void 0;
  }
  function kapsamOrani(r) {
    return r.kodlu ? Math.round(r.kartiOlan / r.kodlu * 100) : null;
  }

  // src/ext/audit.ts
  function dersleriAyir(dersler, platform) {
    const aktifTumu = dersler.filter((l) => l.status === "active" && l.platform === platform);
    const aktif = aktifTumu.filter((l) => l.scope !== "in-app");
    const inApp = aktifTumu.filter((l) => l.scope === "in-app");
    const byRule = /* @__PURE__ */ new Map();
    for (const l of aktif) {
      if (!l.ruleId) continue;
      byRule.set(l.ruleId, [...byRule.get(l.ruleId) ?? [], l]);
    }
    const elleKontrol = inApp.map((l) => ({
      ruleId: l.ruleId ?? l.id,
      platform,
      question: `${l.title} \u2014 bu davran\u0131\u015F uygulamada var m\u0131?`,
      ruleText: l.summary,
      source: { doc: "ders", section: l.guideline, url: `lessons/${l.id}`, retrievedAt: l.updatedAt },
      why: `Guideline ${l.guideline} alt\u0131nda daha \xF6nce bu y\xFCzden reddedildik. Uygulama i\xE7i davran\u0131\u015F: listing denetimi g\xF6remez, elle bak\u0131lmal\u0131.`
    }));
    return {
      aktif,
      inApp,
      byRule,
      elleKontrol,
      taslak: dersler.filter((l) => l.status === "draft").length,
      bosluk: dersler.filter(
        (l) => l.ruleId === null && l.status !== "retired" && l.scope !== "in-app"
      ).length
    };
  }
  var META_LABEL = {
    // Elle işaretlenenler: tek kaynak src/meta-fields.ts. Elle yazılmış kopya
    // yeni alan eklendiğinde eksik kalıyordu ve eksik alan "bilgi eksik"
    // satırında adsız görünüyordu.
    ...Object.fromEntries(META_FIELDS.map((f) => [f.key, f.tldr.toLocaleLowerCase("tr")])),
    // Beyandan gelenler: kullanıcı girmiyor ama ÇEKİLMEMİŞ olabilir. O zaman
    // kart "koşul sağlanmadı" diye elenmez, "bilgi eksik" olarak görünür.
    declaresTracking: "gizlilik etiketinde takip beyan\u0131 (\xE7ekilmemi\u015F)",
    usesThirdPartyContent: "\xFC\xE7\xFCnc\xFC taraf i\xE7erik beyan\u0131 (\xE7ekilmemi\u015F)",
    hasCustomProductPages: "\xF6zel \xFCr\xFCn sayfalar\u0131 (\xE7ekilmemi\u015F)",
    hasUnsubmittedProducts: "\xFCr\xFCn g\xF6nderim durumlar\u0131 (\xE7ekilmemi\u015F)"
  };
  function missingMetaOf(sub, card) {
    const w = card.appliesWhen ?? {};
    const eksik = Object.keys(META_LABEL).filter(
      (k) => w[k] !== void 0 && sub.meta[k] === void 0
    );
    return eksik.map((k) => META_LABEL[k]).join(", ");
  }
  async function audit(dump, opts = {}) {
    const { submission, warnings } = submissionFromDump(dump, opts);
    const { bulgular: lint, denetlenmedi: lintDenetlenmedi } = await runLint(submission, {
      probe: opts.probeUrls !== false
    });
    const { llm, manual, unknownMeta, elenen } = selectRules(submission, CORPUS.cards);
    const manualChecks = manual.map((c) => ({
      ruleId: c.id,
      platform: submission.platform,
      question: c.question,
      ruleText: c.ruleText,
      source: c.source,
      why: "Ma\u011Faza kayd\u0131ndan g\xF6r\xFClemez; yay\u0131n \xF6ncesi elle kontrol edilmeli."
    }));
    const ders = dersleriAyir(opts.dersler ?? [], submission.platform);
    manualChecks.push(...ders.elleKontrol);
    const notChecked = [...lintDenetlenmedi];
    if (opts.probeUrls === false) {
      notChecked.push("Adreslerin canl\u0131 olup olmad\u0131\u011F\u0131 s\u0131nanmad\u0131 (a\u011F izni verilmedi)");
    }
    const { crossCheckMissingPrices: crossCheckMissingPrices2 } = await Promise.resolve().then(() => (init_price_crosscheck(), price_crosscheck_exports));
    const vitrin = await crossCheckMissingPrices2(submission, {
      enabled: opts.probeUrls !== false,
      country: opts.territory
    });
    lint.push(...vitrin.findings);
    notChecked.push(...vitrin.notChecked);
    if (!submission.media.screenshots.length) {
      notChecked.push("G\xF6rsel gerektiren kartlar: ekran g\xF6r\xFCnt\xFCs\xFC yok");
    }
    return {
      submission,
      // Havuz yapılandırılmış ama ulaşılamadıysa rapor bunu SÖYLER. Sessizce
      // derssiz koşmak, raporu olduğundan güvenilir gösterirdi.
      warnings: opts.dersUyarisi ? [...warnings, opts.dersUyarisi] : warnings,
      lint,
      manual: manualChecks,
      llmPending: llm.map((c) => ({ id: c.id, section: c.source.section, question: c.question })),
      unknownMeta: unknownMeta.map((c) => ({
        id: c.id,
        section: c.source.section,
        reason: missingMetaOf(submission, c) || "meta bilinmiyor"
      })),
      elenen,
      selection: {
        corpus: CORPUS.cards.length,
        aday: llm.length + manual.length + elenen.length,
        modele: llm.length,
        elleKontrol: manualChecks.length
      },
      notChecked,
      // Model bulgusu olmadan hesaplanan skor EKSİKTİR; arayüz bunu söylüyor.
      riskScore: riskScore(lint, []),
      riskBreakdown: riskBreakdown(lint, []),
      corpusVersion: CORPUS.version,
      counts: {
        cards: CORPUS.cards.length,
        lint: lint.length,
        manual: manualChecks.length,
        pending: llm.length
      },
      dersOzeti: {
        bagli: opts.dersler !== void 0,
        aktif: ders.aktif.length,
        inApp: ders.inApp.length,
        taslak: ders.taslak,
        bosluk: ders.bosluk
      }
    };
  }
  var browserImageLoader = async (path) => {
    if (!/^https?:\/\//i.test(path)) return null;
    try {
      const res = await fetch(path, { signal: AbortSignal.timeout(3e4) });
      if (!res.ok) return null;
      const buf = new Uint8Array(await res.arrayBuffer());
      let binary = "";
      for (let i = 0; i < buf.length; i += 8192) {
        binary += String.fromCharCode(...buf.subarray(i, i + 8192));
      }
      const mime = res.headers.get("content-type")?.split(";")[0] ?? "";
      return { mime: mime.startsWith("image/") ? mime : "image/png", b64: btoa(binary) };
    } catch {
      return null;
    }
  };
  async function fullAudit(dump, opts) {
    const base = await audit(dump, opts);
    const say = opts.onProgress ?? (() => {
    });
    const llm = new OpenAICompatibleProvider(
      opts.proxy.model ?? "gpt-4o-mini",
      opts.proxy.url.replace(/\/+$/, ""),
      "",
      // anahtar YOK — proxy ekliyor
      opts.proxy.vision !== false,
      4,
      opts.proxy.strictSchema !== false,
      {
        label: "proxy",
        keyless: true,
        clientToken: opts.proxy.token ?? "",
        imageDetail: opts.proxy.imageDetail ?? "low"
      }
    );
    const empty = {
      rulesSelected: base.llmPending.length,
      rulesRun: 0,
      rawFindings: 0,
      afterGrounding: 0,
      afterVerify: 0,
      imagesUsed: 0,
      imagesTotal: base.submission.media.screenshots.length,
      inputTokens: 0,
      outputTokens: 0,
      ms: 0
    };
    const health = await llm.healthcheck();
    if (!health.ok) {
      return { ...base, findings: [], modelRan: false, modelError: health.reason, stats: empty };
    }
    const { runCheck: runCheck2 } = await Promise.resolve().then(() => (init_check(), check_exports));
    const { verifyFindings: verifyFindings2 } = await Promise.resolve().then(() => (init_verify(), verify_exports));
    const cards = CORPUS.cards.filter((c) => base.llmPending.some((p) => p.id === c.id));
    say(`${cards.length} kart modele soruluyor\u2026`);
    const ders = dersleriAyir(opts.dersler ?? [], base.submission.platform);
    if (ders.aktif.length) say(`${ders.aktif.length} ders kartlara kan\u0131t olarak ekleniyor\u2026`);
    const res = await runCheck2(
      llm,
      base.submission,
      cards,
      ders.byRule,
      (done, total, ruleId) => say(`[${done}/${total}] ${ruleId}`),
      {
        loadImage: browserImageLoader,
        // Apple'ın kendi madde metni pakete gömülü — denetim sırasında
        // Apple'ın sitesine gitmiyoruz (yavaş olurdu ve "hangi metne göre
        // denetlendi" sorusunun cevabı her çekimde değişirdi).
        guidelineText: (section) => sectionWithChildren(GUIDELINES, section)
      }
    );
    const notChecked = [
      ...base.notChecked,
      ...res.stats.skippedNoVision,
      ...res.stats.basarisiz.map((b) => `${b.id} \u2014 \xE7al\u0131\u015Ft\u0131r\u0131lamad\u0131: ${b.sebep}`)
    ];
    const byClass = /* @__PURE__ */ new Map();
    for (const shot of base.submission.media.screenshots) {
      const k = shot.deviceClass ?? "-";
      byClass.set(k, (byClass.get(k) ?? 0) + 1);
    }
    const isPhone = (k) => /phone/i.test(k);
    const siral\u0131 = [...byClass.entries()].sort(
      (a, b) => Number(isPhone(b[0])) - Number(isPhone(a[0])) || b[1] - a[1]
    );
    const [anaSinif, anaSayi] = siral\u0131[0] ?? ["-", 0];
    const digerler = siral\u0131.slice(1);
    const gorselNotu = anaSayi === 0 ? "" : `${anaSinif}: ${Math.min(res.stats.imagesUsed, anaSayi)}/${anaSayi} ekran g\xF6r\xFCnt\xFCs\xFC modele gitti` + (digerler.length ? `. Di\u011Fer cihaz s\u0131n\u0131flar\u0131 (${digerler.map(([k, n]) => `${k}: ${n}`).join(", ")}) bilerek g\xF6nderilmedi \u2014 ayn\u0131 tasar\u0131m\u0131n ba\u015Fka cihaz kopyas\u0131.` : ".");
    if (res.stats.imagesUsed < anaSayi) {
      notChecked.push(
        `${anaSinif} s\u0131n\u0131f\u0131n\u0131n ${anaSayi} g\xF6r\xFCnt\xFCs\xFCnden ${res.stats.imagesUsed} tanesi g\xF6nderilebildi \u2014 gerisi okunamad\u0131.`
      );
    }
    say("al\u0131nt\u0131lar do\u011Frulan\u0131yor\u2026");
    const grounded = groundFindings(base.submission, res.findings);
    say("ikinci g\xF6z\u2026");
    const byId = new Map(cards.map((r) => [r.id, r]));
    const verified = await verifyFindings2(llm, base.submission, grounded.kept, byId);
    const findings = dedupeFindings(verified.kept);
    if (opts.havuz && ders.aktif.length) {
      for (const f of findings) {
        const examples = [];
        for (const lessonId of f.lessonIds ?? []) {
          const lesson = ders.aktif.find((l) => l.id === lessonId);
          if (!lesson) continue;
          try {
            for (const c of await opts.havuz.examplesFor(lessonId, 2)) {
              examples.push({
                lessonId,
                lessonTitle: lesson.title,
                appName: c.appName,
                rejectedAt: c.rejectedAt,
                guideline: c.guideline,
                excerpt: c.excerpt,
                reviewerText: c.reviewerText,
                resolution: c.resolution
              });
            }
          } catch {
          }
        }
        if (examples.length) f.examples = examples;
      }
    }
    return {
      ...base,
      findings,
      notChecked,
      modelRan: true,
      gorselNotu,
      // Skor artık model bulgularını da içeriyor.
      riskScore: riskScore(base.lint, findings),
      riskBreakdown: riskBreakdown(base.lint, findings),
      stats: {
        rulesSelected: cards.length,
        rulesRun: res.stats.rulesRun,
        rawFindings: res.findings.length,
        afterGrounding: grounded.kept.length,
        afterVerify: findings.length,
        imagesUsed: res.stats.imagesUsed,
        imagesTotal: res.stats.imagesTotal,
        inputTokens: res.stats.inputTokens,
        outputTokens: res.stats.outputTokens,
        ms: res.stats.ms
      }
    };
  }
  var CORPUS_VERSION = CORPUS.version;
  function coverageReport(rejects) {
    return coverage(rejects, CORPUS.cards);
  }
  return __toCommonJS(audit_exports);
})();
