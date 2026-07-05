// Мок-данные Ozon для локальной разработки без реальных ключей.
// Формат совпадает с тем, что отдают инструменты в src/agents/tools.ts,
// поэтому переключение на живой API не требует изменений в коде агента.

export interface OzonProduct {
  offer_id: string;
  name: string;
  price: number; // текущая цена, ₽
  old_price: number; // цена до скидки, ₽
  stock: number; // остаток на складах, шт
  orders_30d: number; // заказов за 30 дней
}

export const MOCK_PRODUCTS: OzonProduct[] = [
  {
    offer_id: "TSHIRT-BLK-M",
    name: "Футболка мужская хлопковая, чёрная, размер M",
    price: 890,
    old_price: 1490,
    stock: 42,
    orders_30d: 37,
  },
  {
    offer_id: "MUG-CERAMIC-330",
    name: "Кружка керамическая 330 мл, белая",
    price: 450,
    old_price: 590,
    stock: 8,
    orders_30d: 21,
  },
  {
    offer_id: "BACKPACK-URBAN-20L",
    name: "Рюкзак городской 20 л, водоотталкивающий",
    price: 2390,
    old_price: 3200,
    stock: 0,
    orders_30d: 14,
  },
  {
    offer_id: "SOCKS-PACK-5",
    name: "Носки хлопковые, набор 5 пар",
    price: 690,
    old_price: 990,
    stock: 120,
    orders_30d: 4,
  },
];

export interface OzonSalesSummary {
  period_days: number;
  orders: number;
  revenue: number; // выручка, ₽
  avg_check: number; // средний чек, ₽
  conversion: number; // конверсия в заказ, %
  ad_spend: number; // расходы на рекламу, ₽
  drr: number; // доля рекламных расходов, %
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
