"use client";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import MonthSwitcher from "@/components/MonthSwitcher";
import Page from "@/components/layout/Page";
import { api } from "@/shared/api/client";
import { ApiError, call, useApi } from "@/shared/api/request";
import { formatMonth, monthRange } from "@/shared/finance/dates";
import { useCategories } from "@/shared/finance/hooks";
import { formatMoney } from "@/shared/finance/money";
import type { BudgetItem } from "@/shared/finance/types";
import BudgetDialog from "./components/BudgetDialog";
import BudgetRow from "./components/BudgetRow";

type Editing = { item?: BudgetItem } | null;

export default function BudgetPage() {
  const [offset, setOffset] = useState(0);
  const month = monthRange(offset).from.slice(0, 7);
  const previous = monthRange(offset - 1).from.slice(0, 7);
  const budget = useApi(
    () => api.GET("/budgets/{month}", { params: { path: { month } } }),
    [month],
  );
  const categories = useCategories();
  const [editing, setEditing] = useState<Editing>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const data = budget.data;
  const currency = data?.currency ?? "RUB";
  const budgeted = (data?.items ?? []).filter((i) => i.limit !== null);
  const unbudgeted = (data?.items ?? []).filter((i) => i.limit === null);
  // Лимит задаётся категориям расходов верхнего уровня, у которых его ещё нет.
  const withLimit = new Set(budgeted.map((i) => i.categoryId));
  const available = (categories.data ?? []).filter(
    (c) =>
      c.kind === "expense" &&
      !c.parentId &&
      !c.archived &&
      !withLimit.has(c.id),
  );

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      budget.reload();
    } catch (e) {
      setActionError(
        e instanceof ApiError ? e.message : "Не удалось выполнить",
      );
    }
  }

  const remove = (item: BudgetItem) => {
    if (!window.confirm(`Убрать лимит «${item.name}»?`)) return;
    void run(() =>
      call(() =>
        api.DELETE("/budgets/{month}/{categoryId}", {
          params: { path: { month, categoryId: item.categoryId } },
        }),
      ),
    );
  };

  const copyPrevious = () =>
    run(() =>
      call(() =>
        api.POST("/budgets/{month}/copy", {
          params: { path: { month } },
          body: { from: previous },
        }),
      ),
    );

  return (
    <Page
      title="Бюджет"
      error={budget.error ?? categories.error ?? actionError}
      actions={
        <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
          <MonthSwitcher
            month={month}
            offset={offset}
            onChange={setOffset}
            allowFuture
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            disabled={!data || available.length === 0}
          >
            Добавить лимит
          </Button>
        </Stack>
      }
    >
      {!data && !budget.error && <Skeleton variant="rounded" height={160} />}
      {data && (
        <>
          <Paper sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Лимиты на {formatMonth(month)}
            </Typography>
            {budgeted.length > 0 ? (
              <BudgetRow
                name="Всего по лимитам"
                spent={data.totalSpent}
                limit={data.totalLimit}
                currency={currency}
              />
            ) : (
              <Stack spacing={2} sx={{ alignItems: "flex-start", mt: 1 }}>
                <Typography color="text.secondary">
                  На этот месяц лимиты не заданы. Задайте лимит по категории или
                  перенесите лимиты прошлого месяца.
                </Typography>
                <Button startIcon={<ContentCopyIcon />} onClick={copyPrevious}>
                  Скопировать из {formatMonth(previous)}
                </Button>
              </Stack>
            )}
            {data.missingRates.length > 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Нет курса для {data.missingRates.join(", ")} — часть сумм не
                учтена.
              </Alert>
            )}
          </Paper>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" },
              alignItems: "start",
            }}
          >
            {budgeted.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" component="h3">
                  По категориям
                </Typography>
                {budgeted.map((item, i) => (
                  <Box key={item.categoryId}>
                    {i > 0 && <Divider />}
                    <BudgetRow
                      name={item.name}
                      spent={item.spent}
                      limit={item.limit}
                      currency={currency}
                      actions={
                        <>
                          <Tooltip title="Изменить лимит">
                            <IconButton
                              size="small"
                              onClick={() => setEditing({ item })}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Убрать лимит">
                            <IconButton
                              size="small"
                              onClick={() => remove(item)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      }
                    />
                  </Box>
                ))}
              </Paper>
            )}
            {(unbudgeted.length > 0 || data.hiddenSpent !== "0") && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" component="h3">
                  Без лимита
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Всего{" "}
                  {formatMoney(
                    (
                      BigInt(data.otherSpent) + BigInt(data.hiddenSpent)
                    ).toString(),
                    currency,
                  )}
                </Typography>
                {unbudgeted.map((item) => (
                  <BudgetRow
                    key={item.categoryId}
                    name={item.name}
                    spent={item.spent}
                    limit={null}
                    currency={currency}
                    actions={
                      <Tooltip title="Задать лимит">
                        <IconButton
                          size="small"
                          onClick={() => setEditing({ item })}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                ))}
                {data.hiddenSpent !== "0" && (
                  <Tooltip title="Расходы по счетам, детализацию которых владельцы скрыли. По категориям они не раскрываются и в лимиты не входят.">
                    <Box>
                      <BudgetRow
                        name="Личные (скрыто)"
                        spent={data.hiddenSpent}
                        limit={null}
                        currency={currency}
                      />
                    </Box>
                  </Tooltip>
                )}
              </Paper>
            )}
          </Box>
        </>
      )}
      {editing && data && categories.data && (
        <BudgetDialog
          month={month}
          currency={currency}
          categories={
            editing.item
              ? categories.data.filter((c) => c.id === editing.item!.categoryId)
              : available
          }
          item={editing.item}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            budget.reload();
          }}
        />
      )}
    </Page>
  );
}
