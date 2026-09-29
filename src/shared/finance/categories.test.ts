import { describe, expect, it } from "vitest";
import { categoryLabel, categoryTree } from "./categories";
import type { Category } from "./types";

const category = (
  id: string,
  kind: Category["kind"],
  parentId: string | null = null,
): Category => ({ id, name: id, kind, parentId, archived: false });

describe("categoryTree", () => {
  const list = [
    category("Такси", "expense", "Транспорт"),
    category("Транспорт", "expense"),
    category("Зарплата", "income"),
    category("Продукты", "expense"),
  ];

  it("ставит подкатегории после родителя и фильтрует по типу", () => {
    expect(
      categoryTree(list, "expense").map(
        (n) => `${"-".repeat(n.depth)}${n.category.id}`,
      ),
    ).toEqual(["Транспорт", "-Такси", "Продукты"]);
  });

  it("подписывает подкатегорию вместе с родителем", () => {
    const byId = new Map(list.map((c) => [c.id, c]));
    expect(categoryLabel(byId.get("Такси"), byId)).toBe("Транспорт / Такси");
    expect(categoryLabel(undefined, byId)).toBe("—");
  });
});
