import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";
import { cariKotaMirip, saranKota } from "@/lib/pencocokan-kota";

async function ambilDaftarKota() {
  const [asalRows] = await pool.query<RowDataPacket[]>(
    "SELECT DISTINCT kota_asal FROM tarif_ongkir ORDER BY kota_asal ASC",
  );
  const [tujuanRows] = await pool.query<RowDataPacket[]>(
    "SELECT DISTINCT kota_tujuan FROM tarif_ongkir ORDER BY kota_tujuan ASC",
  );
  return {
    asal: asalRows.map((r) => String(r.kota_asal)),
    tujuan: tujuanRows.map((r) => String(r.kota_tujuan)),
  };
}

// Daftar kota yang tersedia (untuk saran saat mengetik)
export async function GET() {
  try {
    return NextResponse.json(await ambilDaftarKota(), { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const beratNum = Number(berat);
    if (!(beratNum > 0)) {
      return NextResponse.json(
        { error: "Berat barang harus lebih dari 0." },
        { status: 400 },
      );
    }

    // Cocokkan nama kota secara toleran (tidak harus sama persis)
    const daftarKota = await ambilDaftarKota();
    const asalCocok = cariKotaMirip(String(asal), daftarKota.asal, 3);
    const tujuanCocok = cariKotaMirip(String(tujuan), daftarKota.tujuan, 5);

    if (asalCocok.length === 0) {
      const saran = saranKota(String(asal), daftarKota.asal, 3);
      return NextResponse.json(
        {
          error: `Kota asal "${asal}" tidak ditemukan.${
            saran.length
              ? ` Mungkin maksud Anda: ${saran.join(", ")}.`
              : ` Kota asal yang tersedia: ${daftarKota.asal.slice(0, 5).join(", ")}.`
          }`,
        },
        { status: 404 },
      );
    }

    if (tujuanCocok.length === 0) {
      const saran = saranKota(String(tujuan), daftarKota.tujuan, 3);
      return NextResponse.json(
        {
          error: `Kota tujuan "${tujuan}" tidak ditemukan.${
            saran.length ? ` Mungkin maksud Anda: ${saran.join(", ")}.` : ""
          }`,
        },
        { status: 404 },
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tarif_ongkir
       WHERE kota_asal IN (?) AND kota_tujuan IN (?)
       ORDER BY kota_asal ASC, kota_tujuan ASC, layanan DESC`,
      [asalCocok.map((k) => k.nama), tujuanCocok.map((k) => k.nama)],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: `Tarif pengiriman dari ${asalCocok[0].nama} ke ${tujuanCocok[0].nama} belum tersedia.`,
        },
        { status: 404 },
      );
    }

    const layanan = rows.map((item) => ({
      nama: item.layanan,
      estimasi: item.layanan === "REGULER" ? "3-5 Hari" : "1-2 Hari",
      tarif: Number(item.harga_ongkir) * beratNum,
      kota_asal: item.kota_asal,
      kota_tujuan: item.kota_tujuan,
    }));

    return NextResponse.json({ layanan }, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
