"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface SnackForm {
  nama_snack: string;
  harga_jual: number;
  qty_titip: number;
  komisi_pct: number;
}

interface TambahPenitipModalProps {
  onClose: () => void;
  onSubmit: (nama: string, snacks: SnackForm[]) => Promise<void>;
}

const defaultSnack = (): SnackForm => ({
  nama_snack: "",
  harga_jual: 0,
  qty_titip: 0,
  komisi_pct: 15,
});

export default function TambahPenitipModal({ onClose, onSubmit }: TambahPenitipModalProps) {
  const [nama, setNama] = useState("");
  const [snacks, setSnacks] = useState<SnackForm[]>([defaultSnack()]);
  const [saving, setSaving] = useState(false);

  const updateSnack = (idx: number, field: keyof SnackForm, value: string | number) => {
    setSnacks((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addSnack = () => setSnacks((prev) => [...prev, defaultSnack()]);
  const removeSnack = (idx: number) => setSnacks((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    if (snacks.some((s) => !s.nama_snack || s.harga_jual <= 0 || s.qty_titip <= 0)) {
      alert("Lengkapi semua data snack terlebih dahulu");
      return;
    }
    setSaving(true);
    await onSubmit(nama.trim(), snacks);
    setSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title="Tambah Penitip & Snack" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nama Penitip */}
        <div>
          <label className="label-base">Nama Penitip</label>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            placeholder="Contoh: Bu Ani"
            className="input-base"
          />
        </div>

        {/* Daftar Snack — scrollable */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label-base mb-0">Daftar Snack</label>
            <button
              type="button"
              onClick={addSnack}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <Plus className="w-4 h-4" /> Tambah Jenis
            </button>
          </div>

          {/* Area scroll untuk snack list */}
          <div className="max-h-80 overflow-y-auto pr-1 space-y-3">
            {snacks.map((snack, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Snack {idx + 1}
                  </span>
                  {snacks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSnack(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="label-base">Nama Snack</label>
                  <input
                    value={snack.nama_snack}
                    onChange={(e) => updateSnack(idx, "nama_snack", e.target.value)}
                    required
                    placeholder="Contoh: Risol Mayo, Cireng, Batagor..."
                    className="input-base"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label-base">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      value={snack.harga_jual || ""}
                      onChange={(e) => updateSnack(idx, "harga_jual", Number(e.target.value))}
                      required min={1}
                      placeholder="2000"
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="label-base">Qty Titip</label>
                    <input
                      type="number"
                      value={snack.qty_titip || ""}
                      onChange={(e) => updateSnack(idx, "qty_titip", Number(e.target.value))}
                      required min={1}
                      placeholder="20"
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="label-base">Komisi Kantin (%)</label>
                    <input
                      type="number"
                      value={snack.komisi_pct}
                      onChange={(e) => updateSnack(idx, "komisi_pct", Number(e.target.value))}
                      min={0} max={100}
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Preview hitung */}
                {snack.harga_jual > 0 && snack.qty_titip > 0 && (
                  <div className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 flex gap-4 flex-wrap">
                    <span>Max laku: <b className="text-green-700">{formatRupiah(snack.harga_jual * snack.qty_titip)}</b></span>
                    <span>Komisi kantin: <b className="text-amber-600">{snack.komisi_pct}%</b></span>
                    <span>Penitip dapat: <b className="text-gray-700">{100 - snack.komisi_pct}%</b></span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Info jumlah snack */}
          <p className="text-xs text-gray-400 mt-2 text-center">
            {snacks.length} jenis snack · scroll ke bawah untuk melihat semua
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" loading={saving} className="flex-1">Simpan Penitip</Button>
        </div>
      </form>
    </Modal>
  );
}
