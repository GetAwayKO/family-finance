"use client";
import { Box, CircularProgress } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthProvider";

export const PUBLIC_PATHS = ["/login", "/register"];

/** Куда вернуться после входа. Только внутренние пути, без `//evil.com`. */
export function safeNextPath(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/home";
}

/**
 * Закрытые страницы видит только вошедший пользователь, остальных отправляем
 * на /login. Вошедшего пользователя со страниц входа уводим внутрь.
 * Настоящая проверка доступа — на сервере, это только навигация.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (status === "anonymous" && !isPublic) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && isPublic) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(safeNextPath(next));
    }
  }, [status, isPublic, pathname, router]);

  const ready = isPublic ? status === "anonymous" : status === "authenticated";
  if (!ready) {
    return (
      <Box sx={{ gridColumn: "1 / -1", display: "grid", placeItems: "center" }}>
        <CircularProgress aria-label="Загрузка" />
      </Box>
    );
  }
  return children;
}
