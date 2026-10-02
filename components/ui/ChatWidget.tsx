"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  ArrowLeft,
  ExternalLink,
  Phone,
  Loader2,
} from "lucide-react";
import { useLiveChatSocket } from "../../app/hooks/use-live-chat-socket";
interface PesanChat {
  id: number;
  pengirim: "admin" | "user";
  teks: string;
  waktu: string;
}

interface ChatWidgetProps {
  bukaChat?: boolean;
  setBukaChat?: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatWidget = ({
  bukaChat: externalBukaChat,
  setBukaChat: externalSetBukaChat,
}: ChatWidgetProps = {}) => {
  const [internalBukaChat, setInternalBukaChat] = useState(false);

  const bukaChat =
    externalBukaChat !== undefined ? externalBukaChat : internalBukaChat;

  const setBukaChat = externalSetBukaChat || setInternalBukaChat;
  const [sudahMulai, setSudahMulai] = useState(false);
  const [nama, setNama] = useState("");
  const [nomorHp, setNomorHp] = useState("");
  const [pesanInput, setPesanInput] = useState("");
  const [daftarPesan, setDaftarPesan] = useState<PesanChat[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const socket = useLiveChatSocket(conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [daftarPesan]);

  useEffect(() => {
    if (sudahMulai) {
      inputRef.current?.focus();
    }
  }, [sudahMulai]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message:new", (data: any) => {
      if (data.senderType === "admin") {
        const pesanBaruAdmin: PesanChat = {
          id: data.id || Date.now(),
          pengirim: "admin",
          teks: data.message,
          waktu: new Date(data.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setDaftarPesan((prev) => [...prev, pesanBaruAdmin]);
      }
    });

    return () => {
      socket.off("message:new");
    };
  }, [socket]);

  const dapatkanWaktuSekarang = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleNamaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[A-Za-z\s]*$/.test(val)) {
      setNama(val);
    }
  };

  const handleNomorHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[0-9]*$/.test(val)) {
      setNomorHp(val);
    }
  };

  const handleMulaiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !nomorHp.trim()) {
      alert("Harap lengkapi nama dan nomor WhatsApp Anda terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/live-chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, whatsapp: nomorHp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal memulai sesi chat");
      }

      setConversationId(data.conversationId);
      setSudahMulai(true);
      setDaftarPesan([
        {
          id: 1,
          pengirim: "admin",
          teks: `Halo Kak ${nama}! Selamat datang di NSS Express. Tim Customer Service kami akan segera merespons percakapan ini.`,
          waktu: dapatkanWaktuSekarang(),
        },
      ]);
    } catch (error) {
      alert("Terjadi kesalahan saat memulai chat. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKirimPesan = () => {
    if (!pesanInput.trim() || !socket || !conversationId) return;

    const clientMessageId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const teksKirim = pesanInput;

    const pesanBaruUser: PesanChat = {
      id: Date.now(),
      pengirim: "user",
      teks: teksKirim,
      waktu: dapatkanWaktuSekarang(),
    };

    setDaftarPesan((prev) => [...prev, pesanBaruUser]);
    setPesanInput("");

    socket.emit("message:send", {
      conversationId,
      clientMessageId,
      message: teksKirim,
      senderType: "customer",
    });
  };

  const handleBukaWhatsAppLangsung = () => {
    const teksWA = encodeURIComponent(
      `Halo NSS Express, saya ${nama || "Pelanggan"} (${nomorHp || "-"}). Saya ingin bertanya informasi pengiriman.`,
    );
    window.open(`https://wa.me/628112551010?text=${teksWA}`, "_blank");
  };

  return (
    <aside
      aria-label="Live Chat Support"
      className="fixed bottom-6 right-4 md:right-6 z-50 flex flex-col items-end"
    >
      <AnimatePresence>
        {bukaChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[90vw] sm:w-[350px] max-w-[360px] bg-white rounded-sm shadow-2xl overflow-hidden border-2 border-[#FFCC00] mb-3 flex flex-col h-[480px] max-h-[82vh]"
          >
            <div className="bg-[#FFCC00] text-black px-3.5 py-3 flex items-center justify-between shadow-sm border-b border-yellow-400 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-sm bg-black text-[#FFCC00] flex items-center justify-center shadow-sm">
                    <Phone size={16} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#FFCC00] rounded-full"></span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight text-black flex items-center gap-1">
                    Customer Service
                  </h4>
                  <p className="text-[11px] text-black font-bold mt-0.5">
                    Realtime Support
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Tutup jendela chat"
                onClick={() => setBukaChat(false)}
                className="text-black hover:bg-yellow-400 p-1.5 rounded-sm transition-colors cursor-pointer"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {!sudahMulai ? (
              <div className="p-4 sm:p-5 bg-white overflow-y-auto flex-1 flex flex-col justify-center">
                <div className="w-9 h-9 bg-[#FFCC00] text-gray-950 rounded-sm flex items-center justify-center mb-2.5 shadow-sm">
                  <MessageSquare size={18} className="text-gray-950" />
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-extrabold text-gray-900">
                    Halo!
                  </h3>
                </div>

                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3.5">
                  Silakan isi nama dan nomor WhatsApp Anda untuk mulai mengobrol
                  langsung dengan tim admin kami.
                </p>

                <form onSubmit={handleMulaiChat} className="space-y-2.5">
                  <div>
                    <label
                      htmlFor="chat-input-nama"
                      className="block text-xs font-bold text-gray-800 mb-1"
                    >
                      Nama
                    </label>
                    <input
                      id="chat-input-nama"
                      type="text"
                      required
                      value={nama}
                      onChange={handleNamaChange}
                      placeholder="Nama Anda"
                      className="w-full px-3 py-2.5 rounded-sm border border-gray-300 text-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="chat-input-nohp"
                      className="block text-xs font-bold text-gray-800 mb-1"
                    >
                      Nomor HP / WhatsApp
                    </label>
                    <input
                      id="chat-input-nohp"
                      type="tel"
                      required
                      value={nomorHp}
                      onChange={handleNomorHpChange}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-3 py-2.5 rounded-sm border border-gray-300 text-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold py-3 px-4 rounded-sm text-xs sm:text-sm transition-all shadow-md cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <span>Mulai Chat</span>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col flex-1 bg-slate-50 overflow-hidden">
                <div className="px-3 py-1.5 bg-yellow-100 border-b border-yellow-200 flex items-center justify-between text-[11px] text-gray-800 shrink-0">
                  <button
                    onClick={() => setSudahMulai(false)}
                    className="flex items-center gap-1 hover:text-yellow-800 transition-colors cursor-pointer font-semibold"
                  >
                    <ArrowLeft size={12} /> Ganti Data ({nama})
                  </button>
                  <button
                    onClick={handleBukaWhatsAppLangsung}
                    className="flex items-center gap-1 text-emerald-800 hover:text-emerald-900 font-semibold cursor-pointer"
                  >
                    Buka WA <ExternalLink size={10} />
                  </button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                  {daftarPesan.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.pengirim === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-sm text-xs sm:text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                          msg.pengirim === "user"
                            ? "bg-[#FFCC00] text-gray-950 font-medium rounded-br-none"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                        }`}
                      >
                        {msg.teks}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                        {msg.waktu}
                      </span>
                    </div>
                  ))}

                  <div ref={messagesEndRef} />
                </div>

                <div className="p-2.5 bg-white border-t border-gray-200 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={inputRef}
                      type="text"
                      value={pesanInput}
                      onChange={(e) => setPesanInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleKirimPesan()}
                      placeholder="Ketik pesan Anda..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] text-gray-800 placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleKirimPesan}
                      className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 p-2 rounded-sm transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setBukaChat(!bukaChat)}
        className="bg-white hover:bg-yellow-100 shadow-xl border-2 border-[#FFCC00] rounded-full py-2 px-3.5 flex items-center gap-2.5 cursor-pointer transition-colors duration-200"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-[#FFCC00] text-black flex items-center justify-center shadow-sm">
            <Phone size={16} />
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="text-left pr-1">
          <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm leading-tight">
            Customer Service
          </h4>
          <p className="text-[10px] sm:text-[11px] text-gray-600 leading-tight">
            Siap Membantu
          </p>
        </div>
      </motion.button>
    </aside>
  );
};

export default ChatWidget;
