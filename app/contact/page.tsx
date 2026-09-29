import { motion } from "framer-motion";
import { MessageSquareText, Headphones, ArrowRight } from "lucide-react";

interface ContactUsProps {
  onBukaChat?: () => void;
}

const ContactUs = ({ onBukaChat }: ContactUsProps) => {
  const handleChatCS = () => {
    if (onBukaChat) {
      onBukaChat();
    }
  };

  return (
    <section
      id="kontak"
      className="py-12 md:py-24 bg-white overflow-hidden text-gray-900 scroll-mt-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-7/12 text-center md:text-left"
          >
            <span className="bg-[#FFCC00] text-black font-bold py-1.5 px-4 rounded-full text-xs mb-6 inline-block uppercase tracking-wider">
              Hubungi Kami
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 md:mb-6 leading-tight">
              Punya Pertanyaan atau Terdapat Kendala?
            </h2>

            <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-6 md:mb-8 leading-relaxed max-w-xl text-justify md:text-left mx-auto md:mx-0">
              Jangan ragu, Tim Customer Service kami yang ramah siap membantu
              merespons segala pertanyaan atau keluhan logistik Anda secara
              cepat via chat.
            </p>

            <button
              onClick={handleChatCS}
              className="bg-[#FFCC00] hover:bg-yellow-400 text-black font-bold py-3.5 px-7 md:py-4 md:px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 mx-auto md:mx-0 shadow-md hover:scale-105 cursor-pointer"
            >
              <MessageSquareText size={22} />
              <span>Chat Customer Service Sekarang</span>
              <ArrowRight size={18} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-5/12 flex justify-center items-center"
          >
            <div className="relative bg-[#FFCC00]/20 p-8 sm:p-12 md:p-16 rounded-full border border-[#FFCC00]/40 shadow-inner">
              <Headphones
                size={70}
                className="text-yellow-600 animate-bounce"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
