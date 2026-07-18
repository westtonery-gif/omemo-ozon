// Живой клиент MPSTATS (mpstats.io) — внешняя рыночная аналитика Ozon.
// Авторизация: заголовок X-Mpstats-TOKEN. База: https://mpstats.io/api, Ozon — префикс /oz.
//
// ⚠ КОНТРАКТ ПО BEST-KNOWLEDGE — СВЕРИТЬ ПРИ ПЕРВОМ РЕАЛЬНОМ ТОКЕНЕ.
// Точные схемы ответов без токена проверить нельзя, поэтому:
//   • имена полей извлекаются с фолбэками (см. normalizeItem/normalizeKeyword);
//   • эндпоинты собраны в ENDPOINTS ниже — если путь/метод другой, править только там.
// Проверять при подключении ключа:
//   POST /oz/get/category?path=<категория>&d1=<YYYY-MM-DD>&d2=<YYYY-MM-DD>
//        тело { startRow, endRow } → список товаров ниши (поля item.*).
//   GET  /oz/get/item/<sku>/keywords → ключевые запросы товара.

import axios, { type AxiosInstance } from "axios";

export interface Competitor {
  title: string;
  price: number;
  rating: number;
  reviews_count: number;
  url: string;
}

export interface CategoryAnalytics {
  category: string;
  items_count: number | null;
  avg_price: number | null;
  median_price: number | null;
  min_price: number | null;
  max_price: number | null;
}

export interface Keyword {
  keyword: string;
  frequency: number;
}

const BASE_URL = "https://mpstats.io/api";

const ENDPOINTS = {
  category: "/oz/get/category", // POST, params: path,d1,d2 ; body: {startRow,endRow}
  itemKeywords: (sku: number | string) => `/oz/get/item/${sku}/keywords`, // GET
} as const;

let client: AxiosInstance | null = null;
// Инстанс ленивый: токен читается в живом режиме, когда он гарантированно задан.
function api(): AxiosInstance {
  if (!client) {
    client = axios.create({
      baseURL: BASE_URL,
      headers: {
        "X-Mpstats-TOKEN": process.env.MPSTATS_TOKEN ?? "",
        "Content-Type": "application/json",
      },
      timeout: 20_000,
    });
  }
  return client;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Number(((s[mid - 1] + s[mid]) / 2).toFixed(2));
}

// item MPSTATS → Competitor. Имена полей с фолбэками — VERIFY при первом ключе.
function normalizeItem(raw: Record<string, unknown>): Competitor | null {
  const title =
    typeof raw.name === "string"
      ? raw.name
      : typeof raw.title === "string"
        ? raw.title
        : null;
  const price = num(raw.final_price) ?? num(raw.price);
  const rating = num(raw.rating) ?? num(raw.rate);
  const reviews =
    num(raw.comments) ?? num(raw.reviews) ?? num(raw.reviews_count);
  const idPart = raw.id ?? raw.sku;
  const url =
    typeof raw.url === "string"
      ? raw.url
      : idPart != null
        ? `https://www.ozon.ru/product/${idPart}`
        : "";
  if (title == null || price == null) return null;
  return { title, price, rating: rating ?? 0, reviews_count: reviews ?? 0, url };
}

function last30Days(): { d1: string; d2: string } {
  const today = new Date();
  const d2 = today.toISOString().slice(0, 10);
  const d1 = new Date(today.getTime() - 30 * 864e5).toISOString().slice(0, 10);
  return { d1, d2 };
}

// Достаёт массив строк из ответа: либо сам массив, либо {data:[...]}.
function extractRows(payload: unknown): Record<string, unknown>[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: unknown[] }).data
      : [];
  return rows.filter(
    (r): r is Record<string, unknown> => typeof r === "object" && r !== null
  );
}

async function fetchCategoryRows(path: string): Promise<Competitor[]> {
  const { d1, d2 } = last30Days();
  const res = await api().post(
    ENDPOINTS.category,
    { startRow: 0, endRow: 20 },
    { params: { path, d1, d2 } }
  );
  return extractRows(res.data)
    .map(normalizeItem)
    .filter((c): c is Competitor => c !== null);
}

// Ниша определяется по категории товара; без неё поиск конкурентов невозможен —
// возвращаем пусто (резолвер трактует как unknown, а не выдумывает данные).
export async function searchCompetitorsLive(context?: {
  category?: string | null;
  title?: string;
}): Promise<Competitor[]> {
  const path = context?.category;
  if (!path) return [];
  return fetchCategoryRows(path);
}

export async function getCategoryAnalyticsLive(context?: {
  category?: string | null;
}): Promise<CategoryAnalytics | null> {
  const path = context?.category;
  if (!path) return null;
  const items = await fetchCategoryRows(path);
  const prices = items.map((i) => i.price).filter((p) => p > 0);
  return {
    category: path,
    items_count: items.length || null,
    avg_price: prices.length
      ? Number((prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2))
      : null,
    median_price: median(prices),
    min_price: prices.length ? Math.min(...prices) : null,
    max_price: prices.length ? Math.max(...prices) : null,
  };
}

function normalizeKeyword(raw: Record<string, unknown>): Keyword | null {
  const keyword =
    typeof raw.word === "string"
      ? raw.word
      : typeof raw.keyword === "string"
        ? raw.keyword
        : typeof raw.query === "string"
          ? raw.query
          : null;
  const frequency =
    num(raw.count) ?? num(raw.frequency) ?? num(raw.freq) ?? num(raw.words);
  if (keyword == null) return null;
  return { keyword, frequency: frequency ?? 0 };
}

// Ключевые запросы товара — нужен sku. Без него вернём пусто.
export async function getKeywordsLive(context?: {
  sku?: number;
}): Promise<Keyword[]> {
  if (context?.sku == null) return [];
  const res = await api().get(ENDPOINTS.itemKeywords(context.sku));
  return extractRows(res.data)
    .map(normalizeKeyword)
    .filter((k): k is Keyword => k !== null);
}
