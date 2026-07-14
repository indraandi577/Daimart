"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export interface Member {
  id: string;
  nama: string;
  kode_member: string;
  jabatan: string | null;
  voucher_bulanan: number;
  is_active: boolean;
  created_at: string;
  // computed
  total_transaksi?: number;
  total_belanja?: number;
}

export interface MemberVoucher {
  id: string;
  member_id: string;
  bulan: number;
  tahun: number;
  nominal: number;
  status: "belum" | "sudah";
  diambil_at: string | null;
}

export interface MemberDetail extends Member {
  vouchers: MemberVoucher[];
  recent_transactions: {
    id: string;
    total_amount: number;
    created_at: string;
  }[];
}

const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export function useMember() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const now = new Date();
  const bulanIni = now.getMonth() + 1;
  const tahunIni = now.getFullYear();

  // ── Fetch semua member + stats ───────────────────────────
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("nama");

      if (error) throw error;

      // Hitung total transaksi per member
      const memberIds = (data ?? []).map((m) => m.id);
      if (memberIds.length > 0) {
        const { data: trxData } = await supabase
          .from("member_transactions")
          .select("member_id, total_amount")
          .in("member_id", memberIds);

        const statsMap: Record<string, { total_transaksi: number; total_belanja: number }> = {};
        trxData?.forEach((t) => {
          if (!statsMap[t.member_id]) statsMap[t.member_id] = { total_transaksi: 0, total_belanja: 0 };
          statsMap[t.member_id].total_transaksi += 1;
          statsMap[t.member_id].total_belanja += t.total_amount;
        });

        setMembers((data ?? []).map((m) => ({
          ...m,
          total_transaksi: statsMap[m.id]?.total_transaksi ?? 0,
          total_belanja: statsMap[m.id]?.total_belanja ?? 0,
        })));
      } else {
        setMembers(data ?? []);
      }
    } catch {
      toast.error("Gagal memuat data member");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // ── Fetch detail member ──────────────────────────────────
  const fetchMemberDetail = async (memberId: string): Promise<MemberDetail | null> => {
    const { data: member } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .single();

    if (!member) return null;

    const { data: vouchers } = await supabase
      .from("member_vouchers")
      .select("*")
      .eq("member_id", memberId)
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false })
      .limit(12);

    const { data: trxData } = await supabase
      .from("member_transactions")
      .select("id, total_amount, created_at")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      ...member,
      total_transaksi: trxData?.length ?? 0,
      total_belanja: trxData?.reduce((s, t) => s + t.total_amount, 0) ?? 0,
      vouchers: (vouchers ?? []) as MemberVoucher[],
      recent_transactions: trxData ?? [],
    };
  };

  // ── Cari member untuk POS ────────────────────────────────
  const searchMember = async (query: string): Promise<Member[]> => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("is_active", true)
      .or(`nama.ilike.%${query}%,kode_member.ilike.%${query}%`)
      .limit(10);
    return data ?? [];
  };

  // ── Tambah member ────────────────────────────────────────
  const tambahMember = async (data: {
    nama: string;
    jabatan?: string;
    voucher_bulanan: number;
  }) => {
    // Generate kode member otomatis
    const { count } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true });
    const kode = `MBR-${String((count ?? 0) + 1).padStart(3, "0")}`;

    const { error } = await supabase
      .from("members")
      .insert({ ...data, kode_member: kode });

    if (error) throw new Error(error.message);
    toast.success(`Member ${data.nama} ditambahkan (${kode})`);
    await fetchMembers();
  };

  // ── Update member ────────────────────────────────────────
  const updateMember = async (id: string, data: Partial<Member>) => {
    const { error } = await supabase
      .from("members")
      .update(data)
      .eq("id", id);
    if (error) throw new Error(error.message);
    await fetchMembers();
  };

  // ── Catat transaksi member dari POS ─────────────────────
  const catatTransaksiMember = async (
    memberId: string,
    transactionId: string,
    totalAmount: number
  ) => {
    await supabase.from("member_transactions").insert({
      member_id: memberId,
      transaction_id: transactionId,
      total_amount: totalAmount,
    });
  };

  // ── Generate voucher bulan ini ───────────────────────────
  const generateVoucherBulanIni = async () => {
    const { data, error } = await supabase.rpc("generate_voucher_bulanan", {
      p_bulan: bulanIni,
      p_tahun: tahunIni,
    });
    if (error) throw new Error(error.message);
    toast.success(`${data} voucher berhasil di-generate untuk ${BULAN[bulanIni - 1]} ${tahunIni}`);
    return data as number;
  };

  // ── Ambil/redeem voucher ─────────────────────────────────
  const redeemVoucher = async (voucherId: string, kasirId: string) => {
    const { error } = await supabase
      .from("member_vouchers")
      .update({
        status: "sudah",
        diambil_at: new Date().toISOString(),
        diambil_oleh: kasirId,
      })
      .eq("id", voucherId)
      .eq("status", "belum"); // pastikan belum diambil

    if (error) throw new Error(error.message);
    toast.success("Voucher berhasil di-redeem");
  };

  // ── Voucher member bulan ini ─────────────────────────────
  const getVoucherBulanIni = async (memberId: string): Promise<MemberVoucher | null> => {
    const { data } = await supabase
      .from("member_vouchers")
      .select("*")
      .eq("member_id", memberId)
      .eq("bulan", bulanIni)
      .eq("tahun", tahunIni)
      .single();
    return data as MemberVoucher | null;
  };

  return {
    members, loading,
    fetchMembers, fetchMemberDetail,
    searchMember, tambahMember, updateMember,
    catatTransaksiMember, generateVoucherBulanIni,
    redeemVoucher, getVoucherBulanIni,
    bulanIni, tahunIni, BULAN,
  };
}
