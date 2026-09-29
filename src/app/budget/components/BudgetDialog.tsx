"use client";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import { formatMonth } from "@/shared/finance/dates";
import { parseMoney, toMoneyInput } from "@/shared/finance/money";
import type { BudgetItem, Category } from "@/shared/finance/types";

interface BudgetDialogProps {
  month: string;
  currency: string;
  /** Категории расходов верхнего уровня, которым можно задать лимит. */
  categories: Category[];
  /** Категория, для которой задаём или меняем лимит. */
  item?: Pick<BudgetItem, "categoryId" | "limit">;
  onClose(): void;
  onSaved(): void;
}

export default function BudgetDialog({
  month,
  currency,
  categories,
  item,
  onClose,
  onSaved,
}: BudgetDialogProps) {
  const [categoryId, setCategoryId] = useState(
    item?.categoryId ?? categories[0]?.id ?? "",
  );
  const [amount, setAmount] = useState(
    item?.limit ? toMoneyInput(item.limit, currency) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const amountMinor = parseMoney(amount, currency);
  const valid = !!categoryId && amountMinor !== null && amountMinor !== "0";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      // Лимит задаётся по месяцу и категории: повтор запроса ничего не меняет.
      await call(() =>
        api.PUT("/budgets/{month}/{categoryId}", {
          params: { path: { month, categoryId } },
          body: { amount: amountMinor! },
        }),
      );
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Лимит на {formatMonth(month)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              select
              label="Категория"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!item}
              required
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={`Лимит, ${currency}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
              error={amount !== "" && amountMinor === null}
              helperText="Подкатегории входят в лимит категории"
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={saving || !valid}>
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
