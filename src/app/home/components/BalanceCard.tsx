"use client";
import {
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { api } from "@/shared/api/client";
import { useApi } from "@/shared/api/request";
import { formatMoney } from "@/shared/finance/money";
import type { Account } from "@/shared/finance/types";

export default function BalanceCard({ accounts }: { accounts: Account[] }) {
  const report = useApi(() => api.GET("/reports/balance"), [accounts]);
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const rows = (report.data?.accounts ?? []).filter(
    (row) => !byId.get(row.accountId)?.archived,
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="overline" color="text.secondary">
        Общий баланс
      </Typography>
      {report.data ? (
        <Typography
          variant="h4"
          component="p"
          sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
        >
          {formatMoney(report.data.total, report.data.currency)}
        </Typography>
      ) : (
        <Skeleton variant="text" width={200} height={48} />
      )}
      {report.error && <Alert severity="error">{report.error}</Alert>}
      {report.data && report.data.missingRates.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Нет курса для {report.data.missingRates.join(", ")} — эти счета не
          вошли в итог.
        </Alert>
      )}
      <Divider sx={{ my: 2 }} />
      {report.data && rows.length === 0 && (
        <Typography color="text.secondary">
          Счетов пока нет. <Link href="/accounts">Добавить счёт</Link>
        </Typography>
      )}
      <List dense disablePadding>
        {rows.map((row) => (
          <ListItem
            key={row.accountId}
            disableGutters
            secondaryAction={
              <Typography
                variant="body2"
                color={row.balance.startsWith("-") ? "error" : "text.primary"}
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatMoney(row.balance, row.currency)}
              </Typography>
            }
          >
            <ListItemText
              primary={byId.get(row.accountId)?.name}
              secondary={
                row.currency !== report.data!.currency && row.converted
                  ? `≈ ${formatMoney(row.converted, report.data!.currency)}`
                  : undefined
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
