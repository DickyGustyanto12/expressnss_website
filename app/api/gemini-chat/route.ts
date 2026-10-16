import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

// =====================================================
// CACHE MEMORY (hindari query DB setiap request)
// =====================================================
let kbCache: { data: RowDataPacket[]; time: number } | null = null;
let settingsCache: { data: any; time: number } | null = null;
const TTL = 60_000; // 60 detik

async function getKB(): Promise<RowDataPacket[]> {
  if (kbCache && Date.now() - kbCache.time < TTL) return kbCache.data;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT kategori, pertanyaan, jawaban
     FROM ai_knowledge_base
     WHERE is_active = 1
     ORDER BY urutan ASC`,
  );
  kbCache = { data: rows, time: Date.now() };
  return rows;
}

async function getSettings(): Promise<any> {
  if (settingsCache && Date.now() - settingsCache.time < TTL)
    return settingsCache.data;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ai_name, persona, limitations FROM ai_settings LIMIT 1`,
  );
  const data = rows[0] || {
    ai_name: "Customer Service NSS Express",
    persona:
      "Kamu adalah Customer Service virtual NSS Express yang ramah dan profesional.",
    limitations: "Hanya menjawab seputar layanan pengiriman dan logistik.",
  };
  settingsCache = { data, time: Date.now() };
  return data;
}

// =====================================================
// PENCOCOKAN KNOWLEDGE BASE (lokal, instan)
// =====================================================
const STOP_WORDS = new Set([
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
  "kaka",
  "kakak",
  "kak",
  "pak",
  "bu",
  "tolong",
  "mohon",
  "ini",
  "itu",
  "isi",
  "ya",
  "yah",
  "yuk",
  "dong",
  "min",
  "gan",
  "the",
  "is",
  "am",
  "are",
  "you",
  "your",
  "my",
  "me",
]);

function getMeaningfulWords(message: string): string[] {
  return message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function findRelevantKB(kb: RowDataPacket[], message: string) {
  const msg = message.toLowerCase().trim();
  const words = getMeaningfulWords(msg);

  // Tidak ada kata bermakna → jangan cocokkan apa pun
  if (words.length === 0) return [];

  const scored = kb
    .map((row) => {
      const text =
        `${row.pertanyaan} ${row.jawaban} ${row.kategori}`.toLowerCase();
      let score = 0;

      // Hitung hanya kata bermakna (bukan substring huruf pendek)
      for (const w of words) {
        if (text.includes(w)) score += 1;
      }

      // Bonus cocok frasa penuh (hanya untuk pesan cukup panjang)
      if (msg.length >= 6 && text.includes(msg)) score += 3;

      return { row, score };
    })
    .filter((s) => s.score >= 2) // minimal 2 kata bermakna cocok
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3); // top 3 untuk konteks Gemini
}

// =====================================================
// SMALL-TALK INSTAN
// =====================================================
function smallTalk(message: string): string | null {
  const m = message.toLowerCase().trim();

  const greetings = [
    "p",
    "p?",
    "p!",
    "test",
    "testing",
    "halo",
    "hallo",
    "hello",
    "hi",
    "hai",
    "hey",
    "assalamualaikum",
    "pagi",
    "siang",
    "sore",
    "malam",
  ];
  if (greetings.includes(m)) {
    return "Halo Kak! 👋 Ada yang bisa saya bantu terkait layanan pengiriman NSS Express? Silakan tanya soal tarif, lacak paket, atau cabang kami.";
  }

  const thanks = [
    "terima kasih",
    "makasih",
    "thanks",
    "thank you",
    "tq",
    "thx",
  ];
  if (thanks.includes(m)) {
    return "Sama-sama Kak! 😊 Senang bisa membantu. Ada lagi yang ingin ditanyakan?";
  }

  return null;
}

