import crypto from "crypto";
import { pool } from "./db";

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function findConversationById(conversationId: number) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, customer_name, customer_whatsapp, customer_token_hash, status, created_at 
       FROM live_chat_conversations 
       WHERE id = ?`,
      [conversationId],
    );

    const conversations = rows as any[];
    if (conversations.length > 0) {
      return conversations[0];
    }
    return null;
  } catch (error) {
    console.error("Gagal mencari percakapan berdasarkan ID:", error);
    return null;
  }
}

export function cleanChatMessage(rawMessage: string): string {
  if (!rawMessage) return "";

  return rawMessage
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 2000);
}
