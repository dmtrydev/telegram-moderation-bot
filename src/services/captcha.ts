import type { Bot } from "grammy";
import { log } from "../logger.js";

const CAPTCHA_CALLBACK = "captcha_ok";
const CAPTCHA_TIMEOUT_MS = 60_000;

/** Pending captcha: chatId -> Set of userId */
const pending = new Map<number, Set<number>>();
/** Timeouts: `${chatId}:${userId}` -> NodeJS.Timeout */
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function key(chatId: number, userId: number): string {
  return `${chatId}:${userId}`;
}

function clearTimeoutFor(chatId: number, userId: number): void {
  const k = key(chatId, userId);
  const t = timeouts.get(k);
  if (t) {
    clearTimeout(t);
    timeouts.delete(k);
  }
  const set = pending.get(chatId);
  if (set) {
    set.delete(userId);
    if (set.size === 0) pending.delete(chatId);
  }
}

export function isPendingCaptcha(chatId: number, userId: number): boolean {
  return pending.get(chatId)?.has(userId) ?? false;
}

export function registerCaptcha(
  bot: Bot,
  chatId: number,
  userId: number,
  onKick: (chatId: number, userId: number) => Promise<void>
): void {
  const set = pending.get(chatId) ?? new Set();
  set.add(userId);
  pending.set(chatId, set);

  clearTimeoutFor(chatId, userId);
  const t = setTimeout(async () => {
    clearTimeoutFor(chatId, userId);
    await onKick(chatId, userId);
    log(`[captcha] User ${userId} kicked from chat ${chatId} (timeout)`);
  }, CAPTCHA_TIMEOUT_MS);
  timeouts.set(key(chatId, userId), t);
}

export function resolveCaptcha(chatId: number, userId: number): void {
  clearTimeoutFor(chatId, userId);
}

export const CAPTCHA_CALLBACK_DATA = CAPTCHA_CALLBACK;
export const CAPTCHA_TIMEOUT_SEC = CAPTCHA_TIMEOUT_MS / 1000;
