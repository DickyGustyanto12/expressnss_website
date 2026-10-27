import { NextResponse } from "next/server";
import { mintaTracking } from "@/lib/internal/tracking";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keyword = String(body?.keyword || "").trim();
    const recaptchaToken = body?.recaptchaToken || null;

    // 1. Verifikasi reCAPTCHA
    const lolos = await verifyRecaptcha(recaptchaToken);
    if (!lolos) {
      return NextResponse.json(
        { error: "Verifikasi reCAPTCHA gagal. Silakan centang ulang." },
        { status: 403 },
      );
    }

    // 2. Validasi resi
    if (!keyword) {
      return NextResponse.json(
        { error: "Nomor resi wajib diisi" },
        { status: 400 },
      );
    }

    // 3. Panggil server pelacakan internal
    const data = await mintaTracking(keyword);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Bongkar pesan error asli saat development agar mudah debug
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[TRACKING] ERROR:", msg);

    const detail = process.env.NODE_ENV !== "production" ? ` → ${msg}` : "";

    return NextResponse.json(
      { error: `Server pelacakan gagal merespons${detail}` },
      { status: 502 },
    );
  }
}
