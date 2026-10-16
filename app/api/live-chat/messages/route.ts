import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const limit = searchParams.get("limit");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId wajib diisi" },
        { status: 400 },
      );
    }

    let query =
      "SELECT * FROM live_chat_messages WHERE conversation_id = ? ORDER BY created_at ASC";
    const params: any[] = [parseInt(conversationId)];

    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit));
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Gagal mengambil pesan" },
      { status: 500 },
    );
  }
}
