import { Bot } from "grammy";
import { config } from "./config.js";
import { setLogChat, log, error } from "./logger.js";
import { setupNewMembers } from "./handlers/newMembers.js";
import { setupMessages } from "./handlers/messages.js";

const bot = new Bot(config.BOT_TOKEN);

// Register handlers
setupNewMembers(bot);
setupMessages(bot);

// Global error handler
bot.catch((err) => {
  error("[bot] Error:", err);
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  log(`[bot] ${signal} received, stopping...`);
  await bot.stop();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

async function main(): Promise<void> {
  try {
    const me = await bot.api.getMe();
    if (config.LOG_CHAT_ID != null && !Number.isNaN(config.LOG_CHAT_ID)) {
      setLogChat(bot.api, config.LOG_CHAT_ID);
      try {
        await bot.api.sendMessage(config.LOG_CHAT_ID, "📋 Логи бота подключены. События будут дублироваться сюда.");
      } catch {
        console.warn("[bot] Could not send test message to LOG_CHAT_ID — проверьте, что вы писали боту /start в личку и ID верный.");
      }
      console.log(`[bot] Logs: console + Telegram (chat ${config.LOG_CHAT_ID})`);
    } else {
      console.log("[bot] Logs: только консоль. Чтобы получать логи в Telegram, добавьте в .env: LOG_CHAT_ID=ваш_id (узнать ID: @userinfobot, затем напишите боту /start в личку).");
    }
    log(`[bot] Started as @${me.username}`);
    await bot.start({ allowed_updates: ["message", "chat_member", "callback_query"] });
  } catch (e) {
    error("[bot] Failed to start:", e);
    process.exit(1);
  }
}

main();
