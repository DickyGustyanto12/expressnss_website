import { Server as SocketIOServer } from "socket.io";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "admin",
  database: "nss_express",
});

export function initLiveChatSocket(httpServer) {
  const io = new SocketIOServer(httpServer, {
    path: "/api/live-chat-socket",
    addTrailingSlash: false,
  });

  const liveChatNamespace = io.of("/live-chat");

  liveChatNamespace.on("connection", (socket) => {
    socket.on("conversation:join", (conversationId) => {
      const roomName = `conversation:${conversationId}`;
      socket.join(roomName);
    });

    socket.on("message:send", async (data) => {
      try {
        const { conversationId, clientMessageId, message, senderType } = data;

        const [result] = await pool.execute(
          `INSERT INTO live_chat_messages (conversation_id, client_message_id, sender_type, message, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [conversationId, clientMessageId, senderType, message],
        );

        const pesanBaru = {
          id: result.insertId,
          conversationId: conversationId,
          senderType: senderType,
          message: message,
          createdAt: new Date().toISOString(),
        };

        liveChatNamespace
          .to(`conversation:${conversationId}`)
          .emit("message:new", pesanBaru);
        socket.emit("message:ack", { clientMessageId, status: "success" });
      } catch (error) {
        socket.emit("error", {
          message: "Pesan gagal dikirim dan tidak disimpan",
        });
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
}
