"use client";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import { parseMoney, toMoneyInput } from "@/shared/finance/money";
import type {
  Account,
  Currency,
  CurrencyCode,
  Goal,
} from "@/shared/finance/types";

interface GoalDialogProps {
  /** Цель для редактирования; без неё — создание. */
  goal?: Goal;
  accounts: Account[];
  currencies: Currency[];
  baseCurrency: string;
  onClose(): void;
  onSaved(): void;
}

/** Значение «без счёта» в списке счетов. */
const MANUAL = "";

export default function GoalDialog({
  goal,
  accounts,
  currencies,
  baseCurrency,
  onClose,
  onSaved,
}: GoalDialogProps) {
  const [id] = useState(() => goal?.id ?? crypto.randomUUID());
  const [name, setName] = useState(goal?.name ?? "");
  const [currency, setCurrency] = useState(goal?.currency ?? baseCurrency);
  const [target, setTarget] = useState(
    goal ? toMoneyInput(goal.targetAmount, goal.currency) : "",
  );
  const [accountId, setAccountId] = useState(goal?.accountId ?? MANUAL);
  const [saved, setSaved] = useState(
    goal ? toMoneyInput(goal.savedAmount, goal.currency) : "",
  );
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Остаток любого счёта виден семье, поэтому привязать можно любой.
  const accountOptions = accounts.filter(
    (a) => !a.archived || a.id === accountId,
  );
  const manual = accountId === MANUAL;
  const targetMinor = parseMoney(target, currency);
  const savedMinor = saved.trim() === "" ? "0" : parseMoney(saved, currency);
  const valid =
    !!name.trim() &&
    targetMinor !== null &&
    targetMinor !== "0" &&
    (!manual || savedMinor !== null);

  function handleAccount(next: string) {
    setAccountId(next);
    // Новую цель удобнее вести в валюте её счёта.
    const account = accounts.find((a) => a.id === next);
    if (account && !goal) setCurrency(account.currency);
  }

  async function send(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить");
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    const body = {
      name: name.trim(),
      currency: currency as CurrencyCode,
      targetAmount: targetMinor!,
      accountId: manual ? null : accountId,
      targetDate: targetDate || null,
      ...(manual ? { savedAmount: savedMinor! } : {}),
    };
    void send(() =>
      call(() =>
        goal
          ? api.PATCH("/goals/{id}", { params: { path: { id } }, body })
          : api.POST("/goals", { body: { ...body, id } }),
      ),
    );
  }

  const setArchived = (archived: boolean) =>
    send(() =>
      call(() =>
        api.PATCH("/goals/{id}", {
          params: { path: { id } },
          body: { archived },
        }),
      ),
    );

  function handleDelete() {
    if (!window.confirm(`Удалить цель «${goal!.name}»?`)) return;
    void send(() =>
      call(() => api.DELETE("/goals/{id}", { params: { path: { id } } })),
    );
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{goal ? "Цель" : "Новая цель"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus={!goal}
              placeholder="Отпуск, подушка безопасности"
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Сколько нужно"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                error={target !== "" && targetMinor === null}
                slotProps={{ htmlInput: { inputMode: "decimal" } }}
              />
              <TextField
                select
                label="Валюта"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                sx={{ minWidth: 100 }}
              >
                {currencies.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.code}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label="Срок"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              helperText="Необязательно. Со сроком покажем, сколько откладывать в месяц"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label="Где копим"
              value={accountId}
              onChange={(e) => handleAccount(e.target.value)}
              helperText={
                manual
                  ? "Накопленное отмечаете сами"
                  : "Накоплено — остаток счёта в валюте цели"
              }
            >
              <MenuItem value={MANUAL}>Без счёта, вручную</MenuItem>
              {accountOptions.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </MenuItem>
              ))}
            </TextField>
            {manual && (
              <TextField
                label={`Уже накоплено, ${currency}`}
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                error={savedMinor === null}
                slotProps={{ htmlInput: { inputMode: "decimal" } }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {goal && (
            <>
              <Button color="error" onClick={handleDelete} disabled={busy}>
                Удалить
              </Button>
              <Button
                onClick={() => setArchived(!goal.archived)}
                disabled={busy}
                sx={{ mr: "auto" }}
              >
                {goal.archived ? "Вернуть" : "В архив"}
              </Button>
            </>
          )}
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={busy || !valid}>
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
