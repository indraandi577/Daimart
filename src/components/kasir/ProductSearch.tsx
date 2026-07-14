"use client";

import { Search, Scan } from "lucide-react";
import { useState, useRef } from "react";
import { Product } from "@/types";
import { cn, formatRupiah } from "@/lib/utils";
import { useProducts } from "@/lib/hooks/useProducts";
import { useCategories } from "@/lib/hooks/useCategories";
import BarcodeScanner from "./BarcodeScanner";
import toast from "react-hot-toast";

interface ProductSearchProps {
  onAddToCart: (product: Product) => void;
}

export default function ProductSearch({ onAddToCart }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const { products, loading: loadingProducts } = useProducts();
  const { categories, loading: loadingCat } = useCategories();

  const handleBarcodeDetected = (barcode: string) => {
    setScannerOpen(false);
    // Cari produk berdasarkan barcode
    const found = products.find((p) => p.barcode === barcode);
    if (found) {
      toast.success(`✅ ${found.name}`);
      onAddToCart(found);
    } else {
      // Tidak ketemu → isi ke search box agar kasir bisa cari manual
      setQuery(barcode);
      toast(`Barcode: ${barcode} — produk tidak ditemukan`, { icon: "🔍" });
    }
    searchRef.current?.focus();
  };

  const allCategories = [
    { id: "all", name: "Semua", icon: "🏪" },
    ...categories,
  ];

  const filtered = products.filter((p) => {
    const matchSearch =
      query === "" ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.barcode?.includes(query);
    const matchCategory =
      activeCategory === "all" || p.category_id === activeCategory;
    return matchSearch && matchCategory && p.is_active && p.stock > 0;
  });

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      {/* Search bar + tombol scan */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Cari nama / ketik barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-base pl-9 pr-10 text-sm py-2"
            autoFocus
          />
          {/* Tombol buka kamera scanner */}
          <button
            onClick={() => setScannerOpen(true)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Scan barcode"
          >
            <Scan className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scanner fullscreen */}
      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Kategori grid */}
      <div className="p-2 border-b border-gray-100">
        {loadingCat ? (
          <div className="grid grid-cols-3 gap-1.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-xs font-medium transition-all",
                  activeCategory === cat.id
                    ? "bg-green-600 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}
              >
                <span className="text-lg leading-none">{cat.icon ?? "🏪"}</span>
                <span className="truncate w-full text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Daftar produk */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loadingProducts ? (
          <div className="space-y-2 p-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Produk tidak ditemukan
          </div>
        ) : (
          filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => onAddToCart(product)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-green-50 hover:border-green-200 border border-transparent transition-all text-left active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                {product.category?.icon ?? "🛒"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {product.name}
                </p>
                <p className="text-xs text-green-700 font-bold mt-0.5">
                  {formatRupiah(product.price_sell)}
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 bg-gray-100 px-2 py-0.5 rounded-full">
                {product.stock}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
