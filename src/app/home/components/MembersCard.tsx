"use client";
import {
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { api } from "@/shared/api/client";
import { useApi } from "@/shared/api/request";
import { formatMonth, monthRange } from "@/shared/finance/dates";
import { formatMoney } from "@/shared/finance/money";

/** Доходы и расходы участников семьи за текущий месяц. */
export default function MembersCard({ version }: { version: unknown }) {
  const period = monthRange();
  const report = useApi(
    () => api.GET("/reports/members", { params: { query: period } }),
    [period.from, version],
  );
  const data = report.data;

  return (
    <Paper sx={{ p: 3, minWidth: 0 }}>
      <Typography variant="h6" component="h3">
        Участники · {formatMonth(period.from.slice(0, 7))}
      </Typography>
      {report.error && <Alert severity="error">{report.error}</Alert>}
      {data && data.items.length === 0 && (
        <Typography color="text.secondary">
          В этом месяце операций нет.
        </Typography>
      )}
      {data && data.items.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Участник</TableCell>
              <TableCell align="right">Доходы</TableCell>
              <TableCell align="right">Расходы</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((item) => (
              <TableRow key={item.userId}>
                <TableCell>{item.name}</TableCell>
                <TableCell
                  align="right"
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatMoney(item.income, data.currency)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatMoney(item.expense, data.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
