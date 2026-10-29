import { pool } from "./db";
import type { RowDataPacket } from "mysql2";

export type ModeLimit = "rupiah" | "token";

export interface PengaturanTokenAi {
  aktif: boolean;
  mode: ModeLimit;
  limitRupiah: number;
  limitToken: number;
  hargaInputUsd: number;
  hargaOutputUsd: number;
  kursUsd: number;
  pesanLimit: string;
}

export const PESAN_LIMIT_DEFAULT =
  "Maaf Kak, batas penggunaan asisten AI untuk sesi ini sudah tercapai. 🙏 Kakak sekarang kami hubungkan langsung dengan tim Customer Service kami.";

const PENGATURAN_DEFAULT: PengaturanTokenAi = {
  aktif: true,
  mode: "rupiah",
  limitRupiah: 2000,
  limitToken: 500000,
  hargaInputUsd: 0.1,
  hargaOutputUsd: 0.4,
  kursUsd: 16500,
  pesanLimit: PESAN_LIMIT_DEFAULT,
};

const dariBaris = (r: RowDataPacket): PengaturanTokenAi => ({
  aktif: Number(r.aktif) === 1,
  mode: r.mode === "token" ? "token" : "rupiah",
  limitRupiah: Number(r.limit_rupiah),
  limitToken: Number(r.limit_token),
  hargaInputUsd: Number(r.harga_input_usd),
  hargaOutputUsd: Number(r.harga_output_usd),
  kursUsd: Number(r.kurs_usd),
  pesanLimit: r.pesan_limit || PESAN_LIMIT_DEFAULT,
});

export async function ambilPengaturanTokenAi(): Promise<PengaturanTokenAi> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM ai_token_settings ORDER BY id ASC LIMIT 1",
  );
  return rows.length ? dariBaris(rows[0]) : { ...PENGATURAN_DEFAULT };
}

export async function simpanPengaturanTokenAi(p: PengaturanTokenAi) {
  const nilai = [
    p.aktif ? 1 : 0,
    p.mode,
    p.limitRupiah,
    p.limitToken,
    p.hargaInputUsd,
    p.hargaOutputUsd,
    p.kursUsd,
    p.pesanLimit,
  ];
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM ai_token_settings ORDER BY id ASC LIMIT 1",
  );
  if (rows.length) {
    await pool.query(
      `UPDATE ai_token_settings SET aktif = ?, mode = ?, limit_rupiah = ?, limit_token = ?,
         harga_input_usd = ?, harga_output_usd = ?, kurs_usd = ?, pesan_limit = ?
       WHERE id = ?`,
      [...nilai, rows[0].id],
    );
  } else {
    await pool.query(
      `INSERT INTO ai_token_settings
         (aktif, mode, limit_rupiah, limit_token, harga_input_usd, harga_output_usd, kurs_usd, pesan_limit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      nilai,
    );
  }
}

export function hitungBiayaRupiah(
  p: PengaturanTokenAi,
  tokenInput: number,
  tokenOutput: number,
): number {
  return (
    ((tokenInput * p.hargaInputUsd + tokenOutput * p.hargaOutputUsd) /
      1_000_000) *
    p.kursUsd
  );
}

export interface StatusLimitSesi {
  tercapai: boolean;
  pemakaian: number;
  limit: number;
  limitKustom: boolean;
}

export async function cekLimitSesi(
  conversationId: number,
  p: PengaturanTokenAi,
): Promise<StatusLimitSesi> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM ai_token_usage WHERE conversation_id = ?",
    [conversationId],
  );
  const u = rows[0];
  const kustom =
    p.mode === "token" ? u?.limit_kustom_token : u?.limit_kustom_rupiah;
  const limit =
    kustom !== null && kustom !== undefined
      ? Number(kustom)
      : p.mode === "token"
        ? p.limitToken
        : p.limitRupiah;
  const pemakaian = u
    ? p.mode === "token"
      ? Number(u.token_input) + Number(u.token_output)
      : Number(u.biaya_rp)
    : 0;
  const tercapai = p.aktif && pemakaian >= limit;

  if (tercapai && u && !u.limit_tercapai_at) {
    await pool.query(
      "UPDATE ai_token_usage SET limit_tercapai_at = NOW() WHERE conversation_id = ?",
      [conversationId],
    );
  }

  return {
    tercapai,
    pemakaian,
    limit,
    limitKustom: kustom !== null && kustom !== undefined,
  };
}

export async function catatPemakaianToken(
  conversationId: number,
  p: PengaturanTokenAi,
  tokenInput: number,
  tokenOutput: number,
) {
  const biaya = hitungBiayaRupiah(p, tokenInput, tokenOutput);
  await pool.query(
    `INSERT INTO ai_token_usage (conversation_id, token_input, token_output, biaya_rp, jumlah_request)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       token_input = token_input + VALUES(token_input),
       token_output = token_output + VALUES(token_output),
       biaya_rp = biaya_rp + VALUES(biaya_rp),
       jumlah_request = jumlah_request + 1`,
    [conversationId, tokenInput, tokenOutput, biaya],
  );
}
