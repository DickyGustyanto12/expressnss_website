import { NextResponse } from "next/server";
import { mintaTracking } from "@/lib/internal/tracking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keyword = body?.keyword;

    if (!keyword) {
      return NextResponse.json(
        { error: "Nomor resi wajib diisi" },
        { status: 400 },
      );
    }

    const data = await mintaTracking(String(keyword).trim());
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Detail hanya di log server
    console.error(
      "Proxy error:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Gagal terhubung ke server pelacakan internal." },
      { status: 500 },
    );
  }
}
