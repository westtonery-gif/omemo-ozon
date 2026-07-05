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
