import type { Api } from "grammy";

const MAX_MESSAGE_LENGTH = 4000;

let apiInstance: Api | null = null;
let logChatId: number | null = null;

export function setLogChat(api: Api, chatId: number): void {
  apiInstance = api;
  logChatId = chatId;
}

async function sendToChat(message: string): Promise<void> {
  if (!apiInstance || logChatId == null) return;
  const text = message.length > MAX_MESSAGE_LENGTH ? message.slice(0, MAX_MESSAGE_LENGTH) + "…" : message;
  try {
    await apiInstance.sendMessage(logChatId, text);
  } catch (err) {
    console.error("[logger] Failed to send to Telegram:", err);
  }
}

export function log(message: string): void {
  console.log(message);
  sendToChat(message).catch(() => {});
}

export function error(message: string, err?: unknown): void {
  const full = err != null ? `${message} ${String(err)}` : message;
  console.error(full);
  sendToChat("❌ " + full).catch(() => {});
}

export function warn(message: string): void {
  console.warn(message);
  sendToChat("⚠️ " + message).catch(() => {});
}
