import { formatRupiah } from "@/lib/utils";
import type { TopProduct } from "@/types";

interface TopProductsTableProps {
  data: TopProduct[];
  loading?: boolean;
}

export default function TopProductsTable({ data, loading }: TopProductsTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">
        Belum ada data produk terjual
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 px-1 text-xs font-semibold text-gray-400 w-8">#</th>
            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-400">Produk</th>
            <th className="text-right py-2 px-2 text-xs font-semibold text-gray-400">Terjual</th>
            <th className="text-right py-2 px-2 text-xs font-semibold text-gray-400">Omset</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const rank = index + 1;
            return (
              <tr key={item.product_id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-1">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      rank === 1
                        ? "bg-yellow-100 text-yellow-700"
                        : rank === 2
                        ? "bg-gray-100 text-gray-500"
                        : rank === 3
                        ? "bg-orange-100 text-orange-600"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {rank}
                  </span>
                </td>
                <td className="py-3 px-2 font-medium text-gray-800">
                  {item.product_name}
                </td>
                <td className="py-3 px-2 text-right text-gray-600">
                  {item.total_qty} pcs
                </td>
                <td className="py-3 px-2 text-right font-semibold text-green-700">
                  {formatRupiah(item.total_omset)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
