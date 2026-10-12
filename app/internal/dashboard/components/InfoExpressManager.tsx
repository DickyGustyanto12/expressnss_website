"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";

interface InfoItem {
  id: number;
  kategori: string;
  judul: string;
  deskripsi: string;
  gambar_url: string;
  tanggal: string;
  is_active: number;
}

const KATEGORI_OPTIONS = [
  "Pengiriman",
  "Layanan",
  "Armada",
  "Bisnis",
  "Tracking",
  "Promo",
];

const InfoExpressManager = () => {
  const [data, setData] = useState<InfoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const [formData, setFormData] = useState({
    kategori: "Pengiriman",
    judul: "",
    deskripsi: "",
    tanggal: new Date().toISOString().split("T")[0],
    is_active: 1,
    gambar: null as File | null,
    gambar_lama: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/info-express");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, gambar: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formPayload = new FormData();
      if (editingId) formPayload.append("id", editingId.toString());
      formPayload.append("kategori", formData.kategori);
      formPayload.append("judul", formData.judul);
      formPayload.append("deskripsi", formData.deskripsi);
      formPayload.append("tanggal", formData.tanggal);
      formPayload.append("is_active", formData.is_active.toString());
      if (formData.gambar) formPayload.append("gambar", formData.gambar);
      if (formData.gambar_lama)
        formPayload.append("gambar_lama", formData.gambar_lama);

      const url = "/api/info-express";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formPayload });
      const result = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: editingId
            ? "Data berhasil diperbarui"
            : "Data baru berhasil ditambahkan",
          timer: 1500,
          showConfirmButton: false,
        });
        resetForm();
        loadData();
      } else {
        throw new Error(result.error || "Gagal menyimpan");
      }
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: InfoItem) => {
    setEditingId(item.id);
    setFormData({
      kategori: item.kategori,
      judul: item.judul,
      deskripsi: item.deskripsi,
      tanggal: item.tanggal,
      is_active: item.is_active,
      gambar: null,
      gambar_lama: item.gambar_url,
    });
    setPreviewImage(item.gambar_url);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Hapus Data?",
      text: "Data tidak dapat dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch("/api/info-express", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Data berhasil dihapus",
            timer: 1500,
            showConfirmButton: false,
          });
          loadData();
        }
      } catch (error: any) {
        Swal.fire({ icon: "error", title: "Gagal", text: error.message });
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      kategori: "Pengiriman",
      judul: "",
      deskripsi: "",
      tanggal: new Date().toISOString().split("T")[0],
      is_active: 1,
      gambar: null,
      gambar_lama: "",
    });
    setPreviewImage("");
  };

  const filteredData = data.filter(
    (item) =>
      item.judul.toLowerCase().includes(search.toLowerCase()) ||
      item.kategori.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="bg-white px-6 py-5 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <ImageIcon size={20} className="text-yellow-700" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Manajemen Info Express
            </h2>
            <p className="text-sm text-gray-500">
              Kelola artikel, berita, dan informasi terbaru NSS Express
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
              placeholder="Cari judul atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-bold px-4 py-2 rounded-md text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Tambah Info
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
              {search ? "Tidak ada data yang cocok" : "Belum ada data."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4">Gambar</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Judul</th>
                  <th className="px-5 py-4 text-center">Tanggal</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <img
                        src={item.gambar_url}
                        alt={item.judul}
                        className="w-16 h-12 object-cover rounded-md border border-gray-200"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-full">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900 max-w-xs truncate">
                      {item.judul}
                    </td>
                    <td className="px-5 py-4 text-center text-gray-600 text-xs">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {item.is_active === 1 ? (
                        <CheckCircle2
                          size={16}
                          className="text-green-600 mx-auto"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">Nonaktif</span>
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-lg">
                {editingId ? "Edit Info" : "Tambah Info Baru"}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                    required
                  >
                    {KATEGORI_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggal: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData({ ...formData, judul: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Deskripsi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Gambar <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded shadow-sm mb-3"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="gambar-input"
                    required={!editingId}
                  />
                  <label
                    htmlFor="gambar-input"
                    className="cursor-pointer inline-flex items-center gap-2 text-[#FFCC00] hover:text-yellow-600 font-semibold"
                  >
                    <ImageIcon size={16} />{" "}
                    {editingId ? "Ganti Gambar" : "Pilih Gambar"}
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.checked ? 1 : 0,
                      })
                    }
                    className="w-4 h-4 text-[#FFCC00] border-gray-300 rounded focus:ring-[#FFCC00]"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Aktifkan
                  </span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 rounded-md text-sm font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {editingId ? "Simpan" : "Tambah"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoExpressManager;
