"use client";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import { formatMoney } from "@/shared/finance/money";
import { percent } from "@/shared/finance/planning";

interface BudgetRowProps {
  name: ReactNode;
  spent: string;
  /** null — лимита нет, показываем только потраченное. */
  limit: string | null;
  currency: string;
  actions?: ReactNode;
}

/** Цвет полосы: до 80% лимита — спокойно, дальше — предупреждение. */
export const budgetColor = (share: number) =>
  share > 100 ? "error" : share >= 80 ? "warning" : "success";

/** Категория бюджета: потрачено из лимита и полоса прогресса. */
export default function BudgetRow({
  name,
  spent,
  limit,
  currency,
  actions,
}: BudgetRowProps) {
  const share = limit ? percent(spent, limit) : 0;
  const rest = limit ? BigInt(limit) - BigInt(spent) : null;
  return (
    <Box sx={{ py: 1 }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}
      >
        <Typography sx={{ fontWeight: 500, minWidth: 0 }} noWrap>
          {name}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
          >
            {formatMoney(spent, currency)}
            {limit && (
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                {" "}
                из {formatMoney(limit, currency)}
              </Typography>
            )}
          </Typography>
          {actions}
        </Stack>
      </Stack>
      {limit && (
        <>
          <LinearProgress
            variant="determinate"
            value={Math.min(share, 100)}
            color={budgetColor(share)}
            aria-label={`Потрачено ${Math.round(share)}% лимита`}
            sx={{ height: 8, borderRadius: 4, my: 0.5 }}
          />
          <Typography
            variant="caption"
            color={rest! < BigInt(0) ? "error" : "text.secondary"}
          >
            {rest! < BigInt(0)
              ? `Перерасход ${formatMoney((-rest!).toString(), currency)}`
              : `Осталось ${formatMoney(rest!.toString(), currency)}`}
          </Typography>
        </>
      )}
    </Box>
  );
}
