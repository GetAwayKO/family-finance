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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";

/** Сюда VK ID возвращает пользователя после привязки (redirect_uri). */
export default function VkCallbackPage() {
  return (
    <Suspense>
      <VkCallback />
    </Suspense>
  );
}

function VkCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Код одноразовый: второй запуск эффекта (StrictMode) не должен его слать.
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const code = params.get("code");
    const state = params.get("state");
    const deviceId = params.get("device_id");
    if (!code || !state || !deviceId) {
      setError("ВКонтакте не вернул код привязки. Попробуйте ещё раз.");
      return;
    }
    call(() =>
      api.POST("/notifications/vk/link/complete", {
        body: { code, state, deviceId },
      }),
    ).then(
      () => router.replace("/profile"),
      (e: unknown) =>
        setError(
          e instanceof ApiError ? e.message : "Не удалось привязать ВКонтакте",
        ),
    );
  }, [params, router]);

  return (
    <Box sx={{ gridColumn: "1 / -1", p: 3 }}>
      <Paper sx={{ p: 4, maxWidth: 480 }}>
        {error ? (
          <Stack spacing={2}>
            <Alert severity="error">{error}</Alert>
            <Button
              component={Link}
              href="/profile"
              variant="contained"
              sx={{ alignSelf: "flex-start" }}
            >
              Вернуться в профиль
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <CircularProgress size={24} />
            <Typography>Подключаем ВКонтакте…</Typography>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
