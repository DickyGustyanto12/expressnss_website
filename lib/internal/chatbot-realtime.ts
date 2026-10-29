import { skorKemiripanKota, AMBANG_KEMIRIPAN } from "@/lib/pencocokan-kota";
import { ambilDaftarKota, hitungOngkir, type DaftarKota } from "./ongkir";
import { lacakResi } from "./tracking";

export interface PesanRiwayat {
  pengirim: string;
  teks: string;
}

export interface JawabanRealtime {
  reply: string;
  jenis: "ongkir" | "lacak";
}

const TANYA_TUJUAN = "Ke kota mana tujuan pengirimannya";
const TANYA_ASAL = "Dari kota mana paketnya dikirim";
const TANYA_RESI = "Silakan kirimkan nomor resinya";

const POLA_ONGKIR =
  /\b(ongkir|ongkos|tarif|biaya kirim|biaya pengiriman|biaya ngirim|harga kirim|harga pengiriman|cek harga|cek ongkir)\b/i;
const POLA_ONGKIR_LEMAH =
  /\b(kirim|ngirim|pengiriman|biaya|harga|berapa|brp)\b/i;
const POLA_LACAK =
  /\b(lacak|melacak|resi|tracking|track|trace|awb|cek paket|cek kiriman|status paket|status kiriman|posisi paket|paket saya|kiriman saya|sampai mana|sudah sampai)\b/i;

const PENANDA_ASAL = new Set(["dari"]);
const PENANDA_TUJUAN = new Set(["ke", "tujuan", "menuju", "kearah", "dikirim"]);

const KATA_ABAIKAN = new Set([
  "berapa",
  "brp",
  "ongkir",
  "ongkos",
  "tarif",
  "biaya",
  "harga",
  "kirim",
  "ngirim",
  "pengiriman",
  "dikirim",
  "paket",
  "barang",
  "kak",
  "kakak",
  "min",
  "admin",
  "dong",
  "ya",
  "yah",
  "nih",
  "sih",
  "mau",
  "ingin",
  "pengen",
  "tolong",
  "mohon",
  "cek",
  "cari",
  "tau",
  "info",
  "berat",
  "kg",
  "kilo",
  "kilogram",
  "dari",
  "ke",
  "tujuan",
  "menuju",
  "kearah",
  "untuk",
  "buat",
  "dengan",
  "dan",
  "atau",
  "yang",
  "di",
  "layanan",
  "reguler",
  "next",
  "berapaan",
  "saya",
  "aku",
  "gan",
  "sis",
  "bang",
  "pak",
  "bu",
  "apa",
  "aja",
  "saja",
  "ga",
  "gak",
  "nggak",
  "tidak",
  "bisa",
  "kah",
  "nya",
  "kalau",
  "kalo",
  "klo",
  "per",
  "sekarang",
  "hari",
  "ini",
  "itu",
  "terbaru",
  "berapakah",
  "kira",
  "kirakira",
  "estimasi",
  "sampai",
  "jadi",
  "total",
  "semua",
  "tolong",
  "halo",
  "hai",
  "pagi",
  "siang",
  "sore",
  "malam",
  "terima",
  "kasih",
  "makasih",
  "ok",
  "oke",
]);

const formatRp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
const formatBerat = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

const tokenisasi = (teks: string) =>
  teks
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const kataKota = (t: string) =>
  t.length >= 3 && !/\d/.test(t) && !KATA_ABAIKAN.has(t);

const pesanBotTerakhir = (riwayat: PesanRiwayat[]) => {
  for (let i = riwayat.length - 1; i >= 0; i--) {
    if (riwayat[i].pengirim !== "user") return riwayat[i].teks || "";
  }
  return "";
};

type Peran = "asal" | "tujuan";

interface Sebutan {
  frasa: string;
  mulai: number;
  akhir: number;
  cocokAsal: boolean;
  cocokTujuan: boolean;
}

