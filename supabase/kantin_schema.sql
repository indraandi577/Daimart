-- ================================================================
-- DaiMart - Schema Tambahan: Sistem Kantin / Titip Snack
-- Jalankan di Supabase SQL Editor setelah schema.sql utama
-- ================================================================

-- ─── TABEL: kantin_sesi ─────────────────────────────────────
-- Satu sesi = satu hari operasional kantin
create table if not exists public.kantin_sesi (
  id           uuid primary key default uuid_generate_v4(),
  tanggal      date not null default current_date,
  catatan      text,
  status       text not null default 'aktif', -- aktif | selesai
  komisi_total integer not null default 0,    -- total komisi kantin saat sesi selesai
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── TABEL: kantin_penitip ──────────────────────────────────
-- Satu penitip per sesi (bisa banyak penitip per sesi)
create table if not exists public.kantin_penitip (
  id         uuid primary key default uuid_generate_v4(),
  sesi_id    uuid not null references public.kantin_sesi(id) on delete cascade,
  nama       text not null,
  created_at timestamptz not null default now()
);

-- ─── TABEL: kantin_snack ────────────────────────────────────
-- Item snack per penitip (satu penitip bisa banyak snack)
create table if not exists public.kantin_snack (
  id            uuid primary key default uuid_generate_v4(),
  penitip_id    uuid not null references public.kantin_penitip(id) on delete cascade,
  nama_snack    text not null,
  harga_jual    integer not null default 0,  -- harga per pcs ditentukan penitip
  qty_titip     integer not null default 0,  -- jumlah yang dititipkan pagi
  qty_terjual   integer not null default 0,  -- diisi setelah istirahat selesai
  komisi_pct    integer not null default 15, -- % komisi kantin (default 15%)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Validasi: terjual tidak boleh melebihi titipan
  constraint chk_terjual check (qty_terjual <= qty_titip),
  constraint chk_qty_positif check (qty_titip >= 0 and qty_terjual >= 0)
);

-- ─── INDEXES ─────────────────────────────────────────────────
create index if not exists idx_kantin_sesi_tanggal   on public.kantin_sesi(tanggal desc);
create index if not exists idx_kantin_penitip_sesi   on public.kantin_penitip(sesi_id);
create index if not exists idx_kantin_snack_penitip  on public.kantin_snack(penitip_id);

-- ─── TRIGGER updated_at ──────────────────────────────────────
drop trigger if exists trg_kantin_sesi_updated_at on public.kantin_sesi;
create trigger trg_kantin_sesi_updated_at
  before update on public.kantin_sesi
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_kantin_snack_updated_at on public.kantin_snack;
create trigger trg_kantin_snack_updated_at
  before update on public.kantin_snack
  for each row execute function public.handle_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.kantin_sesi    enable row level security;
alter table public.kantin_penitip enable row level security;
alter table public.kantin_snack   enable row level security;

-- Semua authenticated bisa baca & tulis (kasir & owner bisa akses kantin)
create policy "kantin_sesi_all"    on public.kantin_sesi    for all using (auth.role() = 'authenticated');
create policy "kantin_penitip_all" on public.kantin_penitip for all using (auth.role() = 'authenticated');
create policy "kantin_snack_all"   on public.kantin_snack   for all using (auth.role() = 'authenticated');
