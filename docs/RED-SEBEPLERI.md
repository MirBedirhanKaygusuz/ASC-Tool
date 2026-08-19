# En sık red sebepleri — triaj

Kaynak: Mir'in derlediği liste (2026-08-19). Corpus'un yazılma sırasını bu
belirler; tahmin değil.

**Kritik ayrım:** Greenlight sadece **listing**'i görür — metinler, görseller,
IAP tanımları, kategori/yaş, URL'ler, review notları. Derlenmiş uygulamayı ve
çalışma anındaki davranışı **görmez**. Aşağıdaki her madde buna göre sınıflandı.

Sınıflar:
- `LINT` — kod ile kesin kontrol, LLM yok
- `MUHAKEME` — LLM metni yorumlar
- `BİLGİ` — LLM + karta yazılmış olgular (`facts`)
- `GÖRSEL` — ekran görüntüsü denetimi gerekir (vision)
- `ERİŞİLMEZ` — listing'den görülmez, binary/çalışma anı gerekir (Faz 2)

---

| # | Red sebebi | Sınıf | Durum | Not |
|---|---|---|---|---|
| 1 | Açılışta çökme | ERİŞİLMEZ | — | Cihazda çalıştırmak gerekir. Statik binary analizi bile güvenilir yakalamaz. |
| 2 | Demo hesap vermeme | LINT | ✅ var | `lint-demo-account-missing` |
| 3 | Demo hesap geçersiz | LINT (kısmi) | ⬜ | Placeholder/boş tespiti yapılabilir ("test/test", "TODO"). Gerçek doğrulama giriş uç noktası ister. |
| 4 | Özellik bulunamıyor | MUHAKEME | ⬜ | Denetlenebilir yarısı: açıklamanın vaat ettiği özelliğin hiçbir ekran görüntüsünde olmaması. Cross-artifact. |
| 5 | Gizlilik bilgisi yok | LINT | 🟡 kısmi | URL kontrolü ✅ var. App Privacy etiketinin varlığı ASC API alanı ister. |
| 6 | Etiket uyuşmuyor | MUHAKEME (kısmi) | ⬜ | Tam kontrol ağ/binary ister. Yakalanabilir yarısı: açıklama "veri toplamıyoruz" derken etiketin takip beyan etmesi. |
| 7 | Destek linki ölü | LINT | ✅ var | `lint-support-url-dead` |
| 8 | Abonelik bilgisi yok | MUHAKEME | ✅ var | `apple-3.1.2-subscription-disclosure` |
| 9 | Paywall EULA yok | **GÖRSEL** | ⬜ | Paywall ekran görüntüsünde Kullanım Şartları/EULA linki görünüyor mu. |
| 10 | Fiyat görünmemesi | **GÖRSEL** + LINT | 🟡 kısmi | Fiyat çelişkisi ✅ var. Paywall'da fiyatın görünürlüğü görsel denetim ister. |
| 11 | Geri yükleme yok (restore) | **GÖRSEL** | ⬜ | Paywall ekran görüntüsünde "Restore Purchases" düğmesi var mı. |
| 12 | Dışarı ödeme linki | MUHAKEME (kısmi) | ⬜ | Metinde "sitemizden ucuza al" tarzı yönlendirme + şüpheli URL. Uygulama içi hali erişilmez. |
| 13 | Hesap silme yok | ERİŞİLMEZ | — | Uygulama içi akış. Listing'den görülmez. |
| 14 | Apple ile giriş yok | **GÖRSEL** | ⬜ | Giriş ekranı görüntüsünde Google/Facebook var, Apple yoksa yakalanır. |
| 15 | İzin metni | ERİŞİLMEZ | — | Info.plist purpose string'leri — binary. Faz 2. |
| 16 | Takip izni (ATT) | ERİŞİLMEZ | — | Binary/çalışma anı. Etiket geldiğinde çapraz kontrol mümkün olabilir. |
| 17 | Yakında ekranı | **GÖRSEL** + MUHAKEME | ⬜ | Ekran görüntüsünde/metinde "coming soon", boş placeholder ekran. |
| 18 | Görseller uymaması | **GÖRSEL** | ⬜ | Soruyu daralt: "gerçek uygulama arayüzü mü, yoksa saf pazarlama kompozisyonu mu?" |
| 19 | Metinde başka marka | BİLGİ | 🟡 kısmi | `apple-2.3.7` keyword alanında ✅ var; açıklama/alt başlığa genişletilecek. `facts` şart. |
| 20 | Yaş sınırı yanlışları | LINT + GÖRSEL | ⬜ | UGC var + 4+ derecelendirme = kesin bayrak. Görsel içerik/derecelendirme tutarlılığı vision ister. |
| 21 | Şablon uygulama | ERİŞİLMEZ | — | Listing'den güvenilir sinyal yok. Yazılırsa yalancı alarm üretir. **Kart yazma.** |
| 22 | Olmayan özellik vaadi | MUHAKEME | ⬜ | 4 ile aynı mekanizma: vaat vs ekran görüntüsü. Tek kartta birleşebilir. |
| 23 | Aslında bir web sayfası | ERİŞİLMEZ | — | Zayıf sinyal. Yazılırsa yalancı alarm üretir. **Kart yazma.** |

---

## Sayım

| Sınıf | Adet | Yorum |
|---|---|---|
| ✅ Zaten çalışıyor | 3 | 2, 7, 8 (+5, 10, 19 kısmi) |
| LINT ile eklenebilir | 3 | 3, 5, 20 |
| MUHAKEME kartı | 5 | 4, 6, 12, 19, 22 |
| **GÖRSEL kartı** | **7** | **9, 10, 11, 14, 17, 18, 20** |
| ERİŞİLMEZ (Faz 2 / hiç) | 6 | 1, 13, 15, 16, 21, 23 |

## Bu listenin değiştirdiği iki şey

**1. Vision "sonra" değil, ilk sırada.**
23 maddenin 7'si ekran görüntüsünde yaşıyor. Daha da önemlisi: **9, 10, 11 ve
kısmen 8 — dördü de TEK bir görselde, paywall ekran görüntüsünde.** EULA linki,
fiyat, dönem, otomatik yenileme, restore düğmesi; hepsi orada. Yazılacak ilk
görsel kart bu olmalı: *"paywall ekran görüntüsü"* kartı tek başına dört red
sebebini kapsar.

Önceki planda vision'ı Faz 2'ye koymuştum. Bu veri onu yanlışlıyor.

**2. Mevcut yerel model bunu yapamaz.**
`qwen3:8b` metin-only. Yukarıdaki 7 madde için vision gerekiyor:
- `gemma3:12b` — vision var, ~8 GB, 16 GB'a sığar
- `qwen2.5vl:7b` — daha küçük, görsel odaklı
- ya da paywall gibi kritik görsellerde bulut vision (case buna açıkça izin veriyor)

Karar ölçümle verilmeli: aynı paywall görselini üç seçenekle koşup hangisi
EULA linkini/fiyatı okuyabiliyor diye bakmak.

## Kart yazılmayacaklar

21 (şablon uygulama) ve 23 (aslında web sayfası) için kart **yazmıyoruz**.
Listing'den güvenilir sinyal yok; yazılırsa yalancı alarm üretir ve aracın
güvenilirliğini bozar. Bunlar insan gözü / Faz 2 işi.
