import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionCall,
  type FunctionDeclaration,
} from "@google/generative-ai";
import type { RowDataPacket } from "mysql2";
import { pool } from "./db";
import { ambilDaftarKota, hitungOngkir } from "./ongkir";
import { lacakResi } from "./tracking";

const MODEL = "gemini-3.5-flash-lite";
const BATAS_WAKTU_PANGGILAN_MS = 15_000;
const MAKS_PUTARAN_TOOLS = 4;

export interface PesanRiwayat {
  pengirim: string;
  teks: string;
}

export interface HasilChatbot {
  reply: string;
  eskalasi: boolean;
  alasan?: string;
  tokenInput: number;
  tokenOutput: number;
}

export function csSedangBuka(): boolean {
  const jam = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
  return jam >= 8 && jam < 17;
}

export const keteranganJamCs = () =>
  csSedangBuka()
    ? "Mohon tunggu sebentar ya, CS kami akan segera membalas di chat ini."
    : "CS kami aktif pukul 08.00–16.59 WIB. Pesan Kakak sudah kami terima dan akan dibalas pada jam operasional.";

const POLA_MARAH =
  /\b(marah|kesal|kesel|kecewa|mengecewakan|jengkel|sebel|sebal|emosi|muak|geram|komplain|complain|keluhan|mengeluh|protes|laporkan|tanggung ?jawab|ganti ?rugi|refund|uang (saya )?(kembali|balik)|penipu|nipu|menipu|ditipu|tipu|bohong|scam|payah|lelet|ga becus|gak becus|nggak becus|tidak becus|pelayanan (buruk|jelek)|buruk sekali)\b/i;
const POLA_KASAR =
  /\b(anjing|anjg|bangsat|bgst|goblok|goblog|tolol|bego|kampret|brengsek|sialan|babi|tai|asu|jancok|jancuk|cok|bajingan|keparat|kontol|memek)\b/i;
const POLA_MINTA_CS =
  /\b(cs manusia|orang asli|operator|bicara (dengan|sama|ke) (cs|admin|orang|manusia|customer service)|hubungkan (ke|dengan|sama) (cs|admin|customer service|orang)|minta (cs|admin|customer service)|chat (dengan |sama )?(cs|admin)|mau (ke|dengan|sama) (cs|admin))\b/i;

export function deteksiEskalasi(
  pesan: string,
): { alasan: string; jenis: "marah" | "minta-cs" } | null {
  const huruf = pesan.replace(/[^a-zA-Z]/g, "");
  const teriak =
    huruf.length >= 12 &&
    huruf.replace(/[^A-Z]/g, "").length / huruf.length >= 0.8;

  if (POLA_KASAR.test(pesan))
    return { alasan: "Customer berkata kasar / marah", jenis: "marah" };
  if (POLA_MARAH.test(pesan))
    return { alasan: "Customer kesal / komplain", jenis: "marah" };
  if (teriak || /[!?]{3,}/.test(pesan))
    return { alasan: "Customer terlihat emosi", jenis: "marah" };
  if (POLA_MINTA_CS.test(pesan))
    return { alasan: "Customer meminta Customer Service", jenis: "minta-cs" };
  return null;
}

export function pesanEskalasi(
  nama: string,
  jenis: "marah" | "minta-cs",
): string {
  const pembuka =
    jenis === "marah"
      ? `Mohon maaf atas ketidaknyamanannya, Kak ${nama} 🙏 Keluhan Kakak saya teruskan langsung ke tim Customer Service kami agar segera ditangani.`
      : `Baik Kak ${nama}, saya hubungkan langsung dengan tim Customer Service kami ya 😊`;
  return `${pembuka}\n${keteranganJamCs()}`;
}

