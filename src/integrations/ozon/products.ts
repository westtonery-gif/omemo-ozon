import ozon from "./client";

export async function getProducts() {
  const response = await ozon.post("/v3/product/list", {
    filter: {},
    last_id: "",
    limit: 10,
  });

  return response.data;
}