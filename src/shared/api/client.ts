import createClient, { type Middleware } from "openapi-fetch";
import {
  clearSession,
  getAccessToken,
  setRefreshHandler,
} from "@/shared/auth/session";
import type { paths } from "./schema";

export const api = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

// Эндпоинты входа не требуют access-токена, и их 401 не означает конец сессии.
const isAuthRequest = (url: string) =>
  new URL(url).pathname.startsWith("/auth/");

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    if (isAuthRequest(request.url)) return;
    const token = await getAccessToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  onResponse({ request, response }) {
    if (response.status === 401 && !isAuthRequest(request.url)) {
      clearSession();
    }
  },
};

api.use(authMiddleware);

setRefreshHandler(async (refreshToken) => {
  const { data, response } = await api.POST("/auth/refresh", {
    body: { refreshToken },
  });
  if (data) return data;
  if (response.status === 401 || response.status === 400) return null;
  throw new Error(`Не удалось обновить сессию: ${response.status}`);
});
