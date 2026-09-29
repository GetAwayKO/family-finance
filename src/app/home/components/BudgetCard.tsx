"use client";
import {
  Alert,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { api } from "@/shared/api/client";
import { useApi } from "@/shared/api/request";
import { monthRange } from "@/shared/finance/dates";
import { percent } from "@/shared/finance/planning";
import BudgetRow from "../../budget/components/BudgetRow";

// Показываем категории, которые ближе всего к лимиту.
const TOP = 4;

/** Бюджет текущего месяца: всего и самые «горячие» категории. */
export default function BudgetCard({ version }: { version: unknown }) {
  const month = monthRange(0).from.slice(0, 7);
  const budget = useApi(
    () => api.GET("/budgets/{month}", { params: { path: { month } } }),
    [month, version],
  );
  const data = budget.data;
  const limited = (data?.items ?? [])
    .filter((i) => i.limit !== null)
    .sort((a, b) => percent(b.spent, b.limit!) - percent(a.spent, a.limit!));

  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="h6" component="h3" sx={{ mb: 0 }}>
          Бюджет месяца
        </Typography>
        <Button component={Link} href="/budget" size="small">
          {limited.length > 0 ? "Подробнее" : "Задать лимиты"}
        </Button>
      </Stack>
      {budget.error && <Alert severity="error">{budget.error}</Alert>}
      {data && limited.length === 0 && (
        <Typography color="text.secondary">
          Лимиты на этот месяц не заданы.
        </Typography>
      )}
      {data && limited.length > 0 && (
        <>
          <BudgetRow
            name="Всего"
            spent={data.totalSpent}
            limit={data.totalLimit}
            currency={data.currency}
          />
          <Divider sx={{ my: 1 }} />
          {limited.slice(0, TOP).map((item) => (
            <BudgetRow
              key={item.categoryId}
              name={item.name}
              spent={item.spent}
              limit={item.limit}
              currency={data.currency}
            />
          ))}
        </>
      )}
    </Paper>
  );
}
