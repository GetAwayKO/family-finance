"use client";
import { api } from "@/shared/api/client";
import { useApi } from "@/shared/api/request";

export const useAccounts = () => useApi(() => api.GET("/accounts"), []);

export const useCategories = () => useApi(() => api.GET("/categories"), []);

export const useCurrencies = () => useApi(() => api.GET("/currencies"), []);

export const useFamily = () => useApi(() => api.GET("/family"), []);

export const useRecurringPayments = () =>
  useApi(() => api.GET("/recurring-payments"), []);

export const useGoals = () => useApi(() => api.GET("/goals"), []);
