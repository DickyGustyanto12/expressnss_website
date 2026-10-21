import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, judul, kata_kunci, isi_balasan, aktif, created_at, updated_at FROM suggestion_admin ORDER BY id DESC",
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching suggestion admin:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { judul, kata_kunci, isi_balasan, aktif } = body;

    if (!judul?.trim() || !kata_kunci?.trim() || !isi_balasan?.trim()) {
      return NextResponse.json(
        { error: "Judul, kata kunci, dan isi balasan wajib diisi" },
        { status: 400 },
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO suggestion_admin (judul, kata_kunci, isi_balasan, aktif) VALUES (?, ?, ?, ?)",
      [
        judul.trim(),
        kata_kunci.trim(),
        isi_balasan.trim(),
        Number(aktif) === 0 ? 0 : 1,
      ],
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Error creating suggestion admin:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data" },
      { status: 500 },
    );
  }
}
