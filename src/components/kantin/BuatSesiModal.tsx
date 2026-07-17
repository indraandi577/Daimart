"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface BuatSesiModalProps {
  defaultTanggal: string;
  defaultCatatan?: string;
  editMode?: boolean;
  onClose: () => void;
  onSubmit: (tanggal: string, catatan?: string) => Promise<void>;
}

export default function BuatSesiModal({
  defaultTanggal,
  defaultCatatan = "",
  editMode = false,
  onClose,
  onSubmit,
}: BuatSesiModalProps) {
  const [tanggal, setTanggal] = useState(defaultTanggal);
  const [catatan, setCatatan] = useState(defaultCatatan);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(tanggal, catatan || undefined);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editMode ? "Edit Sesi Kantin" : "Buat Sesi Kantin Baru"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Tanggal</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
            className="input-base"
          />
        </div>
        <div>
          <label className="label-base">Catatan (opsional)</label>
          <input
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: Hari Senin minggu ke-3"
            className="input-base"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            {editMode ? "Simpan Perubahan" : "Buat Sesi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
