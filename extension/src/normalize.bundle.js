"use strict";
var GLNormalize = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // src/dump/normalize.ts
  var normalize_exports = {};
  __export(normalize_exports, {
    RED_APPLE: () => RED_APPLE,
    SEMA: () => SEMA,
    hamKayit: () => hamKayit,
    isNormalized: () => isNormalized,
    normalizeRecord: () => normalizeRecord,
    normalizeSection: () => normalizeSection,
    redSayilari: () => redSayilari
  });

  // src/iap-price.ts
  var attrs = (r) => r?.attributes ?? {};
  function asPrice(node) {
    const raw = Number(attrs(node).customerPrice);
    if (!Number.isFinite(raw)) return null;
    return { price: raw, currency: String(attrs(node).currency ?? "") };
  }
  function priceFromPool(product, pool) {
    const byId = (id) => id ? pool.find((r) => r.id === id) : void 0;
    const sched = byId(product?.relationships?.iapPriceSchedule?.data?.id);
    if (!sched) return null;
    const refs = sched.relationships?.manualPrices?.data ?? sched.relationships?.automaticPrices?.data ?? [];
    for (const ref of refs) {
      const fiyat = byId(ref?.id);
      const point = byId(fiyat?.relationships?.inAppPurchasePricePoint?.data?.id);
      const found = point && asPrice(point) || fiyat && asPrice(fiyat);
      if (found) return found;
    }
    return null;
  }
  function priceFromSchedule(row) {
    if (!row) return null;
    const point = (row.included ?? []).find((r) => attrs(r).customerPrice !== void 0);
    return point ? asPrice(point) : null;
  }

  // src/dump/normalize.ts
  var SEMA = 2;
  var nesne = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  function hamKayit(v) {
    return nesne(v) && ("attributes" in v || "links" in v || "relationships" in v);
  }
  function isNormalized(v) {
    if (Array.isArray(v)) return !v.some(hamKayit);
    return !hamKayit(v);
  }
  var bos = (v) => v === null || v === void 0 || v === "" || Array.isArray(v) && v.length === 0 || nesne(v) && Object.keys(v).length === 0;
  function iliskiDegeri(rel) {
    const d = rel?.data;
    if (!d) return void 0;
    if (Array.isArray(d)) return d.map((x) => String(x?.id ?? "")).filter(Boolean);
    return d.id ? String(d.id) : void 0;
  }
  function normalizeRecord(r, opt = {}) {
    if (!hamKayit(r)) return r;
    const rec = r;
    const out = {};
    const bosAlanlar = [];
    const cakisan = {};
    if (rec.id !== void 0) out.id = String(rec.id);
    if (rec.type) out.tip = String(rec.type);
    for (const [k, v] of Object.entries(rec.attributes ?? {})) {
      if (bos(v)) {
        bosAlanlar.push(k);
        continue;
      }
      if (k === "id" || k === "tip" || k === "iliski" || k.startsWith("_")) cakisan[k] = v;
      else out[k] = v;
    }
    const iliski = {};
    const adressiz = [];
    for (const [ad, rel] of Object.entries(rec.relationships ?? {})) {
      const deger = iliskiDegeri(rel);
      if (deger === void 0 || Array.isArray(deger) && !deger.length) adressiz.push(ad);
      else iliski[ad] = deger;
    }
    if (Object.keys(iliski).length) out.iliski = iliski;
    if (adressiz.length) {
      out._iliski = opt.iliskiAdlari ? { sayi: adressiz.length, adlar: adressiz } : { sayi: adressiz.length };
    }
    if (bosAlanlar.length) out._bos = bosAlanlar;
    if (Object.keys(cakisan).length) out._alanlar = cakisan;
    return out;
  }
  var dizi = (v, opt) => Array.isArray(v) ? v.map((r) => normalizeRecord(r, opt)) : [];
  function havuz(payload) {
    const m = /* @__PURE__ */ new Map();
    for (const r of payload?.included ?? []) if (r?.id) m.set(String(r.id), r);
    return m;
  }
  var attrs2 = (r) => r?.attributes ?? r ?? {};
  function normalizeSection(section, data) {
    const notlar = [];
    if (data === null || data === void 0) return { data, notlar };
    switch (section) {
      // Uygulama künyesi: ilişki adları R2 için değerli (uç haritası).
      case "app":
        return { data: normalizeRecord(data, { iliskiAdlari: true }), notlar };
      // included = kategoriler + yaş beyanı. İkisi de başka yerde duruyor
      // (kategori `iliski`de, yaş beyanı kendi bölümünde) — tekrarı atıyoruz.
      case "appInfos":
        return { data: { data: dizi(data?.data ?? data) }, notlar };
      case "reviewDetail":
        return { data: reviewDetail(data), notlar };
      case "stateChanges":
        return { data: stateChanges(data), notlar };
      case "submissions":
        return { data: submissions(data), notlar };
      case "threads":
        return { data: threads(data), notlar };
      case "subscriptions":
        return { data: subscriptions(data, notlar), notlar };
      case "iaps":
        return { data: iaps(data), notlar };
      case "iapPrices":
        return { data: iapPrices(data, notlar), notlar };
      case "dataUsages":
        return { data: dataUsages(data), notlar };
      case "versionTexts":
        return { data: versionTexts(data), notlar };
      // Toplayıcı bunları zaten elle damıtıyor — örnek şekil bunlar.
      case "screenshots":
      case "icon":
        return { data, notlar };
      // Özel ürün sayfaları: yeni toplayıcı damıtılmış yazıyor, eski çekimlerde
      // ham JSON:API kaydı duruyor. İkisini de kabul ediyoruz — okuma anındaki
      // sadeleştirme eski kayıtlar için var zaten.
      case "customProductPages":
        return {
          data: (Array.isArray(data) ? data : []).map(
            (r) => hamKayit(r) ? { ...normalizeRecord(r), metinler: [], gorseller: [], icerikCekildi: false } : r
          ),
          notlar
        };
      default:
        return {
          data: Array.isArray(data) ? dizi(data) : normalizeRecord(data),
          notlar
        };
    }
  }
  function reviewDetail(data) {
    const r = normalizeRecord(data);
    if (!nesne(r)) return r;
    const { contactFirstName, contactLastName, contactEmail, contactPhone, ...kalan } = r;
    return {
      ...kalan,
      iletisim: {
        ad: !!(contactFirstName || contactLastName),
        eposta: !!contactEmail,
        telefon: !!contactPhone
      }
    };
  }
  function stateChanges(data) {
    const olay = (r) => {
      const a = attrs2(r);
      return { durum: a.appVersionState ?? a.appStoreState ?? "", tarih: a.date ?? "" };
    };
    const satirlar = Array.isArray(data) ? data : [];
    if (satirlar.some((r) => nesne(r) && "olaylar" in r)) {
      return satirlar.map((r) => {
        const g = r;
        return {
          surum: String(g.versionString ?? ""),
          surumId: String(g.versionId ?? ""),
          olaylar: (Array.isArray(g.olaylar) ? g.olaylar : []).map(olay)
        };
      });
    }
    return satirlar.length ? [{ surum: "", surumId: "", olaylar: satirlar.map(olay) }] : [];
  }
  var RED_APPLE = /^(REJECTED|METADATA_REJECTED)$/;
  function redSayilari(stateChanges2) {
    const olaylar = (Array.isArray(stateChanges2) ? stateChanges2 : []).flatMap((g) => nesne(g) && Array.isArray(g.olaylar) ? g.olaylar : []);
    const d = (o) => String(o?.durum ?? "");
    return {
      apple: olaylar.filter((o) => RED_APPLE.test(d(o))).length,
      geriCekilen: olaylar.filter((o) => d(o) === "DEVELOPER_REJECTED").length
    };
  }
  function submissions(data) {
    const p = data;
    const h = havuz(p);
    return (p?.data ?? []).map((r) => {
      const a = attrs2(r);
      const surumId = r?.relationships?.appStoreVersionForReview?.data?.id;
      return {
        id: String(r?.id ?? ""),
        durum: a.state ?? "",
        gonderildi: a.submittedDate ?? null,
        guncellendi: a.lastUpdatedDate ?? null,
        surum: surumId ? attrs2(h.get(String(surumId))).versionString ?? null : null
      };
    });
  }
  function threads(data) {
    return (Array.isArray(data) ? data : []).map((t) => {
      const h = havuz(t);
      const kimlik = (m) => {
        const id = m?.relationships?.fromActor?.data?.id;
        const tur = String(attrs2(h.get(String(id))).actorType ?? (String(id) === "APPLE" ? "APPLE" : ""));
        return tur === "APPLE" ? "APPLE" : "GELISTIRICI";
      };
      return {
        id: String(t?.thread?.id ?? ""),
        tur: attrs2(t?.thread).threadType ?? "",
        acilis: attrs2(t?.thread).createdDate ?? "",
        mesajlar: (t?.messages ?? []).map((m) => ({
          id: String(m?.id ?? ""),
          kim: kimlik(m),
          tarih: attrs2(m).createdDate ?? "",
          govde: attrs2(m).messageBody ?? ""
        })),
        redler: (t?.rejections ?? []).flatMap(
          (r) => (attrs2(r).reasons ?? []).map((x) => ({
            madde: x?.reasonSection ?? "",
            kod: x?.reasonCode ?? "",
            aciklama: x?.reasonDescription ?? ""
          }))
        )
      };
    });
  }
  function subscriptions(data, notlar) {
    return (Array.isArray(data) ? data : []).map((s) => {
      const gruplu = /* @__PURE__ */ new Map();
      for (const o of s?.offers ?? []) {
        const anahtar = [o?.offerMode, o?.duration, o?.numberOfPeriods, o?.startDate].join("|");
        const v = gruplu.get(anahtar);
        if (v) v.adet++;
        else gruplu.set(anahtar, { ...o, adet: 1 });
      }
      const teklifler = [...gruplu.values()];
      if ((s?.offers?.length ?? 0) > teklifler.length) {
        notlar.push(
          `${s?.productId ?? s?.id}: ${s.offers.length} teklif sat\u0131r\u0131 ${teklifler.length} tekil teklife indi`
        );
      }
      return {
        id: String(s?.id ?? ""),
        urun: s?.productId ?? "",
        ad: s?.name ?? "",
        donem: s?.period ?? "",
        durum: s?.state ?? "",
        fiyat: s?.price ?? null,
        teklifler,
        diller: dizi(s?.locales)
      };
    });
  }
  function iaps(data) {
    const p = data;
    if (!p?.data) return normalizeRecord(p);
    const included = p.included ?? [];
    const yerel = /* @__PURE__ */ new Map();
    for (const r of included) if (r?.type === "inAppPurchaseLocalizations" && r.id) yerel.set(String(r.id), r);
    return {
      data: (p.data ?? []).map((r) => {
        const kayit = normalizeRecord(r);
        const refs = r?.relationships?.inAppPurchaseLocalizations?.data ?? [];
        const diller = refs.map((x) => yerel.get(String(x.id))).filter(Boolean).map((x) => normalizeRecord(x));
        if (diller.length) kayit.diller = diller;
        const fiyat = priceFromPool(r, included);
        kayit.fiyat = fiyat ? { tutar: fiyat.price, para: fiyat.currency, kaynak: "iaps.include" } : null;
        return kayit;
      })
    };
  }
  function iapPrices(data, notlar) {
    return (Array.isArray(data) ? data : []).map((row) => {
      const fiyat = priceFromSchedule(row);
      if (fiyat) {
        return {
          iapId: String(row?.iapId ?? ""),
          urun: row?.productId ?? "",
          fiyat: fiyat.price,
          para: fiyat.currency,
          kaynak: "iapPriceSchedule"
        };
      }
      notlar.push(`${row?.productId ?? row?.iapId}: fiyat \xE7izelgesinden okunamad\u0131, ham kay\u0131t sakland\u0131`);
      return {
        iapId: String(row?.iapId ?? ""),
        urun: row?.productId ?? "",
        fiyat: null,
        not: "fiyat noktas\u0131 havuzda yok",
        ham: { data: dizi(row?.data), included: dizi(row?.included) }
      };
    });
  }
  function dataUsages(data) {
    const p = data;
    const silinmis = /* @__PURE__ */ new Set();
    for (const r of p?.included ?? []) if (r?.attributes?.deleted === true) silinmis.add(String(r.id));
    const id = (rel) => rel?.data?.id ? String(rel.data.id) : "";
    return (p?.data ?? []).map((r) => {
      const kategori = id(r?.relationships?.category);
      const grup = id(r?.relationships?.grouping);
      const amac = id(r?.relationships?.purpose);
      const koruma = id(r?.relationships?.dataProtection);
      const satir = { kategori, grup, koruma };
      if (amac) satir.amac = amac;
      if ([kategori, grup, amac, koruma].some((x) => x && silinmis.has(x))) satir.silinmis = true;
      return satir;
    });
  }
  function versionTexts(data) {
    return (Array.isArray(data) ? data : []).map((v) => ({
      ...v,
      locales: dizi(v?.locales)
    }));
  }
  return __toCommonJS(normalize_exports);
})();
