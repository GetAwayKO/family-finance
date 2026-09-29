import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NAV_ITEMS } from "../navigation";
import Sidebar from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/transactions/123",
}));

describe("Sidebar", () => {
  it("показывает все разделы", () => {
    render(<Sidebar />);
    expect(screen.getAllByRole("link")).toHaveLength(NAV_ITEMS.length);
  });

  it("помечает текущий раздел как активный", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: "Операции" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Главная" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("сообщает о переходе, чтобы закрыть мобильное меню", async () => {
    const onNavigate = vi.fn();
    render(<Sidebar onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole("link", { name: "Цели" }));
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
