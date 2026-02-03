# Telegram Moderation Bot

> Open-source модерационный бот для Telegram групп с антиспамом, капчей и системой наказаний  
> Open-source moderation bot for Telegram groups with anti-spam, captcha, and punishment system

[English](#english) | [Русский](#русский)

---

## English

### 🚧 Status: Work in Progress

#### ✅ Implemented:
- [x] Captcha for new members (button "I'm not a bot")
- [x] Antiflood system (5 messages in 10 seconds)
- [x] Link filter (http/https/t.me/@username)
- [x] Stopwords system
- [x] Basic moderation commands
- [x] Logs to separate chat (LOG_CHAT_ID)

#### 🔄 In Progress:
- [ ] Punishment escalation system

#### 📋 Planned:
- [ ] Moderation statistics
- [ ] Channel comments support
- [ ] Multi-language support
- [ ] Web dashboard

### Features

- 🛡️ **Captcha** — automatic verification of new members
- 🚫 **Antiflood** — spam message blocking
- 🔗 **Link Filter** — removal of unwanted URLs
- 📝 **Stopwords** — filtering of forbidden words
- ⚡ **Quick Commands** — management via chat
- 🔐 **Permission System** — admin-only
- 📋 **Telegram Logs** — event duplication to specified chat

### Quick Start

#### Installation

```bash
git clone https://github.com/dmtrydev/telegram-moderation-bot.git
cd telegram-moderation-bot
npm install
```

#### Configuration

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Copy `.env.example` to `.env`
3. Add your `BOT_TOKEN` to `.env`

```bash
cp .env.example .env
# Edit .env
```

#### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Commands

#### For Everyone
- `/start` — Welcome message
- `/help` — Command list

#### For Admins
**Stopwords:**
- `/addword <word>` — Add forbidden word
- `/removeword <word>` — Remove from list
- `/listwords` — Show all stopwords

**Settings:**
- `/settings` — Current chat settings
- `/captcha on|off` — Enable/disable captcha
- `/links on|off` — Enable/disable link filter

**Moderation** (reply to user's message):
- `/mute 10m` — Mute for 10 minutes (also: 1h, 1d)
- `/unmute` — Unmute
- `/kick` — Kick from chat

### How to Setup Bot in Group

1. Add bot to group
2. Make it administrator with permissions:
   - **Delete messages**
   - **Restrict members**
   - **Add members** (for kick)
3. Configure filters with commands

### Configuration

Environment variables (`.env`):

| Variable   | Description |
|------------|-------------|
| `BOT_TOKEN` | Token from @BotFather (required) |
| `NODE_ENV`  | `development` or `production` |
| `LOG_CHAT_ID` | Optional: Chat ID for logs (get ID: @userinfobot, then write /start to bot in private chat) |

Chat settings are stored in `data/chats.json` (created automatically):

```json
{
  "chats": {
    "-1001234567890": {
      "chatId": -1001234567890,
      "captchaEnabled": true,
      "linksFilterEnabled": true,
      "updatedAt": 1234567890
    }
  }
}
```

Stopwords — in `data/stopwords.json`. Structure examples: `data/chats.example.json`, `data/stopwords.example.json`.

### Docker

```bash
# Build
docker build -t telegram-moderation-bot .

# Run (with data persistence on host)
docker run -d --env-file .env -v $(pwd)/data:/app/data telegram-moderation-bot
```

### Tech Stack

- **Runtime:** Node.js 20
- **Language:** TypeScript
- **Framework:** grammY
- **Storage:** JSON files (Redis/PostgreSQL planned)

### Development

```bash
npm run dev     # Run in dev mode (tsx watch)
npm run build   # Compile TypeScript
```

### Roadmap

- [ ] Punishment escalation (3 strikes → ban)
- [ ] Action logs to separate channel (partially: LOG_CHAT_ID)
- [ ] Channel comments support
- [ ] Moderation statistics
- [ ] Database instead of JSON
- [ ] Admin panel

### Contributing

Pull requests welcome! For major changes, please open an issue first.

### License

MIT

### Author

[Дмитрий](https://github.com/dmtrydev)

---

## Русский

### 🚧 Статус: В разработке

#### ✅ Реализовано:
- [x] Капча для новых участников (кнопка "Я не бот")
- [x] Антифлуд система (5 сообщений за 10 секунд)
- [x] Фильтр ссылок (http/https/t.me/@username)
- [x] Стоп-слова система
- [x] Базовые команды модерации
- [x] Логи в отдельный чат (LOG_CHAT_ID)

#### 🔄 В процессе:
- [ ] Система эскалации наказаний

#### 📋 Запланировано:
- [ ] Статистика модерации
- [ ] Поддержка комментариев к каналам
- [ ] Мультиязычность
- [ ] Web dashboard

### Возможности

- 🛡️ **Капча** — автоматическая проверка новых участников
- 🚫 **Антифлуд** — блокировка спама сообщениями
- 🔗 **Фильтр ссылок** — удаление нежелательных URL
- 📝 **Стоп-слова** — фильтрация запрещённых слов
- ⚡ **Быстрые команды** — управление через чат
- 🔐 **Система прав** — только для админов
- 📋 **Логи в Telegram** — дублирование событий в указанный чат

### Быстрый старт

#### Установка

```bash
git clone https://github.com/dmtrydev/telegram-moderation-bot.git
cd telegram-moderation-bot
npm install
```

#### Настройка

1. Создай бота через [@BotFather](https://t.me/BotFather)
2. Скопируй `.env.example` в `.env`
3. Добавь свой `BOT_TOKEN` в `.env`

```bash
cp .env.example .env
# Отредактируй .env
```

#### Запуск

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Команды

#### Для всех
- `/start` — Приветствие
- `/help` — Список команд

#### Для админов
**Стоп-слова:**
- `/addword <слово>` — Добавить запрещённое слово
- `/removeword <слово>` — Удалить из списка
- `/listwords` — Показать все стоп-слова

**Настройки:**
- `/settings` — Текущие настройки чата
- `/captcha on|off` — Включить/выключить капчу
- `/links on|off` — Включить/выключить фильтр ссылок

**Модерация** (ответь на сообщение пользователя):
- `/mute 10m` — Замутить на 10 минут (также: 1h, 1d)
- `/unmute` — Размутить
- `/kick` — Кикнуть из чата

### Как настроить бота в группе

1. Добавь бота в группу
2. Сделай его администратором с правами:
   - **Удалять сообщения**
   - **Ограничивать участников**
   - **Добавлять участников** (для кика)
3. Настрой фильтры командами

### Конфигурация

Переменные окружения (`.env`):

| Переменная   | Описание |
|-------------|-----------|
| `BOT_TOKEN` | Токен от @BotFather (обязательно) |
| `NODE_ENV`  | `development` или `production` |
| `LOG_CHAT_ID` | Опционально: ID чата для логов (узнать: @userinfobot, затем написать боту /start в личку) |

Настройки чатов хранятся в `data/chats.json` (создаётся автоматически):

```json
{
  "chats": {
    "-1001234567890": {
      "chatId": -1001234567890,
      "captchaEnabled": true,
      "linksFilterEnabled": true,
      "updatedAt": 1234567890
    }
  }
}
```

Стоп-слова — в `data/stopwords.json`. Примеры структуры: `data/chats.example.json`, `data/stopwords.example.json`.

### Docker

```bash
# Build
docker build -t telegram-moderation-bot .

# Run (с сохранением data на хосте)
docker run -d --env-file .env -v $(pwd)/data:/app/data telegram-moderation-bot
```

### Технологии

- **Runtime:** Node.js 20
- **Language:** TypeScript
- **Framework:** grammY
- **Storage:** JSON files (планируется Redis/PostgreSQL)

### Разработка

```bash
npm run dev     # Запуск в dev режиме (tsx watch)
npm run build   # Компиляция TypeScript
```

### Roadmap

- [ ] Эскалация наказаний (3 страйка → бан)
- [ ] Логи действий в отдельный канал (частично: LOG_CHAT_ID)
- [ ] Поддержка комментариев к каналам
- [ ] Статистика модерации
- [ ] База данных вместо JSON
- [ ] Admin панель

### Участие в разработке

Pull requests приветствуются! Для крупных изменений создавай issue.

### Лицензия

MIT

### Автор

[Дмитрий](https://github.com/dmtrydev)

---

⭐ Если проект полезен — поставь звезду!
