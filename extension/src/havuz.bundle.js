"use strict";
var GLHavuz = (() => {
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

  // src/lessons/remote.ts
  var remote_exports = {};
  __export(remote_exports, {
    RemoteLessonStore: () => RemoteLessonStore
  });
  var RemoteLessonStore = class {
    constructor(baseUrl, token, timeoutMs = 3e4) {
      this.token = token;
      this.timeoutMs = timeoutMs;
      this.base = baseUrl.trim().replace(/\/+$/, "").replace(/\/v1$/, "");
    }
    token;
    timeoutMs;
    name = "havuz";
    base;
    // --- Taşıma ----------------------------------------------------------------
    async iste(yol, init) {
      let res;
      try {
        res = await fetch(`${this.base}${yol}`, {
          ...init,
          headers: {
            "x-gl-token": this.token,
            ...init?.body ? { "content-type": "application/json" } : {},
            ...init?.headers ?? {}
          },
          signal: AbortSignal.timeout(this.timeoutMs)
        });
      } catch (e) {
        throw new Error(`havuza ula\u015F\u0131lamad\u0131 (${this.base}): ${e.message}`);
      }
      if (!res.ok) {
        const govde = await res.text().catch(() => "");
        let sebep = govde.slice(0, 300);
        try {
          sebep = JSON.parse(govde).error ?? sebep;
        } catch {
        }
        throw new Error(`havuz HTTP ${res.status}: ${sebep}`);
      }
      return res;
    }
    async al(yol) {
      return (await this.iste(yol)).json();
    }
    async yolla(yontem, yol, govde) {
      await this.iste(yol, { method: yontem, body: JSON.stringify(govde) });
    }
    /** Anahtar `bodies/x.md` biçiminde — eğik çizgiler yol, kalanı kaçışlı. */
    blobYolu(key) {
      return `/blob/${key.split("/").map(encodeURIComponent).join("/")}`;
    }
    // --- Arayüz ----------------------------------------------------------------
    async healthcheck() {
      try {
        const h = await this.al("/health");
        if (!h.db) return { ok: false, reason: `havuzun veritaban\u0131 yan\u0131t vermiyor: ${h.error ?? "?"}` };
        if (h.yetki === "yok") return { ok: false, reason: "belirte\xE7 ge\xE7ersiz (HAVUZ_TOKEN)" };
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: e.message };
      }
    }
    async activeLessons(platform) {
      const r = await this.al(
        `/lessons?platform=${encodeURIComponent(platform)}&status=active`
      );
      return r.lessons;
    }
    async allLessons() {
      return (await this.al("/lessons")).lessons;
    }
    async findLesson(id) {
      try {
        return (await this.al(`/lessons/${encodeURIComponent(id)}`)).lesson;
      } catch (e) {
        if (/HTTP 404/.test(e.message)) return null;
        throw e;
      }
    }
    async candidatesFor(platform, guideline) {
      const r = await this.al(
        `/lessons?platform=${encodeURIComponent(platform)}&guideline=${encodeURIComponent(guideline)}&exclude=retired`
      );
      return r.lessons;
    }
    async examplesFor(lessonId, limit = 3) {
      const r = await this.al(
        `/lessons/${encodeURIComponent(lessonId)}/examples?limit=${limit}`
      );
      return r.examples;
    }
    async allExamples() {
      return (await this.al("/examples")).examples;
    }
    async readRaw(example) {
      return this.blobOku(example.rawKey);
    }
    async readBody(lesson) {
      return this.blobOku(lesson.bodyKey);
    }
    /**
     * Okunamayan gövde boş dizedir, hata değil.
     *
     * Yerel depo da böyle davranıyor. Eksik tek bir gövde yüzünden tüm denetimi
     * düşürmek orantısız olurdu — gövde prompt'a girmiyor, yalnız insanın
     * okuması için.
     */
    async blobOku(key) {
      try {
        return await (await this.iste(this.blobYolu(key))).text();
      } catch {
        return "";
      }
    }
    async createLesson(lesson, body) {
      await this.yolla("POST", "/lessons", { lesson, body });
    }
    async updateLessonStatus(id, status) {
      await this.yolla("PATCH", `/lessons/${encodeURIComponent(id)}`, { status });
    }
    async addExample(example, rawText) {
      await this.yolla("POST", "/examples", { example, raw: rawText });
    }
    async readVectors() {
      return (await this.al("/vectors")).vectors;
    }
    async writeVectors(vectors) {
      if (!vectors.length) return;
      await this.yolla("PUT", "/vectors", { vectors });
    }
  };
  return __toCommonJS(remote_exports);
})();
