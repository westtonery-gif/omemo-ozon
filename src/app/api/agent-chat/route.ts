import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import { NextRequest } from "next/server";
import { OZONOLOGIST_PROMPT } from "../../../agents/ozonologist";
import { tools, runTool } from "../../../agents/tools";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TOOL_ROUNDS = 5;

// Ограничиваем длину истории, чтобы не раздувать запрос к модели.
const MAX_HISTORY = 20;

type ClientMessage = { role: "user" | "assistant"; content: string };

// Аккумулятор одного tool call, собираемого из потоковых дельт.
interface ToolCallAcc {
  id: string;
  name: string;
  args: string;
}

// Понятное сообщение по ошибке OpenAI. Настоящая причина логируется в консоль,
// а пользователю показываем конкретику (регион/лимит/сеть), а не общее «проверьте ключ».
function openAiErrorMessage(error: unknown): string {
  const e = error as {
    status?: number;
    code?: string;
    error?: { code?: string };
    message?: string;
  };
  const status = e?.status;
  const code = e?.code ?? e?.error?.code;

  if (status === 401) {
    return "⚠️ OpenAI отклонил ключ. Проверьте OPENAI_API_KEY в `.env.local`.";
  }
  if (code === "unsupported_country_region_territory" || status === 403) {
    return "⚠️ OpenAI заблокировал запрос по региону — похоже, VPN/прокси отвалился. Проверьте, что VPN включён, и перезапустите с `NODE_USE_ENV_PROXY=1`.";
  }
  if (status === 429) {
    return "⚠️ OpenAI: слишком много запросов (429). Подождите немного и повторите.";
  }
  const msg = String(e?.message ?? "");
  if (/timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|socket|network|fetch failed/i.test(msg)) {
    return "⚠️ Не удалось соединиться с OpenAI (сеть или прокси). Проверьте VPN и повторите.";
  }
  return "⚠️ Не удалось получить ответ от OpenAI. Повторите попытку.";
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Принимаем всю историю диалога (messages[]), чтобы модель помнила контекст.
  // Для обратной совместимости поддерживаем и одиночное поле message.
  const history: ClientMessage[] = Array.isArray(body.messages)
    ? body.messages
    : body.message
      ? [{ role: "user", content: String(body.message) }]
      : [];

  const trimmed = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-MAX_HISTORY);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: OZONOLOGIST_PROMPT },
  ];
  for (const m of trimmed) {
    // Явное сужение роли — иначе union не подходит под ChatCompletionMessageParam.
    if (m.role === "user") {
      messages.push({ role: "user", content: m.content });
    } else {
      messages.push({ role: "assistant", content: m.content });
    }
  }

  const encoder = new TextEncoder();

  // Отдаём ответ потоком: текст финального ответа стримится по мере генерации,
  // а раунды с вызовом инструментов проходят «под капотом» (текст не шлём).
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let streamedContent = false;
      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const completion = await openai.chat.completions.create({
            model: "gpt-5.5",
            messages,
            tools,
            tool_choice: "auto",
            stream: true,
          });

          const toolAcc: Record<number, ToolCallAcc> = {};
          let content = "";

          for await (const chunk of completion) {
            const choice = chunk.choices[0];
            if (!choice) continue;
            const delta = choice.delta;

            // Текст финального ответа — стримим клиенту сразу.
            if (delta?.content) {
              content += delta.content;
              streamedContent = true;
              controller.enqueue(encoder.encode(delta.content));
            }

            // Вызовы инструментов приходят кусками — собираем по index.
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index;
                if (!toolAcc[idx]) toolAcc[idx] = { id: "", name: "", args: "" };
                if (tc.id) toolAcc[idx].id = tc.id;
                if (tc.function?.name) toolAcc[idx].name = tc.function.name;
                if (tc.function?.arguments) toolAcc[idx].args += tc.function.arguments;
              }
            }
          }

          const calls = Object.values(toolAcc);

          // Инструменты не запрошены → финальный ответ уже отстримлен, выходим.
          if (calls.length === 0) {
            controller.close();
            return;
          }

          // Иначе кладём assistant-сообщение с tool_calls и выполняем инструменты.
          const toolCalls: ChatCompletionMessageToolCall[] = calls.map((c) => ({
            id: c.id,
            type: "function",
            function: { name: c.name, arguments: c.args || "{}" },
          }));
          messages.push({ role: "assistant", content, tool_calls: toolCalls });

          for (const c of calls) {
            const result = await runTool(c.name);
            messages.push({ role: "tool", tool_call_id: c.id, content: result });
          }
        }

        // Лимит раундов исчерпан.
        if (!streamedContent) {
          controller.enqueue(
            encoder.encode("⚠️ Превышен лимит обращений к инструментам.")
          );
        }
        controller.close();
      } catch (error) {
        console.error(error);
        // Ошибку показываем только если ещё ничего не отправили клиенту.
        if (!streamedContent) {
          controller.enqueue(encoder.encode(openAiErrorMessage(error)));
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