async function ambilKonteks() {
  const [[settingRows], [kbRows], [cabangRows], [infoRows], kota] =
    await Promise.all([
      pool.query<RowDataPacket[]>("SELECT * FROM ai_settings LIMIT 1"),
      pool.query<RowDataPacket[]>(
        `SELECT kategori, pertanyaan, jawaban FROM ai_knowledge_base
         WHERE is_active = 1 ORDER BY urutan ASC, id DESC LIMIT 80`,
      ),
      pool.query<RowDataPacket[]>(
        "SELECT kota, alamat FROM cabang ORDER BY kota ASC LIMIT 50",
      ),
      pool.query<RowDataPacket[]>(
        `SELECT kategori, judul, deskripsi, tanggal FROM info_express
         WHERE is_active = 1 ORDER BY tanggal DESC, id DESC LIMIT 8`,
      ),
      ambilDaftarKota(),
    ]);

  const s = settingRows[0] ?? {};
  const potong = (t: unknown, n: number) => {
    const teks = String(t ?? "")
      .replace(/\s+/g, " ")
      .trim();
    return teks.length > n ? `${teks.slice(0, n)}…` : teks;
  };

  const kb = kbRows.length
    ? kbRows
        .map(
          (r, i) =>
            `${i + 1}. [${r.kategori}] T: ${potong(r.pertanyaan, 200)}\n   J: ${potong(r.jawaban, 600)}`,
        )
        .join("\n")
    : "(belum ada)";

  const cabang = cabangRows.length
    ? cabangRows
        .map((c) => `• NSS Express ${c.kota} — ${potong(c.alamat, 200)}`)
        .join("\n")
    : "(belum ada data cabang)";

  const info = infoRows.length
    ? infoRows
        .map(
          (r) =>
            `• [${r.kategori}] ${r.judul} (${new Date(r.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}): ${potong(r.deskripsi, 250)}`,
        )
        .join("\n")
    : "(belum ada info terbaru)";

  return {
    namaAi: String(s.ai_name || "Customer Service NSS Express"),
    persona: String(
      s.persona ||
        "Kamu adalah Customer Service NSS Express yang ramah, sopan, dan profesional.",
    ),
    batasan: String(
      s.limitations ||
        "Hanya menjawab seputar layanan pengiriman, logistik, dan NSS Express.",
    ),
    instruksi: String(s.instructions || ""),
    kb,
    cabang,
    info,
    kotaAsal: kota.asal.join(", ") || "(belum ada)",
    kotaTujuan: kota.tujuan.join(", ") || "(belum ada)",
  };
}

function susunInstruksiSistem(
  k: Awaited<ReturnType<typeof ambilKonteks>>,
  namaCustomer: string,
): string {
  const sekarang = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "short",
  });

  return `Nama kamu: ${k.namaAi} (NSS Express, perusahaan ekspedisi/logistik).
PERSONA: ${k.persona}
BATASAN: ${k.batasan}
${k.instruksi ? `INSTRUKSI ADMIN:\n${k.instruksi}\n` : ""}
Customer yang sedang chat: Kak ${namaCustomer}. Waktu sekarang: ${sekarang} WIB.
Jam operasional Customer Service (manusia): 08.00–16.59 WIB (saat ini ${csSedangBuka() ? "BUKA" : "TUTUP"}).

ATURAN MENJAWAB:
1. Bahasa Indonesia yang ramah, sopan, santai; sapa "Kak". Ringkas dan jelas (maksimal ±6 kalimat, daftar boleh lebih).
2. Jawab HANYA berdasarkan DATA TERBARU di bawah dan hasil tools. Jangan mengarang informasi, harga, alamat, atau status.
3. Tarif/ongkir WAJIB memakai tool cek_ongkir. Status paket WAJIB memakai tool lacak_paket. Jangan pernah menebak angka.
   - Jika customer belum menyebut kota tujuan / nomor resi, tanyakan dulu. Jika kota asal tidak disebut, tanyakan (kota asal tersedia: ${k.kotaAsal}). Berat default 1 kg jika tidak disebut, dan sebutkan bahwa itu untuk 1 kg.
   - Jika hasil tool berisi beberapa rute/layanan (mis. Kab. Magelang dan Kota Magelang), sebutkan SEMUANYA.
4. JANGAN PERNAH menyertakan link/URL atau mengarahkan customer ke halaman/menu lain. Berikan jawaban dan datanya langsung di chat (mis. tarif, status paket, alamat cabang ditulis lengkap).
5. Jangan gunakan tanda * atau ** atau markdown. Untuk daftar gunakan baris baru diawali "• ".
6. Panggil tool hubungkan_customer_service HANYA jika customer marah, kesal, kecewa, mengeluh/komplain (mis. paket rusak, hilang, terlambat lama, minta ganti rugi), meminta bicara dengan manusia/CS, atau masalahnya tidak bisa kamu selesaikan dengan data yang ada. Jangan panggil untuk pertanyaan biasa.
7. Pertanyaan di luar topik NSS Express/pengiriman: tolak dengan sopan dan arahkan kembali ke layanan pengiriman.

DATA TERBARU — CABANG NSS EXPRESS:
${k.cabang}

DATA TERBARU — INFO EXPRESS (berita/promo aktif):
${k.info}

DATA TERBARU — KOTA DI DAFTAR TARIF:
Kota asal: ${k.kotaAsal}
Kota tujuan: ${k.kotaTujuan}

DATA TERBARU — KNOWLEDGE BASE (jawaban resmi perusahaan):
${k.kb}`;
}

