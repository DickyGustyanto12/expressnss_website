import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";
import crypto from "crypto";
import {
  ambilPengaturanTokenAi,
  catatPemakaianToken,
  cekLimitSesi,
} from "@/lib/internal/ai-token-limit";
import { jawabDataRealtime } from "@/lib/internal/chatbot-realtime";
import {
  deteksiEskalasi,
  jawabDariKnowledgeBase,
  jawabDenganAI,
  keteranganJamCs,
  pesanEskalasi,
  type PesanRiwayat,
} from "@/lib/internal/chatbot-ai";

async function ambilSesi(conversationId: number, token: string) {
  if (!conversationId || !token) return null;
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, customer_name FROM live_chat_conversations WHERE id = ? AND public_token_hash = ?",
    [conversationId, hash],
  );
  return rows[0] ?? null;
}

async function jawabanCadangan(pesan: string, riwayat: PesanRiwayat[]) {
  try {
    const realtime = await jawabDataRealtime(pesan, riwayat);
    if (realtime) return realtime.reply;
    return await jawabDariKnowledgeBase(pesan);
  } catch (err) {
    console.error("[CHAT] Jawaban cadangan gagal:", err);
    return null;
  }
}

export async function POST(req: Request) {
  const t0 = Date.now();

  try {
    const body = await req.json();
    const message = String(body.message || "").trim();
    const conversationId = Number(body.conversationId);
    const token: string = body.token || "";
    const riwayat: PesanRiwayat[] = (
      Array.isArray(body.chatHistory) ? body.chatHistory : []
    )
      .filter((m: { pengirim?: string }) => m?.pengirim !== "sistem")
      .map((m: { pengirim?: string; teks?: unknown }) => ({
        pengirim: m.pengirim === "user" ? "user" : "model",
        teks: String(m.teks ?? ""),
      }));

    if (!message) {
      return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });
    }

    const sesi = await ambilSesi(conversationId, token);
    if (!sesi) {
      return NextResponse.json(
        {
          reply:
            "Maaf Kak, sesi chat tidak valid atau sudah berakhir. Silakan tutup lalu mulai chat kembali ya. 🙏",
          sesiTidakValid: true,
        },
        { status: 401 },
      );
    }
    const nama = String(sesi.customer_name || "").split(" ")[0] || "Kak";

    const emosi = deteksiEskalasi(message);
    if (emosi) {
      console.log(
        `[CHAT] 🔔 Eskalasi ke CS conv ${conversationId}: ${emosi.alasan}`,
      );
      return NextResponse.json({
        reply: pesanEskalasi(nama, emosi.jenis),
        eskalasi: true,
        alasan: emosi.alasan,
      });
    }

    const pengaturanToken = await ambilPengaturanTokenAi();
    const statusLimit = await cekLimitSesi(conversationId, pengaturanToken);
    if (statusLimit.tercapai) {
      console.log(
        `[CHAT] ⛔ Limit AI tercapai conv ${conversationId} (${statusLimit.pemakaian}/${statusLimit.limit} ${pengaturanToken.mode})`,
      );
      const cadangan = await jawabanCadangan(message, riwayat);
      if (cadangan) return NextResponse.json({ reply: cadangan });
      return NextResponse.json({
        reply: `${pengaturanToken.pesanLimit}\n${keteranganJamCs()}`,
        eskalasi: true,
        alasan: "Limit token AI sesi tercapai",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        "[CHAT] GEMINI_API_KEY tidak ditemukan, memakai jawaban cadangan",
      );
    } else {
      try {
        const hasil = await jawabDenganAI({
          apiKey,
          pesan: message,
          riwayat,
          namaCustomer: nama,
        });

        if (hasil.tokenInput + hasil.tokenOutput > 0) {
          await catatPemakaianToken(
            conversationId,
            pengaturanToken,
            hasil.tokenInput,
            hasil.tokenOutput,
          ).catch((err) => console.error("[CHAT] Gagal mencatat token:", err));
        }

        console.log(
          `[GEMINI] ${Date.now() - t0}ms | token in/out: ${hasil.tokenInput}/${hasil.tokenOutput}${
            hasil.eskalasi ? ` | 🔔 eskalasi: ${hasil.alasan}` : ""
          }`,
        );

        return NextResponse.json({
          reply: hasil.reply,
          eskalasi: hasil.eskalasi,
          alasan: hasil.alasan,
        });
      } catch (err) {
        console.error(
          "[CHAT] Gemini gagal, memakai jawaban cadangan:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    const cadangan = await jawabanCadangan(message, riwayat);
    return NextResponse.json({
      reply:
        cadangan ??
        'Maaf Kak, sistem kami sedang sibuk. 🙏 Silakan ulangi pertanyaannya sebentar lagi, atau ketik "hubungkan CS" untuk dibantu langsung oleh tim Customer Service kami.',
    });
  } catch (error) {
    console.error(
      "[CHAT] Error:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({
      reply:
        'Maaf Kak, terjadi kesalahan pada sistem. 🙏 Silakan ulangi sebentar lagi, atau ketik "hubungkan CS" untuk dibantu tim Customer Service kami.',
    });
  }
}
