import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM info_express ORDER BY tanggal DESC, id DESC",
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching info express:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const kategori = formData.get("kategori") as string;
    const judul = formData.get("judul") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const tanggal = formData.get("tanggal") as string;

    const is_active = formData.get("is_active") === "1" ? 1 : 0;
    const gambarFile = formData.get("gambar") as File;

    if (!kategori || !judul || !deskripsi || !tanggal || !gambarFile) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 },
      );
    }

    const bytes = await gambarFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `info-${Date.now()}-${gambarFile.name.replace(/\s+/g, "-")}`;
    const uploadDir = path.join(process.cwd(), "public/uploads/info");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    const gambar_url = `/uploads/info/${fileName}`;

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO info_express (kategori, judul, deskripsi, gambar_url, tanggal, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      [kategori, judul, deskripsi, gambar_url, tanggal, is_active],
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Error creating info express:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const id = parseInt(formData.get("id") as string);
    const kategori = formData.get("kategori") as string;
    const judul = formData.get("judul") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const tanggal = formData.get("tanggal") as string;

    const is_active = formData.get("is_active") === "1" ? 1 : 0;
    const gambarFile = formData.get("gambar") as File;
    const gambar_lama = formData.get("gambar_lama") as string;

    let gambar_url = gambar_lama;

    if (gambarFile && gambarFile.size > 0) {
      const bytes = await gambarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `info-${Date.now()}-${gambarFile.name.replace(/\s+/g, "-")}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/info");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      gambar_url = `/uploads/info/${fileName}`;
    }

    await pool.query(
      "UPDATE info_express SET kategori = ?, judul = ?, deskripsi = ?, gambar_url = ?, tanggal = ?, is_active = ? WHERE id = ?",
      [kategori, judul, deskripsi, gambar_url, tanggal, is_active, id],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating info express:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    await pool.query("DELETE FROM info_express WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting info express:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 },
    );
  }
}
