import type { components } from "@/shared/api/schema";

type Tokens = components["schemas"]["TokensDto"];

/**
 * Access-токен живёт только в памяти вкладки, refresh-токен — в localStorage,
 * чтобы сессия переживала перезагрузку и была общей для вкладок.
 */
export const REFRESH_TOKEN_KEY = "cashflow.refreshToken";

// Обновляем access-токен заранее, чтобы запрос не упёрся в истечение срока.
const EXPIRY_MARGIN_MS = 30_000;

let accessToken: string | null = null;
let accessExpiresAt = 0;
let refreshing: Promise<string | null> | null = null;
const listeners = new Set<() => void>();

type RefreshFn = (refreshToken: string) => Promise<Tokens | null>;
let refreshFn: RefreshFn | null = null;

/** Как обменять refresh-токен на новую пару; null значит «токен отклонён». */
export function setRefreshHandler(fn: RefreshFn) {
  refreshFn = fn;
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function hasSession(): boolean {
  return getRefreshToken() !== null;
}

export function setSession(tokens: Tokens) {
  accessToken = tokens.accessToken;
  accessExpiresAt = Date.now() + tokens.expiresIn * 1000;
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    // Без localStorage сессия живёт до перезагрузки вкладки.
  }
}

export function clearSession() {
  const hadSession = accessToken !== null || hasSession();
  accessToken = null;
  accessExpiresAt = 0;
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {}
  if (hadSession) listeners.forEach((listener) => listener());
}

/** Подписка на завершение сессии: выход, отзыв токена, выход в другой вкладке. */
export function onSessionEnd(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === REFRESH_TOKEN_KEY && event.newValue === null) {
      accessToken = null;
      accessExpiresAt = 0;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Действующий access-токен, при необходимости обновлённый.
 * null — сессии нет или сервер её отклонил.
 */
export async function getAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < accessExpiresAt - EXPIRY_MARGIN_MS) {
    return accessToken;
  }
  refreshing ??= refreshWithLock().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// Refresh-токен одноразовый, поэтому вкладки обновляют его по очереди.
// Внутри блокировки токен перечитывается: его могла заменить другая вкладка.
async function refreshWithLock(): Promise<string | null> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("cashflow-refresh", refresh);
  }
  return refresh();
}

async function refresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken || !refreshFn) {
    clearSession();
    return null;
  }
  // Сетевая ошибка пробрасывается дальше и сессию не завершает.
  const tokens = await refreshFn(refreshToken);
  if (!tokens) {
    clearSession();
    return null;
  }
  setSession(tokens);
  return tokens.accessToken;
}
