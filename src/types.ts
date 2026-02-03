/**
 * Chat settings stored per chat (chats.json)
 */
export interface ChatSettings {
  chatId: number;
  captchaEnabled: boolean;
  linksFilterEnabled: boolean;
  /** Unix timestamp when settings were last updated */
  updatedAt: number;
}

/**
 * Structure of data/chats.json
 */
export interface ChatsData {
  chats: Record<string, ChatSettings>;
}

/**
 * Structure of data/stopwords.json
 */
export interface StopwordsData {
  words: string[];
}

/**
 * Default settings for a new chat
 */
export const DEFAULT_CHAT_SETTINGS: Omit<ChatSettings, "chatId" | "updatedAt"> = {
  captchaEnabled: true,
  linksFilterEnabled: true,
};
