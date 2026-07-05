import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { getProducts, getSalesSummary } from "../integrations/ozon/store";

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

// Выполнить инструмент по имени и вернуть результат в виде строки для GPT.
export async function runTool(name: string): Promise<string> {
  switch (name) {
    case "get_products":
      return JSON.stringify(await getProducts());
    case "get_sales_summary":
      return JSON.stringify(await getSalesSummary());
    default:
      return JSON.stringify({ error: `Неизвестный инструмент: ${name}` });
  }
}
