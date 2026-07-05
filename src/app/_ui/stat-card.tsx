// Карточка с одной метрикой. Server Component.

export default function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "positive" | "warning";
}) {
  const valueColor =
    accent === "positive"
      ? "text-emerald-600"
      : accent === "warning"
        ? "text-amber-600"
        : "text-zinc-900";

  return (
    <div className="rounded-xl border border-zinc-200 p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${valueColor}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  );
}
