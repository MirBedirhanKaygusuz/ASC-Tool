/**
 * Yerel depo — eklentinin IndexedDB'si.
 *
 * NEREDE: eklentinin kendi origin'inde. App Store Connect sayfasının
 * depolamasında DEĞİL — orası Apple'ın alanı, "site verilerini temizle"
 * ile uçar ve bizim işimiz değil.
 *
 * NEDEN ARAYÜZ: bugün IndexedDB, yarın Supabase. Projede aynı desen zaten var
 * (LessonStore → LocalLessonStore | SupabaseR2Store). Toplayıcı ve
 * görüntüleyici yalnızca bu arayüzü konuşur; geçiş günü değişen tek şey bu
 * dosyanın içi olur. belkiPatlarız R10.
 *
 * NE SAKLANIR:
 *   apps    → uygulama özeti (isim, sayılar, son çekim, eksikler)
 *   raw     → Apple'ın döndürdüğü HAM JSON, bölüm bölüm. R2'nin panzehiri:
 *             alan adı değişince arşivden yeniden üretiriz, Apple'a tek
 *             istek daha gitmez.
 *   rejects → ham yazışmadan çıkarılmış red metinleri (learn'ün beklediği biçim)
 *   runs    → çekim günlüğü: ne zaman, kaç istek, neler atlandı
 *   audits  → DENETİM SONUÇLARI. Eskiden yalnızca bellekte duruyordu: panel
 *             kapanınca rapor uçuyor, aynı denetim yeniden koşuyor, model
 *             yeniden para yakıyordu. Üstelik "geçen ay skor 62'ydi, şimdi
 *             28" karşılaştırması hiç yapılamıyordu — oysa ürünün asıl
 *             vaadi bu.
 */
