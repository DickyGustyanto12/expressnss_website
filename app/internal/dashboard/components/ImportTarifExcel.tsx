"use client";

import { useMemo, useRef, useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Plus,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Swal from "sweetalert2";
import type { WorkBook } from "xlsx";
import {
  analisaSheet,
  bacaBarisData,
  unduhTemplate,
  KOLOM_TEMPLATE,
  CONTOH_TEMPLATE,
  type AnalisaSheet,
  type PemetaanKolom,
} from "./import-tarif-excel";
import { AMBANG_KEMIRIPAN, skorKemiripanKota } from "@/lib/pencocokan-kota";

type XLSXModule = typeof import("xlsx");

interface TarifTersimpan {
  kota_asal: string;
  kota_tujuan: string;
  layanan: string;
}

interface ImportTarifExcelProps {
  daftarTarif: TarifTersimpan[];
  onTutup: () => void;
  onSelesai: () => void;
}

interface BarisEdit {
  id: number;
  baris: number | null;
  kotaAsal: string;
  kotaTujuan: string;
  layanan: string;
  berat: string;
  harga: string;
  dipilih: boolean;
}

type StatusBaris = { status: "baru" | "update" | "error"; pesan?: string };
type FilterStatus = "semua" | "baru" | "update" | "error" | "tidak-dipilih";

const layananOptions = ["REGULER", "NEXT"];
const MAKS_TAMPIL = 300;

const kunciTarif = (asal: string, tujuan: string, layanan: string) =>
  `${asal.trim().toLowerCase()}|${tujuan.trim().toLowerCase()}|${layanan}`;

const kelasInput =
  "w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400";
const kelasSel =
  "w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-yellow-400 focus:bg-white rounded text-xs text-gray-900 focus:outline-none";

const ImportTarifExcel = ({
  daftarTarif,
  onTutup,
  onSelesai,
}: ImportTarifExcelProps) => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const idBerikutnyaRef = useRef(1);

  const [XLSX, setXLSX] = useState<XLSXModule | null>(null);
  const [namaFile, setNamaFile] = useState("");
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [isMembaca, setIsMembaca] = useState(false);
  const [isMengimport, setIsMengimport] = useState(false);
  const [tampilkanContoh, setTampilkanContoh] = useState(false);

  const [namaSheet, setNamaSheet] = useState("");
  const [analisa, setAnalisa] = useState<AnalisaSheet | null>(null);
  const [pemetaan, setPemetaan] = useState<PemetaanKolom | null>(null);
  const [rapikanNama, setRapikanNama] = useState(true);

  const [baris, setBaris] = useState<BarisEdit[]>([]);
  const [adaPerubahan, setAdaPerubahan] = useState(false);

  const [pencarian, setPencarian] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");
  const [filterLayanan, setFilterLayanan] = useState("semua");
  const [massal, setMassal] = useState({
    kotaAsal: "",
    layanan: "",
    berat: "",
  });

  const muatBaris = (
    modul: XLSXModule,
    wb: WorkBook,
    sheet: string,
    a: AnalisaSheet,
    p: PemetaanKolom,
    rapikan: boolean,
  ) => {
    const data = bacaBarisData(modul, wb.Sheets[sheet], a, p, rapikan);
    setBaris(
      data.map((r, i) => ({
        id: i + 1,
        baris: r.baris,
        kotaAsal: r.kotaAsal || a.kotaAsalDefault,
        kotaTujuan: r.kotaTujuan,
        layanan: r.layanan || "REGULER",
        berat: String(r.berat ?? 1),
        harga: r.harga !== null ? String(r.harga) : "",
        dipilih: true,
      })),
    );
    idBerikutnyaRef.current = data.length + 1;
    setAdaPerubahan(false);
  };

  const pilihSheet = (modul: XLSXModule, wb: WorkBook, nama: string) => {
    const a = analisaSheet(modul, wb.Sheets[nama]);
    const p: PemetaanKolom | null =
      a && a.kolomKotaDefault !== null && a.kolomHargaDefault !== null
        ? {
            kota: a.kolomKotaDefault,
            harga: a.kolomHargaDefault,
            asal: a.kolomAsalDefault,
            layanan: a.kolomLayananDefault,
            berat: a.kolomBeratDefault,
          }
        : null;

    setNamaSheet(nama);
    setAnalisa(a);
    setPemetaan(p);
    setMassal({ kotaAsal: a?.kotaAsalDefault ?? "", layanan: "", berat: "" });
    setPencarian("");
    setFilterStatus("semua");
    setFilterLayanan("semua");

    if (a && p) muatBaris(modul, wb, nama, a, p, rapikanNama);
    else setBaris([]);
  };

  const handlePilihFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsMembaca(true);
    try {
      const modul = XLSX ?? (await import("xlsx"));
      setXLSX(modul);
      const wb = modul.read(await file.arrayBuffer());

      const bisaDibaca = (n: string) => analisaSheet(modul, wb.Sheets[n]);
      const sheetAwal =
        wb.SheetNames.find(
          (n) => /TARIF ONGKIR|REG/i.test(n) && bisaDibaca(n),
        ) ||
        wb.SheetNames.find((n) => bisaDibaca(n)) ||
        wb.SheetNames[0];

      setNamaFile(file.name);
      setWorkbook(wb);
      setTampilkanContoh(false);
      pilihSheet(modul, wb, sheetAwal);
    } catch {
      Swal.fire({
        title: "Gagal Membaca File",
        text: "Pastikan file berformat Excel (.xlsx / .xls) atau .csv dan tidak rusak.",
        icon: "error",
        confirmButtonColor: "#FFCC00",
        color: "#1f2937",
      });
    } finally {
      setIsMembaca(false);
    }
  };

  const handleUnduhTemplate = async () => {
    const modul = XLSX ?? (await import("xlsx"));
    setXLSX(modul);
    unduhTemplate(modul);
  };

  const konfirmasiMuatUlang = async () => {
    if (!adaPerubahan) return true;
    const hasil = await Swal.fire({
      title: "Muat Ulang Data?",
      text: "Perubahan yang Anda edit di tabel akan hilang dan data dibaca ulang dari Excel.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FFCC00",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Muat Ulang",
      cancelButtonText: "Batal",
      color: "#1f2937",
    });
    return hasil.isConfirmed;
  };

  const handleGantiSheet = async (nama: string) => {
    if (!XLSX || !workbook || !(await konfirmasiMuatUlang())) return;
    pilihSheet(XLSX, workbook, nama);
  };

  const handleUbahPemetaan = async (
    field: keyof PemetaanKolom,
    nilai: string,
  ) => {
    if (!XLSX || !workbook || !analisa || !pemetaan) return;
    if (!(await konfirmasiMuatUlang())) return;
    const baru = { ...pemetaan, [field]: nilai === "" ? null : Number(nilai) };
    if (baru.kota === null || baru.harga === null) return;
    setPemetaan(baru);
    muatBaris(XLSX, workbook, namaSheet, analisa, baru, rapikanNama);
  };

  const handleUbahRapikan = async (nilai: boolean) => {
    if (!XLSX || !workbook || !analisa || !pemetaan) return;
    if (!(await konfirmasiMuatUlang())) return;
    setRapikanNama(nilai);
    muatBaris(XLSX, workbook, namaSheet, analisa, pemetaan, nilai);
  };

  const ubahBaris = (
    id: number,
    field: keyof Omit<BarisEdit, "id" | "baris">,
    nilai: string | boolean,
  ) => {
    setBaris((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: nilai } : b)),
    );
    if (field !== "dipilih") setAdaPerubahan(true);
  };

  const hapusBaris = (id: number) => {
    setBaris((prev) => prev.filter((b) => b.id !== id));
    setAdaPerubahan(true);
  };

  const tambahBaris = () => {
    const id = idBerikutnyaRef.current++;
    setBaris((prev) => [
      {
        id,
        baris: null,
        kotaAsal: massal.kotaAsal,
        kotaTujuan: "",
        layanan: "REGULER",
        berat: "1",
        harga: "",
        dipilih: true,
      },
      ...prev,
    ]);
    setPencarian("");
    setFilterStatus("semua");
    setFilterLayanan("semua");
    setAdaPerubahan(true);
  };

  const statusBaris = useMemo(() => {
    const tarifAda = new Set(
      daftarTarif.map((t) => kunciTarif(t.kota_asal, t.kota_tujuan, t.layanan)),
    );
    const sudahDipakai = new Map<string, BarisEdit>();
    const hasil = new Map<number, StatusBaris>();

    for (const b of baris) {
      let pesan = "";
      if (!b.kotaAsal.trim()) pesan = "Kota asal kosong";
      else if (!b.kotaTujuan.trim()) pesan = "Kota tujuan kosong";
      else if (!layananOptions.includes(b.layanan))
        pesan = "Layanan harus REGULER / NEXT";
      else if (!(Number(b.berat) > 0)) pesan = "Berat tidak valid";
      else if (!(Number(b.harga) > 0)) pesan = "Harga tidak valid";

      const kunci = kunciTarif(b.kotaAsal, b.kotaTujuan, b.layanan);
      if (!pesan && b.dipilih) {
        const sebelumnya = sudahDipakai.get(kunci);
        if (sebelumnya) {
          pesan = `Rute sama dengan ${
            sebelumnya.baris ? `baris ${sebelumnya.baris}` : "baris manual"
          }`;
        } else {
          sudahDipakai.set(kunci, b);
        }
      }

      hasil.set(
        b.id,
        pesan
          ? { status: "error", pesan }
          : { status: tarifAda.has(kunci) ? "update" : "baru" },
      );
    }
    return hasil;
  }, [baris, daftarTarif]);

  const barisTersaring = baris.filter((b) => {
    const s = statusBaris.get(b.id)?.status;
    if (filterStatus === "tidak-dipilih" && b.dipilih) return false;
    if (
      filterStatus !== "semua" &&
      filterStatus !== "tidak-dipilih" &&
      (!b.dipilih || s !== filterStatus)
    )
      return false;
    if (filterLayanan !== "semua" && b.layanan !== filterLayanan) return false;

    const q = pencarian.trim().toLowerCase();
    if (!q) return true;
    return (
      b.kotaAsal.toLowerCase().includes(q) ||
      b.kotaTujuan.toLowerCase().includes(q) ||
      b.harga.includes(q) ||
      skorKemiripanKota(q, b.kotaTujuan) >= AMBANG_KEMIRIPAN ||
      skorKemiripanKota(q, b.kotaAsal) >= AMBANG_KEMIRIPAN
    );
  });
  const barisDitampilkan = barisTersaring.slice(0, MAKS_TAMPIL);

  const barisDipilih = baris.filter((b) => b.dipilih);
  const barisSiap = barisDipilih.filter(
    (b) => statusBaris.get(b.id)?.status !== "error",
  );
  const hitung = (s: StatusBaris["status"]) =>
    barisDipilih.filter((b) => statusBaris.get(b.id)?.status === s).length;
  const jumlahBaru = hitung("baru");
  const jumlahUpdate = hitung("update");
  const jumlahError = hitung("error");
  const jumlahTidakDipilih = baris.length - barisDipilih.length;

  const semuaTersaringDipilih =
    barisTersaring.length > 0 && barisTersaring.every((b) => b.dipilih);

  const togglePilihTersaring = () => {
    const ids = new Set(barisTersaring.map((b) => b.id));
    setBaris((prev) =>
      prev.map((b) =>
        ids.has(b.id) ? { ...b, dipilih: !semuaTersaringDipilih } : b,
      ),
    );
  };

  const terapkanMassal = () => {
    const ids = new Set(
      barisTersaring.filter((b) => b.dipilih).map((b) => b.id),
    );
    if (ids.size === 0) return;
    setBaris((prev) =>
      prev.map((b) =>
        ids.has(b.id)
          ? {
              ...b,
              kotaAsal: massal.kotaAsal.trim() || b.kotaAsal,
              layanan: massal.layanan || b.layanan,
              berat: massal.berat.trim() || b.berat,
            }
          : b,
      ),
    );
    setAdaPerubahan(true);
  };

  const handleImport = async () => {
    const konfirmasi = await Swal.fire({
      title: "Import Tarif?",
      html:
        `<b>${barisSiap.length}</b> tarif akan disimpan:<br/>${jumlahBaru} tarif baru, ${jumlahUpdate} tarif diperbarui harganya.` +
        (jumlahError > 0
          ? `<br/><span style="color:#dc2626">${jumlahError} baris error tidak ikut diimport.</span>`
          : ""),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#FFCC00",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Import",
      cancelButtonText: "Batal",
      color: "#1f2937",
    });
    if (!konfirmasi.isConfirmed) return;

    try {
      setIsMengimport(true);
      const response = await fetch("/api/tarif-ongkir/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: barisSiap.map((b) => ({
            kota_asal: b.kotaAsal.trim(),
            kota_tujuan: b.kotaTujuan.trim(),
            layanan: b.layanan,
            berat: Number(b.berat),
            harga_ongkir: Number(b.harga),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengimport data tarif");
      }

      Swal.fire({
        title: "Import Berhasil!",
        text: `${data.ditambah} tarif baru ditambahkan, ${data.diperbarui} tarif diperbarui.`,
        icon: "success",
        confirmButtonColor: "#FFCC00",
        color: "#1f2937",
      });
      onSelesai();
    } catch (error) {
      Swal.fire(
        "Gagal",
        error instanceof Error ? error.message : "Terjadi kesalahan",
        "error",
      );
    } finally {
      setIsMengimport(false);
    }
  };

  const contohFormat = (
    <div className="border border-yellow-200 bg-yellow-50/60 rounded-lg p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
          <Info size={16} className="text-yellow-700" />
          Contoh Struktur Excel
        </h4>
        <button
          type="button"
          onClick={handleUnduhTemplate}
          className="bg-white hover:bg-green-50 text-green-700 border border-green-300 font-extrabold px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all cursor-pointer w-max"
        >
          <Download size={14} />
          Unduh Template Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs border border-gray-300 bg-white min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1.5 border border-gray-300 text-gray-400 w-8"></th>
              {KOLOM_TEMPLATE.map((k, i) => (
                <th
                  key={k}
                  className="px-3 py-1.5 border border-gray-300 text-left font-extrabold text-gray-900"
                >
                  <span className="text-gray-400 font-normal mr-1">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONTOH_TEMPLATE.map((row, i) => (
              <tr key={i}>
                <td className="px-2 py-1.5 border border-gray-300 text-gray-400 text-center bg-gray-50">
                  {i + 2}
                </td>
                {row.map((sel, j) => (
                  <td
                    key={j}
                    className={`px-3 py-1.5 border border-gray-300 text-gray-800 ${
                      typeof sel === "number" ? "text-right" : ""
                    }`}
                  >
                    {sel}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="text-[11px] text-gray-700 space-y-1 list-disc pl-4">
        <li>
          Baris pertama berisi <b>judul kolom</b>, data mulai baris kedua.
        </li>
        <li>
          <b>Wajib:</b> KOTA TUJUAN dan HARGA (RP). <b>Opsional:</b> KOTA ASAL,
          LAYANAN (REGULER / NEXT), BERAT (KG). Jika kosong, bisa diisi lewat
          &quot;Ubah Massal&quot; setelah upload.
        </li>
        <li>
          Harga ditulis angka, mis. <b>13915</b> (13.915 atau Rp 13.915 juga
          bisa).
        </li>
        <li>
          File lain (mis. file kenaikan harga dari pusat) juga bisa: pilih sheet
          dan kolomnya secara manual di bagian Pengaturan Kolom.
        </li>
        <li>
          Rute yang sama (asal + tujuan + layanan) yang sudah ada akan{" "}
          <b>diperbarui harganya</b>, tidak dobel.
        </li>
      </ul>
    </div>
  );

  const pilihanKolom = (opsional: boolean) => (
    <>
      {opsional && <option value="">— Tidak ada (isi manual) —</option>}
      {analisa?.kolom.map((k) => (
        <option key={k.index} value={k.index}>
          {k.label}
        </option>
      ))}
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full h-[94vh] p-6 relative shadow-2xl flex flex-col">
        <button
          onClick={onTutup}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet size={20} className="text-green-600" />
          Import Tarif dari Excel
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Upload file, periksa & edit datanya di tabel, lalu tekan Import. Data
          belum tersimpan sebelum tombol Import ditekan.
        </p>

        <input
          ref={inputFileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handlePilihFile}
          className="hidden"
        />

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1">
          {!workbook ? (
            <>
              <button
                type="button"
                onClick={() => inputFileRef.current?.click()}
                disabled={isMembaca}
                className="border-2 border-dashed border-gray-300 hover:border-yellow-400 hover:bg-yellow-50 rounded-xl py-10 flex flex-col items-center justify-center gap-2 text-gray-600 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isMembaca ? (
                  <Loader2 size={28} className="animate-spin text-yellow-600" />
                ) : (
                  <Upload size={28} className="text-yellow-600" />
                )}
                <span className="text-sm font-bold">
                  {isMembaca ? "Membaca file..." : "Pilih file Excel"}
                </span>
                <span className="text-[11px] text-gray-400">
                  Format .xlsx, .xls, atau .csv
                </span>
              </button>
              {contohFormat}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs shrink-0">
                <span className="font-bold text-gray-800 truncate flex items-center gap-1.5">
                  <FileSpreadsheet
                    size={14}
                    className="text-green-600 shrink-0"
                  />
                  {namaFile}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTampilkanContoh((v) => !v)}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-bold cursor-pointer"
                  >
                    <Info size={12} />
                    {tampilkanContoh ? "Tutup" : "Lihat"} Contoh Format
                    {tampilkanContoh ? (
                      <ChevronUp size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => inputFileRef.current?.click()}
                    className="flex items-center gap-1 text-yellow-700 hover:text-yellow-800 font-bold cursor-pointer"
                  >
                    <RefreshCw size={12} /> Ganti File
                  </button>
                </div>
              </div>

              {tampilkanContoh && contohFormat}

              <div className="border border-gray-200 rounded-lg p-3 shrink-0">
                <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">
                  Pengaturan Kolom
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Sheet
                    </label>
                    <select
                      value={namaSheet}
                      onChange={(e) => handleGantiSheet(e.target.value)}
                      className={kelasInput}
                    >
                      {workbook.SheetNames.map((nama) => (
                        <option key={nama} value={nama}>
                          {nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Kolom Kota Tujuan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={pemetaan?.kota ?? ""}
                      onChange={(e) =>
                        handleUbahPemetaan("kota", e.target.value)
                      }
                      disabled={!pemetaan}
                      className={kelasInput}
                    >
                      {pilihanKolom(false)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Kolom Harga <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={pemetaan?.harga ?? ""}
                      onChange={(e) =>
                        handleUbahPemetaan("harga", e.target.value)
                      }
                      disabled={!pemetaan}
                      className={kelasInput}
                    >
                      {pilihanKolom(false)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Kolom Kota Asal
                    </label>
                    <select
                      value={pemetaan?.asal ?? ""}
                      onChange={(e) =>
                        handleUbahPemetaan("asal", e.target.value)
                      }
                      disabled={!pemetaan}
                      className={kelasInput}
                    >
                      {pilihanKolom(true)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Kolom Layanan
                    </label>
                    <select
                      value={pemetaan?.layanan ?? ""}
                      onChange={(e) =>
                        handleUbahPemetaan("layanan", e.target.value)
                      }
                      disabled={!pemetaan}
                      className={kelasInput}
                    >
                      {pilihanKolom(true)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Kolom Berat
                    </label>
                    <select
                      value={pemetaan?.berat ?? ""}
                      onChange={(e) =>
                        handleUbahPemetaan("berat", e.target.value)
                      }
                      disabled={!pemetaan}
                      className={kelasInput}
                    >
                      {pilihanKolom(true)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={rapikanNama}
                    onChange={(e) => handleUbahRapikan(e.target.checked)}
                    disabled={!pemetaan}
                    className="accent-yellow-500"
                  />
                  Rapikan nama kota (KAB. KLATEN → Kab. Klaten)
                </label>
              </div>

              {!pemetaan ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-3 text-xs shrink-0">
                  <AlertCircle size={16} className="shrink-0" />
                  Sheet ini tidak berisi tabel kota yang dikenali (butuh judul
                  kolom seperti &quot;KOTA TUJUAN&quot;, &quot;NAMA KOTA&quot;
                  atau &quot;KOTA/KAB&quot;). Pilih sheet lain atau lihat contoh
                  format.
                </div>
              ) : (
                <>
                  <div className="border border-gray-200 rounded-lg p-3 shrink-0">
                    <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">
                      Ubah Massal{" "}
                      <span className="normal-case font-semibold">
                        (berlaku untuk baris yang dicentang & sedang tampil)
                      </span>
                    </p>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="w-44">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Kota Asal
                        </label>
                        <input
                          type="text"
                          value={massal.kotaAsal}
                          onChange={(e) =>
                            setMassal({ ...massal, kotaAsal: e.target.value })
                          }
                          placeholder="mis. Semarang"
                          className={kelasInput}
                        />
                      </div>
                      <div className="w-36">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Layanan
                        </label>
                        <select
                          value={massal.layanan}
                          onChange={(e) =>
                            setMassal({ ...massal, layanan: e.target.value })
                          }
                          className={kelasInput}
                        >
                          <option value="">— Tidak diubah —</option>
                          {layananOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Berat (Kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={massal.berat}
                          onChange={(e) =>
                            setMassal({ ...massal, berat: e.target.value })
                          }
                          placeholder="mis. 1"
                          className={kelasInput}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={terapkanMassal}
                        className="bg-gray-950 hover:bg-gray-900 text-[#FFCC00] font-bold px-4 py-2 rounded-md text-xs transition-colors cursor-pointer"
                      >
                        Terapkan ke{" "}
                        {barisTersaring.filter((b) => b.dipilih).length} baris
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 border border-gray-200 focus-within:border-yellow-400 focus-within:bg-white transition-all flex-1 min-w-48">
                      <Search size={14} className="text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={pencarian}
                        onChange={(e) => setPencarian(e.target.value)}
                        placeholder="Cari kota asal / tujuan / harga..."
                        className="w-full bg-transparent text-xs focus:outline-none text-gray-800"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) =>
                        setFilterStatus(e.target.value as FilterStatus)
                      }
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="semua">
                        Semua status ({baris.length})
                      </option>
                      <option value="baru">Baru ({jumlahBaru})</option>
                      <option value="update">
                        Diperbarui ({jumlahUpdate})
                      </option>
                      <option value="error">Error ({jumlahError})</option>
                      <option value="tidak-dipilih">
                        Tidak dicentang ({jumlahTidakDipilih})
                      </option>
                    </select>
                    <select
                      value={filterLayanan}
                      onChange={(e) => setFilterLayanan(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="semua">Semua layanan</option>
                      {layananOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={tambahBaris}
                      className="bg-white hover:bg-yellow-50 text-gray-800 border border-gray-300 font-bold px-3 py-2 rounded-md text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus size={14} /> Tambah Baris
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] font-bold shrink-0">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-sm">
                      {jumlahBaru} baru
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-sm">
                      {jumlahUpdate} diperbarui
                    </span>
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-sm">
                      {jumlahError} error (perlu diperbaiki)
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-sm">
                      {jumlahTidakDipilih} tidak dicentang
                    </span>
                    <span className="text-gray-400 font-semibold px-1 py-1">
                      Klik sel untuk mengedit
                    </span>
                  </div>

                  <div className="border border-gray-200 rounded-md overflow-auto min-h-72 flex-1">
                    <table className="w-full text-left text-xs text-gray-600">
                      <thead className="bg-gray-50 text-gray-900 uppercase font-bold sticky top-0 border-b border-gray-200 z-10">
                        <tr>
                          <th className="px-3 py-2 w-8">
                            <input
                              type="checkbox"
                              checked={semuaTersaringDipilih}
                              onChange={togglePilihTersaring}
                              className="accent-yellow-500"
                              title="Centang / hapus centang semua yang tampil"
                            />
                          </th>
                          <th className="px-2 py-2 w-14">Baris</th>
                          <th className="px-2 py-2">Kota Asal</th>
                          <th className="px-2 py-2">Kota Tujuan</th>
                          <th className="px-2 py-2 w-28">Layanan</th>
                          <th className="px-2 py-2 w-24">Berat (Kg)</th>
                          <th className="px-2 py-2 w-32">Harga (Rp)</th>
                          <th className="px-2 py-2 w-44">Status</th>
                          <th className="px-2 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {barisDitampilkan.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-3 py-6 text-center text-gray-400"
                            >
                              {baris.length === 0
                                ? "Tidak ada baris data pada sheet ini."
                                : "Tidak ada baris yang cocok dengan pencarian / filter."}
                            </td>
                          </tr>
                        ) : (
                          barisDitampilkan.map((b) => {
                            const s = statusBaris.get(b.id);
                            const redup = !b.dipilih;
                            return (
                              <tr
                                key={b.id}
                                className={
                                  redup
                                    ? "bg-gray-50 opacity-60"
                                    : s?.status === "error"
                                      ? "bg-red-50/60"
                                      : "hover:bg-gray-50"
                                }
                              >
                                <td className="px-3 py-1">
                                  <input
                                    type="checkbox"
                                    checked={b.dipilih}
                                    onChange={(e) =>
                                      ubahBaris(
                                        b.id,
                                        "dipilih",
                                        e.target.checked,
                                      )
                                    }
                                    className="accent-yellow-500"
                                  />
                                </td>
                                <td className="px-2 py-1 text-gray-400">
                                  {b.baris ?? "baru"}
                                </td>
                                <td className="px-1 py-1">
                                  <input
                                    type="text"
                                    value={b.kotaAsal}
                                    onChange={(e) =>
                                      ubahBaris(
                                        b.id,
                                        "kotaAsal",
                                        e.target.value,
                                      )
                                    }
                                    className={kelasSel}
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <input
                                    type="text"
                                    value={b.kotaTujuan}
                                    onChange={(e) =>
                                      ubahBaris(
                                        b.id,
                                        "kotaTujuan",
                                        e.target.value,
                                      )
                                    }
                                    className={`${kelasSel} font-bold`}
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <select
                                    value={b.layanan}
                                    onChange={(e) =>
                                      ubahBaris(b.id, "layanan", e.target.value)
                                    }
                                    className={kelasSel}
                                  >
                                    {!layananOptions.includes(b.layanan) && (
                                      <option value={b.layanan}>
                                        {b.layanan || "(kosong)"}
                                      </option>
                                    )}
                                    {layananOptions.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-1 py-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={b.berat}
                                    onChange={(e) =>
                                      ubahBaris(b.id, "berat", e.target.value)
                                    }
                                    className={kelasSel}
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <input
                                    type="number"
                                    value={b.harga}
                                    onChange={(e) =>
                                      ubahBaris(b.id, "harga", e.target.value)
                                    }
                                    className={`${kelasSel} font-bold`}
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  {!b.dipilih ? (
                                    <span className="text-[10px] text-gray-500 font-bold">
                                      TIDAK DIIMPORT
                                    </span>
                                  ) : s?.status === "error" ? (
                                    <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                                      <AlertCircle
                                        size={12}
                                        className="shrink-0"
                                      />
                                      {s.pesan}
                                    </span>
                                  ) : s?.status === "update" ? (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm font-bold text-[10px]">
                                      UPDATE
                                    </span>
                                  ) : (
                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-sm font-bold text-[10px]">
                                      BARU
                                    </span>
                                  )}
                                </td>
                                <td className="px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => hapusBaris(b.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors cursor-pointer"
                                    title="Hapus baris"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                    {barisTersaring.length > MAKS_TAMPIL && (
                      <p className="text-[11px] text-gray-500 text-center py-2 bg-gray-50 border-t border-gray-200">
                        Menampilkan {MAKS_TAMPIL} dari {barisTersaring.length}{" "}
                        baris. Gunakan pencarian / filter untuk melihat sisanya.
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 pt-4 justify-end shrink-0">
          <button
            type="button"
            onClick={onTutup}
            className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 rounded-md text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!pemetaan || barisSiap.length === 0 || isMengimport}
            className="px-6 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold py-2.5 rounded-md text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMengimport ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Import {barisSiap.length} Tarif
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportTarifExcel;
