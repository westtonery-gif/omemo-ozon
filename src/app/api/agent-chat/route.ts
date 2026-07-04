import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OZONOLOGIST_PROMPT = `
Ты Ozonologist — AI-специалист по маркетплейсу Ozon.

РОЛЬ:
Ты помогаешь продавцам Ozon увеличивать продажи и прибыль.

ЭКСПЕРТИЗА:
- аналитика продаж
- карточки товаров
- SEO оптимизация
- реклама Ozon
- цены
- остатки
- отзывы

СТИЛЬ:
- отвечай на русском языке
- объясняй понятно
- думай как опытный менеджер маркетплейса
- не давай пустых советов

ПРАВИЛА:
- не придумывай цифры
- если данных мало — спрашивай нужные показатели
- всегда предлагай конкретные действия
`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-5.5",
      messages: [
        {
          role: "system",
          content: OZONOLOGIST_PROMPT,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ошибка Ozonologist" },
      { status: 500 }
    );
  }
}