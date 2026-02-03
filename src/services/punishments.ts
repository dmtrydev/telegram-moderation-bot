import type { Api } from "grammy";
import { error } from "../logger.js";

/** Mute duration for antiflood: 10 minutes */
export const MUTE_DURATION_ANTIFLOOD_SEC = 10 * 60;

/**
 * Parse duration like 10m, 1h, 1d into seconds.
 */
export function parseMuteDuration(input: string): number | null {
  const s = input.trim().toLowerCase();
  const match = s.match(/^(\d+)(m|h|d)?$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (Number.isNaN(num) || num < 1) return null;
  const unit = match[2] ?? "m";
  switch (unit) {
    case "m":
      return Math.min(num * 60, 366 * 24 * 60); // max ~1 year
    case "h":
      return Math.min(num * 3600, 366 * 24 * 3600);
    case "d":
      return Math.min(num * 86400, 366 * 86400);
    default:
      return null;
  }
}

/**
 * Restrict user: until date = now + seconds.
 */
export async function muteUser(
  api: Api,
  chatId: number,
  userId: number,
  untilDate: number
): Promise<boolean> {
  try {
    await api.restrictChatMember(chatId, userId, { can_send_messages: false }, { until_date: untilDate });
    return true;
  } catch (e) {
    error("[punishments] mute error", e);
    return false;
  }
}

/**
 * Unmute: allow sending messages (until_date in past or permissions reset).
 */
export async function unmuteUser(
  api: Api,
  chatId: number,
  userId: number
): Promise<boolean> {
  try {
    await api.restrictChatMember(chatId, userId, {
      can_send_messages: true,
      can_send_audios: true,
      can_send_documents: true,
      can_send_photos: true,
      can_send_videos: true,
      can_send_video_notes: true,
      can_send_voice_notes: true,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
    });
    return true;
  } catch (e) {
    error("[punishments] unmute error", e);
    return false;
  }
}

/**
 * Kick user (unban so they can rejoin).
 */
export async function kickUser(
  api: Api,
  chatId: number,
  userId: number
): Promise<boolean> {
  try {
    await api.banChatMember(chatId, userId);
    await api.unbanChatMember(chatId, userId);
    return true;
  } catch (e) {
    error("[punishments] kick error", e);
    return false;
  }
}
