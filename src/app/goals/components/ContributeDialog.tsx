"use client";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import { formatMoney, parseMoney } from "@/shared/finance/money";
import type { Goal } from "@/shared/finance/types";

interface ContributeDialogProps {
  /** Цель без счёта: накопленное ведётся вручную. */
  goal: Goal;
  onClose(): void;
  onSaved(): void;
}

/** Пополнение или снятие с цели, которую ведут вручную. */
export default function ContributeDialog({
  goal,
  onClose,
  onSaved,
}: ContributeDialogProps) {
  const [direction, setDirection] = useState<"add" | "take">("add");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const minor = parseMoney(amount, goal.currency);
  const current = BigInt(goal.savedAmount);
  const next =
    minor === null
      ? null
      : direction === "add"
        ? current + BigInt(minor)
        : current - BigInt(minor);
  const valid = minor !== null && minor !== "0" && next! >= BigInt(0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      // Отправляем итог, а не приращение: повтор запроса не удвоит сумму.
      await call(() =>
        api.PATCH("/goals/{id}", {
          params: { path: { id: goal.id } },
          body: { savedAmount: next!.toString() },
        }),
      );
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить");
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{goal.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <ToggleButtonGroup
              exclusive
              fullWidth
              color="primary"
              value={direction}
              onChange={(_, value: "add" | "take" | null) =>
                value && setDirection(value)
              }
            >
              <ToggleButton value="add">Пополнить</ToggleButton>
              <ToggleButton value="take">Снять</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              label={`Сумма, ${goal.currency}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
              error={amount !== "" && !valid}
              helperText={
                next !== null && next >= BigInt(0)
                  ? `Будет накоплено ${formatMoney(next, goal.currency)}`
                  : amount !== ""
                    ? `Накоплено только ${formatMoney(current, goal.currency)}`
                    : undefined
              }
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={saving || !valid}>
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
