import { NextRequest } from "next/server";
import { runDiagnosis } from "../../../knowledge/runtime";
import { synthesize } from "../../../knowledge/synthesize";
import type { DiagnosticSession } from "../../../knowledge/types";

type ClientMessage = { role: "user" | "assistant"; content: string };

function latestUserQuestion(body: unknown): string {
  const b = body as { messages?: ClientMessage[]; message?: unknown };
  if (Array.isArray(b.messages)) {
    const lastUser = [...b.messages]
      .reverse()
      .find((m) => m?.role === "user" && m.content);
    if (lastUser) return lastUser.content;
  }
  return b.message ? String(b.message) : "";
}

function logDiagnosticSession(session: DiagnosticSession) {
  console.log(
    "[knowledge-runtime]",
    JSON.stringify(
      {
        selected_knowledge_unit: session.intent.unit_id,
        resolved_metrics: session.metrics.map((m) => ({
          id: m.metric_id,
          value: m.value,
          status: m.status,
          source: m.source,
          tool: m.tool,
        })),
        formulas_executed: session.formulas.map((f) => ({
          id: f.formula_id,
          value: f.value,
          status: f.status,
          provenance: f.provenance,
        })),
        diagnosis: session.diagnosis,
      },
      null,
      2
    )
  );
}

function errorMessage(error: unknown): string {
  const e = error as {
    status?: number;
    code?: string;
    error?: { code?: string };
    message?: string;
  };
  const status = e?.status;
  const code = e?.code ?? e?.error?.code;

  if (status === 401) {
    return "OpenAI отклонил ключ. Проверьте OPENAI_API_KEY в `.env.local`.";
  }
  if (code === "unsupported_country_region_territory" || status === 403) {
    return "OpenAI заблокировал запрос по региону. Проверьте VPN/прокси и перезапустите сервер с `NODE_USE_ENV_PROXY=1`.";
  }
  if (status === 429) {
    return "OpenAI: слишком много запросов. Подождите немного и повторите.";
  }
  const msg = String(e?.message ?? "");
  if (/timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|socket|network|fetch failed/i.test(msg)) {
    return "Не удалось соединиться с OpenAI. Проверьте сеть или прокси и повторите.";
  }
  return "Не удалось получить ответ. Повторите попытку.";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = latestUserQuestion(body).trim();

    if (!question) {
      return new Response("Напишите вопрос, и я проанализирую доступные данные.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const session = await runDiagnosis({ question });
    logDiagnosticSession(session);

    const answer =
      session.status === "no_match"
        ? "Пока могу выполнить только диагностику продаж по доступным данным магазина. Спросите, например: «Проанализируй мой магазин»."
        : await synthesize(session);

    return new Response(answer, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(errorMessage(error), {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
