"use client";
import { Alert, Paper, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/shared/api/client";
import { useApi } from "@/shared/api/request";
import { formatMonth, monthRange } from "@/shared/finance/dates";
import { formatMoney } from "@/shared/finance/money";
import { AXIS_TEXT, compact, GRID, SERIES, toUnits } from "./charts";

const MONTHS = 12;

export default function MonthlyChart({ version }: { version: unknown }) {
  const from = monthRange(1 - MONTHS).from;
  const to = monthRange(0).to;
  const report = useApi(
    () => api.GET("/reports/monthly", { params: { query: { from, to } } }),
    [from, version],
  );
  const currency = report.data?.currency ?? "RUB";
  const rows = (report.data?.months ?? []).map((m) => ({
    ...m,
    label: formatMonth(m.month),
    incomeValue: toUnits(m.income, currency),
    expenseValue: toUnits(m.expense, currency),
  }));

  return (
    <Paper sx={{ p: 3, minWidth: 0 }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Доходы и расходы по месяцам
      </Typography>
      {report.error && <Alert severity="error">{report.error}</Alert>}
      {report.data && report.data.missingRates.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Нет курса для {report.data.missingRates.join(", ")} — эти операции не
          вошли в отчёт.
        </Alert>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={rows} barGap={2} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={compact}
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            formatter={(_, name, item) => [
              formatMoney(
                name === "Доходы" ? item.payload.income : item.payload.expense,
                currency,
              ),
              name,
            ]}
          />
          <Legend iconType="circle" />
          <Bar
            dataKey="incomeValue"
            name="Доходы"
            fill={SERIES.income}
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          />
          <Bar
            dataKey="expenseValue"
            name="Расходы"
            fill={SERIES.expense}
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
