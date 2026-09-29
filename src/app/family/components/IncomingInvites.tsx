"use client";
import { Alert, Button, Stack } from "@mui/material";
import { useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call, useApi } from "@/shared/api/request";
import { JOIN_WARNING } from "@/shared/finance/family";
import type { IncomingInvite } from "@/shared/finance/types";

/** Приглашения на email пользователя в другие семьи. */
export default function IncomingInvites({
  onAccepted,
}: {
  onAccepted(): void;
}) {
  const invites = useApi(() => api.GET("/invites/incoming"), []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setError(null);
    try {
      await action();
      invites.reload();
      after?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось выполнить");
    } finally {
      setBusy(false);
    }
  }

  const accept = (invite: IncomingInvite) => {
    if (!window.confirm(`Вступить в «${invite.familyName}»? ${JOIN_WARNING}`)) {
      return;
    }
    void run(
      () =>
        call(() =>
          api.POST("/invites/{id}/accept", {
            params: { path: { id: invite.id } },
          }),
        ),
      onAccepted,
    );
  };

  const decline = (invite: IncomingInvite) =>
    run(() =>
      call(() =>
        api.POST("/invites/{id}/decline", {
          params: { path: { id: invite.id } },
        }),
      ),
    );

  if (!invites.data?.length && !error) return null;
  return (
    <Stack spacing={1}>
      {error && <Alert severity="error">{error}</Alert>}
      {invites.data?.map((invite) => (
        <Alert
          key={invite.id}
          severity="info"
          action={
            <Stack direction="row" spacing={1}>
              <Button
                color="inherit"
                size="small"
                disabled={busy}
                onClick={() => accept(invite)}
              >
                Вступить
              </Button>
              <Button
                color="inherit"
                size="small"
                disabled={busy}
                onClick={() => decline(invite)}
              >
                Отклонить
              </Button>
            </Stack>
          }
        >
          {invite.invitedBy} приглашает вас в «{invite.familyName}»
        </Alert>
      ))}
    </Stack>
  );
}
