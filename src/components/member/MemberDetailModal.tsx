"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useMember, Member, MemberDetail, MemberVoucher } from "@/lib/hooks/useMember";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Gift, ShoppingBag, Edit2, Check, X } from "lucide-react";
import toast from "react-hot-toast";

interface MemberDetailModalProps {
  member: Member;
  onClose: () => void;
}

const BULAN_NAMA = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default function MemberDetailModal({ member, onClose }: MemberDetailModalProps) {
  const { fetchMemberDetail, updateMember, redeemVoucher, bulanIni, tahunIni } = useMember();
  const { profile } = useAuth();
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    nama: member.nama,
    jabatan: member.jabatan ?? "",
    voucher_bulanan: member.voucher_bulanan,
    is_active: member.is_active,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMemberDetail(member.id).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [fetchMemberDetail, member.id]);

  const handleRedeem = async (voucher: MemberVoucher) => {
    if (!profile?.id) return;
    if (!confirm(`Konfirmasi: voucher ${BULAN_NAMA[voucher.bulan - 1]} ${voucher.tahun} senilai ${formatRupiah(voucher.nominal)} sudah diambil?`)) return;
    try {
      await redeemVoucher(voucher.id, profile.id);
      const updated = await fetchMemberDetail(member.id);
      setDetail(updated);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await updateMember(member.id, editForm);
      toast.success("Data member diperbarui");
      setEditMode(false);
      const updated = await fetchMemberDetail(member.id);
      setDetail(updated);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const voucherBulanIni = detail?.vouchers.find(
    (v) => v.bulan === bulanIni && v.tahun === tahunIni
  );

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
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0">
              {member.nama.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-2">
                  <input
                    value={editForm.nama}
                    onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                    className="input-base text-sm"
                    placeholder="Nama"
                  />
                  <input
                    value={editForm.jabatan}
                    onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                    className="input-base text-sm"
                    placeholder="Jabatan"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={editForm.voucher_bulanan || ""}
                      onChange={(e) => setEditForm({ ...editForm, voucher_bulanan: Number(e.target.value) })}
                      className="input-base text-sm"
                      placeholder="Voucher bulanan (Rp)"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      />
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
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-lg">{detail?.nama}</p>
                    <Badge variant={detail?.is_active ? "success" : "default"}>
                      {detail?.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <button
                      onClick={() => setEditMode(true)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{detail?.jabatan ?? "—"}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded-full">
                      {member.kode_member}
                    </span>
                    <span>🛒 {detail?.total_transaksi ?? 0}x belanja</span>
                    <span className="text-amber-600">
                      🎫 {formatRupiah(detail?.voucher_bulanan ?? 0)}/bln
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Voucher Bulan Ini */}
          <div className={`rounded-xl p-4 border ${
            voucherBulanIni
              ? voucherBulanIni.status === "sudah"
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
              : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className={`w-5 h-5 ${
                  voucherBulanIni?.status === "sudah" ? "text-green-600" :
                  voucherBulanIni ? "text-amber-600" : "text-gray-400"
                }`} />
                <div>
                  <p className="font-semibold text-sm text-gray-800">
                    Voucher {BULAN_NAMA[bulanIni - 1]} {tahunIni}
                  </p>
                  {voucherBulanIni ? (
                    <p className="text-xs text-gray-500">
                      {formatRupiah(voucherBulanIni.nominal)} ·{" "}
                      {voucherBulanIni.status === "sudah"
                        ? `✅ Sudah diambil ${format(new Date(voucherBulanIni.diambil_at!), "dd MMM yyyy HH:mm", { locale: id })}`
                        : "⏳ Belum diambil"
                      }
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      {member.voucher_bulanan > 0
                        ? "Voucher belum di-generate. Klik Generate Voucher di halaman member."
                        : "Member ini tidak memiliki voucher bulanan"
                      }
                    </p>
                  )}
                </div>
              </div>

              {voucherBulanIni && voucherBulanIni.status === "belum" && (
                <Button
                  size="sm"
                  onClick={() => handleRedeem(voucherBulanIni)}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  Tandai Sudah Diambil
                </Button>
              )}
            </div>
          </div>

          {/* Riwayat Voucher */}
          {(detail?.vouchers ?? []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-gray-400" />
                Riwayat Voucher (12 bulan terakhir)
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {detail?.vouchers.map((v) => (
                  <div
                    key={v.id}
                    className={`rounded-xl p-2.5 text-center text-xs border ${
                      v.status === "sudah"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}
                  >
                    <p className="font-semibold">{BULAN_NAMA[v.bulan - 1]} {v.tahun}</p>
                    <p className="mt-0.5">{formatRupiah(v.nominal)}</p>
                    <p className="mt-0.5">{v.status === "sudah" ? "✅ Diambil" : "⏳ Belum"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riwayat Belanja */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              10 Belanja Terakhir
            </h3>
            {(detail?.recent_transactions ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada riwayat belanja</p>
            ) : (
              <div className="space-y-1.5">
                {detail?.recent_transactions.map((trx) => (
                  <div key={trx.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50">
                    <span className="text-xs text-gray-500">
                      {format(new Date(trx.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                    </span>
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
