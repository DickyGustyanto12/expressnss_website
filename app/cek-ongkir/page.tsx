import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { berat, asal, tujuan } = body;

    if (!berat || !asal || !tujuan) {
      return NextResponse.json(
        { error: "Berat, kota asal, dan kota tujuan wajib diisi!" },
        { status: 400 },
      );
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM tarif_ongkirTujuan WHERE LOWER(asal) LIKE LOWER(?) AND LOWER(tujuan) LIKE LOWER(?)",
      [`%${asal}%`, `%${tujuan}%`],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Tarif pengiriman untuk rute tersebut tidak ditemukan." },
        { status: 404 },
      );
    }

    const beratNum = Number(berat);
    const layanan = rows.map((item) => ({
      nama: item.estimasi,
      estimasi: item.estimasi,
      tarif: Number(item.harga) * beratNum,
    }));

    return NextResponse.json({ layanan }, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
