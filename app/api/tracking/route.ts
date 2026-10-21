import { NextResponse } from "next/server";
import http from "http";
import https from "https";

// Server tracking internal (sertifikat self-signed). Pengecualian verifikasi TLS
// hanya berlaku untuk request ke server ini, bukan untuk seluruh aplikasi.
const TRACKING_API_URL =
  process.env.TRACKING_API_URL || "https://172.16.1.57/ksapisvr";
const agenTracking = new https.Agent({
  rejectUnauthorized: process.env.TRACKING_TLS_VERIFY === "true",
});
const BATAS_WAKTU_MS = 15_000;

function kirimKeServerTracking(payload: unknown): Promise<unknown> {
  const url = new URL(TRACKING_API_URL);
  const body = JSON.stringify(payload);
  const modul = url.protocol === "http:" ? http : https;

  return new Promise((resolve, reject) => {
    const req = modul.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        agent: url.protocol === "https:" ? agenTracking : undefined,
        timeout: BATAS_WAKTU_MS,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(
              new Error(
                `Server internal merespons dengan status: ${res.statusCode}`,
              ),
            );
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Respons server tracking bukan JSON"));
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("Timeout server tracking")));
    req.on("error", reject);
    req.end(body);
  });
}

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

    const data = await kirimKeServerTracking({
      api_tracking: [
        {
          Request: "MINTATRACKING",
          Nobuk: keyword,
        },
      ],
    });
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
