import { beforeEach, describe, expect, it, vi } from "vitest";

type Session = typeof import("./session");

const tokens = (n: number) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  expiresIn: 900,
});

describe("session", () => {
  let session: Session;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    session = await import("./session");
  });

  it("без сессии не отдаёт токен", async () => {
    session.setRefreshHandler(vi.fn());
    await expect(session.getAccessToken()).resolves.toBeNull();
  });

  it("хранит refresh-токен в localStorage, а access — в памяти", async () => {
    session.setSession(tokens(1));
    expect(localStorage.getItem(session.REFRESH_TOKEN_KEY)).toBe("refresh-1");
    await expect(session.getAccessToken()).resolves.toBe("access-1");
  });

  it("после перезагрузки обновляет access-токен одним запросом", async () => {
    localStorage.setItem(session.REFRESH_TOKEN_KEY, "refresh-1");
    const refresh = vi.fn().mockResolvedValue(tokens(2));
    session.setRefreshHandler(refresh);

    const results = await Promise.all([
      session.getAccessToken(),
      session.getAccessToken(),
    ]);

    expect(results).toEqual(["access-2", "access-2"]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith("refresh-1");
    expect(localStorage.getItem(session.REFRESH_TOKEN_KEY)).toBe("refresh-2");
  });

  it("обновляет токен заранее, до истечения срока", async () => {
    session.setSession({ ...tokens(1), expiresIn: 10 });
    session.setRefreshHandler(vi.fn().mockResolvedValue(tokens(2)));
    await expect(session.getAccessToken()).resolves.toBe("access-2");
  });

  it("завершает сессию, если сервер отклонил refresh-токен", async () => {
    localStorage.setItem(session.REFRESH_TOKEN_KEY, "refresh-1");
    session.setRefreshHandler(vi.fn().mockResolvedValue(null));
    const ended = vi.fn();
    session.onSessionEnd(ended);

    await expect(session.getAccessToken()).resolves.toBeNull();
    expect(session.hasSession()).toBe(false);
    expect(ended).toHaveBeenCalledOnce();
  });

  it("не завершает сессию из-за сетевой ошибки", async () => {
    localStorage.setItem(session.REFRESH_TOKEN_KEY, "refresh-1");
    session.setRefreshHandler(vi.fn().mockRejectedValue(new TypeError()));

    await expect(session.getAccessToken()).rejects.toThrow();
    expect(session.hasSession()).toBe(true);
  });

  it("узнаёт о выходе в другой вкладке", () => {
    const ended = vi.fn();
    session.onSessionEnd(ended);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: session.REFRESH_TOKEN_KEY,
        newValue: null,
      }),
    );
    expect(ended).toHaveBeenCalledOnce();
  });
});
