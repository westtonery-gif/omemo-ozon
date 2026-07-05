# Ozonologist

AI-ассистент для продавцов Ozon: чат уровня ChatGPT, который получает реальные данные
магазина через Ozon Seller API и анализирует их с помощью GPT.

> 📌 Полное состояние проекта, архитектура, что сделано и что осталось —
> в [PROGRESS.md](./PROGRESS.md). Читай его первым при продолжении работы.

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # затем впиши ключи в .env.local
npm run dev                  # → http://localhost:3000
```

### Ключи (.env.local)

- `OPENAI_API_KEY` — обязателен (чтобы чат отвечал).
- `OZON_CLIENT_ID`, `OZON_API_KEY` — для реальных данных магазина.
  Без них приложение работает на **мок-данных** (тестовый магазин) — код тот же.

Подробности по переменным — в [.env.example](./.env.example).

## Как это работает

Браузер → API-роут `/api/agent-chat` → OpenAI (tool calling) → инструменты Ozon
(`get_products`, `get_sales_summary`) → GPT анализирует данные → ответ в чат.

GPT не выдумывает цифры: если нужны данные магазина — он вызывает инструмент.

## Полезные команды

```bash
npm run dev        # дев-сервер
npm run build      # прод-сборка
npm run test:ozon  # проверить подключение к Ozon API
```
