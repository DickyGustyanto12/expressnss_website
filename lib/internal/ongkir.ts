import { pool } from "./db";
import type { RowDataPacket } from "mysql2";
import { cariKotaMirip, saranKota } from "@/lib/pencocokan-kota";

export interface DaftarKota {
  asal: string[];
  tujuan: string[];
}

export interface LayananOngkir {
  nama: string;
  estimasi: string;
  hargaPerKg: number;
  tarif: number;
  kota_asal: string;
  kota_tujuan: string;
}

export type HasilOngkir =
  | { status: "ok"; berat: number; layanan: LayananOngkir[] }
  | { status: "asal-tidak-ditemukan"; saran: string[]; tersedia: string[] }
  | { status: "tujuan-tidak-ditemukan"; saran: string[] }
  | { status: "rute-tidak-ada"; asal: string; tujuan: string };

export async function ambilDaftarKota(): Promise<DaftarKota> {
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

export async function hitungOngkir(
  asal: string,
  tujuan: string,
  berat: number,
  daftarKota?: DaftarKota,
): Promise<HasilOngkir> {
  const kota = daftarKota ?? (await ambilDaftarKota());
  const asalCocok = cariKotaMirip(asal, kota.asal, 3);
  const tujuanCocok = cariKotaMirip(tujuan, kota.tujuan, 5);

  if (asalCocok.length === 0) {
    return {
      status: "asal-tidak-ditemukan",
      saran: saranKota(asal, kota.asal, 3),
      tersedia: kota.asal,
    };
  }
  if (tujuanCocok.length === 0) {
    return {
      status: "tujuan-tidak-ditemukan",
      saran: saranKota(tujuan, kota.tujuan, 3),
    };
  }

  // Query menggunakan LEFT JOIN ke tabel layanan_estimasi agar estimasi hari sinkron dengan database
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       t.*, 
       COALESCE(le.estimasi, '2-3 Hari Kerja') AS estimasi_hari
     FROM tarif_ongkir t
     LEFT JOIN layanan_estimasi le ON t.layanan = le.nama_layanan
     WHERE t.kota_asal IN (?) AND t.kota_tujuan IN (?)
     ORDER BY t.kota_asal ASC, t.kota_tujuan ASC, t.layanan DESC`,
    [asalCocok.map((k) => k.nama), tujuanCocok.map((k) => k.nama)],
  );

  if (rows.length === 0) {
    return {
      status: "rute-tidak-ada",
      asal: asalCocok[0].nama,
      tujuan: tujuanCocok[0].nama,
    };
  }

  return {
    status: "ok",
    berat,
    layanan: rows.map((item) => ({
      nama: item.layanan,
      estimasi: item.estimasi_hari, // Mengambil langsung dari kolom hasil JOIN database
      hargaPerKg: Number(item.harga_ongkir),
      tarif: Number(item.harga_ongkir) * berat,
      kota_asal: item.kota_asal,
      kota_tujuan: item.kota_tujuan,
    })),
  };
}