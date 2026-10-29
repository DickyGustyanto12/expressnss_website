import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

interface BarisImport {
  kota_asal: string;
  kota_tujuan: string;
  layanan: string;
  berat: number;
  harga_ongkir: number;
}

const MAKS_BARIS = 5000;

export async function POST(request: Request) {
  const conn = await pool.getConnection();
  try {
    const body = await request.json();
    const rows: unknown[] | null = Array.isArray(body?.rows) ? body.rows : null;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data tarif untuk diimport." },
        { status: 400 },
      );
    }

    if (rows.length > MAKS_BARIS) {
      return NextResponse.json(
        { error: `Maksimal ${MAKS_BARIS} baris per import.` },
        { status: 400 },
      );
    }

    const data: BarisImport[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Partial<BarisImport>;
      const kota_asal = String(row.kota_asal ?? "").trim();
      const kota_tujuan = String(row.kota_tujuan ?? "").trim();
      const layanan = String(row.layanan ?? "").trim().toUpperCase();
      const berat = Number(row.berat);
      const harga_ongkir = Number(row.harga_ongkir);

      if (
        !kota_asal ||
        !kota_tujuan ||
        !layanan ||
        !(berat > 0) ||
        !(harga_ongkir > 0)
      ) {
        return NextResponse.json(
          { error: `Data baris ke-${i + 1} tidak lengkap atau tidak valid.` },
          { status: 400 },
        );
      }

      data.push({ kota_asal, kota_tujuan, layanan, berat, harga_ongkir });
    }

    await conn.beginTransaction();

    let ditambah = 0;
    let diperbarui = 0;

    for (const row of data) {
      const [existing] = await conn.execute<RowDataPacket[]>(
        `SELECT id FROM tarif_ongkir
         WHERE LOWER(kota_asal) = LOWER(?) AND LOWER(kota_tujuan) = LOWER(?) AND layanan = ?
         LIMIT 1`,
        [row.kota_asal, row.kota_tujuan, row.layanan],
      );

      if (existing.length > 0) {
        await conn.execute(
          "UPDATE tarif_ongkir SET berat = ?, harga_ongkir = ? WHERE id = ?",
          [row.berat, row.harga_ongkir, existing[0].id],
        );
        diperbarui++;
      } else {
        await conn.execute(
          "INSERT INTO tarif_ongkir (kota_asal, kota_tujuan, layanan, berat, harga_ongkir) VALUES (?, ?, ?, ?, ?)",
          [
            row.kota_asal,
            row.kota_tujuan,
            row.layanan,
            row.berat,
            row.harga_ongkir,
          ],
        );
        ditambah++;
      }
    }

    await conn.commit();

    return NextResponse.json(
      {
        message: "Import tarif berhasil",
        ditambah,
        diperbarui,
      },
      { status: 200 },
    );
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error("Error import tarif:", error);
    return NextResponse.json(
      { error: "Gagal mengimport data tarif. Tidak ada data yang disimpan." },
      { status: 500 },
    );
  } finally {
    conn.release();
  }
}
