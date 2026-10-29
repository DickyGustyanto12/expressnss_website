import type { WorkSheet } from "xlsx";

type XLSXModule = typeof import("xlsx");

export interface KolomExcel {
  index: number;
  label: string;
}

export interface PemetaanKolom {
  kota: number;
  harga: number;
  asal: number | null;
  layanan: number | null;
  berat: number | null;
}

export interface AnalisaSheet {
  barisHeader: number;
  barisAkhir: number;
  kolom: KolomExcel[];
  kolomKotaDefault: number | null;
  kolomHargaDefault: number | null;
  kolomAsalDefault: number | null;
  kolomLayananDefault: number | null;
  kolomBeratDefault: number | null;
  kotaAsalDefault: string;
}

export interface BarisExcel {
  baris: number;
  kotaAsal: string;
  kotaTujuan: string;
  layanan: string;
  berat: number | null;
  harga: number | null;
}

export const KOLOM_TEMPLATE = [
  "KOTA ASAL",
  "KOTA TUJUAN",
  "LAYANAN",
  "BERAT (KG)",
  "HARGA (RP)",
] as const;

export const CONTOH_TEMPLATE: (string | number)[][] = [
  ["Semarang", "Kab. Klaten", "REGULER", 1, 13915],
  ["Semarang", "Kota Surakarta", "REGULER", 1, 13915],
  ["Semarang", "Kab. Banjarnegara", "NEXT", 1, 17061],
];

const NAMA_KOTA_TLC: Record<string, string> = {
  SRG: "Semarang",
  JOG: "Yogyakarta",
  BYS: "Purwokerto",
  BDO: "Bandung",
  SUB: "Surabaya",
  JKT: "Jakarta",
};

const NAMA_KOLOM_KOTA = [
  "NAMA KOTA",
  "KOTA TUJUAN",
  "KOTA/KAB",
  "TUJUAN",
  "KOTA",
];
const NAMA_KOLOM_ASAL = ["KOTA ASAL", "ASAL"];
const NAMA_KOLOM_LAYANAN = ["LAYANAN", "JENIS LAYANAN"];
const NAMA_KOLOM_BERAT = ["BERAT (KG)", "BERAT", "BERAT KG"];
const POLA_KOLOM_HARGA = /^(HARGA|TARIF|ONGKIR)/;

export function bacaSel(
  XLSX: XLSXModule,
  ws: WorkSheet,
  r: number,
  c: number,
): string | number {
  const merge = (ws["!merges"] || []).find(
    (m) => r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c,
  );
  const cell = ws[XLSX.utils.encode_cell(merge ? merge.s : { r, c })];
  const nilai = cell?.v;
  if (typeof nilai === "number") return nilai;
  if (nilai === undefined || nilai === null) return "";
  return String(nilai);
}

function teksSel(XLSX: XLSXModule, ws: WorkSheet, r: number, c: number) {
  return String(bacaSel(XLSX, ws, r, c))
    .replace(/\s+/g, " ")
    .trim();
}

export function keAngka(nilai: string | number): number | null {
  if (typeof nilai === "number") return Number.isFinite(nilai) ? nilai : null;
  const teks = nilai.replace(/rp/i, "").replace(/\s/g, "");
  if (!teks) return null;
  const angka = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(teks)
    ? Number(teks.replace(/\./g, "").replace(",", "."))
    : Number(teks.replace(",", "."));
  return Number.isFinite(angka) ? angka : null;
}