function cariSebutanKota(token: string[], kota: DaftarKota): Sebutan[] {
  const hasil: Sebutan[] = [];
  const terpakai = new Set<number>();
  const ambang = Math.max(AMBANG_KEMIRIPAN, 0.8);

  for (const n of [3, 2, 1]) {
    for (let i = 0; i + n <= token.length; i++) {
      const bagian = token.slice(i, i + n);
      if (bagian.some((t, k) => terpakai.has(i + k))) continue;
      const inti = bagian.filter(
        (t) => !["kota", "kab", "kabupaten"].includes(t),
      );
      if (inti.length === 0 || !inti.every(kataKota)) continue;

      const frasa = bagian.join(" ");
      const skor = (daftar: string[]) =>
        daftar.reduce(
          (m, nama) => Math.max(m, skorKemiripanKota(frasa, nama)),
          0,
        );
      const sAsal = skor(kota.asal);
      const sTujuan = skor(kota.tujuan);
      const ambangFrasa = n > 1 ? 0.9 : ambang;
      if (Math.max(sAsal, sTujuan) < ambangFrasa) continue;

      hasil.push({
        frasa,
        mulai: i,
        akhir: i + n,
        cocokAsal: sAsal >= ambangFrasa,
        cocokTujuan: sTujuan >= ambangFrasa,
      });
      for (let k = i; k < i + n; k++) terpakai.add(k);
    }
  }
  return hasil.sort((a, b) => a.mulai - b.mulai);
}

function ambilBerat(teks: string): number | null {
  const m =
    teks.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|kilo|kilogram)\b/i) ||
    teks.match(/\bberat\s*(?:nya)?\s*(\d+(?:[.,]\d+)?)/i);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return n > 0 && n <= 10_000 ? n : null;
}

interface StatusOngkir {
  asal: string | null;
  tujuan: string | null;
  berat: number | null;
}

function isiSlot(
  status: StatusOngkir,
  teks: string,
  diharapkan: Peran | null,
  kota: DaftarKota,
) {
  const token = tokenisasi(teks);
  const sebutan = cariSebutanKota(token, kota);
  const baru: Partial<Record<Peran, string>> = {};
  const sisa: Sebutan[] = [];

  for (const s of sebutan) {
    const sebelum = token[s.mulai - 1];
    if (sebelum && PENANDA_ASAL.has(sebelum)) baru.asal = s.frasa;
    else if (sebelum && PENANDA_TUJUAN.has(sebelum)) baru.tujuan = s.frasa;
    else sisa.push(s);
  }

  token.forEach((t, i) => {
    const peran: Peran | null = PENANDA_ASAL.has(t)
      ? "asal"
      : PENANDA_TUJUAN.has(t)
        ? "tujuan"
        : null;
    if (!peran || baru[peran]) return;
    if (sebutan.some((s) => s.mulai === i + 1)) return;
    const frasa = token.slice(i + 1, i + 3).filter(kataKota);
    if (frasa.length && kataKota(token[i + 1] ?? ""))
      baru[peran] = frasa.join(" ");
  });

  for (const s of sisa) {
    if (diharapkan && !baru[diharapkan]) {
      baru[diharapkan] = s.frasa;
    } else if (
      !baru.asal &&
      !baru.tujuan &&
      sisa.length >= 2 &&
      s === sisa[0]
    ) {
      baru.asal = s.frasa;
    } else if (
      !baru.tujuan &&
      !(status.tujuan && !status.asal && s.cocokAsal)
    ) {
      if (!s.cocokTujuan && s.cocokAsal && !baru.asal) baru.asal = s.frasa;
      else baru.tujuan = s.frasa;
    } else if (!baru.asal) {
      baru.asal = s.frasa;
    }
  }

  if (diharapkan && !baru[diharapkan] && sebutan.length === 0) {
    const kata = token.filter(kataKota).slice(0, 3);
    if (kata.length) baru[diharapkan] = kata.join(" ");
  }

  if (baru.asal) status.asal = baru.asal;
  if (baru.tujuan) status.tujuan = baru.tujuan;
  const berat = ambilBerat(teks);
  if (berat) status.berat = berat;
}

