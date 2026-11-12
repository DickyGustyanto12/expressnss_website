import { NextResponse } from "next/server";
import { pool } from "@/lib/internal/db";

export async function GET() {
  const startTime = Date.now();
  const result: Record<string, any> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  try {
    const t0 = Date.now();
    await pool.query("SELECT 1");
    const latency = Date.now() - t0;

    result.services.mysql = {
      status: "up",
      latency_ms: latency,
    };
  } catch (error: any) {
    result.status = "error";
    result.services.mysql = {
      status: "down",
      error: error.message,
    };
  }

  result.services.socket = {
    status: "running",
    note: "Socket.IO menempel di HTTP server yang sama",
  };

  result.response_time_ms = Date.now() - startTime;

  const httpStatus = result.status === "ok" ? 200 : 503;

  return NextResponse.json(result, { status: httpStatus });
}
