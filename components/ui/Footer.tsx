import { MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  const tahunSekarang = new Date().getFullYear();

  const tautanCepat = [
    { nama: "Beranda", link: "#" },
    { nama: "Tentang Kami", link: "#tentang-kami" },
    { nama: "Layanan", link: "#layanan" },
    { nama: "Jaringan Cabang", link: "#cabang" },
    { nama: "Kontak", link: "#kontak" },
  ];

  return (
    <footer className="bg-gray-950 text-white pt-12 md:pt-16 pb-8 border-t-4 border-[#FFCC00]">
      <div className="container mx-auto min-w-full px-5 sm:px-8 md:px-10 lg:px-45">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-12">
          <div className="flex flex-col items-start text-left">
            <h2 className="text-3xl font-extrabold text-[#FFCC00] mb-4 tracking-wider w-full text-center md:text-left">
              NSS EXPRESS
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed text-justify">
              Solusi logistik dan distribusi terpercaya untuk menjangkau seluruh
              Nusantara. Cepat, aman, dan tepat waktu ke tangan pelanggan Anda.
            </p>
            <div className="flex gap-4 justify-center md:justify-start w-full md:w-auto">
              <a
                href="#"
                className="bg-gray-800 p-2 rounded-full hover:bg-[#FFCC00] hover:text-black transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a
                href="#"
                className="bg-gray-800 p-2 rounded-full hover:bg-[#FFCC00] hover:text-black transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="#"
                className="bg-gray-800 p-2 rounded-full hover:bg-[#FFCC00] hover:text-black transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col items-start text-left">
            <h3 className="text-lg font-bold mb-6 text-white w-full text-center md:text-left">
              Tautan Cepat
            </h3>
            <ul className="space-y-3 w-full">
              {tautanCepat.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.link}
                    className="text-gray-400 hover:text-[#FFCC00] transition-colors duration-300 flex items-center justify-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-[#FFCC00] rounded-full flex-shrink-0"></span>
                    {item.nama}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-start text-left">
            <h3 className="text-lg font-bold mb-6 text-white w-full text-center md:text-left">
              Hubungi Kami
            </h3>
            <div className="space-y-4 w-full">
              <div className="flex items-start gap-3 justify-start">
                <MapPin
                  size={20}
                  className="text-[#FFCC00] flex-shrink-0 mt-1"
                />
                <p className="text-gray-400 text-sm leading-relaxed text-left">
                  Jl. Brigdjen Katamso No.5, Slipi, Jakarta Barat
                </p>
              </div>
              <div className="flex items-center gap-3 justify-start">
                <Phone size={20} className="text-[#FFCC00] flex-shrink-0" />
                <p className="text-gray-400 text-sm text-left">0811-2551-010</p>
              </div>
              <div className="flex items-center gap-3 justify-start">
                <Mail size={20} className="text-[#FFCC00] flex-shrink-0" />
                <p className="text-gray-400 text-sm text-left">
                  info@nssexpress.com
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 text-center md:text-left">
          <p>&copy; {tahunSekarang} NSS Express. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6 justify-center">
            <a href="#" className="hover:text-[#FFCC00] transition-colors">
              Syarat & Ketentuan
            </a>
            <a href="#" className="hover:text-[#FFCC00] transition-colors">
              Kebijakan Privasi
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
