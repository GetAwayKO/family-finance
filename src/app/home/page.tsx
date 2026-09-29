"use client";
import AddIcon from "@mui/icons-material/Add";
import { Box, Button } from "@mui/material";
import { useState } from "react";
import Page from "@/components/layout/Page";
import { useAccounts, useCategories } from "@/shared/finance/hooks";
import TransactionDialog from "../transactions/components/TransactionDialog";
import BalanceCard from "./components/BalanceCard";
import ExpensesByCategory from "./components/ExpensesByCategory";
import MonthlyChart from "./components/MonthlyChart";

export default function HomePage() {
  const accounts = useAccounts();
  const categories = useCategories();
  const [adding, setAdding] = useState(false);
  // Меняется после новой операции, чтобы отчёты перезагрузились.
  const [version, setVersion] = useState(0);
  const ready = accounts.data && categories.data;

  return (
    <Page
      title="Главная"
      error={accounts.error ?? categories.error}
      actions={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAdding(true)}
          disabled={!ready}
        >
          Добавить операцию
        </Button>
      }
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(280px, 1fr) 2fr" },
          alignItems: "start",
        }}
      >
        {accounts.data && <BalanceCard accounts={accounts.data} />}
        <ExpensesByCategory version={version} />
      </Box>
      <MonthlyChart version={version} />
      {adding && ready && (
        <TransactionDialog
          accounts={accounts.data!}
          categories={categories.data!}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setVersion((v) => v + 1);
            accounts.reload();
          }}
        />
      )}
    </Page>
  );
}
