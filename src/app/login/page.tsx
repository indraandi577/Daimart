import LoginForm from "@/components/auth/LoginForm";
import { Store } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
            <Store className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DaiMart</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sistem Manajemen Supermarket
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-6 shadow-xl shadow-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            Masuk ke Akun
          </h2>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 DaiMart · Powered by Next.js & Supabase
        </p>
      </div>
    </div>
  );
}
