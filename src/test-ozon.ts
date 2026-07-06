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

    console.log("\n=== 3) getProductsDetailed() (то, что видит приложение) ===");
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
