import { NextResponse } from "next/server";
import { ambilDaftarKota, hitungOngkir } from "@/lib/internal/ongkir";

export async function GET() {
  try {
    return NextResponse.json(await ambilDaftarKota(), { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { berat, asal, tujuan } = body;

    if (!berat || !asal || !tujuan) {
      return NextResponse.json(
        { error: "Berat, kota asal, dan kota tujuan wajib diisi!" },
        { status: 400 },
      );
    }

    const beratNum = Number(berat);
    if (!(beratNum > 0)) {
      return NextResponse.json(
        { error: "Berat barang harus lebih dari 0." },
        { status: 400 },
      );
    }

    const hasil = await hitungOngkir(String(asal), String(tujuan), beratNum);

    if (hasil.status === "asal-tidak-ditemukan") {
      return NextResponse.json(
        {
          error: `Kota asal "${asal}" tidak ditemukan.${
            hasil.saran.length
              ? ` Mungkin maksud Anda: ${hasil.saran.join(", ")}.`
              : ` Kota asal yang tersedia: ${hasil.tersedia.slice(0, 5).join(", ")}.`
          }`,
        },
        { status: 404 },
      );
    }

    if (hasil.status === "tujuan-tidak-ditemukan") {
      return NextResponse.json(
        {
          error: `Kota tujuan "${tujuan}" tidak ditemukan.${
            hasil.saran.length
              ? ` Mungkin maksud Anda: ${hasil.saran.join(", ")}.`
              : ""
          }`,
        },
        { status: 404 },
      );
    }

    if (hasil.status === "rute-tidak-ada") {
      return NextResponse.json(
        {
          error: `Tarif pengiriman dari ${hasil.asal} ke ${hasil.tujuan} belum tersedia.`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ layanan: hasil.layanan }, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
