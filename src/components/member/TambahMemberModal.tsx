"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface TambahMemberModalProps {
  onClose: () => void;
  onSubmit: (data: { nama: string; jabatan?: string; voucher_bulanan: number }) => Promise<void>;
}

export default function TambahMemberModal({ onClose, onSubmit }: TambahMemberModalProps) {
  const [form, setForm] = useState({ nama: "", jabatan: "", voucher_bulanan: 0 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      nama: form.nama,
      jabatan: form.jabatan || undefined,
      voucher_bulanan: form.voucher_bulanan,
    });
    setSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title="Tambah Member Baru" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Nama Guru</label>
          <input
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
            placeholder="Contoh: Bu Sri Wahyuni"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Jabatan / Mata Pelajaran</label>
          <input
            value={form.jabatan}
            onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
            placeholder="Contoh: Guru Matematika, Wali Kelas 9A"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Voucher Bulanan (Rp)</label>
          <input
            type="number"
            value={form.voucher_bulanan || ""}
            onChange={(e) => setForm({ ...form, voucher_bulanan: Number(e.target.value) })}
            min={0}
            placeholder="0 = tidak punya voucher"
            className="input-base"
          />
          <p className="text-xs text-gray-400 mt-1">
            Kosongkan atau isi 0 jika tidak ada voucher bulanan
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" loading={saving} className="flex-1">Tambah Member</Button>
        </div>
      </form>
    </Modal>
  );
}
