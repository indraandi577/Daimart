"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";

// Kategori default — selalu tersedia sebagai fallback
const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Sembako", icon: "🌾" },
  { id: "cat-2", name: "Minuman", icon: "🥤" },
  { id: "cat-3", name: "Snack", icon: "🍿" },
  { id: "cat-4", name: "Obat", icon: "💊" },
  { id: "cat-5", name: "Perawatan", icon: "🧴" },
  { id: "cat-6", name: "Lainnya", icon: "🏪" },
];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("sort_order");

        // Kalau berhasil dan ada data → pakai dari Supabase
        if (!error && data && data.length > 0) {
          setCategories(data);
        }
        // Kalau gagal atau kosong → tetap pakai DEFAULT_CATEGORIES (sudah di-set di useState)
      } catch {
        // Tetap pakai default
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { categories, loading };
}
