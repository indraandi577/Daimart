-- ================================================================
-- DaiMart - Schema Member Guru (Wallet/Saldo System)
-- Jalankan di Supabase SQL Editor setelah schema.sql utama
-- ================================================================

-- ─── TABEL: members ─────────────────────────────────────────
create table if not exists public.members (
  id                  uuid primary key default uuid_generate_v4(),
  nama                text not null,
  kode_member         text unique not null,
  jabatan             text,
  topup_bulanan       integer not null default 0,  -- nominal top up otomatis per bulan
  saldo               integer not null default 0,  -- saldo wallet saat ini
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── TABEL: member_transactions ─────────────────────────────
-- Histori SEMUA belanja member (tunai maupun pakai saldo)
create table if not exists public.member_transactions (
  id              uuid primary key default uuid_generate_v4(),
  member_id       uuid not null references public.members(id) on delete cascade,
  transaction_id  uuid references public.transactions(id) on delete set null,
  total_amount    integer not null default 0,   -- total belanja
  bayar_saldo     integer not null default 0,   -- bagian yang dibayar pakai saldo
  bayar_tunai     integer not null default 0,   -- bagian yang dibayar tunai/QRIS
  created_at      timestamptz not null default now()
);

-- ─── TABEL: member_topups ───────────────────────────────────
-- Riwayat top up saldo per member
create table if not exists public.member_topups (
  id           uuid primary key default uuid_generate_v4(),
  member_id    uuid not null references public.members(id) on delete cascade,
  nominal      integer not null,
  bulan        integer not null,   -- 1-12
  tahun        integer not null,
  keterangan   text,               -- 'Top Up Otomatis Jan 2026', dll
  oleh         uuid references public.profiles(id),
  created_at   timestamptz not null default now(),

  -- Satu top up otomatis per member per bulan
  unique (member_id, bulan, tahun)
);

-- ─── INDEXES ─────────────────────────────────────────────────
create index if not exists idx_member_kode        on public.members(kode_member);
create index if not exists idx_member_active      on public.members(is_active);
create index if not exists idx_member_trx_member  on public.member_transactions(member_id);
create index if not exists idx_member_trx_date    on public.member_transactions(created_at desc);
create index if not exists idx_member_topup       on public.member_topups(member_id);

-- ─── TRIGGER updated_at ──────────────────────────────────────
drop trigger if exists trg_members_updated_at on public.members;
create trigger trg_members_updated_at
  before update on public.members
  for each row execute function public.handle_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.members             enable row level security;
alter table public.member_transactions enable row level security;
alter table public.member_topups       enable row level security;

drop policy if exists "members_all"      on public.members;
drop policy if exists "member_trx_all"   on public.member_transactions;
drop policy if exists "member_topup_all" on public.member_topups;

create policy "members_all"      on public.members             for all using (auth.role() = 'authenticated');
create policy "member_trx_all"   on public.member_transactions for all using (auth.role() = 'authenticated');
create policy "member_topup_all" on public.member_topups       for all using (auth.role() = 'authenticated');

-- ─── FUNCTION: top up saldo semua member aktif ───────────────
create or replace function public.topup_saldo_bulanan(p_bulan integer, p_tahun integer)
returns integer language plpgsql security definer as $$
declare
  rec record;
  inserted integer := 0;
begin
  for rec in
    select id, topup_bulanan from public.members
    where is_active = true and topup_bulanan > 0
  loop
    -- Insert riwayat top up (skip kalau bulan ini sudah pernah)
    insert into public.member_topups (member_id, nominal, bulan, tahun, keterangan)
    values (
      rec.id,
      rec.topup_bulanan,
      p_bulan,
      p_tahun,
      'Top Up Otomatis ' || to_char(make_date(p_tahun, p_bulan, 1), 'Mon YYYY')
    )
    on conflict (member_id, bulan, tahun) do nothing;

    -- Tambah saldo member jika insert berhasil
    if found then
      update public.members
      set saldo = saldo + rec.topup_bulanan
      where id = rec.id;
      inserted := inserted + 1;
    end if;
  end loop;

  return inserted;
end;
$$;
