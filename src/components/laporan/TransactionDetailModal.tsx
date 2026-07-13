"use client";

import Modal from "@/components/ui/Modal";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { TransactionDetail } from "@/lib/hooks/useLaporan";
import { Printer } from "lucide-react";

interface TransactionDetailModalProps {
  detail: TransactionDetail | null;
  loading: boolean;
  onClose: () => void;
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Tunai",
  qris: "QRIS",
  debit: "Kartu Debit",
};

export default function TransactionDetailModal({
  detail,
  loading,
  onClose,
}: TransactionDetailModalProps) {
  if (!detail && !loading) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Detail Transaksi"
      size="md"
    >
      {loading || !detail ? (
        <div className="space-y-3 py-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header struk */}
          <div className="text-center pb-4 border-b border-dashed border-gray-200">
            <p className="font-bold text-lg text-gray-900">DaiMart</p>
            <p className="text-xs text-gray-400 mt-0.5">Struk Digital</p>
          </div>

          {/* Info transaksi */}
          <div className="space-y-1.5 text-sm">
            {[
              ["No. Nota", detail.transaction_code],
              ["Tanggal", format(new Date(detail.created_at), "dd MMMM yyyy, HH:mm", { locale: id })],
              ["Kasir", detail.kasir_name],
              ["Metode Bayar", METHOD_LABEL[detail.payment_method] ?? detail.payment_method],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800 text-right max-w-[60%] truncate">{value}</span>
              </div>
            ))}
          </div>

          {/* Daftar item */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Rincian Belanja
            </div>
            <div className="divide-y divide-gray-50">
              {detail.items.map((item, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                    <p className="text-xs text-gray-400">
                      {item.qty} × {formatRupiah(item.price_sell)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Belanja</span>
              <span className="font-semibold">{formatRupiah(detail.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Dibayar</span>
              <span className="font-semibold">{formatRupiah(detail.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Kembalian</span>
              <span className="font-semibold text-green-600">{formatRupiah(detail.change_amount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
              <span>TOTAL</span>
              <span className="text-green-700">{formatRupiah(detail.total_amount)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 pb-2">
            Terima kasih telah berbelanja di DaiMart 🛒
          </div>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
        </div>
      )}
    </Modal>
  );
}
