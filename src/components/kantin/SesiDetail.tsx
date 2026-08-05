"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, CheckCircle, Trash2, ShoppingBag, Edit2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useKantin, KantinPenitip, KantinSnack, totalPenitip } from "@/lib/hooks/useKantin";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import TambahPenitipModal from "./TambahPenitipModal";
import InputTerjualModal from "./InputTerjualModal";
import RekapSesiModal from "./RekapSesiModal";
import EditSnackModal from "./EditSnackModal";
import toast from "react-hot-toast";

interface SesiDetailProps {
  sesiId: string;
  onBack: () => void;
}

export default function SesiDetail({ sesiId, onBack }: SesiDetailProps) {
  const {
    activeSesi, penitips, loading,
    fetchSesiDetail, tambahPenitip, tambahSnack,
    hapusPenitip, hapusSnack, editSnack, updateTerjual,
    selesaikanSesi, totalOmsetSesi,
  } = useKantin();

  const [tambahPenitipOpen, setTambahPenitipOpen] = useState(false);
  const [inputTerjualPenitip, setInputTerjualPenitip] = useState<KantinPenitip | null>(null);
  const [editSnackData, setEditSnackData] = useState<KantinSnack | null>(null);
  const [rekapOpen, setRekapOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSesiDetail(sesiId); }, [fetchSesiDetail, sesiId]);

  const totalOmset = totalOmsetSesi(penitips);
  const isSelesai = activeSesi?.status === "selesai";

  const handleSelesaikan = async () => {
    if (!confirm("Yakin ingin menyelesaikan sesi ini? Data tidak bisa diubah setelah selesai.")) return;
    setSaving(true);
    try {
      await selesaikanSesi(sesiId);
      await fetchSesiDetail(sesiId);
      setRekapOpen(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {activeSesi
                ? format(new Date(activeSesi.tanggal), "EEEE, dd MMMM yyyy", { locale: id })
                : "Memuat..."}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isSelesai ? "✅ Sesi selesai" : `🍱 Sesi aktif · ${penitips.length} penitip`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isSelesai ? (
            <Button variant="secondary" onClick={() => setRekapOpen(true)}>Lihat Rekap</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setTambahPenitipOpen(true)} disabled={loading}>
                <Plus className="w-4 h-4" /> Tambah Penitip
              </Button>
              <Button onClick={handleSelesaikan} loading={saving}
                disabled={penitips.length === 0}
                className="bg-amber-500 hover:bg-amber-600">
                <CheckCircle className="w-4 h-4" /> Selesaikan Sesi
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Penitip</p>
          <p className="text-2xl font-bold text-gray-800">{penitips.length}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Snack</p>
          <p className="text-2xl font-bold text-gray-800">
            {penitips.reduce((s, p) => s + p.snacks.length, 0)}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Terjual</p>
          <p className="text-xl font-bold text-green-700">
            {formatRupiah(penitips.reduce((s, p) => s + totalPenitip(p).total_laku, 0))}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Omset Kantin</p>
          <p className="text-xl font-bold text-amber-600">{formatRupiah(totalOmset)}</p>
        </div>
      </div>

      {/* Daftar Penitip */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : penitips.length === 0 ? (
        <div className="card py-16 text-center text-gray-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-500">Belum ada penitip</p>
          <p className="text-sm mt-1">Klik "Tambah Penitip" untuk mulai</p>
        </div>
      ) : (
        <div className="space-y-4">
          {penitips.map((penitip) => {
            const tot = totalPenitip(penitip);
            return (
              <div key={penitip.id} className="card overflow-hidden">
                {/* Header penitip */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span className="font-semibold text-gray-800">{penitip.nama}</span>
                    <span className="text-xs text-gray-400">({penitip.snacks.length} jenis)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isSelesai && (
                      <>
                        <button
                          onClick={async () => {
                            if (!confirm(`Hapus penitip ${penitip.nama} beserta semua snacknya?`)) return;
                            try {
                              await hapusPenitip(penitip.id);
                              await fetchSesiDetail(sesiId);
                              toast.success("Penitip dihapus");
                            } catch (err) { toast.error((err as Error).message); }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Button size="sm" variant="outline" onClick={() => setInputTerjualPenitip(penitip)}>
                          Input Terjual
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabel snack */}
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Nama Snack</th>
                        <th className="text-right">Harga Beli</th>
                        <th className="text-right">Harga Jual</th>
                        <th className="text-center">Titip</th>
                        <th className="text-center">Terjual</th>
                        <th className="text-center">Sisa</th>
                        <th className="text-right">Balik Modal</th>
                        <th className="text-right">Total Laku</th>
                        <th className="text-right">Omset Kantin</th>
                        {!isSelesai && <th />}
                      </tr>
                    </thead>
                    <tbody>
                      {penitip.snacks.map((snack) => (
                        <tr key={snack.id}>
                          <td className="font-medium text-gray-800">{snack.nama_snack}</td>
                          <td className="text-right text-gray-500 text-xs">{formatRupiah(snack.harga_beli)}</td>
                          <td className="text-right text-gray-600">{formatRupiah(snack.harga_jual)}</td>
                          <td className="text-center text-gray-600">{snack.qty_titip}</td>
                          <td className="text-center">
                            <span className={`font-semibold ${snack.qty_terjual > 0 ? "text-green-600" : "text-gray-400"}`}>
                              {snack.qty_terjual}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`font-semibold ${snack.qty_sisa > 0 ? "text-amber-600" : "text-gray-400"}`}>
                              {snack.qty_sisa}
                            </span>
                          </td>
                          <td className="text-right text-gray-600">{formatRupiah(snack.total_modal)}</td>
                          <td className="text-right font-semibold text-green-700">{formatRupiah(snack.total_laku)}</td>
                          <td className="text-right font-bold text-amber-600">{formatRupiah(snack.omset_kantin)}</td>
                          {!isSelesai && (
                            <td>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setEditSnackData(snack)}
                                  className="p-1 text-gray-300 hover:text-blue-500 transition-colors" title="Edit snack">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Hapus snack "${snack.nama_snack}"?`)) return;
                                    try {
                                      await hapusSnack(snack.id);
                                      await fetchSesiDetail(sesiId);
                                    } catch (err) { toast.error((err as Error).message); }
                                  }}
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    {/* Footer */}
                    <tfoot>
                      <tr className="bg-gray-50 font-bold text-sm">
                        <td colSpan={6} className="px-4 py-2.5 text-gray-600">Total {penitip.nama}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatRupiah(tot.total_modal)}</td>
                        <td className="px-4 py-2.5 text-right text-green-700">{formatRupiah(tot.total_laku)}</td>
                        <td className="px-4 py-2.5 text-right text-amber-600">{formatRupiah(tot.omset_kantin)}</td>
                        {!isSelesai && <td />}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {tambahPenitipOpen && (
        <TambahPenitipModal
          onClose={() => setTambahPenitipOpen(false)}
          onSubmit={async (nama, snacks) => {
            try {
              const penitip = await tambahPenitip(sesiId, nama);
              for (const s of snacks) await tambahSnack(penitip.id, s);
              await fetchSesiDetail(sesiId);
              toast.success(`Penitip ${nama} ditambahkan`);
              setTambahPenitipOpen(false);
            } catch (err) { toast.error((err as Error).message); }
          }}
        />
      )}

      {inputTerjualPenitip && (
        <InputTerjualModal
          penitip={inputTerjualPenitip}
          onClose={() => setInputTerjualPenitip(null)}
          onSubmit={async (updates) => {
            try {
              for (const { snackId, qty } of updates) await updateTerjual(snackId, qty);
              await fetchSesiDetail(sesiId);
              toast.success("Data terjual disimpan");
              setInputTerjualPenitip(null);
            } catch (err) { toast.error((err as Error).message); }
          }}
        />
      )}

      {rekapOpen && (
        <RekapSesiModal sesi={activeSesi!} penitips={penitips} onClose={() => setRekapOpen(false)} />
      )}

      {editSnackData && (
        <EditSnackModal
          snack={editSnackData}
          onClose={() => setEditSnackData(null)}
          onSave={async (snackId, data) => {
            await editSnack(snackId, data);
            await fetchSesiDetail(sesiId);
            setEditSnackData(null);
          }}
        />
      )}
    </div>
  );
}
