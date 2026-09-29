const pad = (n: number) => String(n).padStart(2, "0");

/** Дата в формате API (YYYY-MM-DD) по местному времени. */
export const toApiDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const today = () => toApiDate(new Date());

/** Первый и последний день месяца, сдвинутого на offset от текущего. */
export function monthRange(offset = 0, now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: toApiDate(from), to: toApiDate(to) };
}

/** "2026-09-29" → "29.09.2026". */
export const formatDate = (date: string) => date.split("-").reverse().join(".");

/** "2026-09" → "сент. 2026". */
export function formatMonth(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("ru-RU", {
    month: "short",
    year: "numeric",
  });
}
