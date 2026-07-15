"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from "date-fns";

export type FilterPeriod = "today" | "7days" | "30days" | "thismonth" | "custom";

export interface LaporanStats {
  total_omset: number;
  total_laba: number;
  total_transaksi: number;
  produk_menipis: number;
}

export interface TransactionRow {
  id: string;
  transaction_code: string;
  created_at: string;
  kasir_name: string;
  total_items: number;
  total_amount: number;
  payment_method: string;
  status: string;
}

export interface TransactionDetail {
  id: string;
  transaction_code: string;
  created_at: string;
  kasir_name: string;
  payment_method: string;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  items: {
    product_name: string;
    qty: number;
    price_sell: number;
    subtotal: number;
  }[];
}

export interface ChartPoint {
  label: string;
  omset: number;
  transaksi: number;
}

// ── Dummy data fallback ──────────────────────────────────────
const makeDummyTransactions = (): TransactionRow[] => [];

const DUMMY_TRANSACTIONS = makeDummyTransactions();

const DUMMY_CHART_7: ChartPoint[] = [];

export function useLaporan() {
  const [period, setPeriod] = useState<FilterPeriod>("today");
  const [customStart, setCustomStart] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const [stats, setStats] = useState<LaporanStats>({
    total_omset: 0,
    total_laba: 0,
    total_transaksi: 0,
    produk_menipis: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>(DUMMY_CHART_7);
  const [transactions, setTransactions] = useState<TransactionRow[]>(DUMMY_TRANSACTIONS);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  // Hitung range tanggal berdasarkan period
  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "7days":
        return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
      case "30days":
        return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
      case "thismonth":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "custom":
        return {
          from: startOfDay(new Date(customStart)),
          to: endOfDay(new Date(customEnd)),
        };
    }
  }, [period, customStart, customEnd]);

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      const fromISO = from.toISOString();
      const toISO = to.toISOString();

      // Cek koneksi
      const { error: connErr } = await supabase.from("transactions").select("id").limit(1);
      if (connErr) throw new Error("not ready");

      // ── Transaksi dalam range ──────────────────────────────
      const { data: trxData } = await supabase
        .from("transactions")
        .select(`
          id,
          transaction_code,
          created_at,
          total_amount,
          paid_amount,
          change_amount,
          payment_method,
          status,
          kasir:profiles(name),
          items:transaction_items(qty)
        `)
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false });

      if (trxData && trxData.length > 0) {
        const rows: TransactionRow[] = trxData.map((t) => ({
          id: t.id,
          transaction_code: t.transaction_code,
          created_at: t.created_at,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          kasir_name: (t.kasir as any)?.name ?? "Unknown",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          total_items: (t.items as any[])?.reduce((s: number, i: any) => s + i.qty, 0) ?? 0,
          total_amount: t.total_amount,
          payment_method: t.payment_method,
          status: t.status,
        }));
        setTransactions(rows);

        // ── Stats ────────────────────────────────────────────
        const completed = rows.filter((r) => r.status === "completed");
        const totalOmset = completed.reduce((s, r) => s + r.total_amount, 0);

        // Laba: ambil dari items
        const { data: itemsData } = await supabase
          .from("transaction_items")
          .select("qty, price_sell, product:products(price_buy), transaction:transactions!inner(created_at, status)")
          .gte("transaction.created_at", fromISO)
          .lte("transaction.created_at", toISO)
          .eq("transaction.status", "completed");

        const totalLaba = itemsData?.reduce((s, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pb = (i.product as any)?.price_buy ?? i.price_sell;
          return s + (i.price_sell - pb) * i.qty;
        }, 0) ?? 0;

        // Produk menipis
        const { count: menipis } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .filter("stock", "lte", supabase.rpc as unknown as string)
          .eq("is_active", true);

        // Komisi kantin dalam range tanggal
        const fromDate = from.toISOString().split("T")[0];
        const toDate = to.toISOString().split("T")[0];
        const { data: kantinData } = await supabase
          .from("kantin_sesi")
          .select("komisi_total")
          .gte("tanggal", fromDate)
          .lte("tanggal", toDate)
          .eq("status", "selesai");

        const komisiKantin = kantinData?.reduce((s, k) => s + (k.komisi_total ?? 0), 0) ?? 0;

        setStats({
          total_omset: totalOmset + komisiKantin,
          total_laba: totalLaba + komisiKantin,
          total_transaksi: completed.length,
          produk_menipis: menipis ?? 0,
        });
      }

      // ── Chart: group per hari ────────────────────────────
      const diffDays = Math.ceil((to.getTime() - from.getTime()) / 86400000);
      const grouped: Record<string, { omset: number; transaksi: number }> = {};
      for (let i = 0; i <= Math.min(diffDays, 29); i++) {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        grouped[format(d, "yyyy-MM-dd")] = { omset: 0, transaksi: 0 };
      }
      const { data: chartTrx } = await supabase
        .from("transactions")
        .select("total_amount, created_at")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .eq("status", "completed");

      chartTrx?.forEach((t) => {
        const key = t.created_at.split("T")[0];
        if (grouped[key]) { grouped[key].omset += t.total_amount; grouped[key].transaksi += 1; }
      });

      // Tambahkan komisi kantin ke chart per tanggal
      const { data: kantinChart } = await supabase
        .from("kantin_sesi")
        .select("tanggal, komisi_total")
        .gte("tanggal", format(from, "yyyy-MM-dd"))
        .lte("tanggal", format(to, "yyyy-MM-dd"))
        .eq("status", "selesai");

      kantinChart?.forEach((k) => {
        if (grouped[k.tanggal]) {
          grouped[k.tanggal].omset += k.komisi_total ?? 0;
        }
      });

      setChartData(Object.entries(grouped).map(([date, val]) => ({
        label: format(new Date(date), "dd MMM"),
        omset: val.omset,
        transaksi: val.transaksi,
      })));

    } catch {
      // Pakai dummy data (sudah di-set di useState)
    } finally {
      setLoading(false);
    }
  }, [getDateRange, supabase]);

  // Ambil detail 1 transaksi untuk modal
  const fetchDetail = async (trxId: string): Promise<TransactionDetail | null> => {
    // Cari dari state dulu (dummy mode)
    const found = transactions.find((t) => t.id === trxId);

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id, transaction_code, created_at, total_amount, paid_amount, change_amount, payment_method,
          kasir:profiles(name),
          items:transaction_items(product_name, qty, price_sell, subtotal)
        `)
        .eq("id", trxId)
        .single();

      if (error || !data) throw new Error("not found");

      return {
        id: data.id,
        transaction_code: data.transaction_code,
        created_at: data.created_at,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        kasir_name: (data.kasir as any)?.name ?? "Unknown",
        payment_method: data.payment_method,
        total_amount: data.total_amount,
        paid_amount: data.paid_amount,
        change_amount: data.change_amount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (data.items as any[]) ?? [],
      };
    } catch {
      // Fallback dummy detail
      if (!found) return null;
      return {
        id: found.id,
        transaction_code: found.transaction_code,
        created_at: found.created_at,
        kasir_name: found.kasir_name,
        payment_method: found.payment_method,
        total_amount: found.total_amount,
        paid_amount: found.total_amount,
        change_amount: 0,
        items: [
          { product_name: "Indomie Goreng 85gr", qty: 3, price_sell: 3000, subtotal: 9000 },
          { product_name: "Aqua 600ml", qty: 2, price_sell: 4000, subtotal: 8000 },
          { product_name: "Chitato 68gr", qty: 1, price_sell: 12000, subtotal: 12000 },
        ],
      };
    }
  };

  return {
    period, setPeriod,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    stats, chartData, transactions,
    loading, fetchLaporan, fetchDetail,
  };
}
