"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, DollarSign, ShoppingBag, AlertTriangle,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { formatRupiah } from "@/lib/utils";
import FilterBar from "./FilterBar";
import LaporanChart from "./LaporanChart";
import TransactionTable from "./TransactionTable";
import TransactionDetailModal from "./TransactionDetailModal";
import { useLaporan, type TransactionDetail } from "@/lib/hooks/useLaporan";
import { exportLaporanToExcel } from "@/lib/exportExcel";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const PERIOD_LABEL: Record<string, string> = {
  today: "Hari Ini",
  "7days": "7 Hari Terakhir",
  "30days": "30 Hari Terakhir",
  thismonth: "Bulan Ini",
  custom: "Custom",
};

export default function LaporanClient() {
  const {
    period, setPeriod,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    stats, chartData, transactions,
    loading, fetchLaporan, fetchDetail,
  } = useLaporan();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load data saat pertama kali buka halaman
  useEffect(() => {
    fetchLaporan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewDetail = async (trxId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    const data = await fetchDetail(trxId);
    setDetail(data);
    setDetailLoading(false);
  };

  const handleExport = () => {
    const label = period === "custom"
      ? `${format(new Date(customStart), "dd MMM yyyy", { locale: id })} - ${format(new Date(customEnd), "dd MMM yyyy", { locale: id })}`
      : PERIOD_LABEL[period];
    exportLaporanToExcel(transactions, stats, label);
  };

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{today}</p>
      </div>

      {/* Filter */}
      <FilterBar
        period={period}
        onPeriodChange={setPeriod}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        onApply={fetchLaporan}
        loading={loading}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Omset"
          value={loading ? "..." : formatRupiah(stats.total_omset)}
          subtitle={PERIOD_LABEL[period]}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Laba Bersih"
          value={loading ? "..." : formatRupiah(stats.total_laba)}
          subtitle="Harga jual - HPP"
          icon={DollarSign}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Total Transaksi"
          value={loading ? "..." : stats.total_transaksi}
          subtitle="Transaksi lunas"
          icon={ShoppingBag}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Produk Menipis"
          value={loading ? "..." : stats.produk_menipis}
          subtitle="Perlu restok segera"
          icon={AlertTriangle}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100"
          className={stats.produk_menipis > 0 ? "border-yellow-200" : ""}
        />
      </div>

      {/* Grafik */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-900">Tren Penjualan</h2>
            <p className="text-sm text-gray-400 mt-0.5">{PERIOD_LABEL[period]}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-500 inline-block rounded" />
              Omset
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-400 inline-block rounded border-dashed" />
              Transaksi
            </span>
          </div>
        </div>
        <LaporanChart data={chartData} loading={loading} />
      </div>

      {/* Tabel Transaksi */}
      <TransactionTable
        transactions={transactions}
        loading={loading}
        onExport={handleExport}
        onViewDetail={handleViewDetail}
      />

      {/* Modal Detail */}
      {detailOpen && (
        <TransactionDetailModal
          detail={detail}
          loading={detailLoading}
          onClose={() => { setDetailOpen(false); setDetail(null); }}
        />
      )}
    </div>
  );
}
