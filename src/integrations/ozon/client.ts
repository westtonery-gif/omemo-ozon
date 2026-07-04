import axios from "axios";

console.log("CLIENT =", process.env.OZON_CLIENT_ID);
console.log("API =", process.env.OZON_API_KEY);

const ozon = axios.create({
  baseURL: "https://api-seller.ozon.ru",
  headers: {
    "Client-Id": process.env.OZON_CLIENT_ID!,
    "Api-Key": process.env.OZON_API_KEY!,
    "Content-Type": "application/json",
  },
});

export default ozon;