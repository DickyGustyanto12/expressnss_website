"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Truck,
  X,
  Loader2,
  ChevronDown,
  FileSpreadsheet,
  Settings,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";
import ImportTarifExcel from "./ImportTarifExcel";

interface TarifItem {
  id: number;
  kota_asal: string;
  kota_tujuan: string;
  layanan: string;
  berat: number;
  harga_ongkir: number;
}

interface LayananItem {
  id: number;
  nama_layanan: string;
  estimasi: string;
}

const TarifOngkir = () => {
  const [daftarTarif, setDaftarTarif] = useState<TarifItem[]>([]);
  const [pencarian, setPencarian] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [modalFormBuka, setModalFormBuka] = useState(false);
  const [modeEdit, setModeEdit] = useState(false);
  const [formId, setFormId] = useState<number | null>(null);
  const [formAsal, setFormAsal] = useState("");
  const [formTujuan, setFormTujuan] = useState("");
  const [formLayanan, setFormLayanan] = useState("");
  const [dropdownBuka, setDropdownBuka] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [formBerat, setFormBerat] = useState("");
  const [formHarga, setFormHarga] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalImportBuka, setModalImportBuka] = useState(false);

  const [daftarLayanan, setDaftarLayanan] = useState<LayananItem[]>([]);
  const [modalLayananBuka, setModalLayananBuka] = useState(false);
  const [isLayananLoading, setIsLayananLoading] = useState(false);
  const [modeEditLayanan, setModeEditLayanan] = useState(false);
  const [formLayananId, setFormLayananId] = useState<number | null>(null);
  const [formNamaLayanan, setFormNamaLayanan] = useState("");
  const [formEstimasi, setFormEstimasi] = useState("");

  const layananOptions = daftarLayanan.map((l) => l.nama_layanan);

  const ambilDataTarif = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tarif-ongkir");
      if (!response.ok) throw new Error("Gagal memuat data tarif");
      const data = await response.json();
      setDaftarTarif(data);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const ambilDataLayanan = async () => {
    try {
      setIsLayananLoading(true);
      const response = await fetch("/api/layanan");
      if (!response.ok) throw new Error("Gagal memuat data layanan_estimasi");
      const data = await response.json();
      setDaftarLayanan(data);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLayananLoading(false);
    }
  };

  useEffect(() => {
    ambilDataTarif();
    ambilDataLayanan();
  }, []);

  const tarifTersaring = daftarTarif.filter(
    (item) =>
      item.kota_asal.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.kota_tujuan.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.layanan.toLowerCase().includes(pencarian.toLowerCase()),
  );

  const bukaModalTambah = () => {
    setModeEdit(false);
    setFormId(null);
    setFormAsal("");
    setFormTujuan("");
    setFormLayanan(layananOptions[0] || "");
    setSelectedIndex(0);
    setFormBerat("");
    setFormHarga("");
    setDropdownBuka(false);
    setModalFormBuka(true);
  };

  const bukaModalEdit = (item: TarifItem) => {
    setModeEdit(true);
    setFormId(item.id);
    setFormAsal(item.kota_asal);
    setFormTujuan(item.kota_tujuan);
    setFormLayanan(item.layanan);
    setSelectedIndex(
      layananOptions.indexOf(item.layanan) >= 0
        ? layananOptions.indexOf(item.layanan)
        : 0,
    );
    setFormBerat(item.berat ? item.berat.toString() : "");
    setFormHarga(item.harga_ongkir.toString());
    setDropdownBuka(false);
    setModalFormBuka(true);
  };

  const handleKeyDownDropdown = (e: React.KeyboardEvent) => {
    if (!dropdownBuka) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setDropdownBuka(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % layananOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + layananOptions.length) % layananOptions.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (layananOptions[selectedIndex]) {
        setFormLayanan(layananOptions[selectedIndex]);
      }
      setDropdownBuka(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDropdownBuka(false);
    }
  };

  const handleSimpanTarif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formAsal.trim() ||
      !formTujuan.trim() ||
      !formLayanan.trim() ||
      !formBerat ||
      !formHarga
    ) {
      Swal.fire({
        title: "Peringatan",
        text: "Semua kolom wajib diisi dengan benar!",
        icon: "warning",
        confirmButtonColor: "#FFCC00",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const url = "/api/tarif-ongkir";
      const method = modeEdit ? "PUT" : "POST";
      const bodyData = {
        id: formId,
        kota_asal: formAsal.toUpperCase(),
        kota_tujuan: formTujuan.toUpperCase(),
        layanan: formLayanan.toUpperCase(),
        berat: Number(formBerat),
        harga_ongkir: Number(formHarga),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Gagal menyimpan");

      Swal.fire({
        title: "Berhasil!",
        text: modeEdit ? "Data tarif diperbarui." : "Tarif baru ditambahkan.",
        icon: "success",
        confirmButtonColor: "#FFCC00",
      });

      setModalFormBuka(false);
      ambilDataTarif();
    } catch (error: any) {
      Swal.fire("Gagal", error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHapusTarif = (id: number) => {
    Swal.fire({
      title: "Hapus Tarif?",
      text: "Data tarif ongkir ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/tarif-ongkir?id=${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Gagal menghapus data");
          Swal.fire("Terhapus!", "Data tarif berhasil dihapus.", "success");
          ambilDataTarif();
        } catch (error: any) {
          Swal.fire("Gagal", error.message, "error");
        }
      }
    });
  };

  const resetFormLayanan = () => {
    setModeEditLayanan(false);
    setFormLayananId(null);
    setFormNamaLayanan("");
    setFormEstimasi("");
  };

  const handleSimpanLayanan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaLayanan.trim() || !formEstimasi.trim()) {
      Swal.fire("Peringatan", "Nama layanan dan estimasi wajib diisi", "warning");
      return;
    }

    try {
      setIsLayananLoading(true);
      const url = "/api/layanan";
      const method = modeEditLayanan ? "PUT" : "POST";
      const bodyData = {
        id: formLayananId,
        nama_layanan: formNamaLayanan.toUpperCase(),
        estimasi: formEstimasi,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) throw new Error("Gagal menyimpan data ke database layanan_estimasi");

      resetFormLayanan();
      ambilDataLayanan();
      Swal.fire("Berhasil", "Data layanan_estimasi berhasil disinkronkan", "success");
    } catch (error: any) {
      Swal.fire("Gagal", error.message, "error");
    } finally {
      setIsLayananLoading(false);
    }
  };

  const handleHapusLayanan = (id: number) => {
    Swal.fire({
      title: "Hapus Layanan?",
      text: "Data dari tabel layanan_estimasi akan dihapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setIsLayananLoading(true);
          const response = await fetch(`/api/layanan?id=${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Gagal menghapus layanan");
          
          ambilDataLayanan();
          Swal.fire("Terhapus!", "Data layanan_estimasi berhasil dihapus.", "success");
        } catch (error: any) {
          Swal.fire("Gagal", error.message, "error");
        } finally {
          setIsLayananLoading(false);
        }
      }
    });
  };

  const bukaEditLayanan = (item: LayananItem) => {
    setModeEditLayanan(true);
    setFormLayananId(item.id);
    setFormNamaLayanan(item.nama_layanan);
    setFormEstimasi(item.estimasi);
  };

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="bg-white px-5 py-3 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00] shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">
            Manajemen Tarif Ongkir & Estimasi
          </h2>
          <p className="text-xs text-gray-500">
            Kelola daftar harga ongkos kirim dan sinkronisasi data dari tabel layanan_estimasi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModalLayananBuka(true)}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-extrabold px-4 py-2 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Settings size={16} />
            <span>Ubah Estimasi Hari Layanan</span>
          </button>
          <button
            onClick={() => setModalImportBuka(true)}
            className="bg-white hover:bg-green-50 text-green-700 border border-green-300 font-extrabold px-4 py-2 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Import Excel</span>
          </button>
          <button
            onClick={bukaModalTambah}
            className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-4 py-2 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Tarif Baru</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 border border-gray-200 focus-within:border-yellow-400 focus-within:bg-white transition-all max-w-md">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Cari kota asal, tujuan, atau layanan..."
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              className="w-full bg-transparent text-xs focus:outline-none text-gray-800"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-900 uppercase font-bold sticky top-0 border-b border-gray-200 z-10">
              <tr>
                <th className="px-5 py-3">Kota Asal</th>
                <th className="px-5 py-3">Kota Tujuan</th>
                <th className="px-5 py-3">Layanan</th>
                <th className="px-5 py-3">Koli / Berat</th>
                <th className="px-5 py-3">Harga</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Memuat data tarif...
                    </div>
                  </td>
                </tr>
              ) : tarifTersaring.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    Tidak ada data tarif ongkir yang ditemukan.
                  </td>
                </tr>
              ) : (
                tarifTersaring.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-bold text-gray-900 flex items-center gap-1.5">
                      <Truck size={14} className="text-yellow-600" />
                      {item.kota_asal}
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900">
                      {item.kota_tujuan}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-sm font-bold text-[10px] bg-gray-100 text-gray-800 border border-gray-200">
                        {item.layanan}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      {item.berat ?? 0}
                    </td>
                    <td className="px-5 py-3 font-black text-gray-950">
                      Rp {Number(item.harga_ongkir).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => bukaModalEdit(item)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleHapusTarif(item.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-sm transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalFormBuka && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setModalFormBuka(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-4">
              {modeEdit ? "Edit Tarif Ongkir" : "Tambah Tarif Ongkir Baru"}
            </h3>

            <form onSubmit={handleSimpanTarif} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pilih Layanan (Sinkron dari database layanan_estimasi)
                </label>
                <button
                  type="button"
                  onClick={() => setDropdownBuka(!dropdownBuka)}
                  onKeyDown={handleKeyDownDropdown}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-bold text-gray-800 cursor-pointer flex justify-between items-center transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 border border-gray-200 text-gray-800">
                    {formLayanan || "-- Pilih Layanan --"}
                  </span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                {dropdownBuka && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden py-1 max-h-40 overflow-y-auto">
                    {layananOptions.map((opt, idx) => (
                      <div
                        key={opt}
                        onClick={() => {
                          setFormLayanan(opt);
                          setSelectedIndex(idx);
                          setDropdownBuka(false);
                        }}
                        className={`px-3 py-2.5 text-xs cursor-pointer transition-colors hover:bg-gray-100 flex items-center ${
                          selectedIndex === idx ? "bg-gray-50" : ""
                        }`}
                      >
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 border border-gray-200 text-gray-800">
                          {opt}
                        </span>
                      </div>
                    ))}
                    {layananOptions.length === 0 && (
                      <div className="px-3 py-2.5 text-xs text-gray-500 italic">
                        Belum ada data di tabel layanan_estimasi.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kota Asal
                </label>
                <input
                  type="text"
                  value={formAsal}
                  onChange={(e) => setFormAsal(e.target.value)}
                  placeholder="Contoh: SEMARANG"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kota Tujuan
                </label>
                <input
                  type="text"
                  value={formTujuan}
                  onChange={(e) => setFormTujuan(e.target.value)}
                  placeholder="Contoh: JAKARTA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Total Koli / Berat
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formBerat}
                  onChange={(e) => setFormBerat(e.target.value)}
                  placeholder="Contoh: 1.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  value={formHarga}
                  onChange={(e) => setFormHarga(e.target.value)}
                  placeholder="Contoh: 15000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFormBuka(false)}
                  className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 rounded-md text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold py-2.5 rounded-md text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalLayananBuka && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={() => {
                setModalLayananBuka(false);
                resetFormLayanan();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-1">
              CRUD Database: layanan_estimasi
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Kelola nama layanan dan estimasi hari langsung ke tabel database layanan_estimasi.
            </p>

            <form onSubmit={handleSimpanLayanan} className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-5 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nama Layanan
                  </label>
                  <input
                    type="text"
                    value={formNamaLayanan}
                    onChange={(e) => setFormNamaLayanan(e.target.value.toUpperCase())}
                    placeholder="Contoh: REGULER"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Estimasi Hari
                  </label>
                  <input
                    type="text"
                    value={formEstimasi}
                    onChange={(e) => setFormEstimasi(e.target.value)}
                    placeholder="Contoh: 2-3 Hari Kerja"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
                <div className="sm:col-span-1 flex flex-col gap-1">
                  <button
                    type="submit"
                    disabled={isLayananLoading}
                    className="w-full bg-black hover:bg-gray-800 text-white font-extrabold py-2 rounded-md text-xs transition-colors cursor-pointer flex items-center justify-center h-[34px]"
                  >
                    {modeEditLayanan ? "Update" : "Tambah"}
                  </button>
                  {modeEditLayanan && (
                    <button
                      type="button"
                      onClick={resetFormLayanan}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-extrabold py-1 rounded-md text-[10px] transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md min-h-[200px]">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-100 text-gray-900 uppercase font-bold sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5">Nama Layanan</th>
                    <th className="px-4 py-2.5">Estimasi Hari</th>
                    <th className="px-4 py-2.5 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLayananLoading && daftarLayanan.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                        Memuat data dari database...
                      </td>
                    </tr>
                  ) : daftarLayanan.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                        Belum ada data di tabel layanan_estimasi.
                      </td>
                    </tr>
                  ) : (
                    daftarLayanan.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-bold text-gray-900">
                          <span className="px-2 py-0.5 rounded-sm text-[10px] bg-gray-200 border border-gray-300 text-gray-800 inline-block">
                            {item.nama_layanan}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-800 flex items-center gap-1.5 mt-1">
                          <Clock size={12} className="text-gray-400" />
                          {item.estimasi}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => bukaEditLayanan(item)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm cursor-pointer"
                              title="Edit"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleHapusLayanan(item.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-sm cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modalImportBuka && (
        <ImportTarifExcel
          daftarTarif={daftarTarif}
          onTutup={() => setModalImportBuka(false)}
          onSelesai={() => {
            setModalImportBuka(false);
            ambilDataTarif();
          }}
        />
      )}
    </div>
  );
};

export default TarifOngkir;