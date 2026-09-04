import type { LlmProvider, LlmRequest, LlmResponse, Block } from './types.js'

/**
 * OpenAI-uyumlu HTTP sağlayıcı.
 *
 * Tek dosya üç senaryoyu birden karşılıyor — hepsi aynı protokolü konuşuyor:
 *   - freellmapi (geliştirme; ücretsiz katmanları tek uca toplar)
 *   - LM Studio / vLLM / llama.cpp server (yerel alternatif)
 *   - ücretli API'ler (üretim; sadece baseUrl + key değişir)
 *
 * Yani "sonra ücretli API'ye geçeriz" adımı bir kod değişikliği değil, bir
 * .env değişikliği.
 *
 * YAPILANDIRILMIŞ ÇIKTI NOTU: freellmapi arkada 29 farklı sağlayıcıya
 * yönlendiriyor ve hepsi katı `json_schema` desteklemiyor. O yüzden
 * varsayılan mod `json_object` + şemayı prompt'a gömmek — her sağlayıcıda
 * çalışır. Uç nokta katı şemayı destekliyorsa OPENAI_STRICT_SCHEMA=1 ile aç.
 */
export interface ProviderExtras {
  label?: string
  /**
   * Anahtarsız mod: istek bir proxy'ye gidiyor ve anahtarı O ekliyor.
   * Eklentide anahtar YOK — olsaydı klasörü açan herkes görürdü. Bu bayrak
   * açıkken Authorization başlığı gönderilmez, healthcheck de şikâyet etmez.
   */
  keyless?: boolean
  /** Proxy'yi tesadüfen bulan birinin kullanmasını zorlaştıran belirteç. */
  clientToken?: string
  /**
   * Görsel ayrıntı seviyesi — maliyetin asıl kaldıracı.
   *
   * gpt-4o-mini görselleri çok yüksek çarpanla sayıyor: "high" ayrıntıda tek
   * bir ekran görüntüsü on binlerce token ediyor ve 200k TPM'lik hesapta
   * denetim tek çağrıda kotayı yakıyor. "low" görseli 512x512'ye indirip
   * sabit maliyete çekiyor. BEDELİ GERÇEK: paywall'daki küçük punto fiyat
   * metni okunamayabilir. Vision için güçlü modele geçince "high" yap.
   *
   * NEDEN BURADA: eskiden modül düzeyinde process.env'den okunuyordu ve bu,
   * dosyayı tarayıcı paketine sokulamaz hale getiriyordu. Ortam okuma
   * fabrikanın (llm/index.ts) işi; sağlayıcı yalnız değeri alır.
   */
  imageDetail?: 'low' | 'high' | 'auto'
}

export class OpenAICompatibleProvider implements LlmProvider {
  readonly name: string

  constructor(
    readonly model: string,
    private readonly baseUrl: string,
    private readonly apiKey: string,
    readonly supportsVision: boolean,
    readonly concurrency: number,
    private readonly strictSchema: boolean,
    private readonly extra: ProviderExtras = {},
  ) {
    this.name = extra.label ?? 'openai'
  }

  private authHeaders(): Record<string, string> {
    const h: Record<string, string> = {}
    if (this.apiKey) h.authorization = `Bearer ${this.apiKey}`
    if (this.extra.clientToken) h['x-gl-token'] = this.extra.clientToken
    return h
  }

