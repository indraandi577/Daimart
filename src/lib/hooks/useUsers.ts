"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "owner" | "kasir" | "gudang";
  is_active: boolean;
  created_at: string;
}

// Dummy fallback
const DUMMY_USERS: UserProfile[] = [
  { id: "1", name: "Owner DaiMart", email: "owner@daimart.com", role: "owner", is_active: true, created_at: new Date().toISOString() },
  { id: "2", name: "Siti Nurhaliza", email: "siti@daimart.com", role: "kasir", is_active: true, created_at: new Date().toISOString() },
  { id: "3", name: "Budi Santoso", email: "budi@daimart.com", role: "kasir", is_active: true, created_at: new Date().toISOString() },
  { id: "4", name: "Andi Gudang", email: "andi@daimart.com", role: "gudang", is_active: false, created_at: new Date().toISOString() },
];

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>(DUMMY_USERS);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Join profiles dengan auth.users lewat admin API
      // Karena kita tidak punya service_role di client, kita ambil dari profiles
      // dan email dari fungsi RPC khusus (atau gunakan admin endpoint)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, role, is_active, created_at")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) throw new Error("not ready");

      // Email tidak tersimpan di profiles, ambil dari auth via RPC
      // Untuk sekarang tampilkan tanpa email
      const rows: UserProfile[] = data.map((p) => ({
        id: p.id,
        name: p.name,
        email: "—",
        role: p.role,
        is_active: p.is_active,
        created_at: p.created_at,
      }));
      setUsers(rows);
    } catch {
      // Pakai dummy
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const createUser = async (data: {
    name: string;
    email: string;
    password: string;
    role: "kasir" | "gudang";
  }) => {
    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal membuat user");

    toast.success(`User ${data.name} berhasil dibuat`);
    await fetchUsers();
  };

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw new Error(error.message);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        )
      );
      toast.success(!currentStatus ? "User diaktifkan" : "User dinonaktifkan");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const updateProfile = async (userId: string, name: string, role: "owner" | "kasir" | "gudang") => {
    const { error } = await supabase
      .from("profiles")
      .update({ name, role })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    await fetchUsers();
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  };

  return { users, loading, fetchUsers, createUser, toggleActive, updateProfile, changePassword };
}
