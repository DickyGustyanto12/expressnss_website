import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, kota, lat, lng, alamat, link_maps FROM cabang ORDER BY kota ASC",
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching cabang:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kota, lat, lng, alamat, link_maps } = body;

    if (!kota || !lat || !lng || !alamat) {
      return NextResponse.json(
        { error: "Kota, Latitude, Longitude, dan Alamat wajib diisi" },
        { status: 400 },
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO cabang (kota, lat, lng, alamat, link_maps) VALUES (?, ?, ?, ?, ?)",
      [kota, lat, lng, alamat, link_maps || ""],
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Error creating cabang:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, kota, lat, lng, alamat, link_maps } = body;

    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    await pool.query(
      "UPDATE cabang SET kota = ?, lat = ?, lng = ?, alamat = ?, link_maps = ? WHERE id = ?",
      [kota, lat, lng, alamat, link_maps || "", id],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cabang:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    await pool.query("DELETE FROM cabang WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cabang:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 },
    );
  }
}
