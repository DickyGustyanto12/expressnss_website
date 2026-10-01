import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "admin",
  database: "nss_express",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { berat, asal, tujuan } = body;

    if (!berat || !asal || !tujuan) {
      return NextResponse.json(
        { error: "Berat, Kota Asal, dan Kota Tujuan wajib diisi" },
        { status: 400 },
      );
    }

    const [rows]: any = await pool.execute(
      "SELECT * FROM tarif_ongkir WHERE LOWER(kota_asal) = LOWER(?) AND LOWER(kota_tujuan) = LOWER(?)",
      [asal.trim(), tujuan.trim()],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Tarif untuk rute tersebut tidak ditemukan" },
        { status: 404 },
      );
    }

    const dataTarif = rows[0];
    const beratBarang = Number(berat);

    const totalReguler = (dataTarif.harga_reguler || 15000) * beratBarang;
    const totalNextDay = (dataTarif.harga_nextday || 35000) * beratBarang;

    const hasilRespons = {
      asal: asal,
      tujuan: tujuan,
      berat: beratBarang,
      layanan: [
        {
          nama: "Reguler (REG)",
          estimasi: "2-3 Hari",
          tarif: totalReguler,
        },
        {
          nama: "Next Day (NEXT)",
          estimasi: "1 Hari",
          tarif: totalNextDay,
        },
      ],
    };

    return NextResponse.json(hasilRespons, { status: 200 });
  } catch (error: any) {
    console.error("Database error cek ongkir:", error.message);
    return NextResponse.json(
      {
        error: "Gagal mengambil data tarif dari database",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
