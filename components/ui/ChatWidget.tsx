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
  Lock,
  Bot,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useLiveChatSocket } from "../../app/hooks/use-live-chat-socket";
import {
  dengarKlikNotifikasi,
  halamanTidakDilihat,
  mintaIzinNotifikasi,
  putarSuaraNotifikasi,
  siapkanNotifikasi,
  tampilkanNotifikasiBrowser,
  tandaiJudulPesanBaru,
} from "../../app/hooks/chat-notification";

interface PesanChat {
  id: number;
  pengirim: "admin" | "user" | "ai" | "sistem";
  teks: string;
  waktu: string;
  clientMessageId?: string;
}

const POLA_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;

function TeksDenganLink({ teks }: { teks: string }) {
  const bagian: React.ReactNode[] = [];
  let posisi = 0;

  for (const m of teks.matchAll(POLA_LINK)) {
    const awal = m.index ?? 0;
    if (awal > posisi) bagian.push(teks.slice(posisi, awal));

    let url = m[2] ?? m[3];
    let label = m[1] ?? url;
    let ekor = "";
    if (!m[2]) {
      const tanda = url.match(/[.,!?;:)]+$/);
      if (tanda) {
        ekor = tanda[0];
        url = url.slice(0, -ekor.length);
        label = url;
      }
    }

    let tabIni = false;
    try {
      const u = new URL(url);
      tabIni =
        typeof window !== "undefined" &&
        u.origin === window.location.origin &&
        u.pathname === window.location.pathname &&
        !!u.hash;
    } catch {
    }

    bagian.push(
      <a
        key={`${awal}-${url}`}
        href={url}
        target={tabIni ? "_self" : "_blank"}
        rel="noopener noreferrer"
        className="underline font-semibold text-blue-700 hover:text-blue-900 break-all"
      >
        {label}
      </a>,
    );
    if (ekor) bagian.push(ekor);
    posisi = awal + m[0].length;
  }

  if (posisi < teks.length) bagian.push(teks.slice(posisi));
  return <>{bagian}</>;
}

