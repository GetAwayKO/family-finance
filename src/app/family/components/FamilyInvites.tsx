"use client";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import {
  Alert,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call, useApi } from "@/shared/api/request";
import { formatDate } from "@/shared/finance/dates";
import InviteDialog from "./InviteDialog";

/** Приглашения семьи: видит и создаёт владелец. */
export default function FamilyInvites() {
  const invites = useApi(() => api.GET("/family/invites"), []);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke(id: string) {
    setError(null);
    try {
      await call(() =>
        api.DELETE("/family/invites/{id}", { params: { path: { id } } }),
      );
      invites.reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось отозвать");
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}
      >
        <Typography variant="h6" component="h3" sx={{ mb: 0 }}>
          Приглашения
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddAlt1Icon />}
          onClick={() => setInviting(true)}
        >
          Пригласить
        </Button>
      </Stack>
      {(error ?? invites.error) && (
        <Alert severity="error">{error ?? invites.error}</Alert>
      )}
      {invites.data?.length === 0 && (
        <Typography color="text.secondary">
          Действующих приглашений нет.
        </Typography>
      )}
      {invites.data && invites.data.length > 0 && (
        <Table size="small">
          <TableBody>
            {invites.data.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell>{invite.email ?? "По ссылке"}</TableCell>
                <TableCell>
                  до {formatDate(invite.expiresAt.slice(0, 10))}
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => revoke(invite.id)}>
                    Отозвать
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {inviting && (
        <InviteDialog
          onClose={() => {
            setInviting(false);
            invites.reload();
          }}
        />
      )}
    </Paper>
  );
}
