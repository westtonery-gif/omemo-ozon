// LLM synthesis: превращает готовый DiagnosticSession в ответ продавцу.
// GPT получает ТОЛЬКО факты (метрики), выходы формул и диагноз.
// Запрещено: считать, выдумывать цифры, делать выводы вне diagnosis.
import OpenAI from "openai";
import type { DiagnosticSession } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYNTH_SYSTEM = `
Ты Ozonologist. Тебе дают ГОТОВЫЙ диагноз магазина: метрики, выходы формул, вывод движка.
СТРОГО:
- Не считай ничего сам — все числа уже посчитаны, бери их как есть.
- Не выдумывай метрики и причины. Если метрика unknown/unavailable — так и скажи.
- Не выходи за рамки diagnosis.primary_unit и findings.
- Пиши кратко, по делу, с конкретикой из данных. Русский язык.
`;

export async function synthesize(session: DiagnosticSession): Promise<string> {
  if (session.status === "data_unavailable") {
    return `Недостаточно данных для диагноза. Недоступны метрики: ${session.missing_metrics.join(
      ", "
    )}. Подключи их (подписка/аналитика), тогда дам вывод.`;
  }

  const facts = {
    diagnosis: session.diagnosis,
    metrics: session.metrics.map((m) => ({ id: m.metric_id, value: m.value, status: m.status })),
    formulas: session.formulas.map((f) => ({ id: f.formula_id, value: f.value, status: f.status })),
    confidence: session.confidence,
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-5.5",
    messages: [
      { role: "system", content: SYNTH_SYSTEM },
      {
        role: "user",
        content: `Вопрос: ${session.question}\n\nДИАГНОЗ (JSON):\n${JSON.stringify(
          facts,
          null,
          2
        )}\n\nСформулируй ответ продавцу.`,
      },
    ],
  });

  return completion.choices[0].message.content ?? "";
}
