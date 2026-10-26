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
  Bell,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Power,
  Clock,
} from "lucide-react";
import { useLiveChatSocket } from "@/app/hooks/use-live-chat-socket";
import {
  antrianDibuka,
  formatDurasi,
  sisaDetikPerubahan,
  singkatanZonaWaktu,
  zonaWaktuLokal,
  TEKS_JAM_OPERASIONAL,
} from "@/lib/jam-operasional";
import { useAdminNotification } from "@/app/hooks/use-live-admin-notifications";
import { useGlobalNotification } from "@/app/hooks/use-global-notification";
import { useNotification } from "./NotificationContext";
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

interface TemplateSaran {
  id: number;
  judul: string;
  kata_kunci: string;
  isi_balasan: string;
  aktif: number;
}

interface SaranTerskor extends TemplateSaran {
  skor: number;
}

interface FormSaranState {
  id: number | null;
  judul: string;
  kata_kunci: string;
  isi_balasan: string;
  aktif: boolean;
}

interface PesanMasukProps {
  adminId: number;
  adminName: string;
}

const formSaranKosong: FormSaranState = {
  id: null,
  judul: "",
  kata_kunci: "",
  isi_balasan: "",
  aktif: true,
};

// Cocokkan kata kunci template dengan pesan customer
function cariSaranTemplates(
  templates: TemplateSaran[],
  pesan: string,
  limit = 3,
): SaranTerskor[] {
  const msg = pesan.toLowerCase();

  return templates
    .filter((t) => Number(t.aktif) === 1)
    .map((t) => {
      const keys = t.kata_kunci
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      let skor = 0;
      for (const k of keys) {
        if (msg.includes(k)) skor += 1;
      }
      return { ...t, skor };
    })
    .filter((s) => s.skor >= 1)
    .sort((a, b) => b.skor - a.skor)
    .slice(0, limit);
}

