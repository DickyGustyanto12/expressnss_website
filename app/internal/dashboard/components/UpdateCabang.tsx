"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  MapPin,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Swal from "sweetalert2";

interface CabangItem {
  id: number;
  kota: string;
  lat: number;
  lng: number;
  alamat: string;
  link_maps: string;
}

const UpdateCabang = () => {
  const [data, setData] = useState<CabangItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    kota: "",
    lat: "",
    lng: "",
    alamat: "",
    link_maps: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cabang");
      const result = await res.json();
      if (res.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Gagal memuat data cabang:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = "/api/cabang";
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: editingId
            ? "Data cabang berhasil diperbarui"
            : "Cabang baru berhasil ditambahkan",
          timer: 1500,
          showConfirmButton: false,
        });
        resetForm();
        loadData();
      } else {
        throw new Error(result.error || "Gagal menyimpan");
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: CabangItem) => {
    setEditingId(item.id);
    setFormData({
      kota: item.kota,
      lat: item.lat.toString(),
      lng: item.lng.toString(),
      alamat: item.alamat,
      link_maps: item.link_maps || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Hapus Cabang?",
      text: "Data cabang yang dihapus tidak dapat dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch("/api/cabang", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Data cabang berhasil dihapus",
            timer: 1500,
            showConfirmButton: false,
          });
          loadData();
        } else {
          throw new Error("Gagal menghapus data");
        }
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: error.message || "Gagal menghapus data",
        });
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ kota: "", lat: "", lng: "", alamat: "", link_maps: "" });
  };

  const filteredData = data.filter(
    (item) =>
      item.kota.toLowerCase().includes(search.toLowerCase()) ||
      item.alamat.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="bg-white px-6 py-5 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <MapPin size={20} className="text-yellow-700" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Manajemen Cabang
            </h2>
            <p className="text-sm text-gray-500">
              Kelola data lokasi cabang NSS Express untuk ditampilkan di peta
              website.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
          <div className="flex-1 relative w-full md:w-96">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari nama kota atau alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-bold px-4 py-2 rounded-md text-sm transition-colors shadow-sm cursor-pointer w-full md:w-auto justify-center"
          >
            <Plus size={16} />
            Tambah Cabang
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2
              size={32}
              className="animate-spin mx-auto text-gray-400 mb-3"
            />
            <p className="text-sm text-gray-500">Memuat data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">
              {search
                ? "Tidak ada data yang cocok dengan pencarian"
                : "Belum ada data cabang."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4">Kota</th>
                  <th className="px-5 py-4">Alamat Lengkap</th>
                  <th className="px-5 py-4 text-center">Koordinat</th>
                  <th className="px-5 py-4">Link Google Maps</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {item.kota}
                    </td>
                    <td
                      className="px-5 py-4 text-gray-700 max-w-xs truncate"
                      title={item.alamat}
                    >
                      {item.alamat}
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-gray-500 font-mono">
                      {item.lat}, {item.lng}
                    </td>
                    <td className="px-5 py-4">
                      {item.link_maps ? (
                        <a
                          href={item.link_maps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline font-medium max-w-[250px] group"
                          title={item.link_maps}
                        >
                          <ExternalLink size={14} className="shrink-0" />
                          <span className="truncate">{item.link_maps}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm italic flex items-center gap-1">
                          <ExternalLink size={12} /> Belum ada link
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {editingId ? "Edit Data Cabang" : "Tambah Cabang Baru"}
                </h3>
              </div>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Nama Kota <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.kota}
                  onChange={(e) =>
                    setFormData({ ...formData, kota: e.target.value })
                  }
                  placeholder="Contoh: Jakarta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat: e.target.value })
                  }
                  placeholder="Alamat lengkap cabang..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) =>
                      setFormData({ ...formData, lat: e.target.value })
                    }
                    placeholder="-6.1892"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) =>
                      setFormData({ ...formData, lng: e.target.value })
                    }
                    placeholder="106.8011"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Link Google Maps (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.link_maps}
                  onChange={(e) =>
                    setFormData({ ...formData, link_maps: e.target.value })
                  }
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 rounded-md text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {editingId ? "Simpan Perubahan" : "Tambah Cabang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateCabang;