const TOOLS: FunctionDeclaration[] = [
  {
    name: "cek_ongkir",
    description:
      "Menghitung ongkos kirim terbaru dari database tarif NSS Express. Nama kota boleh tidak persis (mis. 'jogja', 'kab klaten').",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        asal: { type: SchemaType.STRING, description: "Kota asal pengiriman" },
        tujuan: {
          type: SchemaType.STRING,
          description: "Kota tujuan pengiriman",
        },
        berat_kg: {
          type: SchemaType.NUMBER,
          description: "Berat paket dalam kg (default 1)",
        },
      },
      required: ["asal", "tujuan"],
    },
  },
  {
    name: "lacak_paket",
    description:
      "Mengambil status & riwayat perjalanan paket terbaru dari server tracking NSS Express berdasarkan nomor resi.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        nomor_resi: {
          type: SchemaType.STRING,
          description: "Nomor resi / AWB",
        },
      },
      required: ["nomor_resi"],
    },
  },
  {
    name: "hubungkan_customer_service",
    description:
      "Mengalihkan chat ke Customer Service manusia. Gunakan HANYA jika customer marah/kesal/komplain, meminta bicara dengan CS, atau masalah tidak bisa diselesaikan.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        alasan: {
          type: SchemaType.STRING,
          description: "Alasan singkat dialihkan ke CS",
        },
      },
      required: ["alasan"],
    },
  },
];

const formatRp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

async function jalankanTool(
  panggilan: FunctionCall,
  status: { eskalasi: boolean; alasan?: string },
): Promise<object> {
  const a = (panggilan.args ?? {}) as Record<string, unknown>;

  if (panggilan.name === "cek_ongkir") {
    const berat = Number(a.berat_kg) > 0 ? Number(a.berat_kg) : 1;
    const hasil = await hitungOngkir(
      String(a.asal ?? ""),
      String(a.tujuan ?? ""),
      berat,
    );
    if (hasil.status === "ok") {
      return {
        status: "ok",
        berat_kg: berat,
        tarif: hasil.layanan.map((l) => ({
          rute: `${l.kota_asal} → ${l.kota_tujuan}`,
          layanan: l.nama,
          estimasi: l.estimasi,
          harga_per_kg: formatRp(l.hargaPerKg),
          total: formatRp(l.tarif),
        })),
      };
    }
    if (hasil.status === "asal-tidak-ditemukan") {
      return {
        status: "kota_asal_tidak_tersedia",
        saran: hasil.saran,
        kota_asal_tersedia: hasil.tersedia,
      };
    }
    if (hasil.status === "tujuan-tidak-ditemukan") {
      return { status: "kota_tujuan_tidak_tersedia", saran: hasil.saran };
    }
    return {
      status: "rute_belum_tersedia",
      asal: hasil.asal,
      tujuan: hasil.tujuan,
    };
  }

  if (panggilan.name === "lacak_paket") {
    const hasil = await lacakResi(String(a.nomor_resi ?? ""));
    if (hasil.status === "ok") {
      return {
        status: "ok",
        nomor_resi: hasil.resi,
        status_terakhir: hasil.riwayat[0]?.keterangan || "Dalam proses",
        penerima: hasil.riwayat[0]?.nama || "-",
        riwayat_terbaru: hasil.riwayat.slice(0, 8),
      };
    }
    return hasil.status === "tidak-ditemukan"
      ? { status: "resi_tidak_ditemukan", nomor_resi: hasil.resi }
      : { status: "server_tracking_tidak_dapat_diakses" };
  }

  if (panggilan.name === "hubungkan_customer_service") {
    status.eskalasi = true;
    status.alasan = String(a.alasan ?? "Dialihkan oleh asisten AI");
    return {
      status: "terhubung",
      cs_sedang_buka: csSedangBuka(),
      catatan:
        "Chat otomatis dialihkan ke Customer Service. Sampaikan permohonan maaf / empati singkat dan bahwa Kakak sudah terhubung dengan CS. " +
        keteranganJamCs(),
    };
  }

  return { status: "tool_tidak_dikenal" };
}

