import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import OpenAI from "openai";
import { OZONOLOGIST_PROMPT } from "../agents/ozonologist";

dotenv.config({ path: ".env.local" });

console.log("OPENAI =", process.env.OPENAI_API_KEY);
console.log("TG =", process.env.TELEGRAM_BOT_TOKEN);

const bot = new Telegraf(
  process.env.TELEGRAM_BOT_TOKEN!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

bot.start((ctx) => {
  ctx.reply(
    "Привет 👋 Я Ozonologist. Помогу анализировать продажи и управлять магазином Ozon."
  );
});

bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.5",
    messages: [
      {
        role: "system",
        content: OZONOLOGIST_PROMPT,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  await ctx.reply(
    completion.choices[0].message.content ||
      "Не смог ответить"
  );
});

bot.launch();

console.log("🤖 Ozonologist Telegram bot запущен");