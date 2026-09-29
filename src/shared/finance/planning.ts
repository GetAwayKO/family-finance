import type { RecurrenceFrequency, RecurringPayment } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

const parse = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d, time: Date.UTC(y, m - 1, d) };
};

/** Дней от from до to (YYYY-MM-DD); отрицательное — to раньше from. */
export const daysBetween = (from: string, to: string) =>
  Math.round((parse(to).time - parse(from).time) / DAY_MS);

/** Доля в процентах без float-арифметики над суммами: 250 из 1000 → 25. */
export function percent(part: string, whole: string): number {
  const total = BigInt(whole);
  if (total <= BigInt(0)) return 0;
  return Number((BigInt(part) * BigInt(1000)) / total) / 10;
}

export type ReminderStatus =
  "overdue" | "today" | "soon" | "later" | "finished";

/**
 * Состояние регулярного платежа на дату now: просрочен, сегодня, скоро
 * (в пределах remindDaysBefore — пора напомнить), позже или закончился.
 */
export function reminderStatus(
  payment: Pick<RecurringPayment, "nextDate" | "remindDaysBefore">,
  now: string,
): ReminderStatus {
  if (!payment.nextDate) return "finished";
  const days = daysBetween(now, payment.nextDate);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  return days <= payment.remindDaysBefore ? "soon" : "later";
}

/** Платёж, о котором пора напомнить. */
export const isDue = (status: ReminderStatus) =>
  status === "overdue" || status === "today" || status === "soon";

const plural = (n: number, forms: [string, string, string]) => {
  const rule = new Intl.PluralRules("ru-RU").select(n);
  return rule === "one" ? forms[0] : rule === "few" ? forms[1] : forms[2];
};

const days = (n: number) => `${n} ${plural(n, ["день", "дня", "дней"])}`;

/** «Сегодня», «Завтра», «Через 3 дня», «Просрочен на 2 дня». */
export function dueLabel(nextDate: string, now: string): string {
  const d = daysBetween(now, nextDate);
  if (d < 0) return `Просрочен на ${days(-d)}`;
  if (d === 0) return "Сегодня";
  if (d === 1) return "Завтра";
  return `Через ${days(d)}`;
}

const UNITS: Record<
  RecurrenceFrequency,
  { every: string; forms: [string, string, string] }
> = {
  weekly: { every: "Каждую неделю", forms: ["неделю", "недели", "недель"] },
  monthly: { every: "Каждый месяц", forms: ["месяц", "месяца", "месяцев"] },
  yearly: { every: "Каждый год", forms: ["год", "года", "лет"] },
};

/** «Каждый месяц», «Раз в 2 недели», «Раз в 3 месяца». */
export function frequencyLabel(
  frequency: RecurrenceFrequency,
  interval: number,
): string {
  const unit = UNITS[frequency];
  return interval === 1
    ? unit.every
    : `Раз в ${interval} ${plural(interval, unit.forms)}`;
}

/**
 * Полных месяцев до даты цели, считая текущий: до конца этого месяца — 1.
 * 0 — срок прошёл.
 */
export function monthsLeft(now: string, targetDate: string): number {
  const a = parse(now);
  const b = parse(targetDate);
  if (b.time < a.time) return 0;
  return (b.y - a.y) * 12 + (b.m - a.m) + 1;
}

/**
 * Сколько откладывать в месяц, чтобы успеть к сроку. null — срока нет или
 * он прошёл; "0" — цель уже достигнута.
 */
export function monthlyNeeded(
  target: string,
  saved: string,
  now: string,
  targetDate: string | null,
): string | null {
  const rest = BigInt(target) - BigInt(saved);
  if (rest <= BigInt(0)) return "0";
  if (!targetDate) return null;
  const months = monthsLeft(now, targetDate);
  if (months === 0) return null;
  const n = BigInt(months);
  return ((rest + n - BigInt(1)) / n).toString();
}
