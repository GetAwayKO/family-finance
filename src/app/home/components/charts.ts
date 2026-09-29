import { currencyDecimals } from "@/shared/finance/money";

// Категориальная палитра, проверенная на различимость при дальтонизме;
// порядок слотов фиксирован.
export const SERIES = {
  income: "#2a78d6",
  expense: "#eb6834",
};
export const GRID = "#e4e3df";
export const AXIS_TEXT = "#52514e";

/** Минимальные единицы → число в основных единицах, для осей графика. */
export const toUnits = (minor: string, currency: string) =>
  Number(minor) / 10 ** currencyDecimals(currency);

/** Короткая подпись оси: 125000 → «125 тыс.». */
export const compact = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