function GelembungPesan({ msg }: { msg: PesanChat }) {
  if (msg.pengirim === "sistem") {
    return (
      <div className="flex justify-center">
        <div className="max-w-[90%] text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-center">
          {msg.teks}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${
        msg.pengirim === "user" ? "items-end" : "items-start"
      }`}
    >
      {msg.pengirim === "admin" && (
        <span className="text-[10px] font-bold text-gray-500 mb-0.5 px-1">
          Customer Service
        </span>
      )}
      <div
        className={`max-w-[85%] px-3 py-2 rounded-sm text-xs sm:text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
          msg.pengirim === "user"
            ? "bg-[#FFCC00] text-gray-950 font-medium rounded-br-none"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
        }`}
      >
        <TeksDenganLink teks={msg.teks} />
      </div>
      <span className="text-[10px] text-gray-400 mt-0.5 px-1">{msg.waktu}</span>
    </div>
  );
}

interface ChatWidgetProps {
  bukaChat?: boolean;
  setBukaChat?: React.Dispatch<React.SetStateAction<boolean>>;
}

type ChatMode = "form" | "ai" | "live";

const ChatWidget = ({
  bukaChat: externalBukaChat,
  setBukaChat: externalSetBukaChat,
}: ChatWidgetProps = {}) => {
  const [internalBukaChat, setInternalBukaChat] = useState(false);
  const bukaChat =
    externalBukaChat !== undefined ? externalBukaChat : internalBukaChat;
  const setBukaChat = externalSetBukaChat || setInternalBukaChat;

  const [chatMode, setChatMode] = useState<ChatMode>("form");
  const [nama, setNama] = useState("");
  const [nomorHp, setNomorHp] = useState("");
  const [errorNomor, setErrorNomor] = useState<string | null>(null);
  const [pesanInput, setPesanInput] = useState("");
  const [daftarPesan, setDaftarPesan] = useState<PesanChat[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isConnectingLive, setIsConnectingLive] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [percobaanKoneksi, setPercobaanKoneksi] = useState(0);

  const pesanPemicuRef = useRef<{ teks: string; alasan?: string } | null>(null);

  const [aiSettings, setAiSettings] = useState({
    ai_name: "Customer Service NSS Express",
    custom_greeting:
      "Halo Kak! Ada yang bisa saya bantu terkait layanan pengiriman NSS Express?",
    quick_questions: [] as string[],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { socket, status } = useLiveChatSocket(
    chatMode === "live" ? token : null,
    chatMode === "live" ? conversationId : null,
    false,
  );

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const bukaChatRef = useRef(bukaChat);
  useEffect(() => {
    bukaChatRef.current = bukaChat;
  }, [bukaChat]);

  useEffect(() => {
    if (chatMode !== "live") return;
    siapkanNotifikasi();
    return dengarKlikNotifikasi(() => setBukaChat(true));
  }, [chatMode, setBukaChat]);

  useEffect(() => {
    const fetchAiSettings = async () => {
      try {
        const res = await fetch("/api/ai-settings");
        if (res.ok) {
          const data = await res.json();
          let parsedQuestions: string[] = [];
          try {
            parsedQuestions = JSON.parse(data.quick_questions || "[]");
          } catch {
            parsedQuestions = [];
          }
          setAiSettings({
            ai_name: data.ai_name || "Customer Service NSS Express",
            custom_greeting:
              data.custom_greeting || "Halo Kak! Ada yang bisa saya bantu?",
            quick_questions: parsedQuestions,
          });
        }
      } catch {
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchAiSettings();
  }, []);

  useEffect(() => {
    if (
      bukaChat &&
      chatMode === "ai" &&
      daftarPesan.length === 0 &&
      !isLoadingSettings
    ) {
      setDaftarPesan([
        {
          id: 1,
          pengirim: "ai",
          teks: `Halo Kak ${nama}! 👋 Ada yang bisa saya bantu terkait layanan pengiriman NSS Express?`,
          waktu: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  }, [bukaChat, chatMode, isLoadingSettings, nama]);

  useEffect(() => {
    if (chatMode !== "live" || !token || !conversationId) return;

    setIsConnectingLive(true);
    setConnectionError(null);

    connectionTimeoutRef.current = setTimeout(() => {
      if (statusRef.current !== "connected") {
        setConnectionError("Gagal terhubung ke server. Silakan coba lagi.");
        setIsConnectingLive(false);
      }
    }, 10000);

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [chatMode, token, conversationId, percobaanKoneksi]);

  useEffect(() => {
    if (chatMode === "live" && status === "connected") {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      setConnectionError(null);

      if (isConnectingLive) {
        setIsConnectingLive(false);
        setDaftarPesan((prev) => [
          ...prev,
          {
            id: Date.now(),
            pengirim: "sistem",
            teks: "✅ Terhubung dengan Customer Service NSS Express",
            waktu: "",
          },
        ]);

        const pemicu = pesanPemicuRef.current;
        if (pemicu && socket && conversationId) {
          pesanPemicuRef.current = null;
          socket.emit(
            "message:send",
            {
              conversationId: parseInt(conversationId),
              clientMessageId: `web-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              message: `[Dialihkan otomatis dari asisten AI${
                pemicu.alasan ? ` – ${pemicu.alasan}` : ""
              }]\n${pemicu.teks}`,
              senderType: "customer",
            },
            () => {},
          );
        }
      }
    }
  }, [status, chatMode, isConnectingLive, socket, conversationId]);

  useEffect(() => {
    if (!socket || chatMode !== "live") return;

    const handleMessageNew = (data: any) => {
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
        setDaftarPesan((prev) => {
          const exists = prev.find(
            (p) =>
              p.id === data.id || p.clientMessageId === data.clientMessageId,
          );
          if (exists) return prev;
          return [...prev, pesanBaruAdmin];
        });

        putarSuaraNotifikasi();
        const widgetTidakTerlihat = !bukaChatRef.current;
        if (halamanTidakDilihat() || widgetTidakTerlihat) {
          tandaiJudulPesanBaru();
          tampilkanNotifikasiBrowser({
            judul: "Balasan dari Customer Service NSS Express",
            isi: data.message,
            tag: `chat-customer-${conversationId}`,
            data: {
              path: window.location.pathname,
              url: window.location.pathname,
            },
            onClick: () => setBukaChat(true),
          });
        }
      }
    };

    const handleConversationUpdated = (data: any) => {
      if (
        data.conversationId === parseInt(conversationId || "0") &&
        data.status === "closed"
      ) {
        setIsClosed(true);
      }
    };

    socket.on("message:new", handleMessageNew);
    socket.on("conversation:updated", handleConversationUpdated);

    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("conversation:updated", handleConversationUpdated);
    };
  }, [socket, chatMode, conversationId, setBukaChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [daftarPesan, isAiThinking, isConnectingLive]);

  const dapatkanWaktuSekarang = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleNomorHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hanyaAngka = e.target.value.replace(/\D/g, "");
    setNomorHp(hanyaAngka.slice(0, 13));
    if (errorNomor) setErrorNomor(null);
  };

  const validasiNomorHp = (nomor: string): string | null => {
    if (!nomor) return "Nomor WhatsApp wajib diisi.";
    if (!nomor.startsWith("08"))
      return "Nomor harus diawali 08. Contoh: 08123456789.";
    if (nomor.length < 10 || nomor.length > 13)
      return `Nomor harus 10-13 digit. Sekarang: ${nomor.length} digit.`;
    return null;
  };

  const handleMulaiChat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) {
      alert("Harap lengkapi nama Anda.");
      return;
    }

    const errNomor = validasiNomorHp(nomorHp);
    if (errNomor) {
      setErrorNomor(errNomor);
      return;
    }

    setIsSubmitting(true);
    mintaIzinNotifikasi();

    try {
      const response = await fetch("/api/live-chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: nama,
          customer_whatsapp: nomorHp,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Gagal memulai sesi chat");

      setToken(data.token);
      setConversationId(data.conversationId.toString());

      localStorage.setItem("live_chat_nama", nama);
      localStorage.setItem("live_chat_nomor_hp", nomorHp);
      localStorage.setItem("live_chat_token", data.token);
      localStorage.setItem(
        "live_chat_conversation_id",
        data.conversationId.toString(),
      );

      setChatMode("ai");
    } catch (error: any) {
      alert(error.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hubungkanCsOtomatis = (pesanPemicu: string, alasan?: string) => {
    if (!conversationId || !token) return;
    pesanPemicuRef.current = { teks: pesanPemicu, alasan };
    setConnectionError(null);
    setIsClosed(false);
    setPesanInput("");
    setChatMode("live");
  };

  const cobaLagiKoneksi = () => {
    setConnectionError(null);
    socket?.connect();
    setPercobaanKoneksi((n) => n + 1);
  };

  const handleAiMessage = async () => {
    if (!pesanInput.trim() || isAiThinking) return;

    const userText = pesanInput;
    setPesanInput("");

    const userMsg: PesanChat = {
      id: Date.now(),
      pengirim: "user",
      teks: userText,
      waktu: dapatkanWaktuSekarang(),
    };
    setDaftarPesan((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    if (conversationId) {
      try {
        await fetch("/api/live-chat/save-ai-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: userText,
            senderType: "customer",
          }),
        });
      } catch {
      }
    }

    try {
      const chatHistoryForApi = daftarPesan
        .filter((p) => p.pengirim !== "sistem")
        .map((p) => ({
          pengirim: p.pengirim === "user" ? "user" : "model",
          teks: p.teks,
        }));

      const res = await fetch("/api/gemini-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          chatHistory: chatHistoryForApi,
          nama,
          nomorHp,
          conversationId,
          token,
        }),
      });

      const data = await res.json();

      if ((res.ok || data.sesiTidakValid) && data.reply) {
        const aiMsg: PesanChat = {
          id: Date.now() + 1,
          pengirim: "ai",
          teks: data.reply,
          waktu: dapatkanWaktuSekarang(),
        };
        setDaftarPesan((prev) => [...prev, aiMsg]);

        if (conversationId) {
          try {
            await fetch("/api/live-chat/save-ai-message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId,
                message: data.reply,
                senderType: "ai",
              }),
            });
          } catch {
          }
        }

        if (data.eskalasi) {
          hubungkanCsOtomatis(userText, data.alasan);
        }
      } else {
        throw new Error("Gagal mendapatkan jawaban AI");
      }
    } catch {
      setDaftarPesan((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          pengirim: "ai",
          teks: "Maaf, terjadi kesalahan pada sistem. Silakan hubungi Customer Service kami.",
          waktu: dapatkanWaktuSekarang(),
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleKirimPesanLive = () => {
    if (
      isClosed ||
      !pesanInput.trim() ||
      !socket ||
      !conversationId ||
      status !== "connected"
    )
      return;

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
      {
        conversationId: parseInt(conversationId),
        clientMessageId,
        message: teksKirim,
        senderType: "customer",
      },
      (response: any) => {
        if (!response?.success)
          alert(response?.error || "Gagal mengirim pesan.");
      },
    );
  };

  const resetChat = () => {
    setChatMode("form");
    setNama("");
    setNomorHp("");
    setErrorNomor(null);
    setPesanInput("");
    setDaftarPesan([]);
    setConversationId(null);
    setToken(null);
    setIsClosed(false);
    setIsConnectingLive(false);
    setConnectionError(null);
    localStorage.removeItem("live_chat_token");
    localStorage.removeItem("live_chat_conversation_id");
    localStorage.removeItem("live_chat_nama");
    localStorage.removeItem("live_chat_nomor_hp");
  };

  const handleKembaliKeAI = () => {
    setChatMode("ai");
    setIsClosed(false);
    setIsConnectingLive(false);
    setConnectionError(null);
    setDaftarPesan((prev) => [
      ...prev,
      {
        id: Date.now(),
        pengirim: "sistem",
        teks: `Kembali ke asisten ${aiSettings.ai_name}`,
        waktu: "",
      },
    ]);
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
            className="w-[90vw] sm:w-[380px] max-w-[400px] bg-white rounded-sm shadow-2xl overflow-hidden border-2 border-[#FFCC00] mb-3 flex flex-col h-[550px] max-h-[85vh]"
          >
            <div className="bg-[#FFCC00] text-black px-3.5 py-3 flex items-center justify-between shadow-sm border-b border-yellow-400 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-sm bg-black text-[#FFCC00] flex items-center justify-center shadow-sm">
                    {chatMode === "ai" ? (
                      <Bot size={16} />
                    ) : chatMode === "live" ? (
                      <Phone size={16} />
                    ) : (
                      <Users size={16} />
                    )}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[#FFCC00] rounded-full ${
                      chatMode === "live" && status === "connected"
                        ? "bg-emerald-500"
                        : chatMode === "live" && status !== "connected"
                          ? "bg-orange-500 animate-pulse"
                          : "bg-emerald-500"
                    }`}
                  ></span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight text-black">
                    {chatMode === "ai"
                      ? aiSettings.ai_name
                      : chatMode === "live"
                        ? "Customer Service"
                        : "Selamat Datang"}
                  </h4>
                  <p className="text-[10px] text-black font-bold">
                    {chatMode === "ai"
                      ? "Siap Membantu 24/7"
                      : chatMode === "live"
                        ? isConnectingLive
                          ? "Menghubungkan..."
                          : status === "connected"
                            ? "Terhubung dengan Customer Service"
                            : "Gagal Terhubung"
                        : "Silakan isi data Anda"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBukaChat(false)}
                className="text-black hover:bg-yellow-400 p-1.5 rounded-sm transition-colors cursor-pointer"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex flex-col flex-1 bg-slate-50 overflow-hidden">
              {chatMode === "form" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-[#FFCC00] mb-4">
                      <Users size={32} />
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-lg mb-2">
                      Halo, Selamat Datang! 👋
                    </h3>
                    <p className="text-xs text-gray-600 mb-6 max-w-[280px]">
                      Silakan isi nama dan nomor WhatsApp Anda agar kami dapat
                      membantu Anda dengan lebih baik.
                    </p>

                    <form
                      onSubmit={handleMulaiChat}
                      className="w-full space-y-3"
                    >
                      <div className="relative">
                        <Users
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          required
                          value={nama}
                          onChange={(e) => setNama(e.target.value)}
                          placeholder="Nama Lengkap Anda"
                          className="w-full pl-10 pr-3 py-2.5 rounded-sm border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] bg-white placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <div className="relative">
                          <Phone
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={13}
                            required
                            value={nomorHp}
                            onChange={handleNomorHpChange}
                            placeholder="Contoh: 08123456789"
                            className={`w-full pl-10 pr-14 py-2.5 rounded-sm border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] bg-white placeholder:text-gray-400 transition-colors ${
                              errorNomor
                                ? "border-red-400 ring-1 ring-red-300"
                                : "border-gray-300"
                            }`}
                          />
                          <span
                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${
                              nomorHp.length >= 10 && nomorHp.length <= 13
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            {nomorHp.length}/13
                          </span>
                        </div>
                        {errorNomor && (
                          <p className="text-[11px] text-red-600 text-left flex items-center gap-1 mt-1">
                            <AlertCircle size={12} className="shrink-0" />
                            {errorNomor}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold py-2.5 px-4 rounded-sm text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        {isSubmitting ? "Memproses..." : "Mulai Chat"}
                      </button>
                    </form>

                    <p className="text-[10px] text-gray-400 mt-4 flex items-center gap-1">
                      <Lock size={10} /> Data Anda aman dan tidak akan dibagikan
                    </p>
                  </div>
                </div>
              )}

              {chatMode === "ai" && (
                <>
                  <div className="flex-1 p-3 overflow-y-auto space-y-3">
                    {daftarPesan.length === 0 && !isLoadingSettings && (
                      <div className="bg-white border border-gray-200 rounded-sm p-3 text-xs text-gray-700 shadow-sm mb-2">
                        <p className="font-bold mb-2 flex items-center gap-2">
                          <Bot size={14} /> Halo Kak {nama}! Saya asisten
                          virtual {aiSettings.ai_name}.
                        </p>
                        <p className="mb-3">
                          Silakan pilih pertanyaan di bawah atau ketik
                          pertanyaan Anda:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiSettings.quick_questions.length > 0 ? (
                            aiSettings.quick_questions.map((q, i) => (
                              <button
                                key={i}
                                onClick={() => setPesanInput(q)}
                                className="text-[11px] bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-1 rounded-sm hover:bg-yellow-100 transition-colors text-left"
                              >
                                {q}
                              </button>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">
                              Belum ada pertanyaan cepat tersedia.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {daftarPesan.map((msg) => (
                      <GelembungPesan key={msg.id} msg={msg} />
                    ))}

                    {isAiThinking && (
                      <div className="flex items-start">
                        <div className="bg-white border border-gray-200 rounded-sm rounded-bl-none px-3.5 py-3 shadow-sm flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-2.5 bg-white border-t border-gray-200 shrink-0 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={inputRef}
                        type="text"
                        value={pesanInput}
                        onChange={(e) => setPesanInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAiMessage()
                        }
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
                </>
              )}

              {chatMode === "live" && (
                <>
                  <div className="px-3 py-1.5 bg-yellow-100 border-b border-yellow-200 flex items-center justify-between text-[11px] text-gray-800 shrink-0">
                    <button
                      onClick={handleKembaliKeAI}
                      className="flex items-center gap-1 hover:text-yellow-800 transition-colors cursor-pointer font-semibold"
                    >
                      <ArrowLeft size={12} /> Kembali ke AI
                    </button>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                    {daftarPesan.map((msg) => (
                      <GelembungPesan
                        key={msg.clientMessageId || msg.id}
                        msg={msg}
                      />
                    ))}

                    {isConnectingLive && (
                      <div className="flex justify-center">
                        <div className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-center gap-1.5">
                          <Loader2 size={12} className="animate-spin" />
                          Menghubungkan ke Customer Service...
                        </div>
                      </div>
                    )}

                    {connectionError && !isConnectingLive && (
                      <div className="flex flex-col items-center text-center gap-2 bg-red-50 border border-red-200 rounded-sm p-3">
                        <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                          <AlertCircle size={14} /> {connectionError}
                        </p>
                        <button
                          onClick={cobaLagiKoneksi}
                          className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-bold px-4 py-1.5 rounded-sm text-xs flex items-center gap-2 cursor-pointer"
                        >
                          <RefreshCw size={12} /> Coba Lagi
                        </button>
                      </div>
                    )}
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
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleKirimPesanLive()
                            }
                            placeholder={
                              isConnectingLive
                                ? "Menghubungkan..."
                                : status === "connected"
                                  ? "Ketik pesan Anda..."
                                  : connectionError
                                    ? "Gagal terhubung"
                                    : "Menunggu koneksi..."
                            }
                            disabled={
                              status !== "connected" ||
                              isClosed ||
                              isConnectingLive ||
                              !!connectionError
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <button
                            onClick={handleKirimPesanLive}
                            disabled={
                              !pesanInput.trim() ||
                              status !== "connected" ||
                              isClosed ||
                              isConnectingLive ||
                              !!connectionError
                            }
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
          <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm leading-tight">
            {aiSettings.ai_name}
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
