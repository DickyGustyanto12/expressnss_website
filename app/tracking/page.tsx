import { Search, X, Clock, MapPin, Phone, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Tracking = () => {
  const [kataKunci, setKataKunci] = useState("");
  const [modalBuka, setModalBuka] = useState(false);
  const [hasilTracking, setHasilTracking] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(false);

  const dataDummy: Record<string, any> = {
    E12345678: {
      awb: "E12345678",
      status: "Dalam Pengantaran",
      pengirim: {
        nama: "NSS Express - Slipi",
        alamat: "Jl. Letjen S. Parman No. 28, Slipi, Jakarta Barat",
        noHp: "+62 21-555-0192",
      },
      penerima: {
        nama: "Siti Rahma",
        alamat: "Jl. Ir. H. Juanda No. 120, Dago, Bandung",
        noHp: "+62 857-9876-5432",
      },
      riwayat: [
        {
          tanggal: "23 Sep 2026",
          jam: "14:15",
          keterangan:
            "Kurir lokal sedang melakukan pengantaran paket menuju alamat penerima di Bandung.",
        },
        {
          tanggal: "23 Sep 2026",
          jam: "08:30",
          keterangan:
            "Paket telah keluar dari Hub Transit NSS Bandung dan diserahterimakan ke kurir pengantaran.",
        },
        {
          tanggal: "22 Sep 2026",
          jam: "22:00",
          keterangan:
            "Paket tiba dan telah melalui proses pemindaian (scanning) di Hub Transit Utama NSS Express Kota Bandung.",
        },
        {
          tanggal: "22 Sep 2026",
          jam: "16:45",
          keterangan:
            "Paket sedang dalam perjalanan via armada darat tol Cipularang menuju kota Bandung.",
        },
        {
          tanggal: "22 Sep 2026",
          jam: "11:30",
          keterangan:
            "Paket diberangkatkan dari Sorting Center NSS Slipi, Jakarta Barat.",
        },
        {
          tanggal: "22 Sep 2026",
          jam: "09:00",
          keterangan:
            "Paket telah diterima di counter NSS Slipi, Jakarta Barat dan divalidasi oleh petugas.",
        },
      ],
    },
  };

  const handleCari = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const keyword = kataKunci.trim();
    if (!keyword) return;

    // Langsung buka modal dalam keadaan loading
    setModalBuka(true);
    setIsModalLoading(true);
    setHasilTracking(null);
    setErrorMsg("");

    // Simulasi proses pencarian data di dalam modal
    setTimeout(() => {
      if (dataDummy[keyword]) {
        setHasilTracking(dataDummy[keyword]);
        setErrorMsg("");
      } else {
        setHasilTracking(null);
        setErrorMsg(
          "Nomor resi tidak ditemukan. Silakan gunakan nomor uji coba: E12345678",
        );
      }
      setIsModalLoading(false);
    }, 800);
  };

  return (
    <div className="bg-gray-50 text-center py-20 px-4">
      <span className="bg-[#FFCC00] text-black font-bold py-1 px-3 rounded text-sm mb-4 inline-block">
        # Lacak Paket
      </span>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
        Lacak Paket Anda
      </h2>
      <p className="text-gray-600 mt-1">
        Masukkan nomor resi Anda untuk melacak paket Anda.
      </p>

      <form onSubmit={handleCari} className="lg:max-w-xl mx-auto mt-8">
        <div className="flex w-full bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-black transition-all">
          <div className="pl-4 flex items-center justify-center text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            placeholder="Masukkan nomor AWB"
            className="w-full px-4 py-4 focus:outline-none text-gray-700 text-sm"
          />
          <button
            type="submit"
            className="bg-black hover:bg-gray-800 text-white px-8 py-4 transition-colors cursor-pointer text-sm font-bold"
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 text-left shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setModalBuka(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 cursor-pointer z-10"
              >
                <X size={20} />
              </button>

              {isModalLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 size={40} className="animate-spin text-[#FFCC00]" />
                  <p className="text-sm font-semibold text-gray-600">
                    Sedang memuat data pelacakan...
                  </p>
                </div>
              ) : hasilTracking ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-[#FFCC00] text-gray-950 font-extrabold text-xs px-2.5 py-1 rounded">
                      AWB: {hasilTracking.awb}
                    </span>
                    <span className="bg-green-100 text-green-800 font-bold text-xs px-2.5 py-1 rounded">
                      {hasilTracking.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Detail Pengiriman
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                      <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block">
                        Pengirim
                      </span>
                      <div className="flex items-start gap-2 text-xs text-gray-800 font-bold">
                        <User
                          size={14}
                          className="text-gray-500 mt-0.5 shrink-0"
                        />
                        <span>{hasilTracking.pengirim.nama}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <MapPin
                          size={14}
                          className="text-gray-500 mt-0.5 shrink-0"
                        />
                        <span>{hasilTracking.pengirim.alamat}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <Phone
                          size={14}
                          className="text-gray-500 mt-0.5 shrink-0"
                        />
                        <span>{hasilTracking.pengirim.noHp}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                      <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block">
                        Penerima
                      </span>
                      <div className="flex items-start gap-2 text-xs text-gray-800 font-bold">
                        <User
                          size={14}
                          className="text-gray-500 mt-0.5 shrink-0"
                        />
                        <span>{hasilTracking.penerima.nama}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <MapPin
                          size={14}
                          className="text-gray-500 mt-0.5 shrink-0"
                        />
                        <span>{hasilTracking.penerima.alamat}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <Phone
                          size={14}
                          className="text-gray-500 mt-0.5 shrink-0"
                        />
                        <span>{hasilTracking.penerima.noHp}</span>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                    Riwayat Perjalanan
                  </h4>

                  <div className="space-y-4 border-l-2 border-yellow-400 pl-4 ml-2 my-2">
                    {hasilTracking.riwayat.map((item: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 bg-[#FFCC00] rounded-full border-2 border-white shadow-xs"></div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="font-semibold text-gray-700">
                            {item.tanggal}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {item.jam}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 mt-0.5">
                          {item.keterangan}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setModalBuka(false)}
                    className="w-full bg-gray-950 hover:bg-gray-900 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-6 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-red-600 font-bold text-base mb-2">
                    Resi Tidak Ditemukan
                  </div>
                  <p className="text-gray-600 text-sm mb-6">{errorMsg}</p>
                  <button
                    onClick={() => setModalBuka(false)}
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
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