const peranDitanyakan = (teksBot: string): Peran | null =>
  teksBot.includes(TANYA_ASAL)
    ? "asal"
    : teksBot.includes(TANYA_TUJUAN)
      ? "tujuan"
      : null;

function konteksOngkir(
  pesan: string,
  riwayat: PesanRiwayat[],
): { teks: string; diharapkan: Peran | null }[] | null {
  const diharapkanSekarang = peranDitanyakan(pesanBotTerakhir(riwayat));
  const sekarang = { teks: pesan, diharapkan: diharapkanSekarang };

  if (POLA_ONGKIR.test(pesan)) return [sekarang];
  if (!diharapkanSekarang) return null;

  const langkah = [sekarang];
  let i = riwayat.length - 1;
  while (i >= 1 && langkah.length < 5) {
    while (i >= 0 && riwayat[i].pengirim === "user") i--;
    const bot = riwayat[i];
    const user = riwayat[i - 1];
    if (!bot || !user || user.pengirim !== "user") break;
    const botSebelumnya = riwayat
      .slice(0, i - 1)
      .reverse()
      .find((p) => p.pengirim !== "user");
    langkah.unshift({
      teks: user.teks,
      diharapkan: botSebelumnya ? peranDitanyakan(botSebelumnya.teks) : null,
    });
    if (POLA_ONGKIR.test(user.teks) || POLA_ONGKIR_LEMAH.test(user.teks)) break;
    if (!botSebelumnya || !peranDitanyakan(botSebelumnya.teks)) break;
    i -= 2;
  }
  return langkah;
}

async function jawabOngkir(
  pesan: string,
  riwayat: PesanRiwayat[],
): Promise<string | null> {
  const kota = await ambilDaftarKota();
  let langkah = konteksOngkir(pesan, riwayat);

  if (!langkah && POLA_ONGKIR_LEMAH.test(pesan)) {
    if (cariSebutanKota(tokenisasi(pesan), kota).length > 0) {
      langkah = [{ teks: pesan, diharapkan: null }];
    }
  }
  if (!langkah) return null;

  const status: StatusOngkir = { asal: null, tujuan: null, berat: null };
  for (const l of langkah) isiSlot(status, l.teks, l.diharapkan, kota);

  if (!status.tujuan) {
    return `Siap Kak, saya bantu cek ongkirnya 😊 ${TANYA_TUJUAN}${
      status.asal ? ` dari ${status.asal}` : ""
    }, dan berapa beratnya? Contoh: "Klaten 2 kg".`;
  }

  if (!status.asal) {
    if (kota.asal.length === 1) status.asal = kota.asal[0];
    else {
      return `${TANYA_ASAL}, Kak? Kota asal yang tersedia: ${kota.asal.join(", ")}.`;
    }
  }

  const berat = status.berat ?? 1;
  const hasil = await hitungOngkir(status.asal, status.tujuan, berat, kota);

  if (hasil.status === "asal-tidak-ditemukan") {
    return `Maaf Kak, pengiriman dari "${status.asal}" belum tersedia di NSS Express. ${TANYA_ASAL}? Kota asal yang tersedia: ${kota.asal.join(", ")}.`;
  }
  if (hasil.status === "tujuan-tidak-ditemukan") {
    return `Maaf Kak, kota tujuan "${status.tujuan}" belum ada di daftar tarif kami.${
      hasil.saran.length
        ? ` Mungkin maksud Kakak: ${hasil.saran.join(", ")}?`
        : ""
    } ${TANYA_TUJUAN}?`;
  }
  if (hasil.status === "rute-tidak-ada") {
    return `Maaf Kak, tarif dari ${hasil.asal} ke ${hasil.tujuan} belum tersedia di sistem kami. Silakan klik "Hubungkan dengan Customer Service" agar dibantu tim kami ya. 🙏`;
  }

  const perRute = new Map<string, typeof hasil.layanan>();
  for (const l of hasil.layanan) {
    const rute = `${l.kota_asal} → ${l.kota_tujuan}`;
    perRute.set(rute, [...(perRute.get(rute) ?? []), l]);
  }

  const baris: string[] = [
    `Berikut tarif terbaru untuk berat ${formatBerat(berat)} kg${
      status.berat ? "" : " (silakan sebutkan berat jika berbeda)"
    }:`,
  ];
  for (const [rute, layanan] of perRute) {
    baris.push("", `📦 ${rute}`);
    for (const l of layanan) {
      baris.push(
        `• ${l.nama} (estimasi ${l.estimasi}): ${formatRp(l.tarif)}${
          berat !== 1 ? ` (${formatRp(l.hargaPerKg)}/kg)` : ""
        }`,
      );
    }
  }
  baris.push("", "Ada lagi yang bisa dibantu, Kak?");
  return baris.join("\n");
}