const PesanMasuk = ({ adminId, adminName }: PesanMasukProps) => {
  const [daftarPesan, setDaftarPesan] = useState<Pesan[]>([]);
  const [tabAktif, setTabAktif] = useState<"antrian" | "riwayat">("antrian");
  const [kontakAktifId, setKontakAktifId] = useState<number | null>(null);
  const [inputPesan, setInputPesan] = useState<string>("");
  const [pencarian, setPencarian] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [connectionToast, setConnectionToast] = useState({
    show: false,
    message: "",
    type: "warning" as "warning" | "success" | "error",
  });

  // ====== State saran balasan (panel pencocokan) ======
  const [daftarSaran, setDaftarSaran] = useState<SaranTerskor[]>([]);
  const [panelSaranTerbuka, setPanelSaranTerbuka] = useState(false);

  // ====== State modal CRUD template ======
  const [daftarTemplate, setDaftarTemplate] = useState<TemplateSaran[]>([]);
  const [modalSaranOpen, setModalSaranOpen] = useState(false);
  const [formSaranMode, setFormSaranMode] = useState<
    "list" | "tambah" | "edit"
  >("list");
  const [formSaran, setFormSaran] = useState<FormSaranState>(formSaranKosong);
  const [isSavingSaran, setIsSavingSaran] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const kontakAktifIdRef = useRef<number | null>(kontakAktifId);
  const hasLoadedRef = useRef(false);
  const listenersAttachedRef = useRef(false);
  const pendingClaimIdRef = useRef<number | null>(null);
  const balasanInputRef = useRef<HTMLInputElement>(null);

  const { unreadCount: globalUnreadCount, resetUnreadCount } =
    useAdminNotification(adminId);
  const { showSuccess, showError } = useGlobalNotification();
  const { targetConversationId, clearTargetConversation } = useNotification();
  const targetSudahDimuatUlangRef = useRef(false);

  const { socket, status } = useLiveChatSocket(null, null, true, adminId);

  // ====== Jam terkini (waktu lokal laptop, update tiap detik) ======
  const [sekarang, setSekarang] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setSekarang(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const isAntrianDibuka = antrianDibuka(sekarang);

  useEffect(() => {
    kontakAktifIdRef.current = kontakAktifId;
  }, [kontakAktifId]);

  useEffect(() => {
    if (kontakAktifId) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [daftarPesan, kontakAktifId]);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/live-chat/conversations");
      const data = await res.json();

      if (res.ok) {
        const conversationsWithLastMessage = await Promise.all(
          data.map(async (item: any) => {
            let lastMessage = null;
            try {
              const msgRes = await fetch(
                `/api/live-chat/messages?conversationId=${item.id}&limit=1`,
              );
              if (msgRes.ok) {
                const msgs = await msgRes.json();
                if (Array.isArray(msgs) && msgs.length > 0) {
                  lastMessage = msgs[msgs.length - 1];
                }
              }
            } catch {
              // Diabaikan (tidak ditampilkan di console browser)
            }
            return { ...item, lastMessage };
          }),
        );

        const formattedData: Pesan[] = conversationsWithLastMessage.map(
          (item: any) => ({
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
            sudahDimulai:
              item.assigned_admin_id !== null &&
              Number(item.assigned_admin_id) === Number(adminId),
            unread_count: item.unread_count || 0,
            riwayatChat: item.lastMessage
              ? [
                  {
                    id: item.lastMessage.id,
                    penulis:
                      item.lastMessage.sender_type === "customer"
                        ? ("pelanggan" as const)
                        : ("admin" as const),
                    teks: item.lastMessage.message,
                    waktu: new Date(
                      item.lastMessage.created_at,
                    ).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    client_message_id: item.lastMessage.client_message_id,
                  },
                ]
              : [],
          }),
        );

        setDaftarPesan(formattedData);
      } else {
        setApiError(data.error || "Gagal memuat data percakapan.");
      }
    } catch {
      setApiError("Terjadi kesalahan saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadConversations();
    }
  }, [loadConversations]);

  // ====== Muat template saran dari database ======
  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/suggestion-admin");
      if (res.ok) {
        const data = await res.json();
        setDaftarTemplate(
          (Array.isArray(data) ? data : []).map((r: any) => ({
            id: r.id,
            judul: r.judul || "",
            kata_kunci: r.kata_kunci || "",
            isi_balasan: r.isi_balasan || "",
            aktif: Number(r.aktif),
          })),
        );
      }
    } catch {
      // Diabaikan (tidak ditampilkan di console browser)
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (status === "connected" && pendingClaimIdRef.current !== null) {
      const claimId = pendingClaimIdRef.current;
      pendingClaimIdRef.current = null;

      if (!antrianDibuka()) {
        showError(
          `Antrian hanya bisa diambil pukul ${TEKS_JAM_OPERASIONAL}. Silakan ambil lagi besok mulai pukul 08.00.`,
        );
        return;
      }

      setConnectionToast({
        show: true,
        message: "Terhubung! Memproses permintaan...",
        type: "success",
      });

      setTimeout(() => {
        setConnectionToast((prev) => ({ ...prev, show: false }));
      }, 3000);

      if (socket) {
        socket.emit(
          "conversation:claim",
          { conversationId: claimId, adminId, timeZone: zonaWaktuLokal() },
          (response: any) => {
            if (response.success) {
              setDaftarPesan((prev) =>
                prev.map((p) =>
                  p.id === claimId
                    ? {
                        ...p,
                        sudahDimulai: true,
                        status: "assigned",
                        assigned_admin_id: adminId,
                      }
                    : p,
                ),
              );
              setKontakAktifId(claimId);
              loadMessageHistory(claimId);
              showSuccess("Chat berhasil diambil");
            } else {
              showError(response.error || "Chat sudah diambil admin lain.");
            }
          },
        );
      }
    }
  }, [status, socket, adminId]);

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
              pengirim: data.customerName || "Unknown",
              email: "",
              noHp: data.customerWhatsapp || "",
              avatar: (data.customerName || "UN").substring(0, 2).toUpperCase(),
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

  useEffect(() => {
    if (kontakAktifId) {
      setDaftarPesan((prev) =>
        prev.map((p) =>
          p.id === kontakAktifId ? { ...p, unread_count: 0 } : p,
        ),
      );
    }
  }, [kontakAktifId]);

  // ====== Data turunan ======
  const pesanTersaringTab = daftarPesan.filter((item) => {
    if (tabAktif === "riwayat") return item.status === "closed";
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

  const totalUnreadAntrian = daftarPesan
    .filter((p) => p.statusChat === "antrian")
    .reduce((sum, p) => sum + (p.unread_count || 0), 0);

  const pesanCustomerTerakhir = kontakAktif
    ? [...kontakAktif.riwayatChat]
        .reverse()
        .find((m) => m.penulis === "pelanggan") || null
    : null;

  // ====== Handler utama ======
  const loadMessageHistory = async (convId: number) => {
    setKontakAktifId(convId);
    setPanelSaranTerbuka(false);
    setDaftarSaran([]);
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
    } catch {
      // Diabaikan (tidak ditampilkan di console browser)
    }
  };

  const handleMulaiChat = (id: number) => {
    if (!antrianDibuka()) {
      showError(
        `Antrian hanya bisa diambil pukul ${TEKS_JAM_OPERASIONAL}. Silakan ambil lagi besok mulai pukul 08.00.`,
      );
      return;
    }

    if (!socket || status !== "connected") {
      pendingClaimIdRef.current = id;

      setConnectionToast({
        show: true,
        message:
          "Sistem sedang menghubungkan... Mencoba otomatis dalam 3 detik.",
        type: "warning",
      });

      setTimeout(() => {
        setConnectionToast((prev) => ({ ...prev, show: false }));
      }, 5000);

      return;
    }

    socket.emit(
      "conversation:claim",
      { conversationId: id, adminId, timeZone: zonaWaktuLokal() },
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
          showSuccess("Chat berhasil diambil");
        } else {
          showError(response.error || "Chat sudah diambil admin lain.");
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
    setPanelSaranTerbuka(false);

    socket.emit(
      "message:send",
      {
        conversationId: kontakAktifId,
        clientMessageId,
        message: inputPesan,
        senderType: "admin",
        senderAdminId: adminId,
      },
      (response: any) => {
        if (!response.success) {
          showError(response.error || "Gagal mengirim pesan");
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
              showSuccess("Percakapan telah ditutup");
            }
          },
        );
      }
    });
  };

  const handleReload = () => {
    hasLoadedRef.current = false;
    loadConversations();
  };

  // =====================================================
  // CRUD TEMPLATE SARAN (MODAL DI DALAM PESAN MASUK)
  // =====================================================
  const bukaModalSaran = () => {
    setFormSaranMode("list");
    setModalSaranOpen(true);
  };

  const bukaFormTambahSaran = () => {
    setFormSaran(formSaranKosong);
    setFormSaranMode("tambah");
  };

  const bukaFormEditSaran = (t: TemplateSaran) => {
    setFormSaran({
      id: t.id,
      judul: t.judul,
      kata_kunci: t.kata_kunci,
      isi_balasan: t.isi_balasan,
      aktif: Number(t.aktif) === 1,
    });
    setFormSaranMode("edit");
  };

  const handleSimpanSaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formSaran.judul.trim() ||
      !formSaran.kata_kunci.trim() ||
      !formSaran.isi_balasan.trim()
    ) {
      showError("Judul, kata kunci, dan isi balasan wajib diisi");
      return;
    }

    setIsSavingSaran(true);
    try {
      const url =
        formSaranMode === "edit" && formSaran.id
          ? `/api/suggestion-admin/${formSaran.id}`
          : "/api/suggestion-admin";
      const method = formSaranMode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formSaran,
          aktif: formSaran.aktif ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

      showSuccess(
        formSaranMode === "edit"
          ? "Template berhasil diperbarui"
          : "Template berhasil ditambahkan",
      );
      setFormSaranMode("list");
      setFormSaran(formSaranKosong);
      await loadTemplates();
    } catch (err: any) {
      showError(err.message || "Gagal menyimpan template");
    } finally {
      setIsSavingSaran(false);
    }
  };

  const handleHapusSaran = (t: TemplateSaran) => {
    Swal.fire({
      title: "Hapus template?",
      html: `Template <b>${t.judul}</b> akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/suggestion-admin/${t.id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error();
          showSuccess("Template berhasil dihapus");
          await loadTemplates();
        } catch {
          showError("Gagal menghapus template");
        }
      }
    });
  };

  const handleToggleSaran = async (t: TemplateSaran) => {
    try {
      const res = await fetch(`/api/suggestion-admin/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: t.judul,
          kata_kunci: t.kata_kunci,
          isi_balasan: t.isi_balasan,
          aktif: Number(t.aktif) === 1 ? 0 : 1,
        }),
      });
      if (!res.ok) throw new Error();
      showSuccess(
        Number(t.aktif) === 1
          ? "Template dinonaktifkan"
          : "Template diaktifkan",
      );
      await loadTemplates();
    } catch {
      showError("Gagal mengubah status template");
    }
  };

  // =====================================================
  // PANEL SARAN (pencocokan kata kunci saat chat)
  // =====================================================
  const hitungSaran = () => {
    if (!pesanCustomerTerakhir) {
      setDaftarSaran([]);
      return;
    }
    setDaftarSaran(
      cariSaranTemplates(daftarTemplate, pesanCustomerTerakhir.teks, 3),
    );
  };

  const togglePanelSaran = () => {
    if (panelSaranTerbuka) {
      setPanelSaranTerbuka(false);
      return;
    }
    hitungSaran();
    setPanelSaranTerbuka(true);
  };

  // Setiap ada pesan customer baru → hitung saran & buka panel otomatis
  useEffect(() => {
    if (!pesanCustomerTerakhir) {
      setDaftarSaran([]);
      setPanelSaranTerbuka(false);
      return;
    }
    const hasil = cariSaranTemplates(
      daftarTemplate,
      pesanCustomerTerakhir.teks,
      3,
    );
    setDaftarSaran(hasil);
    setPanelSaranTerbuka(hasil.length > 0);
  }, [pesanCustomerTerakhir?.id, kontakAktifId, daftarTemplate]);

  // KLIK SARAN → HANYA mengisi kolom, TIDAK mengirim
  const pakaiSaran = (isi: string) => {
    setInputPesan(isi);
    balasanInputRef.current?.focus();
  };

  // Notifikasi diklik → buka percakapan yang sesuai
  useEffect(() => {
    if (targetConversationId === null || isLoading) return;

    const target = daftarPesan.find((p) => p.id === targetConversationId);
    if (!target) {
      // Percakapan belum ada di daftar → muat ulang sekali
      if (!targetSudahDimuatUlangRef.current) {
        targetSudahDimuatUlangRef.current = true;
        loadConversations();
      } else {
        targetSudahDimuatUlangRef.current = false;
        clearTargetConversation();
      }
      return;
    }

    targetSudahDimuatUlangRef.current = false;
    setTabAktif(target.status === "closed" ? "riwayat" : "antrian");
    setPencarian("");
    loadMessageHistory(target.id);
    resetUnreadCount();
    clearTargetConversation();
  }, [targetConversationId, isLoading, daftarPesan]);

  return (
    <div className="space-y-2 h-full flex flex-col relative">
      {connectionToast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl border-l-4 ${
              connectionToast.type === "warning"
                ? "bg-yellow-50 border-yellow-500 text-yellow-800"
                : connectionToast.type === "success"
                  ? "bg-green-50 border-green-500 text-green-800"
                  : "bg-red-50 border-red-500 text-red-800"
            }`}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            {connectionToast.type === "warning" ? (
              <AlertCircle size={20} className="text-yellow-600" />
            ) : connectionToast.type === "success" ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : (
              <X size={20} className="text-red-600" />
            )}
            <p className="text-sm font-medium">{connectionToast.message}</p>
            <button
              onClick={() =>
                setConnectionToast((prev) => ({ ...prev, show: false }))
              }
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 100px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes popOnce {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* ===== Header ===== */}
      <div className="bg-white px-5 py-3 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">
              Manajemen Pesan Masuk
            </h2>
            <p className="text-sm text-gray-500">
              Kelola antrian pesan dan riwayat percakapan pelanggan NSS Express.
            </p>

            {/* Jam terkini (zona waktu laptop) & status antrian */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-2 bg-gray-950 text-white px-3 py-1.5 rounded-md shadow-sm">
                <Clock size={14} className="text-[#FFCC00]" />
                <span className="font-mono font-extrabold text-sm tabular-nums">
                  {sekarang.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  })}
                </span>
                <span className="text-[10px] font-bold text-[#FFCC00]">
                  {singkatanZonaWaktu(sekarang)}
                </span>
                <span className="text-[11px] text-gray-300 border-l border-gray-700 pl-2">
                  {sekarang.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold border ${
                  isAntrianDibuka
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAntrianDibuka
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                ></span>
                {isAntrianDibuka
                  ? `Antrian dibuka (${TEKS_JAM_OPERASIONAL}) · tutup ${formatDurasi(
                      sisaDetikPerubahan(sekarang),
                    )} lagi`
                  : `Antrian ditutup · buka pukul 08.00 (${formatDurasi(
                      sisaDetikPerubahan(sekarang),
                    )} lagi)`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* ===== TOMBOL MODAL CRUD SARAN ===== */}
            <button
              onClick={bukaModalSaran}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-extrabold bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 border border-yellow-300 transition-colors cursor-pointer shadow-sm"
            >
              <Sparkles size={14} />
              Saran Balasan Cepat
            </button>

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                status === "connected"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {status === "connected" ? (
                <Wifi size={12} />
              ) : (
                <WifiOff size={12} />
              )}
              {status === "connected" ? "Live" : "Menghubungkan..."}
            </div>

            {globalUnreadCount > 0 && (
              <div
                key={globalUnreadCount}
                className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md"
                style={{ animation: "popOnce 0.25s ease-out" }}
              >
                <Bell size={14} />
                <span>{globalUnreadCount} pesan baru</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200">
              <Bell size={14} />
              <span>Notifikasi Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex">
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-gray-200 flex flex-col bg-white h-full overflow-hidden">
          <div className="grid grid-cols-2 bg-gray-100 p-1.5 border-b border-gray-200 gap-1 shrink-0">
            <button
              onClick={() => setTabAktif("antrian")}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-md transition-all cursor-pointer relative ${
                tabAktif === "antrian"
                  ? "bg-white text-gray-950 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ListOrdered size={16} />
              <span>
                Antrian (
                {daftarPesan.filter((i) => i.statusChat === "antrian").length})
              </span>
              {totalUnreadAntrian > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {totalUnreadAntrian > 99 ? "99+" : totalUnreadAntrian}
                </span>
              )}
            </button>
            <button
              onClick={() => setTabAktif("riwayat")}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-md transition-all cursor-pointer ${
                tabAktif === "riwayat"
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
              <div className="p-6 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw size={20} className="animate-spin" />
                Memuat data...
              </div>
            ) : apiError ? (
              <div className="p-6 text-center">
                <AlertCircle size={32} className="mx-auto text-red-400 mb-2" />
                <p className="text-xs text-red-600 mb-3">{apiError}</p>
                <button
                  onClick={handleReload}
                  className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-bold px-4 py-2 rounded-md text-xs flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <RefreshCw size={14} /> Coba Lagi
                </button>
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
                          className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                            isAktif
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
                          className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                            isAktif
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
                        className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                          isAktif
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

        {/* ===== Panel Chat Kanan ===== */}
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
                        className={`flex flex-col ${
                          dariAdmin ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] md:max-w-[65%] rounded-lg px-4 py-3 shadow-xs text-sm relative break-words whitespace-pre-wrap ${
                            dariAdmin
                              ? "bg-[#FFCC00] text-gray-950 rounded-tr-none font-medium"
                              : "bg-white text-gray-900 rounded-tl-none border border-gray-200 font-medium"
                          }`}
                        >
                          <p className="leading-relaxed">{chat.teks}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                              dariAdmin
                                ? "text-gray-800 font-semibold"
                                : "text-gray-400"
                            }`}
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
                        <div className="flex items-center gap-2">
                          {status !== "connected" && (
                            <div className="flex items-center gap-1.5 text-xs text-orange-600">
                              <RefreshCw size={12} className="animate-spin" />
                              <span>Menghubungkan...</span>
                            </div>
                          )}
                          {!isAntrianDibuka ? (
                            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                              <Clock size={12} />
                              Antrian ditutup. Chat bisa diambil lagi pukul
                              08.00 (jam operasional {TEKS_JAM_OPERASIONAL}).
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 font-medium">
                              {status === "connected"
                                ? "Tekan tombol Mulai untuk menangani chat ini."
                                : "Tunggu koneksi tersambung..."}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleMulaiChat(kontakAktif.id)}
                          disabled={status !== "connected" || !isAntrianDibuka}
                          title={
                            !isAntrianDibuka
                              ? `Antrian hanya bisa diambil pukul ${TEKS_JAM_OPERASIONAL}`
                              : undefined
                          }
                          className={`bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-5 py-2.5 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-105 ${
                            status !== "connected" || !isAntrianDibuka
                              ? "opacity-50 cursor-not-allowed hover:scale-100"
                              : ""
                          }`}
                        >
                          <Play size={16} fill="currentColor" />
                          <span>Mulai Chat</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white border-t border-gray-200">
                        {/* Toolbar saran */}
                        <div className="px-3.5 pt-2.5 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={togglePanelSaran}
                            className="flex items-center gap-1.5 text-[10px] font-extrabold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer uppercase tracking-wider"
                          >
                            <Sparkles size={12} />
                            Saran Balasan
                          </button>
                          {panelSaranTerbuka && (
                            <span className="text-[9px] text-gray-400">
                              klik saran → masuk kolom • kirim: Enter / tombol
                              Kirim
                            </span>
                          )}
                        </div>

                        {/* Daftar saran hasil pencocokan */}
                        {panelSaranTerbuka && (
                          <div className="px-3.5 pt-2">
                            {daftarSaran.length > 0 ? (
                              <div className="flex flex-col gap-1.5 pb-3 max-h-36 overflow-y-auto">
                                {daftarSaran.map((s) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => pakaiSaran(s.isi_balasan)}
                                    className="text-left bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-md px-3 py-2 text-xs text-gray-800 transition-colors cursor-pointer"
                                  >
                                    <span className="font-bold text-[10px] text-yellow-700 block mb-0.5">
                                      {s.judul} • kecocokan {s.skor} kata kunci
                                    </span>
                                    {s.isi_balasan}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-400 italic pb-3">
                                Tidak ada template yang cocok. Tambahkan lewat
                                tombol "Saran Balasan Cepat" di atas.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Form balasan */}
                        <div className="p-3.5 pt-2.5">
                          <form
                            onSubmit={handleKirimPesan}
                            className="flex items-center gap-3"
                          >
                            <input
                              ref={balasanInputRef}
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

      {/* ===================================================== */}
      {/* MODAL SARAN BALASAN CEPAT (CRUD TEMPLATE)             */}
      {/* ===================================================== */}
      {modalSaranOpen && (
        <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            {/* Header modal */}
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <Sparkles size={14} className="text-yellow-600" />
                Saran Balasan Cepat
              </h3>
              <button
                onClick={() => setModalSaranOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formSaranMode === "list" ? (
              <>
                {/* Toolbar daftar */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <p className="text-xs text-gray-500">
                    {daftarTemplate.length} template tersimpan • kata kunci
                    memicu saran saat chat
                  </p>
                  <button
                    onClick={bukaFormTambahSaran}
                    className="flex items-center gap-1.5 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-3 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus size={13} />
                    Tambah Template
                  </button>
                </div>

                {/* Daftar template */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {daftarTemplate.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-10">
                      Belum ada template. Klik "Tambah Template" untuk membuat
                      saran balasan pertama.
                    </div>
                  ) : (
                    daftarTemplate.map((t) => (
                      <div
                        key={t.id}
                        className="border border-gray-200 rounded-md p-3 hover:border-yellow-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-extrabold text-gray-900 text-xs truncate">
                                {t.judul}
                              </h4>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  Number(t.aktif) === 1
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {Number(t.aktif) === 1 ? "AKTIF" : "NONAKTIF"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {t.kata_kunci.split(",").map((k, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-yellow-50 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded-sm"
                                >
                                  {k.trim()}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed">
                              {t.isi_balasan}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => bukaFormEditSaran(t)}
                              className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleToggleSaran(t)}
                              className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                                Number(t.aktif) === 1
                                  ? "border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200"
                                  : "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                              }`}
                              title={
                                Number(t.aktif) === 1
                                  ? "Nonaktifkan"
                                  : "Aktifkan"
                              }
                            >
                              <Power size={12} />
                            </button>
                            <button
                              onClick={() => handleHapusSaran(t)}
                              className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* ===== Form tambah / edit ===== */
              <form
                onSubmit={handleSimpanSaran}
                className="p-5 space-y-4 overflow-y-auto"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Judul Template
                  </label>
                  <input
                    type="text"
                    value={formSaran.judul}
                    onChange={(e) =>
                      setFormSaran({ ...formSaran, judul: e.target.value })
                    }
                    placeholder="Contoh: Info Tarif"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kata Kunci (pemicu saran)
                  </label>
                  <input
                    type="text"
                    value={formSaran.kata_kunci}
                    onChange={(e) =>
                      setFormSaran({ ...formSaran, kata_kunci: e.target.value })
                    }
                    placeholder="tarif, biaya, ongkir, harga"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Pisahkan dengan koma. Saran muncul saat pesan customer
                    mengandung salah satu kata kunci ini.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Isi Balasan
                  </label>
                  <textarea
                    value={formSaran.isi_balasan}
                    onChange={(e) =>
                      setFormSaran({
                        ...formSaran,
                        isi_balasan: e.target.value,
                      })
                    }
                    placeholder="Teks balasan yang akan disarankan ke admin..."
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSaran.aktif}
                    onChange={(e) =>
                      setFormSaran({ ...formSaran, aktif: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#FFCC00]"
                  />
                  Template aktif (muncul sebagai saran)
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormSaranMode("list")}
                    className="px-4 py-2 rounded-md border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSaran}
                    className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-5 py-2 rounded-md text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSaran ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    {formSaranMode === "tambah"
                      ? "Simpan Template"
                      : "Perbarui Template"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PesanMasuk;
