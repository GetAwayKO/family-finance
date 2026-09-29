"use client";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/shared/auth/AuthProvider";

// После входа AuthGate сам уведёт на исходную страницу.
export default function LoginPage() {
  const { login } = useAuth();
  return (
    <AuthForm
      mode="login"
      onSubmit={({ email, password }) => login({ email, password })}
    />
  );
}
