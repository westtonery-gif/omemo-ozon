import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const { getProducts } = await import("./integrations/ozon/products");

  try {
    const products = await getProducts();
    console.log(products);
  } catch (error) {
    console.error(error);
  }
}

main();