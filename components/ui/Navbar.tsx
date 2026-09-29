"use client";

import { useState } from "react";
import Link from "next/link";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileLayananOpen, setIsMobileLayananOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#ffe30e]/95 backdrop-blur-md text-gray-900 shadow-sm transition-all duration-300">
      <div className="mx-0 px-0 md:mx-10 md:px-6 lg:px-16">
        <div className="flex justify-between items-center lg:h-20 h-15">
          <Link
            href="/#beranda"
            className="ml-10 md:ml-10 shrink-0 cursor-pointer flex items-center hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/logoexpress.webp"
              alt="Logo NSS Express"
              className="h-15 lg:h-30 w-auto object-contain drop-shadow-sm"
            />
          </Link>

          <div className="hidden md:flex items-center h-full space-x-8 font-bold text-[16px] tracking-wide">
            <Link
              href="/#beranda"
              className="group relative hover:text-blue-700 transition duration-300 py-2"
            >
              BERANDA
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <div
              className="relative flex items-center h-full"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <Link
                href="/#layanan"
                className="cursor-pointer flex items-center gap-1 relative hover:text-blue-700 transition duration-300 focus:outline-none py-2"
              >
                <span>LAYANAN</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 transition-all duration-300 group-hover:w-full"></span>
              </Link>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-48 bg-white rounded-sm shadow-xl border border-gray-100 py-2 animate-fade-in-up">
                  <Link
                    href="/#reguler"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2.5 text-[16px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    REGULER
                  </Link>
                  <Link
                    href="/#next"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2.5 text-[16px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    NEXT
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/#tentang-kami"
              className="group relative hover:text-blue-700 transition duration-300 py-2"
            >
              TENTANG KAMI
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <Link
              href="/#kontak"
              className="group relative hover:text-blue-700 transition duration-300 py-2"
            >
              KONTAK KAMI
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <Link
              href="/#cabang"
              className="group relative hover:text-blue-700 transition duration-300 py-2"
            >
              CABANG
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>

          <div className="md:hidden flex items-center mr-10">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-900 hover:text-red-600 focus:outline-none bg-white/20 rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "max-h-[500px] opacity-100 border-t border-gray-100"
            : "max-h-0 opacity-0 border-transparent"
        }`}
      >
        <div className="flex flex-col py-6 px-10 gap-5">
          <Link
            href="/#beranda"
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-bold text-[16px] text-gray-800 hover:text-blue-700"
          >
            BERANDA
          </Link>

          <div className="flex flex-col gap-3 -mb-3">
            <button
              onClick={() => setIsMobileLayananOpen(!isMobileLayananOpen)}
              className="flex items-center justify-between font-bold text-[16px] text-gray-800 hover:text-blue-700 text-left focus:outline-none cursor-pointer"
            >
              <span>LAYANAN</span>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isMobileLayananOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>

            <div
              className={`flex flex-col pl-4 border-l-2 border-yellow-400 overflow-hidden transition-all duration-300 ease-in-out ${
                isMobileLayananOpen
                  ? "max-h-40 opacity-100 gap-3 mt-1 mb-3"
                  : "max-h-0 opacity-0"
              }`}
            >
              <Link
                href="/#reguler"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsMobileLayananOpen(false);
                }}
                className="text-gray-600 font-semibold hover:text-blue-700"
              >
                REGULER
              </Link>
              <Link
                href="/#next"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsMobileLayananOpen(false);
                }}
                className="text-gray-600 font-semibold hover:text-blue-700"
              >
                NEXT
              </Link>
            </div>
          </div>

          <Link
            href="/#tentang-kami"
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-bold text-[16px] text-gray-800 hover:text-blue-700"
          >
            TENTANG KAMI
          </Link>

          <Link
            href="/#kontak"
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-bold text-[16px] text-gray-800 hover:text-blue-700"
          >
            KONTAK KAMI
          </Link>

          <Link
            href="/#cabang"
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-bold text-[16px] text-gray-800 hover:text-blue-700"
          >
            CABANG
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
