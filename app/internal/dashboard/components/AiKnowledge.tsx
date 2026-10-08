"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  BookOpen,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";

interface KnowledgeItem {
  id: number;
  kategori: string;
  pertanyaan: string;
  jawaban: string;
  kata_kunci: string;
  is_active: number;
  urutan: number;
  created_at: string;
  updated_at: string;
}

interface AiKnowledgeProps {
  adminId?: number;
  adminName?: string;
}

const KATEGORI_OPTIONS = [
  { value: "umum", label: "Umum" },
  { value: "layanan", label: "Layanan" },
  { value: "ongkir", label: "Ongkos Kirim" },
  { value: "lacak", label: "Pelacakan" },
  { value: "jam_operasional", label: "Jam Operasional" },
  { value: "cabang", label: "Cabang" },
  { value: "klaim", label: "Klaim & Asuransi" },
  { value: "pembayaran", label: "Pembayaran" },
  { value: "packing", label: "Packing" },
];

const AiKnowledge = ({ adminId, adminName }: AiKnowledgeProps) => {
  const [data, setData] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    kategori: "umum",
    pertanyaan: "",
    jawaban: "",
    kata_kunci: "",
    is_active: 1,
    urutan: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai-knowledge");
      const result = await res.json();
      if (res.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Gagal memuat knowledge:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = "/api/ai-knowledge";
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
            ? "Knowledge berhasil diperbarui"
            : "Knowledge baru berhasil ditambahkan",
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

  const handleEdit = (item: KnowledgeItem) => {
    setEditingId(item.id);
    setFormData({
      kategori: item.kategori,
      pertanyaan: item.pertanyaan,
      jawaban: item.jawaban,
      kata_kunci: item.kata_kunci || "",
      is_active: item.is_active,
      urutan: item.urutan,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Hapus Knowledge?",
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
        const res = await fetch("/api/ai-knowledge", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Knowledge berhasil dihapus",
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

  const handleToggleActive = async (item: KnowledgeItem) => {
    try {
      const res = await fetch("/api/ai-knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          kategori: item.kategori,
          pertanyaan: item.pertanyaan,
          jawaban: item.jawaban,
          kata_kunci: item.kata_kunci,
          is_active: item.is_active === 1 ? 0 : 1,
          urutan: item.urutan,
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error("Gagal toggle status:", error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      kategori: "umum",
      pertanyaan: "",
      jawaban: "",
      kata_kunci: "",
      is_active: 1,
      urutan: 0,
    });
  };

  const filteredData = data.filter((item) => {
    const matchSearch =
      item.pertanyaan.toLowerCase().includes(search.toLowerCase()) ||
      item.jawaban.toLowerCase().includes(search.toLowerCase()) ||
      item.kata_kunci?.toLowerCase().includes(search.toLowerCase());
    const matchKategori =
      filterKategori === "semua" || item.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  const getKategoriLabel = (value: string) => {
    return KATEGORI_OPTIONS.find((k) => k.value === value)?.label || value;
  };

  const getKategoriColor = (kategori: string) => {
    const colors: Record<string, string> = {
      umum: "bg-gray-100 text-gray-800",
      layanan: "bg-blue-100 text-blue-800",
      ongkir: "bg-yellow-100 text-yellow-800",
      lacak: "bg-green-100 text-green-800",
      jam_operasional: "bg-purple-100 text-purple-800",
      cabang: "bg-pink-100 text-pink-800",
      klaim: "bg-red-100 text-red-800",
      pembayaran: "bg-indigo-100 text-indigo-800",
      packing: "bg-orange-100 text-orange-800",
    };
    return colors[kategori] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white px-6 py-5 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <BookOpen size={20} className="text-yellow-700" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Manajemen Knowledge AI
            </h2>
            <p className="text-sm text-gray-500">
              Kelola basis pengetahuan yang digunakan AI untuk menjawab
              pertanyaan pelanggan
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
            <div className="flex flex-1 gap-3 w-full md:w-auto">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Cari pertanyaan, jawaban, atau kata kunci..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent"
                />
              </div>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
              >
                <option value="semua">Semua Kategori</option>
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-bold px-4 py-2 rounded-md text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              Tambah Knowledge
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Aktif: {data.filter((d) => d.is_active === 1).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>
                Nonaktif: {data.filter((d) => d.is_active === 0).length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={14} />
              <span>Total: {data.length} item</span>
            </div>
          </div>
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
              {search || filterKategori !== "semua"
                ? "Tidak ada data yang cocok dengan filter"
                : "Belum ada knowledge base. Klik tombol Tambah untuk memulai."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md ${getKategoriColor(item.kategori)}`}
                      >
                        {getKategoriLabel(item.kategori)}
                      </span>
                      <span className="text-xs text-gray-500">
                        #{item.urutan}
                      </span>
                      {item.is_active === 1 ? (
                        <span className="text-xs text-green-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 font-semibold">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1.5">
                      {item.pertanyaan}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">
                      {item.jawaban}
                    </p>
                    {item.kata_kunci && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-gray-500 font-semibold">
                          Kata kunci:
                        </span>
                        {item.kata_kunci.split(",").map((k, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded"
                          >
                            {k.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`p-2 rounded-md transition-colors ${
                        item.is_active === 1
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                      title={item.is_active === 1 ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {item.is_active === 1 ? (
                        <ToggleRight size={20} />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {editingId ? "Edit Knowledge" : "Tambah Knowledge Baru"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingId
                    ? "Perbarui informasi knowledge"
                    : "Tambahkan pertanyaan & jawaban untuk AI"}
                </p>
              </div>
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
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
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
                    Semakin kecil, semakin prioritas
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Pertanyaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pertanyaan}
                  onChange={(e) =>
                    setFormData({ ...formData, pertanyaan: e.target.value })
                  }
                  placeholder="Contoh: Berapa tarif pengiriman ke Bandung?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Jawaban <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.jawaban}
                  onChange={(e) =>
                    setFormData({ ...formData, jawaban: e.target.value })
                  }
                  placeholder="Jawaban yang akan diberikan AI kepada pelanggan..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] resize-none"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Gunakan bahasa yang ramah dan profesional. Maksimal 3-4
                  kalimat.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Kata Kunci
                </label>
                <input
                  type="text"
                  value={formData.kata_kunci}
                  onChange={(e) =>
                    setFormData({ ...formData, kata_kunci: e.target.value })
                  }
                  placeholder="tarif, biaya, harga, ongkir (pisahkan dengan koma)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Kata kunci untuk membantu AI mencocokkan pertanyaan pelanggan
                </p>
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
                    Aktifkan knowledge ini
                  </span>
                </label>
                <div className="flex gap-2">
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
                    {editingId ? "Simpan Perubahan" : "Tambah Knowledge"}
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

export default AiKnowledge;
