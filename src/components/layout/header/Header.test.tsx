import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Header from "./Header";

describe("Header", () => {
  it("показывает логотип со ссылкой на главную", () => {
    render(<Header title="CA$H FLOW" />);
    expect(screen.getByRole("img", { name: "CA$H FLOW" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CA$H FLOW" })).toHaveAttribute(
      "href",
      "/home",
    );
  });

  it("открывает меню и ведёт в профиль", async () => {
    const onMenuClick = vi.fn();
    render(
      <Header title="CA$H FLOW" userName="Анна" onMenuClick={onMenuClick} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
    expect(onMenuClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: /Анна/ })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("скрывает меню и профиль, если пользователь не вошёл", () => {
    render(<Header title="CA$H FLOW" showNav={false} userName="Анна" />);
    expect(
      screen.queryByRole("button", { name: "Открыть меню" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Анна/ }),
    ).not.toBeInTheDocument();
  });
});
