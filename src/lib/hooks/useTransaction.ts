"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/types";
import toast from "react-hot-toast";

export function useTransaction() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const generateCode = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const time = now.getTime().toString().slice(-5);
    return `TRX-${date}-${time}`;
  };

  const submitTransaction = async ({
    cart,
    totalAmount,
    paidAmount,
    changeAmount,
    paymentMethod,
    kasirId,
  }: {
    cart: CartItem[];
    totalAmount: number;
    paidAmount: number;
    changeAmount: number;
    paymentMethod: "cash" | "qris" | "debit";
    kasirId: string;
  }) => {
    if (cart.length === 0) throw new Error("Keranjang kosong");
    setLoading(true);

    try {
      // 1. Buat transaksi utama
      const { data: transaction, error: trxError } = await supabase
        .from("transactions")
        .insert({
          transaction_code: generateCode(),
          kasir_id: kasirId,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          change_amount: changeAmount,
          payment_method: paymentMethod,
          status: "completed",
        })
        .select()
        .single();

      if (trxError) throw new Error(trxError.message);

      // 2. Insert semua item (trigger DB akan kurangi stok otomatis)
      const items = cart.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        product_name: item.product.name,
        price_sell: item.product.price_sell,
        qty: item.qty,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(items);

      if (itemsError) throw new Error(itemsError.message);

      toast.success(`Transaksi ${transaction.transaction_code} berhasil!`);
      return transaction;
    } finally {
      setLoading(false);
    }
  };

  return { submitTransaction, loading };
}
