-- Greenlight — ders deposu şeması (Supabase / Postgres)
--
-- İŞ BÖLÜMÜ:
--   Supabase → sorguladığın kısım. Küçük, indeksli, filtrelenebilir.
--   R2       → okuduğun kısım. Ders gövdeleri (lessons/{id}.md) ve ham
--              reject metinleri (rejects/{id}.txt). Seçim burada, okuma orada.

create table if not exists lessons (
  id            text primary key,
  -- corpus kartına bağ. NULL ise KAPSAMA BOŞLUĞU: bu yüzden reddedildik
  -- ama hiçbir kartımız kapsamıyor. Rapor bunu alarm olarak gösterir.
  rule_id       text,
  platform      text not null check (platform in ('apple','google')),
  guideline     text not null,
  title         text not null,
  -- Prompt'a giren kısa özet. Uzun gövde R2'de (body_key).
  summary       text not null,
  artifact      text,
  severity      text not null check (severity in ('high','medium','low')),
  -- draft: onaya kadar denetimi ETKİLEMEZ. Hatalı bir çıkarımın sessizce
  -- rapor davranışını değiştirmesini engelleyen tek koruma bu.
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

-- example_count'u elle güncellemek kaçınılmaz olarak tutarsızlaşır.
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
