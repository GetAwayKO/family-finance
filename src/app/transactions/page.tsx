"use client";
import AddIcon from "@mui/icons-material/Add";
import { Button, Paper, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
} from "@mui/x-data-grid";
import { ruRU } from "@mui/x-data-grid/locales";
import { useMemo, useState } from "react";
import Page from "@/components/layout/Page";
import { api } from "@/shared/api/client";
import { useApi } from "@/shared/api/request";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useDebouncedValue } from "@/shared/useDebouncedValue";
import { categoryLabel } from "@/shared/finance/categories";
import { formatDate, monthRange } from "@/shared/finance/dates";
import { useAccounts, useCategories, useFamily } from "@/shared/finance/hooks";
import { formatMoney } from "@/shared/finance/money";
import {
  canSeeDetails,
  TRANSACTION_TYPE_LABELS,
  type Transaction,
} from "@/shared/finance/types";
import TransactionDialog from "./components/TransactionDialog";
import TransactionFilters, {
  type Filters,
} from "./components/TransactionFilters";

const localeText = ruRU.components.MuiDataGrid.defaultProps.localeText;

export default function TransactionsPage() {
  const { user } = useAuth();
  const accounts = useAccounts();
  const categories = useCategories();
  const family = useFamily();
  const [filters, setFilters] = useState<Filters>(() => ({
    ...monthRange(),
    type: "",
    accountId: "",
    categoryId: "",
    authorId: "",
    search: "",
  }));
  const [pagination, setPagination] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [editing, setEditing] = useState<Transaction | "new" | null>(null);

  // Поиск уходит на сервер, когда пользователь перестал печатать.
  const search = useDebouncedValue(filters.search.trim());
  const [searchedFor, setSearchedFor] = useState(search);
  if (searchedFor !== search) {
    // Новый поиск — с первой страницы (сброс прямо в рендере, без лишнего запроса).
    setSearchedFor(search);
    setPagination((p) => ({ ...p, page: 0 }));
  }
  const query = {
    from: filters.from || undefined,
    to: filters.to || undefined,
    type: filters.type || undefined,
    accountId: filters.accountId || undefined,
    categoryId: filters.categoryId || undefined,
    authorId: filters.authorId || undefined,
    search: search || undefined,
    limit: pagination.pageSize,
    offset: pagination.page * pagination.pageSize,
  };
  const transactions = useApi(
    () => api.GET("/transactions", { params: { query } }),
    [JSON.stringify(query)],
  );

  const accountById = useMemo(
    () => new Map((accounts.data ?? []).map((a) => [a.id, a])),
    [accounts.data],
  );
  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c])),
    [categories.data],
  );

  const columns: GridColDef<Transaction>[] = [
    {
      field: "date",
      headerName: "Дата",
      width: 110,
      valueFormatter: (value: string) => formatDate(value),
    },
    {
      field: "type",
      headerName: "Тип",
      width: 100,
      valueGetter: (_, row) => TRANSACTION_TYPE_LABELS[row.type],
    },
    {
      field: "categoryId",
      headerName: "Категория",
      flex: 1,
      minWidth: 160,
      valueGetter: (_, row) =>
        row.type === "transfer"
          ? `→ ${accountById.get(row.toAccountId ?? "")?.name ?? ""}`
          : categoryLabel(categoryById.get(row.categoryId ?? ""), categoryById),
    },
    {
      field: "accountId",
      headerName: "Счёт",
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => accountById.get(row.accountId)?.name ?? "",
    },
    {
      field: "amount",
      headerName: "Сумма",
      width: 170,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => (
        <Amount transaction={row} accountById={accountById} />
      ),
    },
    { field: "comment", headerName: "Комментарий", flex: 1.5, minWidth: 160 },
    ...((family.data?.members.length ?? 0) > 1
      ? [
          {
            field: "authorName",
            headerName: "Автор",
            width: 130,
          } satisfies GridColDef<Transaction>,
        ]
      : []),
  ];

  const ready = accounts.data && categories.data;

  return (
    <Page
      title="Операции"
      error={
        transactions.error ?? accounts.error ?? categories.error ?? family.error
      }
      actions={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditing("new")}
          disabled={!ready}
        >
          Добавить операцию
        </Button>
      }
    >
      <TransactionFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          // Страницу по поиску сбрасываем вместе с запросом, а не на каждую букву.
          if (next.search === filters.search) {
            setPagination((p) => ({ ...p, page: 0 }));
          }
        }}
        accounts={(accounts.data ?? []).filter(
          (a) => user && canSeeDetails(a, user.id),
        )}
        categories={categories.data ?? []}
        members={family.data?.members ?? []}
      />
      <Paper sx={{ height: 600, minWidth: 0 }}>
        <DataGrid
          rows={transactions.data?.items ?? []}
          rowCount={transactions.data?.total ?? 0}
          columns={columns}
          loading={transactions.loading}
          paginationMode="server"
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[25, 50, 100]}
          disableColumnFilter
          disableColumnSorting
          disableRowSelectionOnClick
          onRowClick={({ row }) => ready && row.canEdit && setEditing(row)}
          getRowClassName={({ row }) => (row.canEdit ? "editable" : "")}
          localeText={localeText}
          sx={{ border: 0, "& .editable": { cursor: "pointer" } }}
        />
      </Paper>
      {editing && ready && (
        <TransactionDialog
          transaction={editing === "new" ? undefined : editing}
          accounts={accounts.data!}
          categories={categories.data!}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            transactions.reload();
            accounts.reload();
          }}
        />
      )}
    </Page>
  );
}

function Amount({
  transaction: t,
  accountById,
}: {
  transaction: Transaction;
  accountById: Map<string, { currency: string }>;
}) {
  const currency = accountById.get(t.accountId)?.currency;
  if (!currency) return null;
  const sign = t.type === "income" ? "+" : t.type === "expense" ? "−" : "";
  const color =
    t.type === "income"
      ? "success.main"
      : t.type === "expense"
        ? "error.main"
        : "text.secondary";
  const toCurrency = accountById.get(t.toAccountId ?? "")?.currency;
  // Сумма на стороне скрытого счёта не приходит: показываем зачисление.
  if (t.amount === null) {
    return (
      <Typography component="span" variant="body2" color="text.secondary">
        {t.toAmount && toCurrency ? formatMoney(t.toAmount, toCurrency) : "—"}
      </Typography>
    );
  }
  return (
    <Typography
      component="span"
      variant="body2"
      sx={{ color, fontVariantNumeric: "tabular-nums" }}
    >
      {sign}
      {formatMoney(t.amount, currency)}
      {t.toAmount && toCurrency && toCurrency !== currency
        ? ` → ${formatMoney(t.toAmount, toCurrency)}`
        : ""}
    </Typography>
  );
}
