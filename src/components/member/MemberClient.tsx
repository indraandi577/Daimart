"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Users, Wallet, Trophy, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useMember, Member } from "@/lib/hooks/useMember";
import { formatRupiah } from "@/lib/utils";
import TambahMemberModal from "./TambahMemberModal";
import MemberDetailModal from "./MemberDetailModal";
import toast from "react-hot-toast";

export default function MemberClient() {
  const {
    members, loading,
    fetchMembers, tambahMember,
    topupBulananOtomatis,
    bulanIni, tahunIni, BULAN,
  } = useMember();

  const [search, setSearch] = useState("");
  const [tambahOpen, setTambahOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = members.filter((m) =>
    m.nama.toLowerCase().includes(search.toLowerCase()) ||
    m.kode_member.toLowerCase().includes(search.toLowerCase()) ||
    (m.jabatan ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const ranked = [...members]
    .filter((m) => m.is_active)
    .sort((a, b) => (b.total_transaksi ?? 0) - (a.total_transaksi ?? 0))
    .slice(0, 5);

  // Total saldo semua member
  const totalSaldo = members.reduce((s, m) => s + m.saldo, 0);

  const handleTopupBulanan = async () => {
    setTopupLoading(true);
    try {
      await topupBulananOtomatis();
      await fetchMembers();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Guru</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sistem wallet & top up bulanan untuk guru
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={handleTopupBulanan} loading={topupLoading}>
            <Wallet className="w-4 h-4" />
            Top Up Otomatis {BULAN[bulanIni - 1]} {tahunIni}
          </Button>
          <Button onClick={() => setTambahOpen(true)}>
            <Plus className="w-4 h-4" />
            Tambah Member
          </Button>
        </div>
      </div>

      {/* Info cara kerja */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-6 text-sm flex-wrap">
          {[
            { step: "1", label: "Daftar Member", desc: "Tambah guru sebagai member, set nominal top up/bulan" },
            { step: "2", label: "Top Up Bulanan", desc: "Klik 'Top Up Otomatis' tiap bulan → saldo semua member bertambah" },
            { step: "3", label: "Belanja Pakai Saldo", desc: "Di kasir pilih Member → saldo terpakai otomatis terpotong + terdata" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.step}
              </span>
              <div>
                <p className="font-semibold text-blue-800">{item.label}</p>
                <p className="text-blue-600 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daftar Member */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Member</p>
              <p className="text-2xl font-bold text-gray-800">{members.length}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Aktif</p>
              <p className="text-2xl font-bold text-green-600">
                {members.filter((m) => m.is_active).length}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Saldo</p>
              <p className="text-lg font-bold text-blue-600">
                {formatRupiah(totalSaldo)}
              </p>
            </div>
          </div>

          {/* Tabel member */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, kode, jabatan..."
                  className="input-base pl-9"
                />
              </div>
              {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-gray-500">
                  {members.length === 0 ? "Belum ada member" : "Tidak ditemukan"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                      {member.nama.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{member.nama}</p>
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {member.kode_member}
                        </span>
                        {member.nipy && (
                          <span className="text-xs font-mono text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                            {member.nipy}
                          </span>
                        )}
                        {!member.is_active && <Badge variant="default">Nonaktif</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                        {member.jabatan && <span>{member.jabatan}</span>}
                        <span>🛒 {member.total_transaksi ?? 0}x belanja</span>
                        {member.topup_bulanan > 0 && (
                          <span className="text-blue-500 font-medium">
                            +{formatRupiah(member.topup_bulanan)}/bln
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Saldo */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${member.saldo > 0 ? "text-green-600" : "text-gray-400"}`}>
                        {formatRupiah(member.saldo)}
                      </p>
                      <p className="text-xs text-gray-400">saldo</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-4">
          {/* Ranking */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-900">Ranking Belanja</h2>
            </div>
            {ranked.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {ranked.map((m, idx) => {
                  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{medals[idx]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{m.nama}</p>
                        <p className="text-xs text-gray-400">
                          {m.total_transaksi ?? 0}x · {formatRupiah(m.total_belanja ?? 0)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info top up */}
          <div className="card p-5 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-blue-800">Cara Top Up</h2>
            </div>
            <div className="text-xs text-blue-700 space-y-1.5">
              <p>• <b>Otomatis:</b> Klik tombol "Top Up Otomatis" setiap bulan → saldo semua member bertambah sesuai nominal masing-masing</p>
              <p>• <b>Manual:</b> Klik nama member → tombol "Top Up Manual" untuk tambah saldo individual</p>
              <p>• <b>Saldo menumpuk</b> jika bulan lalu belum dipakai</p>
            </div>
          </div>
        </div>
      </div>

      {tambahOpen && (
        <TambahMemberModal
          onClose={() => setTambahOpen(false)}
          onSubmit={async (data) => {
            try {
              await tambahMember(data);
              setTambahOpen(false);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
      )}

      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => { setSelectedMember(null); fetchMembers(); }}
        />
      )}
    </div>
  );
}
