import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM hero_banner WHERE is_active = 1 ORDER BY urutan ASC",
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching hero banner:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const judul = formData.get("judul") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const badge_text = formData.get("badge_text") as string;
    const button_text = formData.get("button_text") as string;
    const button_link = formData.get("button_link") as string;
    const urutan = parseInt(formData.get("urutan") as string) || 0;
    const gambarFile = formData.get("gambar") as File;

    let gambar_url = "";

    // Upload gambar jika ada
    if (gambarFile && gambarFile.size > 0) {
      const bytes = await gambarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fs = require("fs");
      const path = require("path");

      const fileName = `hero-${Date.now()}-${gambarFile.name}`;
      const uploadPath = path.join(
        process.cwd(),
        "public/uploads/hero",
        fileName,
      );

      // Pastikan folder ada
      const dir = path.dirname(uploadPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(uploadPath, buffer);
      gambar_url = `/uploads/hero/${fileName}`;
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO hero_banner (judul, deskripsi, gambar_url, badge_text, button_text, button_link, urutan) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        judul,
        deskripsi,
        gambar_url,
        badge_text,
        button_text,
        button_link,
        urutan,
      ],
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Error creating hero banner:", error);
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
    const judul = formData.get("judul") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const badge_text = formData.get("badge_text") as string;
    const button_text = formData.get("button_text") as string;
    const button_link = formData.get("button_link") as string;
    const urutan = parseInt(formData.get("urutan") as string) || 0;
    const gambarFile = formData.get("gambar") as File;

    let gambar_url = "";

    // Upload gambar baru jika ada
    if (gambarFile && gambarFile.size > 0) {
      const bytes = await gambarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fs = require("fs");
      const path = require("path");

      const fileName = `hero-${Date.now()}-${gambarFile.name}`;
      const uploadPath = path.join(
        process.cwd(),
        "public/uploads/hero",
        fileName,
      );

      const dir = path.dirname(uploadPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(uploadPath, buffer);
      gambar_url = `/uploads/hero/${fileName}`;
    } else {
      // Gunakan gambar lama
      gambar_url = formData.get("gambar_lama") as string;
    }

    await pool.query(
      "UPDATE hero_banner SET judul = ?, deskripsi = ?, gambar_url = ?, badge_text = ?, button_text = ?, button_link = ?, urutan = ? WHERE id = ?",
      [
        judul,
        deskripsi,
        gambar_url,
        badge_text,
        button_text,
        button_link,
        urutan,
        id,
      ],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating hero banner:", error);
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

    await pool.query("DELETE FROM hero_banner WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hero banner:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 },
    );
  }
}
