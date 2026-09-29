"use client";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import Page from "@/components/layout/Page";
import { today } from "@/shared/finance/dates";
import {
  useAccounts,
  useCurrencies,
  useFamily,
  useGoals,
} from "@/shared/finance/hooks";
import type { Goal } from "@/shared/finance/types";
import ContributeDialog from "./components/ContributeDialog";
import GoalCard from "./components/GoalCard";
import GoalDialog from "./components/GoalDialog";

export default function GoalsPage() {
  const goals = useGoals();
  const accounts = useAccounts();
  const currencies = useCurrencies();
  const family = useFamily();
  const [editing, setEditing] = useState<Goal | "new" | null>(null);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const now = today();

  const accountNames = useMemo(
    () => new Map((accounts.data ?? []).map((a) => [a.id, a.name])),
    [accounts.data],
  );
  const ready = accounts.data && currencies.data && family.data;
  const all = goals.data ?? [];
  const visible = all.filter((g) => showArchived || !g.archived);

  return (
    <Page
      title="Цели"
      error={goals.error ?? accounts.error ?? currencies.error}
      actions={
        <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
          {all.some((g) => g.archived) && (
            <FormControlLabel
              control={
                <Switch
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
              }
              label="Показать архив"
            />
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing("new")}
            disabled={!ready}
          >
            Новая цель
          </Button>
        </Stack>
      }
    >
      {goals.data && visible.length === 0 && (
        <Typography color="text.secondary">
          Целей пока нет. Заведите цель — отпуск, подушку безопасности, крупную
          покупку — и следите, сколько осталось.
        </Typography>
      )}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {visible.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            now={now}
            accountName={
              goal.accountId ? accountNames.get(goal.accountId) : undefined
            }
            onEdit={goal.canEdit && ready ? () => setEditing(goal) : undefined}
            onContribute={
              goal.canEdit && !goal.accountId && !goal.archived
                ? () => setContributing(goal)
                : undefined
            }
          />
        ))}
      </Box>
      {editing && ready && (
        <GoalDialog
          goal={editing === "new" ? undefined : editing}
          accounts={accounts.data!}
          currencies={currencies.data!}
          baseCurrency={family.data!.baseCurrency}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            goals.reload();
          }}
        />
      )}
      {contributing && (
        <ContributeDialog
          goal={contributing}
          onClose={() => setContributing(null)}
          onSaved={() => {
            setContributing(null);
            goals.reload();
          }}
        />
      )}
    </Page>
  );
}
