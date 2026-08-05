"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useMember, Member, MemberDetail } from "@/lib/hooks/useMember";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Wallet, ShoppingBag, Edit2, Check, X, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface MemberDetailModalProps {
  member: Member;
  onClose: () => void;
}

export default function MemberDetailModal({ member, onClose }: MemberDetailModalProps) {
  const { fetchMemberDetail, updateMember, topupManual } = useMember();
  const { profile } = useAuth();
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    nama: member.nama,
    nipy: member.nipy ?? "",
    jabatan: member.jabatan ?? "",
    topup_bulanan: member.topup_bulanan,
    is_active: member.is_active,
  });
  const [saving, setSaving] = useState(false);

  // Top up manual
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupNominal, setTopupNominal] = useState<number>(0);
  const [topupKet, setTopupKet] = useState("");
  const [topupSaving, setTopupSaving] = useState(false);

  useEffect(() => {
    fetchMemberDetail(member.id).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [fetchMemberDetail, member.id]);

  const reload = async () => {
    const d = await fetchMemberDetail(member.id);
    setDetail(d);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await updateMember(member.id, {
        ...editForm,
        nipy: editForm.nipy || null,
      });
      toast.success("Data member diperbarui");
      setEditMode(false);
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleTopupManual = async () => {
    if (!topupNominal || topupNominal <= 0) {
      toast.error("Nominal harus lebih dari 0");
      return;
    }
    if (!profile?.id) return;
    setTopupSaving(true);
    try {
      await topupManual(member.id, topupNominal, topupKet || `Top Up Manual`, profile.id);
      setTopupOpen(false);
      setTopupNominal(0);
      setTopupKet("");
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTopupSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Detail Member" size="lg">
      {loading ? (
        <div className="space-y-3 py-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header profil */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0">
              {member.nama.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-2">
                  <input value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} className="input-base text-sm" placeholder="Nama" />
                  <input value={editForm.nipy} onChange={(e) => setEditForm({ ...editForm, nipy: e.target.value })} className="input-base text-sm font-mono" placeholder="NIPY (opsional)" />
                  <input value={editForm.jabatan} onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })} className="input-base text-sm" placeholder="Jabatan" />
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Top Up/Bulan (Rp)</label>
                      <input type="number" value={editForm.topup_bulanan || ""} onChange={(e) => setEditForm({ ...editForm, topup_bulanan: Number(e.target.value) })} className="input-base text-sm mt-1" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mt-4">
                      <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
                      Aktif
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" loading={saving} onClick={handleSaveEdit}>
                      <Check className="w-3.5 h-3.5" /> Simpan
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditMode(false)}>
                      <X className="w-3.5 h-3.5" /> Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-lg">{detail?.nama}</p>
                    <Badge variant={detail?.is_active ? "success" : "default"}>
                      {detail?.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <button onClick={() => setEditMode(true)} className="p-1 text-gray-400 hover:text-blue-500">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{detail?.jabatan ?? "—"}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded-full">{member.kode_member}</span>
                    {detail?.nipy && (
                      <span className="font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        NIPY: {detail.nipy}
                      </span>
                    )}
                    <span>🛒 {detail?.total_transaksi ?? 0}x belanja</span>
                    <span className="text-blue-500">+{formatRupiah(detail?.topup_bulanan ?? 0)}/bln</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Saldo Wallet */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-xs font-medium mb-1">SALDO WALLET</p>
                <p className="text-3xl font-black">{formatRupiah(detail?.saldo ?? 0)}</p>
                <p className="text-blue-200 text-xs mt-1">
                  Total belanja: {formatRupiah(detail?.total_belanja ?? 0)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setTopupOpen(true)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Top Up Manual
                </button>
              </div>
            </div>
          </div>

          {/* Form top up manual */}
          {topupOpen && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800">Top Up Saldo Manual</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={topupNominal || ""}
                    onChange={(e) => setTopupNominal(Number(e.target.value))}
                    placeholder="75000"
                    className="input-base text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Keterangan</label>
                  <input
                    value={topupKet}
                    onChange={(e) => setTopupKet(e.target.value)}
                    placeholder="Top Up Manual..."
                    className="input-base text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" loading={topupSaving} onClick={handleTopupManual} className="flex-1">
                  Tambah Saldo
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setTopupOpen(false)}>
                  Batal
                </Button>
              </div>
            </div>
          )}

          {/* Riwayat Top Up */}
          {(detail?.topups ?? []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-400" /> Riwayat Top Up
              </h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {detail?.topups.map((t) => (
                  <div key={t.id} className="flex justify-between items-center py-2 px-3 rounded-xl bg-gray-50 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">{t.keterangan ?? "Top Up"}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(t.created_at), "dd MMM yyyy", { locale: id })}
                      </p>
                    </div>
                    <span className="font-bold text-green-600">+{formatRupiah(t.nominal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riwayat Belanja */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gray-400" /> Riwayat Belanja
            </h3>
            {(detail?.transactions ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada riwayat belanja</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {detail?.transactions.map((trx) => (
                  <div key={trx.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-xs text-gray-500">
                        {format(new Date(trx.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                      </p>
                      {trx.bayar_saldo > 0 && (
                        <p className="text-xs text-blue-500">
                          🎫 Pakai saldo: {formatRupiah(trx.bayar_saldo)}
                          {trx.bayar_tunai > 0 && ` + tunai ${formatRupiah(trx.bayar_tunai)}`}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatRupiah(trx.total_amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