  async healthcheck(): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (!this.apiKey && !this.extra.keyless) {
      return { ok: false, reason: `API anahtarı yok (${this.name}). .env içinde OPENAI_API_KEY doldur.` }
    }
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.authHeaders(),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return { ok: false, reason: `${this.baseUrl}/models → HTTP ${res.status}` }
      return { ok: true }
    } catch (e) {
      return { ok: false, reason: `${this.baseUrl} adresine ulaşılamıyor: ${(e as Error).message}` }
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
  private static tpmLimit = 180_000
  private static pencere: Array<{ t: number; tok: number }> = []

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
  private tahminiToken(body: unknown): number {
    const s = JSON.stringify(body)
    const gorselSayisi = (s.match(/base64/g) ?? []).length
    const base64Uzunluk = [...s.matchAll(/base64,?"?,?\s*"?([A-Za-z0-9+/=]{100,})/g)]
      .reduce((n, m) => n + m[1]!.length, 0)
    const metinUzunluk = Math.max(0, s.length - base64Uzunluk)
    const gorselTok = gorselSayisi * (this.extra.imageDetail === 'high' ? 1200 : 100)
    return Math.ceil(metinUzunluk / 4) + gorselTok + 1000
  }

  private async valiyeSor(tahmin: number): Promise<void> {
    const K = OpenAICompatibleProvider
    for (;;) {
      const simdi = Date.now()
      K.pencere = K.pencere.filter((x) => simdi - x.t < 60_000)
      const kullanilan = K.pencere.reduce((n, x) => n + x.tok, 0)
      if (kullanilan + tahmin <= K.tpmLimit) {
        K.pencere.push({ t: simdi, tok: tahmin })
        return
      }
      // PENCERE BOŞSA tek bir istek bütün bütçeden büyük demektir. Bölemeyiz;
      // geçirip pencereye yazıyoruz. Beklemeye devam etseydik sonsuza kadar
      // dönerdik — ve `pencere[0]` tanımsız olduğu için çökerdik. Sahada tam
      // bu oldu: "Cannot read properties of undefined (reading 't')".
      if (!K.pencere.length) {
        K.pencere.push({ t: simdi, tok: tahmin })
        return
      }
      const enEski = K.pencere[0]!.t
      await new Promise((r) => setTimeout(r, Math.max(250, 60_000 - (simdi - enEski) + 250)))
    }
  }

  /** 429 gövdesinden gerçek sınırı öğren. Bir kez öğrenmek yeter. */
  private sinirOgren(govde: string): void {
    const m = /Limit (\d+)/.exec(govde)
    if (!m) return
    const gercek = Number(m[1])
    if (!Number.isFinite(gercek) || gercek <= 0) return
    // %85'inde kal: valinin tahmini kaba, pay bırakıyoruz. Ayrıca aynı
    // hesapta başka biri de çağrı yapıyor olabilir (şirket kurulumu).
    const yeni = Math.floor(gercek * 0.85)
    const K = OpenAICompatibleProvider
    if (yeni < K.tpmLimit) K.tpmLimit = yeni
  }

  /**
   * 429 ve 5xx'te yeniden dener.
   *
   * Görsel içeren denetimde çağrı başına ~17k token gidiyor; 12 kart eşzamanlı
   * koşunca dakikalık token limiti (TPM) anında doluyor ve tek bir 429 tüm
   * denetimi düşürüyordu. OpenAI "kaç saniye sonra" bilgisini header'da
   * veriyor — tahmin etmek yerine onu bekliyoruz.
   */
  private async send(body: unknown): Promise<Response> {
    const MAX_ATTEMPTS = 8
    let lastText = ''
    let lastStatus = 0

    const tahmin = this.tahminiToken(body)
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // Kota dolacaksa gitmeden bekle. 429 yemek, beklemekten pahalı:
      // yediğin 429 de kotadan sayılıyor.
      await this.valiyeSor(tahmin)
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...this.authHeaders() },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5 * 60_000),
      })
      if (res.ok) return res

      lastStatus = res.status
      lastText = (await res.text()).slice(0, 300)
      if (res.status === 429) this.sinirOgren(lastText)
      const retriable = res.status === 429 || res.status >= 500
      if (!retriable || attempt === MAX_ATTEMPTS) break

      const ms = res.headers.get('retry-after-ms')
      const secs = res.headers.get('retry-after')
      // Gövdedeki ifade iki biçimde geliyor: "try again in 2.898s" ve
      // "try again in 544ms". Birim yakalanmazsa saniyeyi milisaniye sanıp
      // 544 ms yerine 544 ms'i doğru, 2.898s'i 3 ms okurduk.
      const m = lastText.match(/try again in ([\d.]+)(ms|s)\b/)
      const fromBody = m ? Number(m[1]) * (m[2] === 's' ? 1000 : 1) : NaN
      const hint = [Number(ms), Number(secs) * 1000, fromBody].find((n) => Number.isFinite(n) && n > 0) ?? 0

      // İpucuna körü körüne uymuyoruz. OpenAI "544 ms sonra dene" derken tek
      // istemci varsaydığı için haklı; ama 4 işçi aynı anda dönünce dakikalık
      // kotayı anında yeniden dolduruyor ve 429 sonsuza dek sürüyor. Taban
      // üstel bekleme + rastgele sapma, işçileri birbirinden ayırıyor.
      const floor = Math.min(20_000, 1000 * 2 ** attempt)
      const jitter = Math.floor(Math.random() * 1000)
      await new Promise((r) => setTimeout(r, Math.min(60_000, Math.max(hint, floor) + jitter)))
    }

    throw new Error(`${this.name} ${lastStatus}: ${lastText}`)
  }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const t0 = Date.now()
    const maxTokens = req.maxTokens ?? 1024

    // Şemayı prompt'a gömüyoruz: katı json_schema'yı desteklemeyen
    // sağlayıcılarda tek güvence bu.
    const schemaHint = this.strictSchema
      ? ''
      : `\n\nYanıtın TAM OLARAK şu JSON şemasına uymalı:\n${JSON.stringify(req.schema)}`

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: maxTokens,
      temperature: req.temperature ?? 0.2,
      ...(req.seed !== undefined ? { seed: req.seed } : {}),
      response_format: this.strictSchema
        ? { type: 'json_schema', json_schema: { name: 'result', schema: req.schema, strict: true } }
        : { type: 'json_object' },
      messages: [
        { role: 'system', content: req.system + schemaHint },
        { role: 'user', content: toContent(req.prefix, this.extra.imageDetail) },
        { role: 'user', content: req.suffix },
      ],
    }

    const res = await this.send(body)
    const data = (await res.json()) as ChatCompletion
    const choice = data.choices?.[0]
    const raw = choice?.message?.content ?? ''

    return {
      json: safeParse(raw),
      raw,
      truncated: choice?.finish_reason === 'length',
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens ?? 0,
        ms: Date.now() - t0,
      },
    }
  }
}

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    prompt_tokens_details?: { cached_tokens?: number }
  }
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }


function toContent(blocks: Block[], detail: 'low' | 'high' | 'auto' = 'low'): string | ContentPart[] {
  const hasImage = blocks.some((b) => b.type === 'image')
  if (!hasImage) {
    return blocks.map((b) => (b.type === 'text' ? b.text : '')).join('\n')
  }
  return blocks.map<ContentPart>((b) =>
    b.type === 'text'
      ? { type: 'text', text: b.text }
      : {
          type: 'image_url',
          image_url: { url: `data:${b.mime};base64,${b.base64}`, detail },
        },
  )
}

function safeParse(s: string): unknown | null {
  try {
    return JSON.parse(s)
  } catch {
    const m = s.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      return JSON.parse(m[0])
    } catch {
      return null
    }
  }
}
