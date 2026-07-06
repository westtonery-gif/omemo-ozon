// Контракты Knowledge Runtime (MVP vertical slice).

export type MetricStatus = "known" | "unknown" | "unavailable";
export type MetricSource =
  | "seller_api"
  | "calculated"
  | "user_input"
  | "external_market";

// value: number — известное число; null — неизвестно; "infinite" — бесконечность (напр. запас при 0 продаж).
export type MetricValue = number | "infinite" | null;

export interface MetricResult {
  metric_id: string;
  value: MetricValue;
  status: MetricStatus; // known != unavailable; null(unknown) != 0(known)
  source: MetricSource;
  tool?: string;
  timestamp: string;
}

export type MetricBundle = Record<string, MetricResult>;

export interface FormulaResult {
  formula_id: string;
  value: MetricValue;
  status: MetricStatus;
  inputs_used: Record<string, MetricValue>;
  provenance: "formula_engine";
}

export interface Diagnosis {
  matched_rule: string;
  funnel_stage: string;
  primary_unit: string | null;
  severity: string;
  confidence: string;
  findings: string[];
}

// Ссылка на товар. Оба поля опциональны; если нет — runtime берёт первый товар.
export interface ProductRef {
  offer_id?: string;
  sku?: number;
}

// Контекст товара, который Metric Resolver прокидывает в контекстные инструменты
// (напр. search_competitors). Строится из результата get_products.
export interface ToolContext {
  title?: string;
  category?: string | null;
  price?: number;
  offer_id?: string;
  sku?: number;
}

export interface DiagnosticSession {
  question: string;
  product_ref?: ProductRef;
  intent: { scenario: string; unit_id: string | null };
  metrics: MetricResult[];
  formulas: FormulaResult[];
  diagnosis: Diagnosis | null;
  status:
    | "complete"
    | "needs_metrics"
    | "data_unavailable"
    | "no_match"
    | "failed";
  missing_metrics: string[];
  confidence: string;
}

// Нормализованный результат инструмента (Tool Registry).
export type ToolErrorState =
  | "ok"
  | "unauthorized"
  | "forbidden_no_subscription"
  | "rate_limited"
  | "upstream_unavailable"
  | "empty";

export interface ToolResult {
  tool: string;
  state: ToolErrorState;
  data: unknown; // нормализованные данные (форма зависит от инструмента)
}

export type ToolRunner = (
  tool: string,
  context?: ToolContext
) => Promise<ToolResult>;
