import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

// Aksi per sesi:
// { aksi: "atur-limit", mode: "rupiah" | "token", limit: number | null }  → null = kembali ke default
// { aksi: "reset" }                                                       → nol-kan pemakaian sesi
export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/ai-token-limit/sesi/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const conversationId = Number(id);
    const b = await req.json();

    const [ada] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM live_chat_conversations WHERE id = ?",
      [conversationId],
    );
    if (!conversationId || ada.length === 0) {
      return NextResponse.json(
        { error: "Sesi chat tidak ditemukan" },
        { status: 404 },
      );
    }

    if (b.aksi === "atur-limit") {
      const kolom =
        b.mode === "token" ? "limit_kustom_token" : "limit_kustom_rupiah";
      const limit = b.limit === null || b.limit === "" ? null : Number(b.limit);
      if (limit !== null && !(Number.isFinite(limit) && limit >= 0)) {
        return NextResponse.json(
          { error: "Limit harus angka 0 atau lebih" },
          { status: 400 },
        );
      }
      const nilai =
        limit !== null && b.mode === "token" ? Math.round(limit) : limit;
      await pool.query(
        `INSERT INTO ai_token_usage (conversation_id, ${kolom}) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE ${kolom} = VALUES(${kolom}), limit_tercapai_at = NULL`,
        [conversationId, nilai],
      );
      return NextResponse.json({ success: true });
    }

    if (b.aksi === "reset") {
      await pool.query(
        `UPDATE ai_token_usage
         SET token_input = 0, token_output = 0, biaya_rp = 0, jumlah_request = 0,
             limit_tercapai_at = NULL
         WHERE conversation_id = ?`,
        [conversationId],
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error) {
    console.error("Error aksi sesi token AI:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui sesi" },
      { status: 500 },
    );
  }
}
