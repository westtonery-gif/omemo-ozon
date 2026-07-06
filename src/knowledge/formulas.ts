// Formula Engine — детерминированный слой. LLM здесь ничего не считает.
// MVP: conversion_rate, stock_days.
import type { FormulaResult, MetricResult, MetricValue } from "./types";

// Аргументы — по имени входа формулы (formulas.yaml: inputs).
type Inputs = Record<string, MetricResult>;

function num(m: MetricResult | undefined): number | null {
  return m && m.status === "known" && typeof m.value === "number" ? m.value : null;
}

// Статус результата наследуется от входов: любой unavailable → unavailable,
// любой unknown → unknown, иначе known.
function inheritStatus(...ms: (MetricResult | undefined)[]) {
  if (ms.some((m) => !m || m.status === "unavailable")) return "unavailable" as const;
  if (ms.some((m) => m!.status === "unknown")) return "unknown" as const;
  return "known" as const;
}

function result(
  formula_id: string,
  value: MetricValue,
  status: FormulaResult["status"],
  inputs: Inputs
): FormulaResult {
  const inputs_used: Record<string, MetricValue> = {};
  for (const k of Object.keys(inputs)) inputs_used[k] = inputs[k]?.value ?? null;
  return { formula_id, value, status, inputs_used, provenance: "formula_engine" };
}

export function compute(formulaId: string, inputs: Inputs): FormulaResult {
  switch (formulaId) {
    case "conversion_rate": {
      const orders = num(inputs.orders);
      const sessions = num(inputs.sessions);
      const status = inheritStatus(inputs.orders, inputs.sessions);
      if (status !== "known" || orders === null || sessions === null)
        return result(formulaId, null, status, inputs);
      if (sessions <= 0) return result(formulaId, null, "unknown", inputs); // /0 → неизвестно
      return result(formulaId, Number(((orders / sessions) * 100).toFixed(2)), "known", inputs);
    }
    case "stock_days": {
      const stock = num(inputs.stock);
      const orders30 = num(inputs.orders_30d);
      const status = inheritStatus(inputs.stock, inputs.orders_30d);
      if (status !== "known" || stock === null || orders30 === null)
        return result(formulaId, null, status, inputs);
      if (orders30 === 0) return result(formulaId, "infinite", "known", inputs); // measured 0 ≠ unknown
      return result(formulaId, Number((stock / (orders30 / 30)).toFixed(1)), "known", inputs);
    }
    default:
      return result(formulaId, null, "unknown", inputs);
  }
}
