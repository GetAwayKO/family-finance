import type { Category, CategoryKind } from "./types";

export interface CategoryNode {
  category: Category;
  /** 0 — верхний уровень, 1 — подкатегория. */
  depth: 0 | 1;
}

/** Категории в порядке дерева: родитель, за ним его подкатегории. */
export function categoryTree(
  categories: Category[],
  kind?: CategoryKind,
): CategoryNode[] {
  const own = categories.filter((c) => !kind || c.kind === kind);
  const ids = new Set(own.map((c) => c.id));
  const result: CategoryNode[] = [];
  for (const parent of own) {
    // Подкатегорию с потерянным родителем показываем на верхнем уровне.
    if (parent.parentId && ids.has(parent.parentId)) continue;
    result.push({ category: parent, depth: 0 });
    for (const child of own) {
      if (child.parentId === parent.id) {
        result.push({ category: child, depth: 1 });
      }
    }
  }
  return result;
}

/** "Транспорт / Такси" для подкатегории. */
export function categoryLabel(
  category: Category | undefined,
  byId: Map<string, Category>,
): string {
  if (!category) return "—";
  const parent = category.parentId ? byId.get(category.parentId) : undefined;
  return parent ? `${parent.name} / ${category.name}` : category.name;
}
