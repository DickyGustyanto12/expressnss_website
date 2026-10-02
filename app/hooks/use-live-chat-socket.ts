import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useLiveChatSocket = (conversationId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const socketInstance = io("/live-chat", {
      path: "/api/live-chat-socket",
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      socketInstance.emit("conversation:join", conversationId);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [conversationId]);

  return socket;
};
