// Форматирование чисел в рублях и процентах в русской локали.

export function formatRub(value: number): string {
  return value.toLocaleString("ru-RU") + " ₽";
}

export function formatInt(value: number): string {
  return value.toLocaleString("ru-RU");
}

export function formatPct(value: number): string {
  return value.toLocaleString("ru-RU") + " %";
}
