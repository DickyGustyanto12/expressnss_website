"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Tag, Loader2, ImageOff } from "lucide-react";

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
        } else {
          console.error("Gagal mengambil data, status:", res.status);
        }
      } catch (error) {
        console.error("Gagal memuat info express:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getImageUrl = (url: string) => {
    if (!url) return "https://placehold.co/800x500/e2e8f0/475569?text=No+Image";
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
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {infoCards.map((card, index) => (
              <motion.a
                key={card.id}
                href="#"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2"
              >
                <div className="relative overflow-hidden aspect-[16/10] bg-gray-100">
                  <img
                    src={getImageUrl(card.gambar_url)}
                    alt={card.judul}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/800x500/e2e8f0/475569?text=Gambar+Tidak+Ditemukan";
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                        kategoriColors[card.kategori] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Tag size={10} />
                      {card.kategori}
                    </span>
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <Calendar size={12} />
                    <span>{formatDate(card.tanggal)}</span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base md:text-lg leading-snug mb-2 line-clamp-2 group-hover:text-[#FFCC00] transition-colors">
                    {card.judul}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
                    {card.deskripsi}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-[#FFCC00] group-hover:gap-2.5 transition-all">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default InfoExpress;
