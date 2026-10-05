"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useLiveChatSocket(
  token: string | null,
  conversationId: string | null,
  isAdmin: boolean = false,
) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");

  useEffect(() => {
    if (!isAdmin && (!token || !conversationId)) return;

    console.log(" Initializing socket...", {
      isAdmin,
      token: !!token,
      conversationId,
    });

    const socketInstance = io(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      {
        path: "/api/live-chat-socket",
        transports: ["websocket"],
        withCredentials: true,
        auth: isAdmin ? {} : { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      },
    );

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setStatus("connected");

      if (isAdmin) {
        socketInstance.emit("admins:live-chat:join");
        console.log("📡 Admin joined admins:live-chat room");
      } else if (conversationId) {
        socketInstance.emit("conversation:join", conversationId);
        console.log("📡 Customer joined conversation:", conversationId);
      }
    });

    socketInstance.on("disconnect", () => {
      console.log(" Socket disconnected");
      setStatus("disconnected");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("️ Socket connection error:", error.message);
      setStatus("error");
    });

    setSocket(socketInstance);

    return () => {
      console.log("🔌 Cleaning up socket");
      socketInstance.disconnect();
    };
  }, [token, conversationId, isAdmin]);

  return { socket, status };
}
