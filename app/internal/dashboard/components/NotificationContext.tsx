"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useLiveChatSocket } from "@/app/hooks/use-live-chat-socket";
import {
  dengarKlikNotifikasi,
  halamanTidakDilihat,
  putarSuaraNotifikasi,
  siapkanNotifikasi,
  tampilkanNotifikasiBrowser,
  tandaiJudulPesanBaru,
} from "@/app/hooks/chat-notification";
import { X, MessageSquare } from "lucide-react";

interface ToastNotif {
  id: number;
  customerName: string;
  message: string;
  timestamp: string;
  avatar: string;
  conversationId: number;
  type: "message" | "success" | "error" | "warning";
}

interface NotificationContextType {
  toasts: ToastNotif[];
  unreadCount: number;
  addToast: (
    customerName: string,
    message: string,
    conversationId: number,
    type?: ToastNotif["type"],
  ) => void;
  removeToast: (id: number) => void;
  clearToasts: () => void;
  resetUnreadCount: () => void;
  // Percakapan yang harus dibuka setelah notifikasi diklik
  targetConversationId: number | null;
  openConversation: (conversationId: number) => void;
  clearTargetConversation: () => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  adminId: number;
}

export const NotificationProvider = ({
  children,
  adminId,
}: NotificationProviderProps) => {
  const [toasts, setToasts] = useState<ToastNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [targetConversationId, setTargetConversationId] = useState<
    number | null
  >(null);
  const { socket, status } = useLiveChatSocket(null, null, true, adminId);

  const addToast = useCallback(
    (
      customerName: string,
      message: string,
      conversationId: number,
      type: ToastNotif["type"] = "message",
    ) => {
      const newToast: ToastNotif = {
        id: Date.now() + Math.random(),
        customerName,
        message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatar: (customerName || "UN").substring(0, 2).toUpperCase(),
        conversationId,
        type,
      };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    },
    [],
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const openConversation = useCallback((conversationId: number) => {
    if (!conversationId) return;
    setTargetConversationId(conversationId);
  }, []);

  const clearTargetConversation = useCallback(() => {
    setTargetConversationId(null);
  }, []);

  const handleToastClick = (toast: ToastNotif) => {
    if (toast.type === "message" && toast.conversationId) {
      openConversation(toast.conversationId);
    }
    removeToast(toast.id);
  };

  // Siapkan notifikasi OS (tetap muncul saat browser di-minimize / tab lain)
  useEffect(() => {
    siapkanNotifikasi();

    // Klik notifikasi OS → service worker memfokuskan tab ini
    const berhenti = dengarKlikNotifikasi((data) => {
      if (data.conversationId) openConversation(data.conversationId);
    });

    // Tab dashboard dibuka dari notifikasi (?percakapan=ID)
    const params = new URLSearchParams(window.location.search);
    const dariUrl = Number(params.get("percakapan"));
    if (dariUrl) {
      openConversation(dariUrl);
      params.delete("percakapan");
      const sisa = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (sisa ? `?${sisa}` : ""),
      );
    }

    return berhenti;
  }, [openConversation]);

  // Listen SEMUA pesan dari customer
  useEffect(() => {
    if (!socket || status !== "connected") {
      console.log("⏳ Socket belum connected:", { socket: !!socket, status });
      return;
    }

    console.log("✅ Socket connected, listening for messages...");

    const handleMessageNew = (data: any) => {
      console.log("📩 Pesan baru diterima:", data);

      if (data.senderType === "customer") {
        const customerName = data.customerName || "Customer";
        const conversationId = data.conversationId;

        console.log(
          `🔔 Menampilkan notifikasi: ${customerName} - ${data.message}`,
        );
        addToast(customerName, data.message, conversationId, "message");
        setUnreadCount((prev) => prev + 1);
        putarSuaraNotifikasi();

        if (halamanTidakDilihat()) {
          tandaiJudulPesanBaru();
          tampilkanNotifikasiBrowser({
            judul: `Pesan Baru dari ${customerName}`,
            isi: data.message,
            tag: `chat-${conversationId}`,
            data: {
              path: "/internal/dashboard",
              url: `/internal/dashboard?percakapan=${conversationId}`,
              conversationId,
            },
            onClick: () => openConversation(conversationId),
          });
        }
      }
    };

    socket.on("message:new", handleMessageNew);

    return () => {
      socket.off("message:new", handleMessageNew);
    };
  }, [socket, status, addToast, openConversation]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        unreadCount,
        addToast,
        removeToast,
        clearToasts,
        resetUnreadCount,
        targetConversationId,
        openConversation,
        clearTargetConversation,
      }}
    >
      {children}

      {toasts.length > 0 && (
        <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => handleToastClick(toast)}
              className="pointer-events-auto bg-white border-l-4 border-l-[#FFCC00] rounded-lg shadow-2xl p-4 flex items-start gap-3 cursor-pointer hover:shadow-xl transition-all"
              style={{ animation: "slideInRight 0.3s ease-out" }}
            >
              <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFCC00] font-extrabold flex items-center justify-center text-xs shrink-0">
                {toast.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm truncate">
                    {toast.customerName}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeToast(toast.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                  {toast.message}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <MessageSquare size={10} />
                  <span>Pesan baru • {toast.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};
