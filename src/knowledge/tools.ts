// Tool Registry — ЕДИНСТВЕННАЯ граница с Ozon. Возвращает нормализованные данные
// и состояние (ToolErrorState). Никто выше в стек Ozon-клиент не импортирует.
import { getProducts, getSalesSummary } from "../integrations/ozon/store";
import {
  getCompetitors,
  getCategoryAnalytics,
  getKeywords,
} from "../integrations/mpstats/store";
import type { ToolResult, ToolErrorState, ToolContext, ToolRunner } from "./types";

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

// Конкуренты из MPSTATS (ниша по context.category). Форма массива —
// {title, price, rating, reviews_count, url} — совпадает с тем, что усредняет
// metrics.yaml. Мок ↔ живой решает src/integrations/mpstats/store.ts по MPSTATS_TOKEN.
async function search_competitors(context?: ToolContext): Promise<ToolResult> {
  try {
    const competitors = await getCompetitors(context);
    return {
      tool: "search_competitors",
      state: competitors.length ? "ok" : "empty",
      data: competitors,
    };
  } catch (e) {
    return { tool: "search_competitors", state: classify(e), data: null };
  }
}

// Аналитика ниши из MPSTATS (медиана/средняя/разброс цен по категории товара).
// Пока не привязана к metric_id в metrics.yaml — данные готовы, но в автоматической
// диагностике не участвуют (нужен новый metric + правило в knowledge unit).
async function get_category_analytics(context?: ToolContext): Promise<ToolResult> {
  try {
    const analytics = await getCategoryAnalytics(context);
    return {
      tool: "get_category_analytics",
      state: analytics ? "ok" : "empty",
      data: analytics,
    };
  } catch (e) {
    return { tool: "get_category_analytics", state: classify(e), data: null };
  }
}

// Ключевые запросы товара из MPSTATS (по context.sku). Также ещё не привязаны к
// metric_id — готовый источник для SEO-инструмента, но не для авто-диагностики.
async function get_keywords(context?: ToolContext): Promise<ToolResult> {
  try {
    const keywords = await getKeywords(context);
    return {
      tool: "get_keywords",
      state: keywords.length ? "ok" : "empty",
      data: keywords,
    };
  } catch (e) {
    return { tool: "get_keywords", state: classify(e), data: null };
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
export const realToolRunner: ToolRunner = async (tool, context) => {
  switch (tool) {
    case "get_products":
      return get_products();
    case "get_sales_analytics":
      return get_sales_analytics();
    case "search_competitors":
      return search_competitors(context);
    case "get_category_analytics":
      return get_category_analytics(context);
    case "get_keywords":
      return get_keywords(context);
    default:
      return { tool, state: "upstream_unavailable", data: null };
  }
};
