import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Route ini pakai service_role key — hanya bisa diakses dari server
// JANGAN expose service_role ke client/browser

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validasi input
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }
    if (!["kasir", "gudang"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    // Gunakan service_role untuk admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Buat user di Supabase Auth (langsung confirmed, tanpa email verifikasi)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // langsung aktif, tidak perlu verifikasi email
      user_metadata: { name, role },
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    // Update profile (trigger sudah buat, tapi pastikan name & role benar)
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        name,
        role,
        is_active: true,
      });

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: { id: authData.user.id, email, name, role },
    });

  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
