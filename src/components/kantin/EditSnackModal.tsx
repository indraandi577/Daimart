"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { KantinSnack } from "@/lib/hooks/useKantin";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

interface EditSnackModalProps {
  snack: KantinSnack;
  onClose: () => void;
  onSave: (snackId: string, data: {
    nama_snack: string;
    harga_beli: number;
    harga_jual: number;
    qty_titip: number;
  }) => Promise<void>;
}

export default function EditSnackModal({ snack, onClose, onSave }: EditSnackModalProps) {
  const [form, setForm] = useState({
    nama_snack: snack.nama_snack,
    harga_beli: snack.harga_beli,
    harga_jual: snack.harga_jual,
    qty_titip: snack.qty_titip,
  });
  const [saving, setSaving] = useState(false);

  const margin = form.harga_jual - form.harga_beli;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.harga_beli >= form.harga_jual) {
      toast.error("Harga jual harus lebih besar dari harga beli");
      return;
    }
    if (form.qty_titip < snack.qty_terjual) {
      toast.error(`Qty titip min. ${snack.qty_terjual} (sudah terjual)`);
      return;
    }
    setSaving(true);
    try {
      await onSave(snack.id, form);
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Snack" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Nama Snack</label>
          <input
            value={form.nama_snack}
            onChange={(e) => setForm({ ...form, nama_snack: e.target.value })}
            required className="input-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-base">Harga Beli (Rp)</label>
            <input type="number" value={form.harga_beli || ""}
              onChange={(e) => setForm({ ...form, harga_beli: Number(e.target.value) })}
              required min={1} className="input-base" />
          </div>
          <div>
            <label className="label-base">Harga Jual (Rp)</label>
            <input type="number" value={form.harga_jual || ""}
              onChange={(e) => setForm({ ...form, harga_jual: Number(e.target.value) })}
              required min={1} className="input-base" />
          </div>
        </div>

        <div>
          <label className="label-base">Qty Titip</label>
          <input type="number" value={form.qty_titip || ""}
            onChange={(e) => setForm({ ...form, qty_titip: Number(e.target.value) })}
            required min={snack.qty_terjual} className="input-base" />
          {snack.qty_terjual > 0 && (
            <p className="text-xs text-gray-400 mt-1">Min. {snack.qty_terjual} (sudah terjual)</p>
          )}
        </div>

        {margin > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm">
            <span className="text-gray-500">Keuntungan kantin/pcs: </span>
            <span className="font-bold text-green-700">{formatRupiah(margin)}</span>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" loading={saving} className="flex-1">Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}
