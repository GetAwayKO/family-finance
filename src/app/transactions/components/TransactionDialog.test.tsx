import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Account, Category } from "@/shared/finance/types";
import TransactionDialog from "./TransactionDialog";

const post = vi.fn();
vi.mock("@/shared/api/client", () => ({
  api: {
    POST: (...args: unknown[]) => post(...args),
    GET: vi.fn().mockResolvedValue({ data: { amount: null } }),
  },
}));

const account = (
  id: string,
  currency = "RUB",
  extra: Partial<Account> = {},
): Account => ({
  id,
  name: id,
  type: "card",
  currency,
  ownerId: "me",
  visibility: "full",
  canTransact: true,
  canManage: true,
  ...extra,
  initialBalance: "0",
  balance: "0",
  archived: false,
  createdAt: "2026-09-01T00:00:00Z",
});

const categories: Category[] = [
  {
    id: "food",
    name: "Продукты",
    kind: "expense",
    parentId: null,
    archived: false,
  },
  {
    id: "salary",
    name: "Зарплата",
    kind: "income",
    parentId: null,
    archived: false,
  },
];

const ok = { data: {}, response: { ok: true } };
const offline = () => Promise.reject(new TypeError("Failed to fetch"));

describe("TransactionDialog", () => {
  beforeEach(() => post.mockReset());

  async function fillExpense() {
    await userEvent.type(screen.getByLabelText(/Сумма/), "1 250,5");
    await userEvent.click(screen.getByRole("combobox", { name: /Категория/ }));
    const listbox = await screen.findByRole("listbox");
    // Категории доходов в расходе не предлагаются.
    expect(within(listbox).queryByText("Зарплата")).not.toBeInTheDocument();
    await userEvent.click(within(listbox).getByText("Продукты"));
  }

  it("отправляет расход в минимальных единицах и повторяет с тем же id", async () => {
    post.mockImplementationOnce(offline).mockResolvedValueOnce(ok);
    const onSaved = vi.fn();
    render(
      <TransactionDialog
        accounts={[account("Карта")]}
        categories={categories}
        onClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await fillExpense();
    const save = screen.getByRole("button", { name: "Сохранить" });
    await userEvent.click(save);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Сервер недоступен",
    );
    await userEvent.click(save);

    expect(onSaved).toHaveBeenCalled();
    const [first, second] = post.mock.calls.map((call) => call[1].body);
    expect(second).toMatchObject({
      type: "expense",
      accountId: "Карта",
      categoryId: "food",
      amount: "125050",
    });
    expect(second.id).toBe(first.id);
  });

  it("не предлагает чужие личные счета", async () => {
    render(
      <TransactionDialog
        accounts={[
          account("Моя карта"),
          account("Карта Бориса", "RUB", {
            ownerId: "boris",
            canTransact: false,
            canManage: false,
          }),
          account("Общая", "RUB", { ownerId: null, canManage: false }),
        ]}
        categories={categories}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("combobox", { name: /Счёт/ }));
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText(/Моя карта/)).toBeInTheDocument();
    expect(within(listbox).getByText(/Общая/)).toBeInTheDocument();
    expect(within(listbox).queryByText(/Карта Бориса/)).not.toBeInTheDocument();
  });

  it("для перевода между валютами требует сумму зачисления", async () => {
    render(
      <TransactionDialog
        accounts={[account("Рубли"), account("Доллары", "USD")]}
        categories={categories}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Перевод" }));
    await userEvent.type(screen.getByLabelText(/Сумма/), "9200");
    expect(screen.getByLabelText(/Зачислено, USD/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/Зачислено, USD/), "100");
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeEnabled();
  });
});
