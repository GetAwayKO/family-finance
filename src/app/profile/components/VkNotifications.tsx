"use client";
import {
  Alert,
  Button,
  FormControlLabel,
  FormGroup,
  Link as MuiLink,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call, useApi } from "@/shared/api/request";
import type { components } from "@/shared/api/schema";

type Settings = components["schemas"]["NotificationSettingsDto"];

const KINDS: { key: keyof Settings; label: string }[] = [
  { key: "recurring", label: "Регулярные платежи: заранее и в день платежа" },
  { key: "budget", label: "Бюджет: потрачено 80% и 100% лимита" },
  {
    key: "familyTransactions",
    label: "Операции других участников по общим счетам",
  },
  { key: "invites", label: "Приглашения в семью" },
  { key: "goals", label: "Достигнутые цели накоплений" },
];

/** Привязка ВКонтакте и выбор, о чём присылать уведомления. */
export default function VkNotifications() {
  const state = useApi(() => api.GET("/notifications"), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);

  async function run(action: () => Promise<unknown>, success?: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      if (success) setMessage({ severity: "success", text: success });
      state.reload();
    } catch (e) {
      setMessage({
        severity: "error",
        text: e instanceof ApiError ? e.message : "Не удалось выполнить",
      });
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    setBusy(true);
    setMessage(null);
    try {
      const { url } = await call(() => api.POST("/notifications/vk/link"));
      window.location.assign(url);
    } catch (e) {
      setMessage({
        severity: "error",
        text: e instanceof ApiError ? e.message : "Не удалось начать привязку",
      });
      setBusy(false);
    }
  }

  const data = state.data;
  const vk = data?.vk;

  return (
    <Paper sx={{ p: 4, maxWidth: 480 }}>
      <Stack spacing={2}>
        <Typography variant="h6" component="h3">
          Уведомления ВКонтакте
        </Typography>
        {state.error && <Alert severity="error">{state.error}</Alert>}
        {message && <Alert severity={message.severity}>{message.text}</Alert>}

        {vk && !vk.linked && (
          <>
            <Typography variant="body2" color="text.secondary">
              Бот сообщества напишет о платежах, бюджете и операциях семьи.
            </Typography>
            {vk.available ? (
              <Button
                variant="contained"
                onClick={connect}
                disabled={busy}
                sx={{ alignSelf: "flex-start" }}
              >
                Подключить ВКонтакте
              </Button>
            ) : (
              <Alert severity="info">
                Уведомления ВКонтакте пока не настроены на сервере.
              </Alert>
            )}
          </>
        )}

        {vk?.linked && (
          <>
            <Typography>
              Подключён аккаунт <b>{vk.name}</b>
            </Typography>
            {!vk.messagesAllowed && (
              <Alert severity="warning">
                Разрешите сообществу присылать вам сообщения: откройте{" "}
                {vk.allowMessagesUrl ? (
                  <MuiLink
                    href={vk.allowMessagesUrl}
                    target="_blank"
                    rel="noopener"
                  >
                    диалог с сообществом
                  </MuiLink>
                ) : (
                  "диалог с сообществом"
                )}{" "}
                и напишите что-нибудь или нажмите «Начать».
              </Alert>
            )}
            <FormGroup>
              {data &&
                KINDS.map(({ key, label }) => (
                  <FormControlLabel
                    key={key}
                    label={label}
                    disabled={busy}
                    control={
                      <Switch
                        checked={data.settings[key]}
                        onChange={(event) =>
                          run(() =>
                            call(() =>
                              api.PATCH("/notifications/settings", {
                                body: { [key]: event.target.checked },
                              }),
                            ),
                          )
                        }
                      />
                    }
                  />
                ))}
            </FormGroup>
            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                disabled={busy}
                onClick={() =>
                  run(
                    () => call(() => api.POST("/notifications/vk/test")),
                    "Сообщение отправлено, проверьте ВКонтакте",
                  )
                }
              >
                Проверить
              </Button>
              <Button
                color="error"
                disabled={busy}
                onClick={() =>
                  run(() => call(() => api.DELETE("/notifications/vk")))
                }
              >
                Отключить
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
