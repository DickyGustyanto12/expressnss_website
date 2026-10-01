import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "admin",
  database: "nss_express",
});

export async function GET() {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM tarif_ongkir ORDER BY id DESC",
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kota_asal, kota_tujuan, harga_reguler, harga_nextday } = body;

    if (!kota_asal || !kota_tujuan || !harga_reguler || !harga_nextday) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi" },
        { status: 400 },
      );
    }

    await pool.execute(
      "INSERT INTO tarif_ongkir (kota_asal, kota_tujuan, harga_reguler, harga_nextday) VALUES (?, ?, ?, ?)",
      [kota_asal.trim(), kota_tujuan.trim(), harga_reguler, harga_nextday],
    );

    return NextResponse.json(
      { message: "Data tarif berhasil ditambahkan" },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, kota_asal, kota_tujuan, harga_reguler, harga_nextday } = body;

    if (!id || !kota_asal || !kota_tujuan || !harga_reguler || !harga_nextday) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      );
    }

    await pool.execute(
      "UPDATE tarif_ongkir SET kota_asal = ?, kota_tujuan = ?, harga_reguler = ?, harga_nextday = ? WHERE id = ?",
      [kota_asal.trim(), kota_tujuan.trim(), harga_reguler, harga_nextday, id],
    );

    return NextResponse.json(
      { message: "Data tarif berhasil diperbarui" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID tidak ditemukan" },
        { status: 400 },
      );
    }

    await pool.execute("DELETE FROM tarif_ongkir WHERE id = ?", [id]);

    return NextResponse.json(
      { message: "Data tarif berhasil dihapus" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
