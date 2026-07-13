"use client";

import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { CartItem } from "@/types";
import { formatRupiah } from "@/lib/utils";

interface CartTableProps {
  cart: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartTable({
  cart,
  onUpdateQty,
  onRemove,
}: CartTableProps) {
  if (cart.length === 0) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-gray-300">
        <ShoppingCart className="w-16 h-16 mb-3" />
        <p className="text-sm font-medium text-gray-400">Keranjang kosong</p>
        <p className="text-xs text-gray-300 mt-1">
          Pilih produk atau scan barcode
        </p>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      {/* Header tabel */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-5">Produk</div>
          <div className="col-span-2 text-right">Harga</div>
          <div className="col-span-3 text-center">Qty</div>
          <div className="col-span-1 text-right">Sub</div>
          <div className="col-span-1" />
        </div>
      </div>

      {/* Baris produk */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {cart.map((item, index) => (
          <div
            key={item.product.id}
            className="grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-gray-50/50 transition-colors"
          >
            {/* No + Nama Produk */}
            <div className="col-span-5 flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-400 w-5 flex-shrink-0">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-400">{item.product.unit}</p>
              </div>
            </div>

            {/* Harga satuan */}
            <div className="col-span-2 text-right text-xs text-gray-500">
              {formatRupiah(item.product.price_sell)}
            </div>

            {/* Kontrol Qty */}
            <div className="col-span-3 flex items-center justify-center gap-1">
              <button
                onClick={() => onUpdateQty(item.product.id, -1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 transition-colors"
                aria-label="Kurangi"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-gray-800">
                {item.qty}
              </span>
              <button
                onClick={() => onUpdateQty(item.product.id, 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-green-100 hover:text-green-600 text-gray-600 transition-colors"
                aria-label="Tambah"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="col-span-1 text-right text-xs font-semibold text-gray-800">
              {formatRupiah(item.subtotal)}
            </div>

            {/* Hapus */}
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => onRemove(item.product.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-100 hover:text-red-500 transition-colors"
                aria-label="Hapus item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer: jumlah item */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
        <p className="text-xs text-gray-400 text-center">
          {cart.length} jenis produk ·{" "}
          {cart.reduce((s, i) => s + i.qty, 0)} item
        </p>
      </div>
    </div>
  );
}
