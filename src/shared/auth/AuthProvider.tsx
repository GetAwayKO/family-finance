"use client";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/shared/api/client";
import type { components } from "@/shared/api/schema";
import {
  clearSession,
  getRefreshToken,
  hasSession,
  onSessionEnd,
  setSession,
} from "./session";

export type User = components["schemas"]["UserDto"];
type LoginInput = components["schemas"]["LoginDto"];
type RegisterInput = components["schemas"]["RegisterDto"];

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
  setUser(user: User): void;
}

/** Ошибка с текстом для пользователя. */
export class AuthError extends Error {}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUserState] = useState<User | null>(null);

  const setUser = useCallback((next: User) => {
    setUserState(next);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    const unsubscribe = onSessionEnd(() => {
      setUserState(null);
      setStatus("anonymous");
    });
    if (!hasSession()) {
      setStatus("anonymous");
      return unsubscribe;
    }
    api
      .GET("/users/me")
      .then(({ data }) => {
        if (data) setUser(data);
        else setStatus("anonymous");
      })
      // Сервер недоступен: сессию не трогаем, но и пустить внутрь не можем.
      .catch(() => setStatus("anonymous"));
    return unsubscribe;
  }, [setUser]);

  const login = useCallback(
    async (body: LoginInput) => {
      const { data, response } = await request(() =>
        api.POST("/auth/login", { body }),
      );
      if (!data) {
        throw new AuthError(
          response.status === 401
            ? "Неверный email или пароль"
            : "Не удалось войти, попробуйте ещё раз",
        );
      }
      setSession(data);
      setUser(data.user);
    },
    [setUser],
  );

  const register = useCallback(
    async (body: RegisterInput) => {
      const { data, response } = await request(() =>
        api.POST("/auth/register", { body }),
      );
      if (!data) {
        throw new AuthError(
          response.status === 409
            ? "Пользователь с таким email уже зарегистрирован"
            : "Не удалось зарегистрироваться, проверьте данные",
        );
      }
      setSession(data);
      setUser(data.user);
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    clearSession();
    setUserState(null);
    setStatus("anonymous");
    if (refreshToken) {
      // Если сервер недоступен, токен просто истечёт сам.
      await api
        .POST("/auth/logout", { body: { refreshToken } })
        .catch(() => undefined);
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout, setUser }),
    [status, user, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth вызван вне AuthProvider");
  return context;
}

async function request<T>(send: () => Promise<T>): Promise<T> {
  try {
    return await send();
  } catch {
    throw new AuthError("Сервер недоступен, попробуйте позже");
  }
}
