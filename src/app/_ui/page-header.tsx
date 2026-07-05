// Заголовок раздела с бейджем «Тестовые данные» / «Живой Ozon».
// Server Component — без интерактивности.

export default function PageHeader({
  title,
  subtitle,
  mock,
}: {
  title: string;
  subtitle: string;
  mock: boolean;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
          mock
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {mock ? "Тестовые данные" : "Живой Ozon"}
      </span>
    </div>
  );
}
