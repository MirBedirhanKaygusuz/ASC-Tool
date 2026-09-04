/**
 * Greenlight LLM proxy — Cloudflare Worker.
 *
 * TEK İŞİ VAR: isteğe API anahtarını eklemek. Prompt, şema, kural kartı,
 * red metni — hiçbiri buraya ait değil. Onlar `src/` altındaki TypeScript'te
 * duruyor ve hem `npm run check`'e hem eklentiye aynı kaynaktan derleniyor.
 * Buraya prompt mantığı taşırsak iki gerçeklik oluşur ve hangisinin denetimi
 * doğru yaptığı bilinemez.
 *
 * Aptal proxy olması güvenlik açısından da tercih: ne kadar az şey yaparsa
 * o kadar kolay denetlenir.
 *
 * NE YAPAR:
 *   1. Çağıranın bizim eklentimiz olup olmadığına bakar (Origin + istemci belirteci)
 *   2. Günlük istek tavanını uygular (KV bağlıysa)
 *   3. Deterministik çağrıları önbellekten döndürür (temperature 0)
 *   4. Anahtarı ekleyip OpenAI'a geçirir, yanıtı aynen döndürür
 *
 * NE YAPMAZ: istek gövdesini loglamaz. Listing metinleri ve red yazışmaları
 * buradan geçiyor; sayaç tutmak başka, içeriği saklamak başka.
 */

const CORS_BASE = {
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type, x-gl-token',
  'access-control-max-age': '86400',
}

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extra },
  })

/**
 * Origin kısıtı — VARSAYILAN OLARAK KAPALI.
 *
 * Neden kapalı: eklenti sayfası host izniyle istek attığında Chrome `Origin`
 * başlığını HİÇ GÖNDERMİYOR (istek CORS kapsamına girmiyor). Yani origin'e
 * bakan bir kapı, korumak istediğimiz istemciyi tanıyamıyor — yalnızca
 * kendi eklentimizi dışarıda bırakıyor.
 *
 * `ALLOWED_ORIGINS` doldurulursa liste uygulanır; boşsa herkes geçer.
 */
function originAllowed(origin, env) {
  const list = (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!list.length) return true
  return list.includes(origin)
}

function corsHeaders(origin, env) {
  if (!originAllowed(origin, env)) return CORS_BASE
  return { ...CORS_BASE, 'access-control-allow-origin': origin || '*' }
}

/**
 * Kapıdaki kontroller VARSAYILAN OLARAK KAPALIDIR ve açıldıklarında bile
 * KİMLİK DOĞRULAMA DEĞİLDİR: Origin başlığı curl ile uydurulabilir, istemci
 * belirteci de eklentinin içinde durduğu için sır sayılmaz. İkisi de
 * "adresi tesadüfen bulan biri kullanmasın" içindir.
 *
 * TEK GERÇEK DURDURUCU: OpenAI hesabındaki harcama sınırı. Buradaki hiçbir
 * şey onun yerine geçmez.
 */
function gateKeeper(request, env, origin) {
  if (!originAllowed(origin, env)) {
    return json({ error: 'bu origin izinli değil' }, 403)
  }
  if (env.CLIENT_TOKEN && request.headers.get('x-gl-token') !== env.CLIENT_TOKEN) {
    return json({ error: 'istemci belirteci geçersiz' }, 403)
  }
  return null
}

/** Günlük istek sayacı. KV bağlı değilse sessizce atlanır (limit yok demektir). */
async function underDailyLimit(env) {
  if (!env.LIMITS) return { ok: true, count: null }
  const limit = Number(env.DAILY_LIMIT ?? 2000)
  const key = `count:${new Date().toISOString().slice(0, 10)}`
  const current = Number((await env.LIMITS.get(key)) ?? 0)
  if (current >= limit) return { ok: false, count: current, limit }
  // KV nihai tutarlı: sayaç yaklaşıktır, yarışta birkaç istek fazla geçebilir.
  // Kesin tavan için OpenAI tarafındaki harcama sınırına güven.
  await env.LIMITS.put(key, String(current + 1), { expirationTtl: 172800 })
  return { ok: true, count: current + 1, limit }
}

