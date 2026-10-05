import { Server } from "socket.io";
import { pool } from "@/lib/internal/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { cleanChatMessage, checkRateLimit } from "@/lib/internal/chat-utils";

export function initLiveChatSocket(httpServer: any) {
  const io = new Server(httpServer, {
    path: "/api/live-chat-socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const cookieHeader = socket.handshake.headers.cookie;
    const isAdmin = cookieHeader?.includes("gs_internal_session");

    if (isAdmin) {
      socket.data.role = "admin";
      socket.data.adminId = 1;
      next();
      return;
    }

    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM live_chat_conversations WHERE public_token_hash = ? AND status != 'closed'",
        [tokenHash],
      );
      if (rows.length > 0) {
        socket.data.conversationId = rows[0].id;
        socket.data.role = "customer";
        next();
        return;
      }
    }
    next(new Error("Unauthorized"));
  });

  io.on("connection", (socket) => {
    if (socket.data.role === "customer") {
      socket.join(`conversation:${socket.data.conversationId}`);
    }

    socket.on("admins:live-chat:join", () => {
      socket.join("admins:live-chat");
    });

    socket.on("conversation:join", (conversationId: number) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("message:send", async (payload: any, callback) => {
      try {
        const { conversationId, clientMessageId, message, senderType } =
          payload;

        const senderKey = `${senderType}:${conversationId}`;
        if (!checkRateLimit(senderKey, 12, 60000)) {
          callback({
            success: false,
            error: "Terlalu banyak pesan. Silakan tunggu sebentar.",
          });
          return;
        }

        const [existing] = await pool.execute<RowDataPacket[]>(
          "SELECT id FROM live_chat_messages WHERE client_message_id = ?",
          [clientMessageId],
        );

        if (existing.length > 0) {
          callback({ success: true, messageId: existing[0].id });
          return;
        }

        const sanitizedMessage = cleanChatMessage(message);
        const senderAdminId =
          socket.data.role === "admin" ? socket.data.adminId : null;

        const [result] = await pool.execute<ResultSetHeader>(
          "INSERT INTO live_chat_messages (conversation_id, client_message_id, sender_type, sender_admin_id, message) VALUES (?, ?, ?, ?, ?)",
          [
            conversationId,
            clientMessageId,
            senderType,
            senderAdminId,
            sanitizedMessage,
          ],
        );

        const newMessage = {
          id: result.insertId,
          conversationId,
          senderType,
          senderAdminId,
          message: sanitizedMessage,
          createdAt: new Date().toISOString(),
          clientMessageId,
        };

        io.to(`conversation:${conversationId}`).emit("message:new", newMessage);

        if (senderType === "customer") {
          io.to("admins:live-chat").emit("conversation:updated", {
            conversationId,
          });
        }

        callback({ success: true, messageId: result.insertId });
      } catch (error) {
        console.error("Socket message:send error:", error);
        callback({ success: false, error: "Gagal menyimpan pesan" });
      }
    });

    socket.on("conversation:claim", async (payload: any, callback) => {
      try {
        const { conversationId, adminId } = payload;
        const [result] = await pool.execute<ResultSetHeader>(
          `UPDATE live_chat_conversations 
           SET assigned_admin_id = ?, status = 'assigned' 
           WHERE id = ? AND assigned_admin_id IS NULL AND status = 'open'`,
          [adminId, conversationId],
        );

        if (result.affectedRows === 1) {
          io.to(`conversation:${conversationId}`).emit("conversation:updated", {
            conversationId,
            status: "assigned",
            assignedAdminId: adminId,
          });
          io.to("admins:live-chat").emit("conversation:updated", {
            conversationId,
            status: "assigned",
            assignedAdminId: adminId,
          });
          callback({ success: true });
        } else {
          callback({ success: false, error: "Chat sudah diambil admin lain" });
        }
      } catch (error) {
        console.error("Socket conversation:claim error:", error);
        callback({ success: false, error: "Gagal mengklaim chat" });
      }
    });

    socket.on("conversation:close", async (payload: any, callback) => {
      try {
        const { conversationId } = payload;
        await pool.execute(
          "UPDATE live_chat_conversations SET status = 'closed' WHERE id = ?",
          [conversationId],
        );
        io.to(`conversation:${conversationId}`).emit("conversation:updated", {
          conversationId,
          status: "closed",
        });
        io.to("admins:live-chat").emit("conversation:updated", {
          conversationId,
          status: "closed",
        });
        callback({ success: true });
      } catch (error) {
        console.error("Socket conversation:close error:", error);
        callback({ success: false, error: "Gagal menutup chat" });
      }
    });
  });

  return io;
}
