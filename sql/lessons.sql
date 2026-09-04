-- Greenlight — ortak ders havuzu şeması (kendi Postgres'in)
--
-- NEREDE KOŞAR: havuz/docker-compose.yml içindeki `db` servisi. API açılışta
-- bu dosyayı OLDUĞU GİBİ uygular; o yüzden her ifade YENİDEN ÇALIŞTIRILABİLİR
-- olmak zorunda (`if not exists`, `or replace`). Sürüm yükseltmek = kabı
-- yeniden başlatmak, elle migration koşturmak değil.
--
-- İŞ BÖLÜMÜ:
--   lessons / reject_cases / lesson_vectors → SORGULADIĞIN kısım. Küçük,
--     indeksli, filtrelenebilir. "apple / 2.3.3 için aktif dersler" burada koşar.
--   blobs → OKUDUĞUN kısım. Ders gövdeleri (bodies/{id}.md) ve ham reject
--     metinleri (rejects/{id}.txt). Büyük, nadiren okunur, hiç filtrelenmez.
--
-- NEDEN AYRI TABLO, AYRI SİSTEM DEĞİL: bu ayrım eskiden Supabase (indeks) +
-- R2 (gövde) diye İKİ SERVİSE dağıtılmıştı, çünkü orada satır depolamak
-- pahalıydı ve nesne depolamak ucuzdu. Kendi Postgres'inde o fiyat farkı YOK:
-- birkaç bin ders × birkaç KB markdown toplamda birkaç MB. İkinci bir depolama
-- sistemi eklemek, yedeklenecek ikinci bir şey, düşecek ikinci bir bağımlılık
-- ve tutarsız kalabilecek ikinci bir gerçeklik demekti — çözmediği bir sorunun
-- bedeli. Ayrım ANAHTAR düzeyinde korunuyor (`body_key`, `raw_key`): yarın
-- gövdeler MinIO'ya ya da S3'e taşınırsa değişen tek şey API'deki blob
-- katmanı olur, şemanın ve istemcinin geri kalanı değişmez.

create table if not exists lessons (
  id            text primary key,
  -- corpus kartına bağ. NULL ise KAPSAMA BOŞLUĞU: bu yüzden reddedildik
  -- ama hiçbir kartımız kapsamıyor. Rapor bunu alarm olarak gösterir.
  rule_id       text,
  platform      text not null check (platform in ('apple','google')),
  guideline     text not null,
  -- listing: mağaza kaydında denetlenebilir · in-app: çalışma anı davranışı
  scope         text not null default 'listing' check (scope in ('listing','in-app')),
  title         text not null,
  -- Prompt'a giren kısa özet. Uzun gövde blobs'ta (body_key).
  summary       text not null,
  -- Kalıbı listing'de YAKALAYAN somut belirtiler. Özet "ne olduğunu" söyler,
  -- bu "neye bakayım"ı — denetleyen modele asıl gereken ikincisi.
  signals       text[] not null default '{}',
  -- Kalıbın SAYILMADIĞI durum. Kartlardaki negativeExample'ın ders karşılığı.
  false_positive text,
  artifact      text,
  severity      text not null check (severity in ('high','medium','low')),
  -- draft: onaya kadar denetimi ETKİLEMEZ. Hatalı bir çıkarımın sessizce
  -- rapor davranışını değiştirmesini engelleyen tek koruma bu.
  --
  -- ORTAK HAVUZDA DAHA DA KRİTİK: artık taslağı üreten kişiyle denetimi
  -- koşturan kişi aynı olmak zorunda değil. Ahmet'in yanlış çıkarımı,
  -- onaylanana kadar Ayşe'nin raporunu değiştiremez.
  status        text not null default 'draft'
                check (status in ('draft','active','retired')),
  body_key      text not null,
  example_count int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Denetim her koşuda bu filtreyi çalıştırır.
create index if not exists lessons_active_idx
  on lessons (platform, status) where status = 'active';

-- Yeni reject geldiğinde aday havuzu bu indeksle daralır.
create index if not exists lessons_match_idx
  on lessons (platform, guideline) where status <> 'retired';

create index if not exists lessons_rule_idx on lessons (rule_id);

-- Tablo daha önce kurulduysa `create table if not exists` sütun EKLEMEZ.
alter table lessons add column if not exists signals text[] not null default '{}';
alter table lessons add column if not exists false_positive text;

create table if not exists reject_cases (
  id            uuid primary key,
  lesson_id     text not null references lessons(id) on delete cascade,
  app_name      text not null,
  platform      text not null check (platform in ('apple','google')),
  rejected_at   date,
  guideline     text not null,
  artifact      text,
  -- Uygulamanın KENDİ metninden alıntı. Rapordaki "örnek reject" bu.
  excerpt       text not null default '',
  -- Reviewer'ın cümlesi. Bu ikisi farklı şeyler, karıştırma.
  reviewer_text text not null,
  resolution    text,
  raw_key       text not null,
  status        text not null default 'draft' check (status in ('draft','active')),
  created_at    timestamptz not null default now()
);

create index if not exists reject_cases_lesson_idx
  on reject_cases (lesson_id, rejected_at desc);

-- example_count'u elle güncellemek kaçınılmaz olarak tutarsızlaşır. Havuza
-- iki makineden aynı anda yazılabildiği için bu artık teorik bir risk değil.
create or replace function sync_lesson_example_count() returns trigger as $$
begin
  update lessons set
    example_count = (select count(*) from reject_cases where lesson_id =
      coalesce(new.lesson_id, old.lesson_id)),
    updated_at = now()
  where id = coalesce(new.lesson_id, old.lesson_id);
  return null;
end;
$$ language plpgsql;

drop trigger if exists reject_cases_count on reject_cases;
create trigger reject_cases_count
  after insert or delete on reject_cases
  for each row execute function sync_lesson_example_count();


-- Ders vektörleri — anlamsal aday araması (src/lessons/embed.ts).
--
-- NEDEN AYRI TABLO: her `select * from lessons` ile 512 sayılık diziyi de
-- taşımak, vektörü hiç kullanmayan denetim yolunu bedava yavaşlatırdı.
--
-- embedding double precision[] — pgvector DEĞİL, bilerek. Birkaç bin dersin
-- tamamını çekip kosinüsü istemci tarafında hesaplamak bu ölçekte
-- milisaniyeler sürüyor; uzantı + ANN indeksi + `<=>` sorgusu, çözmediği bir
-- sorunun karmaşıklığı olurdu. On bini geçerse burası `vector(512)` olur ve
-- benzerlik API'de koşar; şemanın geri kalanı değişmez.
create table if not exists lesson_vectors (
  lesson_id  text primary key references lessons(id) on delete cascade,
  -- Bayatlık anahtarı: gömülen metin + model + boyut. Uyuşmuyorsa yeniden
  -- gömülür — model değiştirmek elle temizlik gerektirmesin.
  model      text not null,
  dim        int  not null,
  hash       text not null,
  embedding  double precision[] not null,
  updated_at timestamptz not null default now()
);


-- Gövdeler ve ham reject metinleri.
--
-- Anahtar şeması ingest.ts'ten geliyor ve DEĞİŞMEDİ:
--   bodies/{ders-id}.md     ← dersin uzun anlatımı
--   rejects/{vaka-id}.txt   ← Apple'ın yazdığının TAMAMI, dokunulmamış hâli
--
-- Ham metin bilerek saklanıyor: çıkarım sonradan iyileştiğinde aynı metni
-- yeniden işleyebilmek gerekiyor, yoksa kaynak izi kaybolur.
create table if not exists blobs (
  key          text primary key,
  content      text not null,
  content_type text not null default 'text/plain',
  updated_at   timestamptz not null default now()
);
