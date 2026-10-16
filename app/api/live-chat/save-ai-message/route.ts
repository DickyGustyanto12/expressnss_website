import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { ResultSetHeader } from "mysql2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message, senderType } = body;

    if (!conversationId || !message || !senderType) {
      return NextResponse.json(
        { error: "conversationId, message, dan senderType wajib diisi" },
        { status: 400 },
      );
    }

    const clientMessageId = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO live_chat_messages 
       (conversation_id, client_message_id, sender_type, sender_admin_id, message, is_read, created_at) 
       VALUES (?, ?, ?, NULL, ?, 0, NOW())`,
      [parseInt(conversationId), clientMessageId, senderType, message],
    );

    return NextResponse.json({
      success: true,
      messageId: result.insertId,
      clientMessageId,
    });
  } catch (error) {
    console.error("Error saving AI message:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pesan AI" },
      { status: 500 },
    );
  }
}
