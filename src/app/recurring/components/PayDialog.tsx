"use client";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import { formatDate } from "@/shared/finance/dates";
import { parseMoney, toMoneyInput } from "@/shared/finance/money";
import type { Account, RecurringPayment } from "@/shared/finance/types";

interface PayDialogProps {
  /** Платёж с nextDate: проводим именно это повторение. */
  payment: RecurringPayment;
  accounts: Account[];
  onClose(): void;
  onDone(): void;
}

/** Проведение или пропуск ближайшего повторения регулярного платежа. */
export default function PayDialog({
  payment,
  accounts,
  onClose,
  onDone,
}: PayDialogProps) {
  const occurrence = payment.nextDate!;
  // id операции создаём один раз: повтор после сбоя сети не проведёт платёж дважды.
  const [transactionId] = useState(() => crypto.randomUUID());
  const account = accounts.find((a) => a.id === payment.accountId);
  const toAccount = accounts.find((a) => a.id === payment.toAccountId);
  const crossCurrency =
    !!account && !!toAccount && account.currency !== toAccount.currency;

  const [date, setDate] = useState(occurrence);
  const [amount, setAmount] = useState(
    payment.amount && account
      ? toMoneyInput(payment.amount, account.currency)
      : "",
  );
  const [toAmount, setToAmount] = useState(
    payment.toAmount && toAccount
      ? toMoneyInput(payment.toAmount, toAccount.currency)
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const amountMinor = account ? parseMoney(amount, account.currency) : null;
  const toAmountMinor =
    crossCurrency && toAccount
      ? parseMoney(toAmount, toAccount.currency)
      : null;
  const valid =
    !!date &&
    amountMinor !== null &&
    amountMinor !== "0" &&
    (!crossCurrency || (toAmountMinor !== null && toAmountMinor !== "0"));

  async function send(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось выполнить");
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    void send(() =>
      call(() =>
        api.POST("/recurring-payments/{id}/pay", {
          params: { path: { id: payment.id } },
          body: {
            transactionId,
            occurrence,
            date,
            amount: amountMinor!,
            ...(crossCurrency ? { toAmount: toAmountMinor! } : {}),
          },
        }),
      ),
    );
  }

  function handleSkip() {
    if (!window.confirm(`Пропустить платёж за ${formatDate(occurrence)}?`)) {
      return;
    }
    void send(() =>
      call(() =>
        api.POST("/recurring-payments/{id}/skip", {
          params: { path: { id: payment.id } },
          body: { occurrence },
        }),
      ),
    );
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Провести «{payment.name}»</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Платёж за {formatDate(occurrence)}. Будет создана операция, а
              следующий платёж сдвинется по расписанию.
            </Typography>
            <TextField
              label="Дата операции"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={`Сумма${account ? `, ${account.currency}` : ""}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
              error={amount !== "" && amountMinor === null}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
            {crossCurrency && (
              <TextField
                label={`Зачислено, ${toAccount!.currency}`}
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                required
                error={toAmount !== "" && toAmountMinor === null}
                slotProps={{ htmlInput: { inputMode: "decimal" } }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSkip} disabled={saving} sx={{ mr: "auto" }}>
            Пропустить
          </Button>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={saving || !valid}>
            Провести
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
