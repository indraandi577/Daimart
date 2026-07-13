"use client";

import { useState } from "react";
import { Plus, Search, Package, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Product, getStockStatus } from "@/types";
import { formatRupiah, cn } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProductModal from "./ProductModal";
import toast from "react-hot-toast";
import { useProducts } from "@/lib/hooks/useProducts";

export default function ProductManagement() {
  const { products, loading, addProduct, updateProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = [...products]
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search)
    )
    .sort((a, b) => a.stock - b.stock); // stok tersedikit di atas

  const statsData = {
    total: products.length,
    low: products.filter((p) => getStockStatus(p) === "low").length,
    empty: products.filter((p) => getStockStatus(p) === "empty").length,
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsNew(false);
    setModalOpen(true);
  };

  const openNewModal = () => {
    setSelectedProduct(null);
    setIsNew(true);
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<Product>) => {
    setSaving(true);
    try {
      if (isNew) {
        await addProduct({
          name: data.name ?? "",
          barcode: data.barcode,
          category_id: data.category_id ?? "",
          price_sell: data.price_sell ?? 0,
          price_buy: data.price_buy ?? 0,
          stock: data.stock ?? 0,
          stock_minimum: data.stock_minimum ?? 0,
          unit: data.unit ?? "pcs",
          is_active: true,
        });
        toast.success("Produk baru ditambahkan");
      } else if (selectedProduct) {
        await updateProduct(selectedProduct.id, data);
        toast.success("Produk berhasil diupdate");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error((err as Error).message || "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk &amp; Stok</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola inventaris dan harga produk
          </p>
        </div>
        <Button onClick={openNewModal} size="md" disabled={loading}>
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Jenis Produk"
          value={loading ? "..." : statsData.total}
          icon={Package}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          subtitle="Produk aktif terdaftar"
        />
        <StatCard
          title="Stok Menipis"
          value={loading ? "..." : statsData.low}
          icon={AlertTriangle}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100"
          subtitle="Di bawah stok minimum"
          className={statsData.low > 0 ? "border-yellow-200" : ""}
        />
        <StatCard
          title="Stok Habis"
          value={loading ? "..." : statsData.empty}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-100"
          subtitle="Perlu kulakan segera"
          className={statsData.empty > 0 ? "border-red-200" : ""}
        />
      </div>

      {/* Tabel Produk */}
      <div className="card overflow-hidden">
        {/* Search + info */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          {loading && (
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
          )}
          <span className="text-xs text-gray-400 ml-auto">
            Diurutkan: stok tersedikit
          </span>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Barcode</th>
                  <th className="text-right">Harga Jual</th>
                  <th className="text-right">Harga Beli</th>
                  <th className="text-center">Stok</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        status === "empty" && "bg-red-50/60",
                        status === "low" && "bg-yellow-50/60"
                      )}
                    >
                      <td>
                        <div>
                          <p className="font-medium text-gray-800">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {product.unit} · {product.category?.name ?? product.category_id}
                          </p>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-gray-500">
                        {product.barcode ?? "-"}
                      </td>
                      <td className="text-right font-semibold text-green-700">
                        {formatRupiah(product.price_sell)}
                      </td>
                      <td className="text-right text-gray-500">
                        {formatRupiah(product.price_buy)}
                      </td>
                      <td className="text-center">
                        <span
                          className={cn(
                            "font-bold text-sm",
                            status === "empty" && "text-red-600",
                            status === "low" && "text-yellow-600",
                            status === "normal" && "text-gray-800"
                          )}
                        >
                          {product.stock}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          / min {product.stock_minimum}
                        </span>
                      </td>
                      <td className="text-center">
                        {status === "empty" ? (
                          <Badge variant="danger">Habis</Badge>
                        ) : status === "low" ? (
                          <Badge variant="warning">Menipis</Badge>
                        ) : (
                          <Badge variant="success">Tersedia</Badge>
                        )}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Edit Cepat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {products.length === 0
                  ? "Belum ada produk. Tambah produk pertama!"
                  : "Produk tidak ditemukan"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Edit/Tambah */}
      {modalOpen && (
        <ProductModal
          product={selectedProduct}
          isNew={isNew}
          saving={saving}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
