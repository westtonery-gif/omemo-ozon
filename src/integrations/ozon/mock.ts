// Мок-данные Ozon для локальной разработки без реальных ключей.
// Формат совпадает с тем, что отдают инструменты в src/agents/tools.ts,
// поэтому переключение на живой API не требует изменений в коде агента.

export interface OzonProduct {
  offer_id: string;
  sku?: number; // Ozon SKU; нужен для сопоставления и контекста
  name: string;
  price: number; // текущая цена, ₽
  old_price: number; // цена до скидки, ₽
  stock: number; // остаток на складах, шт
  orders_30d: number | null; // заказов за 30 дней; null = нет данных
  reviews_count?: number | null; // отзывы; null = нет данных
  rating?: number | null; // рейтинг товара; null = нет данных
}

export const MOCK_PRODUCTS: OzonProduct[] = [
  {
    offer_id: "TSHIRT-BLK-M",
    sku: 100001,
    name: "Футболка мужская хлопковая, чёрная, размер M",
    price: 890,
    old_price: 1490,
    stock: 42,
    orders_30d: 37,
    reviews_count: 340,
    rating: 4.7,
  },
  {
    offer_id: "MUG-CERAMIC-330",
    sku: 100002,
    name: "Кружка керамическая 330 мл, белая",
    price: 450,
    old_price: 590,
    stock: 8,
    orders_30d: 21,
    reviews_count: 120,
    rating: 4.5,
  },
  {
    offer_id: "BACKPACK-URBAN-20L",
    sku: 100003,
    name: "Рюкзак городской 20 л, водоотталкивающий",
    price: 2390,
    old_price: 3200,
    stock: 0,
    orders_30d: 14,
    reviews_count: 45,
    rating: 4.6,
  },
  {
    offer_id: "SOCKS-PACK-5",
    sku: 100004,
    name: "Носки хлопковые, набор 5 пар",
    price: 690,
    old_price: 990,
    stock: 120,
    orders_30d: 4,
    reviews_count: 12,
    rating: 4.2,
  },
];

export interface OzonSalesSummary {
  period_days: number;
  orders: number;
  revenue: number; // выручка, ₽
  avg_check: number; // средний чек, ₽
  conversion: number; // конверсия в заказ, %
  // Реклама и ДРР приходят из отдельного Performance API. Пока он не подключён,
  // в живом режиме здесь null («нет данных»), а не 0 — чтобы не вводить в заблуждение.
  ad_spend: number | null; // расходы на рекламу, ₽
  drr: number | null; // доля рекламных расходов, %
}

export const MOCK_SALES: OzonSalesSummary = {
  period_days: 30,
  orders: 76,
  revenue: 78_400,
  avg_check: 1_032,
  conversion: 2.1,
  ad_spend: 9_800,
  drr: 12.5,
};