function susunRiwayat(riwayat: PesanRiwayat[]): Content[] {
  const hasil: Content[] = [];
  for (const p of riwayat.slice(-12)) {
    const teks = p.teks?.trim();
    if (!teks) continue;
    const role = p.pengirim === "user" ? "user" : "model";
    const terakhir = hasil[hasil.length - 1];
    if (terakhir?.role === role) terakhir.parts.push({ text: teks });
    else hasil.push({ role, parts: [{ text: teks }] });
  }
  while (hasil.length && hasil[0].role !== "user") hasil.shift();
  return hasil;
}

const rapikanJawaban = (teks: string) =>
  teks
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/[ \t]*\(?\s*https?:\/\/[^\s)]+\s*\)?/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\s*[*-]\s+/gm, "• ")
    .replace(/\*/g, "")
    .trim();

export async function jawabDenganAI(params: {
  apiKey: string;
  pesan: string;
  riwayat: PesanRiwayat[];
  namaCustomer: string;
}): Promise<HasilChatbot> {
  const konteks = await ambilKonteks();
  const genAI = new GoogleGenerativeAI(params.apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: susunInstruksiSistem(konteks, params.namaCustomer),
    tools: [{ functionDeclarations: TOOLS }],
    generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
  });

  const panggilGemini = () =>
    Promise.race([
      model.generateContent({ contents }),
      new Promise<never>((_, tolak) =>
        setTimeout(
          () => tolak(new Error("Gemini timeout")),
          BATAS_WAKTU_PANGGILAN_MS,
        ),
      ),
    ]);

  const contents = susunRiwayat([
    ...params.riwayat,
    { pengirim: "user", teks: params.pesan },
  ]);
  const statusEskalasi: { eskalasi: boolean; alasan?: string } = {
    eskalasi: false,
  };
  let tokenInput = 0;
  let tokenOutput = 0;
  const catatToken = (u?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  }) => {
    tokenInput += Number(u?.promptTokenCount ?? 0);
    tokenOutput +=
      Number(u?.candidatesTokenCount ?? 0) + Number(u?.thoughtsTokenCount ?? 0);
  };

  let hasil = await panggilGemini();
  catatToken(hasil.response.usageMetadata);

  for (let i = 0; i < MAKS_PUTARAN_TOOLS; i++) {
    const panggilan = hasil.response.functionCalls();
    if (!panggilan?.length) break;

    const bagianModel = hasil.response.candidates?.[0]?.content?.parts ?? [];
    contents.push({ role: "model", parts: bagianModel });

    const jawabanTool = await Promise.all(
      panggilan.map(async (p) => ({
        functionResponse: {
          name: p.name,
          response: await jalankanTool(p, statusEskalasi),
        },
      })),
    );
    contents.push({ role: "user", parts: jawabanTool });

    hasil = await panggilGemini();
    catatToken(hasil.response.usageMetadata);
  }

  let teks = "";
  try {
    teks = hasil.response.text();
  } catch {
    teks = "";
  }
  teks = rapikanJawaban(teks);

  if (!teks) {
    teks = statusEskalasi.eskalasi
      ? pesanEskalasi(params.namaCustomer, "minta-cs")
      : "Maaf Kak, bisa diulangi pertanyaannya? 🙏";
  }

  return {
    reply: teks,
    eskalasi: statusEskalasi.eskalasi,
    alasan: statusEskalasi.alasan,
    tokenInput,
    tokenOutput,
  };
}

const KATA_UMUM = new Set([
  "yang",
  "dan",
  "di",
  "ke",
  "dari",
  "untuk",
  "dengan",
  "apa",
  "berapa",
  "apakah",
  "bagaimana",
  "gimana",
  "ada",
  "tidak",
  "bukan",
  "nya",
  "kah",
  "lah",
  "saya",
  "aku",
  "kak",
  "kakak",
  "tolong",
  "mohon",
  "ini",
  "itu",
  "ya",
  "dong",
  "min",
  "gan",
]);

export async function jawabDariKnowledgeBase(
  pesan: string,
): Promise<string | null> {
  const kata = pesan
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !KATA_UMUM.has(w));
  if (kata.length === 0) return null;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT pertanyaan, jawaban, kategori FROM ai_knowledge_base WHERE is_active = 1",
  );
  let terbaik: { jawaban: string; skor: number } | null = null;
  for (const r of rows) {
    const teks = `${r.pertanyaan} ${r.jawaban} ${r.kategori}`.toLowerCase();
    const skor = kata.filter((w) => teks.includes(w)).length;
    if (skor >= 2 && (!terbaik || skor > terbaik.skor)) {
      terbaik = { jawaban: String(r.jawaban), skor };
    }
  }
  return terbaik?.jawaban ?? null;
}
