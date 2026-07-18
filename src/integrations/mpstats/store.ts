// Единый слой доступа к MPSTATS: решает мок ↔ живой API.
// По образцу src/integrations/ozon/store.ts. Живые методы бросают axios-ошибку —
// её классифицирует вызывающий Tool Registry (src/knowledge/tools.ts).

import {
  searchCompetitorsLive,
  getCategoryAnalyticsLive,
  getKeywordsLive,
  type Competitor,
  type CategoryAnalytics,
  type Keyword,
} from "./client";
import { MOCK_COMPETITORS, MOCK_CATEGORY, MOCK_KEYWORDS } from "./mock";

// Мок включается, если MPSTATS_MOCK=true, либо если токен не задан.
export function isMpstatsMock(): boolean {
  const flag = process.env.MPSTATS_MOCK?.toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !process.env.MPSTATS_TOKEN;
}

export async function getCompetitors(context?: {
  category?: string | null;
  title?: string;
}): Promise<Competitor[]> {
  if (isMpstatsMock()) return MOCK_COMPETITORS;
  return searchCompetitorsLive(context);
}

export async function getCategoryAnalytics(context?: {
  category?: string | null;
}): Promise<CategoryAnalytics | null> {
  if (isMpstatsMock()) return MOCK_CATEGORY;
  return getCategoryAnalyticsLive(context);
}

export async function getKeywords(context?: {
  sku?: number;
}): Promise<Keyword[]> {
  if (isMpstatsMock()) return MOCK_KEYWORDS;
  return getKeywordsLive(context);
}
