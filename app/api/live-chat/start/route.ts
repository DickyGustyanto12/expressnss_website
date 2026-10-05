import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { ResultSetHeader } from "mysql2";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, customer_whatsapp } = body;

    if (!customer_name || !customer_whatsapp) {
      return NextResponse.json(
        { error: "Nama dan nomor WhatsApp wajib diisi" },
        { status: 400 },
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO live_chat_conversations (customer_name, customer_whatsapp, public_token_hash, status) VALUES (?, ?, ?, 'open')",
      [customer_name, customer_whatsapp, tokenHash],
    );

    return NextResponse.json(
      {
        success: true,
        conversationId: result.insertId,
        token: rawToken,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error start chat:", error);
    return NextResponse.json(
      { error: "Gagal memulai percakapan" },
      { status: 500 },
    );
  }
}
