import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { AI_PERSONA } from "@/components/ui/aiConfig";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

async function getKnowledgeBase() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT kategori, pertanyaan, jawaban FROM ai_knowledge_base WHERE is_active = 1 ORDER BY urutan ASC",
    );

    if (rows.length === 0) {
      return "Belum ada knowledge base yang tersedia. Arahkan pelanggan untuk menghubungi Customer Service manusia.";
    }

    let knowledgeText = "=== PENGETAHUAN RESMI NSS EXPRESS ===\n\n";
    rows.forEach((row, index) => {
      knowledgeText += `${index + 1}. [Kategori: ${row.kategori.toUpperCase()}]\n`;
      knowledgeText += `   Pertanyaan Umum: ${row.pertanyaan}\n`;
      knowledgeText += `   Jawaban Resmi: ${row.jawaban}\n\n`;
    });
    knowledgeText += "=== AKHIR PENGETAHUAN ===\n\n";
    knowledgeText +=
      "PENTING: Gunakan HANYA informasi di atas untuk menjawab pertanyaan pelanggan. Jangan mengarang jawaban yang tidak ada di knowledge base ini.";

    return knowledgeText;
  } catch (error) {
    console.error("Error loading knowledge base:", error);
    return "Terjadi kesalahan saat memuat knowledge base.";
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key tidak ditemukan" },
        { status: 500 },
      );
    }

    const { message, chatHistory } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 },
      );
    }

    const knowledgeBase = await getKnowledgeBase();

    const instructionsWithKnowledge = AI_PERSONA.instructions.replace(
      "{{KNOWLEDGE_BASE}}",
      knowledgeBase,
    );

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const history = [
      {
        role: "user",
        parts: [{ text: `System Instruction: ${instructionsWithKnowledge}` }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Mengerti. Saya siap membantu sebagai Customer Service NSS Express dengan knowledge base yang telah diberikan. Saya akan menggunakan HANYA informasi dari knowledge base untuk menjawab pertanyaan pelanggan.",
          },
        ],
      },
      ...(chatHistory || []).map((msg: any) => ({
        role: msg.pengirim === "user" ? "user" : "model",
        parts: [{ text: msg.teks }],
      })),
    ];

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.3,
        topP: 0.8,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;

    return NextResponse.json({ reply: response.text() });
  } catch (error: any) {
    console.error("Gemini API Error:", error.message);
    return NextResponse.json(
      { error: "Gagal memproses pertanyaan" },
      { status: 500 },
    );
  }
}
