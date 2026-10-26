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

const InfoExpress = () => {
  const [infoCards, setInfoCards] = useState<InfoCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState("");

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
        // Diabaikan (tidak ditampilkan di console browser)
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
    if (isNaN(date.getTime())) {
      return "Tanggal tidak valid";
    }
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % infoCards.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + infoCards.length) % infoCards.length);
  };

  const openFullscreen = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
    setIsFullscreen(true);
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = "unset";
  };

  if (isLoading) {
    return (
      <section className="py-24 bg-white flex items-center justify-center min-h-[400px]">
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
            {infoCards.length > 1 && (
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={prevSlide}
                  className="shrink-0 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-full shadow-lg border border-gray-200 transition-all hover:scale-110"
                  aria-label="Previous"
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="flex-1 overflow-hidden max-w-6xl mx-auto">
                  <div className="flex flex-col lg:flex-row gap-8 items-center">
                    <div className="w-full lg:w-100">
                      <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gray-100">
                        <img
                          src={getImageUrl(infoCards[currentIndex].gambar_url)}
                          alt={infoCards[currentIndex].judul}
                          loading="lazy"
                          onClick={() =>
                            openFullscreen(
                              getImageUrl(infoCards[currentIndex].gambar_url),
                            )
                          }
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/800x500/e2e8f0/475569?text=Gambar+Tidak+Ditemukan";
                          }}
                          className="w-full h-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md opacity-0 hover:opacity-100 transition-opacity">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-500">
                        <Calendar size={16} />
                        <span>
                          {formatDate(infoCards[currentIndex].tanggal)}
                        </span>
                      </div>

                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                        {infoCards[currentIndex].judul}
                      </h3>

                      <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                        {infoCards[currentIndex].deskripsi}
                      </p>

                      <div className="flex justify-center lg:justify-start pt-4">
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                            kategoriColors[infoCards[currentIndex].kategori] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Tag size={14} />
                          {infoCards[currentIndex].kategori}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={nextSlide}
                  className="shrink-0 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-full shadow-lg border border-gray-200 transition-all hover:scale-110"
                  aria-label="Next"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

            {infoCards.length === 1 && (
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  <div className="w-full lg:w-1/2">
                    <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gray-100">
                      <img
                        src={getImageUrl(infoCards[0].gambar_url)}
                        alt={infoCards[0].judul}
                        loading="lazy"
                        onClick={() =>
                          openFullscreen(getImageUrl(infoCards[0].gambar_url))
                        }
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/800x500/e2e8f0/475569?text=Gambar+Tidak+Ditemukan";
                        }}
                        className="w-full h-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md opacity-0 hover:opacity-100 transition-opacity">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          <line x1="11" y1="8" x2="11" y2="14"></line>
                          <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-500">
                      <Calendar size={16} />
                      <span>{formatDate(infoCards[0].tanggal)}</span>
                    </div>

                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                      {infoCards[0].judul}
                    </h3>

                    <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                      {infoCards[0].deskripsi}
                    </p>

                    <div className="flex justify-center lg:justify-start pt-4">
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                          kategoriColors[infoCards[0].kategori] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Tag size={14} />
                        {infoCards[0].kategori}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {infoCards.length > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {infoCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-[#FFCC00] w-8"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={closeFullscreen}
          >
            <button
              onClick={closeFullscreen}
              className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all z-50"
              aria-label="Close"
            >
              <X size={28} />
            </button>

            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={fullscreenImage}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
              Klik di mana saja untuk menutup
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default InfoExpress;
