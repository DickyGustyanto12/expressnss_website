import { motion } from 'framer-motion';
import { Shield, Zap, Globe } from 'lucide-react';

const AboutUs = () => {
  const statistik = [
    { id: 1, angka: "15+", label: "Tahun Pengalaman" },
    { id: 2, angka: "500+", label: "Armada Kendaraan" },
    { id: 3, angka: "50+", label: "Cabang Seluruh Indonesia" },
    { id: 4, angka: "1M+", label: "Paket Terkirim" }
  ];

  const nilaiInti = [
    {
      id: 1,
      judul: "Kecepatan Menjadi Prioritas",
      deskripsi: "Waktu adalah uang. Kami memastikan setiap barang Anda sampai di tujuan tepat waktu sesuai jadwal.",
      ikon: <Zap size={40} className="text-[#FFCC00] mb-4 mx-auto md:mx-0" />
    },
    {
      id: 2,
      judul: "Keamanan Terjamin", 
      deskripsi: "Dari titik penjemputan hingga pengantaran, paket Anda selalu berada dalam pengawasan ketat dan asuransi penuh.",
      ikon: <Shield size={40} className="text-[#FFCC00] mb-4 mx-auto md:mx-0" />
    },
    {
      id: 3,
      judul: "Jangkauan Luas",
      deskripsi: "Jaringan distribusi kami menjangkau hingga ke pelosok negeri, memastikan tidak ada batasan untuk bisnis Anda.",
      ikon: <Globe size={40} className="text-[#FFCC00] mb-4 mx-auto md:mx-0" />
    }
  ];

  return (
    <section id="tentang-kami" className="py-14 md:py-20 bg-gray-950 overflow-hidden text-white scroll-mt-24">
      <div className="container px-5 sm:px-8 md:px-10 max-w-full lg:px-45">
        <div className="flex flex-col md:flex-row items-center gap-16 mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-1/2 text-center md:text-left"
          >
            <span className="bg-[#FFCC00] text-black font-bold py-1 px-3 rounded text-sm mb-4 inline-block">
              # TENTANG KAMI
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 md:mb-6 leading-tight">
              Menjadi Penggerak Utama Rantai Pasok Nusantara
            </h2>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-4 md:mb-6 text-justify md:text-left">
              Berawal dari sebuah komitmen kecil untuk membantu UMKM lokal, kami telah berkembang menjadi mitra logistik terpercaya dengan ribuan rute pengiriman setiap harinya. 
            </p>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed text-justify md:text-left">
              Kami tidak hanya memindahkan barang, tapi kami memastikan roda bisnis Anda terus berputar dengan efisien, aman, dan tanpa hambatan.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-1/2 grid grid-cols-2 gap-3 md:gap-4 max-w-lg mx-auto"
          >
            {statistik.map((stat) => (
              <div key={stat.id} className="bg-gray-900 p-4 md:p-6 rounded-xl border border-gray-800 text-center hover:border-[#FFCC00] transition-colors duration-300 aspect-square flex flex-col justify-center items-center hover:-translate-y-1">
                <h3 className="text-3xl md:text-4xl font-black text-[#FFCC00] mb-2">{stat.angka}</h3>
                <p className="text-gray-400 font-medium text-sm md:text-base leading-tight">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Mengapa Memilih Kami?</h3>
            <div className="w-24 h-1 bg-[#FFCC00] mx-auto rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {nilaiInti.map((nilai, index) => (
              <motion.div 
                key={nilai.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:-translate-y-2 transition-transform duration-300 text-center md:text-left"
              >
                {nilai.ikon}
                <h4 className="text-xl font-bold mb-3">{nilai.judul}</h4>
                <p className="text-gray-400 leading-relaxed text-justify md:text-left">{nilai.deskripsi}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutUs;