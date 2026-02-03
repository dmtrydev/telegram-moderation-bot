import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

const logChatIdRaw = process.env.LOG_CHAT_ID;
const parsed = logChatIdRaw ? parseInt(logChatIdRaw, 10) : NaN;

export const config = {
  BOT_TOKEN: requireEnv("BOT_TOKEN"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  /** Chat ID to send logs to (optional). Get your ID from @userinfobot. */
  LOG_CHAT_ID: Number.isNaN(parsed) ? null : parsed,
} as const;
