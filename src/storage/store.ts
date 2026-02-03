import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { ChatsData, ChatSettings } from "../types.js";
import type { StopwordsData } from "../types.js";
import { DEFAULT_CHAT_SETTINGS } from "../types.js";

const DATA_DIR = join(process.cwd(), "data");
const CHATS_PATH = join(DATA_DIR, "chats.json");
const STOPWORDS_PATH = join(DATA_DIR, "stopwords.json");

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await ensureDataDir();
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

/** Get or create chat settings */
export async function getChatSettings(chatId: number): Promise<ChatSettings> {
  const data = await readJson<ChatsData>(CHATS_PATH, { chats: {} });
  const key = String(chatId);
  const existing = data.chats[key];
  if (existing) return existing;
  const settings: ChatSettings = {
    chatId,
    ...DEFAULT_CHAT_SETTINGS,
    updatedAt: Math.floor(Date.now() / 1000),
  };
  data.chats[key] = settings;
  await writeJson(CHATS_PATH, data);
  return settings;
}

/** Update chat settings */
export async function updateChatSettings(
  chatId: number,
  patch: Partial<Pick<ChatSettings, "captchaEnabled" | "linksFilterEnabled">>
): Promise<ChatSettings> {
  const data = await readJson<ChatsData>(CHATS_PATH, { chats: {} });
  const key = String(chatId);
  const current = data.chats[key] ?? {
    chatId,
    ...DEFAULT_CHAT_SETTINGS,
    updatedAt: Math.floor(Date.now() / 1000),
  };
  const updated: ChatSettings = {
    ...current,
    ...patch,
    updatedAt: Math.floor(Date.now() / 1000),
  };
  data.chats[key] = updated;
  await writeJson(CHATS_PATH, data);
  return updated;
}

function normalizeWord(w: string): string {
  return w.trim().normalize("NFC");
}

/** Get all stopwords */
export async function getStopwords(): Promise<string[]> {
  const data = await readJson<StopwordsData>(STOPWORDS_PATH, { words: [] });
  return data.words ?? [];
}

/** Add stopword (case-insensitive, deduplicated) */
export async function addStopword(word: string): Promise<boolean> {
  const data = await readJson<StopwordsData>(STOPWORDS_PATH, { words: [] });
  const words = data.words ?? [];
  const normalized = normalizeWord(word);
  const lower = normalized.toLowerCase();
  if (!lower) return false;
  if (words.some((w) => normalizeWord(w).toLowerCase() === lower)) return false;
  words.push(normalized);
  data.words = words;
  await writeJson(STOPWORDS_PATH, data);
  return true;
}

/** Remove stopword (case-insensitive) */
export async function removeStopword(word: string): Promise<boolean> {
  const data = await readJson<StopwordsData>(STOPWORDS_PATH, { words: [] });
  const words = data.words ?? [];
  const lower = normalizeWord(word).toLowerCase();
  if (!lower) return false;
  const filtered = words.filter((w) => normalizeWord(w).toLowerCase() !== lower);
  if (filtered.length === words.length) return false;
  data.words = filtered;
  await writeJson(STOPWORDS_PATH, data);
  return true;
}
