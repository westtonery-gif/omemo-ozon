// Первый eval: CASE stock = 0 → primary_unit inventory.stockout, confidence high.
// Полностью офлайн: Ozon подменён mock-инструментами, LLM не вызывается.
import { runDiagnosis } from "./knowledge/runtime";
import type { ToolRunner } from "./knowledge/types";

// Fixture: товар с нулевым остатком.
const mockTools: ToolRunner = async (tool) => {
  if (tool === "get_products")
    return {
      tool,
      state: "ok",
      data: {
        products: [
          { offer_id: "TEST-SKU", name: "Тестовый товар", price: 2390, old_price: 3200, stock: 0, orders_30d: 14 },
        ],
      },
    };
  if (tool === "get_sales_analytics")
    return { tool, state: "ok", data: { revenue: 50000, orders: 30, sessions: null } };
  return { tool, state: "upstream_unavailable", data: null };
};

function assert(name: string, cond: boolean, got: unknown) {
  const mark = cond ? "✅ PASS" : "❌ FAIL";
  console.log(`${mark}  ${name}${cond ? "" : `  (got: ${JSON.stringify(got)})`}`);
  return cond;
}

async function main() {
  const session = await runDiagnosis({
    question: "Почему товар плохо продаётся?",
    productRef: { offer_id: "TEST-SKU" },
    tools: mockTools,
  });

  console.log("\n── DiagnosticSession ──");
  console.log(JSON.stringify(session, null, 2));
  console.log("\n── Assertions (CASE: stock = 0) ──");

  const results = [
    assert("intent → sales_drop_analysis", session.intent.scenario === "sales_drop_analysis", session.intent),
    assert("primary_unit == inventory.stockout", session.diagnosis?.primary_unit === "inventory.stockout", session.diagnosis?.primary_unit),
    assert("confidence == high", session.confidence === "high", session.confidence),
    assert("funnel_stage == availability", session.diagnosis?.funnel_stage === "availability", session.diagnosis?.funnel_stage),
    assert("stock_days computed by formula_engine", session.formulas.some((f) => f.formula_id === "stock_days" && f.provenance === "formula_engine"), session.formulas.map((f) => f.formula_id)),
  ];

  const passed = results.every(Boolean);
  console.log(`\n${passed ? "✅ EVAL PASSED" : "❌ EVAL FAILED"} (${results.filter(Boolean).length}/${results.length})`);
  process.exit(passed ? 0 : 1);
}

main();
