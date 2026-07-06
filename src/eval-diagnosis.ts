// Offline eval: Ozon and market tools are mocked, LLM synthesis is not called.
import { runDiagnosis } from "./knowledge/runtime";
import type { ToolRunner } from "./knowledge/types";

const stockoutTools: ToolRunner = async (tool) => {
  if (tool === "get_products")
    return {
      tool,
      state: "ok",
      data: {
        products: [
          {
            offer_id: "TEST-SKU",
            name: "Test product",
            price: 2390,
            old_price: 3200,
            stock: 0,
            orders_30d: 14,
          },
        ],
      },
    };
  if (tool === "get_sales_analytics")
    return { tool, state: "ok", data: { revenue: 50000, orders: 30, sessions: null } };
  if (tool === "search_competitors") return { tool, state: "ok", data: [] };
  return { tool, state: "upstream_unavailable", data: null };
};

const competitionTools: ToolRunner = async (tool) => {
  if (tool === "get_products")
    return {
      tool,
      state: "ok",
      data: {
        products: [
          {
            offer_id: "TEST-SKU",
            name: "Test product",
            price: 1000,
            old_price: 1200,
            stock: 25,
            orders_30d: 5,
            reviews_count: 10,
          },
        ],
      },
    };
  if (tool === "get_sales_analytics")
    return { tool, state: "ok", data: { revenue: 10000, orders: 5, sessions: null } };
  if (tool === "search_competitors")
    return {
      tool,
      state: "ok",
      data: [
        {
          title: "Competitor product",
          price: 700,
          rating: 4.8,
          reviews_count: 1000,
          url: "https://www.ozon.ru/mock/competitor",
        },
      ],
    };
  return { tool, state: "upstream_unavailable", data: null };
};

function assert(name: string, cond: boolean, got: unknown) {
  const mark = cond ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${cond ? "" : `  (got: ${JSON.stringify(got)})`}`);
  return cond;
}

async function main() {
  const stockoutSession = await runDiagnosis({
    question: "Почему товар плохо продается?",
    productRef: { offer_id: "TEST-SKU" },
    tools: stockoutTools,
  });

  const competitionSession = await runDiagnosis({
    question: "Проанализируй мой товар относительно конкурентов",
    productRef: { offer_id: "TEST-SKU" },
    tools: competitionTools,
  });

  console.log("\n-- DiagnosticSession: stockout --");
  console.log(JSON.stringify(stockoutSession, null, 2));
  console.log("\n-- DiagnosticSession: competition --");
  console.log(JSON.stringify(competitionSession, null, 2));
  console.log("\n-- Assertions --");

  const results = [
    assert(
      "stockout: intent -> sales_drop_analysis",
      stockoutSession.intent.scenario === "sales_drop_analysis",
      stockoutSession.intent
    ),
    assert(
      "stockout: primary_unit == inventory.stockout",
      stockoutSession.diagnosis?.primary_unit === "inventory.stockout",
      stockoutSession.diagnosis?.primary_unit
    ),
    assert("stockout: confidence == high", stockoutSession.confidence === "high", stockoutSession.confidence),
    assert(
      "stockout: funnel_stage == availability",
      stockoutSession.diagnosis?.funnel_stage === "availability",
      stockoutSession.diagnosis?.funnel_stage
    ),
    assert(
      "stockout: stock_days computed by formula_engine",
      stockoutSession.formulas.some((f) => f.formula_id === "stock_days" && f.provenance === "formula_engine"),
      stockoutSession.formulas.map((f) => f.formula_id)
    ),
    assert(
      "competition: primary_unit == competition.market-position",
      competitionSession.diagnosis?.primary_unit === "competition.market-position",
      competitionSession.diagnosis?.primary_unit
    ),
    assert("competition: confidence == medium", competitionSession.confidence === "medium", competitionSession.confidence),
    assert(
      "competition: price_vs_market computed",
      competitionSession.formulas.some((f) => f.formula_id === "price_vs_market" && f.value === 42.86),
      competitionSession.formulas
    ),
  ];

  const passed = results.every(Boolean);
  console.log(`\n${passed ? "EVAL PASSED" : "EVAL FAILED"} (${results.filter(Boolean).length}/${results.length})`);
  process.exit(passed ? 0 : 1);
}

main();
