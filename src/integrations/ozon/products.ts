import ozon from "./client";
import type { OzonProduct } from "./mock";

// Сырой список товаров: только product_id и offer_id.
export async function getProducts() {
  const response = await ozon.post("/v3/product/list", {
    filter: {},
    last_id: "",
    limit: 100,
  });

  return response.data;
}

interface ProductListItem {
  product_id: number;
  offer_id: string;
}

interface ProductInfoItem {
  offer_id: string;
  name?: string;
  price?: string;
  old_price?: string;
  stocks?: { present?: number };
}

// Реальные товары с деталями, приведённые к формату OzonProduct.
// Ozon отдаёт список и подробности разными эндпоинтами, поэтому делаем два запроса.
export async function getProductsDetailed(): Promise<OzonProduct[]> {
  const list = await getProducts();
  const items: ProductListItem[] = list?.result?.items ?? [];

  if (items.length === 0) return [];

  const offerIds = items.map((i) => i.offer_id).filter(Boolean);

  const info = await ozon.post("/v3/product/info/list", {
    offer_id: offerIds,
    product_id: [],
    sku: [],
  });

  const infoItems: ProductInfoItem[] = info?.data?.result?.items ?? [];

  return infoItems.map((p) => {
    const price = Number(p.price ?? 0);
    const oldPrice = Number(p.old_price ?? 0);
    return {
      offer_id: p.offer_id,
      name: p.name ?? p.offer_id,
      price,
      old_price: oldPrice || price,
      stock: p.stocks?.present ?? 0,
      orders_30d: 0, // требует отдельного запроса аналитики; пока 0
    };
  });
}
