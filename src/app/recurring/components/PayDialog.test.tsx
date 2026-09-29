import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Account, RecurringPayment } from "@/shared/finance/types";
import PayDialog from "./PayDialog";

const post = vi.fn();
vi.mock("@/shared/api/client", () => ({
  api: { POST: (...args: unknown[]) => post(...args) },
}));

const account: Account = {
  id: "card",
  name: "Карта",
  type: "card",
  currency: "RUB",
  ownerId: "me",
  visibility: "full",
  canTransact: true,
  canManage: true,
  initialBalance: "0",
  balance: "0",
  archived: false,
  createdAt: "2026-09-01T00:00:00Z",
};

const payment: RecurringPayment = {
  id: "rent",
  name: "Аренда",
  type: "expense",
  accountId: "card",
  amount: "5000000",
  categoryId: "housing",
  toAccountId: null,
  toAmount: null,
  comment: "",
  frequency: "monthly",
  interval: 1,
  nextDate: "2026-10-01",
  endDate: null,
  remindDaysBefore: 3,
  authorId: "me",
  authorName: "Анна",
  canEdit: true,
  canPay: true,
};

const ok = { data: {}, response: { ok: true } };
const offline = () => Promise.reject(new TypeError("Failed to fetch"));

describe("PayDialog", () => {
  beforeEach(() => post.mockReset());

  it("проводит повторение с обычной суммой и повторяет с тем же id операции", async () => {
    post.mockImplementationOnce(offline).mockResolvedValueOnce(ok);
    const onDone = vi.fn();
    render(
      <PayDialog
        payment={payment}
        accounts={[account]}
        onClose={vi.fn()}
        onDone={onDone}
      />,
    );

    expect(screen.getByLabelText(/Сумма/)).toHaveValue("50000,00");
    const pay = screen.getByRole("button", { name: "Провести" });
    await userEvent.click(pay);
    expect(
      await screen.findByText("Сервер недоступен, попробуйте позже"),
    ).toBeInTheDocument();
    await userEvent.click(pay);

    expect(post).toHaveBeenCalledTimes(2);
    const [path, { body }] = post.mock.calls[0];
    expect(path).toBe("/recurring-payments/{id}/pay");
    expect(body).toMatchObject({
      occurrence: "2026-10-01",
      date: "2026-10-01",
      amount: "5000000",
    });
    expect(post.mock.calls[1][1].body.transactionId).toBe(body.transactionId);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("новая сумма уходит в минимальных единицах", async () => {
    post.mockResolvedValueOnce(ok);
    render(
      <PayDialog
        payment={payment}
        accounts={[account]}
        onClose={vi.fn()}
        onDone={vi.fn()}
      />,
    );
    const amount = screen.getByLabelText(/Сумма/);
    await userEvent.clear(amount);
    await userEvent.type(amount, "51 234,5");
    await userEvent.click(screen.getByRole("button", { name: "Провести" }));
    expect(post.mock.calls[0][1].body.amount).toBe("5123450");
  });
});
