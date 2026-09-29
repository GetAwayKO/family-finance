"use client";
import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/shared/api/client";
import { useAuth, type User } from "@/shared/auth/AuthProvider";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  // AuthGate рендерит страницу только для вошедшего пользователя.
  if (!user) return null;
  return <Profile user={user} onLogout={logout} />;
}

function Profile({ user, onLogout }: { user: User; onLogout(): void }) {
  const { setUser } = useAuth();
  const [name, setName] = useState(user.name);
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
        body: { name: name.trim() },
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

  const changed = name.trim() !== "" && name.trim() !== user.name;

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
          <Typography variant="body2" color="text.secondary">
            Основная валюта и участники — на странице{" "}
            <MuiLink component={Link} href="/family">
              «Семья»
            </MuiLink>
            .
          </Typography>
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