/**
 * Deterministik çağrıları önbelleğe al.
 *
 * Denetim aynı kartı aynı metinle tekrar tekrar soruyor (yeniden çekim,
 * yeniden denetim). temperature 0 ise yanıt da aynı olacak — ikinci kez para
 * ödemenin anlamı yok. Doğrulama oylaması temperature > 0 ile koşuyor;
 * ORASI önbelleğe ALINMAZ, yoksa üç oy aynı yanıt olur ve oylama anlamını
 * yitirir.
 */
async function cacheKeyFor(body, model) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(model + '\n' + body))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return new Request(`https://greenlight-cache.invalid/${hex}`, { method: 'GET' })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') ?? ''
    const cors = corsHeaders(origin, env)
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    // Kök, /health ve /models aynı durum yanıtını verir.
    //
    // Kök adresin 404 vermesi teknik olarak doğruydu ama pratikte kötüydü:
    // adresi tarayıcıya yapıştıran ilk kişi "bilinmeyen yol" görüp Worker'ın
    // bozuk olduğunu sanıyor. Ayarlara adres '/v1' ile de girilebilmeli,
    // '/v1' olmadan da — hangisini yazdığın sınamayı düşürmesin.
    if (url.pathname === '/' || url.pathname === '/health' || url.pathname.endsWith('/models')) {
      const gate = gateKeeper(request, env, origin)
      if (gate) return new Response(gate.body, { status: gate.status, headers: { ...cors, 'content-type': 'application/json' } })
      return json({ ok: true, model: env.MODEL ?? 'gpt-4o-mini', vision: env.VISION !== '0' }, 200, cors)
    }

    if (!url.pathname.endsWith('/chat/completions')) return json({ error: 'bilinmeyen yol' }, 404, cors)
    if (request.method !== 'POST') return json({ error: 'yalnız POST' }, 405, cors)

    const gate = gateKeeper(request, env, origin)
    if (gate) return new Response(gate.body, { status: gate.status, headers: { ...cors, 'content-type': 'application/json' } })

    const bodyText = await request.text()
    let parsed
    try {
      parsed = JSON.parse(bodyText)
    } catch {
      return json({ error: 'gövde JSON değil' }, 400, cors)
    }

    // Model burada sabitlenir: eklentiyi yeniden dağıtmadan model değiştirmek
    // proxy'nin var oluş sebeplerinden biri.
    if (env.MODEL) parsed.model = env.MODEL
    const upstreamBody = JSON.stringify(parsed)

    const deterministic = !parsed.temperature
    const cache = caches.default
    const cacheKey = deterministic ? await cacheKeyFor(upstreamBody, parsed.model ?? '') : null

    // ÖNBELLEK, TAVANDAN ÖNCE. Sıra önemli: isabet sağlayıcıya gitmiyor,
    // para da ödetmiyor. Kotadan düşseydi, aynı denetimi ikinci kez koşmak
    // hiçbir maliyeti olmadan günlük hakkı yakardı.
    if (cacheKey) {
      const hit = await cache.match(cacheKey)
      if (hit) {
        const text = await hit.text()
        return new Response(text, {
          status: 200,
          headers: { ...cors, 'content-type': 'application/json', 'x-gl-cache': 'hit' },
        })
      }
    }

    // Sayaç yalnızca GERÇEKTEN sağlayıcıya gidecek çağrıları sayar.
    const limit = await underDailyLimit(env)
    if (!limit.ok) {
      return json(
        { error: `Günlük istek tavanı doldu (${limit.count}/${limit.limit}). Yarın sıfırlanır.` },
        429,
        cors,
      )
    }

    const base = env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'
    let upstream
    try {
      upstream = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: upstreamBody,
      })
    } catch (e) {
      return json({ error: `sağlayıcıya ulaşılamadı: ${e.message}` }, 502, cors)
    }

    const text = await upstream.text()

    // Sayaç loglanır, İÇERİK loglanmaz.
    console.log(
      JSON.stringify({
        at: new Date().toISOString(),
        status: upstream.status,
        bytes: text.length,
        gunluk: limit.count,
        cache: cacheKey ? 'miss' : 'atlandı',
      }),
    )

    if (upstream.ok && cacheKey) {
      // Önbellek 6 saat: kural kartı ya da listing değişirse eski yanıt
      // sonsuza kadar yapışmasın.
      const toCache = new Response(text, {
        headers: { 'content-type': 'application/json', 'cache-control': 'max-age=21600' },
      })
      await cache.put(cacheKey, toCache)
    }

    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, 'content-type': 'application/json', 'x-gl-cache': cacheKey ? 'miss' : 'off' },
    })
  },
}
