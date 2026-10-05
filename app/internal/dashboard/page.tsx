"use client";

import { useState, useEffect } from "react";
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

  // State untuk menyimpan data user yang login
  const [userData, setUserData] = useState({
    id: 1,
    nama: "Administrator",
    email: "admin@nssexpress.com",
  });

  // Ambil data user dari localStorage saat komponen dimuat
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          id: parsedUser.id || 1,
          nama: parsedUser.nama || "Administrator",
          email: parsedUser.email || "admin@nssexpress.com",
        });
      } catch (error) {
        console.error("Gagal membaca data user:", error);
      }
    }
  }, []);

  // Fungsi helper untuk mendapatkan inisial nama
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

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
        localStorage.removeItem("user");
        localStorage.removeItem("token");
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

            {/* Profil User Dinamis */}
            <div className="mb-6 px-3.5 py-3 bg-white/80 border border-yellow-300 rounded-sm flex items-center gap-3 shadow-xs">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-950 text-[#FFCC00] font-extrabold flex items-center justify-center text-xs">
                  {getInitials(userData.nama)}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-600 border-2 border-white rounded-full"></span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-extrabold text-gray-950 truncate">
                  {userData.nama}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {userData.email}
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
                    Selamat Datang, {userData.nama}
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

              {/* ... (Bagian grid ringkasan dan tabel ongkir tetap sama seperti kode Anda) ... */}

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
            </div>
          )}

          {/* PERBAIKAN UTAMA: Mengirimkan props adminId dan adminName ke PesanMasuk */}
          {menuAktif === "pesan" && (
            <PesanMasuk adminId={userData.id} adminName={userData.nama} />
          )}
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
