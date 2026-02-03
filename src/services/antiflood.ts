/**
 * In-memory antiflood: 5 messages in 10 seconds -> punish (caller applies mute).
 */

const WINDOW_MS = 10_000;
const MAX_MESSAGES = 5;

/** chatId:userId -> timestamps of recent messages */
const recent = new Map<string, number[]>();

function key(chatId: number, userId: number): string {
  return `${chatId}:${userId}`;
}

function prune(k: string): void {
  const list = recent.get(k);
  if (!list) return;
  const cutoff = Date.now() - WINDOW_MS;
  const filtered = list.filter((t) => t > cutoff);
  if (filtered.length === 0) recent.delete(k);
  else recent.set(k, filtered);
}

/** Record message; returns true if user exceeded limit (flood). */
export function recordMessage(chatId: number, userId: number): boolean {
  const k = key(chatId, userId);
  prune(k);
  const list = recent.get(k) ?? [];
  list.push(Date.now());
  recent.set(k, list);
  return list.length >= MAX_MESSAGES;
}

/** Clear history for user in chat (e.g. after mute). */
export function clearUser(chatId: number, userId: number): void {
  recent.delete(key(chatId, userId));
}

export const ANTIFLOOD_MAX_MESSAGES = MAX_MESSAGES;
export const ANTIFLOOD_WINDOW_SEC = WINDOW_MS / 1000;
