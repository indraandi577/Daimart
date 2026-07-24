"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { KantinSnack } from "@/lib/hooks/useKantin";
import toast from "react-hot-toast";

interface EditSnackModalProps {
  snack: KantinSnack;
  onClose: () => void;
  onSave: (snackId: string, data: {
    nama_snack: string;
    harga_jual: number;
    qty_titip: number;
    komisi_pct: number;
  }) => Promise<void>;
}

export default function EditSnackModal({ snack, onClose, onSave }: EditSnackModalProps) {
  const [form, setForm] = useState({
    nama_snack: snack.nama_snack,
    harga_jual: snack.harga_jual,
    qty_titip: snack.qty_titip,
    komisi_pct: snack.komisi_pct,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.qty_titip < snack.qty_terjual) {
      toast.error(`Qty titip tidak boleh kurang dari yang sudah terjual (${snack.qty_terjual})`);
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
            required
            placeholder="Nama snack"
            className="input-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-base">Harga Jual (Rp)</label>
            <input
              type="number"
              value={form.harga_jual || ""}
              onChange={(e) => setForm({ ...form, harga_jual: Number(e.target.value) })}
              required min={1}
              className="input-base"
            />
          </div>
          <div>
            <label className="label-base">Qty Titip</label>
            <input
              type="number"
              value={form.qty_titip || ""}
              onChange={(e) => setForm({ ...form, qty_titip: Number(e.target.value) })}
              required
              min={snack.qty_terjual}
              className="input-base"
            />
            {snack.qty_terjual > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Min. {snack.qty_terjual} (sudah terjual)
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="label-base">Komisi Kantin (%)</label>
          <input
            type="number"
            value={form.komisi_pct}
            onChange={(e) => setForm({ ...form, komisi_pct: Number(e.target.value) })}
            min={0} max={100}
            className="input-base"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
