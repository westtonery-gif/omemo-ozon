import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Диагностика живого Ozon: печатает сырые ответы обоих эндпоинтов и результат
// маппинга. Нужен, чтобы сверить реальный формат ответа с кодом products.ts.
async function main() {
  const ozon = (await import("./integrations/ozon/client")).default;
  const { getProducts, getProductsDetailed } = await import(
    "./integrations/ozon/products"
  );

  try {
    console.log("=== 1) /v3/product/list (сырой ответ) ===");
    const list = await getProducts();
    console.log(JSON.stringify(list, null, 2));

    const items: Array<{ offer_id?: string; product_id?: number }> =
      list?.result?.items ?? [];
    const offerIds = items.map((i) => i.offer_id).filter(Boolean);
    const productIds = items.map((i) => i.product_id).filter(Boolean);
    console.log("\noffer_ids:", offerIds);
    console.log("product_ids:", productIds);

    console.log("\n=== 2) /v3/product/info/list (сырой ответ) ===");
    const info = await ozon.post("/v3/product/info/list", {
      offer_id: offerIds,
      product_id: [],
      sku: [],
    });
    console.log(JSON.stringify(info.data, null, 2));

    console.log("\n=== 3) /v1/analytics/data по SKU (сырой ответ, заказы за 30д) ===");
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    try {
      const analytics = await ozon.post("/v1/analytics/data", {
        date_from: iso(dateFrom),
        date_to: iso(dateTo),
        metrics: ["ordered_units"],
        dimension: ["sku"],
        filters: [],
        sort: [],
        limit: 1000,
        offset: 0,
      });
      console.log(JSON.stringify(analytics.data, null, 2));
    } catch (e) {
      const err = e as { response?: { status?: number; data?: unknown }; message?: string };
      console.error("analytics ERROR:", err.response?.status, err.response?.data ?? err.message);
    }

    console.log("\n=== 4) getProductsDetailed() (то, что видит приложение) ===");
    const detailed = await getProductsDetailed();
    console.log(JSON.stringify(detailed, null, 2));
  } catch (error) {
    const e = error as {
      response?: { status?: number; data?: unknown };
      message?: string;
    };
    console.error("ERROR:", e.response?.status, e.response?.data ?? e.message);
  }
}

main();
