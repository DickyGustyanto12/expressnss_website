import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM tarif_ongkir ORDER BY id DESC",
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
    const { kota_asal, kota_tujuan, layanan, berat, harga_ongkir } = body;

    if (
      !kota_asal ||
      !kota_tujuan ||
      !layanan ||
      berat === undefined ||
      !harga_ongkir
    ) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi!" },
        { status: 400 },
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO tarif_ongkir (kota_asal, kota_tujuan, layanan, berat, harga_ongkir) VALUES (?, ?, ?, ?, ?)",
      [kota_asal, kota_tujuan, layanan, berat, harga_ongkir],
    );

    return NextResponse.json(
      { message: "Data tarif berhasil ditambahkan", id: result.insertId },
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
    const { id, kota_asal, kota_tujuan, layanan, berat, harga_ongkir } = body;

    if (
      !id ||
      !kota_asal ||
      !kota_tujuan ||
      !layanan ||
      berat === undefined ||
      !harga_ongkir
    ) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi!" },
        { status: 400 },
      );
    }

    await pool.execute(
      "UPDATE tarif_ongkir SET kota_asal = ?, kota_tujuan = ?, layanan = ?, berat = ?, harga_ongkir = ? WHERE id = ?",
      [kota_asal, kota_tujuan, layanan, berat, harga_ongkir, id],
    );

    return NextResponse.json(
      { message: "Data tarif berhasil diperbarui" },
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
        { error: "ID tarif diperlukan" },
        { status: 400 },
      );
    }

    await pool.execute("DELETE FROM tarif_ongkir WHERE id = ?", [id]);

    return NextResponse.json(
      { message: "Data tarif berhasil dihapus" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
