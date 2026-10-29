"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Gauge,
  Coins,
  Cpu,
  Bot,
  ShieldAlert,
  Save,
  Loader2,
  Search,
  RotateCcw,
  SlidersHorizontal,
  X,
  Info,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";

type ModeLimit = "rupiah" | "token";

interface Pengaturan {
  aktif: boolean;
  mode: ModeLimit;
  limitRupiah: number;
  limitToken: number;
  hargaInputUsd: number;
  hargaOutputUsd: number;
  kursUsd: number;
  pesanLimit: string;
}

interface Ringkasan {
  sesi: number;
  tokenInput: number;
  tokenOutput: number;
  biaya: number;
  request: number;
  sesiLimit: number;
  sesiKustom: number;
  rataTokenPerRequest: number | null;
  rataBiayaPerRequest: number | null;
}

interface Sesi {
  id: number;
  nama: string;
  whatsapp: string;
  status: string;
  dibuat: string;
  tokenInput: number;
  tokenOutput: number;
  biaya: number;
  request: number;
  limitKustomRupiah: number | null;
  limitKustomToken: number | null;
  limitTercapaiAt: string | null;
}

type FilterSesi = "semua" | "dipakai" | "hampir" | "tercapai" | "kustom";

const ASUMSI_TOKEN_INPUT = 1000;
const ASUMSI_TOKEN_OUTPUT = 200;

const formatRupiah = (n: number) =>
  `Rp ${n.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: n > 0 && n < 10 ? 2 : 0,
  })}`;
const formatAngka = (n: number) => Math.round(n).toLocaleString("id-ID");

const kelasInput =
  "w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400";

