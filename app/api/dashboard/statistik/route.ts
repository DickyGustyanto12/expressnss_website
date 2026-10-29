import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket } from "mysql2";

const SATU_JAM = 3600_000;
const SATU_HARI = 24 * SATU_JAM;
const JUMLAH_HARI_TREN = 14;

interface RataRata {
  rata: number | null;
  jumlah: number;
}

const rataRata = (nilai: number[]): RataRata => ({
  rata: nilai.length
    ? Math.round(nilai.reduce((a, b) => a + b, 0) / nilai.length)
    : null,
  jumlah: nilai.length,
});

const keDetik = (ms: number) => Math.floor(ms / 1000);
const waktu = (v: unknown) => (v ? new Date(v as string).getTime() : null);

const pesanLive = (clientMessageId: string) =>
  clientMessageId.startsWith("web-") || clientMessageId.startsWith("admin-");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let mulai = Number(searchParams.get("mulai"));
    if (!Number.isFinite(mulai) || mulai <= 0) {
      const hariIni = new Date();
      hariIni.setHours(0, 0, 0, 0);
      mulai = hariIni.getTime();
    }
    const selesai = mulai + SATU_HARI;
    const mulaiTren = mulai - (JUMLAH_HARI_TREN - 1) * SATU_HARI;

    const [[saatIni]] = await pool.query<RowDataPacket[]>(
      `SELECT
         SUM(c.status = 'open' AND EXISTS (
           SELECT 1 FROM live_chat_messages m
           WHERE m.conversation_id = c.id AND m.sender_type = 'customer'
             AND m.client_message_id LIKE 'web-%'
         )) AS menunggu,
         SUM(c.status = 'assigned') AS ditangani,
         COUNT(*) AS total_chat,
         SUM(c.status = 'closed') AS total_selesai
       FROM live_chat_conversations c`,
    );

    const [percakapan] = await pool.query<RowDataPacket[]>(
      `SELECT id, status, created_at, assigned_at,
              COALESCE(closed_at, IF(status = 'closed', updated_at, NULL)) AS selesai_at
       FROM live_chat_conversations
       WHERE created_at >= FROM_UNIXTIME(?) AND created_at < FROM_UNIXTIME(?)`,
      [keDetik(mulaiTren), keDetik(selesai)],
    );

    const [ditutup] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(closed_at, updated_at) AS selesai_at
       FROM live_chat_conversations
       WHERE status = 'closed'
         AND COALESCE(closed_at, updated_at) >= FROM_UNIXTIME(?)
         AND COALESCE(closed_at, updated_at) < FROM_UNIXTIME(?)`,
      [keDetik(mulaiTren), keDetik(selesai)],
    );

    const [pesanHariIni] = await pool.query<RowDataPacket[]>(
      `SELECT sender_type, created_at FROM live_chat_messages
       WHERE created_at >= FROM_UNIXTIME(?) AND created_at < FROM_UNIXTIME(?)`,
      [keDetik(mulai), keDetik(selesai)],
    );

    const perJam = Array.from({ length: 24 }, (_, jam) => ({
      jam,
      chatBaru: 0,
      selesai: 0,
      pesan: 0,
    }));
    const tren = Array.from({ length: JUMLAH_HARI_TREN }, (_, i) => ({
      tanggal: mulaiTren + i * SATU_HARI,
      chatBaru: 0,
      selesai: 0,
    }));

    const percakapanHariIni: RowDataPacket[] = [];
    for (const p of percakapan) {
      const dibuat = waktu(p.created_at)!;
      tren[Math.floor((dibuat - mulaiTren) / SATU_HARI)].chatBaru++;
      if (dibuat >= mulai) {
        perJam[Math.floor((dibuat - mulai) / SATU_JAM)].chatBaru++;
        percakapanHariIni.push(p);
      }
    }
    for (const p of ditutup) {
      const t = waktu(p.selesai_at)!;
      tren[Math.floor((t - mulaiTren) / SATU_HARI)].selesai++;
      if (t >= mulai) perJam[Math.floor((t - mulai) / SATU_JAM)].selesai++;
    }
    for (const m of pesanHariIni) {
      if (m.sender_type !== "customer") continue;
      perJam[Math.floor((waktu(m.created_at)! - mulai) / SATU_JAM)].pesan++;
    }

    const balasanPertama: number[] = [];
    const tungguDiambil: number[] = [];
    const waktuBalas: number[] = [];
    const durasiSesi: number[] = [];
    const pesanPerSesi = { total: 0, customer: 0, cs: 0, ai: 0, sesi: 0 };
    let lanjutKeCs = 0;

    if (percakapanHariIni.length > 0) {
      const [semuaPesan] = await pool.query<RowDataPacket[]>(
        `SELECT conversation_id, sender_type, client_message_id, created_at
         FROM live_chat_messages
         WHERE conversation_id IN (?)
         ORDER BY conversation_id, created_at, id`,
        [percakapanHariIni.map((p) => p.id)],
      );

      const pesanPerPercakapan = new Map<number, RowDataPacket[]>();
      for (const m of semuaPesan) {
        const daftar = pesanPerPercakapan.get(m.conversation_id) ?? [];
        daftar.push(m);
        pesanPerPercakapan.set(m.conversation_id, daftar);
      }

      for (const p of percakapanHariIni) {
        const pesan = pesanPerPercakapan.get(p.id) ?? [];

        if (pesan.length > 0) {
          pesanPerSesi.sesi++;
          pesanPerSesi.total += pesan.length;
          for (const m of pesan) {
            if (m.sender_type === "customer") pesanPerSesi.customer++;
            else if (m.sender_type === "admin") pesanPerSesi.cs++;
            else pesanPerSesi.ai++;
          }
        }

        const idxMulaiLive = pesan.findIndex(
          (m) =>
            m.sender_type === "customer" &&
            pesanLive(String(m.client_message_id)),
        );
        const mulaiLive =
          idxMulaiLive >= 0 ? waktu(pesan[idxMulaiLive].created_at)! : null;
        if (mulaiLive !== null) lanjutKeCs++;

        const assignedAt = waktu(p.assigned_at);
        if (
          mulaiLive !== null &&
          assignedAt !== null &&
          assignedAt >= mulaiLive
        ) {
          tungguDiambil.push((assignedAt - mulaiLive) / 1000);
        }

        if (mulaiLive !== null) {
          let belumDibalasSejak: number | null = null;
          let sudahBalasPertama = false;
          for (const m of pesan.slice(idxMulaiLive)) {
            const t = waktu(m.created_at)!;
            if (m.sender_type === "customer") {
              if (belumDibalasSejak === null) belumDibalasSejak = t;
            } else if (
              m.sender_type === "admin" &&
              belumDibalasSejak !== null
            ) {
              const detik = (t - belumDibalasSejak) / 1000;
              if (!sudahBalasPertama) {
                balasanPertama.push(detik);
                sudahBalasPertama = true;
              } else {
                waktuBalas.push(detik);
              }
              belumDibalasSejak = null;
            }
          }
        }

        const selesaiAt = waktu(p.selesai_at);
        if (p.status === "closed" && selesaiAt !== null) {
          const awal = mulaiLive ?? waktu(p.created_at)!;
          if (selesaiAt >= awal) durasiSesi.push((selesaiAt - awal) / 1000);
        }
      }
    }

    const bagi = (a: number) =>
      pesanPerSesi.sesi ? Math.round((a / pesanPerSesi.sesi) * 10) / 10 : null;

    const [[dataWebsite]] = await pool.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM tarif_ongkir) AS tarif,
         (SELECT COUNT(*) FROM cabang) AS cabang,
         (SELECT COUNT(*) FROM hero_banner WHERE is_active = 1) AS banner_aktif,
         (SELECT COUNT(*) FROM ai_knowledge_base WHERE is_active = 1) AS knowledge_aktif,
         (SELECT COUNT(*) FROM info_express WHERE is_active = 1) AS info_aktif`,
    );

    return NextResponse.json({
      diperbarui: new Date().toISOString(),
      mulai,
      saatIni: {
        menunggu: Number(saatIni.menunggu ?? 0),
        ditangani: Number(saatIni.ditangani ?? 0),
      },
      hari: {
        chatBaru: percakapanHariIni.length,
        lanjutKeCs,
        selesai: tren[tren.length - 1].selesai,
        pesanCustomer: perJam.reduce((a, j) => a + j.pesan, 0),
        totalChat: Number(saatIni.total_chat ?? 0),
        totalSelesai: Number(saatIni.total_selesai ?? 0),
      },
      leadtime: {
        balasanPertama: rataRata(balasanPertama),
        tungguDiambil: rataRata(tungguDiambil),
        waktuBalas: rataRata(waktuBalas),
        durasiSesi: rataRata(durasiSesi),
        pesanPerSesi: {
          rata: bagi(pesanPerSesi.total),
          customer: bagi(pesanPerSesi.customer),
          cs: bagi(pesanPerSesi.cs),
          ai: bagi(pesanPerSesi.ai),
          jumlah: pesanPerSesi.sesi,
        },
      },
      perJam,
      tren,
      dataWebsite: {
        tarif: Number(dataWebsite.tarif),
        cabang: Number(dataWebsite.cabang),
        bannerAktif: Number(dataWebsite.banner_aktif),
        knowledgeAktif: Number(dataWebsite.knowledge_aktif),
        infoAktif: Number(dataWebsite.info_aktif),
      },
    });
  } catch (error) {
    console.error("Error statistik dashboard:", error);
    return NextResponse.json(
      { error: "Gagal memuat statistik dashboard" },
      { status: 500 },
    );
  }
}
