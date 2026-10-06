import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { AI_PERSONA } from "@/components/ui/aiConfig";

export async function POST(req: Request) {
    console.log("🔍 [GEMINI ROUTE] Request masuk");

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log("🔍 [GEMINI ROUTE] API Key ada?", !!apiKey);

        if (!apiKey) {
            console.error("❌ [GEMINI ROUTE] GEMINI_API_KEY tidak ditemukan di .env");
            return NextResponse.json({
                error: "API Key tidak ditemukan"
            }, { status: 500 });
        }

        const body = await req.json();
        const { message, chatHistory } = body;

        if (!message) {
            return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
        }

        // Inisialisasi client dengan library baru
        const client = new GoogleGenAI({ apiKey });

        // Siapkan konten chat
        const contents = [
            {
                role: "user",
                parts: [{ text: `System Instruction: ${AI_PERSONA.instructions}` }],
            },
            {
                role: "model",
                parts: [{ text: "Mengerti. Saya siap membantu sebagai Customer Service NSS Express." }],
            },
            ...(chatHistory || []).map((msg: any) => ({
                role: msg.pengirim === "user" ? "user" : "model",
                parts: [{ text: msg.teks }],
            })),
            {
                role: "user",
                parts: [{ text: message }],
            },
        ];

        console.log("🔍 [GEMINI ROUTE] Mengirim request ke Gemini...");

        // Generate response
        const response = await client.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents,
            config: {
                maxOutputTokens: 300,
                temperature: 0.7,
            },
        });

        const reply = response.text;
        console.log("✅ [GEMINI ROUTE] Response berhasil:", reply?.substring(0, 50));

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("❌ [GEMINI ROUTE] Error detail:", error.message);
        console.error("❌ [GEMINI ROUTE] Error stack:", error.stack);
        return NextResponse.json({
            error: error.message || "Gagal memproses pertanyaan"
        }, { status: 500 });
    }
}