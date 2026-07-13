"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUsers } from "@/lib/hooks/useUsers";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";

const ROLE_CONFIG = {
  owner:  { label: "Owner",  variant: "info"    as const },
  kasir:  { label: "Kasir",  variant: "success" as const },
  gudang: { label: "Gudang", variant: "warning" as const },
};

export default function AkunSaya() {
  const { profile } = useAuth();
  const { changePassword } = useUsers();

  const [name, setName] = useState(profile?.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    await new Promise((r) => setTimeout(r, 500)); // simulasi
    toast.success("Profil diperbarui");
    setSavingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    setSavingPass(true);
    try {
      await changePassword(newPass);
      toast.success("Password berhasil diubah");
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (err) {
      toast.error((err as Error).message || "Gagal ubah password");
    } finally {
      setSavingPass(false);
    }
  };

  const roleCfg = ROLE_CONFIG[profile?.role ?? "kasir"];

  return (
    <div className="space-y-5">
      {/* Info Akun */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-green-700">
            {(profile?.name ?? "U").split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900">{profile?.name ?? "User"}</p>
              <Badge variant={roleCfg.variant}>{roleCfg.label}</Badge>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">Akun aktif</p>
          </div>
        </div>

        {/* Form Edit Nama */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            Info Pribadi
          </h3>
          <div>
            <label className="label-base">Nama Tampilan</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-base"
            />
          </div>
          <div>
            <label className="label-base">Role</label>
            <input
              value={roleCfg.label}
              disabled
              className="input-base bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Role hanya bisa diubah oleh Owner</p>
          </div>
          <Button type="submit" loading={savingProfile} size="md">
            Simpan Profil
          </Button>
        </form>
      </div>

      {/* Ganti Password */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-gray-400" />
          Ganti Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label-base">Password Lama</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                required
                placeholder="••••••••"
                className="input-base pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label-base">Password Baru</label>
            <input
              type={showPass ? "text" : "password"}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              placeholder="Min. 6 karakter"
              className="input-base"
            />
          </div>

          <div>
            <label className="label-base">Konfirmasi Password Baru</label>
            <input
              type={showPass ? "text" : "password"}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              required
              placeholder="Ulangi password baru"
              className={`input-base ${confirmPass && confirmPass !== newPass ? "border-red-300 focus:ring-red-400" : ""}`}
            />
            {confirmPass && confirmPass !== newPass && (
              <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
            )}
          </div>

          <Button type="submit" loading={savingPass} size="md" className="w-full">
            Ubah Password
          </Button>
        </form>
      </div>
    </div>
  );
}
