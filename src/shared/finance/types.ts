import type { components } from "@/shared/api/schema";

type Schemas = components["schemas"];

export type Account = Schemas["AccountDto"];
export type AccountType = Schemas["AccountType"];
export type AccountVisibility = Schemas["AccountVisibility"];
export type Category = Schemas["CategoryDto"];
export type CategoryKind = Schemas["CategoryKind"];
export type Transaction = Schemas["TransactionDto"];
export type TransactionType = Schemas["TransactionType"];
export type SaveTransaction = Schemas["SaveTransactionDto"];
export type Currency = Schemas["CurrencyDto"];
export type Family = Schemas["FamilyDto"];
export type FamilyMember = Schemas["FamilyMemberDto"];
export type FamilyRole = Schemas["FamilyRole"];
export type Invite = Schemas["InviteDto"];
export type IncomingInvite = Schemas["IncomingInviteDto"];
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

export const FAMILY_ROLE_LABELS: Record<FamilyRole, string> = {
  owner: "Владелец",
  member: "Участник",
};

export const VISIBILITY_LABELS: Record<AccountVisibility, string> = {
  full: "Семья видит операции",
  summary: "Семья видит только остаток и итоги",
};

/** Операции по счёту видны: счёт общий, свой или открыт владельцем. */
export const canSeeDetails = (account: Account, userId: string) =>
  account.ownerId === null ||
  account.ownerId === userId ||
  account.visibility === "full";
