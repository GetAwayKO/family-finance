import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "./Header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/transactions",
}));

describe("Header", () => {
  it("показывает заголовок", () => {
    render(<Header title="CA$H FLOW" />);
    expect(
      screen.getByRole("heading", { name: "CA$H FLOW" }),
    ).toBeInTheDocument();
  });

  it("помечает текущий раздел как активный", () => {
    render(<Header title="CA$H FLOW" />);
    expect(screen.getByRole("link", { name: "Операции" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Главная" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("скрывает разделы, если пользователь не вошёл", () => {
    render(<Header title="CA$H FLOW" showNav={false} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
