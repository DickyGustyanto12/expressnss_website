import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import { hashToken } from "@/lib/internal/live-chat";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, whatsapp } = body;

    if (!nama || !whatsapp) {
      return NextResponse.json(
        { message: "Nama dan nomor WhatsApp wajib diisi." },
        { status: 400 },
      );
    }

    // Membuat token acak mentah untuk sesi customer
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Melakukan hashing token menggunakan helper terpusat
    const tokenHash = hashToken(rawToken);

    // Menyimpan data percakapan baru ke database MySQL
    const [result] = await pool.execute(
      `INSERT INTO live_chat_conversations (customer_name, customer_whatsapp, customer_token_hash, status, created_at, updated_at)
       VALUES (?, ?, ?, 'open', NOW(), NOW())`,
      [nama, whatsapp, tokenHash],
    );

    const conversationId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      conversationId: conversationId,
      token: rawToken,
    });
  } catch (error: any) {
    console.error("Gagal membuat sesi live chat:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
