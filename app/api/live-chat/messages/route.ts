import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { message: "Parameter conversationId wajib disertakan." },
        { status: 400 },
      );
    }

    const [rows] = await pool.execute(
      `SELECT id, conversation_id, sender_type, message, created_at 
       FROM live_chat_messages 
       WHERE conversation_id = ? 
       ORDER BY created_at ASC`,
      [conversationId],
    );

    return NextResponse.json({
      success: true,
      messages: rows,
    });
  } catch (error: any) {
    console.error("Gagal mengambil riwayat pesan:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
