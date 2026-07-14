"use client";

import { useState } from "react";
import { Printer, RotateCcw, User, UserCheck, X } from "lucide-react";
import { CartItem } from "@/types";
import { formatRupiah, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useTransaction } from "@/lib/hooks/useTransaction";
import { useMember, Member } from "@/lib/hooks/useMember";

interface PaymentPanelProps {
  grandTotal: number;
  cart: CartItem[];
  kasirId: string;
  onSuccess: () => void;
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

export default function PaymentPanel({ grandTotal, cart, kasirId, onSuccess }: PaymentPanelProps) {
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "debit">("cash");
  const [isMember, setIsMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searching, setSearching] = useState(false);

  const { submitTransaction, loading } = useTransaction();
  const { searchMember, catatTransaksiMember } = useMember();

  const paid = parseInt(paidAmount || "0", 10);
  const change = paid - grandTotal;
  const isValid = cart.length > 0 && (paymentMethod !== "cash" || paid >= grandTotal);

  const handleMemberSearch = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    setSearching(true);
    try {
      const results = await searchMember(q);
      setMemberResults(results);
    } finally {
      setSearching(false);
    }
  };

  const handlePay = async () => {
    if (!isValid) {
      toast.error("Uang bayar kurang atau keranjang kosong");
      return;
    }
    if (!kasirId) {
      toast.error("Session kasir tidak ditemukan, silakan login ulang");
      return;
    }
    if (isMember && !selectedMember) {
      toast.error("Pilih member terlebih dahulu");
      return;
    }
    try {
      const trx = await submitTransaction({
        cart,
        totalAmount: grandTotal,
        paidAmount: paymentMethod === "cash" ? paid : grandTotal,
        changeAmount: paymentMethod === "cash" ? change : 0,
        paymentMethod,
        kasirId,
      });

      // Catat ke histori belanja member
      if (isMember && selectedMember && trx?.id) {
        await catatTransaksiMember(selectedMember.id, trx.id, grandTotal);
      }

      setPaidAmount("");
      setSelectedMember(null);
      setMemberSearch("");
      setIsMember(false);
      onSuccess();
    } catch (err) {
      toast.error((err as Error).message || "Transaksi gagal");
    }
  };

  return (
    <div className="card h-full flex flex-col p-4 gap-3 overflow-y-auto">
      {/* Grand Total */}
      <div className="bg-green-600 rounded-2xl p-4 text-center flex-shrink-0">
        <p className="text-green-200 text-sm font-medium mb-1">TOTAL BELANJA</p>
        <p className="text-4xl font-black text-white tracking-tight">
          {formatRupiah(grandTotal)}
        </p>
        {selectedMember && (
          <p className="text-green-200 text-xs mt-1">
            👤 {selectedMember.nama}
          </p>
        )}
      </div>

      {/* Toggle Umum / Member */}
      <div className="flex-shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setIsMember(false); setSelectedMember(null); setMemberSearch(""); }}
            className={cn(
              "py-2 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-1.5",
              !isMember ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-500 border-gray-200"
            )}
          >
            <User className="w-4 h-4" /> Umum
          </button>
          <button
            onClick={() => setIsMember(true)}
            className={cn(
              "py-2 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-1.5",
              isMember ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200"
            )}
          >
            <UserCheck className="w-4 h-4" /> Member
          </button>
        </div>

        {/* Cari member */}
        {isMember && (
          <div className="mt-2 space-y-2">
            {selectedMember ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
                  {selectedMember.nama.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-800 truncate">{selectedMember.nama}</p>
                  <p className="text-xs text-blue-500">{selectedMember.kode_member}</p>
                </div>
                <button onClick={() => { setSelectedMember(null); setMemberSearch(""); }}
                  className="text-blue-400 hover:text-blue-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={memberSearch}
                  onChange={(e) => handleMemberSearch(e.target.value)}
                  placeholder="Cari nama / kode member..."
                  className="input-base text-sm py-2"
                  autoFocus
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {memberResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {memberResults.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedMember(m); setMemberResults([]); setMemberSearch(""); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                          {m.nama.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{m.nama}</p>
                          <p className="text-xs text-gray-400">{m.kode_member} · {m.jabatan ?? "—"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {memberSearch.length >= 2 && memberResults.length === 0 && !searching && (
                  <p className="text-xs text-gray-400 mt-1 text-center">Member tidak ditemukan</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metode Bayar */}
      <div className="flex-shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Metode Bayar</p>
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

      {/* Input Uang Bayar (cash) */}
      {paymentMethod === "cash" && (
        <div className="space-y-2 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Uang Dibayar</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">Rp</span>
            <input
              type="number"
              placeholder="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="input-base pl-10 text-lg font-bold text-right"
              min={0}
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => setPaidAmount(String(parseInt(paidAmount || "0", 10) + amount))}
                className="py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors"
              >
                +{formatRupiah(amount)}
              </button>
            ))}
            <button
              onClick={() => setPaidAmount(String(grandTotal))}
              className="col-span-2 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Uang Pas
            </button>
          </div>
          <div className={cn(
            "rounded-xl p-3 text-center transition-colors",
            change >= 0 && paid > 0 ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-100"
          )}>
            <p className="text-xs text-gray-500 font-medium mb-0.5">KEMBALIAN</p>
            <p className={cn("text-2xl font-black", change >= 0 && paid > 0 ? "text-green-600" : "text-gray-300")}>
              {paid > 0 && change >= 0 ? formatRupiah(change) : "Rp 0"}
            </p>
          </div>
        </div>
      )}

      {paymentMethod !== "cash" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-2">{paymentMethod === "qris" ? "📱" : "💳"}</p>
            <p className="text-sm font-medium">
              {paymentMethod === "qris" ? "Tunjukkan QR ke pelanggan" : "Gesek/tap kartu"}
            </p>
            <p className="text-xl font-black text-gray-700 mt-2">{formatRupiah(grandTotal)}</p>
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Tombol Bayar */}
      <div className="space-y-2 flex-shrink-0">
        <Button
          onClick={handlePay}
          disabled={!isValid || (isMember && !selectedMember)}
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
            setSelectedMember(null);
            setMemberSearch("");
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
