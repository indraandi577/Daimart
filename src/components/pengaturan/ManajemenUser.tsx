"use client";

import { useEffect, useState } from "react";
import { Plus, UserCheck, UserX, Edit2, Shield } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useUsers, type UserProfile } from "@/lib/hooks/useUsers";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";

const ROLE_CONFIG = {
  owner:  { label: "Owner",  variant: "info"    as const, icon: "👑" },
  kasir:  { label: "Kasir",  variant: "success" as const, icon: "🛒" },
  gudang: { label: "Gudang", variant: "warning" as const, icon: "📦" },
};

export default function ManajemenUser() {
  const { users, loading, fetchUsers, createUser, toggleActive, updateProfile } = useUsers();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Manajemen User</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Buat & kelola akun kasir dan staf gudang
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} size="md">
            <Plus className="w-4 h-4" />
            Tambah User
          </Button>
        </div>

        {/* Stat mini */}
        <div className="grid grid-cols-3 gap-3">
          {(["owner", "kasir", "gudang"] as const).map((role) => {
            const count = users.filter((u) => u.role === role && u.is_active).length;
            const cfg = ROLE_CONFIG[role];
            return (
              <div key={role} className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl">{cfg.icon}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{count}</p>
                <p className="text-xs text-gray-500">{cfg.label} Aktif</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel User */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Daftar User ({users.length})
          </p>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((user) => {
              const cfg = ROLE_CONFIG[user.role];
              return (
                <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                    user.is_active ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    {cfg.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${user.is_active ? "text-gray-800" : "text-gray-400"}`}>
                        {user.name}
                      </p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      {!user.is_active && (
                        <Badge variant="default">Nonaktif</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {user.email !== "—" ? user.email : "—"} · Dibuat{" "}
                      {format(new Date(user.created_at), "dd MMM yyyy", { locale: id })}
                    </p>
                  </div>

                  {/* Aksi */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.role !== "owner" && (
                      <>
                        <button
                          onClick={() => setEditUser(user)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(user.id, user.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_active
                              ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                          }`}
                          title={user.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {user.is_active
                            ? <UserX className="w-4 h-4" />
                            : <UserCheck className="w-4 h-4" />
                          }
                        </button>
                      </>
                    )}
                    {user.role === "owner" && (
                      <Shield className="w-4 h-4 text-gray-300" aria-label="Owner tidak bisa diubah" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info role */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hak Akses per Role</h3>
        <div className="space-y-2 text-sm">
          {[
            { role: "👑 Owner", access: "Akses semua halaman: Dashboard, Kasir, Produk, Laporan, Pengaturan" },
            { role: "🛒 Kasir", access: "Hanya akses halaman Kasir / POS" },
            { role: "📦 Gudang", access: "Hanya akses halaman Produk & Stok" },
          ].map((item) => (
            <div key={item.role} className="flex gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="font-semibold text-gray-700 w-24 flex-shrink-0">{item.role}</span>
              <span className="text-gray-500">{item.access}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tambah User */}
      {addOpen && (
        <AddUserModal
          onClose={() => setAddOpen(false)}
          onSubmit={async (data) => {
            try {
              await createUser(data);
              setAddOpen(false);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
      )}

      {/* Modal Edit User */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSubmit={async (name, role) => {
            try {
              await updateProfile(editUser.id, name, role);
              toast.success("User berhasil diupdate");
              setEditUser(null);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Modal Tambah User ────────────────────────────────────────
function AddUserModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password: string; role: "kasir" | "gudang" }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "kasir" as "kasir" | "gudang" });
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title="Tambah User Baru" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Nama Lengkap</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required placeholder="Contoh: Siti Nurhaliza"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required placeholder="kasir@daimart.com"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Password</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required placeholder="Min. 6 karakter"
              className="input-base pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              {showPass ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
        </div>

        <div>
          <label className="label-base">Role / Jabatan</label>
          <div className="grid grid-cols-2 gap-3">
            {(["kasir", "gudang"] as const).map((role) => {
              const cfg = ROLE_CONFIG[role];
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ ...form, role })}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    form.role === role
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{cfg.label}</p>
                    <p className="text-xs text-gray-400">
                      {role === "kasir" ? "Akses POS" : "Akses Stok"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
          ℹ️ User akan langsung bisa login dengan email dan password ini.
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" loading={saving} className="flex-1">Buat User</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Edit User ──────────────────────────────────────────
function EditUserModal({
  user,
  onClose,
  onSubmit,
}: {
  user: UserProfile;
  onClose: () => void;
  onSubmit: (name: string, role: "owner" | "kasir" | "gudang") => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(name, role);
    setSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit User" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Nama Lengkap</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Role</label>
          <div className="grid grid-cols-2 gap-3">
            {(["kasir", "gudang"] as const).map((r) => {
              const cfg = ROLE_CONFIG[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    role === r
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{cfg.icon}</span>
                  <p className="font-semibold text-sm text-gray-800">{cfg.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" loading={saving} className="flex-1">Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}
