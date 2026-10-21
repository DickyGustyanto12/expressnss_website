"use client";

import { useEffect, useState } from "react";
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
import { saranKota } from "@/lib/pencocokan-kota";

interface HasilOngkir {
  layanan: string;
  estimasi: string;
  harga: string;
  rute: string;
}

interface InputKotaProps {
  label: string;
  ikon: React.ReactNode;
  value: string;
  onChange: (nilai: string) => void;
  placeholder: string;
  daftarKota: string[];
}

// Input kota dengan saran otomatis (cocok walau tidak sama persis)
const InputKota = ({
  label,
  ikon,
  value,
  onChange,
  placeholder,
  daftarKota,
}: InputKotaProps) => {
  const [fokus, setFokus] = useState(false);
  const [indexAktif, setIndexAktif] = useState(0);

  const saran = saranKota(value, daftarKota, 6).filter(
    (nama) => nama.toLowerCase() !== value.trim().toLowerCase(),
  );
  const tampilkanSaran = fokus && saran.length > 0;

  const pilih = (nama: string) => {
    onChange(nama);
    setFokus(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!tampilkanSaran) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndexAktif((prev) => (prev + 1) % saran.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndexAktif((prev) => (prev - 1 + saran.length) % saran.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pilih(saran[Math.min(indexAktif, saran.length - 1)]);
    } else if (e.key === "Escape") {
      setFokus(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-white text-xs font-bold mb-2">{label}</label>
      <div className="flex w-full shadow-sm">
        <div className="bg-yellow-400 text-black px-3.5 flex items-center justify-center rounded-l-sm">
          {ikon}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIndexAktif(0);
            setFokus(true);
          }}
          onFocus={() => setFokus(true)}
          onBlur={() => setFokus(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-4 py-3.5 focus:outline-none text-gray-800 bg-white rounded-r-sm text-sm"
        />
      </div>

      {tampilkanSaran && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-white rounded-sm shadow-xl border border-gray-200 z-30 overflow-hidden py-1">
          {saran.map((nama, idx) => (
            <li
              key={nama}
              onMouseDown={(e) => {
                e.preventDefault();
                pilih(nama);
              }}
              className={`px-4 py-2.5 text-sm text-gray-800 cursor-pointer flex items-center gap-2 ${
                idx === indexAktif ? "bg-yellow-50" : "hover:bg-gray-50"
              }`}
            >
              <MapPinned size={14} className="text-yellow-600 shrink-0" />
              {nama}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CekOngkir = () => {
  const [berat, setBerat] = useState("");
  const [kotaAsal, setKotaAsal] = useState("");
  const [kotaTujuan, setKotaTujuan] = useState("");
  const [modalBuka, setModalBuka] = useState(false);
  const [hasilOngkir, setHasilOngkir] = useState<HasilOngkir[] | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [daftarKota, setDaftarKota] = useState<{
    asal: string[];
    tujuan: string[];
  }>({ asal: [], tujuan: [] });

  useEffect(() => {
    fetch("/api/cek-ongkir")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.asal && data?.tujuan) setDaftarKota(data);
      })
      .catch(() => {});
  }, []);

  const handleCekOngkir = async (e: React.FormEvent) => {
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

    setModalBuka(true);
    setIsModalLoading(true);
    setHasilOngkir(null);

    try {
      const response = await fetch("/api/cek-ongkir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          berat,
          asal: kotaAsal,
          tujuan: kotaTujuan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Gagal mengambil data tarif",
        );
      }

      const formattedData: HasilOngkir[] = data.layanan.map((item: any) => ({
        layanan: item.nama,
        estimasi: item.estimasi,
        harga: `Rp ${item.tarif.toLocaleString("id-ID")}`,
        rute: `${item.kota_asal} → ${item.kota_tujuan}`,
      }));

      setHasilOngkir(formattedData);
    } catch (error: any) {
      setModalBuka(false);
      Swal.fire({
        title: "Gagal",
        text: error.message || "Terjadi kesalahan pada server",
        icon: "error",
        confirmButtonColor: "#FFCC00",
        color: "#1f2937",
        background: "#ffffff",
      });
    } finally {
      setIsModalLoading(false);
    }
  };

  // Kelompokkan hasil per rute (mis. "Kab. Magelang" & "Kota Magelang")
  const daftarRute = Array.from(
    new Set((hasilOngkir ?? []).map((item) => item.rute)),
  );
  const ruteTunggal = daftarRute.length === 1 ? daftarRute[0] : null;

  return (
    <div className="bg-black py-16 px-4 md:px-8">
      <div className="text-center max-w-3xl mx-auto">
        <span className="bg-[#FFCC00] text-black font-bold py-1 px-3 rounded-sm text-sm mb-4 inline-block">
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
              <div className="bg-yellow-400 text-black px-3.5 flex items-center justify-center rounded-l-sm">
                <Container size={20} />
              </div>
              <input
                type="number"
                value={berat}
                onChange={(e) => setBerat(e.target.value)}
                placeholder="Contoh: 1"
                className="w-full px-4 py-3.5 focus:outline-none text-gray-800 bg-white rounded-r-sm text-sm"
              />
            </div>
          </div>

          <InputKota
            label="Kota Asal Pengiriman"
            ikon={<MapPinned size={20} />}
            value={kotaAsal}
            onChange={setKotaAsal}
            placeholder="Contoh: Semarang"
            daftarKota={daftarKota.asal}
          />

          <InputKota
            label="Kota Tujuan"
            ikon={<MapPinCheck size={20} />}
            value={kotaTujuan}
            onChange={setKotaTujuan}
            placeholder="Contoh: Klaten"
            daftarKota={daftarKota.tujuan}
          />
        </div>

        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className="w-full md:w-auto bg-yellow-400 text-black px-10 py-3.5 rounded-sm font-extrabold cursor-pointer hover:bg-yellow-300 text-sm md:text-base flex items-center justify-center gap-2 shadow-md transition-all"
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
              className="bg-white rounded-sm max-w-lg w-full p-6 text-left shadow-2xl relative max-h-[90vh] overflow-y-auto"
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
                    <span className="bg-[#FFCC00] text-gray-950 font-extrabold text-xs px-2.5 py-1 rounded-sm">
                      Hasil Cek Tarif
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-900 mt-2 uppercase">
                      {ruteTunggal ?? `${kotaAsal} → ${kotaTujuan}`}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Estimasi Berat:{" "}
                      <span className="font-bold text-gray-800">
                        {berat} Kg
                      </span>
                    </p>
                  </div>

                  <div className="space-y-4 mt-4">
                    {daftarRute.map((rute) => (
                      <div key={rute} className="space-y-3">
                        {!ruteTunggal && (
                          <p className="text-xs font-extrabold text-gray-700 uppercase">
                            {rute}
                          </p>
                        )}
                        {hasilOngkir
                          ?.filter((item) => item.rute === rute)
                          .map((item, index) => (
                            <div
                              key={`${rute}-${index}`}
                              className="flex justify-between items-center p-4 bg-gray-50 rounded-sm border border-gray-200"
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
                    ))}
                  </div>

                  <button
                    onClick={() => setModalBuka(false)}
                    className="w-full bg-gray-950 hover:bg-gray-900 text-white font-bold py-3 rounded-sm text-sm transition-colors mt-6 cursor-pointer"
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
