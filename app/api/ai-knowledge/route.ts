import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM ai_knowledge_base ORDER BY urutan ASC, id DESC",
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching knowledge:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kategori, pertanyaan, jawaban, kata_kunci, is_active, urutan } =
      body;

    if (!pertanyaan || !jawaban) {
      return NextResponse.json(
        { error: "Pertanyaan dan jawaban wajib diisi" },
        { status: 400 },
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO ai_knowledge_base (kategori, pertanyaan, jawaban, kata_kunci, is_active, urutan) VALUES (?, ?, ?, ?, ?, ?)",
      [
        kategori || "umum",
        pertanyaan,
        jawaban,
        kata_kunci || "",
        is_active !== undefined ? is_active : 1,
        urutan || 0,
      ],
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Error creating knowledge:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, kategori, pertanyaan, jawaban, kata_kunci, is_active, urutan } =
      body;

    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    await pool.query(
      "UPDATE ai_knowledge_base SET kategori = ?, pertanyaan = ?, jawaban = ?, kata_kunci = ?, is_active = ?, urutan = ? WHERE id = ?",
      [
        kategori || "umum",
        pertanyaan,
        jawaban,
        kata_kunci || "",
        is_active !== undefined ? is_active : 1,
        urutan || 0,
        id,
      ],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating knowledge:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    await pool.query("DELETE FROM ai_knowledge_base WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting knowledge:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 },
    );
  }
}
