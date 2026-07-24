"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { KantinPenitip, bulatkan500 } from "@/lib/hooks/useKantin";
import { formatRupiah } from "@/lib/utils";

interface InputTerjualModalProps {
  penitip: KantinPenitip;
  onClose: () => void;
  onSubmit: (updates: { snackId: string; qty: number }[]) => Promise<void>;
}

export default function InputTerjualModal({ penitip, onClose, onSubmit }: InputTerjualModalProps) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(penitip.snacks.map((s) => [s.id, s.qty_terjual]))
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(
      Object.entries(values).map(([snackId, qty]) => ({ snackId, qty }))
    );
    setSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title={`Input Terjual — ${penitip.nama}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Masukkan jumlah snack yang terjual untuk setiap jenis.
        </p>

        <div className="space-y-3">
          {penitip.snacks.map((snack) => {
            const qty = values[snack.id] ?? 0;
            const totalLaku = qty * snack.harga_jual;
            const komisi = Math.round(totalLaku * snack.komisi_pct / 100);
            const uangPenitipAsli = totalLaku - komisi;
            // Catatan: pembulatan ke 500 dilakukan di TOTAL per penitip, bukan per item
            const uangPenitip = uangPenitipAsli;

            return (
              <div key={snack.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-800">{snack.nama_snack}</p>
                  <span className="text-xs text-gray-400">
                    Titip: {snack.qty_titip} pcs · {formatRupiah(snack.harga_jual)}/pcs
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-24 flex-shrink-0">Terjual:</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setValues((p) => ({ ...p, [snack.id]: Math.max(0, (p[snack.id] ?? 0) - 1) }))}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 font-bold transition-colors"
                    >−</button>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => {
                        const v = Math.min(snack.qty_titip, Math.max(0, Number(e.target.value)));
                        setValues((p) => ({ ...p, [snack.id]: v }));
                      }}
                      min={0}
                      max={snack.qty_titip}
                      className="w-16 text-center input-base py-1.5 font-bold text-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setValues((p) => ({ ...p, [snack.id]: Math.min(snack.qty_titip, (p[snack.id] ?? 0) + 1) }))}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-600 font-bold transition-colors"
                    >+</button>
                    <span className="text-xs text-gray-400">/ {snack.qty_titip}</span>
                  </div>
                </div>

                {qty > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-gray-500">Total Laku</p>
                      <p className="font-bold text-green-700">{formatRupiah(totalLaku)}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-gray-500">Komisi ({snack.komisi_pct}%)</p>
                      <p className="font-bold text-amber-600">{formatRupiah(komisi)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-gray-500">Uang Penitip</p>
                      <p className="font-bold text-blue-700">{formatRupiah(uangPenitip)}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" loading={saving} className="flex-1">Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}
