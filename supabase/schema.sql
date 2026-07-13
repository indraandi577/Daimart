-- ================================================================
-- DaiMart - Supabase Database Schema
-- AMAN dijalankan berkali-kali (idempotent)
-- Pakai IF NOT EXISTS di semua perintah
-- ================================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── ENUM TYPES ─────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('owner', 'kasir', 'gudang');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cash', 'qris', 'debit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_status as enum ('completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ─── TABEL: profiles ────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  role        user_role not null default 'kasir',
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── TABEL: categories ──────────────────────────────────────
create table if not exists public.categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  icon       text,
  color      text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── TABEL: products ────────────────────────────────────────
create table if not exists public.products (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  barcode       text unique,
  category_id   uuid references public.categories(id) on delete set null,
  price_sell    integer not null default 0,
  price_buy     integer not null default 0,
  stock         integer not null default 0,
  stock_minimum integer not null default 10,
  unit          text not null default 'pcs',
  image_url     text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── TABEL: transactions ────────────────────────────────────
create table if not exists public.transactions (
  id                uuid primary key default uuid_generate_v4(),
  transaction_code  text not null unique,
  kasir_id          uuid not null references public.profiles(id),
  total_amount      integer not null default 0,
  paid_amount       integer not null default 0,
  change_amount     integer not null default 0,
  payment_method    payment_method not null default 'cash',
  status            transaction_status not null default 'completed',
  created_at        timestamptz not null default now()
);

-- ─── TABEL: transaction_items ───────────────────────────────
create table if not exists public.transaction_items (
  id              uuid primary key default uuid_generate_v4(),
  transaction_id  uuid not null references public.transactions(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  product_name    text not null,
  price_sell      integer not null,
  qty             integer not null default 1,
  subtotal        integer not null default 0
);

-- ================================================================
-- INDEXES (IF NOT EXISTS — aman diulang)
-- ================================================================
create index if not exists idx_products_barcode       on public.products(barcode);
create index if not exists idx_products_category      on public.products(category_id);
create index if not exists idx_products_active        on public.products(is_active);
create index if not exists idx_transactions_kasir     on public.transactions(kasir_id);
create index if not exists idx_transactions_created   on public.transactions(created_at desc);
create index if not exists idx_transaction_items_trx  on public.transaction_items(transaction_id);
create index if not exists idx_transaction_items_prod on public.transaction_items(product_id);

-- ================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile saat user baru register
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'kasir')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Kurangi stok otomatis saat transaksi item masuk
create or replace function public.decrease_stock_on_transaction()
returns trigger language plpgsql security definer as $$
begin
  update public.products
  set stock = stock - new.qty
  where id = new.product_id
    and stock >= new.qty;

  if not found then
    raise exception 'Stok tidak cukup untuk produk: %', new.product_name;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_decrease_stock on public.transaction_items;
create trigger trg_decrease_stock
  after insert on public.transaction_items
  for each row execute function public.decrease_stock_on_transaction();

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.transactions      enable row level security;
alter table public.transaction_items enable row level security;

-- Helper role
create or replace function public.get_my_role()
returns user_role language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── Profiles ──────────────────────────────────────────────
drop policy if exists "profiles_select_own"    on public.profiles;
drop policy if exists "profiles_select_owner"  on public.profiles;
drop policy if exists "profiles_update_own"    on public.profiles;
create policy "profiles_select_own"    on public.profiles for select using (auth.uid() = id);
create policy "profiles_select_owner"  on public.profiles for select using (public.get_my_role() = 'owner');
create policy "profiles_update_own"    on public.profiles for update using (auth.uid() = id);

-- ── Categories ────────────────────────────────────────────
drop policy if exists "categories_select_all"  on public.categories;
drop policy if exists "categories_write_owner" on public.categories;
create policy "categories_select_all"  on public.categories for select using (auth.role() = 'authenticated');
create policy "categories_write_owner" on public.categories for all    using (public.get_my_role() = 'owner');

-- ── Products ──────────────────────────────────────────────
drop policy if exists "products_select_all"    on public.products;
drop policy if exists "products_insert_owner"  on public.products;
drop policy if exists "products_update_owner"  on public.products;
drop policy if exists "products_delete_owner"  on public.products;
create policy "products_select_all"    on public.products for select using (auth.role() = 'authenticated');
create policy "products_insert_owner"  on public.products for insert with check (public.get_my_role() in ('owner','gudang'));
create policy "products_update_owner"  on public.products for update using (public.get_my_role() in ('owner','gudang'));
create policy "products_delete_owner"  on public.products for delete using (public.get_my_role() = 'owner');

-- ── Transactions ──────────────────────────────────────────
drop policy if exists "transactions_select_kasir" on public.transactions;
drop policy if exists "transactions_select_owner" on public.transactions;
drop policy if exists "transactions_insert_kasir" on public.transactions;
create policy "transactions_select_kasir" on public.transactions for select using (kasir_id = auth.uid());
create policy "transactions_select_owner" on public.transactions for select using (public.get_my_role() = 'owner');
create policy "transactions_insert_kasir" on public.transactions for insert with check (auth.role() = 'authenticated');

-- ── Transaction Items ─────────────────────────────────────
drop policy if exists "trx_items_select" on public.transaction_items;
drop policy if exists "trx_items_insert" on public.transaction_items;
create policy "trx_items_select" on public.transaction_items for select using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_id
      and (t.kasir_id = auth.uid() or public.get_my_role() = 'owner')
  )
);
create policy "trx_items_insert" on public.transaction_items for insert with check (auth.role() = 'authenticated');

-- ================================================================
-- SEED: Kategori default (skip kalau sudah ada)
-- ================================================================
insert into public.categories (name, icon, sort_order) values
  ('Sembako',   '🌾', 1),
  ('Minuman',   '🥤', 2),
  ('Snack',     '🍿', 3),
  ('Obat',      '💊', 4),
  ('Perawatan', '🧴', 5),
  ('Lainnya',   '🏪', 99)
on conflict do nothing;
