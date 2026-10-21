import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

// Health check untuk Docker Monitor / monitoring internal.
// Sehat = server merespons DAN database bisa di-query (semua konten & API
// website bergantung pada MySQL). Tanpa autentikasi, tanpa detail error.

const BATAS_WAKTU_MS = 3000;

async function cekDatabase(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const habisWaktu = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Health check database timeout")),
      BATAS_WAKTU_MS,
    );
  });

  try {
    const [rows] = await Promise.race([
      pool.query<RowDataPacket[]>({
        sql: "SELECT 1 AS ok",
        timeout: BATAS_WAKTU_MS,
      }),
      habisWaktu,
    ]);
    return Number(rows[0]?.ok) === 1;
  } finally {
    clearTimeout(timer);
  }
}

const respons = (status: "ok" | "error", httpStatus: 200 | 503) =>
  NextResponse.json(
    { status, timestamp: new Date().toISOString() },
    {
      status: httpStatus,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );

export async function GET() {
  try {
    if (await cekDatabase()) return respons("ok", 200);
    console.error("[HEALTH] Database tidak mengembalikan hasil yang valid");
  } catch (error) {
    // Detail hanya di log server, tidak pernah dikirim ke client
    console.error(
      "[HEALTH] Pemeriksaan gagal:",
      error instanceof Error ? error.message : error,
    );
  }
  return respons("error", 503);
}
