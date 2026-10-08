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
  BookOpen,
  Loader2,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Swal from "sweetalert2";

import PesanMasuk from "./components/PesanMasuk";
import TarifOngkir from "./components/TarifOngkir";
// import BannerCarousel from "./components/BannerCarousel";
import AiKnowledge from "./components/AiKnowledge";
import UpdateCabang from "./components/UpdateCabang";
import HeroBannerManager from "./components/HeroBannerManager";

export default function Dashboard() {
  const router = useRouter();
  const [menuAktif, setMenuAktif] = useState("ringkasan");
  const tahunSekarang = new Date().getFullYear();

  const [userData, setUserData] = useState({
    id: 1,
    nama: "Administrator",
    email: "admin@nssexpress.com",
  });

  const [tarifData, setTarifData] = useState<any[]>([]);
  const [bannerData, setBannerData] = useState<any[]>([]);
  const [knowledgeData, setKnowledgeData] = useState<any[]>([]);
  const [cabangData, setCabangData] = useState<any[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

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

  useEffect(() => {
    const fetchSummaryData = async () => {
      setIsLoadingSummary(true);
      try {
        const [tarifRes, bannerRes, knowledgeRes, cabangRes] =
          await Promise.all([
            fetch("/api/tarif-ongkir"),
            fetch("/api/banners"),
            fetch("/api/ai-knowledge"),
            fetch("/api/cabang"),
          ]);

        if (tarifRes.ok) {
          const data = await tarifRes.json();
          setTarifData(data.slice(0, 10));
        }

        if (bannerRes.ok) {
          const data = await bannerRes.json();
          setBannerData(data.slice(0, 10));
        }

        if (knowledgeRes.ok) {
          const data = await knowledgeRes.json();
          setKnowledgeData(data.slice(0, 5));
        }

        if (cabangRes.ok) {
          const data = await cabangRes.json();
          setCabangData(data.slice(0, 10));
        }
      } catch (error) {
        console.error("Gagal memuat data ringkasan:", error);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    if (menuAktif === "ringkasan") {
      fetchSummaryData();
    }
  }, [menuAktif]);

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

              {/*<button
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
              </button>*/}

              <button
                onClick={() => setMenuAktif("knowledge")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-sm text-base transition-all duration-300 ease-in-out cursor-pointer ${
                  menuAktif === "knowledge"
                    ? "bg-white text-gray-950 font-extrabold shadow-md border border-white translate-x-1"
                    : "text-gray-950 hover:bg-white/40 hover:translate-x-1 font-bold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <BookOpen size={20} className="text-gray-950" />
                  <span>Knowledge AI</span>
                </div>
                <ChevronRight size={18} className="text-gray-950" />
              </button>
              <button
                onClick={() => setMenuAktif("cabang")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-sm text-base transition-all duration-300 ease-in-out cursor-pointer ${
                  menuAktif === "cabang"
                    ? "bg-white text-gray-950 font-extrabold shadow-md border border-white translate-x-1"
                    : "text-gray-950 hover:bg-white/40 hover:translate-x-1 font-bold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <MapPin size={20} className="text-gray-950" />
                  <span>Update Cabang</span>
                </div>
                <ChevronRight size={18} className="text-gray-950" />
              </button>
              <button
                onClick={() => setMenuAktif("hero-banner")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-sm text-base transition-all duration-300 ease-in-out cursor-pointer ${
                  menuAktif === "hero-banner"
                    ? "bg-white text-gray-950 font-extrabold shadow-md border border-white translate-x-1"
                    : "text-gray-950 hover:bg-white/40 hover:translate-x-1 font-bold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <ImageIcon size={20} className="text-gray-950" />
                  <span>Hero Banner</span>
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
                      {tarifData.length} Data
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
                      {bannerData.filter((b) => b.status === "aktif").length}{" "}
                      Banner
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* 1. Card Preview Cabang (dengan Kolom Link Maps) */}
                <div className="bg-white rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-red-500 overflow-hidden w-full">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                      <MapPin size={18} className="text-red-600" />
                      Preview Data Cabang
                    </h3>
                    <button
                      onClick={() => setMenuAktif("cabang")}
                      className="text-xs text-red-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      Lihat Semua <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="overflow-y-auto max-h-96">
                    <table className="w-full text-sm text-left border-separate border-spacing-0">
                      <thead className="sticky top-0 bg-gray-50 z-10 text-gray-600 font-semibold border-b border-gray-200 shadow-sm">
                        <tr>
                          <th className="px-5 py-3">Kota</th>
                          <th className="px-5 py-3">Alamat Lengkap</th>
                          <th className="px-5 py-3 text-center">Koordinat</th>
                          <th className="px-5 py-3 text-center">Link Maps</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cabangData.length > 0 ? (
                          cabangData.map((item, idx) => {
                            const linkUrl =
                              item.link_maps ||
                              `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
                            return (
                              <tr
                                key={item.id || idx}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-5 py-3 font-bold text-gray-900">
                                  {item.kota}
                                </td>
                                <td className="px-5 py-3 text-gray-700 max-w-md truncate">
                                  {item.alamat}
                                </td>
                                <td className="px-5 py-3 text-center text-xs text-gray-500 font-mono">
                                  {item.lat}, {item.lng}
                                </td>
                                <td className="px-5 py-3 text-center">
                                  {item.link_maps ? (
                                    <a
                                      href={item.link_maps}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors"
                                      title={item.link_maps}
                                    >
                                      <ExternalLink size={10} />
                                      Buka Maps
                                    </a>
                                  ) : (
                                    <a
                                      href={linkUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors"
                                      title={`Buka via koordinat: ${item.lat}, ${item.lng}`}
                                    >
                                      <ExternalLink size={10} />
                                      Via Koordinat
                                    </a>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-5 py-8 text-center text-gray-500 text-sm"
                            >
                              Belum ada data cabang.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Card Preview Tarif Ongkir */}
                <div className="bg-white rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-blue-500 overflow-hidden w-full">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                      <Truck size={18} className="text-blue-600" />
                      Preview Tarif Ongkir
                    </h3>
                    <button
                      onClick={() => setMenuAktif("ongkir")}
                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      Lihat Semua <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="overflow-y-auto max-h-96">
                    <table className="w-full text-sm text-left border-separate border-spacing-0">
                      <thead className="sticky top-0 bg-gray-50 z-10 text-gray-600 font-semibold border-b border-gray-200 shadow-sm">
                        <tr>
                          <th className="px-5 py-3">Asal</th>
                          <th className="px-5 py-3">Tujuan</th>
                          <th className="px-5 py-3">Layanan</th>
                          <th className="px-5 py-3 text-right">Harga</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tarifData.length > 0 ? (
                          tarifData.map((item, idx) => (
                            <tr
                              key={item.id || idx}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-5 py-3 font-medium text-gray-900">
                                {item.kota_asal}
                              </td>
                              <td className="px-5 py-3 text-gray-700">
                                {item.kota_tujuan}
                              </td>
                              <td className="px-5 py-3">
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                  {item.layanan}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-gray-900">
                                Rp {item.harga?.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-5 py-8 text-center text-gray-500 text-sm"
                            >
                              Belum ada data tarif ongkir.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Card Preview Banner Carousel */}
                <div className="bg-white rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-green-500 overflow-hidden w-full">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                      <ImageIcon size={18} className="text-green-600" />
                      Preview Banner Carousel
                    </h3>
                    <button
                      onClick={() => setMenuAktif("carousel")}
                      className="text-xs text-green-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      Lihat Semua <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="overflow-y-auto max-h-96">
                    <table className="w-full text-sm text-left border-separate border-spacing-0">
                      <thead className="sticky top-0 bg-gray-50 z-10 text-gray-600 font-semibold border-b border-gray-200 shadow-sm">
                        <tr>
                          <th className="px-5 py-3">Judul Banner</th>
                          <th className="px-5 py-3 text-center">Urutan</th>
                          <th className="px-5 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bannerData.length > 0 ? (
                          bannerData.map((item, idx) => (
                            <tr
                              key={item.id || idx}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-5 py-3 font-medium text-gray-900 truncate max-w-md">
                                {item.judul}
                              </td>
                              <td className="px-5 py-3 text-center text-gray-700">
                                #{item.urutan}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    item.status === "aktif"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-5 py-8 text-center text-gray-500 text-sm"
                            >
                              Belum ada data banner carousel.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {menuAktif === "pesan" && (
            <PesanMasuk adminId={userData.id} adminName={userData.nama} />
          )}
          {menuAktif === "ongkir" && <TarifOngkir />}
          {/* {menuAktif === "carousel" && <BannerCarousel />} */}
          {menuAktif === "knowledge" && (
            <AiKnowledge adminId={userData.id} adminName={userData.nama} />
          )}
          {menuAktif === "cabang" && <UpdateCabang />}
          {menuAktif === "hero-banner" && <HeroBannerManager />}
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
