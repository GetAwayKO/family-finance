"use client";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import Page from "@/components/layout/Page";
import { categoryLabel } from "@/shared/finance/categories";
import { today } from "@/shared/finance/dates";
import {
  useAccounts,
  useCategories,
  useRecurringPayments,
} from "@/shared/finance/hooks";
import { frequencyLabel } from "@/shared/finance/planning";
import type { RecurringPayment } from "@/shared/finance/types";
import PayDialog from "./components/PayDialog";
import { DueChip, paymentAmount } from "./components/PaymentSummary";
import RecurringDialog from "./components/RecurringDialog";

export default function RecurringPage() {
  const payments = useRecurringPayments();
  const accounts = useAccounts();
  const categories = useCategories();
  const [editing, setEditing] = useState<RecurringPayment | "new" | null>(null);
  const [paying, setPaying] = useState<RecurringPayment | null>(null);
  const now = today();

  const accountById = useMemo(
    () => new Map((accounts.data ?? []).map((a) => [a.id, a])),
    [accounts.data],
  );
  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c])),
    [categories.data],
  );
  const ready = accounts.data && categories.data;
  const list = payments.data ?? [];

  const target = (p: RecurringPayment) =>
    p.type === "transfer"
      ? `${accountById.get(p.accountId)?.name ?? "—"} → ${
          accountById.get(p.toAccountId ?? "")?.name ?? "—"
        }`
      : `${categoryLabel(categoryById.get(p.categoryId ?? ""), categoryById)} · ${
          accountById.get(p.accountId)?.name ?? "—"
        }`;

  return (
    <Page
      title="Регулярные платежи"
      error={payments.error ?? accounts.error ?? categories.error}
      actions={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditing("new")}
          disabled={!ready}
        >
          Добавить платёж
        </Button>
      }
    >
      <Typography color="text.secondary">
        Аренда, связь, подписки, зарплата. Когда подходит срок, платёж
        появляется на главной — его можно провести в один клик, и операция
        запишется сама.
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Платёж</TableCell>
              <TableCell align="right">Сумма</TableCell>
              <TableCell>Расписание</TableCell>
              <TableCell>Следующий</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.data && list.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    Регулярных платежей пока нет.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {list.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 500 }}>{p.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ready ? target(p) : ""}
                  </Typography>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    color: p.type === "income" ? "success.main" : undefined,
                  }}
                >
                  {paymentAmount(p, accountById)}
                </TableCell>
                <TableCell>{frequencyLabel(p.frequency, p.interval)}</TableCell>
                <TableCell>
                  <DueChip payment={p} now={now} />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  {p.canPay && p.nextDate && ready && (
                    <Button size="small" onClick={() => setPaying(p)}>
                      Провести
                    </Button>
                  )}
                  {p.canEdit && ready && (
                    <Tooltip title="Изменить">
                      <IconButton size="small" onClick={() => setEditing(p)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {editing && ready && (
        <RecurringDialog
          payment={editing === "new" ? undefined : editing}
          accounts={accounts.data!}
          categories={categories.data!}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            payments.reload();
          }}
        />
      )}
      {paying && ready && (
        <PayDialog
          payment={paying}
          accounts={accounts.data!}
          onClose={() => setPaying(null)}
          onDone={() => {
            setPaying(null);
            payments.reload();
            accounts.reload();
          }}
        />
      )}
    </Page>
  );
}
