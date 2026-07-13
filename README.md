# DaiMart - Sistem Manajemen Supermarket

Aplikasi POS & manajemen supermarket modern berbasis Next.js + Supabase.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **PWA**: next-pwa
- **Deploy**: Vercel

## Halaman Utama

| Halaman | URL | Role |
|---------|-----|------|
| Dashboard Owner | `/dashboard` | owner |
| Kasir / POS | `/kasir` | owner, kasir |
| Produk & Stok | `/produk` | owner, gudang |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment variables
Copy `.env.example` ke `.env.local` dan isi dengan kredensial Supabase kamu:
```bash
cp .env.example .env.local
```

### 3. Setup Supabase
Buat project baru di [supabase.com](https://supabase.com), lalu jalankan SQL berikut di SQL Editor:

```sql
-- Lihat file: supabase/schema.sql
```

### 4. Jalankan development server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Struktur Folder

```
src/
├── app/                  # Next.js App Router pages
│   ├── dashboard/        # Dashboard owner
│   ├── kasir/            # Halaman POS kasir
│   └── produk/           # Manajemen produk & stok
├── components/
│   ├── dashboard/        # Komponen dashboard
│   ├── kasir/            # Komponen POS
│   ├── produk/           # Komponen produk
│   ├── layout/           # Sidebar, MainLayout
│   └── ui/               # Komponen UI reusable
├── lib/
│   ├── supabase/         # Supabase client
│   └── utils.ts          # Helper functions
└── types/                # TypeScript types
```
