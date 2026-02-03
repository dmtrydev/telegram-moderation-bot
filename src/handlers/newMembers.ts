import type { Bot } from "grammy";
import { getChatSettings } from "../storage/store.js";
import { log, error, warn } from "../logger.js";
import {
  registerCaptcha,
  resolveCaptcha,
  isPendingCaptcha,
  CAPTCHA_CALLBACK_DATA,
  CAPTCHA_TIMEOUT_SEC,
} from "../services/captcha.js";
import { muteUser, unmuteUser, kickUser } from "../services/punishments.js";

const CAPTCHA_BUTTON = "Я не бот";

export function setupNewMembers(bot: Bot): void {
  // New chat member: mute + captcha message
  bot.on("chat_member", async (ctx, next) => {
    const update = ctx.chatMember;
    if (!update) {
      await next();
      return;
    }
    const status = update.new_chat_member.status;
    const chatId = ctx.chat?.id;
    const userId = update.new_chat_member.user.id;
    const isJoin = status === "member" || status === "administrator" || status === "restricted";

    if (!chatId || !isJoin) {
      await next();
      return;
    }

    const settings = await getChatSettings(chatId);
    if (!settings.captchaEnabled) {
      await next();
      return;
    }

    // Mute new member
    const untilDate = Math.floor(Date.now() / 1000) + CAPTCHA_TIMEOUT_SEC + 60;
    const muted = await muteUser(ctx.api, chatId, userId, untilDate);
    if (!muted) {
      warn(`[newMembers] Failed to mute user ${userId} in ${chatId}`);
      await next();
      return;
    }

    const sent = await ctx.reply(
      `Привет, ${update.new_chat_member.user.first_name ?? "пользователь"}! Нажми кнопку ниже, чтобы подтвердить, что ты не бот. У тебя ${CAPTCHA_TIMEOUT_SEC} сек.`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: CAPTCHA_BUTTON, callback_data: `${CAPTCHA_CALLBACK_DATA}:${userId}` }]],
        },
      }
    );

    registerCaptcha(bot, chatId, userId, async (cId, uId) => {
      try {
        await kickUser(ctx.api, cId, uId);
        if (sent?.message_id) {
          await ctx.api.deleteMessage(cId, sent.message_id);
        }
      } catch (e) {
        error("[newMembers] onKick/delete error", e);
      }
    });

    await next();
  });

  // Callback: captcha button
  bot.callbackQuery(new RegExp(`^${CAPTCHA_CALLBACK_DATA}:(-?\\d+)$`), async (ctx) => {
    const payload = ctx.match[1];
    const targetUserId = parseInt(payload, 10);
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;

    if (!chatId || !userId) return;
    if (userId !== targetUserId) {
      await ctx.answerCallbackQuery({ text: "Эта кнопка не для тебя." });
      return;
    }
    if (!isPendingCaptcha(chatId, userId)) {
      await ctx.answerCallbackQuery({ text: "Капча уже пройдена или истекла." });
      return;
    }

    resolveCaptcha(chatId, userId);
    const ok = await unmuteUser(ctx.api, chatId, userId);
    if (ok) {
      await ctx.answerCallbackQuery({ text: "Добро пожаловать!" });
      const msg = ctx.callbackQuery.message;
      if (msg && "message_id" in msg) {
        await ctx.api.deleteMessage(chatId, msg.message_id);
      }
      log(`[newMembers] User ${userId} passed captcha in chat ${chatId}`);
    } else {
      await ctx.answerCallbackQuery({ text: "Ошибка снятия ограничений. Обратитесь к админам." });
    }
  });
}
