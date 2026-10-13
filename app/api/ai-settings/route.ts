import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM ai_settings LIMIT 1",
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Pengaturan belum diatur" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error fetching AI settings:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ai_name,
      custom_greeting,
      persona,
      limitations,
      quick_questions,
      instructions,
    } = body;

    // Validasi minimal
    if (!persona || !limitations) {
      return NextResponse.json(
        { error: "Persona dan Batasan wajib diisi" },
        { status: 400 },
      );
    }

    // Cek apakah data sudah ada
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM ai_settings LIMIT 1",
    );

    if (existing.length > 0) {
      // Update data yang sudah ada
      await pool.query<ResultSetHeader>(
        `UPDATE ai_settings SET 
          ai_name = ?, 
          custom_greeting = ?, 
          persona = ?, 
          limitations = ?,
          quick_questions = COALESCE(?, quick_questions),
          instructions = COALESCE(?, instructions)
         WHERE id = ?`,
        [
          ai_name || "Customer Service NSS Express",
          custom_greeting || "",
          persona,
          limitations,
          quick_questions || null,
          instructions || null,
          existing[0].id,
        ],
      );
    } else {
      // Insert data baru
      await pool.query<ResultSetHeader>(
        `INSERT INTO ai_settings 
          (ai_name, custom_greeting, persona, limitations, quick_questions, instructions) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ai_name || "Customer Service NSS Express",
          custom_greeting || "",
          persona,
          limitations,
          quick_questions || "[]",
          instructions || "",
        ],
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating AI settings:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data" },
      { status: 500 },
    );
  }
}
