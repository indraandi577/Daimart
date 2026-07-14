-- ================================================================
-- DaiMart - Schema Tambahan: Sistem Member Guru
-- Jalankan di Supabase SQL Editor setelah schema.sql utama
-- ================================================================

-- ─── TABEL: members ─────────────────────────────────────────
create table if not exists public.members (
  id              uuid primary key default uuid_generate_v4(),
  nama            text not null,
  kode_member     text unique not null,  -- misal: MBR-001
  jabatan         text,                  -- Guru Matematika, Wali Kelas, dll
  voucher_bulanan integer not null default 0,  -- nominal voucher per bulan (Rp)
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── TABEL: member_transactions ─────────────────────────────
-- Histori belanja member di kasir (linked ke transactions)
create table if not exists public.member_transactions (
  id             uuid primary key default uuid_generate_v4(),
  member_id      uuid not null references public.members(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  total_amount   integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ─── TABEL: member_vouchers ─────────────────────────────────
-- Rekap voucher per member per bulan
create table if not exists public.member_vouchers (
  id           uuid primary key default uuid_generate_v4(),
  member_id    uuid not null references public.members(id) on delete cascade,
  bulan        integer not null,   -- 1-12
  tahun        integer not null,
  nominal      integer not null,   -- snapshot nominal saat bulan itu
  status       text not null default 'belum',  -- belum | sudah
  diambil_at   timestamptz,        -- kapan diambil
  diambil_oleh uuid references public.profiles(id),  -- kasir yang konfirmasi
  created_at   timestamptz not null default now(),

  -- Satu member hanya bisa punya 1 voucher per bulan per tahun
  unique (member_id, bulan, tahun)
);

-- ─── INDEXES ─────────────────────────────────────────────────
create index if not exists idx_member_kode       on public.members(kode_member);
create index if not exists idx_member_active     on public.members(is_active);
create index if not exists idx_member_trx_member on public.member_transactions(member_id);
create index if not exists idx_member_trx_date   on public.member_transactions(created_at desc);
create index if not exists idx_voucher_member    on public.member_vouchers(member_id);
create index if not exists idx_voucher_periode   on public.member_vouchers(tahun, bulan);

-- ─── TRIGGER updated_at ──────────────────────────────────────
drop trigger if exists trg_members_updated_at on public.members;
create trigger trg_members_updated_at
  before update on public.members
  for each row execute function public.handle_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.members             enable row level security;
alter table public.member_transactions enable row level security;
alter table public.member_vouchers     enable row level security;

create policy "members_all"      on public.members             for all using (auth.role() = 'authenticated');
create policy "member_trx_all"   on public.member_transactions for all using (auth.role() = 'authenticated');
create policy "member_voucher_all" on public.member_vouchers   for all using (auth.role() = 'authenticated');

-- ─── FUNCTION: auto-generate voucher bulanan ────────────────
-- Dipanggil manual atau via cron untuk generate voucher bulan baru
create or replace function public.generate_voucher_bulanan(p_bulan integer, p_tahun integer)
returns integer language plpgsql security definer as $$
declare
  inserted integer := 0;
begin
  insert into public.member_vouchers (member_id, bulan, tahun, nominal, status)
  select id, p_bulan, p_tahun, voucher_bulanan, 'belum'
  from public.members
  where is_active = true
    and voucher_bulanan > 0
  on conflict (member_id, bulan, tahun) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;
