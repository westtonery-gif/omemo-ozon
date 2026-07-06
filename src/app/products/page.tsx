import { getProducts, isMock } from "../../integrations/ozon/store";
import { formatRub, formatInt } from "../_ui/format";
import PageHeader from "../_ui/page-header";

export const metadata = { title: "Товары — Ozonologist" };

export default async function ProductsPage() {
  const products = await getProducts();
  const mock = isMock();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <PageHeader
          title="Товары"
          subtitle={`Ассортимент магазина: ${products.length} товаров, цены и остатки.`}
          mock={mock}
        />

        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Товар</th>
                <th className="px-4 py-3 font-medium">Артикул</th>
                <th className="px-4 py-3 text-right font-medium">Цена</th>
                <th className="px-4 py-3 text-right font-medium">Старая цена</th>
                <th className="px-4 py-3 text-right font-medium">Остаток</th>
                <th className="px-4 py-3 text-right font-medium">Заказы 30д</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((p) => {
                const out = p.stock === 0;
                const low = p.stock > 0 && p.stock <= 10;
                return (
                  <tr key={p.offer_id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      {p.offer_id}
                    </td>
                    <td className="px-4 py-3 text-right">{formatRub(p.price)}</td>
                    <td className="px-4 py-3 text-right text-zinc-400 line-through">
                      {formatRub(p.old_price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          out
                            ? "font-semibold text-red-600"
                            : low
                              ? "font-semibold text-amber-600"
                              : ""
                        }
                      >
                        {out ? "нет в наличии" : `${formatInt(p.stock)} шт.`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.orders_30d === null ? "н/д" : formatInt(p.orders_30d)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-zinc-400">
          <span className="text-red-600">Красным</span> — нет в наличии,{" "}
          <span className="text-amber-600">жёлтым</span> — низкий остаток (≤ 10 шт.).
        </p>
      </div>
    </div>
  );
}