const LimitTokenAi = () => {
  const [form, setForm] = useState<Pengaturan | null>(null);
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [daftarSesi, setDaftarSesi] = useState<Sesi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMenyimpan, setIsMenyimpan] = useState(false);
  const [adaPerubahan, setAdaPerubahan] = useState(false);

  const [pencarian, setPencarian] = useState("");
  const [filter, setFilter] = useState<FilterSesi>("semua");
  const [sesiDiatur, setSesiDiatur] = useState<Sesi | null>(null);
  const [inputLimitSesi, setInputLimitSesi] = useState("");

  const muat = useCallback(async (termasukPengaturan: boolean) => {
    try {
      const [resPengaturan, resSesi] = await Promise.all([
        fetch("/api/ai-token-limit", { cache: "no-store" }),
        fetch("/api/ai-token-limit/sesi", { cache: "no-store" }),
      ]);
      const dataPengaturan = await resPengaturan.json();
      const dataSesi = await resSesi.json();
      if (!resPengaturan.ok) throw new Error(dataPengaturan.error);
      if (!resSesi.ok) throw new Error(dataSesi.error);

      setRingkasan(dataPengaturan.ringkasan);
      setDaftarSesi(dataSesi);
      if (termasukPengaturan) {
        setForm(dataPengaturan.pengaturan);
        setAdaPerubahan(false);
      }
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Gagal memuat data limit token AI",
      );
    }
  }, []);

  useEffect(() => {
    const awal = setTimeout(() => muat(true), 0);
    const timer = setInterval(() => muat(false), 30_000);
    return () => {
      clearTimeout(awal);
      clearInterval(timer);
    };
  }, [muat]);

  const ubahForm = <K extends keyof Pengaturan>(
    kunci: K,
    nilai: Pengaturan[K],
  ) => {
    setForm((prev) => (prev ? { ...prev, [kunci]: nilai } : prev));
    setAdaPerubahan(true);
  };

  const handleSimpan = async () => {
    if (!form) return;
    setIsMenyimpan(true);
    try {
      const res = await fetch("/api/ai-token-limit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      Swal.fire({
        title: "Berhasil!",
        text: "Pengaturan limit token AI disimpan dan langsung berlaku.",
        icon: "success",
        confirmButtonColor: "#FFCC00",
        color: "#1f2937",
      });
      await muat(true);
    } catch (err) {
      Swal.fire(
        "Gagal",
        err instanceof Error ? err.message : "Gagal menyimpan",
        "error",
      );
    } finally {
      setIsMenyimpan(false);
    }
  };

  const limitSesi = (s: Sesi) => {
    if (!form) return { limit: 0, kustom: false };
    const kustom =
      form.mode === "token" ? s.limitKustomToken : s.limitKustomRupiah;
    return {
      limit:
        kustom !== null
          ? kustom
          : form.mode === "token"
            ? form.limitToken
            : form.limitRupiah,
      kustom: kustom !== null,
    };
  };
  const pemakaianSesi = (s: Sesi) =>
    form?.mode === "token" ? s.tokenInput + s.tokenOutput : s.biaya;
  const persenSesi = (s: Sesi) => {
    const { limit } = limitSesi(s);
    if (limit <= 0) return pemakaianSesi(s) > 0 ? 100 : 0;
    return Math.min(100, (pemakaianSesi(s) / limit) * 100);
  };
  const formatNilai = (n: number) =>
    form?.mode === "token" ? `${formatAngka(n)} token` : formatRupiah(n);

  const sesiTersaring = daftarSesi.filter((s) => {
    const q = pencarian.trim().toLowerCase();
    if (
      q &&
      !s.nama.toLowerCase().includes(q) &&
      !s.whatsapp.includes(q) &&
      String(s.id) !== q.replace("#", "")
    )
      return false;
    const persen = persenSesi(s);
    if (filter === "dipakai") return s.request > 0;
    if (filter === "hampir") return persen >= 80 && persen < 100;
    if (filter === "tercapai") return persen >= 100;
    if (filter === "kustom") return limitSesi(s).kustom;
    return true;
  });

  const simulasi = (() => {
    if (!form) return null;
    const dariData = ringkasan?.rataBiayaPerRequest != null;
    const tokenPerJawaban =
      ringkasan?.rataTokenPerRequest ??
      ASUMSI_TOKEN_INPUT + ASUMSI_TOKEN_OUTPUT;
    const biayaPerJawaban = dariData
      ? ringkasan!.rataBiayaPerRequest!
      : ((ASUMSI_TOKEN_INPUT * form.hargaInputUsd +
          ASUMSI_TOKEN_OUTPUT * form.hargaOutputUsd) /
          1_000_000) *
        form.kursUsd;
    const jawaban =
      form.mode === "token"
        ? tokenPerJawaban > 0
          ? Math.floor(form.limitToken / tokenPerJawaban)
          : 0
        : biayaPerJawaban > 0
          ? Math.floor(form.limitRupiah / biayaPerJawaban)
          : 0;
    return { dariData, tokenPerJawaban, biayaPerJawaban, jawaban };
  })();

  const bukaAturLimit = (s: Sesi) => {
    const { limit, kustom } = limitSesi(s);
    setInputLimitSesi(kustom ? String(limit) : "");
    setSesiDiatur(s);
  };

  const simpanLimitSesi = async (limit: number | null) => {
    if (!sesiDiatur || !form) return;
    if (limit !== null && !(limit >= 0)) {
      Swal.fire("Peringatan", "Limit harus angka 0 atau lebih.", "warning");
      return;
    }
    try {
      const res = await fetch(`/api/ai-token-limit/sesi/${sesiDiatur.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi: "atur-limit", mode: form.mode, limit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSesiDiatur(null);
      Swal.fire({
        title: "Berhasil!",
        text:
          limit === null
            ? "Sesi kembali memakai limit default."
            : "Limit khusus sesi disimpan.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
      await muat(false);
    } catch (err) {
      Swal.fire(
        "Gagal",
        err instanceof Error && err.message ? err.message : "Gagal menyimpan",
        "error",
      );
    }
  };

  const resetSesi = async (s: Sesi) => {
    const konfirmasi = await Swal.fire({
      title: "Reset pemakaian?",
      html: `Pemakaian AI sesi <b>#${s.id} ${s.nama}</b> akan dinolkan, sehingga customer bisa memakai AI lagi.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FFCC00",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Reset",
      cancelButtonText: "Batal",
      color: "#1f2937",
    });
    if (!konfirmasi.isConfirmed) return;
    try {
      const res = await fetch(`/api/ai-token-limit/sesi/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi: "reset" }),
      });
      if (!res.ok) throw new Error();
      await muat(false);
    } catch {
      Swal.fire("Gagal", "Gagal mereset pemakaian sesi", "error");
    }
  };

  if (!form) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm p-8 text-center text-sm text-gray-500">
        {error ? (
          <div className="space-y-3">
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={() => muat(true)}
              className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-bold px-4 py-2 rounded-md text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Coba Lagi
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Memuat pengaturan...
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white px-5 py-4 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Gauge size={22} className="text-yellow-600" />
            Limit Token AI
          </h2>
          <p className="text-sm text-gray-500">
            Batasi pemakaian chatbot AI (Gemini) per sesi chat customer agar
            biaya API terkendali.
          </p>
        </div>
        <span
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border ${
            form.aktif
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${form.aktif ? "bg-green-500" : "bg-gray-400"}`}
          ></span>
          {form.aktif
            ? `Limit aktif · ${formatNilai(form.mode === "token" ? form.limitToken : form.limitRupiah)} per sesi`
            : "Limit nonaktif"}
        </span>
      </div>

      {ringkasan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              ikon: <Coins size={20} />,
              judul: "Total biaya AI",
              nilai: formatRupiah(ringkasan.biaya),
              ket: `Dari ${formatAngka(ringkasan.sesi)} sesi yang memakai AI`,
            },
            {
              ikon: <Cpu size={20} />,
              judul: "Total token",
              nilai: formatAngka(ringkasan.tokenInput + ringkasan.tokenOutput),
              ket: `Input ${formatAngka(ringkasan.tokenInput)} · Output ${formatAngka(ringkasan.tokenOutput)}`,
            },
            {
              ikon: <Bot size={20} />,
              judul: "Jawaban AI (Gemini)",
              nilai: formatAngka(ringkasan.request),
              ket:
                ringkasan.rataBiayaPerRequest !== null
                  ? `Rata-rata ${formatRupiah(ringkasan.rataBiayaPerRequest)} · ${formatAngka(ringkasan.rataTokenPerRequest ?? 0)} token / jawaban`
                  : "Belum ada jawaban AI tercatat",
            },
            {
              ikon: <ShieldAlert size={20} />,
              judul: "Sesi mencapai limit",
              nilai: formatAngka(ringkasan.sesiLimit),
              ket: `${formatAngka(ringkasan.sesiKustom)} sesi memakai limit khusus`,
            },
          ].map((k) => (
            <div
              key={k.judul}
              className="bg-white p-4 rounded-sm border border-gray-200 border-t-4 border-t-gray-800 shadow-sm flex gap-3"
            >
              <div className="w-10 h-10 rounded-sm bg-gray-900 text-[#FFCC00] flex items-center justify-center shrink-0">
                {k.ikon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-semibold">{k.judul}</p>
                <p className="text-2xl font-extrabold text-gray-900 leading-tight tabular-nums">
                  {k.nilai}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">{k.ket}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-sm border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-yellow-600" />
              Pengaturan Default per Sesi
            </h3>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
              <span>Aktifkan limit</span>
              <button
                type="button"
                role="switch"
                aria-checked={form.aktif}
                onClick={() => ubahForm("aktif", !form.aktif)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  form.aktif ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.aktif ? "translate-x-5" : ""
                  }`}
                ></span>
              </button>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Batasi berdasarkan
            </label>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {(
                [
                  ["rupiah", "Biaya (Rupiah)", "mis. Rp 2.000 per sesi"],
                  ["token", "Jumlah token", "mis. 500.000 token per sesi"],
                ] as const
              ).map(([nilai, label, ket]) => (
                <button
                  key={nilai}
                  type="button"
                  onClick={() => ubahForm("mode", nilai)}
                  className={`text-left px-3 py-2 rounded-md border text-xs cursor-pointer transition-colors ${
                    form.mode === nilai
                      ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="block font-extrabold text-gray-900">
                    {label}
                  </span>
                  <span className="text-[11px] text-gray-500">{ket}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {form.mode === "token"
                  ? "Limit token per sesi"
                  : "Limit biaya per sesi (Rp)"}
              </label>
              <input
                type="number"
                min={0}
                step={form.mode === "token" ? 1000 : 100}
                value={
                  form.mode === "token" ? form.limitToken : form.limitRupiah
                }
                onChange={(e) =>
                  form.mode === "token"
                    ? ubahForm("limitToken", Number(e.target.value))
                    : ubahForm("limitRupiah", Number(e.target.value))
                }
                className={`${kelasInput} font-bold`}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Isi 0 untuk mematikan jawaban Gemini sepenuhnya (bot hanya
                menjawab dari Knowledge Base).
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Kurs USD → Rupiah
              </label>
              <input
                type="number"
                min={1}
                value={form.kursUsd}
                onChange={(e) => ubahForm("kursUsd", Number(e.target.value))}
                className={kelasInput}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Harga token input (USD per 1 juta token)
              </label>
              <input
                type="number"
                min={0}
                step="0.0001"
                value={form.hargaInputUsd}
                onChange={(e) =>
                  ubahForm("hargaInputUsd", Number(e.target.value))
                }
                className={kelasInput}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Harga token output (USD per 1 juta token)
              </label>
              <input
                type="number"
                min={0}
                step="0.0001"
                value={form.hargaOutputUsd}
                onChange={(e) =>
                  ubahForm("hargaOutputUsd", Number(e.target.value))
                }
                className={kelasInput}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Pesan ke customer saat limit tercapai
            </label>
            <textarea
              rows={3}
              value={form.pesanLimit}
              onChange={(e) => ubahForm("pesanLimit", e.target.value)}
              className={kelasInput}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <Info size={12} className="shrink-0" />
              Harga default hanya contoh. Sesuaikan dengan harga resmi model
              Gemini yang dipakai (Google AI Studio → Pricing).
            </p>
            <button
              type="button"
              onClick={handleSimpan}
              disabled={isMenyimpan || !adaPerubahan}
              className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-5 py-2.5 rounded-md text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMenyimpan ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Simpan Pengaturan
            </button>
          </div>
        </div>

        {simulasi && (
          <div className="bg-gray-950 text-white rounded-sm shadow-sm p-5 space-y-4">
            <h3 className="font-extrabold text-[#FFCC00] flex items-center gap-2">
              <Gauge size={16} /> Simulasi Limit
            </h3>
            <div>
              <p className="text-xs text-gray-400">
                Satu sesi customer kira-kira cukup untuk
              </p>
              <p className="text-3xl font-extrabold tabular-nums">
                ± {formatAngka(simulasi.jawaban)}
              </p>
              <p className="text-xs text-gray-300">jawaban AI (Gemini)</p>
            </div>
            <div className="text-xs space-y-1.5 border-t border-gray-800 pt-3">
              <p className="flex justify-between gap-2">
                <span className="text-gray-400">Biaya per jawaban</span>
                <b>{formatRupiah(simulasi.biayaPerJawaban)}</b>
              </p>
              <p className="flex justify-between gap-2">
                <span className="text-gray-400">Token per jawaban</span>
                <b>{formatAngka(simulasi.tokenPerJawaban)}</b>
              </p>
              <p className="flex justify-between gap-2">
                <span className="text-gray-400">Limit per sesi</span>
                <b>
                  {formatNilai(
                    form.mode === "token" ? form.limitToken : form.limitRupiah,
                  )}
                </b>
              </p>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {simulasi.dariData
                ? "Dihitung dari rata-rata pemakaian nyata yang sudah tercatat."
                : `Belum ada data nyata, memakai asumsi ${formatAngka(ASUMSI_TOKEN_INPUT)} token input + ${formatAngka(ASUMSI_TOKEN_OUTPUT)} token output per jawaban.`}{" "}
              Sapaan & jawaban dari Knowledge Base gratis dan tidak dihitung.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold text-gray-900 text-sm">
            Pemakaian per Sesi Chat
            <span className="text-xs text-gray-500 font-semibold ml-2">
              300 sesi terbaru · klik &quot;Atur Limit&quot; untuk limit khusus
              per sesi
            </span>
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white rounded-md px-3 py-1.5 border border-gray-300 focus-within:border-yellow-400 w-56">
              <Search size={14} className="text-gray-400 mr-2" />
              <input
                type="text"
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                placeholder="Cari nama, no WA, #ID..."
                className="w-full bg-transparent text-xs focus:outline-none text-gray-800"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterSesi)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="semua">Semua sesi</option>
              <option value="dipakai">Sudah memakai AI</option>
              <option value="hampir">Hampir habis (≥ 80%)</option>
              <option value="tercapai">Limit tercapai</option>
              <option value="kustom">Limit khusus</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-white text-gray-900 uppercase font-bold sticky top-0 border-b border-gray-200 z-10">
              <tr>
                <th className="px-4 py-2.5">Sesi</th>
                <th className="px-4 py-2.5 text-right">Jawaban AI</th>
                <th className="px-4 py-2.5 text-right">Token</th>
                <th className="px-4 py-2.5 text-right">Biaya</th>
                <th className="px-4 py-2.5 w-64">Pemakaian / Limit</th>
                <th className="px-4 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sesiTersaring.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Tidak ada sesi yang cocok.
                  </td>
                </tr>
              ) : (
                sesiTersaring.map((s) => {
                  const { limit, kustom } = limitSesi(s);
                  const persen = persenSesi(s);
                  const status =
                    persen >= 100
                      ? {
                          label: "Limit tercapai",
                          bar: "bg-red-600",
                          teks: "text-red-700",
                        }
                      : persen >= 80
                        ? {
                            label: "Hampir habis",
                            bar: "bg-orange-500",
                            teks: "text-orange-700",
                          }
                        : {
                            label: "Normal",
                            bar: "bg-[#FFCC00]",
                            teks: "text-gray-600",
                          };
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-gray-900">
                          <span className="text-gray-400 font-semibold">
                            #{s.id}
                          </span>{" "}
                          {s.nama}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {s.whatsapp} ·{" "}
                          {new Date(s.dibuat).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900 tabular-nums">
                        {formatAngka(s.request)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        <span className="font-bold text-gray-900">
                          {formatAngka(s.tokenInput + s.tokenOutput)}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          in {formatAngka(s.tokenInput)} · out{" "}
                          {formatAngka(s.tokenOutput)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900 tabular-nums">
                        {formatRupiah(s.biaya)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={`font-bold ${status.teks}`}>
                            {status.label} · {Math.round(persen)}%
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                              kustom
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {kustom ? "KHUSUS" : "DEFAULT"}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${status.bar}`}
                            style={{ width: `${persen}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {formatNilai(pemakaianSesi(s))} dari{" "}
                          {formatNilai(limit)}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => bukaAturLimit(s)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-sm text-[11px] font-bold cursor-pointer"
                          >
                            <SlidersHorizontal size={12} /> Atur Limit
                          </button>
                          <button
                            type="button"
                            onClick={() => resetSesi(s)}
                            disabled={s.request === 0}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-sm text-[11px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Nol-kan pemakaian sesi ini"
                          >
                            <RotateCcw size={12} /> Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sesiDiatur && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setSesiDiatur(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-extrabold text-gray-900">
              Limit Khusus Sesi
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              #{sesiDiatur.id} {sesiDiatur.nama} · {sesiDiatur.whatsapp}
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs space-y-1 mb-4">
              <p className="flex justify-between">
                <span className="text-gray-500">Pemakaian saat ini</span>
                <b>{formatNilai(pemakaianSesi(sesiDiatur))}</b>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Limit default</span>
                <b>
                  {formatNilai(
                    form.mode === "token" ? form.limitToken : form.limitRupiah,
                  )}
                </b>
              </p>
            </div>

            <label className="block text-xs font-bold text-gray-700 mb-1">
              {form.mode === "token"
                ? "Limit token khusus untuk sesi ini"
                : "Limit biaya khusus untuk sesi ini (Rp)"}
            </label>
            <input
              type="number"
              min={0}
              value={inputLimitSesi}
              onChange={(e) => setInputLimitSesi(e.target.value)}
              placeholder={`Kosongkan = pakai default (${formatNilai(
                form.mode === "token" ? form.limitToken : form.limitRupiah,
              )})`}
              className={`${kelasInput} font-bold`}
              autoFocus
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Mis. naikkan untuk pelanggan penting, atau isi 0 untuk
              menghentikan jawaban AI pada sesi ini.
            </p>

            <div className="flex gap-2 pt-5">
              <button
                type="button"
                onClick={() => simpanLimitSesi(null)}
                className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 rounded-md text-xs transition-colors cursor-pointer"
              >
                Pakai Default
              </button>
              <button
                type="button"
                onClick={() =>
                  simpanLimitSesi(
                    inputLimitSesi.trim() === ""
                      ? null
                      : Number(inputLimitSesi),
                  )
                }
                className="w-1/2 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold py-2.5 rounded-md text-xs transition-colors cursor-pointer"
              >
                Simpan Limit Khusus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LimitTokenAi;
