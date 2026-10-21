const { createServer } = require("http");
const { parse } = require("url");
const fs = require("fs");
const path = require("path");
const next = require("next");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "admin",
  database: process.env.DB_NAME || "nss_express",
  waitForConnections: true,
  connectionLimit: 10,
});

// ========== FILE UPLOAD (banner, hero, info) ==========
// Di production Next.js tidak menjamin file yang ditambahkan ke public/ setelah
// build ikut tersaji, jadi /uploads/* dilayani langsung dari folder upload
// (di Docker folder ini berupa volume agar tidak hilang saat container dibuat ulang).
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MIME_UPLOAD = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

function layaniUpload(req, res, pathname) {
  if (!pathname.startsWith("/uploads/")) return false;
  if (req.method !== "GET" && req.method !== "HEAD") return false;

  let relatif;
  try {
    relatif = decodeURIComponent(pathname.slice("/uploads/".length));
  } catch {
    res.statusCode = 400;
    res.end();
    return true;
  }

  const file = path.resolve(UPLOAD_DIR, relatif);
  const tipe = MIME_UPLOAD[path.extname(file).toLowerCase()];
  // Tolak path di luar folder upload & tipe file selain gambar
  if (!file.startsWith(UPLOAD_DIR + path.sep) || !tipe) {
    res.statusCode = 404;
    res.end("Not found");
    return true;
  }

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": tipe,
      "Content-Length": stat.size,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
  return true;
}

// Jam ambil antrian admin: 08.00 – 16.59 (sama dengan lib/jam-operasional.ts)
const JAM_BUKA = 8;
const JAM_TUTUP = 17;

// Jam saat ini di zona waktu laptop admin (fallback WIB)
function jamDiZona(timeZone) {
  const ambil = (tz) =>
    Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date()),
    );
  try {
    return ambil(timeZone || "Asia/Jakarta");
  } catch {
    return ambil("Asia/Jakarta");
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    if (layaniUpload(req, res, parsedUrl.pathname || "")) return;
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  console.log("🔌 Socket.IO attached ke HTTP server Next.js");

  io.on("connection", (socket) => {
    const auth = socket.handshake.auth || {};
    socket.data.role = auth.isAdmin ? "admin" : "customer";
    socket.data.adminId = auth.adminId || null;

    console.log(
      `✅ Client connected: ${socket.id} | role: ${socket.data.role}`,
    );

    // ========== ADMIN JOIN ROOM NOTIFIKASI ==========
    socket.on("admins:live-chat:join", () => {
      socket.join("admins:live-chat");
      console.log(`📡 Admin joined room: admins:live-chat`);
    });

    // ========== JOIN ROOM CONVERSATION ==========
    socket.on("conversation:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`📡 Joined room: conversation:${conversationId}`);
    });

    // ========== KIRIM PESAN ==========
    socket.on("message:send", async (data, callback) => {
      try {
        const {
          conversationId,
          message,
          senderType,
          clientMessageId,
          senderAdminId,
        } = data;

        console.log(
          `[SOCKET] message:send | conv:${conversationId} | ${senderType} | "${message}"`,
        );

        // 1. Simpan ke database
        const [result] = await pool.query(
          `INSERT INTO live_chat_messages 
           (conversation_id, client_message_id, sender_type, sender_admin_id, message, is_read, created_at) 
           VALUES (?, ?, ?, ?, ?, 0, NOW())`,
          [
            parseInt(conversationId),
            clientMessageId,
            senderType,
            senderType === "admin"
              ? senderAdminId || socket.data.adminId || null
              : null,
            message,
          ],
        );

        // 2. Ambil info customer untuk notifikasi
        const [rows] = await pool.query(
          `SELECT customer_name, customer_whatsapp 
           FROM live_chat_conversations WHERE id = ?`,
          [parseInt(conversationId)],
        );
        const conv = rows[0] || {};

        const messageData = {
          id: result.insertId,
          conversationId: parseInt(conversationId),
          message,
          senderType,
          customerName: conv.customer_name || "Customer",
          customerWhatsapp: conv.customer_whatsapp || "",
          createdAt: new Date().toISOString(),
          clientMessageId,
        };

        // 3. Broadcast ke SEMUA ADMIN (notifikasi toast)
        io.to("admins:live-chat").emit("message:new", messageData);

        // 4. Broadcast ke room conversation (chat widget)
        io.to(`conversation:${conversationId}`).emit(
          "message:new",
          messageData,
        );

        console.log(
          `[SOCKET] ✅ Broadcast message:new (conv ${conversationId})`,
        );
        callback({ success: true, messageId: result.insertId });
      } catch (error) {
        console.error("[SOCKET] ❌ Error message:send:", error.message);
        callback({ success: false, error: "Gagal mengirim pesan" });
      }
    });

    // ========== ADMIN CLAIM CHAT ==========
    socket.on("conversation:claim", async (data, callback) => {
      try {
        const { conversationId, adminId, timeZone } = data;

        const jam = jamDiZona(timeZone);
        if (jam < JAM_BUKA || jam >= JAM_TUTUP) {
          callback({
            success: false,
            error:
              "Antrian hanya bisa diambil pukul 08.00 – 16.59. Silakan ambil lagi besok mulai pukul 08.00.",
          });
          return;
        }

        await pool.query(
          `UPDATE live_chat_conversations
           SET status = 'assigned', assigned_admin_id = ?,
               assigned_at = COALESCE(assigned_at, NOW())
           WHERE id = ?`,
          [adminId, parseInt(conversationId)],
        );

        io.to("admins:live-chat").emit("conversation:updated", {
          conversationId: parseInt(conversationId),
          status: "assigned",
          assignedAdminId: adminId,
        });

        console.log(
          `[SOCKET] ✅ Conv ${conversationId} claimed by admin ${adminId}`,
        );
        callback({ success: true });
      } catch (error) {
        console.error("[SOCKET] ❌ Error claim:", error.message);
        callback({ success: false, error: "Gagal claim conversation" });
      }
    });

    // ========== ADMIN TUTUP CHAT ==========
    socket.on("conversation:close", async (data, callback) => {
      try {
        const { conversationId } = data;

        await pool.query(
          `UPDATE live_chat_conversations
           SET status = 'closed', closed_at = NOW(), closed_by_admin_id = ?
           WHERE id = ?`,
          [socket.data.adminId || null, parseInt(conversationId)],
        );

        io.to("admins:live-chat").emit("conversation:updated", {
          conversationId: parseInt(conversationId),
          status: "closed",
        });
        io.to(`conversation:${conversationId}`).emit("conversation:updated", {
          conversationId: parseInt(conversationId),
          status: "closed",
        });

        console.log(`[SOCKET] ✅ Conv ${conversationId} closed`);
        callback({ success: true });
      } catch (error) {
        console.error("[SOCKET] ❌ Error close:", error.message);
        callback({ success: false, error: "Gagal menutup conversation" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Ready on http://${hostname}:${port} (Next.js + Socket.IO SATU PORT)`,
    );
  });

  // ========== GRACEFUL SHUTDOWN (docker stop / Ctrl+C) ==========
  let sedangBerhenti = false;
  const berhenti = (sinyal) => {
    if (sedangBerhenti) return;
    sedangBerhenti = true;
    console.log(`\n${sinyal} diterima, menutup server...`);
    setTimeout(() => process.exit(0), 10_000).unref();
    io.close();
    httpServer.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  };
  process.on("SIGTERM", () => berhenti("SIGTERM"));
  process.on("SIGINT", () => berhenti("SIGINT"));
});
