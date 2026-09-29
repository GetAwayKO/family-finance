import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthError } from "@/shared/auth/AuthProvider";
import AuthForm from "./AuthForm";

describe("AuthForm", () => {
  it("отправляет данные регистрации", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AuthForm mode="register" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/Имя/), "Анна");
    await userEvent.type(screen.getByLabelText(/Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Пароль/), "password-123");
    await userEvent.click(
      screen.getByRole("button", { name: "Зарегистрироваться" }),
    );

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Анна",
      email: "anna@example.com",
      password: "password-123",
    });
  });

  it("показывает ошибку входа", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new AuthError("Неверный email или пароль"));
    render(<AuthForm mode="login" onSubmit={onSubmit} />);

    expect(screen.queryByLabelText(/Имя/)).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Пароль/), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Неверный email или пароль",
    );
    expect(screen.getByRole("button", { name: "Войти" })).toBeEnabled();
  });
});
