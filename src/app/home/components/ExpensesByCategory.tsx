"use client";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Alert, IconButton, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

// Дальше длинный хвост мелких категорий сворачиваем в «Другое».
const TOP = 7;

export default function ExpensesByCategory({ version }: { version: unknown }) {
  const [offset, setOffset] = useState(0);
  const period = monthRange(offset);
  const report = useApi(
    () =>
      api.GET("/reports/categories", {
        params: { query: { ...period, kind: "expense" } },
      }),
    [period.from, version],
  );
  const data = report.data;
  const currency = data?.currency ?? "RUB";

  const items = data?.items ?? [];
  const rest = items.slice(TOP);
  const rows = [
    ...items.slice(0, TOP).map((i) => ({ name: i.name, amount: i.amount })),
    ...(rest.length
      ? [
          {
            name: "Другое",
            amount: rest
              .reduce((sum, i) => sum + BigInt(i.amount), BigInt(0))
              .toString(),
          },
        ]
      : []),
  ].map((row) => ({ ...row, value: toUnits(row.amount, currency) }));

  return (
    <Paper sx={{ p: 3, minWidth: 0 }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="h6" component="h3" sx={{ mb: 0 }}>
          Расходы по категориям
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center" }}>
          <IconButton
            aria-label="Предыдущий месяц"
            onClick={() => setOffset((o) => o - 1)}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography sx={{ minWidth: 100, textAlign: "center" }}>
            {formatMonth(period.from.slice(0, 7))}
          </Typography>
          <IconButton
            aria-label="Следующий месяц"
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>
      {data && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Всего {formatMoney(data.total, currency)}
        </Typography>
      )}
      {report.error && <Alert severity="error">{report.error}</Alert>}
      {data && rows.length === 0 && (
        <Typography color="text.secondary">
          В этом месяце расходов нет.
        </Typography>
      )}
      {rows.length > 0 && (
        <ResponsiveContainer width="100%" height={rows.length * 40 + 30}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
            barCategoryGap={6}
          >
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis
              type="number"
              tickFormatter={compact}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: AXIS_TEXT, fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              formatter={(_, __, item) => [
                formatMoney(item.payload.amount, currency),
                "Расходы",
              ]}
            />
            <Bar
              dataKey="value"
              fill={SERIES.expense}
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}
