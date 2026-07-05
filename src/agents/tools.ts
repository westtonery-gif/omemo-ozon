import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { getProductsDetailed } from "../integrations/ozon/products";
import { MOCK_PRODUCTS, MOCK_SALES, type OzonProduct } from "../integrations/ozon/mock";

// Мок включается, если явно задан OZON_MOCK=true,
// либо если реальные ключи Ozon не заданы (например, на машине разработчика).
export function isMock(): boolean {
  const flag = process.env.OZON_MOCK?.toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !process.env.OZON_CLIENT_ID || !process.env.OZON_API_KEY;
}

// Описание инструментов для OpenAI. GPT сам решает, какой вызвать.
export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_products",
      description:
        "Получить список товаров магазина на Ozon с ценами и остатками. " +
        "Вызывай, когда пользователь спрашивает про товары, ассортимент, остатки или цены.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sales_summary",
      description:
        "Получить сводку по продажам за последние 30 дней: заказы, выручка, " +
        "средний чек, конверсия, расходы на рекламу, ДРР. " +
        "Вызывай, когда пользователь спрашивает про продажи, выручку или рекламу.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

async function getProducts(): Promise<OzonProduct[]> {
  if (isMock()) return MOCK_PRODUCTS;
  return getProductsDetailed();
}

function getSalesSummary() {
  // Реальная аналитика Ozon требует отдельной интеграции (/v1/analytics/data).
  // Пока для живого режима тоже возвращаем сводку-заглушку той же формы.
  return MOCK_SALES;
}

// Выполнить инструмент по имени и вернуть результат в виде строки для GPT.
export async function runTool(name: string): Promise<string> {
  switch (name) {
    case "get_products":
      return JSON.stringify(await getProducts());
    case "get_sales_summary":
      return JSON.stringify(getSalesSummary());
    default:
      return JSON.stringify({ error: `Неизвестный инструмент: ${name}` });
  }
}
