-- ================================================================
-- DaiMart - Seed Data untuk Testing
-- Jalankan file ini SETELAH schema.sql
-- ================================================================

-- ─── Contoh Produk ───────────────────────────────────────────
-- Pastikan category sudah ada dari schema.sql sebelum insert ini

insert into public.products (name, barcode, category_id, price_sell, price_buy, stock, stock_minimum, unit)
select
  'Indomie Goreng 85gr', '089686010682',
  (select id from public.categories where name = 'Sembako'),
  3000, 2400, 250, 50, 'pcs'
where exists (select 1 from public.categories where name = 'Sembako');

insert into public.products (name, barcode, category_id, price_sell, price_buy, stock, stock_minimum, unit)
select
  'Aqua Botol 600ml', '089686010001',
  (select id from public.categories where name = 'Minuman'),
  4000, 3200, 120, 24, 'pcs'
where exists (select 1 from public.categories where name = 'Minuman');

insert into public.products (name, barcode, category_id, price_sell, price_buy, stock, stock_minimum, unit)
select
  'Beras Premium Pulen 5kg', '089686010200',
  (select id from public.categories where name = 'Sembako'),
  75000, 68000, 5, 10, 'karung'
where exists (select 1 from public.categories where name = 'Sembako');

insert into public.products (name, barcode, category_id, price_sell, price_buy, stock, stock_minimum, unit)
select
  'Teh Botol Sosro 350ml', '089686010300',
  (select id from public.categories where name = 'Minuman'),
  6000, 4800, 0, 20, 'pcs'
where exists (select 1 from public.categories where name = 'Minuman');

insert into public.products (name, barcode, category_id, price_sell, price_buy, stock, stock_minimum, unit)
select
  'Chitato Sapi Panggang 68gr', '089686010400',
  (select id from public.categories where name = 'Snack'),
  12000, 9500, 60, 15, 'pcs'
where exists (select 1 from public.categories where name = 'Snack');

insert into public.products (name, barcode, category_id, price_sell, price_buy, stock, stock_minimum, unit)
select
  'Minyak Goreng Tropical 1L', '089686010500',
  (select id from public.categories where name = 'Sembako'),
  18000, 16000, 8, 12, 'botol'
where exists (select 1 from public.categories where name = 'Sembako');

insert into public.products (name, barcode, category_id, price_sell, price_buy, stock, stock_minimum, unit)
select
  'Sabun Lifebuoy 90gr', '089686010600',
  (select id from public.categories where name = 'Perawatan'),
  5500, 4200, 45, 20, 'pcs'
where exists (select 1 from public.categories where name = 'Perawatan');

insert into public.products (name, barcode, category_id, price_sell, price_buy, stock, stock_minimum, unit)
select
  'Paracetamol 500mg Generic 10tab', '089686010700',
  (select id from public.categories where name = 'Obat'),
  3500, 2500, 30, 15, 'strip'
where exists (select 1 from public.categories where name = 'Obat');
