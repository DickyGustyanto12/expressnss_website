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
  Eye,
} from "lucide-react";
import Swal from "sweetalert2";

interface HeroBannerItem {
  id: number;
  judul: string;
  deskripsi: string;
  gambar_url: string;
  badge_text: string;
  button_text: string;
  button_link: string;
  is_active: number;
  urutan: number;
}

const HeroBannerManager = () => {
  const [data, setData] = useState<HeroBannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");

  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    badge_text: "#1 MITRA LOGISTIK ANDA",
    button_text: "Hubungi Kami",
    button_link: "#kontak",
    urutan: 0,
    gambar: null as File | null,
    gambar_lama: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/hero-banner");
      const result = await res.json();
      if (res.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Gagal memuat data hero banner:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, gambar: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formPayload = new FormData();

      if (editingId) {
        formPayload.append("id", editingId.toString());
      }

      formPayload.append("judul", formData.judul);
      formPayload.append("deskripsi", formData.deskripsi);
      formPayload.append("badge_text", formData.badge_text);
      formPayload.append("button_text", formData.button_text);
      formPayload.append("button_link", formData.button_link);
      formPayload.append("urutan", formData.urutan.toString());

      if (formData.gambar) {
        formPayload.append("gambar", formData.gambar);
      }

      if (formData.gambar_lama) {
        formPayload.append("gambar_lama", formData.gambar_lama);
      }

      const url = "/api/hero-banner";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formPayload,
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: editingId
            ? "Hero banner berhasil diperbarui"
            : "Hero banner baru berhasil ditambahkan",
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

  const handleEdit = (item: HeroBannerItem) => {
    setEditingId(item.id);
    setFormData({
      judul: item.judul,
      deskripsi: item.deskripsi,
      badge_text: item.badge_text,
      button_text: item.button_text,
      button_link: item.button_link,
      urutan: item.urutan,
      gambar: null,
      gambar_lama: item.gambar_url,
    });
    setPreviewImage(item.gambar_url);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Hapus Hero Banner?",
      text: "Data yang dihapus tidak dapat dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch("/api/hero-banner", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Hero banner berhasil dihapus",
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
    setFormData({
      judul: "",
      deskripsi: "",
      badge_text: "#1 MITRA LOGISTIK ANDA",
      button_text: "Hubungi Kami",
      button_link: "#kontak",
      urutan: 0,
      gambar: null,
      gambar_lama: "",
    });
    setPreviewImage("");
  };

  const filteredData = data.filter(
    (item) =>
      item.judul.toLowerCase().includes(search.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="bg-white px-6 py-5 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <ImageIcon size={20} className="text-yellow-700" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Manajemen Hero Banner
            </h2>
            <p className="text-sm text-gray-500">
              Kelola banner utama yang ditampilkan di halaman beranda website.
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
              placeholder="Cari judul atau deskripsi..."
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
            Tambah Banner
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
                : "Belum ada hero banner."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4">Preview</th>
                  <th className="px-5 py-4">Judul</th>
                  <th className="px-5 py-4">Deskripsi</th>
                  <th className="px-5 py-4 text-center">Urutan</th>
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
                      <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden">
                        <img
                          src={item.gambar_url}
                          alt={item.judul}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {item.judul}
                    </td>
                    <td
                      className="px-5 py-4 text-gray-700 max-w-xs truncate"
                      title={item.deskripsi}
                    >
                      {item.deskripsi}
                    </td>
                    <td className="px-5 py-4 text-center text-gray-700">
                      #{item.urutan}
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
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {editingId ? "Edit Hero Banner" : "Tambah Hero Banner Baru"}
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
                  Judul Banner <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData({ ...formData, judul: e.target.value })
                  }
                  placeholder="Contoh: NSS EXPRESS"
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
                  placeholder="Deskripsi banner..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Teks Badge
                  </label>
                  <input
                    type="text"
                    value={formData.badge_text}
                    onChange={(e) =>
                      setFormData({ ...formData, badge_text: e.target.value })
                    }
                    placeholder="#1 MITRA LOGISTIK ANDA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Teks Tombol
                  </label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) =>
                      setFormData({ ...formData, button_text: e.target.value })
                    }
                    placeholder="Hubungi Kami"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Link Tombol
                </label>
                <input
                  type="text"
                  value={formData.button_link}
                  onChange={(e) =>
                    setFormData({ ...formData, button_link: e.target.value })
                  }
                  placeholder="#kontak"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Urutan
                </label>
                <input
                  type="number"
                  value={formData.urutan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      urutan: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  min="0"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Semakin kecil angka, semakin prioritas ditampilkan
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Gambar Banner <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  {previewImage ? (
                    <div className="mb-3">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded shadow-sm"
                      />
                    </div>
                  ) : null}
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
                    <ImageIcon size={16} />
                    {editingId ? "Ganti Gambar" : "Pilih Gambar"}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Format: JPG, PNG (Max 5MB)
                  </p>
                </div>
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
                  {editingId ? "Simpan Perubahan" : "Tambah Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroBannerManager;
