"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
  Loader2,
  ImageOff,
  X,
  Maximize2,
  ZoomIn,
} from "lucide-react";

interface InfoCard {
  id: number;
  kategori: string;
  judul: string;
  deskripsi: string;
  gambar_url: string;
  tanggal: string;
  is_active: number;
}

type ViewMode = "grid" | "detail" | "fullscreen";

const ITEMS_PER_PAGE = 2;

const InfoExpress = () => {
  const [infoCards, setInfoCards] = useState<InfoCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/info-express");
        if (res.ok) {
          const data = await res.json();
          const activeData = data.filter(
            (item: InfoCard) => item.is_active === 1,
          );
          setInfoCards(activeData);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    document.body.style.overflow = viewMode !== "grid" ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [viewMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewMode === "fullscreen") setViewMode("detail");
        else if (viewMode === "detail") setViewMode("grid");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewMode]);

  const getImageUrl = (url: string | null | undefined) => {
    if (!url || url.trim() === "") {
      return "https://placehold.co/800x500/e2e8f0/475569?text=No+Image";
    }
    return url.startsWith("http") || url.startsWith("/") ? url : `/${url}`;
  };

  const kategoriColors: Record<string, string> = {
    Pengiriman: "bg-blue-100 text-blue-700",
    Layanan: "bg-green-100 text-green-700",
    Armada: "bg-purple-100 text-purple-700",
    Bisnis: "bg-orange-100 text-orange-700",
    Tracking: "bg-pink-100 text-pink-700",
    Promo: "bg-red-100 text-red-700",
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Tanggal tidak valid";
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const totalPages = Math.max(1, Math.ceil(infoCards.length / ITEMS_PER_PAGE));

  const nextPage = () => setPage((p) => (p + 1) % totalPages);
  const prevPage = () => setPage((p) => (p - 1 + totalPages) % totalPages);

  const openDetail = (indexInPage: number) => {
    const realIndex = page * ITEMS_PER_PAGE + indexInPage;
    setSelectedIndex(realIndex);
    setViewMode("detail");
  };

  const openFullscreen = () => setViewMode("fullscreen");

  const closeDetail = () => {
    setViewMode("grid");
    setSelectedIndex(null);
  };

  const closeFullscreen = () => setViewMode("detail");

  const selectedCard = selectedIndex !== null ? infoCards[selectedIndex] : null;

  if (isLoading) {
    return (
      <section className="py-24 bg-white flex ite ms-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2
            className="animate-spin mx-auto text-[#FFCC00] mb-3"
            size={40}
          />
          <p className="text-gray-500">Memuat informasi...</p>
        </div>
      </section>
    );
  }

  const currentItems = infoCards.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );

  return (
    <section id="info" className="py-16 md:py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-[#FFCC00] text-black text-xs font-bold tracking-wider mb-4">
            # INFO TERBARU
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Informasi NSS Express
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Dapatkan informasi terbaru seputar layanan, promo, dan update dari
            NSS Express
          </p>
        </motion.div>

        {infoCards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <ImageOff size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">
              Belum ada informasi yang tersedia atau semua data dalam status
              "Nonaktif".
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Silakan cek di Admin Panel dan pastikan statusnya "Aktif".
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {currentItems.map((card, idx) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  onClick={() => openDetail(idx)}
                  className="group relative overflow-hidden rounded-2xl shadow-lg bg-gray-100 cursor-pointer"
                >
                  <img
                    src={getImageUrl(card.gambar_url)}
                    alt={card.judul}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/800x500/e2e8f0/475569?text=Gambar+Tidak+Ditemukan";
                    }}
                    className="w-full h-64 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <span
                      className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 ${
                        kategoriColors[card.kategori] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {card.kategori}
                    </span>
                    <h4 className="text-base sm:text-lg font-extrabold leading-tight line-clamp-2">
                      {card.judul}
                    </h4>
                    <p className="text-xs text-gray-200 mt-1 flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(card.tanggal)}
                    </p>
                  </div>

                  <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn size={16} className="text-gray-800" />
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <>
                <button
                  onClick={prevPage}
                  className="absolute top-1/2 left-0 md:-left-12 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-full shadow-lg border border-gray-200 transition-all hover:scale-110"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={22} />
                </button>

                <button
                  onClick={nextPage}
                  className="absolute top-1/2 right-0 md:-right-12 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-full shadow-lg border border-gray-200 transition-all hover:scale-110"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight size={22} />
                </button>

                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`h-2.5 rounded-full transition-all ${
                        i === page
                          ? "bg-[#FFCC00] w-8"
                          : "bg-gray-300 hover:bg-gray-400 w-2.5"
                      }`}
                      aria-label={`Halaman ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewMode === "detail" && selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeDetail}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <button
                onClick={closeDetail}
                className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all cursor-pointer shadow-lg"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>

              <div className="flex-1 overflow-y-auto">
                <div
                  onClick={openFullscreen}
                  className="relative bg-gray-100 cursor-zoom-in group overflow-hidden"
                >
                  <img
                    src={getImageUrl(selectedCard.gambar_url)}
                    alt={selectedCard.judul}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/800x500/e2e8f0/475569?text=Gambar+Tidak+Ditemukan";
                    }}
                    className="w-full h-auto max-h-[55vh] object-contain group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 text-gray-900 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Maximize2 size={16} />
                      Klik untuk layar penuh
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        kategoriColors[selectedCard.kategori] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Tag size={12} />
                      {selectedCard.kategori}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar size={14} />
                      {formatDate(selectedCard.tanggal)}
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                    {selectedCard.judul}
                  </h2>

                  <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">
                    {selectedCard.deskripsi}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewMode === "fullscreen" && selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4"
          >
            <button
              onClick={closeFullscreen}
              className="absolute top-6 left-6 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all cursor-pointer z-10 backdrop-blur-sm"
            >
              <ChevronLeft size={18} />
              <span className="text-sm font-bold">Kembali</span>
            </button>

            <button
              onClick={closeDetail}
              className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all cursor-pointer z-10 backdrop-blur-sm"
              aria-label="Tutup"
            >
              <X size={22} />
            </button>

            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={getImageUrl(selectedCard.gambar_url)}
              alt={selectedCard.judul}
              className="max-w-[95vw] max-h-[90vh] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/800x500/e2e8f0/475569?text=Gambar+Tidak+Ditemukan";
              }}
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs sm:text-sm flex items-center gap-2">
              <Maximize2 size={14} />
              Klik "Kembali" untuk lihat detail
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default InfoExpress;
