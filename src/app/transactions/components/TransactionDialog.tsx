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
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import { categoryTree } from "@/shared/finance/categories";
import { today } from "@/shared/finance/dates";
import { parseMoney, toMoneyInput } from "@/shared/finance/money";
import {
  TRANSACTION_TYPE_LABELS,
  type Account,
  type Category,
  type CurrencyCode,
  type SaveTransaction,
  type Transaction,
  type TransactionType,
} from "@/shared/finance/types";

interface TransactionDialogProps {
  /** Операция для редактирования; без неё — создание. */
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  onClose(): void;
  onSaved(): void;
}

export default function TransactionDialog({
  transaction,
  accounts,
  categories,
  onClose,
  onSaved,
}: TransactionDialogProps) {
  // id создаём один раз на открытие формы: повторная отправка после сбоя
  // сети вернёт уже созданную операцию, а не создаст вторую.
  const [id] = useState(() => transaction?.id ?? crypto.randomUUID());
  // Операции проводятся только по своим и общим счетам.
  const usable = accounts.filter((a) => a.canTransact);
  const active = usable.filter((a) => !a.archived);
  const accountOf = (accountId: string | null | undefined) =>
    accounts.find((a) => a.id === accountId);

  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "expense",
  );
  const [date, setDate] = useState(transaction?.date ?? today());
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? active[0]?.id ?? "",
  );
  const account = accountOf(accountId);
  const [amount, setAmount] = useState(
    transaction?.amount && account
      ? toMoneyInput(transaction.amount, account.currency)
      : "",
  );
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [toAccountId, setToAccountId] = useState(
    transaction?.toAccountId ??
      active.find((a) => a.id !== accountId)?.id ??
      "",
  );
  const toAccount = accountOf(toAccountId);
  const [toAmount, setToAmount] = useState(
    transaction?.toAmount && toAccount
      ? toMoneyInput(transaction.toAmount, toAccount.currency)
      : "",
  );
  // Пока пользователь не правил сумму зачисления, подставляем её по курсу.
  const [toAmountTouched, setToAmountTouched] = useState(!!transaction);
  const [comment, setComment] = useState(transaction?.comment ?? "");
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

  useEffect(() => {
    if (!crossCurrency || toAmountTouched || !amountMinor) return;
    let cancelled = false;
    api
      .GET("/exchange-rates/convert", {
        params: {
          query: {
            amount: amountMinor,
            from: account!.currency as CurrencyCode,
            to: toAccount!.currency as CurrencyCode,
            date,
          },
        },
      })
      .then(({ data }) => {
        if (!cancelled && data?.amount) {
          setToAmount(toMoneyInput(data.amount, toAccount!.currency));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [crossCurrency, toAmountTouched, amountMinor, account, toAccount, date]);

  const accountOptions = (selected: string) =>
    usable.filter((a) => !a.archived || a.id === selected);
  const categoryOptions = isTransfer
    ? []
    : categoryTree(categories, type).filter(
        ({ category }) => !category.archived || category.id === categoryId,
      );

  const valid =
    !!date &&
    !!account &&
    amountMinor !== null &&
    amountMinor !== "0" &&
    (isTransfer
      ? !!toAccount &&
        toAccountId !== accountId &&
        (!crossCurrency || (toAmountMinor !== null && toAmountMinor !== "0"))
      : !!categoryId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    const body: SaveTransaction = {
      type,
      date,
      accountId,
      amount: amountMinor!,
      comment: comment.trim(),
      ...(isTransfer
        ? { toAccountId, toAmount: crossCurrency ? toAmountMinor : null }
        : { categoryId }),
    };
    setSaving(true);
    setError(null);
    try {
      await call(() =>
        transaction
          ? api.PUT("/transactions/{id}", { params: { path: { id } }, body })
          : api.POST("/transactions", { body: { ...body, id } }),
      );
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Удалить операцию?")) return;
    setSaving(true);
    try {
      await call(() =>
        api.DELETE("/transactions/{id}", { params: { path: { id } } }),
      );
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось удалить");
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{transaction ? "Операция" : "Новая операция"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {usable.length === 0 && (
              <Alert severity="info">
                Сначала добавьте счёт в разделе «Счета».
              </Alert>
            )}
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
            <TextField
              label="Дата"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label={isTransfer ? "Со счёта" : "Счёт"}
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                setToAmountTouched(false);
              }}
              required
            >
              {accountOptions(accountId).map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={`Сумма${account ? `, ${account.currency}` : ""}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus={!transaction}
              error={amount !== "" && amountMinor === null}
              helperText={
                amount !== "" && amountMinor === null
                  ? "Введите положительную сумму, например 1500,50"
                  : undefined
              }
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
            {isTransfer ? (
              <>
                <TextField
                  select
                  label="На счёт"
                  value={toAccountId}
                  onChange={(e) => {
                    setToAccountId(e.target.value);
                    setToAmountTouched(false);
                  }}
                  required
                  error={!!toAccountId && toAccountId === accountId}
                  helperText={
                    toAccountId && toAccountId === accountId
                      ? "Выберите другой счёт"
                      : undefined
                  }
                >
                  {accountOptions(toAccountId).map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </MenuItem>
                  ))}
                </TextField>
                {crossCurrency && (
                  <TextField
                    label={`Зачислено, ${toAccount!.currency}`}
                    value={toAmount}
                    onChange={(e) => {
                      setToAmount(e.target.value);
                      setToAmountTouched(true);
                    }}
                    required
                    error={toAmount !== "" && toAmountMinor === null}
                    helperText="Подставлено по курсу ЦБ, поправьте по факту"
                    slotProps={{ htmlInput: { inputMode: "decimal" } }}
                  />
                )}
              </>
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
            <TextField
              label="Комментарий"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              multiline
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {transaction && (
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
