import { describe, expect, it } from "vitest";
import { formatDate, monthRange, toApiDate } from "./dates";

describe("dates", () => {
  it("форматирует дату для API по местному времени", () => {
    expect(toApiDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("считает границы месяца, в том числе через год", () => {
    const now = new Date(2026, 0, 15);
    expect(monthRange(0, now)).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
    expect(monthRange(-1, now)).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
    expect(monthRange(1, now)).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  it("показывает дату по-русски", () => {
    expect(formatDate("2026-09-29")).toBe("29.09.2026");
  });
});
