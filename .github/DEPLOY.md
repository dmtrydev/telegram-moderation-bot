# Деплой на GitHub

## После клонирования / подготовка к первому пушу

### 1. Инициализация и первый коммит

```bash
git init
git add .
git commit -m "Initial commit: Basic moderation bot with captcha, antiflood and filters"
```

### 2. Создать репозиторий на GitHub

- Зайди на https://github.com/new
- Имя: `telegram-moderation-bot`
- Не добавляй README, .gitignore, LICENSE (уже есть локально)

### 3. Подключить remote и запушить

```bash
git remote add origin https://github.com/yourusername/telegram-moderation-bot.git
git branch -M main
git push -u origin main
```

Замени `yourusername` на свой GitHub username.

### 4. Создать Issues для roadmap

В репозитории: **Issues** → **New issue**:

- **#1:** Title: `Add punishment escalation system` — описание: система эскалации (например, 3 страйка → бан).
- **#2:** Title: `Implement logging to separate channel` — описание: расширить логирование в отдельный канал/чат.
- **#3:** Title: `Add moderation statistics` — описание: статистика действий модерации (муты, кики, удаления).

После этого проект готов к публикации и контрибьютам.
