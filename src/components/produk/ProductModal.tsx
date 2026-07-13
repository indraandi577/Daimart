"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Product } from "@/types";
import { useCategories } from "@/lib/hooks/useCategories";

interface ProductModalProps {
  product: Product | null;
  isNew: boolean;
  saving?: boolean;
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
}

export default function ProductModal({
  product,
  isNew,
  saving = false,
  onSave,
  onClose,
}: ProductModalProps) {
  const { categories, loading: loadingCat } = useCategories();

  const [form, setForm] = useState({
    name: product?.name ?? "",
    barcode: product?.barcode ?? "",
    category_id: product?.category_id ?? "",
    price_sell: product?.price_sell ?? 0,
    price_buy: product?.price_buy ?? 0,
    stock: product?.stock ?? 0,
    stock_minimum: product?.stock_minimum ?? 10,
    unit: product?.unit ?? "pcs",
  });

  // Auto-set kategori pertama saat categories selesai load (untuk produk baru)
  useEffect(() => {
    if (isNew && !form.category_id && categories.length > 0) {
      setForm((prev) => ({ ...prev, category_id: categories[0].id }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["price_sell", "price_buy", "stock", "stock_minimum"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const margin =
    form.price_sell > 0 && form.price_buy > 0
      ? form.price_sell - form.price_buy
      : 0;
  const marginPct =
    form.price_buy > 0 ? ((margin / form.price_buy) * 100).toFixed(1) : "0";

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? "Tambah Produk Baru" : "Edit Cepat Produk"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama Produk */}
        <div>
          <label className="label-base" htmlFor="prod-name">Nama Produk</label>
          <input
            id="prod-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Contoh: Indomie Goreng 85gr"
            className="input-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Barcode */}
          <div>
            <label className="label-base" htmlFor="prod-barcode">Barcode</label>
            <input
              id="prod-barcode"
              name="barcode"
              value={form.barcode}
              onChange={handleChange}
              placeholder="Scan atau ketik manual"
              className="input-base font-mono"
            />
          </div>

          {/* Kategori — pakai data dinamis dari Supabase/dummy */}
          <div>
            <label className="label-base" htmlFor="prod-category">Kategori</label>
            <select
              id="prod-category"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              className="input-base"
              disabled={loadingCat}
            >
              {loadingCat ? (
                <option value="">Memuat kategori...</option>
              ) : (
                <>
                  <option value="" disabled>— Pilih kategori —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Harga Jual */}
          <div>
            <label className="label-base" htmlFor="prod-sell">Harga Jual (Rp)</label>
            <input
              id="prod-sell"
              name="price_sell"
              type="number"
              value={form.price_sell}
              onChange={handleChange}
              required
              min={0}
              className="input-base"
            />
          </div>

          {/* Harga Beli */}
          <div>
            <label className="label-base" htmlFor="prod-buy">Harga Beli / HPP (Rp)</label>
            <input
              id="prod-buy"
              name="price_buy"
              type="number"
              value={form.price_buy}
              onChange={handleChange}
              min={0}
              className="input-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Stok */}
          <div>
            <label className="label-base" htmlFor="prod-stock">Stok Saat Ini</label>
            <input
              id="prod-stock"
              name="stock"
              type="number"
              value={form.stock}
              onChange={handleChange}
              required
              min={0}
              className="input-base"
            />
          </div>

          {/* Stok Minimum */}
          <div>
            <label className="label-base" htmlFor="prod-min">Stok Minimum</label>
            <input
              id="prod-min"
              name="stock_minimum"
              type="number"
              value={form.stock_minimum}
              onChange={handleChange}
              min={0}
              className="input-base"
            />
          </div>

          {/* Satuan */}
          <div>
            <label className="label-base" htmlFor="prod-unit">Satuan</label>
            <select
              id="prod-unit"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="input-base"
            >
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="gram">gram</option>
              <option value="liter">liter</option>
              <option value="botol">botol</option>
              <option value="karung">karung</option>
              <option value="dus">dus</option>
              <option value="pack">pack</option>
            </select>
          </div>
        </div>

        {/* Estimasi laba — tampil kalau harga diisi */}
        {margin > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
            <span className="text-gray-500">Estimasi laba per item</span>
            <div className="text-right">
              <span className="font-bold text-green-700">
                Rp {margin.toLocaleString("id-ID")}
              </span>
              <span className="text-gray-400 ml-2 text-xs">({marginPct}%)</span>
            </div>
          </div>
        )}
        {form.price_sell > 0 && form.price_buy > form.price_sell && (
          <p className="text-xs text-red-500">
            ⚠️ Harga beli lebih tinggi dari harga jual — rugi!
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" className="flex-1" loading={saving}>
            {isNew ? "Tambah Produk" : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
