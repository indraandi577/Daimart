"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardStats, SalesChartData, TopProduct } from "@/types";

// Dummy data fallback — kosong untuk production
const DUMMY_STATS: DashboardStats = {
  total_omset: 0,
  total_laba: 0,
  total_transaksi: 0,
  total_produk_terjual: 0,
};
const DUMMY_CHART: SalesChartData[] = [];
const DUMMY_TOP: TopProduct[] = [];
const DUMMY_RECENT: RecentTrx[] = [];

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>(DUMMY_STATS);
  const [chartData, setChartData] = useState<SalesChartData[]>(DUMMY_CHART);
  const [topProducts, setTopProducts] = useState<TopProduct[]>(DUMMY_TOP);
  const [recentTransactions, setRecentTransactions] = useState<RecentTrx[]>(DUMMY_RECENT);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // Cek koneksi Supabase dulu
      const { error: connErr } = await supabase.from("transactions").select("id").limit(1);
      if (connErr) throw new Error("Supabase not ready");

      // ─── Tanggal ──────────────────────────────────────────
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

      // ─── Stats hari ini ───────────────────────────────────
      const { data: todayTrx } = await supabase
        .from("transactions")
        .select("total_amount, status")
        .gte("created_at", `${todayStr}T00:00:00`)
        .lte("created_at", `${todayStr}T23:59:59`)
        .eq("status", "completed");

      const totalOmset = todayTrx?.reduce((s, t) => s + t.total_amount, 0) ?? 0;
      const totalTransaksi = todayTrx?.length ?? 0;

      // Total produk terjual hari ini
      const { data: todayItems } = await supabase
        .from("transaction_items")
        .select("qty, transactions!inner(created_at, status)")
        .gte("transactions.created_at", `${todayStr}T00:00:00`)
        .lte("transactions.created_at", `${todayStr}T23:59:59`)
        .eq("transactions.status", "completed");

      const totalQty = todayItems?.reduce((s, i) => s + i.qty, 0) ?? 0;

      // Estimasi laba
      const { data: labaItems } = await supabase
        .from("transaction_items")
        .select(`qty, price_sell, product:products(price_buy), transaction:transactions!inner(created_at, status)`)
        .gte("transaction.created_at", `${todayStr}T00:00:00`)
        .eq("transaction.status", "completed");

      const totalLaba = labaItems?.reduce((s, i) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const priceBuy = (i.product as any)?.price_buy ?? i.price_sell;
        return s + (i.price_sell - priceBuy) * i.qty;
      }, 0) ?? 0;

      // Komisi kantin hari ini (sesi yang selesai hari ini)
      const { data: kantinHariIni } = await supabase
        .from("kantin_sesi")
        .select("komisi_total")
        .eq("tanggal", todayStr)
        .eq("status", "selesai");

      const komisiKantin = kantinHariIni?.reduce((s, k) => s + (k.komisi_total ?? 0), 0) ?? 0;

      setStats({
        total_omset: totalOmset + komisiKantin,       // omset kasir + komisi kantin
        total_laba: totalLaba + komisiKantin,          // laba kasir + komisi kantin
        total_transaksi: totalTransaksi,
        total_produk_terjual: totalQty,
      });

      // ─── Chart 7 hari ─────────────────────────────────────
      const { data: weekTrx } = await supabase
        .from("transactions")
        .select("total_amount, created_at")
        .gte("created_at", `${sevenDaysAgoStr}T00:00:00`)
        .eq("status", "completed")
        .order("created_at");

      const grouped: Record<string, { omset: number; transaksi: number }> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(sevenDaysAgo.getDate() + i);
        grouped[d.toISOString().split("T")[0]] = { omset: 0, transaksi: 0 };
      }
      weekTrx?.forEach((t) => {
        const key = t.created_at.split("T")[0];
        if (grouped[key]) { grouped[key].omset += t.total_amount; grouped[key].transaksi += 1; }
      });

      setChartData(Object.entries(grouped).map(([date, val]) => ({
        date: new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        omset: val.omset,
        transaksi: val.transaksi,
      })));

      // ─── Top 5 Produk ─────────────────────────────────────
      const { data: topItems } = await supabase
        .from("transaction_items")
        .select(`product_id, product_name, qty, subtotal, transaction:transactions!inner(created_at, status)`)
        .gte("transaction.created_at", `${sevenDaysAgoStr}T00:00:00`)
        .eq("transaction.status", "completed");

      const topMap: Record<string, TopProduct> = {};
      topItems?.forEach((item) => {
        if (!item.product_id) return;
        if (!topMap[item.product_id]) topMap[item.product_id] = { product_id: item.product_id, product_name: item.product_name, total_qty: 0, total_omset: 0 };
        topMap[item.product_id].total_qty += item.qty;
        topMap[item.product_id].total_omset += item.subtotal;
      });
      setTopProducts(Object.values(topMap).sort((a, b) => b.total_qty - a.total_qty).slice(0, 5));

      // ─── Transaksi terakhir ───────────────────────────────
      const { data: recent } = await supabase
        .from("transactions")
        .select(`id, transaction_code, total_amount, status, created_at, kasir:profiles(name)`)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentTransactions(((recent ?? []) as unknown as RecentTrx[]));

    } catch {
      // Supabase belum siap — tampil kosong, data akan muncul setelah ada transaksi
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { stats, chartData, topProducts, recentTransactions, loading, refetch: fetchDashboard };
}

export interface RecentTrx {
  id: string;
  transaction_code: string;
  total_amount: number;
  status: string;
  created_at: string;
  kasir: { name: string } | null;
}
