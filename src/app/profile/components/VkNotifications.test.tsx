import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VkNotifications from "./VkNotifications";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock("@/shared/api/client", () => ({
  api: {
    GET: (...args: unknown[]) => get(...args),
    POST: (...args: unknown[]) => post(...args),
    PATCH: (...args: unknown[]) => patch(...args),
  },
}));

const settings = {
  recurring: true,
  budget: true,
  familyTransactions: true,
  invites: true,
  goals: true,
};

const status = (vk: object, extra: object = {}) => ({
  data: {
    vk: {
      available: true,
      linked: false,
      name: null,
      messagesAllowed: false,
      allowMessagesUrl: "https://vk.me/club1",
      ...vk,
    },
    settings: { ...settings, ...extra },
  },
  response: { ok: true },
});

describe("VkNotifications", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it("без привязки предлагает подключить и уводит на VK ID", async () => {
    get.mockResolvedValue(status({}));
    post.mockResolvedValue({
      data: { url: "https://id.vk.com/authorize?x=1" },
      response: { ok: true },
    });
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    render(<VkNotifications />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Подключить ВКонтакте" }),
    );
    expect(post).toHaveBeenCalledWith("/notifications/vk/link");
    expect(assign).toHaveBeenCalledWith("https://id.vk.com/authorize?x=1");
    vi.unstubAllGlobals();
  });

  it("без настройки на сервере кнопки нет", async () => {
    get.mockResolvedValue(status({ available: false }));
    render(<VkNotifications />);
    expect(await screen.findByText(/не настроены на сервере/)).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("привязан, но сообщения запрещены: ссылка на диалог; переключатели сохраняются", async () => {
    get
      .mockResolvedValueOnce(status({ linked: true, name: "Анна Иванова" }))
      .mockResolvedValue(
        status({ linked: true, name: "Анна Иванова" }, { budget: false }),
      );
    patch.mockResolvedValue({ data: {}, response: { ok: true } });
    render(<VkNotifications />);

    expect(await screen.findByText("Анна Иванова")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "диалог с сообществом" }),
    ).toHaveAttribute("href", "https://vk.me/club1");

    const budget = screen.getByRole("switch", { name: /Бюджет/ });
    expect(budget).toBeChecked();
    await userEvent.click(budget);
    expect(patch).toHaveBeenCalledWith("/notifications/settings", {
      body: { budget: false },
    });
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: /Бюджет/ })).not.toBeChecked(),
    );
  });
});
