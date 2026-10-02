import crypto from "crypto";
import { pool } from "./db";

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function findConversationById(conversationId: number) {
  const [rows] = await pool.execute(
    `SELECT id, customer_name, customer_whatsapp, status, created_at 
     FROM live_chat_conversations WHERE id = ?`,
    [conversationId],
  );
  return (rows as any[])[0] || null;
}
