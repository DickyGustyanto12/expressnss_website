"use client";

import { useEffect, useState } from "react";
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
  >(globalSocket?.connected ? "connected" : "disconnected");

  useEffect(() => {
    if (!isAdmin && (!token || !conversationId)) {
      return;
    }

    if (!globalSocket) {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        (typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000");

      globalSocket = io(socketUrl, {
        transports: ["websocket", "polling"],
        auth: isAdmin ? { isAdmin: true, adminId } : { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
    }

    const socket = globalSocket;

    const joinRoom = () => {
      if (isAdmin) {
        socket.emit("admins:live-chat:join");
      } else if (conversationId) {
        socket.emit("conversation:join", conversationId);
      }
    };

    const handleConnect = () => {
      setStatus("connected");
      joinRoom();
    };
    const handleDisconnect = () => setStatus("disconnected");
    const handleError = () => setStatus("error");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    if (socket.connected) {
      handleConnect();
    } else {
      setStatus("connecting");
      socket.auth = isAdmin ? { isAdmin: true, adminId } : { token };
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
    };
  }, [isAdmin, adminId, token, conversationId]);

  return { socket: globalSocket, status };
}

export function cleanupGlobalSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}
