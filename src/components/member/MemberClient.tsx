"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Users, Gift, Trophy, RefreshCw } from "lucide-react";
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
    fetchMembers, tambahMember, generateVoucherBulanIni,
    bulanIni, tahunIni, BULAN,
  } = useMember();

  const [search, setSearch] = useState("");
  const [tambahOpen, setTambahOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = members.filter((m) =>
    m.nama.toLowerCase().includes(search.toLowerCase()) ||
    m.kode_member.toLowerCase().includes(search.toLowerCase()) ||
    (m.jabatan ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Ranking belanja
  const ranked = [...members]
    .filter((m) => m.is_active)
    .sort((a, b) => (b.total_transaksi ?? 0) - (a.total_transaksi ?? 0))
    .slice(0, 5);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateVoucherBulanIni();
      await fetchMembers();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Guru</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Program belanja & voucher bulanan untuk guru
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleGenerate}
            loading={generating}
          >
            <Gift className="w-4 h-4" />
            Generate Voucher {BULAN[bulanIni - 1]} {tahunIni}
          </Button>
          <Button onClick={() => setTambahOpen(true)}>
            <Plus className="w-4 h-4" />
            Tambah Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kolom kiri: Daftar Member */}
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
              <p className="text-xs text-gray-500 mb-1">Punya Voucher</p>
              <p className="text-2xl font-bold text-amber-600">
                {members.filter((m) => m.voucher_bulanan > 0).length}
              </p>
            </div>
          </div>

          {/* Search & tabel */}
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
                  {members.length === 0 ? "Belum ada member" : "Member tidak ditemukan"}
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
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                      {member.nama.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{member.nama}</p>
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {member.kode_member}
                        </span>
                        {!member.is_active && <Badge variant="default">Nonaktif</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                        {member.jabatan && <span>{member.jabatan}</span>}
                        <span>🛒 {member.total_transaksi ?? 0}x belanja</span>
                        {member.voucher_bulanan > 0 && (
                          <span className="text-amber-600 font-medium">
                            🎫 {formatRupiah(member.voucher_bulanan)}/bln
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total belanja */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-700">
                        {formatRupiah(member.total_belanja ?? 0)}
                      </p>
                      <p className="text-xs text-gray-400">total belanja</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom kanan: Ranking */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-900">Ranking Belanja</h2>
            </div>

            {ranked.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Belum ada data belanja
              </p>
            ) : (
              <div className="space-y-3">
                {ranked.map((member, idx) => {
                  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                  return (
                    <div key={member.id} className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center flex-shrink-0">
                        {medals[idx]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {member.nama}
                        </p>
                        <p className="text-xs text-gray-400">
                          {member.total_transaksi ?? 0}x · {formatRupiah(member.total_belanja ?? 0)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info voucher bulan ini */}
          <div className="card p-5 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-amber-800">
                Voucher {BULAN[bulanIni - 1]} {tahunIni}
              </h2>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Klik "Generate Voucher" di atas untuk membuat voucher bulan ini bagi semua member aktif yang memiliki nominal voucher. Voucher hanya bisa diambil sekali per bulan.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Tambah Member */}
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

      {/* Modal Detail Member */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => { setSelectedMember(null); fetchMembers(); }}
        />
      )}
    </div>
  );
}
