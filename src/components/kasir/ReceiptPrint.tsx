"use client";

import { useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CartItem } from "@/types";

interface ReceiptData {
  transaction_code: string;
  created_at: string;
  kasir_name: string;
  cart: CartItem[];
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: "cash" | "qris" | "debit";
  is_member: boolean;
  member_name?: string;
  bayar_saldo?: number;
}

interface ReceiptPrintProps {
  data: ReceiptData;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  footerNote?: string;
  onDone: () => void;
}

const METHOD_LABEL: Record<string, string> = {
  cash:  "Tunai",
  qris:  "QRIS",
  debit: "Kartu Debit",
};

export default function ReceiptPrint({
  data,
  storeName = "DaiMart",
  storeAddress,
  storePhone,
  footerNote = "Terima kasih telah berbelanja!",
  onDone,
}: ReceiptPrintProps) {

  useEffect(() => {
    // Cetak otomatis setelah komponen mount
    const timer = setTimeout(() => {
      window.print();
      onDone();
    }, 300);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <>
      {/* CSS khusus print — hanya aktif saat window.print() */}
      <style>{`
        @media print {
          /* Sembunyikan semua elemen halaman */
          body > *:not(#receipt-print-root) {
            display: none !important;
          }
          #receipt-print-root {
            display: block !important;
          }
          /* Ukuran kertas thermal 58mm */
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            color: #000;
            background: #fff;
          }
          .receipt {
            width: 52mm;
            padding: 2mm;
            margin: 0 auto;
          }
          .no-print { display: none !important; }
        }
        @media screen {
          #receipt-print-root {
            display: none;
          }
        }
      `}</style>

      <div id="receipt-print-root">
        <div className="receipt">
          {/* Header toko */}
          <div style={{ textAlign: "center", marginBottom: "4px" }}>
            <div style={{ fontWeight: "bold", fontSize: "13px", letterSpacing: "1px" }}>
              {storeName}
            </div>
            {storeAddress && (
              <div style={{ fontSize: "9px" }}>{storeAddress}</div>
            )}
            {storePhone && (
              <div style={{ fontSize: "9px" }}>Telp: {storePhone}</div>
            )}
          </div>

          <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

          {/* Info transaksi */}
          <div style={{ fontSize: "9px", marginBottom: "4px" }}>
            <div>No: {data.transaction_code}</div>
            <div>{format(new Date(data.created_at), "dd/MM/yyyy HH:mm", { locale: id })}</div>
            <div>Kasir: {data.kasir_name}</div>
            {data.is_member && data.member_name && (
              <div>Member: {data.member_name}</div>
            )}
          </div>

          <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

          {/* Item belanja */}
          <table style={{ width: "100%", fontSize: "9px", borderCollapse: "collapse" }}>
            <tbody>
              {data.cart.map((item, idx) => (
                <tr key={idx}>
                  <td colSpan={2} style={{ paddingBottom: "1px" }}>
                    {item.product.name}
                  </td>
                </tr>
              ))}
              {data.cart.map((item, idx) => (
                <tr key={`price-${idx}`}>
                  <td style={{ paddingLeft: "4px", paddingBottom: "3px", color: "#333" }}>
                    {item.qty} x {formatRupiah(item.product.price_sell)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

          {/* Total & Pembayaran */}
          <table style={{ width: "100%", fontSize: "9px" }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: "bold" }}>TOTAL</td>
                <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "11px" }}>
                  {formatRupiah(data.total_amount)}
                </td>
              </tr>
              {data.bayar_saldo && data.bayar_saldo > 0 && (
                <tr>
                  <td>Saldo Member</td>
                  <td style={{ textAlign: "right" }}>-{formatRupiah(data.bayar_saldo)}</td>
                </tr>
              )}
              <tr>
                <td>Bayar ({METHOD_LABEL[data.payment_method]})</td>
                <td style={{ textAlign: "right" }}>{formatRupiah(data.paid_amount)}</td>
              </tr>
              {data.change_amount > 0 && (
                <tr>
                  <td style={{ fontWeight: "bold" }}>Kembali</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {formatRupiah(data.change_amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

          {/* Footer */}
          <div style={{ textAlign: "center", fontSize: "9px", marginTop: "4px" }}>
            <div>{footerNote}</div>
            <div style={{ marginTop: "8px", fontSize: "8px", color: "#666" }}>
              *** {data.transaction_code} ***
            </div>
          </div>

          {/* Spasi bawah supaya printer tidak motong terlalu dekat */}
          <div style={{ height: "16px" }} />
        </div>
      </div>
    </>
  );
}
