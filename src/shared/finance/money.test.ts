import { describe, expect, it } from "vitest";
import {
  currencyDecimals,
  formatMoney,
  parseMoney,
  toMoneyInput,
} from "./money";

// Intl разделяет разряды неразрывным пробелом.
const plain = (value: string) => value.replace(/[  ]/g, " ");

describe("money", () => {
  it("знает число знаков валюты", () => {
    expect(currencyDecimals("RUB")).toBe(2);
    expect(currencyDecimals("JPY")).toBe(0);
  });

  it("форматирует минимальные единицы", () => {
    expect(plain(formatMoney("123450", "RUB"))).toBe("1 234,50 ₽");
    expect(plain(formatMoney("-5", "RUB"))).toBe("-0,05 ₽");
    expect(plain(formatMoney("1500", "JPY"))).toBe("1 500 ¥");
  });

  it("разбирает ввод без float", () => {
    expect(parseMoney("1 234,5", "RUB")).toBe("123450");
    expect(parseMoney("0.1", "RUB")).toBe("10");
    expect(parseMoney("19.99", "RUB")).toBe("1999");
    expect(parseMoney("1500", "JPY")).toBe("1500");
    expect(parseMoney("-100", "RUB", { allowNegative: true })).toBe("-10000");
  });

  it("отклоняет неверный ввод", () => {
    expect(parseMoney("", "RUB")).toBeNull();
    expect(parseMoney("abc", "RUB")).toBeNull();
    expect(parseMoney("1,234", "RUB")).toBeNull();
    expect(parseMoney("1.5", "JPY")).toBeNull();
    expect(parseMoney("-100", "RUB")).toBeNull();
    expect(parseMoney("1".repeat(20), "RUB")).toBeNull();
  });

  it("готовит значение для поля ввода", () => {
    expect(toMoneyInput("123450", "RUB")).toBe("1234,50");
    expect(toMoneyInput("5", "RUB")).toBe("0,05");
    expect(toMoneyInput("-10000", "RUB")).toBe("-100,00");
    expect(toMoneyInput("1500", "JPY")).toBe("1500");
  });
});
