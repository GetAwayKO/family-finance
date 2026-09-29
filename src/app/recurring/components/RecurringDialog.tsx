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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import { categoryTree } from "@/shared/finance/categories";
import { today } from "@/shared/finance/dates";
import { parseMoney, toMoneyInput } from "@/shared/finance/money";
import { frequencyLabel } from "@/shared/finance/planning";
import {
  TRANSACTION_TYPE_LABELS,
  type Account,
  type Category,
  type RecurrenceFrequency,
  type RecurringPayment,
  type SaveRecurringPayment,
  type TransactionType,
} from "@/shared/finance/types";

interface RecurringDialogProps {
  /** Платёж для редактирования; без него — создание. */
  payment?: RecurringPayment;
  accounts: Account[];
  categories: Category[];
  onClose(): void;
  onSaved(): void;
}

const FREQUENCIES: RecurrenceFrequency[] = ["monthly", "weekly", "yearly"];

export default function RecurringDialog({
  payment,
  accounts,
  categories,
  onClose,
  onSaved,
}: RecurringDialogProps) {
  // id создаём один раз на открытие формы: повтор после сбоя не создаст дубль.
  const [id] = useState(() => payment?.id ?? crypto.randomUUID());
  // Платёж по счёту может завести тот, кто проводит по нему операции.
  const usable = accounts.filter((a) => a.canTransact);
  const accountOf = (accountId: string) =>
    accounts.find((a) => a.id === accountId);
  const accountOptions = (selected: string) =>
    usable.filter((a) => !a.archived || a.id === selected);

  const [name, setName] = useState(payment?.name ?? "");
  const [type, setType] = useState<TransactionType>(payment?.type ?? "expense");
  const [accountId, setAccountId] = useState(
    payment?.accountId ?? usable.find((a) => !a.archived)?.id ?? "",
  );
  const account = accountOf(accountId);
  const [amount, setAmount] = useState(
    payment?.amount && account
      ? toMoneyInput(payment.amount, account.currency)
      : "",
  );
  const [categoryId, setCategoryId] = useState(payment?.categoryId ?? "");
  const [toAccountId, setToAccountId] = useState(payment?.toAccountId ?? "");
  const toAccount = accountOf(toAccountId);
  const [toAmount, setToAmount] = useState(
    payment?.toAmount && toAccount
      ? toMoneyInput(payment.toAmount, toAccount.currency)
      : "",
  );
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    payment?.frequency ?? "monthly",
  );
  const [every, setEvery] = useState(String(payment?.interval ?? 1));
  const [nextDate, setNextDate] = useState(payment?.nextDate ?? today());
  const [endDate, setEndDate] = useState(payment?.endDate ?? "");
  const [remind, setRemind] = useState(String(payment?.remindDaysBefore ?? 3));
  const [comment, setComment] = useState(payment?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isTransfer = type === "transfer";
  const crossCurrency =
    isTransfer &&
    !!account &&
    !!toAccount &&
    account.currency !== toAccount.currency;
  const amountMinor = account ? parseMoney(amount, account.currency) : null;
  const toAmountMinor =
    crossCurrency && toAccount
      ? parseMoney(toAmount, toAccount.currency)
      : null;
  const intervalNumber = Number(every);
  const remindNumber = Number(remind);
  const categoryOptions = isTransfer
    ? []
    : categoryTree(categories, type).filter(
        ({ category }) => !category.archived || category.id === categoryId,
      );

  const valid =
    !!name.trim() &&
    !!account &&
    amountMinor !== null &&
    amountMinor !== "0" &&
    Number.isInteger(intervalNumber) &&
    intervalNumber >= 1 &&
    intervalNumber <= 99 &&
    Number.isInteger(remindNumber) &&
    remindNumber >= 0 &&
    remindNumber <= 60 &&
    !!nextDate &&
    (!endDate || endDate >= nextDate) &&
    (isTransfer
      ? !!toAccount &&
        toAccountId !== accountId &&
        (!crossCurrency || (toAmountMinor !== null && toAmountMinor !== "0"))
      : !!categoryId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    const body: SaveRecurringPayment = {
      name: name.trim(),
      type,
      accountId,
      amount: amountMinor!,
      comment: comment.trim(),
      frequency,
      interval: intervalNumber,
      nextDate,
      endDate: endDate || null,
      remindDaysBefore: remindNumber,
      ...(isTransfer
        ? { toAccountId, toAmount: crossCurrency ? toAmountMinor : null }
        : { categoryId }),
    };
    setSaving(true);
    setError(null);
    try {
      await call(() =>
        payment
          ? api.PUT("/recurring-payments/{id}", {
              params: { path: { id } },
              body,
            })
          : api.POST("/recurring-payments", { body: { ...body, id } }),
      );
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Удалить регулярный платёж «${payment!.name}»?`)) {
      return;
    }
    setSaving(true);
    try {
      await call(() =>
        api.DELETE("/recurring-payments/{id}", { params: { path: { id } } }),
      );
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось удалить");
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {payment ? "Регулярный платёж" : "Новый регулярный платёж"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {usable.length === 0 && (
              <Alert severity="info">
                Сначала добавьте счёт в разделе «Счета».
              </Alert>
            )}
            <TextField
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus={!payment}
              placeholder="Аренда, интернет, зарплата"
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <ToggleButtonGroup
              exclusive
              fullWidth
              color="primary"
              value={type}
              onChange={(_, next: TransactionType | null) => {
                if (!next) return;
                setType(next);
                setCategoryId("");
              }}
            >
              {(["expense", "income", "transfer"] as const).map((t) => (
                <ToggleButton key={t} value={t}>
                  {TRANSACTION_TYPE_LABELS[t]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                fullWidth
                label={isTransfer ? "Со счёта" : "Счёт"}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              >
                {accountOptions(accountId).map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label={`Сумма${account ? `, ${account.currency}` : ""}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                error={amount !== "" && amountMinor === null}
                helperText="Обычная сумма, при проведении её можно поправить"
                slotProps={{ htmlInput: { inputMode: "decimal" } }}
              />
            </Stack>
            {isTransfer ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="На счёт"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                  error={!!toAccountId && toAccountId === accountId}
                >
                  {accountOptions(toAccountId).map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </MenuItem>
                  ))}
                </TextField>
                {crossCurrency && (
                  <TextField
                    fullWidth
                    label={`Зачисляется, ${toAccount!.currency}`}
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    required
                    error={toAmount !== "" && toAmountMinor === null}
                  />
                )}
              </Stack>
            ) : (
              <TextField
                select
                label="Категория"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categoryOptions.map(({ category, depth }) => (
                  <MenuItem
                    key={category.id}
                    value={category.id}
                    sx={{ pl: 2 + depth * 3 }}
                  >
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Раз в"
                type="number"
                value={every}
                onChange={(e) => setEvery(e.target.value)}
                required
                sx={{ width: { sm: 110 } }}
                slotProps={{ htmlInput: { min: 1, max: 99 } }}
              />
              <TextField
                select
                fullWidth
                label="Период"
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as RecurrenceFrequency)
                }
                helperText={
                  intervalNumber >= 1
                    ? frequencyLabel(frequency, intervalNumber)
                    : undefined
                }
              >
                {FREQUENCIES.map((f) => (
                  <MenuItem key={f} value={f}>
                    {{ weekly: "неделя", monthly: "месяц", yearly: "год" }[f]}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Следующий платёж"
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                required
                helperText="Следующие даты считаются от неё"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Последний платёж"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                error={!!endDate && endDate < nextDate}
                helperText="Необязательно"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <TextField
              label="Напоминать за, дней"
              type="number"
              value={remind}
              onChange={(e) => setRemind(e.target.value)}
              required
              helperText="Платёж появится на главной за столько дней до даты"
              slotProps={{ htmlInput: { min: 0, max: 60 } }}
            />
            <TextField
              label="Комментарий к операции"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              helperText="Если пусто, в комментарий попадёт название"
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {payment && (
            <Button
              color="error"
              onClick={handleDelete}
              disabled={saving}
              sx={{ mr: "auto" }}
            >
              Удалить
            </Button>
          )}
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={saving || !valid}>
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
