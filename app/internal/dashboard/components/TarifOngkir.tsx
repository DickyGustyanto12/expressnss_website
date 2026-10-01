"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Truck, X, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

interface TarifItem {
  id: string;
  realId: number;
  asal: string;
  tujuan: string;
  layanan: "Reguler" | "Next";
  tarif: number;
}

const TarifOngkir = () => {
  const [daftarTarif, setDaftarTarif] = useState<TarifItem[]>([]);
  const [dataMentah, setDataMentah] = useState<any[]>([]);
  const [pencarian, setPencarian] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [modalFormBuka, setModalFormBuka] = useState(false);
  const [modeEdit, setModeEdit] = useState(false);
  const [formId, setFormId] = useState<number | null>(null);
  const [formAsal, setFormAsal] = useState("");
  const [formTujuan, setFormTujuan] = useState("");
  const [formReguler, setFormReguler] = useState("");
  const [formNextday, setFormNextday] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ambilDataTarif = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tarif-ongkir");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat data tarif");
      }

      setDataMentah(data);

      const formattedData: TarifItem[] = [];
      data.forEach((item: any) => {
        formattedData.push({
          id: `${item.id}-reg`,
          realId: item.id,
          asal: item.kota_asal,
          tujuan: item.kota_tujuan,
          layanan: "Reguler",
          tarif: item.harga_reguler,
        });
        formattedData.push({
          id: `${item.id}-next`,
          realId: item.id,
          asal: item.kota_asal,
          tujuan: item.kota_tujuan,
          layanan: "Next",
          tarif: item.harga_nextday,
        });
      });

      setDaftarTarif(formattedData);
    } catch (error: any) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    ambilDataTarif();
  }, []);

  const tarifTersaring = daftarTarif.filter(
    (item) =>
      item.asal.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.tujuan.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.layanan.toLowerCase().includes(pencarian.toLowerCase()),
  );

  const bukaModalTambah = () => {
    setModeEdit(false);
    setFormId(null);
    setFormAsal("");
    setFormTujuan("");
    setFormReguler("");
    setFormNextday("");
    setModalFormBuka(true);
  };

  const bukaModalEdit = (realId: number) => {
    const item = dataMentah.find((d) => d.id === realId);
    if (item) {
      setModeEdit(true);
      setFormId(item.id);
      setFormAsal(item.kota_asal);
      setFormTujuan(item.kota_tujuan);
      setFormReguler(item.harga_reguler);
      setFormNextday(item.harga_nextday);
      setModalFormBuka(true);
    }
  };

  const handleSimpanData = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formAsal.trim() ||
      !formTujuan.trim() ||
      !formReguler ||
      !formNextday
    ) {
      Swal.fire({
        title: "Peringatan",
        text: "Semua kolom wajib diisi dengan benar!",
        icon: "warning",
        confirmButtonColor: "#FFCC00",
        color: "#1f2937",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const url = "/api/tarif-ongkir";
      const method = modeEdit ? "PUT" : "POST";
      const bodyData = modeEdit
        ? {
            id: formId,
            kota_asal: formAsal,
            kota_tujuan: formTujuan,
            harga_reguler: Number(formReguler),
            harga_nextday: Number(formNextday),
          }
        : {
            kota_asal: formAsal,
            kota_tujuan: formTujuan,
            harga_reguler: Number(formReguler),
            harga_nextday: Number(formNextday),
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Gagal menyimpan data tarif");
      }

      Swal.fire({
        title: "Berhasil!",
        text: modeEdit
          ? "Data tarif berhasil diperbarui."
          : "Data tarif baru berhasil ditambahkan.",
        icon: "success",
        confirmButtonColor: "#FFCC00",
        color: "#1f2937",
      });

      setModalFormBuka(false);
      ambilDataTarif();
    } catch (error: any) {
      Swal.fire("Gagal", error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHapus = (realId: number) => {
    Swal.fire({
      title: "Hapus Tarif?",
      text: "Data tarif ongkir ini akan dihapus permanen dari sistem.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/tarif-ongkir?id=${realId}`, {
            method: "DELETE",
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Gagal menghapus data");
          }

          Swal.fire("Terhapus!", "Data tarif berhasil dihapus.", "success");
          ambilDataTarif();
        } catch (error: any) {
          Swal.fire("Gagal", error.message, "error");
        }
      }
    });
  };

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="bg-white px-5 py-3 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00] shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">
            Manajemen Tarif Ongkir
          </h2>
          <p className="text-xs text-gray-500">
            Kelola daftar harga ongkos kirim antar kota untuk layanan NSS
            Express.
          </p>
        </div>
        <button
          onClick={bukaModalTambah}
          className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-4 py-2 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Tarif Baru</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 border border-gray-200 focus-within:border-yellow-400 focus-within:bg-white transition-all max-w-md">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Cari kota asal, tujuan, atau layanan (Reguler/Next)..."
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
                <th className="px-5 py-3">Tarif / Kg</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    Memuat data tarif...
                  </td>
                </tr>
              ) : tarifTersaring.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    Tidak ada data tarif ongkir yang ditemukan.
                  </td>
                </tr>
              ) : (
                tarifTersaring.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-bold text-gray-900 flex items-center gap-1.5">
                      <Truck size={14} className="text-yellow-600" />
                      {item.asal}
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900">
                      {item.tujuan}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                          item.layanan === "Reguler"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.layanan}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-black text-gray-950">
                      Rp {item.tarif.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => bukaModalEdit(item.realId)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleHapus(item.realId)}
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

            <form onSubmit={handleSimpanData} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kota Asal
                </label>
                <input
                  type="text"
                  value={formAsal}
                  onChange={(e) => setFormAsal(e.target.value)}
                  placeholder="Contoh: Jakarta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                  placeholder="Contoh: Bandung"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Harga Reguler / Kg (Rp)
                </label>
                <input
                  type="number"
                  value={formReguler}
                  onChange={(e) => setFormReguler(e.target.value)}
                  placeholder="Contoh: 15000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Harga Next Day / Kg (Rp)
                </label>
                <input
                  type="number"
                  value={formNextday}
                  onChange={(e) => setFormNextday(e.target.value)}
                  placeholder="Contoh: 35000"
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
    </div>
  );
};

export default TarifOngkir;
