"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { Store, MapPin, Phone, FileText } from "lucide-react";

// Simpan di localStorage untuk preview (nanti bisa ke Supabase settings tabel)
const STORAGE_KEY = "daimart_store_profile";

function loadProfile() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch { return null; }
}

export default function ProfilToko() {
  const saved = loadProfile();
  const [form, setForm] = useState({
    store_name: saved?.store_name ?? "DaiMart",
    address: saved?.address ?? "",
    phone: saved?.phone ?? "",
    tagline: saved?.tagline ?? "Belanja Mudah, Harga Hemat",
    footer_note: saved?.footer_note ?? "Terima kasih telah berbelanja di DaiMart 🛒",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    toast.success("Profil toko disimpan");
    setSaving(false);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Profil Toko</h2>
          <p className="text-sm text-gray-400">Info yang muncul di struk & laporan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Nama Toko</label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              required placeholder="DaiMart"
              className="input-base pl-9"
            />
          </div>
        </div>

        <div>
          <label className="label-base">Tagline</label>
          <input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="Belanja Mudah, Harga Hemat"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Alamat Toko</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Jl. Contoh No. 123, Kota..."
              rows={2}
              className="input-base pl-9 resize-none"
            />
          </div>
        </div>

        <div>
          <label className="label-base">No. Telepon / WhatsApp</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="08xx-xxxx-xxxx"
              className="input-base pl-9"
            />
          </div>
        </div>

        <div>
          <label className="label-base">Pesan di Bawah Struk</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={form.footer_note}
              onChange={(e) => setForm({ ...form, footer_note: e.target.value })}
              placeholder="Terima kasih telah berbelanja..."
              rows={2}
              className="input-base pl-9 resize-none"
            />
          </div>
        </div>

        {/* Preview struk mini */}
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-500 space-y-0.5">
          <p className="font-bold text-sm text-gray-800">{form.store_name || "Nama Toko"}</p>
          <p className="text-gray-400 italic">{form.tagline}</p>
          {form.address && <p>{form.address}</p>}
          {form.phone && <p>📞 {form.phone}</p>}
          <p className="mt-2 text-gray-400">— {form.footer_note} —</p>
        </div>

        <Button type="submit" loading={saving} className="w-full">
          Simpan Profil Toko
        </Button>
      </form>
    </div>
  );
}
