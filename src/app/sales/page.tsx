import {
  getSalesSummary,
  isMock,
  ozonErrorMessage,
} from "../../integrations/ozon/store";
import type { OzonSalesSummary } from "../../integrations/ozon/mock";
import { formatRub, formatInt, formatPct } from "../_ui/format";
import PageHeader from "../_ui/page-header";
import StatCard from "../_ui/stat-card";
import ErrorCard from "../_ui/error-card";

export const metadata = { title: "Продажи — Ozonologist" };

export default async function SalesPage() {
  const mock = isMock();
  let s: OzonSalesSummary | null = null;
  let error: string | null = null;
  try {
    s = await getSalesSummary();
  } catch (e) {
    error = ozonErrorMessage(e);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <PageHeader
          title="Продажи"
          subtitle={
            s ? `Сводка за последние ${s.period_days} дней.` : "Сводка по продажам."
          }
          mock={mock}
        />

        {error || !s ? (
          <ErrorCard message={error ?? "Нет данных."} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Заказы" value={formatInt(s.orders)} hint="за период" />
          <StatCard
            label="Выручка"
            value={formatRub(s.revenue)}
            accent="positive"
          />
          <StatCard label="Средний чек" value={formatRub(s.avg_check)} />
          <StatCard
            label="Конверсия в заказ"
            value={formatPct(s.conversion)}
            hint="из просмотров"
          />
          <StatCard
            label="Расходы на рекламу"
            value={s.ad_spend === null ? "н/д" : formatRub(s.ad_spend)}
            hint={s.ad_spend === null ? "нужен Performance API" : undefined}
          />
          <StatCard
            label="ДРР"
            value={s.drr === null ? "н/д" : formatPct(s.drr)}
            hint={
              s.drr === null ? "нужен Performance API" : "доля рекламных расходов"
            }
            accent={s.drr === null ? "default" : "warning"}
          />
          </div>
        )}
      </div>
    </div>
  );
}
