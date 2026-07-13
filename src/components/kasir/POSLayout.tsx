"use client";

import { useState, useCallback } from "react";
import ProductSearch from "./ProductSearch";
import CartTable from "./CartTable";
import PaymentPanel from "./PaymentPanel";
import { CartItem, Product } from "@/types";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function POSLayout() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { profile } = useAuth();

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                qty: item.qty + 1,
                subtotal: (item.qty + 1) * item.product.price_sell,
              }
            : item
        );
      }
      return [...prev, { product, qty: 1, subtotal: product.price_sell }];
    });
  }, []);

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          return { ...item, qty: newQty, subtotal: newQty * item.product.price_sell };
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {/* Kiri: Pencarian & Kategori (25%) */}
      <div className="w-[25%] flex-shrink-0">
        <ProductSearch onAddToCart={addToCart} />
      </div>

      {/* Tengah: Keranjang (45%) */}
      <div className="flex-1">
        <CartTable cart={cart} onUpdateQty={updateQty} onRemove={removeItem} />
      </div>

      {/* Kanan: Panel Bayar (30%) */}
      <div className="w-[28%] flex-shrink-0">
        <PaymentPanel
          grandTotal={grandTotal}
          cart={cart}
          kasirId={profile?.id ?? ""}
          onSuccess={clearCart}
        />
      </div>
    </div>
  );
}
