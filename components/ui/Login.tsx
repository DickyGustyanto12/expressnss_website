import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import Swal from "sweetalert2";
import Banner2 from "../assets/banner2.webp";
import Logo from "../assets/logoexpress.webp";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const daftarAkunDummy = [
    { email: "admin@nssexpress.co.id", password: "123456" },
    { email: "staff@nssexpress.co.id", password: "password123" },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const akunDitemukan = daftarAkunDummy.find(
      (akun) => akun.email === email && akun.password === password,
    );

    if (akunDitemukan) {
      localStorage.setItem("isLoggedIn", "true");
      Swal.fire({
        title: "Login Berhasil!",
        text: "Selamat datang kembali di panel internal NSS Express.",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        color: "#31371fff",
        background: "#ffffff",
      }).then(() => {
        navigate("/internal/dashboard");
      });
    } else {
      Swal.fire({
        title: "Login Gagal",
        text: "Email atau password yang kamu masukkan salah.",
        icon: "error",
        confirmButtonColor: "#FFCC00",
        confirmButtonText: "Coba Lagi",
        color: "#1f2937",
        background: "#ffffff",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white border border-gray-200 border-t-4 border-t-[#FFCC00] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <img
                src={Logo}
                alt="Logo NSS Express"
                className="lg:scale-60 object-contain"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Masuk ke Sistem Internal
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Silakan masukkan akun Anda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Email Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nssexpress.co.id"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold py-3 px-4 rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              LOGIN
            </button>
          </form>
        </div>

        <div className="hidden lg:block relative bg-gray-900">
          <img
            src={Banner2}
            alt="Banner Logistik"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-90"></div>
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <span className="bg-[#FFCC00] text-gray-950 font-bold px-3 py-1 rounded text-xs mb-3 inline-block">
              LOGISTIK TERPERCAYA
            </span>
            <h3 className="text-xl font-extrabold">
              Solusi Pengiriman Cepat & Aman
            </h3>
            <p className="text-gray-300 text-sm mt-1">
              Kelola operasional pengiriman seluruh nusantara dengan mudah dalam
              satu panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
