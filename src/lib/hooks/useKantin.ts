"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { format } from "date-fns";

// ================================================================
// TYPES
// ================================================================

export interface KantinSesi {
  id: string;
  tanggal: string;
  catatan: string | null;
  status: "aktif" | "selesai";
  komisi_total: number;
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
  harga_beli: number;    // modal penitip
  harga_jual: number;    // harga jual ke siswa
  qty_titip: number;
  qty_terjual: number;
  // Computed
  qty_sisa: number;
  total_modal: number;   // harga_beli × qty_terjual → uang kembali ke penitip
  total_laku: number;    // harga_jual × qty_terjual
  omset_kantin: number;  // (harga_jual - harga_beli) × qty_terjual → masuk kantin
}

// ================================================================
// HELPERS
// ================================================================

export function computeSnack(
  s: Omit<KantinSnack, "qty_sisa" | "total_modal" | "total_laku" | "omset_kantin">
): KantinSnack {
  const total_laku   = s.qty_terjual * s.harga_jual;
  const total_modal  = s.qty_terjual * s.harga_beli;
  const omset_kantin = total_laku - total_modal;
  return { ...s, qty_sisa: s.qty_titip - s.qty_terjual, total_modal, total_laku, omset_kantin };
}

export function totalPenitip(penitip: KantinPenitip) {
  return penitip.snacks.reduce(
    (acc, s) => ({
      total_modal:   acc.total_modal   + s.total_modal,
      total_laku:    acc.total_laku    + s.total_laku,
      omset_kantin:  acc.omset_kantin  + s.omset_kantin,
    }),
    { total_modal: 0, total_laku: 0, omset_kantin: 0 }
  );
}

// ================================================================
// HOOK
// ================================================================

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

  // ── Fetch detail sesi ─────────────────────────────────────
  const fetchSesiDetail = useCallback(async (sesiId: string) => {
    setLoading(true);
    try {
      const { data: sesi } = await supabase
        .from("kantin_sesi").select("*").eq("id", sesiId).single();
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

  // ── Buat sesi ─────────────────────────────────────────────
  const buatSesi = async (tanggal: string, catatan?: string) => {
    const { data, error } = await supabase
      .from("kantin_sesi")
      .insert({ tanggal, catatan: catatan || null, status: "aktif", komisi_total: 0 })
      .select().single();
    if (error) throw new Error(error.message);
    toast.success("Sesi kantin dibuat");
    await fetchSesiList();
    return data;
  };

  // ── Edit sesi ─────────────────────────────────────────────
  const editSesi = async (sesiId: string, tanggal: string, catatan?: string) => {
    const { error } = await supabase
      .from("kantin_sesi")
      .update({ tanggal, catatan: catatan || null })
      .eq("id", sesiId);
    if (error) throw new Error(error.message);
    toast.success("Sesi diperbarui");
    await fetchSesiList();
  };

  // ── Hapus sesi ────────────────────────────────────────────
  const hapusSesi = async (sesiId: string) => {
    const { error } = await supabase
      .from("kantin_sesi").delete().eq("id", sesiId);
    if (error) throw new Error(error.message);
    toast.success("Sesi dihapus");
    await fetchSesiList();
  };

  // ── Tambah penitip ────────────────────────────────────────
  const tambahPenitip = async (sesiId: string, nama: string) => {
    const { data, error } = await supabase
      .from("kantin_penitip")
      .insert({ sesi_id: sesiId, nama })
      .select().single();
    if (error) throw new Error(error.message);
    return { ...data, snacks: [] } as KantinPenitip;
  };

  // ── Tambah snack ──────────────────────────────────────────
  const tambahSnack = async (penitipId: string, snack: {
    nama_snack: string;
    harga_beli: number;
    harga_jual: number;
    qty_titip: number;
  }) => {
    const { data, error } = await supabase
      .from("kantin_snack")
      .insert({ penitip_id: penitipId, qty_terjual: 0, ...snack })
      .select().single();
    if (error) throw new Error(error.message);
    return computeSnack(data);
  };

  // ── Update qty terjual ────────────────────────────────────
  const updateTerjual = async (snackId: string, qtyTerjual: number) => {
    const { error } = await supabase
      .from("kantin_snack")
      .update({ qty_terjual: qtyTerjual })
      .eq("id", snackId);
    if (error) throw new Error(error.message);
  };

  // ── Edit snack ────────────────────────────────────────────
  const editSnack = async (snackId: string, data: {
    nama_snack: string;
    harga_beli: number;
    harga_jual: number;
    qty_titip: number;
  }) => {
    const { error } = await supabase
      .from("kantin_snack").update(data).eq("id", snackId);
    if (error) throw new Error(error.message);
    toast.success("Snack diperbarui");
  };

  // ── Hapus snack ───────────────────────────────────────────
  const hapusSnack = async (snackId: string) => {
    const { error } = await supabase
      .from("kantin_snack").delete().eq("id", snackId);
    if (error) throw new Error(error.message);
  };

  // ── Hapus penitip ─────────────────────────────────────────
  const hapusPenitip = async (penitipId: string) => {
    const { error } = await supabase
      .from("kantin_penitip").delete().eq("id", penitipId);
    if (error) throw new Error(error.message);
  };

  // ── Selesaikan sesi ───────────────────────────────────────
  const selesaikanSesi = async (sesiId: string) => {
    const { data: snacks } = await supabase
      .from("kantin_snack")
      .select("qty_terjual, harga_beli, harga_jual, penitip:kantin_penitip!inner(sesi_id)")
      .eq("penitip.sesi_id", sesiId);

    const omsetTotal = (snacks ?? []).reduce((sum, s) => {
      return sum + (s.harga_jual - s.harga_beli) * s.qty_terjual;
    }, 0);

    const { error } = await supabase
      .from("kantin_sesi")
      .update({ status: "selesai", komisi_total: omsetTotal })
      .eq("id", sesiId);
    if (error) throw new Error(error.message);
    toast.success("Sesi kantin diselesaikan");
  };

  // ── Total omset kantin dari sesi ──────────────────────────
  const totalOmsetSesi = (ps: KantinPenitip[]) =>
    ps.reduce((sum, p) => sum + totalPenitip(p).omset_kantin, 0);

  return {
    sesiList, activeSesi, penitips, loading,
    fetchSesiList, fetchSesiDetail,
    buatSesi, editSesi, hapusSesi,
    tambahPenitip, tambahSnack,
    updateTerjual, editSnack, hapusSnack, hapusPenitip,
    selesaikanSesi, totalOmsetSesi,
    today: format(new Date(), "yyyy-MM-dd"),
  };
}
