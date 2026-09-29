import { motion } from "framer-motion";
import { Package, TruckElectric } from "lucide-react";

const Services = () => {
  const daftarLayanan = [
    {
      id: 1,
      targetId: "reguler",
      judul: "Reguler",
      deskripsi:
        "Pengiriman standar yang handal dan ekonomis ke seluruh wilayah dengan estimasi waktu yang jelas dan terukur.",
      ikon: (
        <Package size={48} className="text-[#FFCC00] mb-4 mx-auto md:mx-0" />
      ),
    },
    {
      id: 2,
      targetId: "next",
      judul: "Next Day",
      deskripsi:
        "Pengiriman kilat prioritas yang menjamin paket Anda tiba di kota tujuan keesokan harinya secara tepat waktu.",
      ikon: (
        <TruckElectric
          size={48}
          className="text-[#FFCC00] mb-4 mx-auto md:mx-0"
        />
      ),
    },
  ];

  return (
    <section
      id="layanan"
      className="py-10 md:py-16 bg-gray-50 overflow-hidden mx-4 sm:mx-6 md:mx-10 lg:mx-20 scroll-mt-24"
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="bg-[#FFCC00] text-black font-bold py-1 px-3 rounded text-sm mb-4 inline-block">
            # PILIHAN LAYANAN KAMI
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mt-2">
            Solusi Logistik &amp; Distribusi
          </h2>
          <p className="text-gray-600 mt-3 md:mt-4 max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-justify md:text-center">
            Kami menyediakan pilihan pengiriman Reguler dan Next Day yang cepat,
            aman, dan dapat diandalkan untuk menunjang kebutuhan Anda.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {daftarLayanan.map((layanan, index) => (
            <motion.div
              key={layanan.id}
              id={layanan.targetId}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-white p-6 md:p-8 rounded-lg shadow-md border-t-4 border-[#FFCC00] cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl text-center md:text-left scroll-mt-28"
            >
              {layanan.ikon}
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {layanan.judul}
              </h3>
              <p className="text-gray-600 leading-relaxed text-justify md:text-left">
                {layanan.deskripsi}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
