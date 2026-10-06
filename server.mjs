import { createServer } from "http";
import { parse } from "url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error processing request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  console.log("🔌 Initializing Socket.IO server...");
  const { initLiveChatSocket } =
    await import("./lib/realtime/live-chat-server.ts");
  const io = initLiveChatSocket(httpServer);
  console.log("✅ Socket.IO server initialized successfully");

  httpServer.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
  });
});
