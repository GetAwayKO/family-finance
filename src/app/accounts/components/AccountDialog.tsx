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
import { parseMoney, toMoneyInput } from "@/shared/finance/money";
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
  type Currency,
  type CurrencyCode,
} from "@/shared/finance/types";

interface AccountDialogProps {
  /** Счёт для редактирования; без него — создание. */
  account?: Account;
  currencies: Currency[];
  onClose(): void;
  onSaved(): void;
}

export default function AccountDialog({
  account,
  currencies,
  onClose,
  onSaved,
}: AccountDialogProps) {
  // id нового счёта создаём один раз: повтор после сбоя сети не создаст дубль.
  const [id] = useState(() => account?.id ?? crypto.randomUUID());
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "card");
  const [currency, setCurrency] = useState(account?.currency ?? "RUB");
  const [initialBalance, setInitialBalance] = useState(
    account ? toMoneyInput(account.initialBalance, account.currency) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initialMinor =
    initialBalance.trim() === ""
      ? "0"
      : parseMoney(initialBalance, currency, { allowNegative: true });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (initialMinor === null) return;
    setSaving(true);
    setError(null);
    try {
      const body = { name: name.trim(), type, initialBalance: initialMinor };
      await call(() =>
        account
          ? api.PATCH("/accounts/{id}", { params: { path: { id } }, body })
          : api.POST("/accounts", {
              body: { ...body, id, currency: currency as CurrencyCode },
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
        <DialogTitle>{account ? "Счёт" : "Новый счёт"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              select
              label="Тип"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
            >
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Валюта"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!!account}
              helperText={account ? "Валюту счёта изменить нельзя" : undefined}
            >
              {currencies.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Начальный остаток"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0"
              error={initialMinor === null}
              helperText={
                initialMinor === null
                  ? "Введите сумму, например 1500,50"
                  : "Сколько было на счёте до первой операции"
              }
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !name.trim() || initialMinor === null}
          >
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
