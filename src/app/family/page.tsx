"use client";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Alert,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { FormEvent, useState } from "react";
import Page from "@/components/layout/Page";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import { useAuth } from "@/shared/auth/AuthProvider";
import { formatDate } from "@/shared/finance/dates";
import { useCurrencies, useFamily } from "@/shared/finance/hooks";
import {
  FAMILY_ROLE_LABELS,
  type CurrencyCode,
  type Family,
  type FamilyRole,
} from "@/shared/finance/types";
import FamilyInvites from "./components/FamilyInvites";
import IncomingInvites from "./components/IncomingInvites";

export default function FamilyPage() {
  const { user } = useAuth();
  const family = useFamily();
  const [actionError, setActionError] = useState<string | null>(null);
  const isOwner = family.data?.role === "owner";

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      family.reload();
    } catch (e) {
      setActionError(
        e instanceof ApiError ? e.message : "Не удалось выполнить",
      );
    }
  }

  const setRole = (userId: string, role: FamilyRole) =>
    run(() =>
      call(() =>
        api.PATCH("/family/members/{userId}", {
          params: { path: { userId } },
          body: { role },
        }),
      ),
    );

  const remove = (userId: string, name: string) => {
    if (
      !window.confirm(
        `Исключить ${name} из семьи? Личные счета участника уйдут вместе с ним.`,
      )
    ) {
      return;
    }
    void run(() =>
      call(() =>
        api.DELETE("/family/members/{userId}", {
          params: { path: { userId } },
        }),
      ),
    );
  };

  const leave = () => {
    if (
      !window.confirm(
        "Выйти из семьи? Ваши личные счета останутся с вами, общие — в семье.",
      )
    ) {
      return;
    }
    void run(() => call(() => api.POST("/family/leave")));
  };

  const data = family.data;
  return (
    <Page title="Семья" error={family.error ?? actionError}>
      <IncomingInvites onAccepted={family.reload} />
      {data && (
        <>
          <FamilySettings key={data.id} family={data} onSaved={family.reload} />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Участник</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>В семье с</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.members.map((m) => (
                  <TableRow key={m.userId}>
                    <TableCell>
                      {m.name}
                      {m.userId === user?.id && " (вы)"}
                    </TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>
                      {isOwner ? (
                        <TextField
                          select
                          size="small"
                          value={m.role}
                          onChange={(e) =>
                            setRole(m.userId, e.target.value as FamilyRole)
                          }
                          slotProps={{
                            htmlInput: { "aria-label": `Роль: ${m.name}` },
                          }}
                        >
                          {Object.entries(FAMILY_ROLE_LABELS).map(
                            ([role, label]) => (
                              <MenuItem key={role} value={role}>
                                {label}
                              </MenuItem>
                            ),
                          )}
                        </TextField>
                      ) : (
                        FAMILY_ROLE_LABELS[m.role]
                      )}
                    </TableCell>
                    <TableCell>{formatDate(m.joinedAt.slice(0, 10))}</TableCell>
                    <TableCell align="right">
                      {isOwner && m.userId !== user?.id && (
                        <Tooltip title="Исключить">
                          <IconButton onClick={() => remove(m.userId, m.name)}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {data.members.length === 1 && (
            <Alert severity="info">
              Пока в семье только вы. Пригласите близких: личные счета каждого
              будут видны всей семье, а категории и общие счета станут общими.
            </Alert>
          )}
          {isOwner && <FamilyInvites />}
          {data.members.length > 1 && (
            <Stack direction="row">
              <Button variant="outlined" color="error" onClick={leave}>
                Выйти из семьи
              </Button>
            </Stack>
          )}
        </>
      )}
    </Page>
  );
}

/** Название и основная валюта; менять может владелец семьи. */
function FamilySettings({
  family,
  onSaved,
}: {
  family: Family;
  onSaved(): void;
}) {
  const currencies = useCurrencies();
  const [name, setName] = useState(family.name);
  const [baseCurrency, setBaseCurrency] = useState(family.baseCurrency);
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const isOwner = family.role === "owner";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await call(() =>
        api.PATCH("/family", {
          body: {
            name: name.trim(),
            baseCurrency: baseCurrency as CurrencyCode,
          },
        }),
      );
      setMessage({ severity: "success", text: "Сохранено" });
      onSaved();
    } catch (e) {
      setMessage({
        severity: "error",
        text: e instanceof ApiError ? e.message : "Не удалось сохранить",
      });
    } finally {
      setSaving(false);
    }
  }

  const changed =
    name.trim() !== "" &&
    (name.trim() !== family.name || baseCurrency !== family.baseCurrency);

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: 3, maxWidth: 560 }}
    >
      <Stack spacing={2}>
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
        <TextField
          label="Название семьи"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={!isOwner}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
        <TextField
          select
          label="Основная валюта"
          value={baseCurrency}
          onChange={(e) => setBaseCurrency(e.target.value)}
          helperText="В ней считаются общий баланс и отчёты всей семьи"
          disabled={!isOwner || !currencies.data}
        >
          {(currencies.data ?? [{ code: family.baseCurrency, name: "" }]).map(
            (c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.code}
                {c.name && ` — ${c.name}`}
              </MenuItem>
            ),
          )}
        </TextField>
        {isOwner && (
          <Stack direction="row">
            <Button
              type="submit"
              variant="contained"
              disabled={!changed || saving}
            >
              Сохранить
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
