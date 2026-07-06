// Единый слой доступа к данным магазина: решает мок ↔ живой Ozon.
// Используется и инструментами агента (src/agents/tools.ts), и страницами
// Товары/Продажи/Финансы (Server Components), чтобы логика была одна.

import { getProductsDetailed } from "./products";
import { getSalesSummaryLive } from "./analytics";
import {
  MOCK_PRODUCTS,
  MOCK_SALES,
  type OzonProduct,
  type OzonSalesSummary,
} from "./mock";

// Мок включается, если явно задан OZON_MOCK=true,
// либо если реальные ключи Ozon не заданы (например, на машине разработчика).
export function isMock(): boolean {
  const flag = process.env.OZON_MOCK?.toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !process.env.OZON_CLIENT_ID || !process.env.OZON_API_KEY;
}

export async function getProducts(): Promise<OzonProduct[]> {
  if (isMock()) return MOCK_PRODUCTS;
  return getProductsDetailed();
}

export async function getSalesSummary(): Promise<OzonSalesSummary> {
  if (isMock()) return MOCK_SALES;
  // Живой режим: продажи из Seller API. Реклама/ДРР пока null (нужен Performance API).
  return getSalesSummaryLive();
}

// Человекочитаемое сообщение по ошибке запроса к Ozon (для страниц и агента).
export function ozonErrorMessage(e: unknown): string {
  const status = (e as { response?: { status?: number } })?.response?.status;
  if (status === 429) {
    return "Ozon вернул 429 — превышен лимит запросов аналитики (≈1 запрос в минуту). Подождите минуту и обновите.";
  }
  if (status === 401 || status === 403) {
    return "Ozon отклонил запрос (нет доступа). Проверьте ключи Seller API в .env.local.";
  }
  return "Не удалось получить данные из Ozon. Попробуйте позже.";
}
