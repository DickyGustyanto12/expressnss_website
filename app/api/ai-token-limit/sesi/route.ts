import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

const MAKS_SESI = 300;

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.customer_name, c.customer_whatsapp, c.status, c.created_at,
              COALESCE(u.token_input, 0) AS token_input,
              COALESCE(u.token_output, 0) AS token_output,
              COALESCE(u.biaya_rp, 0) AS biaya_rp,
              COALESCE(u.jumlah_request, 0) AS jumlah_request,
              u.limit_kustom_rupiah, u.limit_kustom_token,
              u.limit_tercapai_at, u.updated_at AS terakhir_dipakai
       FROM live_chat_conversations c
       LEFT JOIN ai_token_usage u ON u.conversation_id = c.id
       ORDER BY COALESCE(u.updated_at, c.created_at) DESC
       LIMIT ?`,
      [MAKS_SESI],
    );

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        nama: r.customer_name,
        whatsapp: r.customer_whatsapp,
        status: r.status,
        dibuat: r.created_at,
        tokenInput: Number(r.token_input),
        tokenOutput: Number(r.token_output),
        biaya: Number(r.biaya_rp),
        request: Number(r.jumlah_request),
        limitKustomRupiah:
          r.limit_kustom_rupiah === null ? null : Number(r.limit_kustom_rupiah),
        limitKustomToken:
          r.limit_kustom_token === null ? null : Number(r.limit_kustom_token),
        limitTercapaiAt: r.limit_tercapai_at,
        terakhirDipakai: r.terakhir_dipakai,
      })),
    );
  } catch (error) {
    console.error("Error daftar sesi token AI:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar sesi" },
      { status: 500 },
    );
  }
}
