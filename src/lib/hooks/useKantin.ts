"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { format } from "date-fns";

export interface KantinSesi {
  id: string;
  tanggal: string;
  catatan: string | null;
  status: "aktif" | "selesai";
  created_at: string;
}

export interface KantinPenitip {
  id: string;
  sesi_id: string;
  nama: string;
  snacks: KantinSnack[];
}

export interface KantinSnack {
  id: string;
  penitip_id: string;
  nama_snack: string;
  harga_jual: number;
  qty_titip: number;
  qty_terjual: number;
  komisi_pct: number;
  // Computed
  qty_sisa: number;
  total_laku: number;          // qty_terjual × harga_jual
  komisi_kantin: number;       // total_laku × (komisi_pct/100)
  uang_penitip: number;        // total_laku - komisi_kantin
}

// Hitung derived fields snack
export function computeSnack(s: Omit<KantinSnack, "qty_sisa" | "total_laku" | "komisi_kantin" | "uang_penitip">): KantinSnack {
  const total_laku = s.qty_terjual * s.harga_jual;
  // Bulatkan komisi ke ribuan terdekat (misal 1.875 → 2.000, 1.425 → 1.000)
  const komisi_raw = total_laku * s.komisi_pct / 100;
  const komisi_kantin = Math.round(komisi_raw / 1000) * 1000;
  return {
    ...s,
    qty_sisa: s.qty_titip - s.qty_terjual,
    total_laku,
    komisi_kantin,
    uang_penitip: total_laku - komisi_kantin,
  };
}

// Hitung total per penitip
export function totalPenitip(penitip: KantinPenitip) {
  return penitip.snacks.reduce(
    (acc, s) => ({
      total_laku: acc.total_laku + s.total_laku,
      komisi_kantin: acc.komisi_kantin + s.komisi_kantin,
      uang_penitip: acc.uang_penitip + s.uang_penitip,
    }),
    { total_laku: 0, komisi_kantin: 0, uang_penitip: 0 }
  );
}

export function useKantin() {
  const [sesiList, setSesiList] = useState<KantinSesi[]>([]);
  const [activeSesi, setActiveSesi] = useState<KantinSesi | null>(null);
  const [penitips, setPenitips] = useState<KantinPenitip[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // ── Fetch semua sesi ─────────────────────────────────────
  const fetchSesiList = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kantin_sesi")
        .select("*")
        .order("tanggal", { ascending: false })
        .limit(30);
      if (error) throw error;
      setSesiList(data ?? []);
    } catch {
      toast.error("Gagal memuat data sesi kantin");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // ── Fetch detail sesi + penitip + snack ──────────────────
  const fetchSesiDetail = useCallback(async (sesiId: string) => {
    setLoading(true);
    try {
      const { data: sesi } = await supabase
        .from("kantin_sesi")
        .select("*")
        .eq("id", sesiId)
        .single();
      setActiveSesi(sesi);

      const { data: penitipData } = await supabase
        .from("kantin_penitip")
        .select("*, snacks:kantin_snack(*)")
        .eq("sesi_id", sesiId)
        .order("created_at");

      const mapped: KantinPenitip[] = (penitipData ?? []).map((p) => ({
        ...p,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        snacks: (p.snacks as any[]).map(computeSnack),
      }));
      setPenitips(mapped);
    } catch {
      toast.error("Gagal memuat detail sesi");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // ── Buat sesi baru ───────────────────────────────────────
  const buatSesi = async (tanggal: string, catatan?: string) => {
    const { data, error } = await supabase
      .from("kantin_sesi")
      .insert({ tanggal, catatan: catatan || null, status: "aktif" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    toast.success("Sesi kantin dibuat");
    await fetchSesiList();
    return data;
  };

  // ── Tambah penitip ke sesi ───────────────────────────────
  const tambahPenitip = async (sesiId: string, nama: string) => {
    const { data, error } = await supabase
      .from("kantin_penitip")
      .insert({ sesi_id: sesiId, nama })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...data, snacks: [] } as KantinPenitip;
  };

  // ── Tambah snack ke penitip ──────────────────────────────
  const tambahSnack = async (penitipId: string, snack: {
    nama_snack: string;
    harga_jual: number;
    qty_titip: number;
    komisi_pct?: number;
  }) => {
    const { data, error } = await supabase
      .from("kantin_snack")
      .insert({
        penitip_id: penitipId,
        nama_snack: snack.nama_snack,
        harga_jual: snack.harga_jual,
        qty_titip: snack.qty_titip,
        qty_terjual: 0,
        komisi_pct: snack.komisi_pct ?? 15,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return computeSnack(data);
  };

  // ── Update qty terjual ───────────────────────────────────
  const updateTerjual = async (snackId: string, qtyTerjual: number) => {
    const { error } = await supabase
      .from("kantin_snack")
      .update({ qty_terjual: qtyTerjual })
      .eq("id", snackId);
    if (error) throw new Error(error.message);
  };

  // ── Hapus snack ──────────────────────────────────────────
  const hapusSnack = async (snackId: string) => {
    const { error } = await supabase
      .from("kantin_snack")
      .delete()
      .eq("id", snackId);
    if (error) throw new Error(error.message);
  };

  // ── Hapus penitip ────────────────────────────────────────
  const hapusPenitip = async (penitipId: string) => {
    const { error } = await supabase
      .from("kantin_penitip")
      .delete()
      .eq("id", penitipId);
    if (error) throw new Error(error.message);
  };

  // ── Selesaikan sesi ──────────────────────────────────────
  const selesaikanSesi = async (sesiId: string) => {
    // Hitung total komisi sesi ini dari semua snack
    const { data: snacks } = await supabase
      .from("kantin_snack")
      .select("qty_terjual, harga_jual, komisi_pct, penitip:kantin_penitip!inner(sesi_id)")
      .eq("penitip.sesi_id", sesiId);

    const komisiTotal = (snacks ?? []).reduce((sum, s) => {
      const total_laku = s.qty_terjual * s.harga_jual;
      const komisi_raw = total_laku * s.komisi_pct / 100;
      return sum + Math.round(komisi_raw / 1000) * 1000;
    }, 0);

    const { error } = await supabase
      .from("kantin_sesi")
      .update({ status: "selesai", komisi_total: komisiTotal })
      .eq("id", sesiId);
    if (error) throw new Error(error.message);
    toast.success("Sesi kantin diselesaikan");
  };

  // ── Total omset kantin dari sesi ─────────────────────────
  const totalKomisiSesi = (ps: KantinPenitip[]) =>
    ps.reduce((sum, p) => sum + totalPenitip(p).komisi_kantin, 0);

  return {
    sesiList, activeSesi, penitips, loading,
    fetchSesiList, fetchSesiDetail,
    buatSesi, tambahPenitip, tambahSnack,
    updateTerjual, hapusSnack, hapusPenitip,
    selesaikanSesi, totalKomisiSesi,
    today: format(new Date(), "yyyy-MM-dd"),
  };
}
