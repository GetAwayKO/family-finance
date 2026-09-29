"use client";
import { Chip } from "@mui/material";
import { formatDate } from "@/shared/finance/dates";
import { formatMoney } from "@/shared/finance/money";
import {
  dueLabel,
  reminderStatus,
  type ReminderStatus,
} from "@/shared/finance/planning";
import type { Account, RecurringPayment } from "@/shared/finance/types";

const STATUS_COLOR: Record<ReminderStatus, "error" | "warning" | "default"> = {
  overdue: "error",
  today: "warning",
  soon: "warning",
  later: "default",
  finished: "default",
};

/** Сумма платежа со знаком: расход «−», доход «+», перевод без знака. */
export function paymentAmount(
  payment: RecurringPayment,
  accounts: Map<string, Account>,
): string {
  // У перевода со скрытого счёта видна только сумма зачисления.
  const [minor, accountId] =
    payment.amount !== null
      ? [payment.amount, payment.accountId]
      : [payment.toAmount, payment.toAccountId];
  const account = accountId ? accounts.get(accountId) : undefined;
  if (!minor || !account) return "—";
  const sign =
    payment.type === "expense" ? "−" : payment.type === "income" ? "+" : "";
  return sign + formatMoney(minor, account.currency);
}

/** Дата следующего платежа и напоминание о нём. */
export function DueChip({
  payment,
  now,
}: {
  payment: RecurringPayment;
  now: string;
}) {
  const status = reminderStatus(payment, now);
  if (!payment.nextDate) return <Chip size="small" label="Закончился" />;
  return (
    <Chip
      size="small"
      color={STATUS_COLOR[status]}
      variant={status === "later" ? "outlined" : "filled"}
      label={
        status === "later"
          ? formatDate(payment.nextDate)
          : `${formatDate(payment.nextDate)} · ${dueLabel(payment.nextDate, now)}`
      }
    />
  );
}
