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
import { AuthError } from "@/shared/auth/AuthProvider";

export interface AuthFormValues {
  name: string;
  email: string;
  password: string;
}

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit(values: AuthFormValues): Promise<void>;
}

const TEXT = {
  login: {
    title: "Вход",
    submit: "Войти",
    switchText: "Нет аккаунта?",
    switchLink: "Зарегистрироваться",
    switchHref: "/register",
  },
  register: {
    title: "Регистрация",
    submit: "Зарегистрироваться",
    switchText: "Уже есть аккаунт?",
    switchLink: "Войти",
    switchHref: "/login",
  },
};

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const text = TEXT[mode];
  const [values, setValues] = useState<AuthFormValues>({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const change =
    (field: keyof AuthFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Что-то пошло не так");
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{ gridColumn: "1 / -1", display: "grid", placeItems: "center", p: 2 }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 4, width: "100%", maxWidth: 400 }}
      >
        <Stack spacing={2}>
          <Typography variant="h5" component="h2">
            {text.title}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {mode === "register" && (
            <TextField
              label="Имя"
              value={values.name}
              onChange={change("name")}
              required
              autoComplete="name"
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
          )}
          <TextField
            label="Email"
            type="email"
            value={values.email}
            onChange={change("email")}
            required
            autoComplete="email"
          />
          <TextField
            label="Пароль"
            type="password"
            value={values.password}
            onChange={change("password")}
            required
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            helperText={
              mode === "register" ? "Не меньше 8 символов" : undefined
            }
            slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
          >
            {text.submit}
          </Button>
          <Typography variant="body2">
            {text.switchText}{" "}
            <MuiLink component={Link} href={text.switchHref}>
              {text.switchLink}
            </MuiLink>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
