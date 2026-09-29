// Суммы в API — строки с целым числом минимальных единиц валюты ("12345" = 123,45 ₽).

// 18 цифр — предел сервера (bigint в базе).
const MAX_MINOR = BigInt("999999999999999999");

/** Знаков после запятой у валюты (RUB — 2, JPY — 0), по данным Intl. */
export function currencyDecimals(currency: string): number {
  return (
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/** "123450", "RUB" → "1 234,50 ₽". Точность теряется только после 2^53. */
export function formatMoney(minor: string | bigint, currency: string): string {
  const decimals = currencyDecimals(currency);
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(minor) / 10 ** decimals);
}

/**
 * Разбирает ввод пользователя в минимальные единицы без float:
 * "1 234,5" → "123450". null — ввод не похож на сумму.
 */
export function parseMoney(
  input: string,
  currency: string,
  { allowNegative = false } = {},
): string | null {
  const decimals = currencyDecimals(currency);
  const cleaned = input.replace(/[\s ]/g, "").replace(",", ".");
  const match = /^(-?)(\d+)(?:\.(\d*))?$/.exec(cleaned);
  if (!match) return null;
  const [, sign, whole, fraction = ""] = match;
  if (sign && !allowNegative) return null;
  if (fraction.length > decimals) return null;
  const minor = BigInt(whole + fraction.padEnd(decimals, "0"));
  if (minor > MAX_MINOR) return null;
  return (sign && minor !== BigInt(0) ? -minor : minor).toString();
}

/** "123450", "RUB" → "1234,50" — для поля ввода. */
export function toMoneyInput(minor: string, currency: string): string {
  const decimals = currencyDecimals(currency);
  const negative = minor.startsWith("-");
  const digits = (negative ? minor.slice(1) : minor).padStart(
    decimals + 1,
    "0",
  );
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals);
  return `${negative ? "-" : ""}${whole}${decimals ? "," + fraction : ""}`;
}
