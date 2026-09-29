"use client";
import { MenuItem, Paper, TextField } from "@mui/material";
import { categoryTree } from "@/shared/finance/categories";
import {
  TRANSACTION_TYPE_LABELS,
  type Account,
  type Category,
  type FamilyMember,
  type TransactionType,
} from "@/shared/finance/types";

export interface Filters {
  from: string;
  to: string;
  type: TransactionType | "";
  accountId: string;
  categoryId: string;
  authorId: string;
  search: string;
}

interface TransactionFiltersProps {
  value: Filters;
  onChange(next: Filters): void;
  /** Счета, операции по которым видны пользователю. */
  accounts: Account[];
  categories: Category[];
  members: FamilyMember[];
}

export default function TransactionFilters({
  value,
  onChange,
  accounts,
  categories,
  members,
}: TransactionFiltersProps) {
  const set = <K extends keyof Filters>(key: K, next: Filters[K]) =>
    onChange({ ...value, [key]: next });
  const kind =
    value.type === "income" || value.type === "expense"
      ? value.type
      : undefined;

  return (
    <Paper
      sx={{
        p: 2,
        display: "grid",
        gap: 2,
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      }}
    >
      <TextField
        label="С даты"
        type="date"
        size="small"
        value={value.from}
        onChange={(e) => set("from", e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        label="По дату"
        type="date"
        size="small"
        value={value.to}
        onChange={(e) => set("to", e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        select
        label="Тип"
        size="small"
        value={value.type}
        onChange={(e) => {
          const type = e.target.value as Filters["type"];
          const category = categories.find((c) => c.id === value.categoryId);
          // Категория доходов не подходит к фильтру по расходам и наоборот,
          // а у перевода категории нет вовсе.
          const keepCategory =
            !!category && (type === "" || type === category.kind);
          onChange({
            ...value,
            type,
            categoryId: keepCategory ? value.categoryId : "",
          });
        }}
      >
        <MenuItem value="">Все</MenuItem>
        {Object.entries(TRANSACTION_TYPE_LABELS).map(([type, label]) => (
          <MenuItem key={type} value={type}>
            {label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Счёт"
        size="small"
        value={value.accountId}
        onChange={(e) => set("accountId", e.target.value)}
      >
        <MenuItem value="">Все</MenuItem>
        {accounts.map((a) => (
          <MenuItem key={a.id} value={a.id}>
            {a.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Категория"
        size="small"
        value={value.categoryId}
        onChange={(e) => set("categoryId", e.target.value)}
        disabled={value.type === "transfer"}
      >
        <MenuItem value="">Все</MenuItem>
        {categoryTree(categories, kind).map(({ category, depth }) => (
          <MenuItem
            key={category.id}
            value={category.id}
            sx={{ pl: 2 + depth * 3 }}
          >
            {category.name}
          </MenuItem>
        ))}
      </TextField>
      {members.length > 1 && (
        <TextField
          select
          label="Автор"
          size="small"
          value={value.authorId}
          onChange={(e) => set("authorId", e.target.value)}
        >
          <MenuItem value="">Все</MenuItem>
          {members.map((m) => (
            <MenuItem key={m.userId} value={m.userId}>
              {m.name}
            </MenuItem>
          ))}
        </TextField>
      )}
      <TextField
        label="Поиск по комментарию"
        size="small"
        value={value.search}
        onChange={(e) => set("search", e.target.value)}
        slotProps={{ htmlInput: { maxLength: 100 } }}
      />
    </Paper>
  );
}
