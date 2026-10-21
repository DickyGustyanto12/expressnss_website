import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { ResultSetHeader } from "mysql2";

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/suggestion-admin/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const { judul, kata_kunci, isi_balasan, aktif } = body;

    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    if (!judul?.trim() || !kata_kunci?.trim() || !isi_balasan?.trim()) {
      return NextResponse.json(
        { error: "Judul, kata kunci, dan isi balasan wajib diisi" },
        { status: 400 },
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE suggestion_admin SET judul = ?, kata_kunci = ?, isi_balasan = ?, aktif = ? WHERE id = ?",
      [
        judul.trim(),
        kata_kunci.trim(),
        isi_balasan.trim(),
        Number(aktif) === 0 ? 0 : 1,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating suggestion admin:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/suggestion-admin/[id]">,
) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM suggestion_admin WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting suggestion admin:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 },
    );
  }
}
