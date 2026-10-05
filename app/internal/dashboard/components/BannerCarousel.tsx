"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, ImageIcon, X, Upload } from "lucide-react";
import Swal from "sweetalert2";

interface BannerItem {
  id: number;
  judul: string;
  deskripsi: string;
  gambar_url: string;
  status: "aktif" | "non-aktif";
  urutan: number;
}

const BannerCarousel = () => {
  const [daftarBanner, setDaftarBanner] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pencarian, setPencarian] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [formData, setFormData] = useState({
    id: 0,
    urutan: 0,
    judul: "",
    deskripsi: "",
    gambar_url: "",
    status: "aktif" as "aktif" | "non-aktif",
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/banners");
      const data = await res.json();
      if (res.ok) {
        setDaftarBanner(data);
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text: data.error,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error Sistem",
        text: "Tidak dapat terhubung ke server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const bannerTersaring = daftarBanner.filter(
    (item) =>
      item.judul.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(pencarian.toLowerCase()),
  );

  const openModalTambah = () => {
    setIsEdit(false);
    setSelectedFile(null);
    setPreviewUrl("");
    setFormData({
      id: 0,
      urutan: daftarBanner.length + 1,
      judul: "",
      deskripsi: "",
      gambar_url: "",
      status: "aktif",
    });
    setShowModal(true);
  };

  const openModalEdit = (banner: BannerItem) => {
    setIsEdit(true);
    setSelectedFile(null);
    setPreviewUrl(banner.gambar_url || "");
    setFormData({
      id: banner.id,
      urutan: banner.urutan,
      judul: banner.judul,
      deskripsi: banner.deskripsi,
      gambar_url: banner.gambar_url || "",
      status: banner.status,
    });
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "File Terlalu Besar",
          text: "Maksimal ukuran file adalah 5MB.",
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalImageUrl = formData.gambar_url;

      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Gagal mengupload gambar");
        }
        finalImageUrl = uploadData.url;
      }

      const url = "/api/banners";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? { ...formData, gambar_url: finalImageUrl }
        : {
            urutan: formData.urutan,
            judul: formData.judul,
            deskripsi: formData.deskripsi,
            gambar_url: finalImageUrl,
            status: formData.status,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        setShowModal(false);
        fetchBanners();
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: data.error || "Terjadi kesalahan.",
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error Sistem",
        text: error.message || "Tidak dapat terhubung ke server.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHapus = (id: number) => {
    Swal.fire({
      title: "Hapus Banner?",
      text: "Banner promosi ini akan dihapus dari carousel halaman utama.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/banners?id=${id}`, {
            method: "DELETE",
          });
          const data = await res.json();

          if (res.ok) {
            Swal.fire({
              icon: "success",
              title: "Terhapus!",
              text: data.message || "Banner berhasil dihapus.",
              timer: 1500,
              showConfirmButton: false,
            });
            fetchBanners();
          } else {
            Swal.fire({
              icon: "error",
              title: "Gagal",
              text: data.error || "Terjadi kesalahan.",
            });
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error Sistem",
            text: "Tidak dapat terhubung ke server.",
          });
        }
      }
    });
  };

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="bg-white px-5 py-3 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00] shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">
            Manajemen Banner Carousel
          </h2>
          <p className="text-xs text-gray-500">
            Kelola gambar dan informasi promo yang tampil di beranda utama
            website.
          </p>
        </div>
        <button
          onClick={openModalTambah}
          className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-4 py-2 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Banner Baru</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 border border-gray-200 focus-within:border-yellow-400 focus-within:bg-white transition-all max-w-md">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Cari judul atau deskripsi banner..."
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
                <th className="px-5 py-3">Urutan</th>
                <th className="px-5 py-3">Judul Banner</th>
                <th className="px-5 py-3">Deskripsi Singkat</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : bannerTersaring.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    Tidak ada data banner yang ditemukan.
                  </td>
                </tr>
              ) : (
                bannerTersaring.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-extrabold text-gray-900">
                      <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300 inline-flex items-center justify-center text-xs">
                        {item.urutan}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900 flex items-center gap-2">
                      <ImageIcon
                        size={16}
                        className="text-yellow-600 shrink-0"
                      />
                      {item.judul}
                    </td>
                    <td className="px-5 py-3 text-gray-600 truncate max-w-xs">
                      {item.deskripsi}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${item.status === "aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                      >
                        {item.status === "aktif" ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openModalEdit(item)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleHapus(item.id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-base font-extrabold text-gray-900">
                {isEdit ? "Edit Banner" : "Tambah Banner Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Urutan Tampil
                </label>
                <input
                  type="number"
                  value={formData.urutan}
                  onChange={(e) =>
                    setFormData({ ...formData, urutan: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent"
                  required
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Judul Banner
                </label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData({ ...formData, judul: e.target.value })
                  }
                  placeholder="Contoh: Promo Diskon Ongkir Akhir Tahun"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  placeholder="Deskripsi singkat tentang banner..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Gambar Banner
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-[#FFCC00] transition-colors bg-gray-50">
                  {previewUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-md object-cover shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(isEdit ? formData.gambar_url : "");
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4">
                      <Upload className="text-gray-400 mb-2" size={32} />
                      <p className="text-xs text-gray-500 mb-3">
                        Format: JPG, PNG, WEBP (Maks. 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="banner-image-upload"
                      />
                      <label
                        htmlFor="banner-image-upload"
                        className="cursor-pointer bg-[#FFCC00] hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-colors"
                      >
                        <ImageIcon size={14} />
                        Pilih Gambar
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "aktif" | "non-aktif",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent bg-white"
                >
                  <option value="aktif">Aktif</option>
                  <option value="non-aktif">Non-aktif</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-extrabold bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : isEdit ? (
                    "Simpan Perubahan"
                  ) : (
                    "Tambah Banner"
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

export default BannerCarousel;
