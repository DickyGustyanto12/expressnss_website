"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Send,
  CheckCircle2,
  Phone,
  Calendar,
  History,
  ListOrdered,
  Play,
  Lock,
} from "lucide-react";
import { useLiveChatSocket } from "@/app/hooks/use-live-chat-socket";
import Swal from "sweetalert2";

interface Pesan {
  id: number;
  pengirim: string;
  email: string;
  noHp: string;
  avatar: string;
  tanggal: string;
  waktu: string;
  statusChat: "antrian" | "selesai";
  status: "open" | "assigned" | "closed";
  assigned_admin_id: number | null;
  unread_count: number;
  sudahDimulai: boolean;
  riwayatChat: {
    id: number;
    penulis: "pelanggan" | "admin";
    teks: string;
    waktu: string;
    client_message_id?: string;
  }[];
}

interface PesanMasukProps {
  adminId: number;
  adminName: string;
}

const PesanMasuk = ({ adminId, adminName }: PesanMasukProps) => {
  const [daftarPesan, setDaftarPesan] = useState<Pesan[]>([]);
  const [tabAktif, setTabAktif] = useState<"antrian" | "riwayat">("antrian");
  const [kontakAktifId, setKontakAktifId] = useState<number | null>(null);
  const [inputPesan, setInputPesan] = useState<string>("");
  const [pencarian, setPencarian] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const kontakAktifIdRef = useRef<number | null>(kontakAktifId);
  const hasLoadedRef = useRef(false);
  const listenersAttachedRef = useRef(false);

  useEffect(() => {
    kontakAktifIdRef.current = kontakAktifId;
  }, [kontakAktifId]);

  const { socket, status } = useLiveChatSocket(null, null, true, adminId);

  useEffect(() => {
    if (kontakAktifId) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [daftarPesan, kontakAktifId]);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/live-chat/conversations");
      const data = await res.json();
      if (res.ok) {
        const formattedData: Pesan[] = data.map((item: any) => ({
          id: item.id,
          pengirim: item.customer_name || "Unknown",
          email: item.customer_email || "",
          noHp: item.customer_whatsapp || "",
          avatar: (item.customer_name || "UN").substring(0, 2).toUpperCase(),
          tanggal: new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          waktu: new Date(item.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          statusChat: item.status === "closed" ? "selesai" : "antrian",
          status: item.status,
          assigned_admin_id: item.assigned_admin_id,
          sudahDimulai: item.assigned_admin_id !== null && Number(item.assigned_admin_id) === Number(adminId),
          unread_count: item.unread_count || 0,
          riwayatChat: [],
        }));

        setDaftarPesan((prev) => {
          return formattedData.map((newItem) => {
            const existing = prev.find((p) => p.id === newItem.id);
            if (existing) {
              return {
                ...newItem,
                riwayatChat: existing.riwayatChat,
                unread_count: existing.unread_count,
              };
            }
            return newItem;
          });
        });
      }
    } catch (error) {
      console.error("Gagal memuat percakapan:", error);
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    if (socket && status === "connected" && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadConversations();
    }
  }, [socket, status, loadConversations]);

  useEffect(() => {
    if (!socket || status !== "connected") return;
    if (listenersAttachedRef.current) return;

    listenersAttachedRef.current = true;

    const handleMessageNew = (data: any) => {
      setDaftarPesan((prev) => {
        const targetIndex = prev.findIndex((p) => p.id === data.conversationId);

        if (targetIndex === -1) {
          return [
            {
              id: data.conversationId,
              pengirim: "Unknown",
              email: "",
              noHp: "",
              avatar: "UN",
              tanggal: new Date().toLocaleDateString("id-ID"),
              waktu: new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              statusChat: "antrian",
              status: "open",
              assigned_admin_id: null,
              sudahDimulai: false,
              unread_count: 1,
              riwayatChat: [
                {
                  id: data.id,
                  penulis: "pelanggan" as const,
                  teks: data.message,
                  waktu: new Date(data.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  client_message_id: data.clientMessageId,
                },
              ],
            },
            ...prev,
          ];
        }

        const isDuplicate = prev[targetIndex].riwayatChat.some(
          (msg) =>
            msg.id === data.id ||
            msg.client_message_id === data.clientMessageId,
        );
        if (isDuplicate) return prev;

        const penulisValue: "pelanggan" | "admin" =
          data.senderType === "customer" ? "pelanggan" : "admin";

        const newMsg = {
          id: data.id,
          penulis: penulisValue,
          teks: data.message,
          waktu: new Date(data.createdAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          client_message_id: data.clientMessageId,
        };

        const newPrev = [...prev];
        const isActive = newPrev[targetIndex].id === kontakAktifIdRef.current;

        newPrev[targetIndex] = {
          ...newPrev[targetIndex],
          unread_count: isActive
            ? 0
            : (newPrev[targetIndex].unread_count || 0) + 1,
          riwayatChat: [...newPrev[targetIndex].riwayatChat, newMsg],
        };

        if (data.senderType === "customer" && !isActive) {
          const [updatedChat] = newPrev.splice(targetIndex, 1);
          newPrev.unshift(updatedChat);
        }

        return newPrev;
      });
    };

    const handleConversationUpdated = (data: any) => {
      setDaftarPesan((prev) =>
        prev.map((p) => {
          if (p.id === data.conversationId) {
            const isClosed = data.status === "closed";
            return {
              ...p,
              status: data.status ?? p.status,
              statusChat: isClosed ? "selesai" : p.statusChat,
              assigned_admin_id: data.assignedAdminId ?? p.assigned_admin_id,
              sudahDimulai:
                data.assignedAdminId !== undefined
                  ? data.assignedAdminId === adminId
                  : p.sudahDimulai,
            };
          }
          return p;
        }),
      );
    };

    socket.on("message:new", handleMessageNew);
    socket.on("conversation:updated", handleConversationUpdated);

    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("conversation:updated", handleConversationUpdated);
      listenersAttachedRef.current = false;
    };
  }, [socket, status, adminId]);

  const loadMessageHistory = async (convId: number) => {
    setKontakAktifId(convId);

    try {
      const res = await fetch(
        `/api/live-chat/messages?conversationId=${convId}`,
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        const formattedMessages = data.map((msg: any) => ({
          id: msg.id,
          penulis:
            msg.sender_type === "customer"
              ? ("pelanggan" as const)
              : ("admin" as const),
          teks: msg.message,
          waktu: new Date(msg.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          client_message_id: msg.client_message_id,
        }));

        setDaftarPesan((prev) =>
          prev.map((p) =>
            p.id === convId
              ? { ...p, riwayatChat: formattedMessages, unread_count: 0 }
              : p,
          ),
        );
      }
    } catch (error) {
      console.error("Error memuat riwayat:", error);
    }
  };

  const handleMulaiChat = (id: number) => {
    if (!socket) {
      Swal.fire({
        icon: "error",
        title: "Koneksi Error",
        text: "Socket belum terhubung.",
      });
      return;
    }

    socket.emit(
      "conversation:claim",
      { conversationId: id, adminId },
      (response: any) => {
        if (response.success) {
          setDaftarPesan((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                  ...p,
                  sudahDimulai: true,
                  status: "assigned",
                  assigned_admin_id: adminId,
                }
                : p,
            ),
          );
          setKontakAktifId(id);
          loadMessageHistory(id);
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal",
            text: response.error || "Chat sudah diambil admin lain.",
          });
        }
      },
    );
  };

  const handleKirimPesan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPesan.trim() || !kontakAktifId || !socket) return;

    const activeChat = daftarPesan.find((p) => p.id === kontakAktifId);
    if (!activeChat?.sudahDimulai) return;

    const clientMessageId = `admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const waktuSekarang = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const optimisticMsg = {
      id: Date.now(),
      penulis: "admin" as const,
      teks: inputPesan,
      waktu: waktuSekarang,
      client_message_id: clientMessageId,
    };

    setDaftarPesan((prev) =>
      prev.map((p) =>
        p.id === kontakAktifId
          ? { ...p, riwayatChat: [...p.riwayatChat, optimisticMsg] }
          : p,
      ),
    );
    setInputPesan("");

    socket.emit(
      "message:send",
      {
        conversationId: kontakAktifId,
        clientMessageId,
        message: inputPesan,
        senderType: "admin",
      },
      (response: any) => {
        if (!response.success) {
          Swal.fire({
            icon: "error",
            title: "Gagal Mengirim",
            text: response.error,
          });
        }
      },
    );
  };

  const handleTandaiSelesai = (id: number) => {
    if (!socket) return;
    Swal.fire({
      title: "Tutup Percakapan?",
      text: "Customer tidak akan bisa membalas setelah ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Tutup",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        socket.emit(
          "conversation:close",
          { conversationId: id },
          (response: any) => {
            if (response.success) {
              setKontakAktifId(null);
              Swal.fire("Berhasil", "Percakapan telah ditutup.", "success");
            }
          },
        );
      }
    });
  };

  const pesanTersaringTab = daftarPesan.filter((item) => {
    if (tabAktif === "riwayat") {
      return item.status === "closed";
    }
    return item.statusChat === "antrian";
  });

  const kontakTersaring = pesanTersaringTab.filter(
    (item) =>
      item.pengirim?.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.noHp?.includes(pencarian) ||
      item.email?.toLowerCase().includes(pencarian.toLowerCase()),
  );

  const kontakAktifList = kontakTersaring.filter((item) => item.sudahDimulai);
  const kontakAntrianList = kontakTersaring.filter(
    (item) => !item.sudahDimulai,
  );
  const kontakAktif =
    daftarPesan.find((item) => item.id === kontakAktifId) || null;

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="bg-white px-5 py-3 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00] shrink-0">
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">
          Manajemen Pesan Masuk
        </h2>
        <p className="text-sm text-gray-500">
          Kelola antrian pesan dan riwayat percakapan pelanggan NSS Express.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex">
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-gray-200 flex flex-col bg-white h-full overflow-hidden">
          <div className="grid grid-cols-2 bg-gray-100 p-1.5 border-b border-gray-200 gap-1 shrink-0">
            <button
              onClick={() => setTabAktif("antrian")}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-md transition-all cursor-pointer ${tabAktif === "antrian"
                ? "bg-white text-gray-950 shadow-xs border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <ListOrdered size={16} />
              <span>
                Antrian (
                {daftarPesan.filter((i) => i.statusChat === "antrian").length})
              </span>
            </button>
            <button
              onClick={() => setTabAktif("riwayat")}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-md transition-all cursor-pointer ${tabAktif === "riwayat"
                ? "bg-white text-gray-950 shadow-xs border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <History size={16} />
              <span>
                Riwayat (
                {daftarPesan.filter((i) => i.statusChat === "selesai").length})
              </span>
            </button>
          </div>

          <div className="p-2.5 bg-white border-b border-gray-100 shrink-0">
            <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 border border-gray-200 focus-within:border-yellow-400 focus-within:bg-white transition-all">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Cari nama atau no HP..."
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none text-gray-800"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
            {isLoading ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                Memuat data...
              </div>
            ) : kontakTersaring.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                Tidak ada data pada tab {tabAktif}.
              </div>
            ) : (
              <>
                {tabAktif === "antrian" && kontakAktifList.length > 0 && (
                  <div>
                    <div className="bg-gray-100 px-3 py-1.5 text-[11px] font-extrabold text-gray-700 uppercase tracking-wider border-y border-gray-200">
                      Sedang Ditangani ({kontakAktifList.length})
                    </div>
                    {kontakAktifList.map((kontak, index) => {
                      const pesanTerakhir =
                        kontak.riwayatChat[kontak.riwayatChat.length - 1];
                      const isAktif = kontak.id === kontakAktifId;
                      return (
                        <div
                          key={kontak.id}
                          onClick={() => loadMessageHistory(kontak.id)}
                          className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${isAktif
                            ? "bg-yellow-50/80 border-l-4 border-l-[#FFCC00]"
                            : "hover:bg-gray-50"
                            }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFCC00] font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {kontak.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4 className="font-bold text-gray-900 text-sm truncate">
                                {kontak.pengirim}
                              </h4>
                              <span className="text-xs text-gray-500 shrink-0">
                                {kontak.waktu}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate mb-1">
                              {pesanTerakhir &&
                                pesanTerakhir.penulis === "admin"
                                ? "Anda: "
                                : ""}
                              {pesanTerakhir
                                ? pesanTerakhir.teks
                                : "Belum ada pesan"}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                                Urutan #{index + 1}
                              </span>
                              <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                Aktif
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {tabAktif === "antrian" && kontakAntrianList.length > 0 && (
                  <div>
                    <div className="bg-gray-100 px-3 py-1.5 text-[11px] font-extrabold text-gray-700 uppercase tracking-wider border-y border-gray-200">
                      Antrian ({kontakAntrianList.length})
                    </div>
                    {kontakAntrianList.map((kontak, index) => {
                      const pesanTerakhir =
                        kontak.riwayatChat[kontak.riwayatChat.length - 1];
                      const isAktif = kontak.id === kontakAktifId;
                      return (
                        <div
                          key={kontak.id}
                          onClick={() => loadMessageHistory(kontak.id)}
                          className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${isAktif
                            ? "bg-yellow-50/80 border-l-4 border-l-[#FFCC00]"
                            : "hover:bg-gray-50"
                            }`}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFCC00] font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {kontak.avatar}
                            </div>
                            {kontak.unread_count > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {kontak.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4 className="font-bold text-gray-900 text-sm truncate">
                                {kontak.pengirim}
                              </h4>
                              <span className="text-xs text-gray-500 shrink-0">
                                {kontak.waktu}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate mb-1">
                              {pesanTerakhir
                                ? pesanTerakhir.teks
                                : "Belum ada pesan"}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                                Antrian #{index + 1}
                              </span>
                              <span className="bg-[#FFCC00] text-gray-950 font-black text-xs px-2 py-0.5 rounded-full">
                                Baru
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {tabAktif === "riwayat" &&
                  kontakTersaring.map((kontak) => {
                    const pesanTerakhir =
                      kontak.riwayatChat[kontak.riwayatChat.length - 1];
                    const isAktif = kontak.id === kontakAktifId;
                    return (
                      <div
                        key={kontak.id}
                        onClick={() => loadMessageHistory(kontak.id)}
                        className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${isAktif
                          ? "bg-yellow-50/80 border-l-4 border-l-[#FFCC00]"
                          : "hover:bg-gray-50"
                          }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFCC00] font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {kontak.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-bold text-gray-900 text-sm truncate">
                              {kontak.pengirim}
                            </h4>
                            <span className="text-xs text-gray-500 shrink-0">
                              {kontak.waktu}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate mb-1">
                            {pesanTerakhir
                              ? pesanTerakhir.teks
                              : "Belum ada pesan"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="bg-green-100 text-green-800 font-bold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={12} /> Selesai
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 flex-col bg-[#f8f9fa] h-full overflow-hidden">
          {kontakAktif ? (
            <>
              <div className="px-5 py-3 bg-white border-b border-gray-200 flex items-center justify-between shadow-xs z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFCC00] font-bold flex items-center justify-center text-sm">
                    {kontakAktif.avatar}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">
                      {kontakAktif.pengirim}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone size={13} /> {kontakAktif.noHp}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> {kontakAktif.tanggal} (
                        {kontakAktif.waktu})
                      </span>
                    </div>
                  </div>
                </div>

                {tabAktif === "antrian" && kontakAktif.sudahDimulai && (
                  <button
                    onClick={() => handleTandaiSelesai(kontakAktif.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-md text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Tandai Selesai</span>
                  </button>
                )}

                {tabAktif === "riwayat" && (
                  <span className="bg-gray-100 text-gray-700 font-bold px-3.5 py-1.5 rounded-md text-xs flex items-center gap-1 border border-gray-200">
                    <CheckCircle2 size={14} className="text-green-600" />{" "}
                    Selesai Ditangani
                  </span>
                )}
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50 to-gray-100/50 min-h-0">
                {kontakAktif.riwayatChat.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">
                    Belum ada pesan dalam percakapan ini.
                  </div>
                ) : (
                  kontakAktif.riwayatChat.map((chat) => {
                    const dariAdmin = chat.penulis === "admin";
                    return (
                      <div
                        key={chat.client_message_id || chat.id}
                        className={`flex flex-col ${dariAdmin ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] md:max-w-[65%] rounded-lg px-4 py-3 shadow-xs text-sm relative break-words whitespace-pre-wrap ${dariAdmin
                            ? "bg-[#FFCC00] text-gray-950 rounded-tr-none font-medium"
                            : "bg-white text-gray-900 rounded-tl-none border border-gray-200 font-medium"
                            }`}
                        >
                          <p className="leading-relaxed">{chat.teks}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-xs ${dariAdmin ? "text-gray-800 font-semibold" : "text-gray-400"}`}
                          >
                            <span>{chat.waktu}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="shrink-0">
                {tabAktif === "antrian" ? (
                  <div>
                    {!kontakAktif.sudahDimulai ? (
                      <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">
                          Tekan tombol Mulai untuk menangani chat ini.
                        </p>
                        <button
                          onClick={() => handleMulaiChat(kontakAktif.id)}
                          className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-5 py-2.5 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-105"
                        >
                          <Play size={16} fill="currentColor" />
                          <span>Mulai Chat</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-white border-t border-gray-200">
                        <form
                          onSubmit={handleKirimPesan}
                          className="flex items-center gap-3"
                        >
                          <input
                            type="text"
                            placeholder="Ketik balasan pesan..."
                            value={inputPesan}
                            onChange={(e) => setInputPesan(e.target.value)}
                            className="flex-1 bg-gray-100 border border-gray-300 focus:border-yellow-400 focus:bg-white rounded-md px-4 py-3 text-sm focus:outline-none transition-all"
                          />
                          <button
                            type="submit"
                            className="bg-gray-950 hover:bg-gray-900 text-[#FFCC00] font-bold px-5 py-3 rounded-md flex items-center gap-2 transition-colors shadow-sm cursor-pointer text-xs"
                          >
                            <Send size={16} />
                            <span className="hidden lg:inline">Kirim</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500 font-medium flex items-center justify-center gap-2">
                    <Lock size={14} /> Percakapan ini telah selesai. Kotak
                    balasan ditutup.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Pilih salah satu kontak untuk melihat detail pesan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PesanMasuk;
