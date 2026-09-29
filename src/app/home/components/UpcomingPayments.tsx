"use client";
import {
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/shared/api/client";
import { useApi } from "@/shared/api/request";
import { today } from "@/shared/finance/dates";
import { isDue, reminderStatus } from "@/shared/finance/planning";
import type { Account, RecurringPayment } from "@/shared/finance/types";
import PayDialog from "../../recurring/components/PayDialog";
import {
  DueChip,
  paymentAmount,
} from "../../recurring/components/PaymentSummary";

// Если напоминать не о чем, показываем несколько ближайших платежей.
const NEXT = 3;

interface UpcomingPaymentsProps {
  accounts: Account[];
  version: unknown;
  /** Платёж проведён: остатки и отчёты нужно обновить. */
  onPaid(): void;
}

/** Напоминания о регулярных платежах, срок которых подошёл. */
export default function UpcomingPayments({
  accounts,
  version,
  onPaid,
}: UpcomingPaymentsProps) {
  const payments = useApi(() => api.GET("/recurring-payments"), [version]);
  const [paying, setPaying] = useState<RecurringPayment | null>(null);
  const now = today();
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const active = (payments.data ?? []).filter((p) => p.nextDate);
  if (payments.data && active.length === 0) return null;
  const due = active.filter((p) => isDue(reminderStatus(p, now)));
  const shown = due.length > 0 ? due : active.slice(0, NEXT);

  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="h6" component="h3" sx={{ mb: 0 }}>
          {due.length > 0 ? "Пора платить" : "Ближайшие платежи"}
        </Typography>
        <Button component={Link} href="/recurring" size="small">
          Все платежи
        </Button>
      </Stack>
      {payments.error && <Alert severity="error">{payments.error}</Alert>}
      <List dense disablePadding>
        {shown.map((p) => (
          <ListItem
            key={p.id}
            disableGutters
            secondaryAction={
              p.canPay && (
                <Button size="small" onClick={() => setPaying(p)}>
                  Провести
                </Button>
              )
            }
            sx={{ pr: p.canPay ? 12 : 0 }}
          >
            <ListItemText
              primary={
                <Stack
                  direction="row"
                  sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}
                >
                  <span>{p.name}</span>
                  <DueChip payment={p} now={now} />
                </Stack>
              }
              secondary={paymentAmount(p, accountById)}
            />
          </ListItem>
        ))}
      </List>
      {paying && (
        <PayDialog
          payment={paying}
          accounts={accounts}
          onClose={() => setPaying(null)}
          onDone={() => {
            setPaying(null);
            payments.reload();
            onPaid();
          }}
        />
      )}
    </Paper>
  );
}
