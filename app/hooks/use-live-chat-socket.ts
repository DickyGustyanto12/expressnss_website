"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Singleton socket instance - hanya dibuat sekali untuk seluruh aplikasi
let globalSocket: Socket | null = null;

export function useLiveChatSocket(
  token: string | null,
  conversationId: string | null,
  isAdmin: boolean = false,
  adminId: number = 1,
) {
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");

  const isAdminRef = useRef(isAdmin);
  const adminIdRef = useRef(adminId);
  const tokenRef = useRef(token);
  const conversationIdRef = useRef(conversationId);
  const listenersAttachedRef = useRef(false);

  // Update refs saat props berubah
  useEffect(() => {
    isAdminRef.current = isAdmin;
    adminIdRef.current = adminId;
    tokenRef.current = token;
    conversationIdRef.current = conversationId;
  }, [isAdmin, adminId, token, conversationId]);

  useEffect(() => {
    // Jika bukan admin dan tidak ada token/conversationId, skip
    if (!isAdmin && (!token || !conversationId)) {
      return;
    }

    // Jika socket global sudah ada dan connected, gunakan itu
    if (globalSocket?.connected) {
      console.log("✅ Using existing global socket:", globalSocket.id);
      setStatus("connected");

      // Join room yang sesuai
      if (isAdminRef.current) {
        globalSocket.emit("admins:live-chat:join");
      } else if (conversationIdRef.current) {
        globalSocket.emit("conversation:join", conversationIdRef.current);
      }

      return;
    }

    // Jika socket global ada tapi tidak connected, coba reconnect
    if (globalSocket) {
      console.log(" Reconnecting existing socket...");
      globalSocket.auth = isAdmin ? { isAdmin: true, adminId } : { token };
      globalSocket.connect();
      return;
    }

    // Buat socket baru (hanya sekali)
    console.log("🔌 Creating new global socket...", { isAdmin, adminId });

    globalSocket = io(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      {
        path: "/api/live-chat-socket",
        transports: ["websocket"],
        withCredentials: true,
        auth: isAdmin ? { isAdmin: true, adminId } : { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        forceNew: false, // PENTING: Jangan buat socket baru
      },
    );

    globalSocket.on("connect", () => {
      console.log("✅ Global socket connected:", globalSocket?.id);
      setStatus("connected");

      if (isAdminRef.current) {
        globalSocket?.emit("admins:live-chat:join");
        console.log("📡 Admin joined admins:live-chat room");
      } else if (conversationIdRef.current) {
        globalSocket?.emit("conversation:join", conversationIdRef.current);
        console.log(
          "📡 Customer joined conversation:",
          conversationIdRef.current,
        );
      }
    });

    globalSocket.on("disconnect", () => {
      console.log("🔌 Global socket disconnected");
      setStatus("disconnected");
    });

    globalSocket.on("connect_error", (error) => {
      console.error("❌ Global socket connection error:", error.message);
      setStatus("error");
    });

    // JANGAN disconnect saat cleanup - biarkan socket tetap hidup
    return () => {
      // Hanya log, jangan disconnect
      console.log(" Component cleanup (socket tetap hidup)");
    };
  }, [isAdmin, adminId, token, conversationId]); // Diupdate agar merespons saat token berubah

  return { socket: globalSocket, status };
}

// Fungsi untuk cleanup socket saat aplikasi benar-benar ditutup
export function cleanupGlobalSocket() {
  if (globalSocket) {
    console.log("🔌 Cleaning up global socket");
    globalSocket.disconnect();
    globalSocket = null;
  }
}
