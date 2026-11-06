import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "nss_express",
};

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM layanan_estimasi ORDER BY id ASC");
    await connection.end();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nama_layanan, estimasi } = await request.json();
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      "INSERT INTO layanan_estimasi (nama_layanan, estimasi) VALUES (?, ?)",
      [nama_layanan, estimasi]
    );
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, nama_layanan, estimasi } = await request.json();
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      "UPDATE layanan_estimasi SET nama_layanan = ?, estimasi = ? WHERE id = ?",
      [nama_layanan, estimasi, id]
    );
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID Kosong" }, { status: 400 });

    const connection = await mysql.createConnection(dbConfig);
    await connection.execute("DELETE FROM layanan_estimasi WHERE id = ?", [id]);
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}