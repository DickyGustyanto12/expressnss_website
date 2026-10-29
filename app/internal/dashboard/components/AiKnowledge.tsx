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
  Settings,
  MessageSquare,
  User,
  ShieldAlert,
  Tag,
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

interface AiSettings {
  id: number;
  ai_name: string;
  custom_greeting: string;
  persona: string;
  limitations: string;
  quick_questions: string;
  instructions: string;
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

type SettingKey = "ai_name" | "custom_greeting" | "persona" | "limitations";

const AiKnowledge = ({ adminId, adminName }: AiKnowledgeProps) => {
  const [data, setData] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [formData, setFormData] = useState({
    kategori: "umum",
    pertanyaan: "",
    jawaban: "",
    kata_kunci: "",
    is_active: 1,
    urutan: 0,
  });

  const [settingsForm, setSettingsForm] = useState<AiSettings>({
    id: 0,
    ai_name: "",
    custom_greeting: "",
    persona: "",
    limitations: "",
    quick_questions: "",
    instructions: "",
  });

  const [activeSetting, setActiveSetting] = useState<SettingKey | null>(null);

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai-knowledge");
      const result = await res.json();
      if (res.ok) setData(result);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch("/api/ai-settings");
      if (res.ok) {
        const data = await res.json();
        setSettingsForm({
          id: data.id || 0,
          ai_name: data.ai_name || "Customer Service NSS Express",
          custom_greeting:
            data.custom_greeting || "Halo Kak! Ada yang bisa saya bantu?",
          persona:
            data.persona ||
            "Kamu adalah Customer Service Virtual yang ramah dan profesional.",
          limitations:
            data.limitations ||
            "Jawab hanya berdasarkan knowledge base yang tersedia.",
          quick_questions: data.quick_questions || "[]",
          instructions: data.instructions || "",
        });
      }
    } catch {
    } finally {
      setIsLoadingSettings(false);
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
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_name: settingsForm.ai_name,
          custom_greeting: settingsForm.custom_greeting,
          persona: settingsForm.persona,
          limitations: settingsForm.limitations,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Pengaturan berhasil diperbarui",
          timer: 1500,
          showConfirmButton: false,
        });
        setActiveSetting(null);
        loadSettings();
      } else {
        throw new Error(result.error || "Gagal menyimpan");
      }
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    } finally {
      setIsSavingSettings(false);
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
      if (res.ok) loadData();
    } catch {
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

  const getKategoriLabel = (value: string) =>
    KATEGORI_OPTIONS.find((k) => k.value === value)?.label || value;
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

  const getSettingPreview = (key: SettingKey): string => {
    const value = settingsForm[key] || "";
    if (value.length > 80) return value.substring(0, 80) + "...";
    return value;
  };

  const settingCards = [
    {
      key: "ai_name" as SettingKey,
      icon: <Tag size={24} />,
      title: "Nama AI",
      description: "Identitas atau nama yang digunakan oleh chatbot.",
      color: "bg-blue-100 text-blue-700",
      preview: settingsForm.ai_name || "Belum diatur",
    },
    {
      key: "custom_greeting" as SettingKey,
      icon: <MessageSquare size={24} />,
      title: "Custom Sapaan",
      description: "Pesan pembuka otomatis saat pelanggan memulai chat.",
      color: "bg-green-100 text-green-700",
      preview: settingsForm.custom_greeting || "Belum diatur",
    },
    {
      key: "persona" as SettingKey,
      icon: <User size={24} />,
      title: "Persona AI",
      description: "Karakter, nada bicara, dan gaya bahasa yang digunakan.",
      color: "bg-purple-100 text-purple-700",
      preview: settingsForm.persona || "Belum diatur",
    },
    {
      key: "limitations" as SettingKey,
      icon: <ShieldAlert size={24} />,
      title: "Batasan AI",
      description: "Aturan ketat yang tidak boleh dilanggar oleh AI.",
      color: "bg-red-100 text-red-700",
      preview: settingsForm.limitations || "Belum diatur",
    },
  ];

  const getActiveSettingTitle = () => {
    const setting = settingCards.find((s) => s.key === activeSetting);
    return setting ? setting.title : "Edit Pengaturan";
  };

  return (
    <div className="space-y-8">
      <div className="bg-white px-6 py-5 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <BookOpen size={20} className="text-yellow-700" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Manajemen Knowledge & AI
            </h2>
            <p className="text-sm text-gray-500">
              Kelola FAQ, persona, dan batasan perilaku chatbot AI
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Settings size={20} className="text-gray-600" />
          Konfigurasi AI Chatbot
        </h3>

        {isLoadingSettings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {settingCards.map((card) => (
              <div
                key={card.key}
                onClick={() => setActiveSetting(card.key)}
                className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    {card.icon}
                  </div>
                  <Edit3
                    size={18}
                    className="text-gray-400 group-hover:text-[#FFCC00] transition-colors"
                  />
                </div>
                <h4 className="font-extrabold text-gray-900 text-lg mb-2">
                  {card.title}
                </h4>
                <p className="text-xs text-gray-500 mb-4">{card.description}</p>
                <div className="mt-auto bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-700 line-clamp-3 italic">
                    "{card.preview}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
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
                : "Belum ada knowledge base."}
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
                      className={`p-2 rounded-md transition-colors ${item.is_active === 1 ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
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
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] resize-none"
                  required
                />
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
                  placeholder="tarif, biaya, harga (pisahkan dengan koma)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                />
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
                    {editingId ? "Simpan" : "Tambah"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeSetting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  {settingCards.find((s) => s.key === activeSetting)?.icon}
                  Edit {getActiveSettingTitle()}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Perbarui konfigurasi ini untuk mengubah perilaku AI
                </p>
              </div>
              <button
                onClick={() => setActiveSetting(null)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              {activeSetting === "ai_name" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Nama AI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settingsForm.ai_name}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        ai_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              )}

              {activeSetting === "custom_greeting" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Pesan Sapaan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={settingsForm.custom_greeting}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        custom_greeting: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Pesan ini akan muncul otomatis sebagai pesan pertama dari
                    AI.
                  </p>
                </div>
              )}

              {activeSetting === "persona" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Deskripsi Persona <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={settingsForm.persona}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        persona: e.target.value,
                      })
                    }
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Jelaskan karakter, nada bicara, dan gaya bahasa yang
                    diinginkan.
                  </p>
                </div>
              )}

              {activeSetting === "limitations" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Aturan & Batasan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={settingsForm.limitations}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        limitations: e.target.value,
                      })
                    }
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Aturan ketat yang TIDAK BOLEH dilanggar oleh AI.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveSetting(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiKnowledge;
