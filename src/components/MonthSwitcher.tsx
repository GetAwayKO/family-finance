"use client";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { IconButton, Stack, Typography } from "@mui/material";
import { formatMonth } from "@/shared/finance/dates";

interface MonthSwitcherProps {
  /** YYYY-MM */
  month: string;
  /** Сдвиг от текущего месяца: 0 — текущий, -1 — прошлый. */
  offset: number;
  onChange(offset: number): void;
  /** Можно ли листать в будущие месяцы (для планирования бюджета). */
  allowFuture?: boolean;
}

export default function MonthSwitcher({
  month,
  offset,
  onChange,
  allowFuture = false,
}: MonthSwitcherProps) {
  return (
    <Stack direction="row" sx={{ alignItems: "center" }}>
      <IconButton
        aria-label="Предыдущий месяц"
        onClick={() => onChange(offset - 1)}
      >
        <ChevronLeftIcon />
      </IconButton>
      <Typography sx={{ minWidth: 100, textAlign: "center" }}>
        {formatMonth(month)}
      </Typography>
      <IconButton
        aria-label="Следующий месяц"
        onClick={() => onChange(offset + 1)}
        disabled={!allowFuture && offset >= 0}
      >
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  );
}
