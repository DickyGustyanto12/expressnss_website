import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";
import {
  ambilPengaturanTokenAi,
  simpanPengaturanTokenAi,
  PESAN_LIMIT_DEFAULT,
  type PengaturanTokenAi,
} from "@/lib/internal/ai-token-limit";

// Pengaturan limit token AI + ringkasan pemakaian
export async function GET() {
  try {
    const pengaturan = await ambilPengaturanTokenAi();
    const [[r]] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS sesi,
         COALESCE(SUM(token_input), 0) AS token_input,
         COALESCE(SUM(token_output), 0) AS token_output,
         COALESCE(SUM(biaya_rp), 0) AS biaya,
         COALESCE(SUM(jumlah_request), 0) AS request,
         SUM(limit_tercapai_at IS NOT NULL) AS sesi_limit,
         SUM(limit_kustom_rupiah IS NOT NULL OR limit_kustom_token IS NOT NULL) AS sesi_kustom
       FROM ai_token_usage`,
    );
    const request = Number(r.request);
    return NextResponse.json({
      pengaturan,
      ringkasan: {
        sesi: Number(r.sesi),
        tokenInput: Number(r.token_input),
        tokenOutput: Number(r.token_output),
        biaya: Number(r.biaya),
        request,
        sesiLimit: Number(r.sesi_limit ?? 0),
        sesiKustom: Number(r.sesi_kustom ?? 0),
        rataTokenPerRequest: request
          ? Math.round(
              (Number(r.token_input) + Number(r.token_output)) / request,
            )
          : null,
        rataBiayaPerRequest: request ? Number(r.biaya) / request : null,
      },
    });
  } catch (error) {
    console.error("Error ambil pengaturan token AI:", error);
    return NextResponse.json(
      { error: "Gagal mengambil pengaturan limit token AI" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const b = await req.json();
    const p: PengaturanTokenAi = {
      aktif: Boolean(b.aktif),
      mode: b.mode === "token" ? "token" : "rupiah",
      limitRupiah: Number(b.limitRupiah),
      limitToken: Math.round(Number(b.limitToken)),
      hargaInputUsd: Number(b.hargaInputUsd),
      hargaOutputUsd: Number(b.hargaOutputUsd),
      kursUsd: Number(b.kursUsd),
      pesanLimit: String(b.pesanLimit || "").trim() || PESAN_LIMIT_DEFAULT,
    };

    const angkaValid = [
      p.limitRupiah,
      p.limitToken,
      p.hargaInputUsd,
      p.hargaOutputUsd,
      p.kursUsd,
    ].every((n) => Number.isFinite(n) && n >= 0);
    if (!angkaValid || p.kursUsd <= 0) {
      return NextResponse.json(
        {
          error:
            "Semua angka wajib diisi dengan nilai 0 atau lebih (kurs > 0).",
        },
        { status: 400 },
      );
    }

    await simpanPengaturanTokenAi(p);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error simpan pengaturan token AI:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan limit token AI" },
      { status: 500 },
    );
  }
}
