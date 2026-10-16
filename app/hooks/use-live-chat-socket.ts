"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

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

  useEffect(() => {
    isAdminRef.current = isAdmin;
    adminIdRef.current = adminId;
    tokenRef.current = token;
    conversationIdRef.current = conversationId;
  }, [isAdmin, adminId, token, conversationId]);

  useEffect(() => {
    if (!isAdmin && (!token || !conversationId)) {
      return;
    }

    // Socket sudah ada & connected → pakai lagi + join room
    if (globalSocket?.connected) {
      setStatus("connected");
      if (isAdminRef.current) {
        globalSocket.emit("admins:live-chat:join");
      } else if (conversationIdRef.current) {
        globalSocket.emit("conversation:join", conversationIdRef.current);
      }
      return;
    }

    // Socket ada tapi putus → reconnect
    if (globalSocket) {
      globalSocket.auth = isAdmin ? { isAdmin: true, adminId } : { token };
      globalSocket.connect();
      return;
    }

    // Buat socket baru → SATU PORT (origin yang sama dengan web)
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000");

    console.log("🔌 Creating socket to:", socketUrl);

    globalSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: isAdmin ? { isAdmin: true, adminId } : { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    globalSocket.on("connect", () => {
      console.log("✅ Socket connected:", globalSocket?.id);
      setStatus("connected");

      if (isAdminRef.current) {
        globalSocket?.emit("admins:live-chat:join");
      } else if (conversationIdRef.current) {
        globalSocket?.emit("conversation:join", conversationIdRef.current);
      }
    });

    globalSocket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setStatus("disconnected");
    });

    globalSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setStatus("error");
    });
  }, [isAdmin, adminId, token, conversationId]);

  return { socket: globalSocket, status };
}

export function cleanupGlobalSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}
