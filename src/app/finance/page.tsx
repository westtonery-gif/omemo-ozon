import {
  getSalesSummary,
  isMock,
  ozonErrorMessage,
} from "../../integrations/ozon/store";
import type { OzonSalesSummary } from "../../integrations/ozon/mock";
import { formatRub, formatPct } from "../_ui/format";
import PageHeader from "../_ui/page-header";
import StatCard from "../_ui/stat-card";
import ErrorCard from "../_ui/error-card";

export const metadata = { title: "Финансы — Ozonologist" };

export default async function FinancePage() {
  const mock = isMock();
  let s: OzonSalesSummary | null = null;
  let error: string | null = null;
  try {
    s = await getSalesSummary();
  } catch (e) {
    error = ozonErrorMessage(e);
  }

  if (error || !s) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <PageHeader
            title="Финансы"
            subtitle="Движение денег магазина."
            mock={mock}
          />
          <ErrorCard message={error ?? "Нет данных."} />
        </div>
      </div>
    );
  }

  // Реклама доступна только с Performance API. Без неё раскладку не строим.
  const hasAd = s.ad_spend !== null && s.drr !== null;
  const afterAd = hasAd ? s.revenue - s.ad_spend! : null;
  const adShare = hasAd && s.revenue > 0 ? (s.ad_spend! / s.revenue) * 100 : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <PageHeader
          title="Финансы"
          subtitle={`Движение денег за последние ${s.period_days} дней.`}
          mock={mock}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Выручка"
            value={formatRub(s.revenue)}
            accent="positive"
          />
          <StatCard
            label="Расходы на рекламу"
            value={hasAd ? formatRub(s.ad_spend!) : "н/д"}
            hint={hasAd ? undefined : "нужен Performance API"}
            accent={hasAd ? "warning" : "default"}
          />
          <StatCard
            label="После вычета рекламы"
            value={afterAd === null ? "н/д" : formatRub(afterAd)}
            hint={
              afterAd === null
                ? "нет данных о рекламе"
                : "до прочих расходов и комиссий"
            }
          />
        </div>

        {/* Раскладка выручки: реклама vs остаток — только если реклама известна */}
        {hasAd && afterAd !== null ? (
          <div className="mt-8 rounded-xl border border-zinc-200 p-5">
            <div className="mb-3 text-sm font-medium">Куда уходит выручка</div>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="bg-amber-400"
                style={{ width: `${adShare}%` }}
                title={`Реклама: ${formatPct(s.drr!)}`}
              />
              <div
                className="bg-emerald-400"
                style={{ width: `${100 - adShare}%` }}
                title="Остаток после рекламы"
              />
            </div>
            <div className="mt-3 flex gap-6 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-amber-400" />
                Реклама (ДРР {formatPct(s.drr!)}) — {formatRub(s.ad_spend!)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-emerald-400" />
                Остаток — {formatRub(afterAd)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">
            Данные по рекламе и ДРР появятся после подключения Performance API
            Ozon.
          </div>
        )}

        <p className="mt-4 text-xs text-zinc-400">
          Это упрощённая картина по данным рекламы и выручки. Комиссии Ozon,
          логистика и себестоимость пока не учитываются.
        </p>
      </div>
    </div>
  );
}
