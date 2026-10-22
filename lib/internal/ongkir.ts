import { pool } from "./db";
import type { RowDataPacket } from "mysql2";
import { cariKotaMirip, saranKota } from "@/lib/pencocokan-kota";

// Satu sumber perhitungan ongkir untuk halaman Cek Ongkir & chatbot AI.
// Selalu dibaca langsung dari tabel tarif_ongkir (tanpa cache).

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

export const estimasiLayanan = (layanan: string) =>
  layanan === "REGULER" ? "3-5 Hari" : "1-2 Hari";

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

// Hitung ongkir; nama kota dicocokkan secara toleran (tidak harus sama persis)
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

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM tarif_ongkir
     WHERE kota_asal IN (?) AND kota_tujuan IN (?)
     ORDER BY kota_asal ASC, kota_tujuan ASC, layanan DESC`,
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
      estimasi: estimasiLayanan(item.layanan),
      hargaPerKg: Number(item.harga_ongkir),
      tarif: Number(item.harga_ongkir) * berat,
      kota_asal: item.kota_asal,
      kota_tujuan: item.kota_tujuan,
    })),
  };
}
