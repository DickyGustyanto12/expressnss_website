import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";
import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi." },
        { status: 400 },
      );
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Email tidak terdaftar di database." },
        { status: 401 },
      );
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Password yang Anda masukkan salah." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Error API Login:", error.message);
    return NextResponse.json(
      { success: false, message: `Server error: ${error.message}` },
      { status: 500 },
    );
  }
}
