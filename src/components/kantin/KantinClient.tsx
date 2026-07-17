"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronRight, Calendar, CheckCircle, Clock, Edit2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useKantin, KantinSesi } from "@/lib/hooks/useKantin";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import SesiDetail from "./SesiDetail";
import BuatSesiModal from "./BuatSesiModal";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function KantinClient() {
  const { sesiList, loading, fetchSesiList, buatSesi, editSesi, hapusSesi, today } = useKantin();
  const [buatOpen, setBuatOpen] = useState(false);
  const [editSesiData, setEditSesiData] = useState<KantinSesi | null>(null);
  const [selectedSesiId, setSelectedSesiId] = useState<string | null>(null);

  useEffect(() => { fetchSesiList(); }, [fetchSesiList]);

  if (selectedSesiId) {
    return (
      <SesiDetail
        sesiId={selectedSesiId}
        onBack={() => { setSelectedSesiId(null); fetchSesiList(); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kantin Titip Snack</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola titipan snack harian · Komisi kantin 15%
          </p>
        </div>
        <Button onClick={() => setBuatOpen(true)}>
          <Plus className="w-4 h-4" />
          Sesi Baru
        </Button>
      </div>

      {/* Info cara kerja */}
      <div className="card p-4 bg-amber-50 border-amber-200">
        <div className="flex gap-6 text-sm flex-wrap">
          {[
            { step: "1", label: "Pagi", desc: "Buat sesi → daftarkan penitip + snack mereka" },
            { step: "2", label: "Istirahat selesai", desc: "Input qty terjual per snack" },
            { step: "3", label: "Hitung", desc: "Sistem otomatis hitung uang penitip (85%) & komisi kantin (15%)" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.step}
              </span>
              <div>
                <p className="font-semibold text-amber-800">{item.label}</p>
                <p className="text-amber-700 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daftar Sesi */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Riwayat Sesi ({sesiList.length})
          </p>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sesiList.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-3">🍱</p>
            <p className="font-medium text-gray-500">Belum ada sesi kantin</p>
            <p className="text-sm mt-1">Klik "Sesi Baru" untuk mulai hari ini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sesiList.map((sesi) => {
              const isToday = sesi.tanggal === today;
              return (
                <div key={sesi.id} className="flex items-center border-t border-gray-50 first:border-0">
                  {/* Klik baris → buka detail */}
                  <button
                    onClick={() => setSelectedSesiId(sesi.id)}
                    className="flex-1 flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg",
                      sesi.status === "selesai" ? "bg-green-100" : "bg-amber-100"
                    )}>
                      {sesi.status === "selesai" ? "✅" : "🍱"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">
                          {format(new Date(sesi.tanggal), "EEEE, dd MMMM yyyy", { locale: id })}
                        </p>
                        {isToday && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Hari ini
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {sesi.status === "selesai" ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" /> Selesai
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="w-3 h-3" /> Aktif
                          </span>
                        )}
                        {sesi.catatan && (
                          <span className="text-xs text-gray-400 truncate">{sesi.catatan}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>

                  {/* Tombol Edit & Hapus */}
                  <div className="flex items-center gap-1 pr-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditSesiData(sesi); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit sesi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {sesi.status !== "selesai" && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Hapus sesi tanggal ${format(new Date(sesi.tanggal), "dd MMM yyyy")}? Semua data penitip & snack akan ikut terhapus.`)) return;
                          try {
                            await hapusSesi(sesi.id);
                          } catch (err) {
                            toast.error((err as Error).message);
                          }
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Hapus sesi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Buat Sesi */}
      {buatOpen && (
        <BuatSesiModal
          defaultTanggal={today}
          onClose={() => setBuatOpen(false)}
          onSubmit={async (tanggal, catatan) => {
            try {
              const sesi = await buatSesi(tanggal, catatan);
              setBuatOpen(false);
              setSelectedSesiId(sesi.id);
            } catch (err) {
              throw err;
            }
          }}
        />
      )}

      {/* Modal Edit Sesi */}
      {editSesiData && (
        <BuatSesiModal
          defaultTanggal={editSesiData.tanggal}
          defaultCatatan={editSesiData.catatan ?? ""}
          editMode
          onClose={() => setEditSesiData(null)}
          onSubmit={async (tanggal, catatan) => {
            try {
              await editSesi(editSesiData.id, tanggal, catatan);
              setEditSesiData(null);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}
