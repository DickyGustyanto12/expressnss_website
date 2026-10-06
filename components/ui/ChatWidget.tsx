"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  ArrowLeft,
  Phone,
  Loader2,
  WifiOff,
  Wifi,
  Lock,
  Bot,
  Users,
} from "lucide-react";
import { useLiveChatSocket } from "../../app/hooks/use-live-chat-socket";
import { QUICK_QUESTIONS } from "@/components/ui/aiConfig";

interface PesanChat {
  id: number;
  pengirim: "admin" | "user" | "ai";
  teks: string;
  waktu: string;
  clientMessageId?: string;
}

interface ChatWidgetProps {
  bukaChat?: boolean;
  setBukaChat?: React.Dispatch<React.SetStateAction<boolean>>;
}

type ChatMode = "ai" | "form" | "live";

const ChatWidget = ({
  bukaChat: externalBukaChat,
  setBukaChat: externalSetBukaChat,
}: ChatWidgetProps = {}) => {
  const [internalBukaChat, setInternalBukaChat] = useState(false);
  const bukaChat = externalBukaChat !== undefined ? externalBukaChat : internalBukaChat;
  const setBukaChat = externalSetBukaChat || setInternalBukaChat;

  const [chatMode, setChatMode] = useState<ChatMode>("ai");
  const [nama, setNama] = useState("");
  const [nomorHp, setNomorHp] = useState("");
  const [pesanInput, setPesanInput] = useState("");
  const [daftarPesan, setDaftarPesan] = useState<PesanChat[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showHumanButton, setShowHumanButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { socket, status } = useLiveChatSocket(
    chatMode === "live" ? token : null,
    chatMode === "live" ? conversationId : null,
    false
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [daftarPesan, isAiThinking]);

  useEffect(() => {
    if (!socket || chatMode !== "live") return;

    const handleMessageNew = (data: any) => {
      if (data.senderType === "admin") {
        const pesanBaruAdmin: PesanChat = {
          id: data.id || Date.now(),
          pengirim: "admin",
          teks: data.message,
          waktu: new Date(data.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setDaftarPesan((prev) => {
          const exists = prev.find((p) => p.id === data.id || p.clientMessageId === data.clientMessageId);
          if (exists) return prev;
          return [...prev, pesanBaruAdmin];
        });
      }
    };

    const handleConversationUpdated = (data: any) => {
      if (data.conversationId === parseInt(conversationId || "0") && data.status === "closed") {
        setIsClosed(true);
      }
    };

    socket.on("message:new", handleMessageNew);
    socket.on("conversation:updated", handleConversationUpdated);

    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("conversation:updated", handleConversationUpdated);
    };
  }, [socket, chatMode, conversationId]);

  const dapatkanWaktuSekarang = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleAiMessage = async () => {
    if (!pesanInput.trim() || isAiThinking) return;

    const userText = pesanInput;
    setPesanInput("");
    setUserMessageCount((prev) => prev + 1);

    const userMsg: PesanChat = { id: Date.now(), pengirim: "user", teks: userText, waktu: dapatkanWaktuSekarang() };
    setDaftarPesan((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const chatHistoryForApi = daftarPesan.map((p) => ({
        pengirim: p.pengirim === "ai" ? "model" : p.pengirim,
        teks: p.teks,
      }));

      const res = await fetch("/api/gemini-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, chatHistory: chatHistoryForApi }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setDaftarPesan((prev) => [
          ...prev,
          { id: Date.now() + 1, pengirim: "ai", teks: data.reply, waktu: dapatkanWaktuSekarang() },
        ]);
      } else {
        throw new Error("Gagal mendapatkan jawaban AI");
      }
    } catch (error) {
      setDaftarPesan((prev) => [
        ...prev,
        { id: Date.now() + 1, pengirim: "ai", teks: "Maaf, terjadi kesalahan pada sistem. Silakan hubungi Customer Service kami.", waktu: dapatkanWaktuSekarang() },
      ]);
    } finally {
      setIsAiThinking(false);

      if (userMessageCount + 1 >= 3) {
        setTimeout(() => setShowHumanButton(true), 1000);
      }
    }
  };

  const handleMulaiLiveChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !nomorHp.trim()) {
      alert("Harap lengkapi nama dan nomor WhatsApp Anda.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/live-chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: nama, customer_whatsapp: nomorHp }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal memulai sesi chat");

      setToken(data.token);
      setConversationId(data.conversationId.toString());
      setChatMode("live");
      setIsClosed(false);

      localStorage.setItem("live_chat_token", data.token);
      localStorage.setItem("live_chat_conversation_id", data.conversationId.toString());
      localStorage.setItem("live_chat_nama", nama);
      localStorage.setItem("live_chat_nomor_hp", nomorHp);

      setDaftarPesan([
        {
          id: 1,
          pengirim: "admin",
          teks: `Halo Kak ${nama}! Tim Customer Service kami telah terhubung. Ada yang bisa kami bantu?`,
          waktu: dapatkanWaktuSekarang(),
        },
      ]);
    } catch (error) {
      alert("Terjadi kesalahan saat menghubungkan ke agen. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKirimPesanLive = () => {
    if (isClosed || !pesanInput.trim() || !socket || !conversationId) return;

    const clientMessageId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const teksKirim = pesanInput;

    const pesanBaruUser: PesanChat = {
      id: Date.now(),
      pengirim: "user",
      teks: teksKirim,
      waktu: dapatkanWaktuSekarang(),
      clientMessageId,
    };

    setDaftarPesan((prev) => [...prev, pesanBaruUser]);
    setPesanInput("");

    socket.emit(
      "message:send",
      { conversationId: parseInt(conversationId), clientMessageId, message: teksKirim, senderType: "customer" },
      (response: any) => {
        if (!response?.success) alert(response?.error || "Gagal mengirim pesan.");
      }
    );
  };

  const resetChat = () => {
    setChatMode("ai");
    setNama("");
    setNomorHp("");
    setPesanInput("");
    setDaftarPesan([]);
    setConversationId(null);
    setToken(null);
    setIsClosed(false);
    setUserMessageCount(0);
    setShowHumanButton(false);
    localStorage.removeItem("live_chat_token");
    localStorage.removeItem("live_chat_conversation_id");
  };

  return (
    <aside aria-label="Live Chat Support" className="fixed bottom-6 right-4 md:right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {bukaChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[90vw] sm:w-[380px] max-w-[400px] bg-white rounded-sm shadow-2xl overflow-hidden border-2 border-[#FFCC00] mb-3 flex flex-col h-[550px] max-h-[85vh]"
          >
            <div className="bg-[#FFCC00] text-black px-3.5 py-3 flex items-center justify-between shadow-sm border-b border-yellow-400 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-sm bg-black text-[#FFCC00] flex items-center justify-center shadow-sm">
                    {chatMode === "ai" ? <Bot size={16} /> : <Phone size={16} />}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#FFCC00] rounded-full"></span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight text-black">
                    {chatMode === "ai" ? "Asisten Virtual NSS" : "Customer Service"}
                  </h4>
                  <p className="text-[10px] text-black font-bold">
                    {chatMode === "ai" ? "Siap Membantu 24/7" : status === "connected" ? "Tersambung" : "Menghubungkan..."}
                  </p>
                </div>
              </div>
              <button onClick={() => setBukaChat(false)} className="text-black hover:bg-yellow-400 p-1.5 rounded-sm transition-colors cursor-pointer">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex flex-col flex-1 bg-slate-50 overflow-hidden">

              {(chatMode === "ai" || chatMode === "form") && (
                <>
                  <div className="flex-1 p-3 overflow-y-auto space-y-3">
                    {daftarPesan.length === 0 && chatMode === "ai" && (
                      <div className="bg-white border border-gray-200 rounded-sm p-3 text-xs text-gray-700 shadow-sm mb-2">
                        <p className="font-bold mb-2 flex items-center gap-2"><Bot size={14} /> Halo! Saya asisten virtual NSS Express.</p>
                        <p className="mb-3">Silakan pilih pertanyaan di bawah atau ketik pertanyaan Anda:</p>
                        <div className="flex flex-wrap gap-2">
                          {QUICK_QUESTIONS.map((q, i) => (
                            <button key={i} onClick={() => { setPesanInput(q); }} className="text-[11px] bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-1 rounded-sm hover:bg-yellow-100 transition-colors text-left">
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {daftarPesan.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.pengirim === "user" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-sm text-xs sm:text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${msg.pengirim === "user" ? "bg-[#FFCC00] text-gray-950 font-medium rounded-br-none" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                          }`}>
                          {msg.teks}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 px-1">{msg.waktu}</span>
                      </div>
                    ))}

                    {isAiThinking && (
                      <div className="flex items-start">
                        <div className="bg-white border border-gray-200 rounded-sm rounded-bl-none px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" /> Sedang mencari jawaban...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {chatMode === "form" && (
                    <div className="p-4 bg-yellow-50 border-t border-yellow-200 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-[#FFCC00] shrink-0">
                          <Users size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-extrabold text-gray-900 text-sm mb-1">Butuh Bantuan Lebih Lanjut?</h3>
                          <p className="text-xs text-gray-600 mb-3">
                            Silakan terhubung langsung dengan tim Customer Service kami untuk penanganan yang lebih spesifik.
                          </p>
                          <form onSubmit={handleMulaiLiveChat} className="space-y-2">
                            <input
                              type="text"
                              required
                              value={nama}
                              onChange={(e) => setNama(e.target.value)}
                              placeholder="Nama Lengkap Anda"
                              className="w-full px-3 py-2 rounded-sm border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] bg-white placeholder:text-gray-400"
                            />
                            <input
                              type="tel"
                              required
                              value={nomorHp}
                              onChange={(e) => setNomorHp(e.target.value)}
                              placeholder="Nomor WhatsApp"
                              className="w-full px-3 py-2 rounded-sm border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] bg-white placeholder:text-gray-400"
                            />
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold py-2.5 px-4 rounded-sm text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Phone size={16} /> Hubungi Customer Service</>}
                            </button>
                          </form>
                          <button onClick={() => setChatMode("ai")} className="w-full text-xs text-gray-500 hover:text-gray-800 underline mt-1">
                            Kembali ke Asisten Virtual
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {chatMode === "ai" && (
                    <div className="p-2.5 bg-white border-t border-gray-200 shrink-0 space-y-2">
                      {showHumanButton && (
                        <button
                          onClick={() => setChatMode("form")}
                          className="w-full bg-gradient-to-r from-[#FFCC00] to-yellow-400 hover:from-yellow-400 hover:to-[#FFCC00] text-gray-950 font-extrabold py-2.5 px-4 rounded-sm text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                        >
                          <Users size={14} /> Hubungi Customer Service Manusia
                        </button>
                      )}
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={inputRef}
                          type="text"
                          value={pesanInput}
                          onChange={(e) => setPesanInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAiMessage()}
                          placeholder="Ketik pertanyaan Anda..."
                          disabled={isAiThinking}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100"
                        />
                        <button
                          onClick={handleAiMessage}
                          disabled={!pesanInput.trim() || isAiThinking}
                          className="bg-[#FFCC00] hover:bg-yellow-400 disabled:bg-gray-300 text-gray-950 p-2 rounded-sm transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-sm disabled:cursor-not-allowed"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {chatMode === "live" && (
                <>
                  <div className="px-3 py-1.5 bg-yellow-100 border-b border-yellow-200 flex items-center justify-between text-[11px] text-gray-800 shrink-0">
                    <button onClick={resetChat} className="flex items-center gap-1 hover:text-yellow-800 transition-colors cursor-pointer font-semibold">
                      <ArrowLeft size={12} /> Mulai Ulang
                    </button>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                    {daftarPesan.map((msg) => (
                      <div key={msg.clientMessageId || msg.id} className={`flex flex-col ${msg.pengirim === "user" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-sm text-xs sm:text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${msg.pengirim === "user" ? "bg-[#FFCC00] text-gray-950 font-medium rounded-br-none" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                          }`}>
                          {msg.teks}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 px-1">{msg.waktu}</span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="shrink-0">
                    {isClosed ? (
                      <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500 font-medium flex flex-col items-center justify-center gap-2">
                        <Lock size={14} />
                        <span>Percakapan ini telah selesai.</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white border-t border-gray-200 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <input
                            ref={inputRef}
                            type="text"
                            value={pesanInput}
                            onChange={(e) => setPesanInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleKirimPesanLive()}
                            placeholder={status === "connected" ? "Ketik pesan Anda..." : "Menunggu koneksi..."}
                            disabled={status !== "connected" || isClosed}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <button
                            onClick={handleKirimPesanLive}
                            disabled={!pesanInput.trim() || status !== "connected" || isClosed}
                            className="bg-[#FFCC00] hover:bg-yellow-400 disabled:bg-gray-300 text-gray-950 p-2 rounded-sm transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-sm disabled:cursor-not-allowed"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
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
            {bukaChat ? <X size={16} /> : <MessageSquare size={16} />}
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>
        <div className="text-left pr-1">
          <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm leading-tight">Customer Service</h4>
          <p className="text-[10px] sm:text-[11px] text-gray-600 leading-tight">Siap Membantu</p>
        </div>
      </motion.button>
    </aside>
  );
};

export default ChatWidget;