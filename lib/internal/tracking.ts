import http from "http";
import https from "https";

const BATAS_WAKTU_MS = 15_000;
const agenTracking = new https.Agent({
  rejectUnauthorized: process.env.TRACKING_TLS_VERIFY === "true",
});

const urlTracking = () =>
  new URL(process.env.TRACKING_API_URL || "https://172.16.1.57/ksapisvr");

export function mintaTracking(nomorResi: string): Promise<unknown> {
  const url = urlTracking();
  const body = JSON.stringify({
    api_tracking: [{ Request: "MINTATRACKING", Nobuk: nomorResi }],
  });
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

export interface RiwayatTracking {
  tanggal: string;
  jam: string;
  keterangan: string;
  nama: string;
}

export type HasilLacak =
  | { status: "ok"; resi: string; riwayat: RiwayatTracking[] }
  | { status: "tidak-ditemukan"; resi: string }
  | { status: "gagal"; resi: string };

export async function lacakResi(nomorResi: string): Promise<HasilLacak> {
  const resi = nomorResi.trim();
  try {
    const data = (await mintaTracking(resi)) as {
      Detail?: Record<string, unknown>[];
    };
    const detail = Array.isArray(data?.Detail) ? data.Detail : [];
    if (detail.length === 0) return { status: "tidak-ditemukan", resi };

    return {
      status: "ok",
      resi,
      riwayat: detail.map((item) => ({
        tanggal: String(item.Tanggal ?? ""),
        jam: String(item.Jam ?? ""),
        keterangan: String(item.Keterangan ?? ""),
        nama: String(item.Nama ?? ""),
      })),
    };
  } catch (error) {
    console.error(
      "[TRACKING] Gagal:",
      error instanceof Error ? error.message : error,
    );
    return { status: "gagal", resi };
  }
}
