"use client";

import { useState } from "react";
import { Users, Store, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ManajemenUser from "./ManajemenUser";
import ProfilToko from "./ProfilToko";
import AkunSaya from "./AkunSaya";

type Tab = "users" | "toko" | "akun";

const TABS = [
  { id: "users" as Tab, label: "Manajemen User", icon: Users, desc: "Kelola akun kasir & gudang" },
  { id: "toko"  as Tab, label: "Profil Toko",    icon: Store, desc: "Nama toko & info struk" },
  { id: "akun"  as Tab, label: "Akun Saya",       icon: User,  desc: "Password & profil pribadi" },
];

export default function PengaturanClient() {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola akun, toko, dan preferensi aplikasi</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar Tab */}
        <div className="lg:w-60 flex-shrink-0">
          <nav className="card p-2 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                  activeTab === tab.id
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{tab.label}</p>
                  <p className={cn(
                    "text-xs mt-0.5 truncate",
                    activeTab === tab.id ? "text-green-100" : "text-gray-400"
                  )}>
                    {tab.desc}
                  </p>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 flex-shrink-0",
                  activeTab === tab.id ? "text-green-200" : "text-gray-300"
                )} />
              </button>
            ))}
          </nav>
        </div>

        {/* Konten Tab */}
        <div className="flex-1 min-w-0">
          {activeTab === "users" && <ManajemenUser />}
          {activeTab === "toko"  && <ProfilToko />}
          {activeTab === "akun"  && <AkunSaya />}
        </div>
      </div>
    </div>
  );
}
