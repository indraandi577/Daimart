"use client";

import { useState } from "react";
import { Search, Download, Eye, Receipt } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { TransactionRow } from "@/lib/hooks/useLaporan";

interface TransactionTableProps {
  transactions: TransactionRow[];
  loading: boolean;
  onExport: () => void;
  onViewDetail: (trxId: string) => void;
}

const METHOD_LABEL: Record<string, string> = {
  cash: "💵 Tunai",
  qris: "📱 QRIS",
  debit: "💳 Debit",
};

export default function TransactionTable({
  transactions,
  loading,
  onExport,
  onViewDetail,
}: TransactionTableProps) {
  const [search, setSearch] = useState("");

  const filtered = transactions.filter(
    (t) =>
      t.transaction_code.toLowerCase().includes(search.toLowerCase()) ||
      t.kasir_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card overflow-hidden">
      {/* Bar atas */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari no. nota atau nama kasir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">
            {filtered.length} transaksi
          </span>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
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
                <th>No. Nota</th>
                <th>Waktu</th>
                <th>Kasir</th>
                <th className="text-center">Total Item</th>
                <th className="text-right">Total Bayar</th>
                <th className="text-center">Metode</th>
                <th className="text-center">Status</th>
                <th className="text-center">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trx) => (
                <tr key={trx.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-xs font-semibold text-gray-700">
                        {trx.transaction_code}
                      </span>
                    </div>
                  </td>
                  <td className="text-xs text-gray-500">
                    {format(new Date(trx.created_at), "dd MMM yyyy", { locale: id })}
                    <span className="block text-gray-400">
                      {format(new Date(trx.created_at), "HH:mm")}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                        {trx.kasir_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <span className="text-sm text-gray-700">{trx.kasir_name}</span>
                    </div>
                  </td>
                  <td className="text-center text-sm text-gray-600">
                    {trx.total_items} item
                  </td>
                  <td className="text-right font-semibold text-gray-800">
                    {formatRupiah(trx.total_amount)}
                  </td>
                  <td className="text-center">
                    <span className="text-xs text-gray-500">
                      {METHOD_LABEL[trx.payment_method] ?? trx.payment_method}
                    </span>
                  </td>
                  <td className="text-center">
                    <Badge variant={trx.status === "completed" ? "success" : "danger"}>
                      {trx.status === "completed" ? "Lunas" : "Batal"}
                    </Badge>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => onViewDetail(trx.id)}
                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                      title="Lihat detail struk"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Tidak ada transaksi ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
