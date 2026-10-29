const ALIAS_KOTA: Record<string, string> = {
  jogja: "yogyakarta",
  jogjakarta: "yogyakarta",
  yogya: "yogyakarta",
  yogja: "yogyakarta",
  diy: "yogyakarta",
  jog: "yogyakarta",
  solo: "surakarta",
  soc: "surakarta",
  smg: "semarang",
  srg: "semarang",
  jkt: "jakarta",
  sby: "surabaya",
  sub: "surabaya",
  bdg: "bandung",
  bdo: "bandung",
  pwt: "purwokerto",
  mlg: "malang",
};

const KATA_WILAYAH =
  /\b(kabupaten|kab|kota|kotamadya|kodya|kec|kecamatan|provinsi|prov)\b/g;

export function normalisasiKota(nama: string): string {
  const dasar = nama
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(KATA_WILAYAH, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ALIAS_KOTA[dasar] ?? dasar;
}

function jarakEdit(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const biaya = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + biaya,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

function kemiripanKata(a: string, b: string): number {
  const panjang = Math.max(a.length, b.length);
  return panjang === 0 ? 0 : 1 - jarakEdit(a, b) / panjang;
}

function jenisWilayah(nama: string): "kota" | "kab" | null {
  const n = nama.toLowerCase();
  if (/\b(kab|kabupaten)\b/.test(n)) return "kab";
  if (/\b(kota|kotamadya|kodya)\b/.test(n)) return "kota";
  return null;
}

export function skorKemiripanKota(input: string, kandidat: string): number {
  const q = normalisasiKota(input);
  const k = normalisasiKota(kandidat);
  if (!q || !k) return 0;

  const jenisInput = jenisWilayah(input);
  const jenisKandidat = jenisWilayah(kandidat);
  const faktor =
    jenisInput && jenisKandidat && jenisInput !== jenisKandidat ? 0.9 : 1;

  return skorNama(q, k) * faktor;
}

function skorNama(q: string, k: string): number {
  if (q === k) return 1;

  if (q.length >= 3 && k.startsWith(q)) return 0.92;
  if (q.length >= 3 && ` ${k}`.includes(` ${q}`)) return 0.88;
  if (k.length >= 4 && ` ${q} `.includes(` ${k} `)) return 0.85;

  const kataQ = q.split(" ");
  const kataK = k.split(" ");
  let total = 0;
  for (const kq of kataQ) {
    let terbaik = 0;
    for (const kk of kataK) {
      terbaik = Math.max(
        terbaik,
        kemiripanKata(kq, kk),
        kq.length >= 3 && kk.startsWith(kq) ? 0.9 : 0,
      );
    }
    total += terbaik;
  }
  const skorKata = total / kataQ.length;
  return Math.max(skorKata, kemiripanKata(q, k)) * 0.95;
}

export const AMBANG_KEMIRIPAN = 0.72;

export function cariKotaMirip(
  input: string,
  daftarKota: string[],
  batas = 5,
): { nama: string; skor: number }[] {
  const hasil = daftarKota
    .map((nama) => ({ nama, skor: skorKemiripanKota(input, nama) }))
    .filter((h) => h.skor >= AMBANG_KEMIRIPAN)
    .sort((a, b) => b.skor - a.skor || a.nama.localeCompare(b.nama));

  if (hasil.length === 0) return [];
  const terbaik = hasil[0].skor;
  return hasil.filter((h) => h.skor >= terbaik - 0.04).slice(0, batas);
}

export function saranKota(
  input: string,
  daftarKota: string[],
  batas = 6,
): string[] {
  if (!input.trim()) return [];
  return daftarKota
    .map((nama) => ({ nama, skor: skorKemiripanKota(input, nama) }))
    .filter((h) => h.skor >= AMBANG_KEMIRIPAN - 0.07)
    .sort((a, b) => b.skor - a.skor || a.nama.localeCompare(b.nama))
    .slice(0, batas)
    .map((h) => h.nama);
}