function cariNomorResi(pesan: string): string | null {
  const kandidat = pesan
    .split(/[\s,;:()"'!?]+/)
    .map((t) => t.replace(/^[.#]+|[.]+$/g, ""))
    .filter((t) => /^(?=.*\d)[a-z0-9-]{6,30}$/i.test(t))
    .filter((t) => !/^\d+(?:[.,]\d+)?(?:kg|kilo)$/i.test(t));
  return kandidat[0] ? kandidat[0].toUpperCase() : null;
}

async function jawabLacak(
  pesan: string,
  riwayat: PesanRiwayat[],
): Promise<string | null> {
  const ditanyaResi = pesanBotTerakhir(riwayat).includes(TANYA_RESI);
  const resi = cariNomorResi(pesan);
  const hanyaResi =
    !!resi && pesan.trim().split(/\s+/).length === 1 && /\d{6,}/.test(resi);

  if (!POLA_LACAK.test(pesan) && !ditanyaResi && !hanyaResi) return null;

  if (!resi) {
    return `Bisa Kak, saya bantu lacak paketnya 📦 ${TANYA_RESI} ya Kak.`;
  }

  const hasil = await lacakResi(resi);

  if (hasil.status === "tidak-ditemukan") {
    return `Maaf Kak, nomor resi ${resi} tidak ditemukan di sistem kami. Mohon periksa kembali nomornya. ${TANYA_RESI} yang benar ya Kak.`;
  }
  if (hasil.status === "gagal") {
    return `Maaf Kak, sistem pelacakan sedang tidak dapat diakses. 🙏 Silakan coba lagi beberapa saat, atau klik "Hubungkan dengan Customer Service" agar dibantu tim kami.`;
  }

  const terbaru = hasil.riwayat[0];
  const baris: string[] = [
    `📦 Status paket ${resi} (data terbaru dari sistem):`,
    `Status terakhir: ${terbaru.keterangan || "Dalam proses"}`,
  ];
  if (terbaru.nama) baris.push(`Penerima: ${terbaru.nama}`);
  baris.push("", "Riwayat perjalanan:");
  for (const r of hasil.riwayat.slice(0, 5)) {
    const waktu = [r.tanggal, r.jam].filter(Boolean).join(" ");
    baris.push(`• ${waktu ? `${waktu} — ` : ""}${r.keterangan || "-"}`);
  }
  if (hasil.riwayat.length > 5) {
    baris.push(
      `…dan ${hasil.riwayat.length - 5} riwayat lainnya (lengkapnya di menu Lacak Paket).`,
    );
  }
  return baris.join("\n");
}

export async function jawabDataRealtime(
  pesan: string,
  riwayat: PesanRiwayat[],
): Promise<JawabanRealtime | null> {
  const lacak = await jawabLacak(pesan, riwayat);
  if (lacak) return { reply: lacak, jenis: "lacak" };

  const ongkir = await jawabOngkir(pesan, riwayat);
  if (ongkir) return { reply: ongkir, jenis: "ongkir" };

  return null;
}
