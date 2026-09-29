"use client";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { formatDate } from "@/shared/finance/dates";
import { formatMoney } from "@/shared/finance/money";
import { monthlyNeeded, percent } from "@/shared/finance/planning";
import type { Goal } from "@/shared/finance/types";

interface GoalCardProps {
  goal: Goal;
  /** Название привязанного счёта. */
  accountName?: string;
  now: string;
  onEdit?(): void;
  onContribute?(): void;
}

export default function GoalCard({
  goal,
  accountName,
  now,
  onEdit,
  onContribute,
}: GoalCardProps) {
  const money = (minor: string) => formatMoney(minor, goal.currency);
  const saved = goal.saved;
  const share = saved ? percent(saved, goal.targetAmount) : 0;
  const reached = saved !== null && share >= 100;
  const perMonth =
    saved !== null
      ? monthlyNeeded(goal.targetAmount, saved, now, goal.targetDate)
      : null;
  const overdue = !!goal.targetDate && goal.targetDate < now && !reached;

  return (
    <Paper
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        opacity: goal.archived ? 0.6 : 1,
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}
      >
        <Typography variant="h6" component="h3" sx={{ mb: 0 }} noWrap>
          {goal.name}
        </Typography>
        {reached && <Chip size="small" color="success" label="Достигнута" />}
        {goal.archived && <Chip size="small" label="в архиве" />}
      </Stack>
      <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
        <Box component="span" sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
          {saved !== null ? money(saved) : "—"}
        </Box>{" "}
        <Typography component="span" color="text.secondary">
          из {money(goal.targetAmount)}
        </Typography>
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(share, 100)}
        color={reached ? "success" : "primary"}
        aria-label={`Накоплено ${Math.round(share)}%`}
        sx={{ height: 10, borderRadius: 5 }}
      />
      <Typography variant="body2" color="text.secondary">
        {saved === null
          ? "Нет курса валюты счёта"
          : reached
            ? "Цель достигнута"
            : `${Math.floor(share)}% · осталось ${money(
                (BigInt(goal.targetAmount) - BigInt(saved)).toString(),
              )}`}
      </Typography>
      {goal.targetDate && (
        <Typography variant="body2" color={overdue ? "error" : "text.primary"}>
          Срок {formatDate(goal.targetDate)}
          {perMonth &&
            perMonth !== "0" &&
            ` · откладывать ${money(perMonth)} в месяц`}
          {overdue && " · срок прошёл"}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {accountName ? `Счёт «${accountName}»` : "Ведётся вручную"} · автор{" "}
        {goal.authorName}
      </Typography>
      {(onContribute || onEdit) && (
        <Stack direction="row" sx={{ gap: 1, mt: "auto", pt: 1 }}>
          {onContribute && (
            <Button size="small" variant="outlined" onClick={onContribute}>
              Пополнить
            </Button>
          )}
          {onEdit && (
            <Button size="small" onClick={onEdit}>
              Изменить
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  );
}
