export const JAM_BUKA = 8;
export const JAM_TUTUP = 17;

export const TEKS_JAM_OPERASIONAL = "08.00 – 16.59";

export function zonaWaktuLokal(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
  } catch {
    return "Asia/Jakarta";
  }
}

export function antrianDibuka(waktu: Date = new Date()): boolean {
  const jam = waktu.getHours();
  return jam >= JAM_BUKA && jam < JAM_TUTUP;
}

export function singkatanZonaWaktu(waktu: Date = new Date()): string {
  const offsetMenit = -waktu.getTimezoneOffset();
  if (offsetMenit === 7 * 60) return "WIB";
  if (offsetMenit === 8 * 60) return "WITA";
  if (offsetMenit === 9 * 60) return "WIT";
  const tanda = offsetMenit >= 0 ? "+" : "-";
  const jam = Math.floor(Math.abs(offsetMenit) / 60);
  const menit = Math.abs(offsetMenit) % 60;
  return `GMT${tanda}${jam}${menit ? `:${String(menit).padStart(2, "0")}` : ""}`;
}

export function sisaDetikPerubahan(waktu: Date = new Date()): number {
  const detikSekarang =
    waktu.getHours() * 3600 + waktu.getMinutes() * 60 + waktu.getSeconds();
  const detikBuka = JAM_BUKA * 3600;
  const detikTutup = JAM_TUTUP * 3600;

  if (antrianDibuka(waktu)) return detikTutup - detikSekarang;
  if (detikSekarang < detikBuka) return detikBuka - detikSekarang;
  return 24 * 3600 - detikSekarang + detikBuka;
}

export function formatDurasi(totalDetik: number): string {
  const jam = Math.floor(totalDetik / 3600);
  const menit = Math.floor((totalDetik % 3600) / 60);
  if (jam > 0) return `${jam}j ${menit}m`;
  if (menit > 0) return `${menit}m`;
  return `${totalDetik}d`;
}
