import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM banners ORDER BY urutan ASC",
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urutan, judul, deskripsi, gambar_url, status } = body;

    if (!judul) {
      return NextResponse.json(
        { error: "Judul banner wajib diisi!" },
        { status: 400 },
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO banners (urutan, judul, deskripsi, gambar_url, status) VALUES (?, ?, ?, ?, ?)",
      [
        urutan || 0,
        judul,
        deskripsi || "",
        gambar_url || "",
        status || "aktif",
      ],
    );

    return NextResponse.json(
      { message: "Banner berhasil ditambahkan", id: result.insertId },
      { status: 201 },
    );
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, urutan, judul, deskripsi, gambar_url, status } = body;

    if (!id || !judul) {
      return NextResponse.json(
        { error: "ID dan Judul banner wajib diisi!" },
        { status: 400 },
      );
    }

    await pool.execute(
      "UPDATE banners SET urutan = ?, judul = ?, deskripsi = ?, gambar_url = ?, status = ? WHERE id = ?",
      [
        urutan || 0,
        judul,
        deskripsi || "",
        gambar_url || "",
        status || "aktif",
        id,
      ],
    );

    return NextResponse.json(
      { message: "Banner berhasil diperbarui" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID banner diperlukan" },
        { status: 400 },
      );
    }

    await pool.execute("DELETE FROM banners WHERE id = ?", [id]);

    return NextResponse.json(
      { message: "Banner berhasil dihapus" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
