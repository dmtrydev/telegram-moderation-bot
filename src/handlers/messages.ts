import type { Bot, Context } from "grammy";
import { getChatSettings, getStopwords, addStopword, removeStopword, updateChatSettings } from "../storage/store.js";
import { isPendingCaptcha } from "../services/captcha.js";
import { log, error } from "../logger.js";
import {
  recordMessage,
  clearUser,
  ANTIFLOOD_MAX_MESSAGES,
  ANTIFLOOD_WINDOW_SEC,
} from "../services/antiflood.js";
import { hasLinks, hasStopword } from "../services/filters.js";
import {
  muteUser,
  unmuteUser,
  kickUser,
  parseMuteDuration,
  MUTE_DURATION_ANTIFLOOD_SEC,
} from "../services/punishments.js";

type ChatMemberStatus = "creator" | "administrator" | "member" | "restricted" | "left" | "kicked";

async function isAdmin(api: Context["api"], chatId: number, userId: number): Promise<boolean> {
  try {
    const member = await api.getChatMember(chatId, userId);
    const status = member.status as ChatMemberStatus;
    return status === "creator" || status === "administrator";
  } catch {
    return false;
  }
}

async function isBotAdmin(api: Context["api"], chatId: number): Promise<boolean> {
  try {
    const me = await api.getChatMember(chatId, (await api.getMe()).id);
    const status = me.status as ChatMemberStatus;
    return status === "creator" || status === "administrator";
  } catch {
    return false;
  }
}

/** Middleware: only admins; replies with error and skips next if not admin */
async function adminOnly(ctx: Context, next: () => Promise<void>): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    await next();
    return;
  }
  if (ctx.chat?.type === "private") {
    await ctx.reply("Эта команда доступна только в группах.");
    return;
  }
  // Message sent "on behalf of the group" (anonymous admin) — only admins can do that
  const senderChatId = ctx.message?.sender_chat?.id;
  if (senderChatId === chatId) {
    await next();
    return;
  }
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Только администраторы могут использовать эту команду.");
    return;
  }
  const admin = await isAdmin(ctx.api, chatId, userId);
  if (!admin) {
    await ctx.reply("Только администраторы могут использовать эту команду.");
    return;
  }
  await next();
}

