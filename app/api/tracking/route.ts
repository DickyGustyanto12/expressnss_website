import { NextResponse } from "next/server";

// Mengabaikan validasi sertifikat SSL lokal (self-signed) untuk server internal
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

    // Mengirim permintaan POST ke server internal NSS Express
    const apiResponse = await fetch("https://172.16.1.57/ksapisvr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_tracking: [
          {
            Request: "MINTATRACKING",
            Nobuk: keyword,
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      throw new Error(
        `Server internal merespons dengan status: ${apiResponse.status}`,
      );
    }

    const data = await apiResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    return NextResponse.json(
      {
        error: "Gagal terhubung ke server pelacakan internal.",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
