import { useState } from "react";
import {
  Container,
  MapPinned,
  MapPinCheck,
  BanknoteCheck,
  X,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

const CekOngkir = () => {
  const [berat, setBerat] = useState("");
  const [kotaAsal, setKotaAsal] = useState("");
  const [kotaTujuan, setKotaTujuan] = useState("");
  const [modalBuka, setModalBuka] = useState(false);
  const [hasilOngkir, setHasilOngkir] = useState<any[] | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const handleCekOngkir = (e: React.FormEvent) => {
    e.preventDefault();

    if (!berat.trim() || !kotaAsal.trim() || !kotaTujuan.trim()) {
      Swal.fire({
        title: "Kolom Belum Lengkap",
        text: "Mohon isi Berat Barang, Kota Asal, dan Kota Tujuan terlebih dahulu!",
        icon: "warning",
        confirmButtonColor: "#FFCC00",
        color: "#1f2937",
        background: "#ffffff",
      });
      return;
    }

    // Buka modal seketika dalam keadaan loading
    setModalBuka(true);
    setIsModalLoading(true);
    setHasilOngkir(null);

    // Simulasi proses perhitungan tarif di dalam modal
    setTimeout(() => {
      const beratNum = parseFloat(berat) || 1;
      setHasilOngkir([
        {
          layanan: "Reguler (REG)",
          estimasi: "2-3 Hari",
          harga: `Rp ${(15000 * beratNum).toLocaleString("id-ID")}`,
        },
        {
          layanan: "Next Day (NEXT)",
          estimasi: "1 Hari",
          harga: `Rp ${(35000 * beratNum).toLocaleString("id-ID")}`,
        },
      ]);
      setIsModalLoading(false);
    }, 800);
  };

  return (
    <div className="bg-black py-16 px-4 md:px-8">
      <div className="text-center max-w-3xl mx-auto">
        <span className="bg-[#FFCC00] text-black font-bold py-1 px-3 rounded text-sm mb-4 inline-block">
          # Cek Ongkir
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-2 mb-3">
          Cek Biaya Ongkos Kirim Paket
        </h2>
        <p className="text-gray-300 text-sm md:text-base mt-1">
          Masukkan Kota asal, Kota tujuan, dan berat pengiriman Anda.
        </p>
      </div>

      <form onSubmit={handleCekOngkir} className="max-w-4xl mx-auto mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-white text-xs font-bold mb-2">
              Berat Barang (Kg)
            </label>
            <div className="flex w-full shadow-sm">
              <div className="bg-yellow-400 text-black px-3.5 flex items-center justify-center rounded-l-md">
                <Container size={20} />
              </div>
              <input
                type="number"
                value={berat}
                onChange={(e) => setBerat(e.target.value)}
                placeholder="Contoh: 1"
                className="w-full px-4 py-3.5 focus:outline-none text-gray-800 bg-white rounded-r-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-xs font-bold mb-2">
              Kota Asal Pengiriman
            </label>
            <div className="flex w-full shadow-sm">
              <div className="bg-yellow-400 text-black px-3.5 flex items-center justify-center rounded-l-md">
                <MapPinned size={20} />
              </div>
              <input
                type="text"
                value={kotaAsal}
                onChange={(e) => setKotaAsal(e.target.value)}
                placeholder="Contoh: Jakarta"
                className="w-full px-4 py-3.5 focus:outline-none text-gray-800 bg-white rounded-r-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-xs font-bold mb-2">
              Kota Tujuan
            </label>
            <div className="flex w-full shadow-sm">
              <div className="bg-yellow-400 text-black px-3.5 flex items-center justify-center rounded-l-md">
                <MapPinCheck size={20} />
              </div>
              <input
                type="text"
                value={kotaTujuan}
                onChange={(e) => setKotaTujuan(e.target.value)}
                placeholder="Contoh: Bandung"
                className="w-full px-4 py-3.5 focus:outline-none text-gray-800 bg-white rounded-r-md text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className="w-full md:w-auto bg-yellow-400 text-black px-10 py-3.5 rounded-md font-extrabold cursor-pointer hover:bg-yellow-300 text-sm md:text-base flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <BanknoteCheck size={20} />
            CEK ONGKIR SEKARANG
          </button>
        </div>
      </form>

      <AnimatePresence>
        {modalBuka && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl relative"
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
                    Menghitung tarif ongkos kirim...
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <span className="bg-[#FFCC00] text-gray-950 font-extrabold text-xs px-2.5 py-1 rounded">
                      Hasil Cek Tarif
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                      {kotaAsal} &rarr; {kotaTujuan}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Estimasi Berat:{" "}
                      <span className="font-bold text-gray-800">
                        {berat} Kg
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3 mt-4">
                    {hasilOngkir?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div>
                          <div className="font-bold text-gray-900 text-sm">
                            {item.layanan}
                          </div>
                          <div className="text-xs text-gray-500">
                            Estimasi Sampai: {item.estimasi}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-base text-gray-900">
                            {item.harga}
                          </div>
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
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CekOngkir;
