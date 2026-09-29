import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, ExternalLink } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Swal from "sweetalert2";

const penandaKuning = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = penandaKuning;

interface TipeCabang {
  id: number;
  kota: string;
  lat: number;
  lng: number;
  alamat: string;
  linkMaps?: string;
}

const PengaturTampilanPeta = ({ lat, lng }: { lat: number; lng: number }) => {
  const peta = useMap();
  peta.setView([lat, lng], 13);
  return null;
};

const Cabang = () => {
  const [cabangTerpilih, setCabangTerpilih] = useState<TipeCabang | null>(null);
  const [kataKunci, setKataKunci] = useState("");

  const titikTengahPeta: [number, number] = [-2.5489, 118.0149];

  const daftarCabang: TipeCabang[] = [
    {
      id: 1,
      kota: "Jakarta",
      lat: -6.1892425,
      lng: 106.8011406,
      alamat: "Jl. Brigdjen Katamso No.5, Slipi, Jakarta Barat",
      linkMaps: "https://maps.app.goo.gl/P9GCzTuXhcoqXU2v7",
    },
    {
      id: 2,
      kota: "Semarang",
      lat: -6.9932,
      lng: 110.4203,
      alamat:
        "Jl. Kaligawe Raya, Terboyo Kulon, Kec. Genuk, Kota Semarang, Jawa Tengah 50112",
      linkMaps: "https://maps.app.goo.gl/mAhZznDVrrPCyBTcA",
    },
    {
      id: 3,
      kota: "Surabaya",
      lat: -7.3728327,
      lng: 112.7662824,
      alamat: "Pergudangan 88 Blok B27 Jl. Raya Pabean",
    },
  ];

  const tanganiPencarian = () => {
    if (!kataKunci.trim()) return;

    const hasilPencarian = daftarCabang.find(
      (cabang) =>
        cabang.kota.toLowerCase().includes(kataKunci.toLowerCase()) ||
        cabang.alamat.toLowerCase().includes(kataKunci.toLowerCase()),
    );

    if (hasilPencarian) {
      setCabangTerpilih(hasilPencarian);
    } else {
      Swal.fire({
        title: "Cabang Tidak Ditemukan",
        text: "Maaf, cabang yang Anda cari belum tersedia.",
        icon: "warning",
        confirmButtonText: "Mengerti",
        confirmButtonColor: "#FFCC00",
        customClass: {
          confirmButton: "!text-black font-bold",
        },
        color: "#111827",
        background: "#ffffff",
      });
    }
  };

  return (
    <section
      id="cabang"
      className="py-14 md:py-20 bg-gray-50 overflow-hidden border-t border-gray-200 mx-4 sm:mx-6 lg:mx-0 scroll-mt-24"
    >
      <div className="container px-4 sm:px-6 md:px-10 max-w-full lg:px-45">
        <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-6/12 space-y-8 z-10 lg:sticky lg:top-24"
          >
            <div className="text-center lg:text-left">
              <span className="bg-[#FFCC00] text-black font-bold py-1 px-3 rounded text-sm mb-4 inline-block">
                # LOKASI CABANG
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 md:mb-4 leading-tight">
                Temukan Cabang NSS Express Terdekat
              </h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed text-justify lg:text-left">
                Pilih atau cari cabang pada peta untuk melihat detail lokasi
                operasional kami.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                tanganiPencarian();
              }}
              className="flex w-full bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-black transition-all"
            >
              <div className="pl-4 flex items-center justify-center text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={kataKunci}
                onChange={(e) => setKataKunci(e.target.value)}
                placeholder="Masukkan kota atau kecamatan"
                className="w-full px-4 py-4 focus:outline-none text-gray-700"
              />
              <button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-4 transition-colors cursor-pointer"
              >
                Cari
              </button>
            </form>

            {cabangTerpilih && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-t-4 border-[#FFCC00] p-6 rounded-xl shadow-md flex flex-col gap-4 text-center lg:text-left lg:max-w-md lg:h-fit"
              >
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3">
                  <div className="bg-black p-2 rounded-full mt-1">
                    <MapPin size={20} className="text-[#FFCC00]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      NSS Express {cabangTerpilih.kota}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-justify lg:text-left">
                      {cabangTerpilih.alamat}
                    </p>
                  </div>
                </div>

                <a
                  href={
                    cabangTerpilih.linkMaps ||
                    `https://www.google.com/maps/search/?api=1&query=${cabangTerpilih.lat},${cabangTerpilih.lng}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#FFCC00] hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg transition-colors duration-300 text-sm mt-2"
                >
                  <ExternalLink size={18} />
                  Buka Rute di Google Maps
                </a>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-6/12 h-[380px] lg:h-[480px] rounded-2xl overflow-hidden shadow-xl border-4 border-gray-100 relative z-0"
          >
            <MapContainer
              center={titikTengahPeta}
              zoom={5}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {cabangTerpilih && (
                <PengaturTampilanPeta
                  lat={cabangTerpilih.lat}
                  lng={cabangTerpilih.lng}
                />
              )}

              {daftarCabang.map((cabang) => (
                <Marker
                  key={cabang.id}
                  position={[cabang.lat, cabang.lng]}
                  eventHandlers={{
                    click: () => setCabangTerpilih(cabang),
                  }}
                >
                  <Popup>
                    <div className="font-bold text-gray-900">{cabang.kota}</div>
                    <div className="text-gray-600 text-xs mt-1">
                      Klik penanda untuk melihat detail
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Cabang;
