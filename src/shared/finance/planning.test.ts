import { describe, expect, it } from "vitest";
import {
  dueLabel,
  frequencyLabel,
  monthlyNeeded,
  monthsLeft,
  percent,
  reminderStatus,
} from "./planning";

describe("планирование", () => {
  it("состояние напоминания о платеже", () => {
    const at = (nextDate: string | null) =>
      reminderStatus({ nextDate, remindDaysBefore: 3 }, "2026-09-29");
    expect(at("2026-09-27")).toBe("overdue");
    expect(at("2026-09-29")).toBe("today");
    expect(at("2026-10-02")).toBe("soon");
    expect(at("2026-10-03")).toBe("later");
    expect(at(null)).toBe("finished");
  });

  it("подписи сроков и расписаний по-русски", () => {
    expect(dueLabel("2026-09-27", "2026-09-29")).toBe("Просрочен на 2 дня");
    expect(dueLabel("2026-09-30", "2026-09-29")).toBe("Завтра");
    expect(dueLabel("2026-10-04", "2026-09-29")).toBe("Через 5 дней");
    expect(frequencyLabel("monthly", 1)).toBe("Каждый месяц");
    expect(frequencyLabel("weekly", 2)).toBe("Раз в 2 недели");
    expect(frequencyLabel("monthly", 3)).toBe("Раз в 3 месяца");
    expect(frequencyLabel("yearly", 5)).toBe("Раз в 5 лет");
  });

  it("процент без потери точности на больших суммах", () => {
    expect(percent("250", "1000")).toBe(25);
    expect(percent("999999999999999999", "999999999999999999")).toBe(100);
    expect(percent("1500", "1000")).toBe(150);
    expect(percent("1", "0")).toBe(0);
  });

  it("сколько откладывать в месяц до срока цели", () => {
    expect(monthsLeft("2026-09-29", "2026-09-30")).toBe(1);
    expect(monthsLeft("2026-09-29", "2027-02-01")).toBe(6);
    expect(monthsLeft("2026-09-29", "2026-09-01")).toBe(0);
    // 100 000,00 за 3 месяца — с округлением вверх до копейки.
    expect(monthlyNeeded("10000000", "0", "2026-09-29", "2026-11-30")).toBe(
      "3333334",
    );
    expect(monthlyNeeded("100", "100", "2026-09-29", null)).toBe("0");
    expect(monthlyNeeded("100", "10", "2026-09-29", null)).toBeNull();
    expect(monthlyNeeded("100", "10", "2026-09-29", "2026-01-01")).toBeNull();
  });
});
