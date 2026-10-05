import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const after = searchParams.get("after");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId wajib diisi" },
        { status: 400 },
      );
    }

    let query = `
      SELECT id, conversation_id, client_message_id, sender_type, sender_admin_id, message, created_at 
      FROM live_chat_messages 
      WHERE conversation_id = ?
    `;
    const params: any[] = [conversationId];

    if (after) {
      query += " AND id > ?";
      params.push(after);
    }

    query += " ORDER BY id ASC";

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetch messages:", error);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat pesan" },
      { status: 500 },
    );
  }
}
