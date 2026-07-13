"use client";

import { useState } from "react";
import { Printer, RotateCcw } from "lucide-react";
import { CartItem } from "@/types";
import { formatRupiah } from "@/lib/utils";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useTransaction } from "@/lib/hooks/useTransaction";

interface PaymentPanelProps {
  grandTotal: number;
  cart: CartItem[];
  kasirId: string;
  onSuccess: () => void;
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

export default function PaymentPanel({
  grandTotal,
  cart,
  kasirId,
  onSuccess,
}: PaymentPanelProps) {
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "debit">("cash");
  const { submitTransaction, loading } = useTransaction();

  const paid = parseInt(paidAmount || "0", 10);
  const change = paid - grandTotal;
  const isValid = cart.length > 0 && paid >= grandTotal;

  const handlePay = async () => {
    if (!isValid) {
      toast.error("Uang bayar kurang atau keranjang kosong");
      return;
    }
    if (!kasirId) {
      toast.error("Session kasir tidak ditemukan, silakan login ulang");
      return;
    }
    try {
      await submitTransaction({
        cart,
        totalAmount: grandTotal,
        paidAmount: paymentMethod === "cash" ? paid : grandTotal,
        changeAmount: paymentMethod === "cash" ? change : 0,
        paymentMethod,
        kasirId,
      });
      setPaidAmount("");
      onSuccess();
    } catch (err) {
      toast.error((err as Error).message || "Transaksi gagal");
    }
  };

  const addQuickAmount = (amount: number) => {
    const current = parseInt(paidAmount || "0", 10);
    setPaidAmount(String(current + amount));
  };

  return (
    <div className="card h-full flex flex-col p-4 gap-4">
      {/* Grand Total */}
      <div className="bg-green-600 rounded-2xl p-4 text-center">
        <p className="text-green-200 text-sm font-medium mb-1">TOTAL BELANJA</p>
        <p className="text-4xl font-black text-white tracking-tight">
          {formatRupiah(grandTotal)}
        </p>
      </div>

      {/* Metode Bayar */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Metode Bayar
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["cash", "qris", "debit"] as const).map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={cn(
                "py-2 rounded-xl text-xs font-semibold transition-all border",
                paymentMethod === method
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
              )}
            >
              {method === "cash" ? "💵 Tunai" : method === "qris" ? "📱 QRIS" : "💳 Debit"}
            </button>
          ))}
        </div>
      </div>

      {/* Input Uang Bayar */}
      {paymentMethod === "cash" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Uang Dibayar
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              Rp
            </span>
            <input
              type="number"
              placeholder="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="input-base pl-10 text-lg font-bold text-right"
              min={0}
            />
          </div>

          {/* Nominal cepat */}
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => addQuickAmount(amount)}
                className="py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors"
              >
                +{formatRupiah(amount).replace("Rp\u00A0", "Rp ")}
              </button>
            ))}
            <button
              onClick={() => setPaidAmount(String(grandTotal))}
              className="col-span-2 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Uang Pas
            </button>
          </div>

          {/* Kembalian */}
          <div
            className={cn(
              "rounded-xl p-3 text-center transition-colors",
              change >= 0 && paid > 0
                ? "bg-green-50 border border-green-200"
                : "bg-gray-50 border border-gray-100"
            )}
          >
            <p className="text-xs text-gray-500 font-medium mb-0.5">
              KEMBALIAN
            </p>
            <p
              className={cn(
                "text-2xl font-black",
                change >= 0 && paid > 0
                  ? "text-green-600"
                  : "text-gray-300"
              )}
            >
              {paid > 0 && change >= 0
                ? formatRupiah(change)
                : "Rp 0"}
            </p>
          </div>
        </div>
      )}

      {paymentMethod !== "cash" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-2">
              {paymentMethod === "qris" ? "📱" : "💳"}
            </p>
            <p className="text-sm font-medium">
              {paymentMethod === "qris" ? "Tunjukkan QR ke pelanggan" : "Gesek/tap kartu"}
            </p>
            <p className="text-xl font-black text-gray-700 mt-2">
              {formatRupiah(grandTotal)}
            </p>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Tombol Bayar */}
      <div className="space-y-2">
        <Button
          onClick={handlePay}
          disabled={!isValid}
          loading={loading}
          size="xl"
          className="w-full text-base py-4 rounded-2xl"
        >
          <Printer className="w-5 h-5" />
          BAYAR &amp; CETAK STRUK
        </Button>

        <button
          onClick={() => {
            setPaidAmount("");
            toast("Pembayaran direset", { icon: "🔄" });
          }}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
