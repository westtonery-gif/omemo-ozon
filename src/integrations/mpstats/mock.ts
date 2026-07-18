// Мок-данные MPSTATS — используются, если MPSTATS_TOKEN не задан (машина разработчика)
// или MPSTATS_MOCK=true. Форма конкурентов ДОЛЖНА совпадать с тем, что ждёт
// metrics.yaml (поля price/rating/reviews_count усредняются) — это тот же массив,
// что раньше лежал прямо в src/knowledge/tools.ts.

import type { Competitor, CategoryAnalytics, Keyword } from "./client";

export const MOCK_COMPETITORS: Competitor[] = [
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

export const MOCK_CATEGORY: CategoryAnalytics = {
  category: "Одежда/Футболки",
  items_count: 4,
  avg_price: 690,
  median_price: 690,
  min_price: 660,
  max_price: 720,
};

export const MOCK_KEYWORDS: Keyword[] = [
  { keyword: "футболка мужская", frequency: 120000 },
  { keyword: "футболка хлопок", frequency: 45000 },
  { keyword: "футболка черная базовая", frequency: 38000 },
  { keyword: "футболка regular fit", frequency: 21000 },
];