// =====================================================
// HANDLER UTAMA
// =====================================================
export async function POST(req: Request) {
  const t0 = Date.now();

  try {
    const body = await req.json();
    const message: string = body.message || "";
    const chatHistory: any[] = body.chatHistory || [];

    if (!message.trim()) {
      return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });
    }

    // ---------- FAST PATH 1: small-talk ----------
    const st = smallTalk(message);
    if (st) {
      console.log(`[CHAT] ⚡ Fast path small-talk (${Date.now() - t0}ms)`);
      return NextResponse.json({ reply: st });
    }

    // ---------- FAST PATH 2: pesan terlalu pendek / tidak jelas ----------
    const clean = message.toLowerCase().trim();
    if (clean.length < 3 || getMeaningfulWords(clean).length === 0) {
      console.log(`[CHAT] ⚡ Fast path klarifikasi (${Date.now() - t0}ms)`);
      return NextResponse.json({
        reply:
          'Maaf Kak, saya belum paham maksudnya. 🙏 Bisa tulis pertanyaan lebih lengkap? Contoh: "Berapa tarif kirim ke Surabaya?" atau "Bagaimana cara lacak paket?"',
      });
    }

    // ---------- Ambil data (dari cache) ----------
    const [kb, settings] = await Promise.all([getKB(), getSettings()]);

    // ---------- FAST PATH 3: jawaban knowledge base ----------
    const relevant = findRelevantKB(kb, message);
    if (relevant.length > 0 && relevant[0].score >= 2) {
      console.log(
        `[CHAT] ⚡ Fast path knowledge base (${Date.now() - t0}ms) → "${relevant[0].row.pertanyaan}"`,
      );
      return NextResponse.json({ reply: relevant[0].row.jawaban });
    }

    // ---------- SLOW PATH: Gemini (hanya jika benar-benar perlu) ----------
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[CHAT] GEMINI_API_KEY tidak ditemukan");
      return NextResponse.json({
        reply:
          relevant.length > 0
            ? relevant[0].row.jawaban
            : 'Maaf Kak, saya belum menemukan informasi tersebut. Silakan hubungi Customer Service manusia kami lewat tombol "Hubungkan dengan Customer Service" di bawah ya.',
      });
    }

    const t1 = Date.now();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    // Prompt KECIL: hanya top-3 KB relevan
    const kbText = relevant.length
      ? relevant
          .map(
            (s, i) =>
              `${i + 1}. [${s.row.kategori}]\nQ: ${s.row.pertanyaan}\nA: ${s.row.jawaban}`,
          )
          .join("\n\n")
      : "Tidak ada pengetahuan yang relevan.";

    // History dipotong: maksimal 6 pesan terakhir
    const recentHistory = chatHistory.slice(-6).map((m: any) => ({
      role: m.pengirim === "user" ? "user" : "model",
      parts: [{ text: m.teks }],
    }));

    const systemPrompt = [
      `Nama AI: ${settings.ai_name}`,
      `PERSONA: ${settings.persona}`,
      `BATASAN: ${settings.limitations}`,
      `PENGETAHUAN RELEVAN:\n${kbText}`,
      `Aturan jawab: bahasa Indonesia, ramah, sapaan "Kak", maksimal 3 kalimat.`,
      `Jika pertanyaan di luar topik pengiriman/logistik atau tidak ada di pengetahuan, jawab: "Maaf Kak, kami hanya menjawab seputar Ekspedisi. Jika ada kendala dan pertanyaan silahkan ketik disini."`,
    ].join("\n");

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [{ text: "Baik, saya mengerti dan siap membantu." }],
        },
        ...recentHistory,
      ],
      generationConfig: { maxOutputTokens: 200, temperature: 0.4 },
    });

    // Timeout 10 detik agar tidak menggantung
    const result: any = await Promise.race([
      chat.sendMessage(message),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), 10000),
      ),
    ]);

    const t2 = Date.now();
    console.log(
      `[GEMINI] DB/cache: ${t1 - t0}ms | Gemini API: ${t2 - t1}ms | TOTAL: ${t2 - t0}ms`,
    );

    return NextResponse.json({ reply: result.response.text() });
  } catch (error: any) {
    console.error("[CHAT] Error:", error.message);

    if (error.message === "TIMEOUT") {
      return NextResponse.json({
        reply:
          'Maaf Kak, sistem sedang sibuk. Silakan ulangi pertanyaan Anda atau gunakan tombol "Hubungkan dengan Customer Service" di bawah.',
      });
    }

    return NextResponse.json({
      reply:
        "Maaf Kak, terjadi kesalahan pada sistem. Silakan hubungi Customer Service kami.",
    });
  }
}
