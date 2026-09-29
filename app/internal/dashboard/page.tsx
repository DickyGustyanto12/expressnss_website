"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  Mail,
  Truck,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";

import PesanMasuk from "./components/PesanMasuk";
import TarifOngkir from "./components/TarifOngkir";
import BannerCarousel from "./components/BannerCarousel";

export default function Dashboard() {
  const router = useRouter();
  const [menuAktif, setMenuAktif] = useState("ringkasan");
  const tahunSekarang = new Date().getFullYear();

  const handleLogout = () => {
    Swal.fire({
      title: "Keluar dari Panel?",
      text: "Apakah Anda yakin ingin keluar dari sistem?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      color: "#1f2937",
      background: "#ffffff",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("isLoggedIn");
        Swal.fire({
          title: "Berhasil Keluar",
          text: "Anda telah keluar dari panel internal.",
          icon: "success",
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
          color: "#1f2937",
          background: "#ffffff",
        }).then(() => {
          router.push("/internal");
        });
      }
    });
  };

  return (
    <div className="h-screen bg-gray-100 text-gray-900 flex flex-col justify-between overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <aside className="w-72 bg-[#FFCC00] border-r border-yellow-400 p-5 flex flex-col justify-between hidden md:flex shadow-md shrink-0">
          <div>
            {/* Logo & Header Sidebar */}
            <div className="flex items-center gap-3.5 px-3 py-3.5 mb-6 border-b border-yellow-400/80 bg-white/40 backdrop-blur-xs rounded-sm shadow-xs border border-yellow-300/60">
              <div className="bg-white p-2 rounded-sm shadow-xs border border-yellow-300 flex items-center justify-center shrink-0">
                <img
                  src="/logoexpress.webp"
                  alt="Logo"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <div className="overflow-hidden flex flex-col">
                <span className="text-[10px] font-extrabold tracking-widest bg-gray-950 text-[#FFCC00] px-2 py-0.5 rounded-sm uppercase w-max mb-1 shadow-2xs">
                  NSS Express
                </span>
                <h2 className="font-extrabold text-gray-950 tracking-tight text-base">
                  ADMIN PANEL
                </h2>
              </div>
            </div>

            <div className="mb-6 px-3.5 py-3 bg-white/80 border border-yellow-300 rounded-sm flex items-center gap-3 shadow-xs">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-950 text-[#FFCC00] font-extrabold flex items-center justify-center text-xs">
                  AD
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-600 border-2 border-white rounded-full"></span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-extrabold text-gray-950 truncate">
                  Administrator
                </p>
                <p className="text-xs text-gray-600 truncate">
                  admin@nssexpress.com
                </p>
              </div>
            </div>

            <nav className="space-y-3">
              <button
                onClick={() => setMenuAktif("ringkasan")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-sm text-base transition-all duration-300 ease-in-out cursor-pointer ${
                  menuAktif === "ringkasan"
                    ? "bg-white text-gray-950 font-extrabold shadow-md border border-white translate-x-1"
                    : "text-gray-950 hover:bg-white/40 hover:translate-x-1 font-bold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <LayoutDashboard size={20} className="text-gray-950" />
                  <span>Dashboard</span>
                </div>
                <ChevronRight size={18} className="text-gray-950" />
              </button>

              <button
                onClick={() => setMenuAktif("pesan")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-sm text-base transition-all duration-300 ease-in-out cursor-pointer ${
                  menuAktif === "pesan"
                    ? "bg-white text-gray-950 font-extrabold shadow-md border border-white translate-x-1"
                    : "text-gray-950 hover:bg-white/40 hover:translate-x-1 font-bold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Mail size={20} className="text-gray-950" />
                  <span>Pesan Masuk</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                  <ChevronRight size={18} className="text-gray-950" />
                </div>
              </button>

              <button
                onClick={() => setMenuAktif("ongkir")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-sm text-base transition-all duration-300 ease-in-out cursor-pointer ${
                  menuAktif === "ongkir"
                    ? "bg-white text-gray-950 font-extrabold shadow-md border border-white translate-x-1"
                    : "text-gray-950 hover:bg-white/40 hover:translate-x-1 font-bold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Truck size={20} className="text-gray-950" />
                  <span>Tarif Ongkir</span>
                </div>
                <ChevronRight size={18} className="text-gray-950" />
              </button>

              <button
                onClick={() => setMenuAktif("carousel")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-sm text-base transition-all duration-300 ease-in-out cursor-pointer ${
                  menuAktif === "carousel"
                    ? "bg-white text-gray-950 font-extrabold shadow-md border border-white translate-x-1"
                    : "text-gray-950 hover:bg-white/40 hover:translate-x-1 font-bold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <ImageIcon size={20} className="text-gray-950" />
                  <span>Banner Carousel</span>
                </div>
                <ChevronRight size={18} className="text-gray-950" />
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-yellow-400/80">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3.5 px-4 py-4 text-white bg-red-600 hover:bg-red-700 rounded-sm text-base font-extrabold transition-all duration-300 ease-in-out hover:translate-x-1 cursor-pointer w-full shadow-sm border border-red-500"
            >
              <LogOut size={20} className="rotate-180" />
              <span>Keluar Sistem</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 bg-gray-100 overflow-y-auto min-h-0">
          {menuAktif === "ringkasan" && (
            <div className="space-y-6">
              <header className="flex justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00]">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">
                    Selamat Datang, Admin
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Berikut adalah ringkasan sistem operasional hari ini.
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="md:hidden flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-sm text-sm font-semibold shadow-md cursor-pointer"
                >
                  <LogOut size={16} className="rotate-180" /> Keluar
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => setMenuAktif("pesan")}
                  className="bg-white p-5 rounded-sm border border-gray-200 border-t-4 border-t-yellow-400 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="bg-yellow-100 w-11 h-11 rounded-sm text-yellow-700 flex items-center justify-center mb-3">
                    <Mail size={22} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      Pesan Masuk Hari Ini
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">
                      12 Pesan
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setMenuAktif("ongkir")}
                  className="bg-white p-5 rounded-sm border border-gray-200 border-t-4 border-t-blue-500 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="bg-blue-100 w-11 h-11 rounded-sm text-blue-700 flex items-center justify-center mb-3">
                    <Truck size={22} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      Tarif Ongkir Terupdate
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">
                      24 Kota
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setMenuAktif("carousel")}
                  className="bg-white p-5 rounded-sm border border-gray-200 border-t-4 border-t-green-500 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="bg-green-100 w-11 h-11 rounded-sm text-green-700 flex items-center justify-center mb-3">
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      Carousel Aktif
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">
                      4 Banner
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 border-t-4 border-t-yellow-400 rounded-sm p-6 shadow-sm flex flex-col">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 shrink-0">
                    Pesan Masuk Terbaru
                  </h2>
                  <div className="max-h-44 overflow-y-auto space-y-3 pr-1">
                    <div className="p-3 bg-gray-50 rounded-sm text-sm transition-colors hover:bg-gray-100">
                      <p className="font-semibold text-gray-900">
                        Budi Santoso
                      </p>
                      <p className="text-gray-500 text-xs">
                        Tanya jadwal pengiriman kargo...
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-sm text-sm transition-colors hover:bg-gray-100">
                      <p className="font-semibold text-gray-900">Siti Rahma</p>
                      <p className="text-gray-500 text-xs">
                        Bagaimana cara klaim asuransi barang...
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-sm text-sm transition-colors hover:bg-gray-100">
                      <p className="font-semibold text-gray-900">Ahmad Fauzi</p>
                      <p className="text-gray-500 text-xs">
                        Apakah ada layanan pengiriman makanan...
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-sm text-sm transition-colors hover:bg-gray-100">
                      <p className="font-semibold text-gray-900">
                        Dewi Lestari
                      </p>
                      <p className="text-gray-500 text-xs">
                        Konfirmasi alamat pickup paket reguler...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 border-t-4 border-t-green-500 rounded-sm p-6 shadow-sm flex flex-col">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 shrink-0">
                    Update Carousel
                  </h2>
                  <div className="max-h-44 overflow-y-auto space-y-3 pr-1">
                    <div className="p-3 bg-gray-50 rounded-sm text-sm transition-colors hover:bg-gray-100">
                      <p className="font-semibold text-gray-900">
                        Banner Utama (Promo Diskon 50%)
                      </p>
                      <p className="text-gray-500 text-xs">
                        Urutan ke-1 | Ditampilkan di Beranda
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-sm text-sm transition-colors hover:bg-gray-100">
                      <p className="font-semibold text-gray-900">
                        Banner Flash Sale Kargo
                      </p>
                      <p className="text-gray-500 text-xs">
                        Urutan ke-2 | Ditampilkan di Beranda
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-sm text-sm transition-colors hover:bg-gray-100">
                      <p className="font-semibold text-gray-900">
                        Banner Layanan Same Day
                      </p>
                      <p className="text-gray-500 text-xs">
                        Urutan ke-3 | Masuk Antrean Jadwal
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-sm text-sm transition-colors hover:bg-gray-100">
                      <p className="font-semibold text-gray-900">
                        Banner Hari Kemerdekaan
                      </p>
                      <p className="text-gray-500 text-xs">
                        Urutan ke-4 | Masuk Arsip Sistem
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 border-t-4 border-t-blue-500 rounded-sm p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Rangkuman Tabel Harga Ongkir Terupdate
                </h2>
                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-sm">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 uppercase text-xs sticky top-0 z-10 shadow-xs">
                      <tr>
                        <th className="px-4 py-3">Kota Asal</th>
                        <th className="px-4 py-3">Kota Tujuan</th>
                        <th className="px-4 py-3">Layanan</th>
                        <th className="px-4 py-3">Tarif / Kg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Bogor
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-yellow-100 text-yellow-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Reguler
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 9.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Tangerang
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Express
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 10.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Bekasi
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-yellow-100 text-yellow-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Reguler
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 9.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Bandung
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Same Day
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 25.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Semarang
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-yellow-100 text-yellow-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Reguler
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 12.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Yogyakarta
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Express
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 18.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Surabaya
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Express
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 18.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Denpasar
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-yellow-100 text-yellow-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Reguler
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 22.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Medan
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Express
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 32.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Palembang
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-yellow-100 text-yellow-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Reguler
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 20.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Balikpapan
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Express
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 35.000
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Jakarta
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          Makassar
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-yellow-100 text-yellow-800 font-extrabold px-2.5 py-1 rounded-sm text-xs">
                            Reguler
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rp 38.000
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {menuAktif === "pesan" && <PesanMasuk />}
          {menuAktif === "ongkir" && <TarifOngkir />}
          {menuAktif === "carousel" && <BannerCarousel />}
        </main>
      </div>

      <footer className="w-full bg-gray-950 text-white py-4 text-center text-xs border-t border-gray-800 shrink-0 z-10">
        <p>
          &copy; {tahunSekarang} NSS Express - Internal Admin Panel. Hak Cipta
          Dilindungi.
        </p>
      </footer>
    </div>
  );
}
