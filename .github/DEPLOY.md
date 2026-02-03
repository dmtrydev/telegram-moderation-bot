# Деплой на GitHub

## ✅ Уже выполнено

- ✅ Git установлен и настроен
- ✅ Репозиторий инициализирован
- ✅ Первый коммит создан: `996550d`
- ✅ Ветка переименована в `main`
- ✅ GitHub CLI установлен

## 📋 Что осталось сделать

### Вариант 1: Через GitHub CLI (рекомендуется)

1. **Авторизуйся в GitHub:**
   ```bash
   gh auth login
   ```
   - Выбери `GitHub.com`
   - Выбери `HTTPS` или `SSH`
   - Следуй инструкциям (откроется браузер для авторизации)

2. **Создай репозиторий и запушь:**
   ```bash
   cd d:\work\dmtryxyz\telegram-moderation-bot
   gh repo create telegram-moderation-bot --public --source=. --remote=origin --push
   ```
   
   Или если репозиторий уже создан на GitHub:
   ```bash
   git remote add origin https://github.com/dmtrydev/telegram-moderation-bot.git
   git push -u origin main
   ```

### Вариант 2: Вручную через веб-интерфейс

1. **Создай репозиторий на GitHub:**
   - Зайди на https://github.com/new
   - Имя: `telegram-moderation-bot`
   - Описание: "Telegram moderation bot with captcha, antiflood and filters"
   - Выбери `Public` или `Private`
   - **НЕ** добавляй README, .gitignore, LICENSE (уже есть локально)
   - Нажми `Create repository`

2. **Подключи remote и запушь:**
   ```bash
   cd d:\work\dmtryxyz\telegram-moderation-bot
   git remote add origin https://github.com/dmtrydev/telegram-moderation-bot.git
   git push -u origin main
   ```

### 3. Создать Issues для roadmap

После пуша зайди в репозиторий на GitHub → **Issues** → **New issue**:

**Issue #1:**
- Title: `Add punishment escalation system`
- Description: Реализовать систему эскалации наказаний (например, 3 страйка → бан)

**Issue #2:**
- Title: `Implement logging to separate channel`
- Description: Расширить систему логирования для отправки в отдельный канал/чат

**Issue #3:**
- Title: `Add moderation statistics`
- Description: Добавить статистику действий модерации (муты, кики, удаления сообщений)

## 🎉 Готово!

После выполнения всех шагов проект будет доступен на GitHub и готов к контрибьютам.
