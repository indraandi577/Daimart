"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Menu,
  X,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import toast from "react-hot-toast";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["owner"],
  },
  {
    label: "Kasir / POS",
    href: "/kasir",
    icon: ShoppingCart,
    roles: ["owner", "kasir"],
  },
  {
    label: "Produk & Stok",
    href: "/produk",
    icon: Package,
    roles: ["owner", "gudang"],
  },
  {
    label: "Laporan",
    href: "/laporan",
    icon: BarChart3,
    roles: ["owner"],
  },
  {
    label: "Kantin",
    href: "/kantin",
    icon: UtensilsCrossed,
    roles: ["owner", "kasir"],
  },
  {
    label: "Pengaturan",
    href: "/pengaturan",
    icon: Settings,
    roles: ["owner"],
  },
];

interface SidebarProps {
  userRole?: string;
}

export default function Sidebar({ userRole: roleProp }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();

  // Gunakan role dari AuthContext jika ada, fallback ke prop
  const userRole = profile?.role ?? roleProp ?? "kasir";
  const userName = profile?.name ?? "User";
  const userInitial = userName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const NavLinks = () => (
    <>
      {filteredNav.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-green-600 text-white shadow-sm shadow-green-200"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-xl shadow-md border border-gray-100"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-50 flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight">DaiMart</p>
              <p className="text-xs text-gray-400">Supermarket POS</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavLinks />
        </nav>

        {/* User & Logout */}
        <div className="px-3 pb-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-400 truncate capitalize">
                {userRole}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              toast.success("Berhasil keluar");
              router.push("/login");
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
