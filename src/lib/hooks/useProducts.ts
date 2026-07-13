"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";

// Dummy data fallback — kosong untuk production
const DUMMY_PRODUCTS: Product[] = [];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(DUMMY_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, icon, color)
        `)
        .eq("is_active", true)
        .order("name");

      // Kalau berhasil dan ada data → pakai dari Supabase
      if (!error && data && data.length > 0) {
        setProducts(data);
      }
      // Kalau gagal / kosong → tetap pakai DUMMY_PRODUCTS
    } catch {
      // Tetap pakai dummy
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (data: Omit<Product, "id" | "created_at" | "updated_at" | "category">) => {
    const { data: created, error } = await supabase
      .from("products")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    await fetchProducts();
    return created;
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { category, created_at, updated_at, ...updateData } = data as Product;
    const { error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id);

    if (error) throw new Error(error.message);
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw new Error(error.message);
    await fetchProducts();
  };

  return { products, loading, refetch: fetchProducts, addProduct, updateProduct, deleteProduct };
}
