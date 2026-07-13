"use client";

import StatCard from "@/components/ui/StatCard";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Clock,
  RefreshCw,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import SalesChart from "./SalesChart";
import TopProductsTable from "./TopProductsTable";
import RecentTransactions from "./RecentTransactions";
import { useDashboard } from "@/lib/hooks/useDashboard";

export default function DashboardClient() {
  const { stats, chartData, topProducts, recentTransactions, loading, refetch } =
    useDashboard();

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{today}</p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 px-3 py-2 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ─── Baris 1: Stat Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Omset Hari Ini"
          value={loading ? "..." : formatRupiah(stats.total_omset)}
          subtitle="Semua transaksi hari ini"
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Keuntungan Bersih"
          value={loading ? "..." : formatRupiah(stats.total_laba)}
          subtitle="Estimasi laba hari ini"
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Jumlah Transaksi"
          value={loading ? "..." : stats.total_transaksi}
          subtitle="Transaksi sukses hari ini"
          icon={ShoppingBag}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Produk Terjual"
          value={loading ? "..." : `${stats.total_produk_terjual} pcs`}
          subtitle="Total item terjual"
          icon={Package}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      {/* ─── Baris 2: Grafik Tren ────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              Tren Penjualan 7 Hari Terakhir
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Omset dan jumlah transaksi harian
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-500 inline-block rounded" />
              Omset
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />
              Transaksi
            </span>
          </div>
        </div>
        <SalesChart data={chartData} loading={loading} />
      </div>

      {/* ─── Baris 3: Tabel Analisis ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              5 Produk Paling Laris
            </h2>
            <span className="text-xs text-gray-400">7 hari terakhir</span>
          </div>
          <TopProductsTable data={topProducts} loading={loading} />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Aktivitas Transaksi Terakhir
            </h2>
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <Clock className="w-3 h-3" />
              Real-time
            </span>
          </div>
          <RecentTransactions data={recentTransactions} loading={loading} />
        </div>
      </div>
    </div>
  );
}
