// Diagnosis runner: применяет diagnosis_rules юнита к метрикам.
// Правила по убыванию priority, первое совпавшее = primary.
import type { KnowledgeUnit, DiagnosisRule } from "./load";
import type { MetricBundle, Diagnosis } from "./types";

type Cond = DiagnosisRule["conditions"][number];

function condOk(cond: Cond, bundle: MetricBundle): boolean {
  const m = bundle[cond.metric];
  const known = m && m.status === "known" && typeof m.value === "number";
  const v = known ? (m!.value as number) : null;

  switch (cond.op) {
    case "not_null":
      return known;
    case "is_null":
      return !m || m.status !== "known" || m.value === null;
    case "eq":
      return known && v === cond.value;
    case "ne":
      return known && v !== cond.value;
    case "lt":
      return known && v! < (cond.value as number);
    case "lte":
      return known && v! <= (cond.value as number);
    case "gt":
      return known && v! > (cond.value as number);
    case "gte":
      return known && v! >= (cond.value as number);
    default:
      return false;
  }
}

export function diagnose(unit: KnowledgeUnit, bundle: MetricBundle): Diagnosis {
  const rules = [...unit.diagnosis_rules].sort((a, b) => b.priority - a.priority);
  for (const rule of rules) {
    const allOk = rule.conditions.every((c) => condOk(c, bundle));
    if (allOk) {
      return {
        matched_rule: rule.id,
        funnel_stage: rule.outcome.funnel_stage,
        primary_unit: rule.outcome.primary_unit,
        severity: rule.outcome.severity,
        confidence: rule.outcome.confidence,
        findings: [rule.outcome.finding],
      };
    }
  }
  // fallback на случай отсутствия правила без условий
  return {
    matched_rule: "none",
    funnel_stage: "unknown",
    primary_unit: null,
    severity: "low",
    confidence: "low",
    findings: ["Ни одно правило не сработало."],
  };
}
