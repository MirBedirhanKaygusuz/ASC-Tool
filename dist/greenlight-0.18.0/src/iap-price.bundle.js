"use strict";
var GLPrice = (() => {
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

  // src/iap-price.ts
  var iap_price_exports = {};
  __export(iap_price_exports, {
    pickCurrentPrice: () => pickCurrentPrice,
    priceFromPool: () => priceFromPool,
    priceFromRecords: () => priceFromRecords,
    priceFromSchedule: () => priceFromSchedule
  });
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
  function pickCurrentPrice(records, bugun = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
    const yeniMusteri = records.filter((r) => r.attributes?.preserved !== true);
    const havuz = yeniMusteri.length ? yeniMusteri : records;
    const not = yeniMusteri.length ? void 0 : "yaln\u0131z korunmu\u015F (preserved) fiyat var \u2014 yeni m\xFC\u015Fterinin g\xF6rece\u011Fi fiyat bu olmayabilir";
    const tarih = (r) => String(r.attributes?.startDate ?? "");
    const yururlukte = havuz.filter((r) => !tarih(r) || tarih(r) <= bugun).sort((a, b) => tarih(b).localeCompare(tarih(a)));
    if (yururlukte[0]) return { record: yururlukte[0], note: not };
    const gelecek = havuz.slice().sort((a, b) => tarih(a).localeCompare(tarih(b)));
    if (!gelecek[0]) return null;
    return {
      record: gelecek[0],
      note: `bu fiyat ${tarih(gelecek[0])} tarihinde y\xFCr\xFCrl\xFC\u011Fe giriyor \u2014 bug\xFCn ge\xE7erli fiyat kayd\u0131 yok`
    };
  }
  function priceFromRecords(records, included, relName, bugun) {
    const secim = pickCurrentPrice(records, bugun);
    if (!secim) return null;
    const id = secim.record.relationships?.[relName]?.data?.id;
    const point = id ? included.find((r) => r.id === id) : void 0;
    const fiyat = asPrice(point);
    return fiyat ? { ...fiyat, note: secim.note } : null;
  }
  return __toCommonJS(iap_price_exports);
})();
