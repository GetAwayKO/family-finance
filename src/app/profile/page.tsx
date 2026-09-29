"use client";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { api } from "@/shared/api/client";
import { useAuth, type User } from "@/shared/auth/AuthProvider";
import { useCurrencies } from "@/shared/finance/hooks";
import type { CurrencyCode } from "@/shared/finance/types";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  // AuthGate рендерит страницу только для вошедшего пользователя.
  if (!user) return null;
  return <Profile user={user} onLogout={logout} />;
}

function Profile({ user, onLogout }: { user: User; onLogout(): void }) {
  const { setUser } = useAuth();
  const currencies = useCurrencies();
  const [name, setName] = useState(user.name);
  const [baseCurrency, setBaseCurrency] = useState(user.baseCurrency);
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.PATCH("/users/me", {
        body: {
          name: name.trim(),
          baseCurrency: baseCurrency as CurrencyCode,
        },
      });
      if (!data) throw new Error();
      setUser(data);
      setName(data.name);
      setMessage({ severity: "success", text: "Сохранено" });
    } catch {
      setMessage({ severity: "error", text: "Не удалось сохранить" });
    } finally {
      setSaving(false);
    }
  }

  const changed =
    name.trim() !== "" &&
    (name.trim() !== user.name || baseCurrency !== user.baseCurrency);

  return (
    <Box sx={{ gridColumn: "1 / -1", p: 3 }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 4, maxWidth: 480 }}
      >
        <Stack spacing={2}>
          <Typography variant="h5" component="h2">
            Профиль
          </Typography>
          {message && <Alert severity={message.severity}>{message.text}</Alert>}
          <TextField
            label="Имя"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <TextField label="Email" value={user.email} disabled />
          <TextField
            select
            label="Основная валюта"
            value={baseCurrency}
            onChange={(event) => setBaseCurrency(event.target.value)}
            helperText="В ней считаются общий баланс и отчёты"
            disabled={!currencies.data}
          >
            {(currencies.data ?? [{ code: user.baseCurrency, name: "" }]).map(
              (c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.code}
                  {c.name && ` — ${c.name}`}
                </MenuItem>
              ),
            )}
          </TextField>
          <Typography variant="body2" color="text.secondary">
            С нами с {new Date(user.createdAt).toLocaleDateString("ru-RU")}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={!changed || saving}
            >
              Сохранить
            </Button>
            <Button variant="outlined" color="error" onClick={onLogout}>
              Выйти
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
