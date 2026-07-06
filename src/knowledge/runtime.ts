// Diagnostic Runtime: question → intent → retrieve → resolve → formulas → diagnose.
// Оркестрация ДЕТЕРМИНИРОВАННА (не LLM). LLM подключается только на synthesis.
import { loadUnit } from "./load";
import { resolveMetrics } from "./resolver";
import { diagnose } from "./diagnose";
import type { DiagnosticSession, ToolRunner } from "./types";

// MVP intent: детерминированный матч по ключевым словам (LLM подключим позже).
const SALES_DROP_KEYWORDS = [
  "продаж",
  "плохо продаётся",
  "плохо продается",
  "упал",
  "мало заказов",
  "выручк",
];

function detectIntent(question: string): { scenario: string; unit_path: string } | null {
  const q = question.toLowerCase();
  if (SALES_DROP_KEYWORDS.some((k) => q.includes(k))) {
    return { scenario: "sales_drop_analysis", unit_path: "diagnostics/sales-drop.md" };
  }
  return null;
}

interface RunOpts {
  question: string;
  productRef?: { offer_id: string };
  tools?: ToolRunner; // eval подменяет на mock
}

export async function runDiagnosis(opts: RunOpts): Promise<DiagnosticSession> {
  const { question, productRef, tools } = opts;

  const intent = detectIntent(question);
  if (!intent) {
    return {
      question,
      product_ref: productRef,
      intent: { scenario: "none", unit_id: null },
      metrics: [],
      formulas: [],
      diagnosis: null,
      status: "no_match",
      missing_metrics: [],
      confidence: "low",
    };
  }

  const unit = loadUnit(intent.unit_path);

  // Резолв required_metrics (+ их inputs) и формулы.
  const { bundle, formulas } = await resolveMetrics(unit.required_metrics, {
    productRef,
    tools,
  });

  const metrics = unit.required_metrics.map((id) => bundle[id]).filter(Boolean);
  const missing_metrics = unit.required_metrics.filter(
    (id) => bundle[id]?.status !== "known"
  );
  const unavailable = unit.required_metrics.filter(
    (id) => bundle[id]?.status === "unavailable"
  );

  const diagnosis = diagnose(unit, bundle);

  // Статус сессии: если диагноз неопределённый — различаем «нет данных» и «нужны данные».
  let status: DiagnosticSession["status"] = "complete";
  if (!diagnosis.primary_unit) {
    status = unavailable.length ? "data_unavailable" : "needs_metrics";
  }

  return {
    question,
    product_ref: productRef,
    intent: { scenario: intent.scenario, unit_id: unit.id },
    metrics,
    formulas,
    diagnosis,
    status,
    missing_metrics,
    confidence: diagnosis.confidence,
  };
}
