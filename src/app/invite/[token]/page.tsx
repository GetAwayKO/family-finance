"use client";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call, useApi } from "@/shared/api/request";
import { useAuth } from "@/shared/auth/AuthProvider";
import { JOIN_WARNING } from "@/shared/finance/family";

/**
 * Страница ссылки-приглашения. Страница закрытая: незнакомого пользователя
 * AuthGate отправит на вход и вернёт сюда (токен — часть пути).
 */
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const invite = useApi(
    () => api.POST("/invites/preview", { body: { token } }),
    [token],
  );
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  async function accept() {
    setJoining(true);
    setError(null);
    try {
      await call(() => api.POST("/invites/accept", { body: { token } }));
      router.replace("/family");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось вступить");
      setJoining(false);
    }
  }

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        p: 3,
        display: "grid",
        placeItems: "start center",
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 520, width: "100%" }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h2">
            Приглашение в семью
          </Typography>
          {invite.loading && !invite.data && (
            <CircularProgress aria-label="Загрузка" />
          )}
          {invite.error && <Alert severity="error">{invite.error}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          {invite.data && (
            <>
              <Typography>
                {invite.data.invitedBy} приглашает вас
                {user ? ` (${user.email})` : ""} в «{invite.data.familyName}».
              </Typography>
              <Typography color="text.secondary">{JOIN_WARNING}</Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={accept} disabled={joining}>
                  Вступить
                </Button>
                <Button onClick={() => router.replace("/home")}>
                  Не сейчас
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
