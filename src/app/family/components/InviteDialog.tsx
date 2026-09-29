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
  Typography,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";

/** Адрес страницы, по которой приглашённый вступает в семью. */
export const inviteLink = (token: string) =>
  `${window.location.origin}/invite/${encodeURIComponent(token)}`;

/**
 * Создаёт приглашение. С email его примет только владелец адреса (оно
 * появится у него на странице «Семья»), без email — любой, у кого есть ссылка.
 */
export default function InviteDialog({ onClose }: { onClose(): void }) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const invite = await call(() =>
        api.POST("/family/invites", {
          body: email.trim() ? { email: email.trim() } : {},
        }),
      );
      setLink(inviteLink(invite.token));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось пригласить");
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError("Не удалось скопировать, выделите ссылку вручную");
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Пригласить в семью</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {link ? (
              <>
                <Typography>
                  {email.trim()
                    ? `Приглашение появится у ${email.trim()} на странице «Семья» после входа. Можно и отправить ссылку:`
                    : "Отправьте ссылку тому, кого приглашаете. Она действует 7 дней и сработает один раз."}
                </Typography>
                <TextField
                  label="Ссылка-приглашение"
                  value={link}
                  slotProps={{ htmlInput: { readOnly: true } }}
                  onFocus={(e) => e.target.select()}
                />
                {copied && <Alert severity="success">Ссылка скопирована</Alert>}
              </>
            ) : (
              <TextField
                label="Email (необязательно)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                helperText="С email приглашение примет только владелец адреса. Без него — любой, у кого будет ссылка"
                slotProps={{ htmlInput: { maxLength: 254 } }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {link ? (
            <>
              <Button onClick={copy}>Скопировать</Button>
              <Button variant="contained" onClick={onClose}>
                Готово
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onClose}>Отмена</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                Создать приглашение
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
