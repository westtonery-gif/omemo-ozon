// Tool Registry — ЕДИНСТВЕННАЯ граница с Ozon. Возвращает нормализованные данные
// и состояние (ToolErrorState). Никто выше в стек Ozon-клиент не импортирует.
import { getProducts, getSalesSummary } from "../integrations/ozon/store";
import type { ToolResult, ToolErrorState, ToolContext, ToolRunner } from "./types";

const MOCK_COMPETITORS = [
  {
    title: "Базовая хлопковая футболка, черная",
    price: 690,
    rating: 4.7,
    reviews_count: 1200,
    url: "https://www.ozon.ru/mock/competitor-1",
  },
  {
    title: "Футболка мужская однотонная",
    price: 720,
    rating: 4.6,
    reviews_count: 860,
    url: "https://www.ozon.ru/mock/competitor-2",
  },
  {
    title: "Черная футболка regular fit",
    price: 660,
    rating: 4.8,
    reviews_count: 1540,
    url: "https://www.ozon.ru/mock/competitor-3",
  },
];

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
      sku: p.sku,
      name: p.name,
      price: p.price,
      old_price: p.old_price,
      stock: p.stock,
      orders_30d: p.orders_30d,
      reviews_count: p.reviews_count,
      rating: p.rating,
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

// Принимает контекст товара (title/category/price) — реальный источник будет
// искать по нему. Пока возвращает mock (реальный поиск НЕ подключаем на этом шаге).
async function search_competitors(context?: ToolContext): Promise<ToolResult> {
  void context; // TODO: сюда подключится реальный источник конкурентов
  return {
    tool: "search_competitors",
    state: "ok",
    data: MOCK_COMPETITORS,
  };
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
export const realToolRunner: ToolRunner = async (tool, context) => {
  switch (tool) {
    case "get_products":
      return get_products();
    case "get_sales_analytics":
      return get_sales_analytics();
    case "search_competitors":
      return search_competitors(context);
    default:
      return { tool, state: "upstream_unavailable", data: null };
  }
};
