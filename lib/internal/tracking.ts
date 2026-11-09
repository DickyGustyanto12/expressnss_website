import http from "http";
import https from "https";

const BATAS_WAKTU_MS = 15_000;
const agenTracking = new https.Agent({
  rejectUnauthorized: process.env.TRACKING_TLS_VERIFY === "true",
});

const urlTracking = () =>
  new URL(process.env.TRACKING_API_URL || "https://nsparts.co.id/ksapisvr");

export function mintaTracking(nomorResi: string): Promise<unknown> {
  const url = urlTracking();
  
  // PERBAIKAN UTAMA: Mengubah 'api_tracking' menjadi 'api_webdlp'
  const body = JSON.stringify({
    api_webdlp: [{ Request: "MINTATRACKING", Nobuk: nomorResi }],
  });
  
  const modul = url.protocol === "http:" ? http : https;

  return new Promise((resolve, reject) => {
    const req = modul.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        },
        agent: url.protocol === "https:" ? agenTracking : undefined,
        timeout: BATAS_WAKTU_MS,
        insecureHTTPParser: true,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (!res.statusCode || res.statusCode >= 300) {
            reject(new Error(`Server internal merespons dengan status: ${res.statusCode}`));
            return;
          }
          
          try {
            const dataBersih = data.replace(/[\r\n\t]+/g, " ").trim();
            
            // Cek apakah balasan BUKAN format JSON (misal teks "Maaf...")
            if (!dataBersih.startsWith("{") && !dataBersih.startsWith("[")) {
              console.warn("[TRACKING] Peringatan: Server pusat membalas dengan teks biasa:", dataBersih);
              reject(new Error(`Layanan pusat merespons: ${dataBersih}`));
              return;
            }

            resolve(JSON.parse(dataBersih));
          } catch (err) {
            console.error("[TRACKING] Gagal parse JSON. RAW DATA:", data.substring(0, 500));
            reject(new Error("Respons server tracking rusak."));
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