;(() => {
  const DB = 'greenlight'
  // 1 → 2: `audits` deposu eklendi. Sürüm artmazsa `onupgradeneeded`
  // çalışmaz ve mevcut kullanıcıda depo hiç oluşmaz — yazma sessizce
  // patlar. Yeni depo eklerken bu sayıyı artırmayı unutma.
  const VERSION = 2
  const STORES = {
    apps: { keyPath: 'id' },
    raw: { keyPath: 'key' },
    rejects: { keyPath: 'id' },
    runs: { keyPath: 'id' },
    audits: { keyPath: 'id' },
  }

  let dbPromise = null

  function open() {
    if (dbPromise) return dbPromise
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        for (const [name, opts] of Object.entries(STORES)) {
          if (!db.objectStoreNames.contains(name)) {
            const os = db.createObjectStore(name, opts)
            if (name === 'raw' || name === 'rejects' || name === 'audits') os.createIndex('appId', 'appId')
          }
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    return dbPromise
  }

  async function tx(store, mode, fn) {
    const db = await open()
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode)
      const os = t.objectStore(store)
      let result
      try {
        result = fn(os)
      } catch (e) {
        reject(e)
        return
      }
      t.oncomplete = () => resolve(result?.result ?? result)
      t.onerror = () => reject(t.error)
      t.onabort = () => reject(t.error)
    })
  }

  const all = (store, indexName, key) =>
    tx(store, 'readonly', (os) => (indexName ? os.index(indexName).getAll(key) : os.getAll()))

  const store = {
    name: 'indexeddb',

    /**
     * Uygulama özeti. `meta` KORUNUR: bu alanları kullanıcı elle giriyor
     * (ör. "AI içerik üretiyor mu" — App Store Connect bunu söylemiyor).
     * Çekim özeti üzerine yazsaydı, her yeni çekim insanın verdiği bilgiyi
     * sessizce siler ve o kurallar bir daha hiç çalışmazdı.
     */
    async putApp(app) {
      const eski = await tx('apps', 'readonly', (os) => os.get(app.id))
      const meta = { ...(eski?.meta ?? {}), ...(app.meta ?? {}) }
      return tx('apps', 'readwrite', (os) => os.put({ ...eski, ...app, meta }))
    },

    async setMeta(id, key, value) {
      const app = await tx('apps', 'readonly', (os) => os.get(id))
      if (!app) throw new Error('uygulama bulunamadı')
      const meta = { ...(app.meta ?? {}) }
      // null = "bilinmiyor'a dön". Bu, "hayır" ile AYNI ŞEY DEĞİL.
      if (value === null) delete meta[key]
      else meta[key] = value
      await tx('apps', 'readwrite', (os) => os.put({ ...app, meta }))
      return meta
    },
    async getApps() {
      const rows = await all('apps')
      return rows.sort((a, b) => String(a.name).localeCompare(String(b.name), 'tr'))
    },
    async getApp(id) {
      return tx('apps', 'readonly', (os) => os.get(id))
    },

    /** Ham bölüm: aynı uygulamanın aynı bölümü üzerine yazılır (son çekim geçerli). */
    async putRaw(appId, section, data, meta = {}) {
      return tx('raw', 'readwrite', (os) =>
        os.put({ key: `${appId}::${section}`, appId, section, at: Date.now(), ...meta, data }),
      )
    },

    /**
     * Depoda yer var mı?
     *
     * IndexedDB kotası dolduğunda yazma sessizce düşüyordu ve çekim "başarılı"
     * görünüyordu — sonra denetim eksik veriyle koşuyordu. Kota kontrolü
     * ENGELLEME değil UYARI: çekimi durdurmuyoruz, kullanıcı neyin
     * yaklaştığını görüyor.
     */
    async kota() {
      if (!navigator.storage?.estimate) return null
      try {
        const { usage = 0, quota = 0 } = await navigator.storage.estimate()
        return { kullanilan: usage, tavan: quota, oran: quota ? usage / quota : 0 }
      } catch {
        return null
      }
    },
    async getRaw(appId, section) {
      return tx('raw', 'readonly', (os) => os.get(`${appId}::${section}`))
    },
    async listRaw(appId) {
      const rows = await all('raw', 'appId', appId)
      return rows.map(({ key, section, at, sema, data }) => ({
        key,
        section,
        at,
        // Damgasız satır = eski biçim. Okuma anında sadeleştiriliyor ama
        // depoda hâlâ şişkin duruyor; ekran bunu göstersin diye taşıyoruz.
        sema: sema ?? 1,
        // Liste ekranında ham veriyi taşımanın anlamı yok; boyutu yeter.
        count: Array.isArray(data) ? data.length : data && typeof data === 'object' ? 1 : 0,
        bytes: JSON.stringify(data ?? null).length,
      }))
    },

    /**
     * Red metinleri. id = thread:message:parça — aynı red iki kez çekilse de
     * ikinci kez EKLENMEZ. `ingested` bayrağı korunur: bir kez derse
     * dönüştürülmüş bir metni, yeniden çekim yüzünden ikinci kez modele
     * göndermek para ve gürültü demek.
     */
    async putRejects(list) {
      if (!list.length) return { added: 0, kept: 0 }
      const db = await open()
      return new Promise((resolve, reject) => {
        const t = db.transaction('rejects', 'readwrite')
        const os = t.objectStore('rejects')
        let added = 0
        let kept = 0
        for (const r of list) {
          const get = os.get(r.id)
          get.onsuccess = () => {
            if (get.result) {
              kept++
            } else {
              os.add({ ...r, ingested: false, addedAt: Date.now() })
              added++
            }
          }
        }
        t.oncomplete = () => resolve({ added, kept })
        t.onerror = () => reject(t.error)
      })
    },
    async getRejects(appId) {
      const rows = appId ? await all('rejects', 'appId', appId) : await all('rejects')
      return rows.sort((a, b) => String(b.rejectedAt ?? '').localeCompare(String(a.rejectedAt ?? '')))
    },
    async markIngested(id, value = true) {
      return tx('rejects', 'readwrite', (os) => {
        const get = os.get(id)
        get.onsuccess = () => get.result && os.put({ ...get.result, ingested: value })
      })
    },

    /**
     * Denetim sonucu. id = appId::zaman — aynı uygulamanın her koşusu ayrı
     * kayıt, çünkü değeri tam olarak KARŞILAŞTIRMADA: skor düştü mü, hangi
     * bulgu kapandı. Üzerine yazsaydık geçmiş diye bir şey kalmazdı.
     *
     * `sonuc` tüm GLAudit çıktısıdır. Özet saklayıp raporu atmak cazip ama
     * yanlış: rapor bir daha çizilemez ve dışa aktarılamaz olurdu.
     */
    async putAudit(rec) {
      const id = rec.id ?? `${rec.appId}::${rec.at}`
      await tx('audits', 'readwrite', (os) => os.put({ ...rec, id }))
      return id
    },

    /** Tüm denetimler, yeniden eskiye. appId verilirse yalnız o uygulama. */
    async getAudits(appId) {
      const rows = appId ? await all('audits', 'appId', appId) : await all('audits')
      return rows.sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
    },

    async getAudit(id) {
      return tx('audits', 'readonly', (os) => os.get(id))
    },

    async deleteAudit(id) {
      return tx('audits', 'readwrite', (os) => os.delete(id))
    },

    /**
     * Uygulama başına son N denetimi tut, gerisini sil.
     * Denetim kayıtları büyük (rapor + submission); sınırsız büyürse kota
     * dolar ve ÇEKİM yazımları sessizce düşer. Budama kullanıcının açık
     * isteğiyle çalışır, kendiliğinden değil — kimse geçmişini habersiz
     * kaybetmemeli.
     */
    async budaAudits(tut = 5) {
      const rows = await all('audits')
      const grup = new Map()
      for (const r of rows) {
        const l = grup.get(r.appId) ?? []
        l.push(r)
        grup.set(r.appId, l)
      }
      let silinen = 0
      for (const liste of grup.values()) {
        liste.sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
        for (const r of liste.slice(tut)) {
          await tx('audits', 'readwrite', (os) => os.delete(r.id))
          silinen++
        }
      }
      return silinen
    },

    async putRun(run) {
      return tx('runs', 'readwrite', (os) => os.put(run))
    },
    async getRuns(limit = 20) {
      const rows = await all('runs')
      return rows.sort((a, b) => b.startedAt - a.startedAt).slice(0, limit)
    },

    async stats() {
      const [apps, rejects, raws, runs, audits, kota] = await Promise.all([
        all('apps'), all('rejects'), all('raw'), all('runs'), all('audits'), this.kota(),
      ])
      const bytes = raws.reduce((n, r) => n + JSON.stringify(r.data ?? null).length, 0)
      const auditBytes = audits.reduce((n, r) => n + JSON.stringify(r ?? null).length, 0)
      return {
        apps: apps.length,
        rejects: rejects.length,
        yeniRejects: rejects.filter((r) => !r.ingested).length,
        bolumler: raws.length,
        bytes,
        denetimler: audits.length,
        denetimBytes: auditBytes,
        sonDenetim: audits.length ? Math.max(...audits.map((r) => r.at ?? 0)) : null,
        // Tarayıcı desteklemiyorsa null — "yer yok" ile "bilmiyoruz" ayrı.
        kota,
        sonCekim: runs.length ? Math.max(...runs.map((r) => r.startedAt)) : null,
      }
    },

    /**
     * Dışa aktarma — R8'in tek cevabı. Eklenti silinirse IndexedDB gider;
     * Supabase gelene kadar yedek bu.
     *
     * gizle=true: kişisel veri ve sırlar maskelenir. Paylaşılacak kopya bu.
     */
    async exportAll(gizle = false) {
      const [apps, rejects, raw, runs, audits] = await Promise.all([
        all('apps'), all('rejects'), all('raw'), all('runs'), all('audits'),
      ])
      // version 2 = `audits` dahil. İçe aktarma eski (v1) dosyaları da
      // okuyor: eksik anahtar atlanıyor, hata verilmiyor.
      const payload = {
        format: 'greenlight-export', version: 2, at: new Date().toISOString(),
        apps, rejects, raw, runs, audits,
      }
      return gizle ? maskDeep(payload) : payload
    },

    async importAll(payload) {
      if (payload?.format !== 'greenlight-export') throw new Error('Tanınmayan dosya biçimi.')
      const counts = {}
      for (const [name, rows] of Object.entries({
        apps: payload.apps, rejects: payload.rejects, raw: payload.raw,
        runs: payload.runs, audits: payload.audits,
      })) {
        if (!Array.isArray(rows)) continue
        await tx(name, 'readwrite', (os) => rows.forEach((r) => os.put(r)))
        counts[name] = rows.length
      }
      return counts
    },

    async clearAll() {
      for (const name of Object.keys(STORES)) await tx(name, 'readwrite', (os) => os.clear())
    },
  }

  // Maskeleme kuralı canary.js ile aynı olmalı; ikisi ayrışırsa biri sızdırır.
  //
  // `^pass$` NEDEN VAR: `Submission.review.demoAccount` alanı şifreyi `pass`
  // anahtarıyla taşıyor ve `password` deseni buna UYMUYORDU. Yani denetim
  // raporunu dışa aktaran herkes inceleme demo hesabının şifresini de
  // gönderiyordu. Desen kısa olduğu için sessizce kaçmıştı (belkiPatlarız R4).
  const SECRET =
    /password|passwd|secret|credential|api[-_]?key|(access|auth|refresh|session|bearer)[-_]?token|^token$|^pass$|^pwd$/i
  const PERSONAL =
    /phone|email|firstname|lastname|nickname|initiator|publishedby|contactname|reviewername|demoaccountname|^user$|^username$/i

  function maskDeep(value) {
    if (Array.isArray(value)) return value.map(maskDeep)
    if (value && typeof value === 'object') {
      const out = {}
      for (const [k, v] of Object.entries(value)) {
        out[k] = SECRET.test(k) ? '‹gizlendi›' : PERSONAL.test(k) ? '‹kişisel veri›' : maskDeep(v)
      }
      return out
    }
    return value
  }

  globalThis.GLStore = store
  globalThis.GLMask = maskDeep
})()
