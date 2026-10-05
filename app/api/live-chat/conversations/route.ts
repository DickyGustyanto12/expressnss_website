import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, customer_name, customer_whatsapp, status, assigned_admin_id, created_at 
       FROM live_chat_conversations 
       ORDER BY created_at DESC`,
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar percakapan" },
      { status: 500 },
    );
  }
}
