import type { components } from "@/shared/api/schema";

type Schemas = components["schemas"];

export type Account = Schemas["AccountDto"];
export type AccountType = Schemas["AccountType"];
export type Category = Schemas["CategoryDto"];
export type CategoryKind = Schemas["CategoryKind"];
export type Transaction = Schemas["TransactionDto"];
export type TransactionType = Schemas["TransactionType"];
export type SaveTransaction = Schemas["SaveTransactionDto"];
export type Currency = Schemas["CurrencyDto"];
/** Код валюты, которую принимает сервер. */
export type CurrencyCode = Schemas["CreateAccountDto"]["currency"];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Наличные",
  card: "Карта",
  deposit: "Вклад",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Расход",
  income: "Доход",
  transfer: "Перевод",
};

export const CATEGORY_KIND_LABELS: Record<CategoryKind, string> = {
  expense: "Расходы",
  income: "Доходы",
};
