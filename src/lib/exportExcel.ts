import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { TransactionRow, LaporanStats } from "./hooks/useLaporan";
import { formatRupiah } from "./utils";

export function exportLaporanToExcel(
  transactions: TransactionRow[],
  stats: LaporanStats,
  periodLabel: string
) {
  const wb = XLSX.utils.book_new();

  // ─── Sheet 1: Ringkasan ───────────────────────────────────
  const ringkasan = [
    ["LAPORAN PENJUALAN - DAIMART"],
    ["Periode:", periodLabel],
    ["Digenerate:", format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })],
    [],
    ["RINGKASAN"],
    ["Total Omset", formatRupiah(stats.total_omset)],
    ["Laba Bersih", formatRupiah(stats.total_laba)],
    ["Total Transaksi", stats.total_transaksi],
    ["Produk Menipis", stats.produk_menipis + " produk"],
  ];

  const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasan);
  wsRingkasan["!cols"] = [{ wch: 22 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan");

  // ─── Sheet 2: Detail Transaksi ────────────────────────────
  const headers = [
    "No. Nota",
    "Tanggal & Jam",
    "Nama Kasir",
    "Total Item",
    "Total Bayar",
    "Metode Bayar",
    "Status",
  ];

  const rows = transactions.map((t) => [
    t.transaction_code,
    format(new Date(t.created_at), "dd/MM/yyyy HH:mm"),
    t.kasir_name,
    t.total_items,
    t.total_amount,
    t.payment_method.toUpperCase(),
    t.status === "completed" ? "Lunas" : "Dibatalkan",
  ]);

  const wsDetail = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Style header
  wsDetail["!cols"] = [
    { wch: 24 }, { wch: 18 }, { wch: 20 },
    { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
  ];

  // Format kolom total bayar sebagai angka
  rows.forEach((_, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: idx + 1, c: 4 });
    if (wsDetail[cellRef]) wsDetail[cellRef].t = "n";
  });

  XLSX.utils.book_append_sheet(wb, wsDetail, "Detail Transaksi");

  // ─── Download ─────────────────────────────────────────────
  const fileName = `Laporan_DaiMart_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