export function rapikanNamaKota(nama: string): string {
  return nama
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(
      /(^|[\s.(/-])([a-z])/g,
      (_, awal, huruf) => awal + huruf.toUpperCase(),
    );
}

export function analisaSheet(
  XLSX: XLSXModule,
  ws: WorkSheet,
): AnalisaSheet | null {
  if (!ws["!ref"]) return null;
  const range = XLSX.utils.decode_range(ws["!ref"]);

  let barisHeader = -1;
  for (let r = range.s.r; r <= Math.min(range.s.r + 15, range.e.r); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      if (NAMA_KOLOM_KOTA.includes(teksSel(XLSX, ws, r, c).toUpperCase())) {
        barisHeader = r;
        break;
      }
    }
    if (barisHeader !== -1) break;
  }
  if (barisHeader === -1) return null;

  const kolom: (KolomExcel & { sub: string; grup: string })[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const sub = teksSel(XLSX, ws, barisHeader, c);
    const grup =
      barisHeader > range.s.r ? teksSel(XLSX, ws, barisHeader - 1, c) : "";
    if (!sub && !grup) continue;
    const huruf = XLSX.utils.encode_col(c);
    const label =
      grup && grup !== sub
        ? `${huruf} — ${sub || "(kosong)"} · ${grup}`
        : `${huruf} — ${sub}`;
    kolom.push({ index: c, label, sub: sub.toUpperCase(), grup });
  }

  const cariKolom = (daftarNama: string[]) => {
    for (const nama of daftarNama) {
      const ketemu = kolom.find((k) => k.sub === nama);
      if (ketemu) return ketemu;
    }
    return null;
  };

  const kolomKota = cariKolom(NAMA_KOLOM_KOTA);
  const kolomAsal = cariKolom(NAMA_KOLOM_ASAL);
  const kolomLayanan = cariKolom(NAMA_KOLOM_LAYANAN);
  const kolomBerat = cariKolom(NAMA_KOLOM_BERAT);

  const barisContoh: number[] = [];
  for (let r = barisHeader + 1; r <= range.e.r && barisContoh.length < 5; r++) {
    barisContoh.push(r);
  }
  const kolomAngka = kolom.filter(
    (k) =>
      k.index !== kolomKota?.index &&
      k.index !== kolomBerat?.index &&
      barisContoh.some(
        (r) => typeof bacaSel(XLSX, ws, r, k.index) === "number",
      ),
  );

  const kolomHarga =
    kolomAngka.find((k) => POLA_KOLOM_HARGA.test(k.sub)) ||
    kolomAngka.find((k) => /BARU/i.test(k.grup)) ||
    kolomAngka[kolomAngka.length - 1] ||
    null;

  let kotaAsalDefault = "";
  const kolomTlcAsal = kolom.find((k) => k.sub === "TLC ASAL");
  if (kolomTlcAsal) {
    for (const r of barisContoh) {
      const kode = teksSel(XLSX, ws, r, kolomTlcAsal.index).toUpperCase();
      if (kode && kode !== kolomTlcAsal.sub) {
        kotaAsalDefault = NAMA_KOTA_TLC[kode] || kode;
        break;
      }
    }
  }

  return {
    barisHeader,
    barisAkhir: range.e.r,
    kolom: kolom.map(({ index, label }) => ({ index, label })),
    kolomKotaDefault: kolomKota?.index ?? null,
    kolomHargaDefault: kolomHarga?.index ?? null,
    kolomAsalDefault: kolomAsal?.index ?? null,
    kolomLayananDefault: kolomLayanan?.index ?? null,
    kolomBeratDefault: kolomBerat?.index ?? null,
    kotaAsalDefault,
  };
}

export function bacaBarisData(
  XLSX: XLSXModule,
  ws: WorkSheet,
  analisa: AnalisaSheet,
  pemetaan: PemetaanKolom,
  rapikanNama: boolean,
): BarisExcel[] {
  const rapikan = (nama: string) =>
    rapikanNama ? rapikanNamaKota(nama) : nama;

  const hasil: BarisExcel[] = [];
  for (let r = analisa.barisHeader + 1; r <= analisa.barisAkhir; r++) {
    const kotaMentah = teksSel(XLSX, ws, r, pemetaan.kota);
    const hargaMentah = bacaSel(XLSX, ws, r, pemetaan.harga);
    if (!kotaMentah && hargaMentah === "") continue;

    hasil.push({
      baris: r + 1,
      kotaAsal:
        pemetaan.asal !== null
          ? rapikan(teksSel(XLSX, ws, r, pemetaan.asal))
          : "",
      kotaTujuan: rapikan(kotaMentah),
      layanan:
        pemetaan.layanan !== null
          ? teksSel(XLSX, ws, r, pemetaan.layanan).toUpperCase()
          : "",
      berat:
        pemetaan.berat !== null
          ? keAngka(bacaSel(XLSX, ws, r, pemetaan.berat))
          : null,
      harga: keAngka(hargaMentah),
    });
  }
  return hasil;
}

export function unduhTemplate(XLSX: XLSXModule) {
  const wb = XLSX.utils.book_new();

  const sheetTarif = XLSX.utils.aoa_to_sheet([
    [...KOLOM_TEMPLATE],
    ...CONTOH_TEMPLATE,
  ]);
  sheetTarif["!cols"] = [
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, sheetTarif, "Tarif Ongkir");

  const sheetPetunjuk = XLSX.utils.aoa_to_sheet([
    ["PETUNJUK IMPORT TARIF ONGKIR"],
    [],
    ["Kolom", "Wajib?", "Keterangan"],
    [
      "KOTA ASAL",
      "Opsional",
      "Kota asal pengiriman. Jika kosong, pakai Kota Asal default di form import.",
    ],
    ["KOTA TUJUAN", "Wajib", "Nama kota/kabupaten tujuan, mis. Kab. Klaten."],
    [
      "LAYANAN",
      "Opsional",
      "REGULER atau NEXT. Jika kosong, pakai layanan default di form import.",
    ],
    [
      "BERAT (KG)",
      "Opsional",
      "Angka, mis. 1. Jika kosong, pakai berat default (1).",
    ],
    ["HARGA (RP)", "Wajib", "Angka tanpa Rp, mis. 13915 (13.915 juga boleh)."],
    [],
    [
      "Catatan",
      "",
      "Baris pertama harus judul kolom. Rute yang sama (asal + tujuan + layanan) akan diperbarui harganya.",
    ],
  ]);
  sheetPetunjuk["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, sheetPetunjuk, "Petunjuk");

  XLSX.writeFile(wb, "template-import-tarif-ongkir.xlsx");
}
