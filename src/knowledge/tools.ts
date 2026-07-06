// Tool Registry — ЕДИНСТВЕННАЯ граница с Ozon. Возвращает нормализованные данные
// и состояние (ToolErrorState). Никто выше в стек Ozon-клиент не импортирует.
import { getProducts, getSalesSummary } from "../integrations/ozon/store";
import type { ToolResult, ToolErrorState, ToolRunner } from "./types";

function classify(e: unknown): ToolErrorState {
  const status = (e as { response?: { status?: number } })?.response?.status;
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden_no_subscription";
  if (status === 429) return "rate_limited";
  return "upstream_unavailable";
}

async function get_products(): Promise<ToolResult> {
  try {
    const products = await getProducts();
    const norm = products.map((p) => ({
      offer_id: p.offer_id,
      name: p.name,
      price: p.price,
      old_price: p.old_price,
      stock: p.stock,
      orders_30d: p.orders_30d,
    }));
    return {
      tool: "get_products",
      state: norm.length ? "ok" : "empty",
      data: { products: norm },
    };
  } catch (e) {
    return { tool: "get_products", state: classify(e), data: null };
  }
}

async function get_sales_analytics(): Promise<ToolResult> {
  try {
    const s = await getSalesSummary();
    return {
      tool: "get_sales_analytics",
      state: "ok",
      // sessions пока не выдаётся текущим слоем аналитики → null (unknown ниже по стеку).
      data: { revenue: s.revenue, orders: s.orders, sessions: null },
    };
  } catch (e) {
    return { tool: "get_sales_analytics", state: classify(e), data: null };
  }
}

// Реальный исполнитель инструментов. Eval подменяет его на mock.
export const realToolRunner: ToolRunner = async (tool) => {
  switch (tool) {
    case "get_products":
      return get_products();
    case "get_sales_analytics":
      return get_sales_analytics();
    default:
      return { tool, state: "upstream_unavailable", data: null };
  }
};
