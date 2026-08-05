"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export interface Member {
  id: string;
  nama: string;
  nipy: string | null;       // Nomor Induk Pegawai — jadi kode barcode kartu member
  kode_member: string;
  jabatan: string | null;
  topup_bulanan: number;
  saldo: number;
  is_active: boolean;
  created_at: string;
  // computed dari joins
  total_transaksi?: number;
  total_belanja?: number;
}

export interface MemberTopup {
  id: string;
  member_id: string;
  nominal: number;
  bulan: number;
  tahun: number;
  keterangan: string | null;
  created_at: string;
}

export interface MemberTransaction {
  id: string;
  member_id: string;
  transaction_id: string | null;
  total_amount: number;
  bayar_saldo: number;
  bayar_tunai: number;
  created_at: string;
}

export interface MemberDetail extends Member {
  topups: MemberTopup[];
  transactions: MemberTransaction[];
}

export function useMember() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const now = new Date();
  const bulanIni = now.getMonth() + 1;
  const tahunIni = now.getFullYear();
  const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  // ── Fetch semua member + stats ───────────────────────────
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("nama");
      if (error) throw error;

      const ids = (data ?? []).map((m) => m.id);
      if (ids.length > 0) {
        const { data: trxData } = await supabase
          .from("member_transactions")
          .select("member_id, total_amount")
          .in("member_id", ids);

        const stats: Record<string, { total_transaksi: number; total_belanja: number }> = {};
        trxData?.forEach((t) => {
          if (!stats[t.member_id]) stats[t.member_id] = { total_transaksi: 0, total_belanja: 0 };
          stats[t.member_id].total_transaksi++;
          stats[t.member_id].total_belanja += t.total_amount;
        });

        setMembers((data ?? []).map((m) => ({
          ...m,
          total_transaksi: stats[m.id]?.total_transaksi ?? 0,
          total_belanja: stats[m.id]?.total_belanja ?? 0,
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

  // ── Detail member ────────────────────────────────────────
  const fetchMemberDetail = useCallback(async (memberId: string): Promise<MemberDetail | null> => {
    const { data: member } = await supabase
      .from("members").select("*").eq("id", memberId).single();
    if (!member) return null;

    const { data: topups } = await supabase
      .from("member_topups").select("*")
      .eq("member_id", memberId)
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false })
      .limit(24);

    const { data: trxData } = await supabase
      .from("member_transactions").select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      ...member,
      total_transaksi: trxData?.length ?? 0,
      total_belanja: trxData?.reduce((s, t) => s + t.total_amount, 0) ?? 0,
      topups: (topups ?? []) as MemberTopup[],
      transactions: (trxData ?? []) as MemberTransaction[],
    };
  }, [supabase]);

  // ── Cari member (untuk POS) ──────────────────────────────
  const searchMember = async (query: string): Promise<Member[]> => {
    const { data } = await supabase
      .from("members").select("*")
      .eq("is_active", true)
      .or(`nama.ilike.%${query}%,kode_member.ilike.%${query}%,nipy.ilike.%${query}%`)
      .limit(10);
    return data ?? [];
  };

  // ── Tambah member baru ───────────────────────────────────
  const tambahMember = async (data: {
    nama: string;
    nipy?: string;
    jabatan?: string;
    topup_bulanan: number;
  }) => {
    // Cek duplikat NIPY
    if (data.nipy) {
      const { data: existing } = await supabase
        .from("members").select("id").eq("nipy", data.nipy).single();
      if (existing) throw new Error(`NIPY ${data.nipy} sudah terdaftar`);
    }

    const { count } = await supabase
      .from("members").select("id", { count: "exact", head: true });
    const kode = `MBR-${String((count ?? 0) + 1).padStart(3, "0")}`;

    const { error } = await supabase.from("members").insert({
      ...data,
      nipy: data.nipy || null,
      kode_member: kode,
      saldo: 0,
    });
    if (error) throw new Error(error.message);
    toast.success(`Member ${data.nama} ditambahkan (${kode})`);
    await fetchMembers();
  };

  // ── Update member ────────────────────────────────────────
  const updateMember = async (id: string, data: Partial<Member>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { total_transaksi, total_belanja, ...updateData } = data as Member;
    const { error } = await supabase.from("members").update(updateData).eq("id", id);
    if (error) throw new Error(error.message);
    await fetchMembers();
  };

  // ── Top up saldo manual 1 member ─────────────────────────
  const topupManual = async (memberId: string, nominal: number, keterangan: string, kasirId: string) => {
    // Insert riwayat
    const { error: topupErr } = await supabase.from("member_topups").insert({
      member_id: memberId,
      nominal,
      bulan: bulanIni,
      tahun: tahunIni,
      keterangan,
      oleh: kasirId,
    });
    if (topupErr) throw new Error(topupErr.message);

    // Tambah saldo
    const { data: current } = await supabase.from("members").select("saldo").eq("id", memberId).single();
    const { error: updateErr } = await supabase.from("members")
      .update({ saldo: (current?.saldo ?? 0) + nominal })
      .eq("id", memberId);
    if (updateErr) throw new Error(updateErr.message);

    toast.success(`Saldo berhasil ditambahkan: Rp ${nominal.toLocaleString("id-ID")}`);
    await fetchMembers();
  };

  // ── Top up otomatis semua member bulan ini ───────────────
  const topupBulananOtomatis = async () => {
    const { data, error } = await supabase.rpc("topup_saldo_bulanan", {
      p_bulan: bulanIni,
      p_tahun: tahunIni,
    });
    if (error) throw new Error(error.message);
    toast.success(`${data} member berhasil di-top up untuk ${BULAN[bulanIni - 1]} ${tahunIni}`);
    await fetchMembers();
    return data as number;
  };

  // ── Catat transaksi member (dari POS) ────────────────────
  const catatTransaksiMember = async ({
    memberId,
    transactionId,
    totalAmount,
    bayarSaldo,
    bayarTunai,
  }: {
    memberId: string;
    transactionId: string;
    totalAmount: number;
    bayarSaldo: number;
    bayarTunai: number;
  }) => {
    // Insert riwayat transaksi member
    await supabase.from("member_transactions").insert({
      member_id: memberId,
      transaction_id: transactionId,
      total_amount: totalAmount,
      bayar_saldo: bayarSaldo,
      bayar_tunai: bayarTunai,
    });

    // Kurangi saldo kalau ada bayar pakai saldo
    if (bayarSaldo > 0) {
      const { data: current } = await supabase
        .from("members").select("saldo").eq("id", memberId).single();
      const newSaldo = Math.max(0, (current?.saldo ?? 0) - bayarSaldo);
      await supabase.from("members").update({ saldo: newSaldo }).eq("id", memberId);
    }
  };

  return {
    members, loading,
    fetchMembers, fetchMemberDetail,
    searchMember, tambahMember, updateMember,
    topupManual, topupBulananOtomatis,
    catatTransaksiMember,
    bulanIni, tahunIni, BULAN,
  };
}
