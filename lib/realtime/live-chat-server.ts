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
    const isAdminFromAuth = socket.handshake.auth.isAdmin === true;
    const adminIdFromAuth = socket.handshake.auth.adminId;

    // Cek cookie session admin
    const isAdminFromCookie = cookieHeader?.includes("gs_internal_session");

    // PRIORITAS 1: Jika ada cookie session admin
    if (isAdminFromCookie) {
      socket.data.role = "admin";
      socket.data.adminId = adminIdFromAuth || 1;
      console.log("✅ [SOCKET] Admin authenticated via cookie");
      next();
      return;
    }

    // PRIORITAS 2: Jika client mengirim flag isAdmin=true (untuk development)
    if (isAdminFromAuth) {
      socket.data.role = "admin";
      socket.data.adminId = adminIdFromAuth || 1;
      console.log(
        "✅ [SOCKET] Admin authenticated via auth flag, adminId:",
        socket.data.adminId,
      );
      next();
      return;
    }

    // PRIORITAS 3: Cek token customer
    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM live_chat_conversations WHERE public_token_hash = ? AND status != 'closed'",
        [tokenHash],
      );
      if (rows.length > 0) {
        socket.data.conversationId = rows[0].id;
        socket.data.role = "customer";
        console.log(
          "✅ [SOCKET] Customer authenticated, conversation:",
          rows[0].id,
        );
        next();
        return;
      }
    }

    console.log("❌ [SOCKET] Unauthorized connection attempt");
    next(new Error("Unauthorized"));
  });

  io.on("connection", (socket) => {
    console.log(
      "🔌 [SERVER] Client terhubung:",
      socket.id,
      "Role:",
      socket.data.role,
    );

    if (socket.data.role === "customer") {
      socket.join(`conversation:${socket.data.conversationId}`);
      console.log(
        "📁 [SERVER] Customer join room:",
        `conversation:${socket.data.conversationId}`,
      );
    }

    socket.on("admins:live-chat:join", () => {
      socket.join("admins:live-chat");
      console.log("📁 [SERVER] Admin join room: admins:live-chat");
    });

    socket.on("conversation:join", (conversationId: number) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("message:send", async (payload: any, callback: Function) => {
      console.log("📥 [SERVER] Menerima event 'message:send':", payload);
      console.log("📥 [SERVER] Data socket saat ini:", {
        role: socket.data.role,
        conversationId: socket.data.conversationId,
      });

      try {
        const { conversationId, clientMessageId, message, senderType } =
          payload;

        const senderKey = `${senderType}:${conversationId}`;
        if (!checkRateLimit(senderKey, 12, 60000)) {
          console.log("⚠️ [SERVER] Rate limit tercapai untuk:", senderKey);
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
          console.log(
            "⚠️ [SERVER] Pesan duplikat terdeteksi, mengembalikan ID yang ada:",
            existing[0].id,
          );
          callback({ success: true, messageId: existing[0].id });
          return;
        }

        const sanitizedMessage = cleanChatMessage(message);
        const senderAdminId =
          socket.data.role === "admin" ? socket.data.adminId : null;

        console.log("💾 [SERVER] Menyimpan pesan ke database...");
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
        console.log(
          "✅ [SERVER] Berhasil disimpan ke DB dengan ID:",
          result.insertId,
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

        console.log(
          "📡 [SERVER] Broadcasting 'message:new' ke room:",
          `conversation:${conversationId} dan admins:live-chat`,
        );
        io.to(`conversation:${conversationId}`).emit("message:new", newMessage);
        io.to("admins:live-chat").emit("message:new", newMessage);

        if (senderType === "customer") {
          const [convRows] = await pool.execute<RowDataPacket[]>(
            "SELECT id, customer_name, customer_whatsapp, customer_email, status, assigned_admin_id, created_at FROM live_chat_conversations WHERE id = ?",
            [conversationId],
          );
          if (convRows.length > 0) {
            const conv = convRows[0];
            io.to("admins:live-chat").emit("conversation:updated", {
              conversationId,
              status: conv.status,
              assignedAdminId: conv.assigned_admin_id,
              customerName: conv.customer_name,
              customerWhatsapp: conv.customer_whatsapp,
              customerEmail: conv.customer_email,
              createdAt: conv.created_at,
            });
          } else {
            io.to("admins:live-chat").emit("conversation:updated", {
              conversationId,
            });
          }
        }

        callback({ success: true, messageId: result.insertId });
      } catch (error) {
        console.error("❌ [SERVER] Error saat memproses message:send:", error);
        callback({ success: false, error: "Gagal menyimpan pesan" });
      }
    });

    socket.on(
      "conversation:claim",
      async (payload: any, callback: Function) => {
        try {
          const { conversationId, adminId } = payload;
          const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE live_chat_conversations 
           SET assigned_admin_id = ?, status = 'assigned' 
           WHERE id = ? AND assigned_admin_id IS NULL AND status = 'open'`,
            [adminId, conversationId],
          );

          if (result.affectedRows === 1) {
            io.to(`conversation:${conversationId}`).emit(
              "conversation:updated",
              {
                conversationId,
                status: "assigned",
                assignedAdminId: adminId,
              },
            );
            io.to("admins:live-chat").emit("conversation:updated", {
              conversationId,
              status: "assigned",
              assignedAdminId: adminId,
            });
            callback({ success: true });
          } else {
            callback({
              success: false,
              error: "Chat sudah diambil admin lain",
            });
          }
        } catch (error) {
          console.error("❌ [SERVER] Error conversation:claim:", error);
          callback({ success: false, error: "Gagal mengklaim chat" });
        }
      },
    );

    socket.on(
      "conversation:close",
      async (payload: any, callback: Function) => {
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
          console.error("❌ [SERVER] Error conversation:close:", error);
          callback({ success: false, error: "Gagal menutup chat" });
        }
      },
    );
  });

  return io;
}
