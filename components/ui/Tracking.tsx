"use client";

import { Search, X, Clock, User, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Tracking = () => {
  const [kataKunci, setKataKunci] = useState("");
  const [modalBuka, setModalBuka] = useState(false);
  const [hasilTracking, setHasilTracking] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(false);

  const handleCari = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const keyword = kataKunci.trim();
    if (!keyword) return;

    setModalBuka(true);
    setIsModalLoading(true);
    setHasilTracking(null);
    setErrorMsg("");

    try {
      const response = await fetch("/api/tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server");
      }

      const data = await response.json();

      if (data && data.Detail && data.Detail.length > 0) {
        const formattedData = {
          awb: keyword,
          status: data.Detail[0].Keterangan || "Dalam Proses",
          pengirim: {
            nama: "NSS Express Center",
          },
          penerima: {
            nama: data.Detail[0].Nama || "-",
          },
          riwayat: data.Detail.map((item: any) => ({
            tanggal: item.Tanggal || "",
            jam: item.Jam || "",
            keterangan: item.Keterangan || "",
          })),
        };

        setHasilTracking(formattedData);
        setErrorMsg("");
      } else {
        setHasilTracking(null);
        setErrorMsg(
          "Nomor resi tidak ditemukan. Silakan periksa kembali nomor resi Anda.",
        );
      }
    } catch (error) {
      console.error("Error fetching tracking:", error);
      setHasilTracking(null);
      setErrorMsg(
        "Terjadi kesalahan koneksi ke server pelacakan. Pastikan jaringan terhubung.",
      );
    } finally {
      setIsModalLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 text-center py-20 px-4">
      <span className="bg-[#FFCC00] text-black font-bold py-1 px-3 rounded-sm text-sm mb-4 inline-block">
        # Lacak Paket
      </span>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
        Lacak Paket Anda
      </h2>
      <p className="text-gray-600 mt-1 max-w-lg mx-auto">
        Masukkan nomor resi Anda untuk melacak paket secara real-time.
      </p>

      <form onSubmit={handleCari} className="lg:max-w-2xl mx-auto mt-8">
        <div className="flex w-full bg-white rounded-sm shadow-md border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-black transition-all">
          <div className="pl-5 flex items-center justify-center text-gray-400">
            <Search size={22} />
          </div>
          <input
            type="text"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            placeholder="Masukkan nomor AWB..."
            className="w-full px-4 py-4 focus:outline-none text-gray-800 text-sm md:text-base font-medium"
          />
          <button
            type="submit"
            className="bg-black hover:bg-gray-800 text-white px-8 py-4 transition-colors cursor-pointer text-sm font-extrabold tracking-wide"
          >
            Cari
          </button>
        </div>
      </form>

      <AnimatePresence>
        {modalBuka && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white rounded-sm max-w-3xl w-full p-8 text-left shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setModalBuka(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-black p-2 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors cursor-pointer z-10"
              >
                <X size={20} />
              </button>

              {isModalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 size={45} className="animate-spin text-[#FFCC00]" />
                  <p className="text-base font-bold text-gray-700">
                    Sedang memuat data pelacakan...
                  </p>
                </div>
              ) : hasilTracking ? (
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <span className="bg-[#FFCC00] text-gray-950 font-extrabold text-sm px-3.5 py-1.5 rounded-sm shadow-xs">
                      AWB: {hasilTracking.awb}
                    </span>
                    <span className="bg-green-100 text-green-800 font-extrabold text-sm px-3.5 py-1.5 rounded-sm flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 size={16} />
                      {hasilTracking.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-gray-900 mb-4">
                    Informasi Pengiriman
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="bg-gray-50 p-5 rounded-sm border border-gray-200 shadow-xs flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-100 text-yellow-800 rounded-sm flex items-center justify-center shrink-0">
                        <User size={22} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Pengirim
                        </span>
                        <span className="text-sm font-extrabold text-gray-900">
                          {hasilTracking.pengirim.nama}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-sm border border-gray-200 shadow-xs flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-sm flex items-center justify-center shrink-0">
                        <User size={22} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Penerima
                        </span>
                        <span className="text-sm font-extrabold text-gray-900">
                          {hasilTracking.penerima.nama}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-base font-extrabold text-gray-900 mb-4 uppercase tracking-wider">
                    Riwayat Perjalanan
                  </h4>

                  <div className="space-y-6 border-l-2 border-yellow-400 pl-6 ml-3 my-4">
                    {hasilTracking.riwayat.map((item: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 bg-[#FFCC00] rounded-sm border-4 border-white shadow-md"></div>
                        <div className="text-xs text-gray-500 font-semibold flex items-center gap-2 mb-1">
                          <span>{item.tanggal}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-gray-600 font-bold">
                            <Clock size={13} /> {item.jam}
                          </span>
                        </div>
                        <div className="text-base font-bold text-gray-900">
                          {item.keterangan}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setModalBuka(false)}
                    className="w-full bg-black hover:bg-gray-800 text-white font-extrabold py-3.5 rounded-sm text-base transition-colors mt-8 cursor-pointer shadow-md"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-red-600 font-extrabold text-lg mb-2">
                    Resi Tidak Ditemukan
                  </div>
                  <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                    {errorMsg}
                  </p>
                  <button
                    onClick={() => setModalBuka(false)}
                    className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-sm text-sm font-bold cursor-pointer shadow-md"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tracking;
