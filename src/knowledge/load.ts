// Загрузка Knowledge Core: taxonomy / metrics / formulas / unit-файлы.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as yaml from "js-yaml";

const ROOT = join(process.cwd(), "knowledge");

function loadYaml<T>(relPath: string): T {
  return yaml.load(readFileSync(join(ROOT, relPath), "utf8")) as T;
}

export interface MetricDef {
  source: string;
  tool?: string;
  scope?: "product" | "store";
  field?: string;
  aggregation?: "avg";
  formula?: string;
  inputs?: string[];
  type: string;
  unit: string;
  availability: string;
}

export interface FormulaDef {
  description: string;
  inputs: string[];
  output: { id: string; type: string; unit: string };
}

export interface DiagnosisRule {
  id: string;
  priority: number;
  conditions: Array<{ metric: string; op: string; value?: number; value_metric?: string }>;
  outcome: {
    funnel_stage: string;
    primary_unit: string | null;
    severity: string;
    confidence: string;
    finding: string;
  };
}

export interface KnowledgeUnit {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  required_metrics: string[];
  diagnosis_rules: DiagnosisRule[];
}

let _metrics: Record<string, MetricDef> | null = null;
let _formulas: Record<string, FormulaDef> | null = null;

export function metricsCatalog(): Record<string, MetricDef> {
  if (!_metrics) _metrics = loadYaml<{ metrics: Record<string, MetricDef> }>("metrics.yaml").metrics;
  return _metrics;
}

export function formulasCatalog(): Record<string, FormulaDef> {
  if (!_formulas) _formulas = loadYaml<{ formulas: Record<string, FormulaDef> }>("formulas.yaml").formulas;
  return _formulas;
}

// Разбор unit-файла: YAML-фронтматтер между --- ... ---
export function loadUnit(relPath: string): KnowledgeUnit {
  const raw = readFileSync(join(ROOT, "units", relPath), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`Нет фронтматтера в юните: ${relPath}`);
  return yaml.load(m[1]) as KnowledgeUnit;
}
