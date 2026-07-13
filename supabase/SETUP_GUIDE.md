# Panduan Setup Supabase untuk DaiMart

## Langkah 1 - Jalankan Schema

1. Buka project Supabase kamu di [supabase.com](https://supabase.com)
2. Masuk ke menu **SQL Editor** (ikon di sidebar kiri)
3. Klik **New query**
4. Copy-paste seluruh isi file `schema.sql`
5. Klik **Run** (atau tekan Ctrl+Enter)

## Langkah 2 - Tambah Data Produk Contoh (opsional)

1. Buat query baru lagi di SQL Editor
2. Copy-paste isi file `seed.sql`
3. Klik **Run**

## Langkah 3 - Buat Akun Owner

1. Di Supabase, masuk ke menu **Authentication → Users**
2. Klik **Add user → Create new user**
3. Isi email dan password (misal: `owner@daimart.com` / `password123`)
4. Klik **Create user**
5. Setelah user terbuat, pergi ke **Table Editor → profiles**
6. Edit baris user tersebut, ubah kolom `role` menjadi `owner`

## Langkah 4 - Buat Akun Kasir

Sama seperti langkah 3, tapi role biarkan default (`kasir`).

## Langkah 5 - Set .env.local

Pastikan file `.env.local` sudah diisi:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

Nilai ini bisa ditemukan di: **Project Settings → API**

## Langkah 6 - Test Login

1. Jalankan `npm run dev`
2. Buka `http://localhost:3000`
3. Login dengan akun owner atau kasir yang sudah dibuat

---

## Catatan Penting

- **RLS aktif**: Semua tabel dilindungi Row Level Security
- **Kasir** hanya bisa akses halaman `/kasir`
- **Owner** bisa akses dashboard, produk, dan laporan
- **Gudang** bisa akses halaman produk & stok
- Stok otomatis berkurang via database trigger saat transaksi disimpan
