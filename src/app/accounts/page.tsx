"use client";
import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import {
  Alert,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { useMemo, useState } from "react";
import Page from "@/components/layout/Page";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useAccounts, useCurrencies, useFamily } from "@/shared/finance/hooks";
import { formatMoney } from "@/shared/finance/money";
import {
  ACCOUNT_TYPE_LABELS,
  VISIBILITY_LABELS,
  type Account,
} from "@/shared/finance/types";
import AccountDialog from "./components/AccountDialog";

export default function AccountsPage() {
  const { user } = useAuth();
  const accounts = useAccounts();
  const currencies = useCurrencies();
  const family = useFamily();
  const memberNames = useMemo(
    () => new Map((family.data?.members ?? []).map((m) => [m.userId, m.name])),
    [family.data],
  );
  const ownerLabel = (account: Account) =>
    account.ownerId === null
      ? "Общий"
      : account.ownerId === user?.id
        ? "Мой"
        : (memberNames.get(account.ownerId) ?? "—");
  const [editing, setEditing] = useState<Account | "new" | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const visible = (accounts.data ?? []).filter(
    (a) => showArchived || !a.archived,
  );

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      accounts.reload();
    } catch (e) {
      setActionError(
        e instanceof ApiError ? e.message : "Не удалось выполнить",
      );
    }
  }

  const setArchived = (account: Account, archived: boolean) =>
    run(() =>
      call(() =>
        api.PATCH("/accounts/{id}", {
          params: { path: { id: account.id } },
          body: { archived },
        }),
      ),
    );

  const remove = (account: Account) => {
    if (!window.confirm(`Удалить счёт «${account.name}»?`)) return;
    void run(() =>
      call(() =>
        api.DELETE("/accounts/{id}", { params: { path: { id: account.id } } }),
      ),
    );
  };

  return (
    <Page
      title="Счета"
      error={accounts.error ?? currencies.error ?? family.error ?? actionError}
      actions={
        <>
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
            }
            label="Показать архив"
            sx={{ ml: "auto" }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing("new")}
            disabled={!currencies.data}
          >
            Добавить счёт
          </Button>
        </>
      }
    >
      {accounts.data && visible.length === 0 ? (
        <Alert severity="info">
          {accounts.data.length > 0
            ? "Все счета в архиве. Включите «Показать архив», чтобы их увидеть."
            : "Счетов пока нет. Добавьте карту, наличные или вклад — остаток будет считаться по операциям."}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Владелец</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Валюта</TableCell>
                <TableCell align="right">Остаток</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    {account.name}{" "}
                    {account.visibility === "summary" && (
                      <Tooltip title={VISIBILITY_LABELS.summary}>
                        <VisibilityOffOutlinedIcon
                          fontSize="small"
                          color="action"
                          aria-label="Операции скрыты от семьи"
                          sx={{ verticalAlign: "middle" }}
                        />
                      </Tooltip>
                    )}{" "}
                    {account.archived && <Chip size="small" label="в архиве" />}
                  </TableCell>
                  <TableCell>{ownerLabel(account)}</TableCell>
                  <TableCell>{ACCOUNT_TYPE_LABELS[account.type]}</TableCell>
                  <TableCell>{account.currency}</TableCell>
                  <TableCell align="right">
                    <Typography
                      component="span"
                      color={
                        account.balance.startsWith("-") ? "error" : undefined
                      }
                      sx={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatMoney(account.balance, account.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {account.canManage && (
                      <>
                        <Tooltip title="Изменить">
                          <IconButton onClick={() => setEditing(account)}>
                            <EditOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            account.archived ? "Вернуть из архива" : "В архив"
                          }
                        >
                          <IconButton
                            onClick={() =>
                              setArchived(account, !account.archived)
                            }
                          >
                            {account.archived ? (
                              <UnarchiveOutlinedIcon />
                            ) : (
                              <ArchiveOutlinedIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton onClick={() => remove(account)}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {editing && currencies.data && (
        <AccountDialog
          account={editing === "new" ? undefined : editing}
          currencies={currencies.data}
          canShare={family.data?.role === "owner"}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            accounts.reload();
          }}
        />
      )}
    </Page>
  );
}
