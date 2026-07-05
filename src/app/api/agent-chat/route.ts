import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { NextRequest, NextResponse } from "next/server";
import { OZONOLOGIST_PROMPT } from "../../../agents/ozonologist";
import { tools, runTool } from "../../../agents/tools";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TOOL_ROUNDS = 5;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: OZONOLOGIST_PROMPT },
      { role: "user", content: message },
    ];

    // Цикл tool calling: GPT может несколько раз запросить данные,
    // прежде чем сформировать финальный ответ.
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-5.5",
        messages,
        tools,
        tool_choice: "auto",
      });

      const choice = completion.choices[0].message;
      messages.push(choice);

      const toolCalls = choice.tool_calls ?? [];
      if (toolCalls.length === 0) {
        return NextResponse.json({ response: choice.content ?? "" });
      }

      // Выполняем все запрошенные инструменты и возвращаем результаты модели.
      for (const call of toolCalls) {
        if (call.type !== "function") continue;
        const result = await runTool(call.function.name);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result,
        });
      }
    }

    return NextResponse.json(
      { error: "Превышен лимит обращений к инструментам" },
      { status: 500 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Ошибка Ozonologist" }, { status: 500 });
  }
}
