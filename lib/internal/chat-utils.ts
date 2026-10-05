export function cleanChatMessage(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/\0/g, "");
  cleaned = cleaned.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (cleaned.length > 1200) {
    cleaned = cleaned.substring(0, 1200);
  }
  return cleaned.trim();
}

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(
  senderKey: string,
  maxMessages: number = 12,
  windowMs: number = 60000,
): boolean {
  const now = Date.now();
  const limitData = rateLimitMap.get(senderKey) || { count: 0, lastReset: now };
  if (now - limitData.lastReset > windowMs) {
    limitData.count = 0;
    limitData.lastReset = now;
  }
  if (limitData.count >= maxMessages) {
    return false;
  }
  limitData.count++;
  rateLimitMap.set(senderKey, limitData);
  return true;
}
