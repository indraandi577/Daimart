import Badge from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/utils";
import type { RecentTrx } from "@/lib/hooks/useDashboard";

interface RecentTransactionsProps {
  data: RecentTrx[];
  loading?: boolean;
}

export default function RecentTransactions({ data, loading }: RecentTransactionsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">
        Belum ada transaksi hari ini
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {data.map((trx) => {
        const kasirName = trx.kasir?.name ?? "Unknown";
        const initial = kasirName
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        const time = new Date(trx.created_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={trx.id}
            className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {kasirName}
                </p>
                <p className="text-xs text-gray-400">{trx.transaction_code}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-sm font-semibold text-gray-900">
                {formatRupiah(trx.total_amount)}
              </p>
              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                <span className="text-xs text-gray-400">{time}</span>
                <Badge variant={trx.status === "completed" ? "success" : "danger"}>
                  {trx.status === "completed" ? "Lunas" : "Batal"}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
