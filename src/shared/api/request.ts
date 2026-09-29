"use client";
import { DependencyList, useCallback, useEffect, useState } from "react";

/** Ошибка с текстом для пользователя. */
export class ApiError extends Error {}

type Result<T> = { data?: T; error?: unknown; response: Response };

/** Достаёт текст ошибки из ответа NestJS: { message: string | string[] }. */
export function errorMessage(error: unknown, fallback = "Что-то пошло не так") {
  const message =
    error && typeof error === "object" && "message" in error
      ? error.message
      : undefined;
  if (Array.isArray(message)) return message.join(". ");
  return typeof message === "string" && message ? message : fallback;
}

/** Выполняет запрос и возвращает данные или бросает ApiError. */
export async function call<T>(send: () => Promise<Result<T>>): Promise<T> {
  let result: Result<T>;
  try {
    result = await send();
  } catch {
    throw new ApiError("Сервер недоступен, попробуйте позже");
  }
  if (!result.response.ok) throw new ApiError(errorMessage(result.error));
  return result.data as T;
}

interface ApiState<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload(): void;
}

/**
 * Загружает данные при монтировании и при смене deps. При перезагрузке
 * прежние данные остаются на экране, пока не придут новые.
 */
export function useApi<T>(
  send: () => Promise<Result<T>>,
  deps: DependencyList,
): ApiState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    call(send).then(
      (next) => {
        if (cancelled) return;
        setData(next);
        setError(null);
        setLoading(false);
      },
      (e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Не удалось загрузить");
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
    // send меняется на каждом рендере; перезапрос управляется deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, loading, reload };
}
