"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface TambahMemberModalProps {
  onClose: () => void;
  onSubmit: (data: { nama: string; nipy?: string; jabatan?: string; topup_bulanan: number }) => Promise<void>;
}

export default function TambahMemberModal({ onClose, onSubmit }: TambahMemberModalProps) {
  const [form, setForm] = useState({ nama: "", nipy: "", jabatan: "", topup_bulanan: 0 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      nama: form.nama,
      nipy: form.nipy || undefined,
      jabatan: form.jabatan || undefined,
      topup_bulanan: form.topup_bulanan,
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
          <label className="label-base">NIPY <span className="text-gray-400 font-normal">(Nomor Induk Pegawai Yayasan)</span></label>
          <input
            value={form.nipy}
            onChange={(e) => setForm({ ...form, nipy: e.target.value })}
            placeholder="Contoh: 2024001234"
            className="input-base font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            NIPY akan digunakan sebagai kode barcode kartu member
          </p>
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
          <label className="label-base">Top Up Bulanan (Rp)</label>
          <input
            type="number"
            value={form.topup_bulanan || ""}
            onChange={(e) => setForm({ ...form, topup_bulanan: Number(e.target.value) })}
            min={0}
            placeholder="Contoh: 75000"
            className="input-base"
          />
          <p className="text-xs text-gray-400 mt-1">
            Saldo yang ditambahkan setiap bulan. Isi 0 jika tidak ada top up.
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