export function setupMessages(bot: Bot): void {
  // Delete join/leave service messages
  bot.on("message", async (ctx, next) => {
    const msg = ctx.message;
    const hasJoin = msg.new_chat_members && msg.new_chat_members.length > 0;
    const hasLeave = !!msg.left_chat_member;
    if (hasJoin || hasLeave) {
      try {
        await ctx.deleteMessage();
      } catch {
        // ignore
      }
    }
    await next();
  });

  // ----- Text message: captcha check, antiflood, links, stopwords -----
  bot.on("message:text", async (ctx, next) => {
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;
    const text = ctx.message.text ?? "";

    if (!chatId || !userId) {
      await next();
      return;
    }

    // If user is in captcha, delete any message from them until they pass
    if (isPendingCaptcha(chatId, userId)) {
      try {
        await ctx.deleteMessage();
      } catch {
        // ignore
      }
      return;
    }

    const settings = await getChatSettings(chatId);

    // Antiflood
    const isFlood = recordMessage(chatId, userId);
    if (isFlood) {
      clearUser(chatId, userId);
      const botAdmin = await isBotAdmin(ctx.api, chatId);
      if (botAdmin) {
        const untilDate = Math.floor(Date.now() / 1000) + MUTE_DURATION_ANTIFLOOD_SEC;
        const muted = await muteUser(ctx.api, chatId, userId, untilDate);
        if (muted) {
          try {
            await ctx.deleteMessage();
          } catch {
            // ignore
          }
          await ctx.reply(
            `Флуд обнаружен (${ANTIFLOOD_MAX_MESSAGES} сообщений за ${ANTIFLOOD_WINDOW_SEC} сек). Пользователь ограничен на 10 минут.`
          );
          log(`[antiflood] User ${userId} muted in chat ${chatId}`);
        }
      }
      return;
    }

    // Links filter
    if (settings.linksFilterEnabled && hasLinks(text)) {
      const botAdmin = await isBotAdmin(ctx.api, chatId);
      if (botAdmin) {
        try {
          await ctx.deleteMessage();
          log(`[filters] Deleted link message from ${userId} in chat ${chatId}`);
        } catch (e) {
          error("[filters] delete message error", e);
        }
      }
      return;
    }

    // Stopwords
    const stopwords = await getStopwords();
    if (stopwords.length > 0 && hasStopword(text, stopwords)) {
      const botAdmin = await isBotAdmin(ctx.api, chatId);
      if (botAdmin) {
        try {
          await ctx.deleteMessage();
          log(`[filters] Deleted stopword message from ${userId} in chat ${chatId}`);
        } catch (e) {
          error("[filters] delete message error", e);
        }
      }
      return;
    }

    await next();
  });

  // ----- Admin commands -----
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Привет! Я бот модерации. Добавь меня в группу и выдай права администратора.\n\nКоманды: /help"
    );
  });

  bot.command("help", async (ctx) => {
    const isPrivate = ctx.chat?.type === "private";
    const text = isPrivate
      ? "Команды доступны в группах. Добавь меня в группу и используй /help там."
      : `Список команд (только для админов):\n` +
        `/addword <слово> — добавить стоп-слово\n` +
        `/removeword <слово> — удалить стоп-слово\n` +
        `/listwords — показать стоп-слова\n` +
        `/settings — настройки чата\n` +
        `/captcha on|off — капча для новых\n` +
        `/links on|off — фильтр ссылок\n` +
        `/mute 10m — мут (ответ на сообщение; 10m, 1h, 1d)\n` +
        `/unmute — снять мут (ответ на сообщение)\n` +
        `/kick — кик (ответ на сообщение)`;
    await ctx.reply(text);
  });

  bot.command("addword", adminOnly, async (ctx) => {
    const word = (ctx.message?.text ?? "").replace(/^\/addword(?:@\w+)?\s*/i, "").trim();
    if (!word) {
      await ctx.reply("Использование: /addword <слово>");
      return;
    }
    const added = await addStopword(word);
    await ctx.reply(added ? `Стоп-слово «${word}» добавлено.` : `Слово «${word}» уже в списке или пустое.`);
    if (added) log(`[cmd] addword "${word}" by ${ctx.from?.id} in ${ctx.chat?.id}`);
  });

  bot.command("removeword", adminOnly, async (ctx) => {
    const word = (ctx.message?.text ?? "").replace(/^\/removeword(?:@\w+)?\s*/i, "").trim();
    if (!word) {
      await ctx.reply("Использование: /removeword <слово>");
      return;
    }
    const removed = await removeStopword(word);
    if (removed) {
      const list = await getStopwords();
      const listText = list.length === 0 ? "Список пуст." : list.slice(0, 15).join(", ") + (list.length > 15 ? ` … (всего ${list.length})` : "");
      await ctx.reply(`Стоп-слово «${word}» удалено. Осталось: ${listText}`);
      log(`[cmd] removeword "${word}" by ${ctx.from?.id} in ${ctx.chat?.id}`);
    } else {
      await ctx.reply(`Слова «${word}» нет в списке. Текущие: /listwords`);
    }
  });

  bot.command("listwords", adminOnly, async (ctx) => {
    const words = await getStopwords();
    if (words.length === 0) {
      await ctx.reply("Список стоп-слов пуст.");
      return;
    }
    const list = words.slice(0, 50).join(", ") + (words.length > 50 ? ` ... (всего ${words.length})` : "");
    await ctx.reply(`Стоп-слова: ${list}`);
  });

  bot.command("settings", adminOnly, async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const settings = await getChatSettings(chatId);
    await ctx.reply(
      `Настройки чата:\n` +
        `Капча для новых: ${settings.captchaEnabled ? "вкл" : "выкл"}\n` +
        `Фильтр ссылок: ${settings.linksFilterEnabled ? "вкл" : "выкл"}\n` +
        `Команды: /captcha on|off, /links on|off`
    );
  });

  bot.command("captcha", adminOnly, async (ctx) => {
    const arg = ctx.message?.text?.replace(/^\/captcha\s*/i, "").trim().toLowerCase();
    if (arg !== "on" && arg !== "off") {
      await ctx.reply("Использование: /captcha on или /captcha off");
      return;
    }
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await updateChatSettings(chatId, { captchaEnabled: arg === "on" });
    await ctx.reply(`Капча для новых участников: ${arg === "on" ? "включена" : "выключена"}.`);
    log(`[cmd] captcha ${arg} by ${ctx.from?.id} in ${chatId}`);
  });

  bot.command("links", adminOnly, async (ctx) => {
    const arg = ctx.message?.text?.replace(/^\/links\s*/i, "").trim().toLowerCase();
    if (arg !== "on" && arg !== "off") {
      await ctx.reply("Использование: /links on или /links off");
      return;
    }
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await updateChatSettings(chatId, { linksFilterEnabled: arg === "on" });
    await ctx.reply(`Фильтр ссылок: ${arg === "on" ? "включён" : "выключен"}.`);
    log(`[cmd] links ${arg} by ${ctx.from?.id} in ${chatId}`);
  });

  bot.command("mute", adminOnly, async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const replyFrom = ctx.message?.reply_to_message?.from;
    const userId = replyFrom?.id;
    if (!userId) {
      await ctx.reply("Ответьте на сообщение пользователя и введите /mute 10m (или 1h, 1d).");
      return;
    }
    const text = ctx.message?.text?.replace(/^\/mute\s*/i, "").trim() ?? "";
    const durationStr = text.split(/\s+/)[0] || "10m";
    const durationSec = parseMuteDuration(durationStr);
    if (durationSec === null) {
      await ctx.reply("Неверный формат времени. Примеры: 10m, 1h, 1d");
      return;
    }
    const botAdmin = await isBotAdmin(ctx.api, chatId);
    if (!botAdmin) {
      await ctx.reply("Мне нужны права администратора для мута.");
      return;
    }
    const untilDate = Math.floor(Date.now() / 1000) + durationSec;
    const ok = await muteUser(ctx.api, chatId, userId, untilDate);
    if (ok) {
      await ctx.reply(`Пользователь ограничен на ${durationStr}.`);
      log(`[cmd] mute ${userId} ${durationStr} by ${ctx.from?.id} in ${chatId}`);
    } else {
      await ctx.reply("Не удалось ограничить пользователя (права или он админ).");
    }
  });

  bot.command("unmute", adminOnly, async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const userId = ctx.message?.reply_to_message?.from?.id;
    if (!userId) {
      await ctx.reply("Ответьте на сообщение пользователя командой /unmute");
      return;
    }
    const botAdmin = await isBotAdmin(ctx.api, chatId);
    if (!botAdmin) {
      await ctx.reply("Мне нужны права администратора.");
      return;
    }
    const ok = await unmuteUser(ctx.api, chatId, userId);
    await ctx.reply(ok ? "Ограничения сняты." : "Не удалось снять ограничения.");
    if (ok) log(`[cmd] unmute ${userId} by ${ctx.from?.id} in ${chatId}`);
  });

  bot.command("kick", adminOnly, async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const userId = ctx.message?.reply_to_message?.from?.id;
    if (!userId) {
      await ctx.reply("Ответьте на сообщение пользователя командой /kick");
      return;
    }
    const botAdmin = await isBotAdmin(ctx.api, chatId);
    if (!botAdmin) {
      await ctx.reply("Мне нужны права администратора для кика.");
      return;
    }
    const ok = await kickUser(ctx.api, chatId, userId);
    await ctx.reply(ok ? "Пользователь исключён из чата." : "Не удалось исключить (права или он админ).");
    if (ok) log(`[cmd] kick ${userId} by ${ctx.from?.id} in ${chatId}`);
  });
}
